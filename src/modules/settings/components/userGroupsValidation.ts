import { z } from "zod";
import type { TFunction } from "i18next";

// Keep in sync with backend limits (UserGroup entity: Name 100, Description 500).
export const USER_GROUP_NAME_MIN = 2;
export const USER_GROUP_NAME_MAX = 100;
export const USER_GROUP_DESC_MAX = 500;

// Allow letters (incl. accented), digits, spaces and a few common separators.
// Rejects control chars, angle brackets, quotes and backticks to prevent injection payloads.
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} _\-&.,'()/]*$/u;

export function buildUserGroupSchemas(t: TFunction) {
  const name = z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .min(1, { message: t("userGroups.validation.nameRequired") })
        .min(USER_GROUP_NAME_MIN, {
          message: t("userGroups.validation.nameMin", { min: USER_GROUP_NAME_MIN }),
        })
        .max(USER_GROUP_NAME_MAX, {
          message: t("userGroups.validation.nameMax", { max: USER_GROUP_NAME_MAX }),
        })
        .regex(NAME_PATTERN, { message: t("userGroups.validation.nameInvalid") }),
    );

  const description = z
    .string()
    .transform((v) => v.trim())
    .pipe(
      z
        .string()
        .max(USER_GROUP_DESC_MAX, {
          message: t("userGroups.validation.descMax", { max: USER_GROUP_DESC_MAX }),
        }),
    )
    .optional()
    .or(z.literal("").transform(() => undefined));

  const createSchema = z.object({
    name,
    description,
  });

  const updateSchema = z.object({
    name,
    description,
    isActive: z.boolean(),
  });

  const assignMembersSchema = z.object({
    userIds: z
      .array(z.number().int().positive())
      .min(1, { message: t("userGroups.validation.selectUserRequired") }),
  });

  return { createSchema, updateSchema, assignMembersSchema };
}

export type UserGroupFieldErrors = Partial<Record<"name" | "description" | "isActive" | "userIds", string>>;

export function zodErrorsToFieldMap(error: z.ZodError): UserGroupFieldErrors {
  const out: UserGroupFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as keyof UserGroupFieldErrors | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
