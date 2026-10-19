import { msg } from "@/lib/config/constants";
import type { FreeConsentItem, OwnPurposeSummary } from "@/openapi";

type OwnPurposeModel = {
  model_name: string;
  is_free?: boolean;
  own_purpose?: OwnPurposeSummary;
};

// `enabled` is the gateway's own_purpose_enabled switch: while it is off only
// free models are gated and the own purpose summary is ignored.
// The gateway still takes a grant for every :free model, so those stay gated
// even when their summary says no consent is needed.
export function needsTransferConsent(
  model: OwnPurposeModel,
  enabled: boolean,
): boolean {
  const free = model.model_name.toLowerCase().endsWith(":free");
  if (!enabled) return (model.is_free ?? false) || free;
  return (model.own_purpose?.consent_required ?? false) || free;
}

export function usesInputsForOwnPurposes(
  model: OwnPurposeModel,
  enabled: boolean,
): boolean {
  return enabled && (model.own_purpose?.trains_or_retains ?? false);
}

// A consent stops counting once a provider it did not cover serves the model.
// Gateways that predate the flag omit it, so a missing value still counts.
export function hasCoveringConsent(
  consents: FreeConsentItem[] | null | undefined,
  model: string,
  enabled: boolean,
): boolean {
  return (consents ?? []).some(
    (c) => c.model === model && (!enabled || c.covers !== false),
  );
}

export const OWN_PURPOSE_OBJECTED = "own_purpose_objected";
export const FREE_CONSENT_REQUIRED = "free_consent_required";

const GATEWAY_CODE_MESSAGES = {
  [OWN_PURPOSE_OBJECTED]: msg("OWN_PURPOSE.OBJECTED_ERROR"),
  [FREE_CONSENT_REQUIRED]: msg("FREE_CONSENT.REQUIRED_ERROR"),
  free_models_business: msg("FREE_CONSENT.BUSINESS"),
} as const;

function isMappedCode(
  code: string,
): code is keyof typeof GATEWAY_CODE_MESSAGES {
  return Object.hasOwn(GATEWAY_CODE_MESSAGES, code);
}

export function gatewayCodeMessage(code: string | null | undefined) {
  return code && isMappedCode(code) ? GATEWAY_CODE_MESSAGES[code] : null;
}
