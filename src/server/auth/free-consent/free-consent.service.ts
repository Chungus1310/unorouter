import {
  GUEST_ID_COOKIE,
  GUEST_ID_MAX_AGE,
  GUEST_USER_ID,
  msg,
} from "@/lib/config/constants";
import { getGuestFreeConsents, getStatus } from "@/openapi";
import { bffServiceHeader, cookieString } from "@/server/constants";
import { getModelByName } from "@/server/models/pricing/pricing.service";
import type { Cookie } from "elysia";

const GUEST_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
const GUEST_CONSENT_TTL_MS = 30_000;

// Per pod; a revoke reaches the other pods within the TTL.
const guestConsents = new Map<
  string,
  { models: Set<string>; expires: number }
>();

export function readGuestId(
  cookie: Record<string, Cookie<unknown>>,
): string | undefined {
  const value = cookieString(cookie[GUEST_ID_COOKIE]?.value);
  return value && GUEST_ID_PATTERN.test(value) ? value : undefined;
}

export function ensureGuestId(cookie: Record<string, Cookie<unknown>>): string {
  const existing = readGuestId(cookie);
  if (existing) return existing;
  const created = crypto.randomUUID();
  cookie[GUEST_ID_COOKIE].set({
    value: created,
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: GUEST_ID_MAX_AGE,
  });
  return created;
}

// The gateway takes a guest id only next to the BFF's service secret.
export function guestConsentHeaders(guestId: string): Record<string, string> {
  return { ...bffServiceHeader(), "X-Guest-Id": guestId };
}

export function forgetGuestConsents(guestId: string) {
  guestConsents.delete(guestId);
}

async function guestConsentedModels(
  guestId: string,
  model: string,
): Promise<Set<string>> {
  const cached = guestConsents.get(guestId);
  // Only a cached yes is trusted: a consent given through the other pod must
  // count immediately.
  if (cached && cached.expires > Date.now() && cached.models.has(model))
    return cached.models;
  const res = await getGuestFreeConsents({
    headers: guestConsentHeaders(guestId),
  });
  const consents = res.data?.success ? (res.data.data?.consents ?? []) : [];
  const models = new Set(consents.map((consent) => consent.model));
  guestConsents.set(guestId, {
    models,
    expires: Date.now() + GUEST_CONSENT_TTL_MS,
  });
  return models;
}

const ENFORCEMENT_TTL_MS = 30_000;
let enforcement: { on: boolean; expires: number } | undefined;

// Follows the gateway's switch, so turning enforcement off frees guests too.
async function consentEnforced(): Promise<boolean> {
  if (enforcement && enforcement.expires > Date.now()) return enforcement.on;
  const res = await getStatus();
  const on = res.data?.data?.free_consent_enforced === true;
  enforcement = { on, expires: Date.now() + ENFORCEMENT_TTL_MS };
  return on;
}

// The gateway delegates guest consent to this check, since every guest shares
// one key; it has to run wherever a guest request reaches a free model.
export async function assertGuestFreeConsent(
  cookie: Record<string, Cookie<unknown>>,
  userId: number,
  model?: string,
) {
  if (userId !== GUEST_USER_ID || !model) return;
  if (!(await getModelByName(model))?.is_free) return;
  if (!(await consentEnforced())) return;
  const guestId = readGuestId(cookie);
  if (guestId && (await guestConsentedModels(guestId, model)).has(model))
    return;
  throw new Error(msg("FREE_CONSENT.DECLINED"));
}
