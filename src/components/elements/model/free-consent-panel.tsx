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

// Destinations are the countries the gateway computed for the consent, else
// the seat of every group behind the model. Operators stay unnamed (which
// upstreams serve us is a business secret); a group without a recorded seat
// adds "unknown", so the list never claims fewer destinations. Only seats the
// gateway flags as unsafe third countries are named as a risk, never the EEA.
function useConsentScope(model: string) {
  const t = useTranslations();
  const locale = useLocale();
  const groups = useModelGroupsQuery(model).data;
  if (!groups) return null;
  const unknown = t("FREE_CONSENT.UNKNOWN_COUNTRY");
  const covered = groups.own_purpose?.countries ?? [];
  const destinations = new Set<string>(
    covered.map((code) => countryName(code, locale)),
  );
  const unsafe = new Set<string>();
  const free = model.toLowerCase().endsWith(":free");
  for (const group of groups.enable_groups) {
    const policy = Object.hasOwn(groups.group_providers, group)
      ? groups.group_providers[group]
      : undefined;
    const seat = policy?.seat_country
      ? countryName(policy.seat_country, locale)
      : unknown;
    if (!policy?.seat_country || covered.length === 0) destinations.add(seat);
    const ownPurpose =
      policy?.prompts === "trains" ||
      policy?.prompts === "retains" ||
      (free && policy?.prompts !== "none");
    if (policy?.unsafe_third_country && ownPurpose) unsafe.add(seat);
  }
  if (destinations.size === 0) destinations.add(unknown);
  return {
    destinations: [...destinations],
    unsafe: [...unsafe],
    consentRequired: groups.own_purpose?.consent_required ?? false,
    trainsOrRetains: groups.own_purpose?.trains_or_retains ?? false,
  };
}

export function FreeConsentPanel(props: {
  model: string;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const token = useApiKey();
  const grantMutation = useGrantFreeConsentMutation();
  const scope = useConsentScope(props.model);
  const [declined, setDeclined] = useState(false);

  if (!scope)
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
  // A :free model the gateway does not require a consent for still takes an
  // acknowledgement, but no transfer consent or risk statement.
  const notice = !scope.consentRequired;
  const title = notice
    ? t("FREE_CONSENT.NOTICE_TITLE")
    : t("FREE_CONSENT.TITLE");
  const paragraphs = [
    t("FREE_CONSENT.PROVIDED_BY", {
      model: props.model,
      countries: scope.destinations.join(", "),
    }),
    ...(!notice && scope.unsafe.length > 0
      ? [t("FREE_CONSENT.RISK", { countries: scope.unsafe.join(", ") })]
      : []),
    scope.trainsOrRetains
      ? t("FREE_CONSENT.MAY_USE")
      : t("FREE_CONSENT.MAY_USE_UNKNOWN"),
    t("FREE_CONSENT.NO_INFLUENCE", APP_VALUES),
    t("FREE_CONSENT.THIRD_PARTY"),
    notice ? t("FREE_CONSENT.NOTICE_ACK") : t("FREE_CONSENT.CONSENT"),
    notice
      ? t("FREE_CONSENT.NOTICE_REVOKE", { where })
      : t("FREE_CONSENT.REVOKE", { where }),
    t("FREE_CONSENT.MORE_INFO"),
  ];

  function confirm() {
    // Stored verbatim: the consent is only provable with the text it was given to.
    const text = [title, ...paragraphs].join("\n\n");
    grantMutation.mutate(
      { body: { model: props.model, locale, text } },
      {
        onSuccess: () => {
          toast.success(
            notice ? t("FREE_CONSENT.NOTICE_SAVED") : t("FREE_CONSENT.SAVED"),
          );
          props.onDone?.();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center overflow-y-auto p-4 sm:p-8">
      <div className="bg-card my-auto w-full max-w-xl space-y-3 rounded-lg border p-5">
        <h2 className="text-foreground text-base font-medium">{title}</h2>
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
            {notice
              ? t("FREE_CONSENT.NOTICE_CONFIRM")
              : t("FREE_CONSENT.CONFIRM")}
          </Button>
        </div>
      </div>
    </div>
  );
}
