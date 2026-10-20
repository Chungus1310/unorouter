import { msg } from "@/lib/config/constants";
import type { FreeConsentItem, OwnPurposeSummary } from "@/openapi";

export type OwnPurposeModel = {
  model_name: string;
  own_purpose?: OwnPurposeSummary;
};

// The gateway still takes a grant for every :free model, so those stay gated
// even when their summary says no consent is needed.
export function needsTransferConsent(model: OwnPurposeModel): boolean {
  return (
    (model.own_purpose?.consent_required ?? false) ||
    model.model_name.toLowerCase().endsWith(":free")
  );
}

export function usesInputsForOwnPurposes(model: OwnPurposeModel): boolean {
  return model.own_purpose?.trains_or_retains ?? false;
}

// A consent stops counting once a provider it did not cover serves the model.
// Gateways that predate the flag omit it, so a missing value still counts.
export function hasCoveringConsent(
  consents: FreeConsentItem[] | null | undefined,
  model: string,
): boolean {
  return (consents ?? []).some((c) => c.model === model && c.covers !== false);
}

export const OWN_PURPOSE_OBJECTED = "own_purpose_objected";

// The gateway renamed free_consent_required and free_models_business; both
// spellings are mapped while either may arrive.
const CONSENT_REQUIRED_CODES = ["consent_required", "free_consent_required"];

export function isConsentRequiredCode(code: string | null | undefined) {
  return code != null && CONSENT_REQUIRED_CODES.includes(code);
}

const GATEWAY_CODE_MESSAGES = {
  [OWN_PURPOSE_OBJECTED]: msg("OWN_PURPOSE.OBJECTED_ERROR"),
  consent_required: msg("FREE_CONSENT.REQUIRED_ERROR"),
  free_consent_required: msg("FREE_CONSENT.REQUIRED_ERROR"),
  consent_business: msg("FREE_CONSENT.BUSINESS"),
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
