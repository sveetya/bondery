import type { Prisma } from "@bondery/db";
import { cleanPersonName } from "@bondery/helpers/name";
import type { EnrichContactRequest } from "@bondery/schemas";
import {
  replaceEducationHistoryWithDb,
  replaceWorkHistoryWithDb,
} from "../../../lib/data/contact-rpc.js";
import {
  toPostgresDate,
  updateContactPhoto,
  uploadAllLinkedInLogos,
} from "../../../lib/import/linkedin-helpers.js";
import { cachedGeocodeLinkedInLocation } from "../../../lib/integrations/mapy.js";
import { type DomainContext, DomainError } from "../../_shared/context.js";
import { domainDb } from "../../_shared/domain-db.js";

export async function enrichContact(
  ctx: DomainContext,
  personId: string,
  input: EnrichContactRequest,
): Promise<{ success: true }> {
  const { user, log } = ctx;
  const db = domainDb(ctx);
  const {
    firstName,
    middleName,
    lastName,
    profileImageUrl,
    headline,
    location,
    linkedinBio,
    workHistory,
    educationHistory,
  } = input;

  log?.info(
    {
      educationCount: educationHistory?.length ?? 0,
      personId,
      userId: user.id,
      workHistoryCount: workHistory?.length ?? 0,
    },
    "[enrich] POST received",
  );

  const person = await db.people.findFirst({
    select: { headline: true, id: true, location: true },
    where: { id: personId, userId: user.id },
  });

  if (!person) {
    throw new DomainError("Contact not found", 404, "contact_not_found");
  }

  await uploadAllLinkedInLogos(user.id, workHistory, educationHistory);

  if (profileImageUrl) {
    await updateContactPhoto(personId, user.id, profileImageUrl);
  }

  const fieldUpdates: Prisma.PeopleUpdateManyMutationInput = {};
  let gisPointEwkt: string | null | undefined;

  if (profileImageUrl) {
    fieldUpdates.updatedAt = new Date();
  }
  if (firstName !== undefined) {
    fieldUpdates.firstName = cleanPersonName(firstName) || undefined;
  }
  if (middleName !== undefined) {
    fieldUpdates.middleName = cleanPersonName(middleName) || null;
  }
  if (lastName !== undefined) {
    fieldUpdates.lastName = cleanPersonName(lastName) || null;
  }

  if (headline && !person.headline) {
    fieldUpdates.headline = headline;
  }

  if (location) {
    fieldUpdates.location = location;
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
      log?.error({ err }, "[enrich] Geocode failed, continuing without coordinates");
    }
  }

  if (Object.keys(fieldUpdates).length > 0 || gisPointEwkt !== undefined) {
    fieldUpdates.updatedAt = new Date();
    await db.people.updateMany({
      data: fieldUpdates,
      where: { id: personId, userId: user.id },
    });

    if (gisPointEwkt) {
      await db.$executeRaw`
        UPDATE people
        SET gis_point = ST_GeogFromText(${gisPointEwkt}),
            updated_at = NOW()
        WHERE id = ${personId}::uuid AND user_id = ${user.id}::uuid
      `;
    }
  }

  const linkedinRow = await db.peopleLinkedin.upsert({
    create: {
      bio: linkedinBio ?? null,
      personId,
      userId: user.id,
    },
    update: {
      bio: linkedinBio ?? null,
      updatedAt: new Date(),
    },
    where: {
      personId,
    },
  });

  const peopleLinkedinId = linkedinRow.id;

  if (workHistory && workHistory.length > 0) {
    const rows = workHistory.map((entry) => ({
      company_linkedin_id: entry.companyLinkedinId ?? null,
      company_name: entry.companyName,
      description: entry.description ?? null,
      employment_type: entry.employmentType ?? null,
      end_date: toPostgresDate(entry.endDate),
      location: entry.location ?? null,
      start_date: toPostgresDate(entry.startDate),
      title: entry.title ?? null,
    }));
    try {
      await replaceWorkHistoryWithDb(db, user.id, peopleLinkedinId, rows);
    } catch (whError) {
      log?.error({ whError }, "[enrich] Failed to replace work history");
    }
  }

  if (educationHistory && educationHistory.length > 0) {
    const rows = educationHistory.map((entry) => ({
      degree: entry.degree ?? null,
      description: entry.description ?? null,
      end_date: toPostgresDate(entry.endDate),
      school_linkedin_id: entry.schoolLinkedinId ?? null,
      school_name: entry.schoolName,
      start_date: toPostgresDate(entry.startDate),
    }));
    try {
      await replaceEducationHistoryWithDb(db, user.id, peopleLinkedinId, rows);
    } catch (ehError) {
      log?.error({ ehError }, "[enrich] Failed to replace education history");
    }
  }

  log?.info({ personId }, "[enrich] Enrichment complete");
  return { success: true };
}
