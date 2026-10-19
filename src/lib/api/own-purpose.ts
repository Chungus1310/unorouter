import type { OwnPurposeSummary } from "@/openapi";

type OwnPurposeModel = {
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
