import { tool } from "ai";
import { z } from "zod";
import type { DomainContext } from "../../../domains/_shared/context.js";
import { getContactSharingPreview, shareContact } from "../../contacts/share.js";
import { formatToolDomainError } from "../domain-context.js";

export function createSharingTools(ctx: DomainContext) {
  return {
    prepare_contact_for_sharing: tool({
      description:
        "Fetches a contact's available shareable fields with preview values. Always call this before share_contact — use the results to show the user what data can be included and ask which fields and recipients they want.",
      execute: async ({ personId }) => {
        try {
          return await getContactSharingPreview(ctx, personId);
        } catch (error) {
          return formatToolDomainError(error, "Failed to load contact sharing preview");
        }
      },
      inputSchema: z.object({
        personId: z.string().describe("The UUID of the contact to preview"),
      }),
    }),

    share_contact: tool({
      description:
        "Sends a contact card via email to one or more recipients. Only call this after the user has confirmed the recipient emails, selected fields, and whether they want a copy.",
      execute: async ({ personId, recipientEmails, message, selectedFields }) => {
        try {
          return await shareContact(ctx, {
            message,
            personId,
            recipientEmails,
            selectedFields,
          });
        } catch (error) {
          return formatToolDomainError(error, "Failed to share contact");
        }
      },
      inputSchema: z.object({
        message: z
          .string()
          .max(2000)
          .optional()
          .describe("Optional personal message to include in the email"),
        personId: z.string().describe("The UUID of the contact to share"),
        recipientEmails: z
          .array(z.string().email())
          .min(1)
          .max(10)
          .describe("Email addresses to send the contact to"),
        selectedFields: z
          .array(
            z.enum([
              "name",
              "avatar",
              "headline",
              "phones",
              "emails",
              "location",
              "linkedin",
              "instagram",
              "facebook",
              "website",
              "whatsapp",
              "signal",
              "addresses",
              "notes",
              "importantDates",
            ]),
          )
          .min(1)
          .describe("Which contact fields to include in the shared email"),
      }),
    }),
  };
}
