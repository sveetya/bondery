import { z } from "zod";
import type { EmailAddress, LoginEmailFormValues } from "./types.js";

export const emailAddressSchema = z
  .string()
  .trim()
  .email({ error: "Enter a valid email address" })
  .transform((value) => value.toLowerCase()) satisfies z.ZodType<EmailAddress>;

export const loginEmailFormSchema = z.object({
  email: emailAddressSchema,
}) satisfies z.ZodType<LoginEmailFormValues>;
