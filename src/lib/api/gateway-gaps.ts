import { customFetch } from "@/lib/custom-fetch";
import {
  getGet2FAStatusUrl,
  getLoginUrl,
  getSetup2FAUrl,
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
