import type { Prisma } from "@bondery/db";
import { cleanPersonName } from "@bondery/helpers/name";
import type { ScrapedEducationEntry, ScrapedWorkHistoryEntry } from "@bondery/schemas";
import { loadEnrichedContact } from "../../lib/contacts/enrichment.js";
import { findPersonIdBySocial, upsertContactSocials } from "../../lib/contacts/socials.js";
import { resolveExtensionDefaultGroup, resolvePrimarySocial } from "../../lib/extension/helpers.js";
import { assignContactsToDefaultImportGroup } from "../../lib/import/default-groups.js";
import {
  toPostgresDate,
  updateContactPhoto,
  uploadAllLinkedInLogos,
} from "../../lib/import/linkedin-helpers.js";
import { cachedGeocodeLinkedInLocation } from "../../lib/integrations/mapy.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import { type DomainContext, DomainError } from "../_shared/context.js";
import { domainDb } from "../_shared/domain-db.js";

export type ExtensionUpsertInput = {
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  profileImageUrl?: string;
  headline?: string;
  location?: string;
  notes?: string;
  workHistory?: ScrapedWorkHistoryEntry[];
  educationHistory?: ScrapedEducationEntry[];
  linkedinBio?: string;
};

function parseOptionalDate(value: string | null | undefined): Date | null {
  const normalized = toPostgresDate(value);
  return normalized ? new Date(normalized) : null;
}

async function applyGisPointUpdate(
  db: ReturnType<typeof domainDb>,
  userId: string,
  personId: string,
  gisPointEwkt: string,
): Promise<void> {
  await db.$executeRaw`
    UPDATE people
    SET gis_point = ST_GeogFromText(${gisPointEwkt}),
        updated_at = NOW()
    WHERE id = ${personId}::uuid AND user_id = ${userId}::uuid
  `;
}

async function upsertLinkedInHistory(
  db: ReturnType<typeof domainDb>,
  userId: string,
  personId: string,
  linkedinBio: string | undefined,
  workHistory: ScrapedWorkHistoryEntry[] | undefined,
  educationHistory: ScrapedEducationEntry[] | undefined,
  log: DomainContext["log"],
): Promise<void> {
  if (
    !(workHistory && workHistory.length > 0) &&
    !(educationHistory && educationHistory.length > 0) &&
    !linkedinBio
  ) {
    return;
  }

  const linkedinRow = await db.peopleLinkedin.upsert({
    create: {
      bio: linkedinBio ?? null,
      personId,
      userId,
    },
    update: {
      ...(linkedinBio ? { bio: linkedinBio } : {}),
      updatedAt: new Date(),
    },
    where: { personId },
  });

  if (workHistory && workHistory.length > 0) {
    await db.peopleWorkHistory.deleteMany({
      where: { peopleLinkedinId: linkedinRow.id, userId },
    });

    try {
      await db.peopleWorkHistory.createMany({
        data: workHistory.map((entry) => ({
          companyLinkedinId: entry.companyLinkedinId ?? null,
          companyName: entry.companyName,
          description: entry.description ?? null,
          employmentType: entry.employmentType ?? null,
          endDate: parseOptionalDate(entry.endDate),
          location: entry.location ?? null,
          peopleLinkedinId: linkedinRow.id,
          startDate: parseOptionalDate(entry.startDate),
          title: entry.title ?? null,
          userId,
        })),
      });
    } catch (whError) {
      log?.error({ err: whError }, "[extension] Failed to insert work history");
    }
  }

  if (educationHistory && educationHistory.length > 0) {
    await db.peopleEducationHistory.deleteMany({
      where: { peopleLinkedinId: linkedinRow.id, userId },
    });

    try {
      await db.peopleEducationHistory.createMany({
        data: educationHistory.map((entry) => ({
          degree: entry.degree ?? null,
          description: entry.description ?? null,
          endDate: parseOptionalDate(entry.endDate),
          peopleLinkedinId: linkedinRow.id,
          schoolLinkedinId: entry.schoolLinkedinId ?? null,
          schoolName: entry.schoolName,
          startDate: parseOptionalDate(entry.startDate),
          userId,
        })),
      });
    } catch (ehError) {
      log?.error({ err: ehError }, "[extension] Failed to insert education");
    }
  }
}

export async function upsertContactFromExtension(ctx: DomainContext, input: ExtensionUpsertInput) {
  const { user, log } = ctx;
  const db = domainDb(ctx);
  const {
    instagram,
    linkedin,
    facebook,
    firstName,
    middleName,
    lastName,
    profileImageUrl,
    headline,
    location,
    notes,
    workHistory,
    educationHistory,
    linkedinBio,
  } = input;

  log?.info(
    {
      handle: linkedin ?? instagram ?? facebook,
      workHistoryCount: workHistory?.length ?? 0,
    },
    "[extension] POST received",
  );

  if (!instagram && !linkedin && !facebook) {
    throw new DomainError(
      "Instagram, LinkedIn, or Facebook username is required",
      400,
      "extension_username_required",
    );
  }

  const primarySocial = resolvePrimarySocial({ facebook, instagram, linkedin });
  if (!primarySocial) {
    throw new DomainError(
      "Instagram, LinkedIn, or Facebook username is required",
      400,
      "extension_username_required",
    );
  }

  let existingContactId: string | null = null;
  try {
    existingContactId = await findPersonIdBySocial(
      db,
      user.id,
      primarySocial.platform,
      primarySocial.handle,
    );
  } catch {
    throw internal("contact_failed_to_look_up_contact");
  }

  const logoMap = await uploadAllLinkedInLogos(user.id, workHistory, educationHistory);
  void logoMap;

  if (existingContactId) {
    const existingContact = await db.people.findFirst({
      select: {
        hasAvatar: true,
        headline: true,
        id: true,
        latitude: true,
        location: true,
        notes: true,
        updatedAt: true,
      },
      where: { id: existingContactId, userId: user.id },
    });

    if (!existingContact) {
      throw internal("contact_failed_to_look_up_contact");
    }

    if (profileImageUrl && !existingContact.hasAvatar) {
      await updateContactPhoto(existingContact.id, user.id, profileImageUrl);
    }

    const fieldUpdates: Prisma.PeopleUpdateInput = {};
    let gisPointEwkt: string | null = null;

    if (headline && !existingContact.headline) {
      fieldUpdates.headline = headline;
    }
    if (location && !existingContact.location) {
      fieldUpdates.location = location;
    }
    if (notes && !existingContact.notes) {
      fieldUpdates.notes = notes;
    }

    if (location && !existingContact.location && !existingContact.latitude) {
      try {
        const result = await cachedGeocodeLinkedInLocation(location);
        if (result) {
          const { geo, timezone: tz } = result;
          if (geo.formattedLabel) {
            fieldUpdates.location = geo.formattedLabel;
          }
          gisPointEwkt = geo.locationEwkt;
          if (tz) {
            fieldUpdates.timezone = tz;
          }
        }
      } catch (err) {
        log?.error(
          { err },
          "[extension] Geocode failed for existing contact, continuing without coordinates",
        );
      }
    }

    if (Object.keys(fieldUpdates).length > 0 || gisPointEwkt) {
      fieldUpdates.updatedAt = new Date();
      await db.people.updateMany({
        data: fieldUpdates,
        where: { id: existingContact.id, userId: user.id },
      });

      if (gisPointEwkt) {
        await applyGisPointUpdate(db, user.id, existingContact.id, gisPointEwkt);
      }
    }

    await upsertLinkedInHistory(
      db,
      user.id,
      existingContact.id,
      linkedinBio,
      workHistory,
      educationHistory,
      log,
    );

    const contact = await loadEnrichedContact(db, user.id, existingContact.id, undefined, log);
    if (!contact) {
      throw internal("contact_contact_was_updated_but_could_not_be_loa");
    }

    return { contact, existed: true };
  }

  const createData: Prisma.PeopleUncheckedCreateInput = {
    firstName: cleanPersonName(firstName) || primarySocial.handle || "Unknown",
    userId: user.id,
  };

  const cleanedMiddleName = cleanPersonName(middleName);
  const cleanedLastName = cleanPersonName(lastName);
  if (cleanedMiddleName) {
    createData.middleName = cleanedMiddleName;
  }
  if (cleanedLastName) {
    createData.lastName = cleanedLastName;
  }
  if (headline) {
    createData.headline = headline;
  }
  if (location) {
    createData.location = location;
  }
  if (notes) {
    createData.notes = notes;
  }

  let createGisPointEwkt: string | null = null;
  if (location) {
    try {
      const result = await cachedGeocodeLinkedInLocation(location);
      if (result) {
        const { geo, timezone: tz } = result;
        if (geo.formattedLabel) {
          createData.location = geo.formattedLabel;
        }
        createGisPointEwkt = geo.locationEwkt;
        if (tz) {
          createData.timezone = tz;
        }
      }
    } catch (err) {
      log?.error(
        { err },
        "[extension] Geocode failed for new contact, continuing without coordinates",
      );
    }
  }

  const newContact = await db.people.create({
    data: createData,
    select: { id: true },
  });

  if (createGisPointEwkt) {
    await applyGisPointUpdate(db, user.id, newContact.id, createGisPointEwkt);
  }

  try {
    await upsertContactSocials(
      db,
      user.id,
      newContact.id,
      primarySocial.platform,
      primarySocial.handle,
    );
  } catch {
    throw internal("contact_failed_to_save_socials");
  }

  const extensionGroup = resolveExtensionDefaultGroup(primarySocial.platform);
  if (extensionGroup) {
    try {
      await assignContactsToDefaultImportGroup(ctx, extensionGroup, [newContact.id]);
    } catch {
      throw internal("contact_failed_to_assign_default_group");
    }
  }

  if (profileImageUrl) {
    await updateContactPhoto(newContact.id, user.id, profileImageUrl);
  }

  if (workHistory && workHistory.length > 0) {
    log?.info(
      { count: workHistory.length, personId: newContact.id },
      "[extension] Inserting work history for new contact",
    );
  }

  await upsertLinkedInHistory(
    db,
    user.id,
    newContact.id,
    linkedinBio,
    workHistory,
    educationHistory,
    log,
  );

  const contact = await loadEnrichedContact(db, user.id, newContact.id, undefined, log);
  if (!contact) {
    throw internal("contact_contact_was_created_but_could_not_be_loa");
  }

  return { contact, existed: false };
}
