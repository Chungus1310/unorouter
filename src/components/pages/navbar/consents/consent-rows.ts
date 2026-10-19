import { needsTransferConsent } from "@/lib/api/own-purpose";
import type { FreeConsentItem, PricingCatalogModel } from "@/openapi";

export const CONSENT_KINDS = ["consent", "notice", "none"] as const;
export type ConsentKind = (typeof CONSENT_KINDS)[number];

export const CONSENT_STATUSES = ["given", "missing", "stale"] as const;
export type ConsentStatus = (typeof CONSENT_STATUSES)[number] | "not_needed";

export const PRICE_KINDS = ["paid", "free"] as const;

export type ConsentRow = {
  model: PricingCatalogModel;
  kind: ConsentKind;
  status: ConsentStatus;
  grantedAt: number | null;
  countries: string[];
};

// A :free model needs a grant even without a transfer to an unsafe country;
// then it is a notice to acknowledge, as in the consent panel.
function kindOf(model: PricingCatalogModel): ConsentKind {
  if (!needsTransferConsent(model)) return "none";
  return model.own_purpose?.consent_required ? "consent" : "notice";
}

export function buildConsentRows(
  models: PricingCatalogModel[],
  consents: FreeConsentItem[],
): ConsentRow[] {
  const byModel = new Map(consents.map((c) => [c.model, c]));
  return models.map((model) => {
    const kind = kindOf(model);
    const consent = byModel.get(model.model_name);
    const status: ConsentStatus = consent
      ? consent.covers === false
        ? "stale"
        : "given"
      : kind === "none"
        ? "not_needed"
        : "missing";
    return {
      model,
      kind,
      status,
      grantedAt: consent?.created_at ?? null,
      countries: model.own_purpose?.countries ?? [],
    };
  });
}
