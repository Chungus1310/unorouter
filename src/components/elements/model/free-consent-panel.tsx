"use client";

import { countryName } from "@/components/elements/model/group-data-policy";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { useGrantFreeConsentMutation } from "@/hooks/auth/free-consent-hook";
import { useModelGroupsQuery } from "@/hooks/models/pricing-hook";
import { useApiKey } from "@/hooks/ui/use-api-key";
import { APP_VALUES } from "@/lib/config/constants";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

// The destinations the consent covers as the gateway computed them, else the
// seat countries of every group behind the model. Operators stay unnamed
// (which upstreams serve us is a business secret); a group without a recorded
// seat adds "unknown", so the list never claims fewer destinations.
function useSeatCountries(model: string): string[] | null {
  const t = useTranslations();
  const locale = useLocale();
  const groups = useModelGroupsQuery(model).data;
  if (!groups) return null;
  const covered = groups.own_purpose?.countries ?? [];
  const labels = new Set<string>(
    covered.map((code) => countryName(code, locale)),
  );
  for (const group of groups.enable_groups) {
    const policy = Object.hasOwn(groups.group_providers, group)
      ? groups.group_providers[group]
      : undefined;
    if (!policy?.seat_country) labels.add(t("FREE_CONSENT.UNKNOWN_COUNTRY"));
    else if (covered.length === 0)
      labels.add(countryName(policy.seat_country, locale));
  }
  if (labels.size === 0) labels.add(t("FREE_CONSENT.UNKNOWN_COUNTRY"));
  return [...labels];
}

export function FreeConsentPanel(props: {
  model: string;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const token = useApiKey();
  const grantMutation = useGrantFreeConsentMutation();
  const countries = useSeatCountries(props.model);
  const [declined, setDeclined] = useState(false);

  if (!countries)
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Icon
          name="loader"
          className="text-muted-foreground h-5 w-5 animate-spin"
        />
      </div>
    );

  const where = token.isLoggedIn
    ? t("FREE_CONSENT.WHERE_ACCOUNT")
    : t("FREE_CONSENT.WHERE_GUEST");
  const paragraphs = [
    t("FREE_CONSENT.PROVIDED_BY", {
      model: props.model,
      countries: countries.join(", "),
    }),
    t("FREE_CONSENT.RISK"),
    t("FREE_CONSENT.MAY_USE"),
    t("FREE_CONSENT.NO_INFLUENCE", APP_VALUES),
    t("FREE_CONSENT.THIRD_PARTY"),
    t("FREE_CONSENT.CONSENT"),
    t("FREE_CONSENT.REVOKE", { where }),
    t("FREE_CONSENT.MORE_INFO"),
  ];

  function confirm() {
    // Stored verbatim: the consent is only provable with the text it was given to.
    const text = [t("FREE_CONSENT.TITLE"), ...paragraphs].join("\n\n");
    grantMutation.mutate(
      { body: { model: props.model, locale, text } },
      {
        onSuccess: () => {
          toast.success(t("FREE_CONSENT.SAVED"));
          props.onDone?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto p-4 sm:p-8">
      <div className="bg-card my-auto w-full max-w-xl space-y-3 rounded-lg border p-5">
        <h2 className="text-foreground text-base font-medium">
          {t("FREE_CONSENT.TITLE")}
        </h2>
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-muted-foreground text-sm">
            {paragraph}
          </p>
        ))}
        <Link
          href="/privacy"
          target="_blank"
          className="text-primary inline-block text-sm underline-offset-4 hover:underline"
        >
          {t("FREE_CONSENT.PRIVACY_LINK")}
        </Link>
        {declined && (
          <p className="text-foreground text-sm font-medium">
            {t("FREE_CONSENT.DECLINED")}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => (props.onDone ? props.onDone() : setDeclined(true))}
            disabled={grantMutation.isPending}
          >
            {t("FREE_CONSENT.DECLINE")}
          </Button>
          <Button
            size="sm"
            onClick={confirm}
            disabled={grantMutation.isPending}
          >
            {t("FREE_CONSENT.CONFIRM")}
          </Button>
        </div>
      </div>
    </div>
  );
}
