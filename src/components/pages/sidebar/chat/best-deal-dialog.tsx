"use client";

import { VendorIcon } from "@/components/elements/brand/vendor-icon";
import { ModelPicker } from "@/components/pages/navbar/models/compare/model-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Icon } from "@/components/ui/icon";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { usePricingCatalogQuery } from "@/hooks/models/pricing-hook";
import { blendedPrice, pickBestDeal } from "@/lib/ai/chat/best-deal";
import {
  bestDiscountPercent,
  formatPriceCompact,
} from "@/lib/utils/format/number";
import { bestDealAtom } from "@/store/chat-store";
import { useAtom } from "jotai";
import { useTranslations } from "next-intl";

export function BestDealDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const [bestDeal, setBestDeal] = useAtom(bestDealAtom);
  const models = (usePricingCatalogQuery().data?.models ?? []).filter(
    (m) => m.chat && blendedPrice(m) !== null,
  );
  const pick = pickBestDeal(models, bestDeal.pool);
  const pool = bestDeal.pool
    .map((name) => models.find((m) => m.model_name === name))
    .filter((m) => m !== undefined)
    .sort((a, b) => (blendedPrice(a) ?? 0) - (blendedPrice(b) ?? 0));

  const setPool = (next: string[]) =>
    setBestDeal({ enabled: bestDeal.enabled && next.length > 0, pool: next });

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("CHAT.BEST_DEAL.TITLE")}</DialogTitle>
          <DialogDescription>{t("CHAT.BEST_DEAL.DESC")}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="best-deal-enabled">
            {t("CHAT.BEST_DEAL.ENABLE")}
          </Label>
          <Switch
            id="best-deal-enabled"
            checked={bestDeal.enabled}
            disabled={bestDeal.pool.length === 0}
            onCheckedChange={(on) => setBestDeal({ ...bestDeal, enabled: on })}
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-xs">
            {t("CHAT.BEST_DEAL.POOL")}
          </span>
          {pool.length === 0 && (
            <p className="text-muted-foreground rounded-md border border-dashed p-3 text-xs">
              {t("CHAT.BEST_DEAL.POOL_EMPTY")}
            </p>
          )}
          {pool.map((m) => {
            const discount = bestDiscountPercent(m);
            return (
              <div
                key={m.model_name}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs"
              >
                <VendorIcon vendor={m.vendor} size={14} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-mono">
                    {m.model_name}
                  </span>
                  <span className="text-muted-foreground block">
                    {m.is_free
                      ? t("CHAT.MODEL.FREE_BADGE")
                      : t("CHAT.BEST_DEAL.PRICE", {
                          input: formatPriceCompact(m.input_price),
                          output: formatPriceCompact(m.output_price),
                        })}
                    {discount > 0 && ` (-${discount}%)`}
                  </span>
                </span>
                {pick?.model_name === m.model_name && (
                  <span className="shrink-0 rounded bg-amber-500/15 px-1 py-0.5 text-[10px] leading-none font-medium text-amber-700 dark:text-amber-300">
                    {t("CHAT.BEST_DEAL.NEXT")}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t("CHAT.BEST_DEAL.REMOVE")}
                  onClick={() =>
                    setPool(bestDeal.pool.filter((id) => id !== m.model_name))
                  }
                >
                  <Icon name="trash-2" className="size-3.5" />
                </Button>
              </div>
            );
          })}
          <ModelPicker
            models={models}
            selected={bestDeal.pool}
            onAdd={(name) => setPool([...bestDeal.pool, name])}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
