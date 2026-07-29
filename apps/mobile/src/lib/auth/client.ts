import { expoClient } from "@better-auth/expo/client";
import { BETTER_AUTH_BASE_PATH } from "@bondery/helpers/globals/paths";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { API_URL, HAS_MOBILE_CONFIG } from "../config";

const webStorage = {
  getItem: (key: string) => localStorage.getItem(key),
  setItem: (key: string, value: string) => {
    localStorage.setItem(key, value);
  },
};

export const authClient = HAS_MOBILE_CONFIG
  ? createAuthClient({
      basePath: BETTER_AUTH_BASE_PATH,
      baseURL: API_URL,
      plugins: [
        expoClient({
          scheme: "bondery",
          storage: Platform.OS === "web" ? webStorage : SecureStore,
          storagePrefix: "bondery",
        }),
      ],
    })
  : null;

export async function getAccessToken(): Promise<string | null> {
  if (!authClient) {
    return null;
  }

  const { data } = await authClient.getSession();
  return data?.session?.token ?? null;
}
