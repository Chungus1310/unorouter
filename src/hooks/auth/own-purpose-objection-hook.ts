"use client";

import { useApiMutation, useElysiaQuery } from "@/lib/react-query/hooks";
import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";
import type { EdenArgs } from "@/lib/types/eden";
import { handleElysia } from "@/lib/utils/base";

type OwnPurposeObjection = (typeof rpc.api.auth)["own-purpose-objection"];

export function useOwnPurposeObjectionQuery() {
  return useElysiaQuery(queryKeys.ownPurposeObjection(), () =>
    rpc.api.auth["own-purpose-objection"].get(),
  );
}

export function useSetOwnPurposeObjectionMutation() {
  return useApiMutation({
    mutationFn: async (args: EdenArgs<OwnPurposeObjection, "put">) =>
      handleElysia(await rpc.api.auth["own-purpose-objection"].put(args.body)),
    onSuccess: (_, __, qc) =>
      qc.invalidateQueries({ queryKey: queryKeys.ownPurposeObjection() }),
  });
}
