"use client";

import { useApiMutation, useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import type { EdenArgs } from "@/lib/types/eden";
import { handleElysia } from "@/lib/utils/base";

type FreeConsents = (typeof rpc.api.auth)["free-consents"];

export function useFreeConsentsQuery(enabled = true) {
  return useElysiaQuery(
    queryKeys.freeConsents(),
    () => rpc.api.auth["free-consents"].get(),
    { enabled },
  );
}

export function useGrantFreeConsentMutation() {
  return useApiMutation({
    mutationFn: async (args: EdenArgs<FreeConsents, "post">) =>
      handleElysia(await rpc.api.auth["free-consents"].post(args.body)),
    onSuccess: (_, __, qc) =>
      qc.invalidateQueries({ queryKey: queryKeys.freeConsents() }),
  });
}

export function useRevokeFreeConsentMutation() {
  return useApiMutation({
    mutationFn: async (args: EdenArgs<FreeConsents, "delete">) =>
      handleElysia(await rpc.api.auth["free-consents"].delete(args.body)),
    onSuccess: (_, __, qc) =>
      qc.invalidateQueries({ queryKey: queryKeys.freeConsents() }),
  });
}
