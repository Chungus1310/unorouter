"use client";

import { useAuthQuery } from "@/hooks/auth/auth-hook";
import { useFreeConsentsQuery } from "@/hooks/auth/free-consent-hook";
import { usePricingCatalogQuery } from "@/hooks/models/pricing-hook";
import { useApiKey } from "@/hooks/ui/use-api-key";
import { chatModelAtom } from "@/store/chat-store";
import { useAtomValue } from "jotai";

export function useChatGate() {
  const token = useApiKey();
  const authQuery = useAuthQuery();
  const selectedModel = useAtomValue(chatModelAtom);
  const pricingData = usePricingCatalogQuery().data?.models;
  const isSelectedModelFree =
    pricingData?.find((m) => m.model_name === selectedModel)?.is_free ?? false;
  const consentsQuery = useFreeConsentsQuery(isSelectedModelFree);

  const inputsSettled = selectedModel != null && pricingData != null;
  const needsToken =
    token.isLoggedIn &&
    token.needsToken &&
    inputsSettled &&
    !isSelectedModelFree;
  const business =
    isSelectedModelFree && authQuery.data?.customer_type === "business";
  const needsConsent =
    isSelectedModelFree &&
    !business &&
    consentsQuery.data != null &&
    !(consentsQuery.data.consents ?? []).some((c) => c.model === selectedModel);

  return { needsToken, needsConsent, business, selectedModel };
}
