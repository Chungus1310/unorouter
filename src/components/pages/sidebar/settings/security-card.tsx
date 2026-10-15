"use client";

import type { PasskeyMode, TwoFAMode } from "@/lib/types";
import { Icon } from "@/components/ui/icon";
import {
  use2FAStatusQuery,
  usePasskeyStatusQuery,
} from "@/hooks/auth/settings-hook";
import { useAuthQuery } from "@/hooks/auth/auth-hook";
import { useStatusQuery } from "@/hooks/ops/status-hook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ChangePasswordDialog } from "./change-password-dialog";
import { Setup2FADialog } from "./setup-2fa-dialog";
import { PasskeyDialog } from "./passkey-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { ApiAccessTabs } from "./api-access-tabs";

export function SecurityCard() {
  const t = useTranslations();
  const twoFAStatusQuery = use2FAStatusQuery();
  const passkeyStatusQuery = usePasskeyStatusQuery();
  const statusQuery = useStatusQuery();

  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [twoFAMode, setTwoFAMode] = useState<TwoFAMode>("setup");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasskeyDialog, setShowPasskeyDialog] = useState(false);
  const [passkeyMode, setPasskeyMode] = useState<PasskeyMode>("register");

  const authQuery = useAuthQuery();
  const twoFAEnabled = twoFAStatusQuery.data?.enabled === true;
  const passkeyRegistered = passkeyStatusQuery.data?.enabled === true;
  // Switched off globally the register dialog is a dead end; an existing passkey stays removable.
  const showPasskey =
    passkeyRegistered || statusQuery.data?.passkey_login === true;
  const hasPassword = authQuery.data?.has_password ?? true;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("SETTINGS.SECURITY.TITLE")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ApiAccessTabs />

          <Separator />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon name="lock" className="text-muted-foreground h-4 w-4" />
              <span className="font-medium">
                {t("SETTINGS.SECURITY.PASSWORD")}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordDialog(true)}
            >
              {hasPassword
                ? t("SETTINGS.SECURITY.CHANGE_PASSWORD")
                : t("SETTINGS.SECURITY.SET_PASSWORD")}
            </Button>
          </div>

          {showPasskey && (
            <>
              <Separator />

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Icon
                      name="fingerprint"
                      className="text-muted-foreground h-4 w-4"
                    />
                    <span className="font-medium">
                      {t("SETTINGS.SECURITY.PASSKEY")}
                    </span>
                    {passkeyRegistered ? (
                      <Badge variant="default">
                        {t("SETTINGS.SECURITY.PASSKEY_REGISTERED")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        {t("SETTINGS.SECURITY.PASSKEY_NOT_REGISTERED")}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {passkeyRegistered ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setPasskeyMode("delete");
                          setShowPasskeyDialog(true);
                        }}
                      >
                        <Icon name="trash-2" className="mr-1 h-3 w-3" />
                        {t("SETTINGS.SECURITY.DELETE_PASSKEY")}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPasskeyMode("register");
                          setShowPasskeyDialog(true);
                        }}
                      >
                        {t("SETTINGS.SECURITY.REGISTER_PASSKEY")}
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t("SETTINGS.SECURITY.PASSKEY_DESC")}
                </p>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Icon
                  name="shield-check"
                  className="text-muted-foreground h-4 w-4"
                />
                <span className="font-medium">
                  {t("SETTINGS.SECURITY.TWO_FACTOR")}
                </span>
                {twoFAEnabled ? (
                  <Badge variant="default">
                    {t("SETTINGS.SECURITY.TWO_FACTOR_ENABLED")}
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    {t("SETTINGS.SECURITY.TWO_FACTOR_DISABLED")}
                  </Badge>
                )}
              </div>
              <Button
                variant={twoFAEnabled ? "destructive" : "outline"}
                size="sm"
                onClick={() => {
                  setTwoFAMode(twoFAEnabled ? "disable" : "setup");
                  setShow2FADialog(true);
                }}
              >
                {twoFAEnabled
                  ? t("SETTINGS.SECURITY.DISABLE_2FA")
                  : t("SETTINGS.SECURITY.SETUP_2FA")}
              </Button>
            </div>
            <p className="text-muted-foreground text-xs">
              {t("SETTINGS.SECURITY.TWO_FACTOR_DESC")}
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Icon name="trash-2" className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-red-500">
                    {t("SETTINGS.SECURITY.DELETE_ACCOUNT")}
                  </span>
                </div>
                <p className="text-muted-foreground mt-1 text-xs">
                  {t("SETTINGS.SECURITY.DELETE_ACCOUNT_DESC")}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                {t("SETTINGS.SECURITY.DELETE_ACCOUNT_BUTTON")}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        hasPassword={hasPassword}
      />
      <Setup2FADialog
        open={show2FADialog}
        onOpenChange={setShow2FADialog}
        mode={twoFAMode}
      />
      <PasskeyDialog
        open={showPasskeyDialog}
        onOpenChange={setShowPasskeyDialog}
        mode={passkeyMode}
      />
      <DeleteAccountDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
      />
    </>
  );
}
