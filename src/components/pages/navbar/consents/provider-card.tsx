"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import type { ProviderConsentItem } from "@/openapi";
import {
  ProviderAction,
  ProviderCountry,
  ProviderCounts,
  ProviderDetails,
  ProviderName,
  ProviderStatusBadge,
  type ProviderHandlers,
} from "./provider-parts";

export function ProviderCard(props: {
  provider: ProviderConsentItem;
  handlers: ProviderHandlers;
}) {
  return (
    <Collapsible
      className={cn(
        "border-border/60 border-b px-2 py-3",
        !props.provider.active && "opacity-60",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <ProviderName provider={props.provider} />
        </div>
        <ProviderStatusBadge provider={props.provider} />
        <ProviderAction provider={props.provider} handlers={props.handlers} />
      </div>
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group/pc mt-1 flex w-full min-w-0 items-center gap-3 text-left text-sm">
        <span className="min-w-0 flex-1">
          <ProviderCountry provider={props.provider} />
        </span>
        <ProviderCounts provider={props.provider} />
        <Icon
          name="chevron-down"
          className="h-3.5 w-3.5 shrink-0 transition-transform group-data-panel-open/pc:rotate-180"
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ProviderDetails provider={props.provider} />
      </CollapsibleContent>
    </Collapsible>
  );
}
