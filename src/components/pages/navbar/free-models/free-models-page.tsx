"use client";

import { FreeConsentPanel } from "@/components/elements/model/free-consent-panel";
import { OwnPurposeBadge } from "@/components/elements/model/group-data-policy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  useFreeConsentsQuery,
  useRevokeFreeConsentMutation,
} from "@/hooks/auth/free-consent-hook";
import { useFreeModelsQuery } from "@/hooks/models/pricing-hook";
import { useOwnPurposeEnabled } from "@/hooks/ops/status-hook";
import { needsTransferConsent } from "@/lib/api/own-purpose";
import { formatLongDate } from "@/lib/utils/format/date";
import { ModalityTabs } from "@/components/pages/navbar/models/filters/modality-tabs";
import { matchesModality, type OutputModality } from "@/lib/api/model-modality";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

// Consent per model outside the chat, offline models included, so API users
// can enable a model before their first request.
export function FreeModelsPage() {
  const t = useTranslations();
  const enabled = useOwnPurposeEnabled();
  const freeModelsQuery = useFreeModelsQuery();
  const consentsQuery = useFreeConsentsQuery();
  const revokeMutation = useRevokeFreeConsentMutation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [modality, setModality] = useState<OutputModality>("all");

  // A consent that no longer covers the current providers has to be renewed.
  const consents = new Map(
    (consentsQuery.data?.consents ?? [])
      .filter((c) => !enabled || c.covers !== false)
      .map((c) => [c.model, c.created_at]),
  );
  const needle = search.trim().toLowerCase();
  const allModels = freeModelsQuery.data ?? [];
  const models = allModels
    .filter((m) => matchesModality(m, modality))
    .filter((m) => !needle || m.model_name.toLowerCase().includes(needle))
    .sort((a, b) => a.model_name.localeCompare(b.model_name));

  function revoke(model: string) {
    revokeMutation.mutate(
      { body: { model } },
      {
        onSuccess: () => toast.success(t("FREE_CONSENT.REVOKED")),
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-3 pt-16 pb-10 sm:px-6 sm:pt-20">
      <div className="space-y-2">
        <h1 className="text-foreground text-2xl font-bold tracking-tight">
          {t(
            enabled
              ? "FREE_CONSENT.TRAINING_USE.PAGE_TITLE"
              : "FREE_CONSENT.PAGE_TITLE",
          )}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t(
            enabled
              ? "FREE_CONSENT.TRAINING_USE.PAGE_INTRO"
              : "FREE_CONSENT.PAGE_INTRO",
          )}
        </p>
      </div>
      <ModalityTabs
        models={allModels}
        value={modality}
        onChange={setModality}
      />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("FREE_CONSENT.SEARCH")}
      />
      <ul className="divide-y rounded-lg border">
        {models.map((m) => {
          const grantedAt = consents.get(m.model_name);
          return (
            <li
              key={m.model_name}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground truncate font-mono text-sm">
                    {m.model_name}
                  </span>
                  <OwnPurposeBadge ownPurpose={m.own_purpose} />
                  {!m.online && (
                    <Badge variant="outline">{t("FREE_CONSENT.OFFLINE")}</Badge>
                  )}
                </div>
                {grantedAt != null && (
                  <p className="text-muted-foreground text-xs">
                    {t("FREE_CONSENT.GRANTED_ON", {
                      date: formatLongDate(grantedAt),
                    })}
                  </p>
                )}
              </div>
              {grantedAt != null ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revoke(m.model_name)}
                  disabled={revokeMutation.isPending}
                >
                  {t("FREE_CONSENT.REVOKE_BUTTON")}
                </Button>
              ) : needsTransferConsent(m, enabled) ? (
                <Button size="sm" onClick={() => setOpen(m.model_name)}>
                  {t("FREE_CONSENT.GIVE")}
                </Button>
              ) : (
                <span className="text-muted-foreground shrink-0 text-xs">
                  {t("FREE_CONSENT.NOT_NEEDED")}
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <Dialog open={open !== null} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {t("FREE_CONSENT.TITLE")}
          </DialogTitle>
          {open && (
            <FreeConsentPanel model={open} onDone={() => setOpen(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
