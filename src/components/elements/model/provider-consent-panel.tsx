"use client";

import { FreeConsentPanel } from "@/components/elements/model/free-consent-panel";
import { countryName } from "@/components/elements/model/group-data-policy";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import {
  useGrantProviderConsentMutation,
  useModelProviderConsentsQuery,
  useProviderConsentsQuery,
} from "@/hooks/auth/provider-consent-hook";
import { useApiKey } from "@/hooks/ui/use-api-key";
import { APP_VALUES } from "@/lib/config/constants";
import type { ProviderConsentItem } from "@/openapi";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

function PanelLoader() {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Icon
        name="loader"
        className="text-muted-foreground h-5 w-5 animate-spin"
      />
    </div>
  );
}

// From the model view the gateway grants every missing provider of the model;
// from the provider view exactly the one alias.
function useTargets(props: { model?: string; alias?: string }) {
  const modelQuery = useModelProviderConsentsQuery(
    props.model ?? null,
    props.model !== undefined,
  );
  const listQuery = useProviderConsentsQuery(props.model === undefined);
  if (props.model !== undefined) {
    if (!modelQuery.data) return null;
    return (modelQuery.data.providers ?? []).filter(
      (p) => p.status === "missing",
    );
  }
  if (!listQuery.data) return null;
  return (listQuery.data.providers ?? []).filter(
    (p) => p.alias === props.alias,
  );
}

export function ProviderConsentPanel(props: {
  model?: string;
  alias?: string;
  onDone?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const token = useApiKey();
  const grantMutation = useGrantProviderConsentMutation();
  const found = useTargets(props);
  const [declined, setDeclined] = useState(false);

  if (!found) return <PanelLoader />;
  const targets = found;

  if (targets.length === 0)
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center p-4 sm:p-8">
        <div className="bg-card my-auto w-full max-w-xl space-y-3 rounded-lg border p-5">
          <p className="text-muted-foreground text-sm">
            {t("PROVIDER_CONSENT.NOTHING_MISSING")}
          </p>
          {props.onDone && (
            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={props.onDone}>
                {t("PROVIDER_CONSENT.CLOSE")}
              </Button>
            </div>
          )}
        </div>
      </div>
    );

  const named = (p: ProviderConsentItem) =>
    `${p.alias} (${countryName(p.country, locale)})`;
  const unsafe = [
    ...new Set(
      targets
        .filter((p) => p.unsafe)
        .map((p) => countryName(p.country, locale)),
    ),
  ];
  const where = token.isLoggedIn
    ? t("FREE_CONSENT.WHERE_ACCOUNT")
    : t("FREE_CONSENT.WHERE_GUEST");
  const title = t("PROVIDER_CONSENT.TITLE");
  const paragraphs = [
    t("PROVIDER_CONSENT.PROVIDERS", {
      providers: targets.map(named).join(", "),
    }),
    ...(props.model
      ? [t("PROVIDER_CONSENT.FOR_MODEL", { model: props.model })]
      : []),
    ...(unsafe.length > 0
      ? [t("FREE_CONSENT.RISK", { countries: unsafe.join(", ") })]
      : []),
    targets.some((p) => p.trains_or_retains)
      ? t("FREE_CONSENT.MAY_USE")
      : t("FREE_CONSENT.MAY_USE_UNKNOWN"),
    t("FREE_CONSENT.NO_INFLUENCE", APP_VALUES),
    t("FREE_CONSENT.THIRD_PARTY"),
    t("PROVIDER_CONSENT.CONSENT"),
    t("FREE_CONSENT.REVOKE", { where }),
    t("FREE_CONSENT.MORE_INFO"),
  ];

  function confirm() {
    // Stored verbatim on every granted row; the gateway checks it names each alias.
    const text = [title, ...paragraphs].join("\n\n");
    grantMutation.mutate(
      {
        body: {
          aliases: props.model ? [] : targets.map((p) => p.alias),
          model: props.model ?? "",
          locale,
          text,
        },
      },
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
            {t("FREE_CONSENT.CONFIRM")}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Providers the gateway requires a consent for get the provider consent; a
// model without any (a :free model that needs only the notice) keeps the
// model panel.
export function ModelConsentPanel(props: {
  model: string;
  onDone?: () => void;
}) {
  const query = useModelProviderConsentsQuery(props.model);
  if (!query.data) return <PanelLoader />;
  if ((query.data.providers ?? []).length > 0)
    return <ProviderConsentPanel model={props.model} onDone={props.onDone} />;
  return <FreeConsentPanel model={props.model} onDone={props.onDone} />;
}
