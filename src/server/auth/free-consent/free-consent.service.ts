import {
  GUEST_ID_COOKIE,
  GUEST_ID_MAX_AGE,
  GUEST_USER_ID,
  msg,
} from "@/lib/config/constants";
import {
  hasCoveringConsent,
  needsTransferConsent,
  usesInputsForOwnPurposes,
} from "@/lib/api/own-purpose";
import { logger } from "@/lib/utils/logger";
import {
  getGuestFreeConsents,
  getGuestOwnPurposeObjection,
  getStatus,
} from "@/openapi";
import { bffServiceHeader, cookieString } from "@/server/constants";
import { getModelByName } from "@/server/models/pricing/pricing.service";
import type { Cookie } from "elysia";

const GUEST_ID_PATTERN = /^[A-Za-z0-9-]{16,64}$/;
const GUEST_CONSENT_TTL_MS = 30_000;
const GUEST_CACHE_MAX = 10_000;

// Per pod; a revoke reaches the other pods within the TTL.
const guestConsents = new Map<
  string,
  { models: Set<string>; expires: number }
>();

// Guest ids are unbounded caller input: expired entries go first, then the
// oldest, so neither cache grows with the number of guests.
function cacheGuestEntry<T extends { expires: number }>(
  cache: Map<string, T>,
  guestId: string,
  entry: T,
) {
  cache.delete(guestId);
  if (cache.size >= GUEST_CACHE_MAX) {
    const now = Date.now();
    for (const [key, value] of cache)
      if (value.expires <= now) cache.delete(key);
    for (const key of cache.keys()) {
      if (cache.size < GUEST_CACHE_MAX) break;
      cache.delete(key);
    }
  }
  cache.set(guestId, entry);
}

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

// Per pod like the consents; a change reaches the other pods within the TTL.
const guestObjections = new Map<
  string,
  { objects: boolean; expires: number }
>();

export function forgetGuestObjection(guestId: string) {
  guestObjections.delete(guestId);
}

// Fails open: the account path in the gateway is authoritative and an objecting
// guest is rare, so an outage here must not stop every guest chat.
async function guestObjects(guestId: string): Promise<boolean> {
  const cached = guestObjections.get(guestId);
  if (cached && cached.expires > Date.now()) return cached.objects;
  try {
    const res = await getGuestOwnPurposeObjection({
      headers: guestConsentHeaders(guestId),
    });
    if (!res.data?.success) throw new Error(res.data?.message);
    const objects = res.data.data.objection;
    cacheGuestEntry(guestObjections, guestId, {
      objects,
      expires: Date.now() + GUEST_CONSENT_TTL_MS,
    });
    return objects;
  } catch (error) {
    logger.error("guest objection lookup failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
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
  const enabled = await ownPurposeEnabled();
  const models = new Set(
    consents
      .filter((consent) => hasCoveringConsent(consents, consent.model, enabled))
      .map((consent) => consent.model),
  );
  cacheGuestEntry(guestConsents, guestId, {
    models,
    expires: Date.now() + GUEST_CONSENT_TTL_MS,
  });
  return models;
}

const STATUS_FLAGS_TTL_MS = 30_000;
let statusFlags:
  | { enforced: boolean; ownPurpose: boolean; expires: number }
  | undefined;

async function gatewayFlags() {
  if (statusFlags && statusFlags.expires > Date.now()) return statusFlags;
  const data = (await getStatus()).data?.data;
  statusFlags = {
    enforced: data?.free_consent_enforced === true,
    ownPurpose: data?.own_purpose_enabled === true,
    expires: Date.now() + STATUS_FLAGS_TTL_MS,
  };
  return statusFlags;
}

// Follows the gateway's switch, so turning enforcement off frees guests too.
async function consentEnforced(): Promise<boolean> {
  return (await gatewayFlags()).enforced;
}

export async function ownPurposeEnabled(): Promise<boolean> {
  return (await gatewayFlags()).ownPurpose;
}

// The gateway delegates a guest's objection and consent to this check, since
// every guest shares one key; it has to run wherever a guest request reaches a
// model. Unlike the gateway it cannot route around the providers objected to,
// so an objection refuses the whole model.
export async function assertGuestOwnPurposeAccess(
  cookie: Record<string, Cookie<unknown>>,
  userId: number,
  model?: string,
) {
  if (userId !== GUEST_USER_ID || !model) return;
  const info = await getModelByName(model);
  if (!info) return;
  const guestId = readGuestId(cookie);
  const enabled = await ownPurposeEnabled();
  if (
    usesInputsForOwnPurposes(info, enabled) &&
    guestId &&
    (await guestObjects(guestId))
  )
    throw new Error(msg("OWN_PURPOSE.OBJECTED_ERROR"));
  if (!needsTransferConsent(info, enabled)) return;
  if (!(await consentEnforced())) return;
  if (guestId && (await guestConsentedModels(guestId, model)).has(model))
    return;
  throw new Error(msg("FREE_CONSENT.DECLINED"));
}
