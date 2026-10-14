"use client";

import { CustomerTypeCheckbox } from "@/components/pages/auth/customer-type-checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthQuery } from "@/hooks/auth/auth-hook";
import { useUpdateSelfMutation } from "@/hooks/auth/settings-hook";
import { cn } from "@/lib/utils";
import { formatLongDate } from "@/lib/utils/format/date";
import { customerTypeChecker, type CustomerType } from "@/lib/validation/auth";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

export function CustomerTypeCard() {
  const t = useTranslations();
  const authQuery = useAuthQuery();
  const updateSelfMutation = useUpdateSelfMutation();
  const [draft, setDraft] = useState<CustomerType>();
  const user = authQuery.data;

  if (!user) return null;

  const declared = customerTypeChecker.Check(user.customer_type)
    ? user.customer_type
    : undefined;
  const selected = draft ?? declared ?? "consumer";

  function save() {
    updateSelfMutation.mutate(
      { body: { customer_type: selected } },
      {
        onSuccess: () => {
          setDraft(undefined);
          toast.success(t("SETTINGS.CUSTOMER_TYPE.SAVED"));
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Card className={cn(!declared && "border-amber-500/60")}>
      <CardHeader>
        <CardTitle>{t("SETTINGS.CUSTOMER_TYPE.TITLE")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!declared && (
          <p className="text-foreground text-sm">
            {t("SETTINGS.CUSTOMER_TYPE.PROMPT")}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CustomerTypeCheckbox
            value={selected}
            onChange={setDraft}
            label={t("SETTINGS.CUSTOMER_TYPE.BUSINESS_CHECKBOX")}
            disabled={updateSelfMutation.isPending}
          />
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={selected === declared || updateSelfMutation.isPending}
          >
            {t("SETTINGS.CUSTOMER_TYPE.SAVE")}
          </Button>
        </div>
        {declared && user.customer_type_at ? (
          <p className="text-muted-foreground text-xs">
            {t("SETTINGS.CUSTOMER_TYPE.DECLARED_ON", {
              date: formatLongDate(user.customer_type_at),
            })}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
