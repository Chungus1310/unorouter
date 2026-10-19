"use client";

import { FreeConsentList } from "@/components/elements/model/free-consent-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOwnPurposeEnabled } from "@/hooks/ops/status-hook";
import { useTranslations } from "next-intl";

export function FreeConsentCard() {
  const t = useTranslations();
  const enabled = useOwnPurposeEnabled();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {t(
            enabled
              ? "FREE_CONSENT.TRAINING_USE.SETTINGS_TITLE"
              : "FREE_CONSENT.SETTINGS_TITLE",
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-foreground text-sm">
          {t(
            enabled
              ? "FREE_CONSENT.TRAINING_USE.SETTINGS_DESC"
              : "FREE_CONSENT.SETTINGS_DESC",
          )}
        </p>
        <FreeConsentList />
      </CardContent>
    </Card>
  );
}
