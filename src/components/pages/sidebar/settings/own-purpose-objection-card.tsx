"use client";

import { OwnPurposeObjectionToggle } from "@/components/elements/model/own-purpose-objection-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";

export function OwnPurposeObjectionCard() {
  const t = useTranslations();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("OWN_PURPOSE.TITLE")}</CardTitle>
      </CardHeader>
      <CardContent>
        <OwnPurposeObjectionToggle />
      </CardContent>
    </Card>
  );
}
