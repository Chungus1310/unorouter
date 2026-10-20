"use client";

import { providerName } from "@/lib/api/provider-consent";
import { DataTableColumnHeader } from "@/components/elements/table/data-table-column-header";
import type { TableFeats } from "@/lib/config/table-features";
import type { ProviderConsentItem } from "@/openapi";
import type { ColumnDef } from "@tanstack/react-table";
import {
  ProviderAction,
  ProviderCountry,
  ProviderCounts,
  ProviderName,
  ProviderStatusBadge,
  type ProviderHandlers,
} from "./provider-parts";

export function buildProviderColumns(opts: {
  handlers: ProviderHandlers;
  countryLabel: (code: string) => string;
}): ColumnDef<TableFeats, ProviderConsentItem>[] {
  return [
    {
      id: "name",
      accessorFn: (p) => providerName(p),
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROVIDER_CONSENT.TABLE.PROVIDER"
        />
      ),
      meta: { headerClassName: "w-[30%]" },
      cell: ({ row }) => <ProviderName provider={row.original} />,
    },
    {
      id: "country",
      accessorFn: (p) => opts.countryLabel(p.country),
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROVIDER_CONSENT.TABLE.COUNTRY"
        />
      ),
      cell: ({ row }) => <ProviderCountry provider={row.original} />,
    },
    {
      id: "models",
      accessorFn: (p) => p.active_channel_count,
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="PROVIDER_CONSENT.TABLE.MODELS"
        />
      ),
      cell: ({ row }) => <ProviderCounts provider={row.original} />,
    },
    {
      id: "status",
      accessorFn: (p) => (p.status === "given" ? 1 : 0),
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title="FREE_CONSENT.TABLE.STATUS"
        />
      ),
      cell: ({ row }) => <ProviderStatusBadge provider={row.original} />,
    },
    {
      id: "actions",
      enableSorting: false,
      header: () => null,
      meta: { headerClassName: "w-24", cellClassName: "text-right" },
      cell: ({ row }) => (
        <ProviderAction provider={row.original} handlers={opts.handlers} />
      ),
    },
  ];
}
