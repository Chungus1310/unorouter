"use client";

import { countryName } from "@/components/elements/model/group-data-policy";
import { DataTable } from "@/components/elements/table/data-table";
import type { ViewMode } from "@/components/pages/navbar/models/filters/view-mode-toggle";
import type { DataTableId } from "@/lib/types/enums";
import type { ProviderConsentItem } from "@/openapi";
import { useLocale } from "next-intl";
import { buildProviderColumns } from "./provider-columns";
import { ProviderCard } from "./provider-card";
import { ProviderDetails, type ProviderHandlers } from "./provider-parts";

// One rendering for the providers tab and the per-model view: single-line
// rows, details (lanes, every model) in the expanded row.
export function ProviderList(props: {
  id: DataTableId;
  providers: ProviderConsentItem[];
  view: ViewMode;
  handlers: ProviderHandlers;
  isLoading?: boolean;
}) {
  const locale = useLocale();
  const columns = buildProviderColumns({
    handlers: props.handlers,
    countryLabel: (code) => countryName(code, locale),
  });
  if (props.view === "list")
    return (
      <div>
        {props.providers.map((provider) => (
          <ProviderCard
            key={provider.alias}
            provider={provider}
            handlers={props.handlers}
          />
        ))}
      </div>
    );
  return (
    <DataTable
      id={props.id}
      data={props.providers}
      columns={columns}
      localSorting
      isLoading={props.isLoading}
      rowClassName={(row) => (row.original.active ? undefined : "opacity-60")}
      getRowCanExpand={() => true}
      renderExpandedRow={(row) => <ProviderDetails provider={row.original} />}
    />
  );
}
