import type { Prisma } from "@bondery/db";
import type {
  Contact,
  ContactAddressEntry,
  EmailEntry,
  PhoneEntry,
  UpdateContactInput,
} from "@bondery/schemas";
import type { SyncChange } from "@bondery/schemas/sync";
import { parseAddressEntries, replaceContactAddresses } from "../../lib/contacts/addresses.js";
import {
  parseEmailEntries,
  parsePhoneEntries,
  replaceContactEmails,
  replaceContactPhones,
} from "../../lib/contacts/channels.js";
import { loadEnrichedContact } from "../../lib/contacts/enrichment.js";
import { upsertContactSocials } from "../../lib/contacts/socials.js";
import { setPersonLocationWithDb } from "../../lib/data/contact-rpc.js";
import { cachedGeocodeLinkedInLocation } from "../../lib/integrations/mapy.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import {
  buildChildTableReplaceChanges,
  buildPeopleRowChange,
  listContactChildIds,
} from "../../lib/sync/build-changes.js";
import { checkContactUpdateConflict } from "../../lib/sync/conflict.js";
import { emitSyncBatch } from "../../lib/sync/emit-change.js";
import { type DomainContext, DomainError, syncEmitMetaFromContext } from "../_shared/context.js";
import { domainDb } from "../_shared/domain-db.js";
import { toSyncRow } from "../_shared/prisma-helpers.js";
import { withPersonTxid } from "../_shared/with-txid.js";
import {
  patchAffectsMergeRecommendations,
  scheduleMergeRecommendationsRefresh,
} from "./merge-recommendations.js";

export interface UpdateContactDomainInput {
  baseUpdatedAt?: string;
  patch: UpdateContactInput;
  personId: string;
}

export async function updateContact(
  ctx: DomainContext,
  input: UpdateContactDomainInput,
): Promise<{ data: { contact: Contact; personId: string }; txid: string; serverSequence: number }> {
  const { user, log } = ctx;
  const db = domainDb(ctx);
  const { personId, patch: body, baseUpdatedAt } = input;

  if (baseUpdatedAt) {
    await checkContactUpdateConflict(db, user.id, personId, baseUpdatedAt);
  }

  let priorPhoneIds: string[] | null = null;
  let priorEmailIds: string[] | null = null;
  let priorAddressIds: string[] | null = null;

  const updates: Prisma.PeopleUncheckedUpdateManyInput = {};
  let gisPointEwkt: string | null | undefined;

  if (body.firstName !== undefined) {
    updates.firstName = body.firstName;
  }
  if (body.middleName !== undefined) {
    updates.middleName = body.middleName;
  }
  if (body.lastName !== undefined) {
    updates.lastName = body.lastName;
  }
  if (body.headline !== undefined) {
    updates.headline = body.headline;
  }
  if (body.location !== undefined) {
    updates.location = body.location;
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }
  if (body.language !== undefined) {
    updates.language = body.language;
  }
  if (body.timezone !== undefined) {
    updates.timezone = body.timezone;
  }
  if (body.gisPoint !== undefined) {
    gisPointEwkt = typeof body.gisPoint === "string" ? body.gisPoint : null;
  }

  const clientProvidesCoords =
    Object.hasOwn(body, "latitude") ||
    Object.hasOwn(body, "longitude") ||
    Object.hasOwn(body, "gisPoint");

  let geocodedLocation: { lat: number; lon: number } | null = null;

  if (body.location && !clientProvidesCoords) {
    try {
      const geocoded = await cachedGeocodeLinkedInLocation(body.location);
      if (geocoded) {
        const { geo, timezone: tz } = geocoded;
        if (geo.formattedLabel) {
          updates.location = geo.formattedLabel;
        }
        geocodedLocation = { lat: geo.lat, lon: geo.lon };
        if (tz && body.timezone === undefined) {
          updates.timezone = tz;
        }
      }
    } catch (err) {
      log?.warn({ err }, "[updateContact] Geocode failed, continuing without coordinates");
    }
  }

  if (body.lastInteraction !== undefined) {
    updates.lastInteraction = body.lastInteraction ? new Date(body.lastInteraction) : null;
    updates.lastInteractionActivityId = null;
  }
  if (body.keepFrequencyDays !== undefined) {
    updates.keepFrequencyDays = body.keepFrequencyDays;
  }

  const hasLatitudeField = Object.hasOwn(body, "latitude");
  const hasLongitudeField = Object.hasOwn(body, "longitude");

  let nextLatitude: number | null | undefined;
  let nextLongitude: number | null | undefined;

  if (hasLatitudeField || hasLongitudeField) {
    nextLatitude = (body.latitude as number | null | undefined) ?? null;
    nextLongitude = (body.longitude as number | null | undefined) ?? null;

    if ((nextLatitude === null) !== (nextLongitude === null)) {
      throw new DomainError(
        "Both latitude and longitude must be provided together",
        400,
        "contact_location_incomplete",
      );
    }

    if (
      nextLatitude !== null &&
      nextLongitude !== null &&
      (!Number.isFinite(nextLatitude) || !Number.isFinite(nextLongitude))
    ) {
      throw new DomainError("Invalid latitude/longitude values", 400, "contact_location_invalid");
    }
  }

  let nextPhones: PhoneEntry[] | undefined;
  if (body.phones !== undefined) {
    priorPhoneIds = await listContactChildIds(user.id, personId, "people_phones", db);
    try {
      nextPhones = parsePhoneEntries(body.phones);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "Invalid phones payload";
      throw new DomainError(message, 400, "contact_invalid");
    }
  }

  let nextEmails: EmailEntry[] | undefined;
  if (body.emails !== undefined) {
    priorEmailIds = await listContactChildIds(user.id, personId, "people_emails", db);
    try {
      nextEmails = parseEmailEntries(body.emails);
    } catch (parseError) {
      const message = parseError instanceof Error ? parseError.message : "Invalid emails payload";
      throw new DomainError(message, 400, "contact_invalid");
    }
  }

  let nextAddresses: ContactAddressEntry[] | undefined;
  if (body.addresses !== undefined) {
    priorAddressIds = await listContactChildIds(user.id, personId, "people_addresses", db);
    try {
      nextAddresses = parseAddressEntries(body.addresses);
    } catch (parseError) {
      const message =
        parseError instanceof Error ? parseError.message : "Invalid addresses payload";
      throw new DomainError(message, 400, "contact_invalid");
    }
  }

  const socialsUpdates: Array<{
    platform: Parameters<typeof upsertContactSocials>[3];
    handle: string | null | undefined;
  }> = [];

  if (body.linkedin !== undefined) {
    socialsUpdates.push({ handle: body.linkedin, platform: "linkedin" });
  }
  if (body.instagram !== undefined) {
    socialsUpdates.push({ handle: body.instagram, platform: "instagram" });
  }
  if (body.whatsapp !== undefined) {
    socialsUpdates.push({ handle: body.whatsapp, platform: "whatsapp" });
  }
  if (body.facebook !== undefined) {
    socialsUpdates.push({ handle: body.facebook, platform: "facebook" });
  }
  if (body.website !== undefined) {
    socialsUpdates.push({ handle: body.website, platform: "website" });
  }
  if (body.signal !== undefined) {
    socialsUpdates.push({ handle: body.signal, platform: "signal" });
  }

  updates.updatedAt = new Date();

  const updated = await db.people.updateMany({
    data: updates,
    where: { id: personId, userId: user.id },
  });

  if (updated.count === 0) {
    throw new DomainError("Contact not found", 404, "contact_not_found");
  }

  const updatedContact = await db.people.findFirst({
    select: { id: true, myself: true },
    where: { id: personId, userId: user.id },
  });

  if (!updatedContact) {
    throw new DomainError("Contact not found", 404, "contact_not_found");
  }

  try {
    if (gisPointEwkt !== undefined) {
      if (gisPointEwkt) {
        await db.$executeRaw`
          UPDATE people
          SET gis_point = ST_GeogFromText(${gisPointEwkt}),
              updated_at = NOW()
          WHERE id = ${personId}::uuid AND user_id = ${user.id}::uuid
        `;
      } else {
        await db.$executeRaw`
          UPDATE people
          SET gis_point = NULL,
              updated_at = NOW()
          WHERE id = ${personId}::uuid AND user_id = ${user.id}::uuid
        `;
      }
    }

    if (hasLatitudeField || hasLongitudeField) {
      await setPersonLocationWithDb(
        db,
        user.id,
        personId,
        nextLatitude ?? null,
        nextLongitude ?? null,
      );
    } else if (geocodedLocation) {
      try {
        await setPersonLocationWithDb(
          db,
          user.id,
          personId,
          geocodedLocation.lat,
          geocodedLocation.lon,
        );
      } catch (geoError) {
        log?.warn({ err: geoError }, "[updateContact] Failed to set geocoded coordinates");
      }
    }

    const parallelOps: Promise<void>[] = [];

    if (nextPhones !== undefined) {
      parallelOps.push(replaceContactPhones(db, user.id, personId, nextPhones));
    }
    if (nextEmails !== undefined) {
      parallelOps.push(replaceContactEmails(db, user.id, personId, nextEmails));
    }
    if (nextAddresses !== undefined) {
      parallelOps.push(replaceContactAddresses(db, user.id, personId, nextAddresses));
    }
    if (socialsUpdates.length > 0) {
      parallelOps.push(
        Promise.all(
          socialsUpdates.map((entry) =>
            upsertContactSocials(db, user.id, personId, entry.platform, entry.handle),
          ),
        ).then(() => undefined),
      );
    }

    if (parallelOps.length > 0) {
      await Promise.all(parallelOps);
    }
  } catch (channelError) {
    const message = channelError instanceof Error ? channelError.message : "Unknown channel error";
    throw internal("contact_failed", message);
  }

  const enrichedContact = await loadEnrichedContact(db, user.id, personId, undefined, log);

  if (!enrichedContact) {
    throw new DomainError("Contact not found", 404, "contact_not_found");
  }

  const { txid } = await withPersonTxid(user.id, async () => ({ personId }));

  const changes: SyncChange[] = [];
  const peopleChange = await buildPeopleRowChange(user.id, personId, db);
  if (peopleChange) {
    changes.push(peopleChange);
  }

  if (priorPhoneIds) {
    changes.push(
      ...(await buildChildTableReplaceChanges(
        user.id,
        personId,
        "people_phones",
        priorPhoneIds,
        db,
      )),
    );
  }

  if (priorEmailIds) {
    changes.push(
      ...(await buildChildTableReplaceChanges(
        user.id,
        personId,
        "people_emails",
        priorEmailIds,
        db,
      )),
    );
  }

  if (priorAddressIds) {
    changes.push(
      ...(await buildChildTableReplaceChanges(
        user.id,
        personId,
        "people_addresses",
        priorAddressIds,
        db,
      )),
    );
  }

  if (socialsUpdates.length > 0) {
    const socialRows = await db.peopleSocial.findMany({
      where: { personId, userId: user.id },
    });

    for (const row of socialRows) {
      changes.push({
        entityId: row.id,
        operation: "update",
        table: "people_socials",
        value: toSyncRow(row as unknown as Record<string, unknown>),
      });
    }
  }

  const serverSequence = await emitSyncBatch(user.id, changes, syncEmitMetaFromContext(ctx));

  if (patchAffectsMergeRecommendations(body)) {
    scheduleMergeRecommendationsRefresh(ctx);
  }

  return {
    data: { contact: enrichedContact, personId },
    serverSequence: serverSequence ?? 0,
    txid,
  };
}
