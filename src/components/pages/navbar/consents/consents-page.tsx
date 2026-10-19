"use client";

import { OwnPurposeObjectionToggle } from "@/components/elements/model/own-purpose-objection-toggle";
import {
  ModelConsentPanel,
  ProviderConsentPanel,
} from "@/components/elements/model/provider-consent-panel";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { msg } from "@/lib/config/constants";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import { ModelView } from "./model-view";
import { ProviderView } from "./provider-view";

const TABS = ["providers", "models"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABEL = {
  providers: msg("FREE_CONSENT.TAB_PROVIDERS"),
  models: msg("FREE_CONSENT.TAB_MODELS"),
} satisfies Record<Tab, ReturnType<typeof msg>>;

const TAB_ICON: Record<Tab, IconName> = {
  providers: "server",
  models: "layout-grid",
};

// The open dialog lives in the URL too, so the gateway's refusal can link to
// /consents?model=<name> and land on that model's consent.
const PARSERS = {
  tab: parseAsStringLiteral(TABS).withDefault("providers"),
  view: parseAsStringLiteral(["table", "list"] as const).withDefault("table"),
  model: parseAsString,
  alias: parseAsString,
};

export function ConsentsPage() {
  const t = useTranslations();
  const [params, setParams] = useQueryStates(PARSERS);

  function close() {
    void setParams({ model: null, alias: null });
  }

  return (
    <div className="w-full pt-20 pb-16">
      <div className="mb-4 space-y-3 px-4 md:px-6">
        <h1 className="text-lg font-semibold tracking-tight">
          {t("FREE_CONSENT.PAGE_TITLE")}
        </h1>
        <p className="text-muted-foreground text-sm">
          {t("FREE_CONSENT.PAGE_INTRO")}
        </p>
        <div className="bg-card space-y-2 rounded-lg border p-4">
          <h2 className="text-foreground text-sm font-medium">
            {t("OWN_PURPOSE.TITLE")}
          </h2>
          <OwnPurposeObjectionToggle />
        </div>
        <div className="border-border flex gap-1 border-b pb-px">
          {TABS.map((tab) => {
            const active = params.tab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => void setParams({ tab })}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-1.5 border-b-2 px-3 py-2 font-mono text-sm whitespace-nowrap transition-colors",
                  active
                    ? "border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                <Icon name={TAB_ICON[tab]} className="h-4 w-4" />
                {t(TAB_LABEL[tab])}
              </button>
            );
          })}
        </div>
      </div>

      {params.tab === "providers" ? (
        <ProviderView
          view={params.view}
          onViewChange={(view) => void setParams({ view })}
          onOpen={(alias) => void setParams({ alias, model: null })}
        />
      ) : (
        <ModelView
          view={params.view}
          onViewChange={(view) => void setParams({ view })}
          onOpen={(model) => void setParams({ model, alias: null })}
        />
      )}

      <Dialog
        open={params.model !== null || params.alias !== null}
        onOpenChange={(o) => !o && close()}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto p-0">
          <DialogTitle className="sr-only">
            {t("PROVIDER_CONSENT.TITLE")}
          </DialogTitle>
          {params.model !== null ? (
            <ModelConsentPanel model={params.model} onDone={close} />
          ) : params.alias !== null ? (
            <ProviderConsentPanel alias={params.alias} onDone={close} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
