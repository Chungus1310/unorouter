import { customFetch } from "@/lib/custom-fetch";
import {
  getDisable2FAUrl,
  getEnable2FAUrl,
  getGet2FAStatusUrl,
  getGetVerificationMethodsUrl,
  getLoginUrl,
  getPasskeyDeleteUrl,
  getPasskeyRegisterFinishUrl,
  getPasskeyVerifyBeginUrl,
  getPasskeyVerifyFinishUrl,
  getSetup2FAUrl,
  getUniversalVerifyUrl,
  type LoginParams,
  type LoginRequest,
  type loginResponse,
} from "@/openapi";

// Routes whose OpenAPI annotation in new-api is wrong or missing, so the
// generated client cannot express them. Each goes once the gateway is fixed and
// `bun openapi` is rerun.

type Envelope<T> = {
  data: { success: boolean; message: string; data: T };
  status: 200;
  headers: Headers;
};

// Annotated as the bare ApiResponse (router/api-router.go, self2FA routes).
export type TwoFAStatusData = {
  enabled: boolean;
  locked: boolean;
  backup_codes_remaining?: number;
};

export type TwoFASetupData = {
  secret: string;
  qr_code_data: string;
  backup_codes: string[] | null;
  flow_token: string;
  expires_at: number;
};

// service.VerificationRequirements; annotated as the bare ApiResponse and
// without its `scope` query.
export type VerificationRequirements = {
  scope: string;
  methods: { method: string; available: boolean; reason?: string }[];
  oauth_providers: { slug: string; name: string }[];
  password_encryption_enabled: boolean;
};

// service.SecurityProof. POST /api/verify is annotated as
// VerificationStatusResponse, the passkey finish as MessageResponse.
export type SecurityProof = {
  proof_token: string;
  expires_at: number;
  method: string;
  scope: string;
};

// `options` is the go-webauthn CredentialAssertion, binary fields base64url.
export type PasskeyVerifyOptions = {
  options: unknown;
  rp_ids: string[];
  flow_token: string;
  expires_at: number;
};

// controller.authRotationData: changing 2FA or the passkey re-issues the session
// token. Empty when the caller authenticated with an access token.
export type AuthRotationData = {
  access_token?: string;
  token_type?: string;
  access_expires_at?: number;
};

// A record, not HeadersInit: spreading a Headers instance drops every header.
type GapOptions = { headers?: Record<string, string> };

const postJson = (body: unknown, options?: GapOptions): RequestInit => ({
  ...options,
  method: "POST",
  headers: { "Content-Type": "application/json", ...options?.headers },
  body: JSON.stringify(body),
});

export const getVerificationMethods = (scope: string, options?: GapOptions) =>
  customFetch<Envelope<VerificationRequirements>>(
    `${getGetVerificationMethodsUrl()}?${new URLSearchParams({ scope })}`,
    { ...options, method: "GET" },
  );

export const verifySecurity = (body: unknown, options?: GapOptions) =>
  customFetch<Envelope<SecurityProof>>(
    getUniversalVerifyUrl(),
    postJson(body, options),
  );

export const beginPasskeyVerification = (body: unknown, options?: GapOptions) =>
  customFetch<Envelope<PasskeyVerifyOptions>>(
    getPasskeyVerifyBeginUrl(),
    postJson(body, options),
  );

export const finishPasskeyVerification = (
  body: unknown,
  options?: GapOptions,
) =>
  customFetch<Envelope<SecurityProof>>(
    getPasskeyVerifyFinishUrl(),
    postJson(body, options),
  );

export const enable2FAEnrollment = (body: unknown, options?: GapOptions) =>
  customFetch<Envelope<AuthRotationData>>(
    getEnable2FAUrl(),
    postJson(body, options),
  );

export const disable2FAWithProof = (options?: GapOptions) =>
  customFetch<Envelope<AuthRotationData>>(getDisable2FAUrl(), {
    ...options,
    method: "POST",
  });

// Passkey register finish and delete are annotated as MessageResponse.
export const finishPasskeyRegistration = (
  body: unknown,
  options?: GapOptions,
) =>
  customFetch<Envelope<AuthRotationData>>(
    getPasskeyRegisterFinishUrl(),
    postJson(body, options),
  );

export const deletePasskeyWithProof = (options?: GapOptions) =>
  customFetch<Envelope<AuthRotationData>>(getPasskeyDeleteUrl(), {
    ...options,
    method: "DELETE",
  });

export const get2FAStatus = (options?: RequestInit) =>
  customFetch<Envelope<TwoFAStatusData>>(getGet2FAStatusUrl(), {
    ...options,
    method: "GET",
  });

export const setup2FA = (options?: RequestInit) =>
  customFetch<Envelope<TwoFASetupData>>(getSetup2FAUrl(), {
    ...options,
    method: "POST",
  });

// LoginRequest marks the encrypted-transport fields required (no omitempty in
// dto.LoginRequest), but production runs plaintext login and never sends them.
export const loginWithPassword = (
  body: Pick<LoginRequest, "username" | "password">,
  params: LoginParams,
  headers: Record<string, string>,
) =>
  customFetch<loginResponse>(getLoginUrl(params), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

// POST /v1/video/generations is a plain gin route (router/video-router.go), so
// it is absent from the spec.
export const postVideoGeneration = (options: RequestInit) =>
  customFetch<{ data: unknown; status: number; headers: Headers }>(
    "/v1/video/generations",
    { ...options, method: "POST" },
  );
