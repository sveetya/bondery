import { checkEnvVariables } from "@bondee/helpers";
import { resolve } from "path";

const environment = (process.env.NODE_ENV || "development") as "production" | "development";

checkEnvVariables({
  environment,
  appPath: resolve(__dirname, ".."),
  requiredVars: [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
    "GITHUB_CLIENT_ID",
    "GITHUB_CLIENT_SECRET",
    "LINKEDIN_CLIENT_ID",
    "LINKEDIN_CLIENT_SECRET",
    "NEXT_PUBLIC_APP_URL",
  ],
});
