"use client";

import { providerName } from "@/lib/api/provider-consent";
import {
  countryName,
  GroupDataPolicyBadges,
  OwnPurposeHint,
} from "@/components/elements/model/group-data-policy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const tags = p.tags ?? [];
  const name = providerName(p);
  // The label already lists short tag sets; collapsed families get the full
  // list on hover.
  const collapsed = tags.length > 0 && name !== tags.join(", ");
  return (
    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <span className="cursor-help truncate font-mono text-xs font-medium underline decoration-dotted underline-offset-4 lg:text-sm" />
            }
          >
            {name}
          </TooltipTrigger>
          <TooltipContent className="max-w-80 font-mono text-xs">
            {tags.join(", ")}
          </TooltipContent>
        </Tooltip>
      ) : (
        <span className="truncate font-mono text-xs font-medium lg:text-sm">
          {name}
        </span>
      )}
      <GroupDataPolicyBadges
        policy={{
          seat_country: p.country,
          // A safe seat that passes inputs on is not an unsafe seat country.
          unsafe_third_country: p.unsafe && !p.onward_unvetted,
        }}
      />
      {p.trains_or_retains && (
        <OwnPurposeHint label={t("PROVIDER_CONSENT.TRAINS")} />
      )}
      {!p.active && (
        <Badge variant="outline" className="h-4 px-1 text-[10px]">
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
  const risk = p.onward_unvetted
    ? t("PROVIDER_CONSENT.ONWARD_UNVETTED")
    : p.unsafe
      ? t("PROVIDER_CONSENT.UNSAFE_NOTE")
      : null;
  return (
    <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap">
      <span>{countryName(p.country, locale)}</span>
      {risk && (
        <span className="text-destructive truncate text-xs" title={risk}>
          {risk}
        </span>
      )}
    </span>
  );
}

// One short line; lanes and the model list sit in the expanded row.
export function ProviderCounts(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  return (
    <span className="text-muted-foreground text-xs whitespace-nowrap">
      {t("PROVIDER_CONSENT.COUNTS_SHORT", {
        activeModels: p.active_model_count,
        models: p.model_count,
        activeChannels: p.active_channel_count,
        channels: p.channel_count,
      })}
    </span>
  );
}

export function ProviderDetails(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  const models = providerModels(p);
  return (
    <div className="space-y-2 px-4 py-3">
      <p className="text-muted-foreground text-xs">
        {[
          t("PROVIDER_CONSENT.MODELS_ACTIVE", {
            active: p.active_model_count,
            count: p.model_count,
          }),
          t("PROVIDER_CONSENT.CHANNELS_ACTIVE", {
            active: p.active_channel_count,
            count: p.channel_count,
          }),
          t("PROVIDER_CONSENT.LANES_ACTIVE", {
            active: p.active_lane_count,
            count: p.lane_count,
          }),
        ].join(", ")}
      </p>
      <ul className="grid gap-x-6 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <li
            key={model.name}
            className={cn(
              "flex items-center gap-1.5 truncate font-mono text-xs",
              !model.active && "text-muted-foreground/60",
            )}
          >
            <span className="truncate">{model.name}</span>
            {model.channels > 0 && (
              <span className="text-muted-foreground shrink-0 font-sans text-[10px]">
                {model.active_channels}/{model.channels}
              </span>
            )}
            {!model.active && (
              <span className="shrink-0 font-sans text-[10px]">
                {t("PROVIDER_CONSENT.INACTIVE")}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProviderStatusBadge(props: { provider: ProviderConsentItem }) {
  const t = useTranslations();
  const p = props.provider;
  if (p.status === "given")
    return (
      <Badge
        variant="secondary"
        className="text-[10px]"
        title={
          p.given_at
            ? t("FREE_CONSENT.GRANTED_ON", { date: formatLongDate(p.given_at) })
            : undefined
        }
      >
        {t("FREE_CONSENT.FILTER.GIVEN")}
      </Badge>
    );
  if (p.status === "model_consent")
    return (
      <Badge
        variant="secondary"
        className="text-[10px]"
        title={t("PROVIDER_CONSENT.MODEL_CONSENT_STATUS")}
      >
        {t("FREE_CONSENT.FILTER.GIVEN")}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px]">
      {t("FREE_CONSENT.FILTER.MISSING")}
    </Badge>
  );
}

export function ProviderAction(props: {
  provider: ProviderConsentItem;
  handlers: ProviderHandlers;
}) {
  const t = useTranslations();
  const alias = props.provider.alias;
  // The row toggles its details on click; the button must not.
  if (props.provider.status === "given")
    return (
      <Button
        variant="outline"
        size="xs"
        onClick={(e) => {
          e.stopPropagation();
          props.handlers.revoke(alias);
        }}
        disabled={props.handlers.revoking}
      >
        {t("FREE_CONSENT.REVOKE_BUTTON")}
      </Button>
    );
  return (
    <Button
      size="xs"
      onClick={(e) => {
        e.stopPropagation();
        props.handlers.open(alias);
      }}
    >
      {t("FREE_CONSENT.GIVE")}
    </Button>
  );
}
