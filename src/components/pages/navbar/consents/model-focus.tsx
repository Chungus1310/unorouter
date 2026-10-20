"use client";

import { FreeConsentPanel } from "@/components/elements/model/free-consent-panel";
import { ProviderConsentPanel } from "@/components/elements/model/provider-consent-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import {
  useModelProviderConsentsQuery,
  useRevokeProviderConsentMutation,
} from "@/hooks/auth/provider-consent-hook";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import type { ViewMode } from "@/components/pages/navbar/models/filters/view-mode-toggle";
import { DataTableId } from "@/lib/types/enums";
import { ProviderList } from "./provider-list";
import type { ProviderHandlers } from "./provider-parts";

// The landing for /consents?model=<name>, where the gateway's refusal links:
// only the providers this model still needs, granted in one step.
export function ModelFocus(props: {
  model: string;
  view: ViewMode;
  onClear: () => void;
  onOpenAlias: (alias: string) => void;
}) {
  const t = useTranslations();
  const query = useModelProviderConsentsQuery(props.model);
  const revokeMutation = useRevokeProviderConsentMutation();
  const [granting, setGranting] = useState(false);

  const handlers: ProviderHandlers = {
    open: props.onOpenAlias,
    revoke: (alias) =>
      revokeMutation.mutate(
        { body: { alias } },
        {
          onSuccess: () => toast.success(t("FREE_CONSENT.REVOKED")),
          onError: (error) => toast.error(error.message),
        },
      ),
    revoking: revokeMutation.isPending,
  };

  const chip = (
    <Badge variant="secondary" className="gap-1 font-mono">
      {props.model}
      <button
        type="button"
        onClick={props.onClear}
        aria-label={t("PROVIDER_CONSENT.FOCUS.CLEAR")}
        className="hover:text-foreground"
      >
        <Icon name="x" className="h-3 w-3" />
      </button>
    </Badge>
  );
  const backLink = (
    <Button variant="outline" size="sm" onClick={props.onClear}>
      {t("PROVIDER_CONSENT.FOCUS.BACK")}
    </Button>
  );

  if (!query.data)
    return (
      <div className="flex justify-center p-8">
        <Icon
          name="loader"
          className="text-muted-foreground h-5 w-5 animate-spin"
        />
      </div>
    );

  const providers = query.data.providers ?? [];
  const missing = providers.filter((p) => p.status === "missing");
  const covered = providers.filter((p) => p.status !== "missing");

  // No provider consent behind this model: a :free notice or nothing at all.
  if (providers.length === 0)
    return (
      <div className="space-y-4 px-4 md:px-6">
        <div className="flex flex-wrap items-center gap-2">{chip}</div>
        {props.model.toLowerCase().endsWith(":free") ? (
          <FreeConsentPanel model={props.model} onDone={props.onClear} />
        ) : (
          <div className="bg-card space-y-3 rounded-lg border p-5">
            <p className="text-muted-foreground text-sm">
              {t("PROVIDER_CONSENT.FOCUS.NONE_NEEDED", { model: props.model })}
            </p>
            {backLink}
          </div>
        )}
      </div>
    );

  return (
    <div className="space-y-4 px-4 md:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-foreground text-base font-medium">
          {missing.length > 0
            ? t("PROVIDER_CONSENT.FOCUS.TITLE", { model: props.model })
            : t("PROVIDER_CONSENT.FOCUS.COVERED", { model: props.model })}
        </h2>
        {chip}
        {missing.length > 0 && (
          <Button
            size="sm"
            className="ml-auto"
            onClick={() => setGranting(true)}
          >
            {t("PROVIDER_CONSENT.FOCUS.GRANT_ALL", { count: missing.length })}
          </Button>
        )}
      </div>

      {missing.length > 0 ? (
        <ProviderList
          id={DataTableId.PROVIDER_CONSENTS_MODEL}
          providers={missing}
          view={props.view}
          handlers={handlers}
        />
      ) : (
        <div className="bg-card flex flex-wrap items-center gap-3 rounded-lg border p-5">
          <Icon name="circle-check" className="text-success h-5 w-5" />
          <p className="text-muted-foreground flex-1 text-sm">
            {t("PROVIDER_CONSENT.FOCUS.COVERED_HINT")}
          </p>
          {backLink}
        </div>
      )}

      {covered.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group/cv flex items-center gap-1 text-sm">
            {t("PROVIDER_CONSENT.FOCUS.ALREADY_GIVEN", {
              count: covered.length,
            })}
            <Icon
              name="chevron-down"
              className="h-4 w-4 transition-transform group-data-panel-open/cv:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ProviderList
              id={DataTableId.PROVIDER_CONSENTS_MODEL}
              providers={covered}
              view={props.view}
              handlers={handlers}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      <Dialog open={granting} onOpenChange={setGranting}>
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {t("PROVIDER_CONSENT.TITLE")}
          </DialogTitle>
          {granting && (
            <ProviderConsentPanel
              model={props.model}
              onDone={() => setGranting(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
