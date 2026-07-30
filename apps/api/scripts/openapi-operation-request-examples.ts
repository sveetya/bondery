/**
 * Request-body examples keyed by OpenAPI operation (`METHOD /path`).
 * Used when fastify-zod-openapi omits body examples (unlike jsonResponse() for responses).
 */
import { OPENAPI_SCHEMA_EXAMPLES } from "@bondery/schemas/openapi/example-fixtures";

export const OPENAPI_OPERATION_REQUEST_EXAMPLES: Record<string, unknown> = {
  "PATCH /chat/sessions/{sessionId}": OPENAPI_SCHEMA_EXAMPLES.updateChatSessionBodySchema,
  "PATCH /contacts/{id}": OPENAPI_SCHEMA_EXAMPLES.updateContactInputSchema,
  "PATCH /contacts/{id}/relationships/{relationshipId}":
    OPENAPI_SCHEMA_EXAMPLES.updateContactRelationshipInputSchema,
  "PATCH /contacts/enrich-queue/{id}": OPENAPI_SCHEMA_EXAMPLES.enrichQueuePatchBodySchema,
  "PATCH /groups/{id}": OPENAPI_SCHEMA_EXAMPLES.updateGroupSchema,
  "PATCH /interactions/{id}": OPENAPI_SCHEMA_EXAMPLES.updateInteractionInputSchema,
  "PATCH /me": OPENAPI_SCHEMA_EXAMPLES.updateAccountInputSchema,
  "PATCH /me/api-keys/{id}": OPENAPI_SCHEMA_EXAMPLES.updateApiKeyLabelInputSchema,
  "PATCH /me/onboarding/import-followup": OPENAPI_SCHEMA_EXAMPLES.updateImportFollowupBodySchema,
  "PATCH /me/settings": OPENAPI_SCHEMA_EXAMPLES.updateSettingsBodySchema,
  "PATCH /tags/{id}": OPENAPI_SCHEMA_EXAMPLES.updateTagSchema,
  "POST /chat": OPENAPI_SCHEMA_EXAMPLES.chatRequestSchema,
  "POST /contacts": OPENAPI_SCHEMA_EXAMPLES.createContactBodySchema,
  "POST /contacts/{id}/enrich": OPENAPI_SCHEMA_EXAMPLES.enrichContactRequestSchema,
  "POST /contacts/{id}/linkedin-data": OPENAPI_SCHEMA_EXAMPLES.linkedInDataRequestSchema,
  "POST /contacts/{id}/relationships": OPENAPI_SCHEMA_EXAMPLES.createContactRelationshipInputSchema,
  "POST /contacts/{id}/tags": OPENAPI_SCHEMA_EXAMPLES.contactTagBodySchema,
  "POST /contacts/enrich-queue/init": OPENAPI_SCHEMA_EXAMPLES.enrichQueueInitBodySchema,
  "POST /contacts/import/instagram/commit":
    OPENAPI_SCHEMA_EXAMPLES.instagramImportCommitRequestSchema,
  "POST /contacts/import/linkedin/commit":
    OPENAPI_SCHEMA_EXAMPLES.linkedInImportCommitRequestSchema,
  "POST /contacts/import/vcard/commit": OPENAPI_SCHEMA_EXAMPLES.vcardImportCommitRequestSchema,
  "POST /contacts/merge": OPENAPI_SCHEMA_EXAMPLES.mergeContactsRequestSchema,
  "POST /contacts/share": OPENAPI_SCHEMA_EXAMPLES.shareContactRequestSchema,
  "POST /extension": OPENAPI_SCHEMA_EXAMPLES.redirectRequestSchema,
  "POST /groups": OPENAPI_SCHEMA_EXAMPLES.createGroupSchema,
  "POST /groups/{id}/contacts": OPENAPI_SCHEMA_EXAMPLES.addContactsToGroupRequestSchema,
  "POST /interactions": OPENAPI_SCHEMA_EXAMPLES.createInteractionInputSchema,
  "POST /me/api-keys": OPENAPI_SCHEMA_EXAMPLES.createApiKeyInputSchema,
  "POST /me/feedback": OPENAPI_SCHEMA_EXAMPLES.feedbackFormSchema,
  "POST /sync/push": OPENAPI_SCHEMA_EXAMPLES.syncPushRequestSchema,
  "POST /tags": OPENAPI_SCHEMA_EXAMPLES.createTagInputSchema,
  "POST /tags/{id}/contacts": OPENAPI_SCHEMA_EXAMPLES.tagMembershipRequestSchema,
};
