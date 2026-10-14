"use client";

import { MyFormInput } from "@/components/elements/form/my-form-input";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  usePasskeyVerifyMutation,
  useSecurityVerifyMutation,
  useVerificationMethodsQuery,
} from "@/hooks/auth/settings-hook";
import type { SecurityScope } from "@/lib/api/typebox/settings";
import { isRecord } from "@/lib/utils/base";
import { handleError } from "@/lib/utils/client";
import { formDefaults } from "@/lib/validation/helpers";
import {
  securityVerifySchema,
  type SecurityVerifySchema,
} from "@/lib/validation/settings";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";

// OAuth re-authentication hands its proof to the gateway's own callback page,
// not to this site, so it is not offered here.
const STEP_UP_METHODS = ["2fa", "passkey", "password"] as const;
type StepUpMethod = (typeof STEP_UP_METHODS)[number];

const METHOD_LABEL = {
  "2fa": "SETTINGS.SECURITY.VERIFY.METHOD_2FA",
  passkey: "SETTINGS.SECURITY.VERIFY.METHOD_PASSKEY",
  password: "SETTINGS.SECURITY.VERIFY.METHOD_PASSWORD",
} as const;

function findCode(value: unknown, depth = 0): string | undefined {
  if (!isRecord(value) || depth > 4) return undefined;
  if (typeof value.code === "string") return value.code;
  for (const key of ["error", "value", "data"]) {
    const found = findCode(value[key], depth + 1);
    if (found) return found;
  }
  return undefined;
}

// True when the gateway refused the proof itself (missing, expired, used,
// wrong scope) or the 2FA enrollment it started has lapsed: asking the user
// to verify again is the fix for all of them.
export function needsReverification(error: unknown): boolean {
  const code = findCode(error);
  return (
    !!code &&
    (code.startsWith("SECURITY_PROOF_") || code === "TWOFA_SETUP_INVALID")
  );
}

export function SecurityVerification(props: {
  scope: SecurityScope;
  onVerified: (proof: string) => void;
  busy?: boolean;
}) {
  const t = useTranslations();
  const methodsQuery = useVerificationMethodsQuery(props.scope);
  const verifyMutation = useSecurityVerifyMutation();
  const passkeyMutation = usePasskeyVerifyMutation();
  const [chosen, setChosen] = useState<StepUpMethod | null>(null);

  const form = useForm({
    resolver: typeboxResolver(securityVerifySchema),
    defaultValues: formDefaults(securityVerifySchema),
  });

  const offered = methodsQuery.data?.methods ?? [];
  const usable = STEP_UP_METHODS.filter((m) =>
    offered.some((o) => o.method === m && o.available),
  );
  const method = chosen && usable.includes(chosen) ? chosen : usable[0];
  const busy =
    props.busy || verifyMutation.isPending || passkeyMutation.isPending;

  function selectMethod(next: StepUpMethod) {
    setChosen(next);
    form.reset(formDefaults(securityVerifySchema));
  }

  function onSubmit(data: SecurityVerifySchema) {
    if (method !== "2fa" && method !== "password") return;
    verifyMutation.mutate(
      {
        body: {
          method,
          scope: props.scope,
          ...(method === "2fa"
            ? { code: data.secret.trim() }
            : { password: data.secret }),
        },
      },
      {
        onSuccess: (proof) => {
          form.reset(formDefaults(securityVerifySchema));
          props.onVerified(proof.proof_token);
        },
      },
    );
  }

  function verifyWithPasskey() {
    passkeyMutation.mutate(
      { scope: props.scope },
      {
        onSuccess: (proof) => props.onVerified(proof.proof_token),
        onError: (error) => {
          // The user closed the browser prompt.
          if (error.name === "NotAllowedError") return;
          handleError(error, t);
        },
      },
    );
  }

  if (methodsQuery.isPending) {
    return (
      <p className="text-muted-foreground text-sm">
        {t("SETTINGS.SECURITY.VERIFY.LOADING")}
      </p>
    );
  }

  if (methodsQuery.isError) {
    return (
      <p className="text-destructive text-sm">{methodsQuery.error.message}</p>
    );
  }

  if (!method) {
    const oauthOnly = offered.some((o) => o.method === "oauth");
    const reasons = offered.flatMap((o) =>
      !o.available && o.reason ? [o.reason] : [],
    );
    return (
      <div className="text-muted-foreground space-y-1 text-sm">
        <p>
          {oauthOnly
            ? t("SETTINGS.SECURITY.VERIFY.OAUTH_ONLY")
            : t("SETTINGS.SECURITY.VERIFY.NONE_AVAILABLE")}
        </p>
        {reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="font-medium">{t("SETTINGS.SECURITY.VERIFY.TITLE")}</p>
        <p className="text-muted-foreground text-sm">
          {t("SETTINGS.SECURITY.VERIFY.DESC")}
        </p>
      </div>

      {usable.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {usable.map((m) => (
            <Button
              key={m}
              type="button"
              size="sm"
              variant={m === method ? "secondary" : "ghost"}
              onClick={() => selectMethod(m)}
            >
              {t(METHOD_LABEL[m])}
            </Button>
          ))}
        </div>
      )}

      {method === "passkey" ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {t("SETTINGS.SECURITY.VERIFY.PASSKEY_HINT")}
          </p>
          <Button type="button" onClick={verifyWithPasskey} disabled={busy}>
            {t("SETTINGS.SECURITY.VERIFY.PASSKEY_BUTTON")}
          </Button>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <MyFormInput
              key={method}
              control={form.control}
              name="secret"
              schema={securityVerifySchema}
              type={method === "password" ? "password" : "text"}
              autoComplete={
                method === "password" ? "current-password" : "one-time-code"
              }
              label={
                method === "password"
                  ? t("SETTINGS.SECURITY.VERIFY.PASSWORD_LABEL")
                  : t("SETTINGS.SECURITY.VERIFY.CODE_LABEL")
              }
              autoFocus
            />
            <Button type="submit" disabled={busy}>
              {t("SETTINGS.SECURITY.VERIFY.SUBMIT")}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
}
