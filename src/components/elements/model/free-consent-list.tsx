"use client";

import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import {
  useFreeConsentsQuery,
  useRevokeFreeConsentMutation,
} from "@/hooks/auth/free-consent-hook";
import { formatLongDate } from "@/lib/utils/format/date";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function FreeConsentList() {
  const t = useTranslations();
  const consentsQuery = useFreeConsentsQuery();
  const revokeMutation = useRevokeFreeConsentMutation();
  const consents = consentsQuery.data?.consents ?? [];

  function revoke(model: string) {
    revokeMutation.mutate(
      { body: { model } },
      {
        onSuccess: () => toast.success(t("FREE_CONSENT.REVOKED")),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const allModelsLink = (
    <Link
      href="/free-models"
      className="text-primary text-sm underline-offset-4 hover:underline"
    >
      {t("FREE_CONSENT.ALL_MODELS")}
    </Link>
  );

  if (consentsQuery.isSuccess && consents.length === 0)
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          {t("FREE_CONSENT.SETTINGS_EMPTY")}
        </p>
        {allModelsLink}
      </div>
    );

  return (
    <div className="space-y-2">
      <ul className="divide-y">
        {consents.map((consent) => (
          <li
            key={consent.model}
            className="flex items-center justify-between gap-3 py-2"
          >
            <div className="min-w-0">
              <p className="text-foreground truncate font-mono text-sm">
                {consent.model}
              </p>
              <p className="text-muted-foreground text-xs">
                {t("FREE_CONSENT.GRANTED_ON", {
                  date: formatLongDate(consent.created_at),
                })}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => revoke(consent.model)}
              disabled={revokeMutation.isPending}
            >
              {t("FREE_CONSENT.REVOKE_BUTTON")}
            </Button>
          </li>
        ))}
      </ul>
      {allModelsLink}
    </div>
  );
}
