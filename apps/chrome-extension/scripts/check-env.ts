import { checkEnvVariables } from "@bondee/helpers";
import { resolve } from "path";

const environment = (process.env.NODE_ENV || "development") as "production" | "development";

checkEnvVariables({
  environment,
  appPath: resolve(__dirname, ".."),
  requiredVars: ["APP_URL"],
});
