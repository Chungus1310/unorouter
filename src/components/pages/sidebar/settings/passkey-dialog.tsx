"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePasskeyDeleteMutation,
  usePasskeyRegisterMutation,
} from "@/hooks/auth/settings-hook";
import type { PasskeyMode } from "@/lib/types";
import { handleError } from "@/lib/utils/client";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  needsReverification,
  SecurityVerification,
} from "./security-verification";

export function PasskeyDialog(props: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: PasskeyMode;
}) {
  const t = useTranslations();
  const registerMutation = usePasskeyRegisterMutation();
  const deleteMutation = usePasskeyDeleteMutation();
  const register = props.mode === "register";

  // The dialog keeps showing verification, so a refused proof or a dismissed
  // browser prompt leaves the user one click from trying again.
  function onError(error: Error) {
    if (error.name === "NotAllowedError") return;
    if (needsReverification(error)) {
      toast.error(t("SETTINGS.SECURITY.VERIFY.EXPIRED"));
      return;
    }
    handleError(error, t);
  }

  function handleVerified(proof: string) {
    if (register) {
      registerMutation.mutate(
        { proof },
        {
          onSuccess: () => {
            toast.success(t("SETTINGS.SECURITY.PASSKEY_REGISTERED_SUCCESS"));
            props.onOpenChange(false);
          },
          onError,
        },
      );
      return;
    }
    deleteMutation.mutate(
      { proof },
      {
        onSuccess: () => {
          toast.success(t("SETTINGS.SECURITY.PASSKEY_DELETED"));
          props.onOpenChange(false);
        },
        onError,
      },
    );
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {register
              ? t("SETTINGS.SECURITY.REGISTER_PASSKEY")
              : t("SETTINGS.SECURITY.DELETE_PASSKEY")}
          </DialogTitle>
          <DialogDescription>
            {register
              ? t("SETTINGS.SECURITY.REGISTER_PASSKEY_DESC")
              : t("SETTINGS.SECURITY.DELETE_PASSKEY_DESC")}
          </DialogDescription>
        </DialogHeader>
        <SecurityVerification
          scope={register ? "passkey.register" : "passkey.delete"}
          onVerified={handleVerified}
          busy={registerMutation.isPending || deleteMutation.isPending}
        />
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => props.onOpenChange(false)}
          >
            {t("COMMON.CANCEL")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
