"use client";

import { useFreeConsentsQuery } from "@/hooks/auth/free-consent-hook";
import { useModelProviderConsentsQuery } from "@/hooks/auth/provider-consent-hook";
import {
  hasCoveringConsent,
  needsTransferConsent,
  type OwnPurposeModel,
} from "@/lib/api/own-purpose";

// A model the gateway requires a consent for is covered by provider consents
// (or an earlier model consent, which the gateway counts). A :free model that
// needs only the notice keeps its acknowledgement per model. `demanded` is a
// gateway refusal for a model the catalog did not flag.
export function useModelConsentGate(
  model: OwnPurposeModel | undefined,
  name: string | null,
  demanded: boolean,
) {
  const providerMode =
    (model?.own_purpose?.consent_required ?? false) || demanded;
  const noticeMode =
    !providerMode && model !== undefined && needsTransferConsent(model);
  const providerQuery = useModelProviderConsentsQuery(name, providerMode);
  const noticeQuery = useFreeConsentsQuery(noticeMode);

  const needsConsent =
    name !== null &&
    (providerMode
      ? providerQuery.data?.covered === false
      : noticeMode &&
        noticeQuery.data != null &&
        !hasCoveringConsent(noticeQuery.data.consents, name));

  return { consentModel: providerMode || noticeMode, needsConsent };
}
