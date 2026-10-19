"use client";

import {
  countryName,
  GroupDataPolicyBadges,
  OwnPurposeHint,
} from "@/components/elements/model/group-data-policy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/lib/utils/format/date";
import type { ProviderConsentItem } from "@/openapi";
import { useLocale, useTranslations } from "next-intl";
import { providerModels } from "./provider-rows";

export type ProviderHandlers = {
  open: (alias: string) => void;
  revoke: (alias: string) => void;
  revoking: boolean;
};

export function ProviderName(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-1.5">
      <span className="font-mono text-xs font-medium lg:text-sm">
        {p.alias}
      </span>
      <GroupDataPolicyBadges
        policy={{ seat_country: p.country, unsafe_third_country: p.unsafe }}
      />
      {p.trains_or_retains && (
        <OwnPurposeHint label={t("PROVIDER_CONSENT.TRAINS")} />
      )}
      {(p.tags ?? []).map((tag) => (
        <Badge key={tag} variant="secondary" className="font-mono text-[10px]">
          {tag}
        </Badge>
      ))}
      {!p.active && (
        <Badge variant="outline" className="text-[10px]">
          {t("PROVIDER_CONSENT.INACTIVE")}
        </Badge>
      )}
    </span>
  );
}

export function ProviderCountry(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const locale = useLocale();
  const p = props.provider;
  return (
    <span className="flex flex-col">
      <span>{countryName(p.country, locale)}</span>
      {p.unsafe && (
        <span className="text-destructive text-xs">
          {t("PROVIDER_CONSENT.UNSAFE_NOTE")}
        </span>
      )}
    </span>
  );
}

export function ProviderModels(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  const models = providerModels(p).sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.name.localeCompare(b.name),
  );
  return (
    <Collapsible>
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group/pm flex items-center gap-1 text-left text-xs">
        <span className="flex flex-col">
          <span>
            {t("PROVIDER_CONSENT.MODELS_ACTIVE", {
              active: p.active_model_count,
              count: p.model_count,
            })}
          </span>
          <span>
            {t("PROVIDER_CONSENT.LANES_ACTIVE", {
              active: p.active_lane_count,
              count: p.lane_count,
            })}
          </span>
        </span>
        {models.length > 0 && (
          <Icon
            name="chevron-down"
            className="h-3.5 w-3.5 shrink-0 transition-transform group-data-panel-open/pm:rotate-180"
          />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1 space-y-0.5">
          {models.map((model) => (
            <li
              key={model.name}
              className={cn(
                "flex items-center gap-1.5 font-mono text-xs",
                !model.active && "text-muted-foreground/60",
              )}
            >
              {model.name}
              {!model.active && (
                <span className="font-sans text-[10px]">
                  {t("PROVIDER_CONSENT.INACTIVE")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function ProviderStatusText(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  if (p.status === "given")
    return (
      <span className="text-muted-foreground text-xs">
        {p.given_at
          ? t("FREE_CONSENT.GRANTED_ON", { date: formatLongDate(p.given_at) })
          : t("FREE_CONSENT.FILTER.GIVEN")}
      </span>
    );
  return (
    <span className="text-muted-foreground text-xs">
      {t("FREE_CONSENT.FILTER.MISSING")}
    </span>
  );
}

export function ProviderAction(props: {
  provider: ProviderConsentItem;
  handlers: ProviderHandlers;
}) {
  const t = useTranslations();
  const alias = props.provider.alias;
  if (props.provider.status === "given")
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => props.handlers.revoke(alias)}
        disabled={props.handlers.revoking}
      >
        {t("FREE_CONSENT.REVOKE_BUTTON")}
      </Button>
    );
  return (
    <Button size="sm" onClick={() => props.handlers.open(alias)}>
      {t("FREE_CONSENT.GIVE")}
    </Button>
  );
}
