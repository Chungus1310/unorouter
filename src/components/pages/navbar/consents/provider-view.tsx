"use client";

import { countryName } from "@/components/elements/model/group-data-policy";
import { DataTable } from "@/components/elements/table/data-table";
import { ModelsEmpty } from "@/components/pages/navbar/models/browse/models-empty";
import {
  ResetFiltersButton,
  SearchInput,
} from "@/components/pages/navbar/models/browse/models-toolbar";
import { SortMenu } from "@/components/pages/navbar/models/filters/sort-filter";
import {
  ViewModeButtons,
  type ViewMode,
} from "@/components/pages/navbar/models/filters/view-mode-toggle";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  useProviderConsentsQuery,
  useRevokeProviderConsentMutation,
} from "@/hooks/auth/provider-consent-hook";
import { msg } from "@/lib/config/constants";
import { DataTableId } from "@/lib/types/enums";
import { createTableAtoms } from "@/store/data-table-store";
import { useAtomValue, useSetAtom } from "jotai";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { buildProviderColumns } from "./provider-columns";
import { ProviderCard } from "./provider-card";
import { ProviderFilterSidebar } from "./provider-filter-sidebar";
import type { ProviderHandlers } from "./provider-parts";
import { PROVIDER_SORT_VALUES, type ProviderSort } from "./provider-rows";
import { useProviderFilters } from "./use-provider-filters";

const providerTableAtoms = createTableAtoms(DataTableId.PROVIDER_CONSENTS);

const SORT_LABEL = {
  modelsDesc: msg("PROVIDER_CONSENT.SORT.MODELS_DESC"),
  alias: msg("PROVIDER_CONSENT.SORT.ALIAS"),
  country: msg("PROVIDER_CONSENT.SORT.COUNTRY"),
} satisfies Record<ProviderSort, ReturnType<typeof msg>>;

export function ProviderView(props: {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onOpen: (alias: string) => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const providersQuery = useProviderConsentsQuery();
  const revokeMutation = useRevokeProviderConsentMutation();
  const providers = providersQuery.data?.providers ?? [];
  const filters = useProviderFilters(providers);
  const params = filters.params;
  const columnSorting = useAtomValue(providerTableAtoms.sortingAtom);
  const setColumnSorting = useSetAtom(providerTableAtoms.sortingAtom);

  const handlers: ProviderHandlers = {
    open: props.onOpen,
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
  const columns = buildProviderColumns({
    handlers,
    countryLabel: (code) => countryName(code, locale),
  });

  const showReset =
    filters.activeFilterCount > 0 ||
    params.porder.length > 0 ||
    columnSorting.length > 0;
  function resetAll() {
    filters.reset();
    setColumnSorting([]);
  }
  const search = (className: string) => (
    <SearchInput
      className={className}
      placeholder={t("PROVIDER_CONSENT.SEARCH")}
      value={params.pq}
      onChange={(pq) => void filters.setParams({ pq: pq || null })}
    />
  );

  return (
    <SidebarProvider
      defaultOpen
      className="relative h-auto min-h-0 overflow-visible"
    >
      <ProviderFilterSidebar providers={providers} filters={filters} />
      <SidebarInset className="@container max-h-none! min-w-0 overflow-visible bg-transparent px-4 md:px-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <SidebarTrigger
            aria-label={t("MODELS.FILTER.TITLE")}
            className="size-8 shrink-0 border"
          />
          <div className="ml-auto flex flex-1 items-center justify-end gap-2">
            {showReset && (
              <ResetFiltersButton
                activeFilterCount={filters.activeFilterCount}
                onReset={resetAll}
              />
            )}
            {search("relative hidden w-full max-w-xs lg:block")}
            <SortMenu
              options={PROVIDER_SORT_VALUES}
              label={(key) => t(SORT_LABEL[key])}
              value={params.porder}
              active={filters.activeSort}
              onChange={(porder) => void filters.setParams({ porder })}
            />
            <ViewModeButtons value={props.view} onChange={props.onViewChange} />
          </div>
        </div>
        {search("relative mb-3 w-full lg:hidden")}
        <div className="min-h-svh">
          {!providersQuery.isLoading && filters.filtered.length === 0 ? (
            <ModelsEmpty
              filtered={showReset}
              count={filters.activeFilterCount}
              onReset={resetAll}
            />
          ) : props.view === "table" ? (
            <DataTable
              id={DataTableId.PROVIDER_CONSENTS}
              data={filters.filtered}
              columns={columns}
              localSorting
              isLoading={providersQuery.isLoading}
              stickyHeaderTop="3.5rem"
            />
          ) : (
            filters.filtered.map((provider) => (
              <ProviderCard
                key={provider.alias}
                provider={provider}
                handlers={handlers}
              />
            ))
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
