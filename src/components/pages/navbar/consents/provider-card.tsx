"use client";

import { cn } from "@/lib/utils";
import type { ProviderConsentItem } from "@/openapi";
import {
  ProviderAction,
  ProviderCountry,
  ProviderModels,
  ProviderName,
  ProviderStatusText,
  type ProviderHandlers,
} from "./provider-parts";

export function ProviderCard(props: {
  provider: ProviderConsentItem;
  handlers: ProviderHandlers;
}) {
  return (
    <div
      className={cn(
        "border-border/60 flex items-start justify-between gap-4 border-b px-2 py-5",
        !props.provider.active && "opacity-60",
      )}
    >
      <div className="min-w-0 space-y-2">
        <div className="text-lg">
          <ProviderName provider={props.provider} />
        </div>
        <div className="text-muted-foreground text-sm">
          <ProviderCountry provider={props.provider} />
        </div>
        <ProviderModels provider={props.provider} />
        <ProviderStatusText provider={props.provider} />
      </div>
      <div className="shrink-0">
        <ProviderAction provider={props.provider} handlers={props.handlers} />
      </div>
    </div>
  );
}
