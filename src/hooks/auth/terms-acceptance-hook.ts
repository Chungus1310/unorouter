"use client";

import { useApiMutation, useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import type { EdenArgs } from "@/lib/types/eden";
import { handleElysia } from "@/lib/utils/base";

type TermsAcceptance = (typeof rpc.api.auth)["terms-acceptance"];

export function useTermsAcceptanceQuery(enabled: boolean) {
  return useElysiaQuery(
    queryKeys.termsAcceptance(),
    () => rpc.api.auth["terms-acceptance"].get(),
    { enabled },
  );
}

export function useAcceptTermsMutation() {
  return useApiMutation({
    mutationFn: async (args: EdenArgs<TermsAcceptance, "post">) =>
      handleElysia(await rpc.api.auth["terms-acceptance"].post(args.body)),
    invalidates: [queryKeys.termsAcceptance()],
  });
}
