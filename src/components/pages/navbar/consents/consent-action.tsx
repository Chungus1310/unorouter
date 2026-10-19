"use client";

import { Button } from "@/components/ui/button";
import { msg } from "@/lib/config/constants";
import { formatLongDate } from "@/lib/utils/format/date";
import { useTranslations } from "next-intl";
import type { ConsentKind, ConsentRow } from "./consent-rows";

export const KIND_LABEL = {
  consent: msg("FREE_CONSENT.KIND_CONSENT"),
  notice: msg("FREE_CONSENT.KIND_NOTICE"),
  none: msg("FREE_CONSENT.NOT_NEEDED"),
} satisfies Record<ConsentKind, ReturnType<typeof msg>>;

export type ConsentHandlers = {
  open: (model: string) => void;
  revoke: (model: string) => void;
  revoking: boolean;
};

export function ConsentStatusText(props: { row: ConsentRow }) {
  const t = useTranslations();
  const row = props.row;
  if (row.status === "given" && row.via === "providers")
    return (
      <span className="text-muted-foreground text-xs">
        {t("FREE_CONSENT.COVERED_BY_PROVIDERS")}
      </span>
    );
  if (row.status === "given" && row.grantedAt != null)
    return (
      <span className="text-muted-foreground text-xs">
        {t("FREE_CONSENT.GRANTED_ON", { date: formatLongDate(row.grantedAt) })}
      </span>
    );
  if (row.status === "stale")
    return (
      <span className="text-warning text-xs">{t("FREE_CONSENT.STALE")}</span>
    );
  if (row.status === "missing")
    return (
      <span className="text-muted-foreground text-xs">
        {t("FREE_CONSENT.FILTER.MISSING")}
      </span>
    );
  return (
    <span className="text-muted-foreground text-xs">
      {t("FREE_CONSENT.NOT_NEEDED")}
    </span>
  );
}

export function ConsentActionButton(props: {
  row: ConsentRow;
  handlers: ConsentHandlers;
}) {
  const t = useTranslations();
  const row = props.row;
  const model = row.model.model_name;
  // Provider consents are withdrawn per provider on the providers tab.
  if (row.via === "providers") return null;
  // A model that needs nothing any more only offers the withdrawal.
  if (row.status === "given" || (row.status === "stale" && row.kind === "none"))
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => props.handlers.revoke(model)}
        disabled={props.handlers.revoking}
      >
        {t("FREE_CONSENT.REVOKE_BUTTON")}
      </Button>
    );
  if (row.kind === "none") return null;
  return (
    <Button size="sm" onClick={() => props.handlers.open(model)}>
      {row.status === "stale"
        ? t("FREE_CONSENT.RENEW")
        : row.kind === "notice"
          ? t("FREE_CONSENT.NOTICE_CONFIRM")
          : t("FREE_CONSENT.GIVE")}
    </Button>
  );
}
