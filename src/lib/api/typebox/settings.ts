import { customerTypeSchema } from "@/lib/validation/auth";
import { t } from "elysia";

export const updateSelfBody = t.Object({
  password: t.Optional(t.String()),
  original_password: t.Optional(t.String()),
  email: t.Optional(t.String()),
  verification_code: t.Optional(t.String()),
  display_name: t.Optional(t.String()),
  customer_type: t.Optional(customerTypeSchema),
});

export const passkeyCredentialBody = t.Object({
  id: t.String(),
  rawId: t.String(),
  response: t.Object({
    clientDataJSON: t.String(),
    attestationObject: t.String(),
  }),
  type: t.Literal("public-key"),
  authenticatorAttachment: t.Optional(t.String()),
  clientExtensionResults: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const emailBindQuery = t.Object({
  email: t.String(),
  code: t.String(),
});

export const updateSettingBody = t.Object({
  quota_warning_enabled: t.Boolean(),
  notify_type: t.String(),
  quota_warning_threshold: t.Number(),
  accept_unset_model_ratio_model: t.Boolean(),
  record_ip_log: t.Boolean(),
  notification_email: t.Optional(t.String()),
  webhook_url: t.Optional(t.String()),
  webhook_secret: t.Optional(t.String()),
  bark_url: t.Optional(t.String()),
  gotify_url: t.Optional(t.String()),
  gotify_token: t.Optional(t.String()),
  gotify_priority: t.Optional(t.Number()),
  upstream_model_update_notify_enabled: t.Optional(t.Nullable(t.Boolean())),
});

// 0 disables a limit. The upper bound mirrors the gateway's clamp, which is what
// actually enforces it; this only rejects obvious nonsense before the round trip.
export const updateTimeoutBody = t.Object({
  max_first_token_seconds: t.Integer({ minimum: 0, maximum: 600 }),
  max_chain_first_token_seconds: t.Integer({ minimum: 0, maximum: 600 }),
});

// Step-up scopes this site asks the gateway to verify (service/security_verification.go).
export const securityScope = t.Union([
  t.Literal("2fa.setup"),
  t.Literal("2fa.disable"),
]);
export type SecurityScope = typeof securityScope.static;

export const verificationMethodsQuery = t.Object({ scope: securityScope });

// Passkey and OAuth have their own ceremonies, so only these two post here.
export const securityVerifyBody = t.Object({
  method: t.Union([t.Literal("2fa"), t.Literal("password")]),
  scope: securityScope,
  code: t.Optional(t.String()),
  password: t.Optional(t.String()),
});

export const passkeyVerifyBeginBody = t.Object({ scope: securityScope });

export const passkeyVerifyFinishBody = t.Object({
  flow_token: t.String(),
  credential: t.Object({
    id: t.String(),
    rawId: t.String(),
    type: t.Literal("public-key"),
    response: t.Object({
      authenticatorData: t.String(),
      clientDataJSON: t.String(),
      signature: t.String(),
      userHandle: t.Optional(t.String()),
    }),
  }),
});
