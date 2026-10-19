"use client";

import { DataTable } from "@/components/elements/table/data-table";
import { FreeConsentPanel } from "@/components/elements/model/free-consent-panel";
import { OwnPurposeObjectionToggle } from "@/components/elements/model/own-purpose-objection-toggle";
import { ModelsEmpty } from "@/components/pages/navbar/models/browse/models-empty";
import {
  ResetFiltersButton,
  SearchInput,
} from "@/components/pages/navbar/models/browse/models-toolbar";
import { ModalityTabs } from "@/components/pages/navbar/models/filters/modality-tabs";
import { ViewModeButtons } from "@/components/pages/navbar/models/filters/view-mode-toggle";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  useFreeConsentsQuery,
  useRevokeFreeConsentMutation,
} from "@/hooks/auth/free-consent-hook";
import { useFreeModelsQuery } from "@/hooks/models/pricing-hook";
import { DataTableId } from "@/lib/types/enums";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { KIND_LABEL, type ConsentHandlers } from "./consent-action";
import { buildConsentColumns } from "./consent-columns";
import { ConsentFilterSidebar } from "./consent-filter-sidebar";
import { ConsentModelCard } from "./consent-model-card";
import { buildConsentRows } from "./consent-rows";
import { useConsentFilters } from "./use-consent-filters";

// Every model that takes a consent or a notice, or whose providers use inputs
// for their own purposes, offline ones included, so API users can consent
// before their first request.
export function FreeModelsPage() {
  const t = useTranslations();
  const freeModelsQuery = useFreeModelsQuery();
  const consentsQuery = useFreeConsentsQuery();
  const revokeMutation = useRevokeFreeConsentMutation();
  const [open, setOpen] = useState<string | null>(null);

  const rows = buildConsentRows(
    freeModelsQuery.data ?? [],
    consentsQuery.data?.consents ?? [],
  );
  const filters = useConsentFilters(rows);
  const params = filters.params;

  const handlers: ConsentHandlers = {
    open: setOpen,
    revoke: (model) =>
      revokeMutation.mutate(
        { body: { model } },
        {
          onSuccess: () => toast.success(t("FREE_CONSENT.REVOKED")),
          onError: (error) => toast.error(error.message),
        },
      ),
    revoking: revokeMutation.isPending,
  };

  const columns = buildConsentColumns({
    handlers,
    kindLabel: (row) => t(KIND_LABEL[row.kind]),
    offlineLabel: t("FREE_CONSENT.OFFLINE"),
    freeLabel: t("MODELS.TABLE.FREE"),
    flatNoParamsLabel: t("MODELS.TABLE.FLAT_NO_PARAMS"),
  });

  const loading = freeModelsQuery.isLoading || consentsQuery.isLoading;
  const showReset = filters.activeFilterCount > 0;

  return (
    <div className="w-full pt-20 pb-16">
      <SidebarProvider
        defaultOpen
        className="relative h-auto min-h-0 overflow-visible"
      >
        <ConsentFilterSidebar rows={rows} filters={filters} />

        <SidebarInset className="@container max-h-none! min-w-0 overflow-visible bg-transparent px-4 md:px-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h1 className="mr-2 basis-full text-lg font-semibold tracking-tight @5xl:basis-auto">
              {t("FREE_CONSENT.PAGE_TITLE")}
            </h1>
            <div className="ml-auto flex flex-1 items-center justify-end gap-2">
              {showReset && (
                <ResetFiltersButton
                  activeFilterCount={filters.activeFilterCount}
                  onReset={filters.reset}
                />
              )}
              <SearchInput
                className="relative hidden w-full max-w-xs lg:block"
                placeholder={t("FREE_CONSENT.SEARCH")}
                value={params.q}
                onChange={(q) => void filters.setParams({ q: q || null })}
              />
              <ViewModeButtons
                value={params.view}
                onChange={(view) => void filters.setParams({ view })}
              />
            </div>
          </div>

          <div className="mb-4 space-y-3">
            <p className="text-muted-foreground text-sm">
              {t("FREE_CONSENT.PAGE_INTRO")}
            </p>
            <div className="bg-card space-y-2 rounded-lg border p-4">
              <h2 className="text-foreground text-sm font-medium">
                {t("OWN_PURPOSE.TITLE")}
              </h2>
              <OwnPurposeObjectionToggle />
            </div>
          </div>

          <div className="scroll-surface sticky top-14 z-20 flex h-9.75 items-center gap-2 overflow-hidden">
            <SidebarTrigger
              aria-label={t("MODELS.FILTER.TITLE")}
              className="size-8 shrink-0 border"
            />
            <ModalityTabs
              models={filters.tabRows.map((row) => row.model)}
              value={params.modality}
              onChange={(modality) => void filters.setParams({ modality })}
            />
          </div>

          <SearchInput
            className="relative mt-3 w-full lg:hidden"
            placeholder={t("FREE_CONSENT.SEARCH")}
            value={params.q}
            onChange={(q) => void filters.setParams({ q: q || null })}
          />

          <div className="mt-4 min-h-svh">
            {!loading && filters.filtered.length === 0 ? (
              <ModelsEmpty
                filtered={showReset}
                count={filters.activeFilterCount}
                onReset={filters.reset}
              />
            ) : params.view === "table" ? (
              <DataTable
                id={DataTableId.FREE_MODELS}
                data={filters.filtered}
                columns={columns}
                localSorting
                windowVirtual
                isLoading={loading}
                stickyHeaderTop="calc(3.5rem + 2.4375rem)"
              />
            ) : (
              filters.filtered.map((row) => (
                <ConsentModelCard
                  key={row.model.model_name}
                  row={row}
                  handlers={handlers}
                />
              ))
            )}
          </div>
        </SidebarInset>
      </SidebarProvider>

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
