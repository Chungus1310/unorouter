import { customerTypeSchema } from "@/lib/validation/auth";
import { t } from "elysia";

export const loginBody = t.Object({
  username: t.String(),
  password: t.String(),
  turnstile: t.Optional(t.String()),
});

// The terms notice a signup form showed; the gateway records it as the
// accepted terms version of the account it creates.
const termsShownFields = {
  terms_version: t.Optional(t.String({ maxLength: 16 })),
  terms_locale: t.Optional(t.String({ maxLength: 16 })),
  terms_text: t.Optional(t.String({ maxLength: 20000 })),
};

export const registerBody = t.Object({
  username: t.String(),
  password: t.String(),
  email: t.Optional(t.String()),
  verification_code: t.Optional(t.String()),
  aff_code: t.Optional(t.String()),
  customer_type: customerTypeSchema,
  turnstile: t.Optional(t.String()),
  ...termsShownFields,
});

export const oauthStateQuery = t.Object({
  provider: t.Optional(t.String()),
  redirect: t.Optional(t.String()),
  aff: t.Optional(t.String()),
  action: t.Optional(t.String()),
  customer_type: t.Optional(customerTypeSchema),
  turnstile: t.Optional(t.String()),
  ...termsShownFields,
});

export const termsAcceptBody = t.Object({
  version: t.String({ maxLength: 16 }),
  locale: t.String({ maxLength: 16 }),
  text: t.String({ minLength: 1, maxLength: 20000 }),
});

export const oauthCallbackQuery = t.Object({
  code: t.Optional(t.String()),
  error: t.Optional(t.String()),
  verify: t.Optional(t.String()),
});

export const passwordResetBody = t.Object({
  email: t.String(),
  token: t.String(),
});

export const oauthUnbindParams = t.Object({
  binding_type: t.Union([
    t.Literal("github"),
    t.Literal("discord"),
    t.Literal("google"),
    t.Literal("oidc"),
    t.Literal("wechat"),
    t.Literal("telegram"),
    t.Literal("linuxdo"),
  ]),
});
