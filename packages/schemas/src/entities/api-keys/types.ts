import type { API_KEY_BA_ACTIONS } from "#constants/index.js";

export type ApiKeyBaAction = (typeof API_KEY_BA_ACTIONS)[number];

export type ApiKeyPermission = "read" | "full";

export interface CreateApiKeyInput {
  label: string;
  permission: ApiKeyPermission;
}

export interface UpdateApiKeyLabelInput {
  label: string;
}

export interface ApiKeyListItem {
  createdAt: string;
  id: string;
  keyPrefix: string;
  label: string;
  lastUsedAt: string | null;
  permission: ApiKeyPermission;
}

export interface ApiKeyCreated extends ApiKeyListItem {
  secret: string;
}

export interface ApiKeysListResponse {
  apiKeys: ApiKeyListItem[];
  totalCount: number;
}
