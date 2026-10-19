"use client";

import { useElysiaQuery } from "@/lib/react-query/hooks";

import { queryKeys } from "@/lib/react-query/keys";
import { rpc } from "@/lib/rpc";

export function useStatusQuery() {
  return useElysiaQuery(queryKeys.status(), () =>
    rpc.api.auth.account.status.get(),
  );
}

// Gateway switch for consent, notice and objection beyond free models.
export function useOwnPurposeEnabled() {
  return useStatusQuery().data?.own_purpose_enabled === true;
}
