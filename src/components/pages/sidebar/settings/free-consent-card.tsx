"use client";

import { FreeConsentList } from "@/components/elements/model/free-consent-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function FreeConsentCard() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("FREE_CONSENT.SETTINGS_TITLE")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          {t("FREE_CONSENT.SETTINGS_DESC")}
        </p>
        <FreeConsentList />
      </CardContent>
    </Card>
  );
}
