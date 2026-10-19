"use client";

import { useAuthQuery } from "@/hooks/auth/auth-hook";
import { useFreeConsentsQuery } from "@/hooks/auth/free-consent-hook";
import { usePricingCatalogQuery } from "@/hooks/models/pricing-hook";
import { useApiKey } from "@/hooks/ui/use-api-key";
import { needsTransferConsent } from "@/lib/api/own-purpose";
import { chatModelAtom } from "@/store/chat-store";
import { useAtomValue } from "jotai";

export function useChatGate() {
  const token = useApiKey();
  const authQuery = useAuthQuery();
  const selectedModel = useAtomValue(chatModelAtom);
  const pricingData = usePricingCatalogQuery().data?.models;
  const selected = pricingData?.find((m) => m.model_name === selectedModel);
  const isSelectedModelFree = selected?.is_free ?? false;
  const consentModel = selected ? needsTransferConsent(selected) : false;
  const consentsQuery = useFreeConsentsQuery(consentModel);

  const inputsSettled = selectedModel != null && pricingData != null;
  const needsToken =
    token.isLoggedIn &&
    token.needsToken &&
    inputsSettled &&
    !isSelectedModelFree;
  const business = consentModel && authQuery.data?.customer_type === "business";
  const needsConsent =
    consentModel &&
    !business &&
    consentsQuery.data != null &&
    !(consentsQuery.data.consents ?? []).some((c) => c.model === selectedModel);

  return { needsToken, needsConsent, business, selectedModel };
}
