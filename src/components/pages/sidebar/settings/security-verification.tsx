"use client";

import { MyFormInput } from "@/components/elements/form/my-form-input";
import { buildOAuthAuthorizeUrl } from "@/components/pages/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icon } from "@/components/ui/icon";
import {
  useOAuthVerifyStateMutation,
  usePasskeyVerifyMutation,
  useSecurityVerifyMutation,
  useVerificationMethodsQuery,
} from "@/hooks/auth/settings-hook";
import { useStatusQuery } from "@/hooks/ops/status-hook";
import type { SecurityScope } from "@/lib/api/typebox/settings";
import {
  OAUTH_VERIFY_CHANNEL,
  OAUTH_VERIFY_QUERY,
} from "@/lib/config/constants";
import type { IconName } from "@/lib/config/icon-map";
import { isRecord } from "@/lib/utils/base";
import { handleError } from "@/lib/utils/client";
import { formDefaults } from "@/lib/validation/helpers";
import {
  securityVerifySchema,
  type SecurityVerifySchema,
} from "@/lib/validation/settings";
import { typeboxResolver } from "@hookform/resolvers/typebox";
import { useTranslations } from "next-intl";
import { useEffect, useEffectEvent, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const STEP_UP_METHODS = ["2fa", "passkey", "password", "oauth"] as const;
type StepUpMethod = (typeof STEP_UP_METHODS)[number];

const METHOD_LABEL = {
  "2fa": "SETTINGS.SECURITY.VERIFY.METHOD_2FA",
  passkey: "SETTINGS.SECURITY.VERIFY.METHOD_PASSKEY",
  password: "SETTINGS.SECURITY.VERIFY.METHOD_PASSWORD",
  oauth: "SETTINGS.SECURITY.VERIFY.METHOD_OAUTH",
} as const;

const PROVIDER_ICON: Record<string, IconName> = {
  github: "brand-github",
  discord: "brand-discord",
  google: "brand-google",
};

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
// wrong scope) or the 2FA enrollment or passkey ceremony it started has
// lapsed: asking the user to verify again is the fix for all of them.
export function needsReverification(error: unknown): boolean {
  const code = findCode(error);
  return (
    !!code &&
    (code.startsWith("SECURITY_PROOF_") ||
      code === "TWOFA_SETUP_INVALID" ||
      code === "AUTH_FLOW_INVALID")
  );
}

export function SecurityVerification(props: {
  scope: SecurityScope;
  onVerified: (proof: string) => void;
  busy?: boolean;
}) {
  const t = useTranslations();
  const methodsQuery = useVerificationMethodsQuery(props.scope);
  const statusQuery = useStatusQuery();
  const verifyMutation = useSecurityVerifyMutation();
  const passkeyMutation = usePasskeyVerifyMutation();
  const oauthStateMutation = useOAuthVerifyStateMutation();
  const [chosen, setChosen] = useState<StepUpMethod | null>(null);
  const [oauthNonce, setOAuthNonce] = useState<string | null>(null);

  const onOAuthResult = useEffectEvent((data: unknown) => {
    if (!isRecord(data) || data.nonce !== oauthNonce) return;
    setOAuthNonce(null);
    if (typeof data.proof === "string" && data.scope === props.scope) {
      props.onVerified(data.proof);
      return;
    }
    toast.error(t("SETTINGS.SECURITY.VERIFY.OAUTH_FAILED"), {
      description: typeof data.error === "string" ? data.error : undefined,
    });
  });

  useEffect(() => {
    if (!oauthNonce) return;
    const channel = new BroadcastChannel(OAUTH_VERIFY_CHANNEL);
    channel.onmessage = (event) => onOAuthResult(event.data);
    return () => channel.close();
  }, [oauthNonce]);

  const form = useForm({
    resolver: typeboxResolver(securityVerifySchema),
    defaultValues: formDefaults(securityVerifySchema),
  });

  const offered = methodsQuery.data?.methods ?? [];
  const status = statusQuery.data;
  // Only providers this site can send the browser to.
  const oauthProviders = status
    ? (methodsQuery.data?.oauth_providers ?? []).filter(
        (p) => buildOAuthAuthorizeUrl(p.slug, status, "") !== null,
      )
    : [];
  const usable = STEP_UP_METHODS.filter(
    (m) =>
      offered.some((o) => o.method === m && o.available) &&
      (m !== "oauth" || oauthProviders.length > 0),
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

  function verifyWithOAuth(provider: string) {
    if (!status) return;
    // Opened inside the click so the browser does not block it.
    const popup = window.open(
      "about:blank",
      OAUTH_VERIFY_CHANNEL,
      "popup,width=520,height=720",
    );
    if (!popup) {
      toast.error(t("SETTINGS.SECURITY.VERIFY.OAUTH_POPUP_BLOCKED"));
      return;
    }
    popup.opener = null;
    const nonce = crypto.randomUUID();
    setOAuthNonce(nonce);
    const redirect = `${window.location.origin}/api/auth/account/oauth/callback?${new URLSearchParams({ [OAUTH_VERIFY_QUERY]: nonce })}`;
    oauthStateMutation.mutate(
      { query: { provider, scope: props.scope, redirect } },
      {
        onSuccess: (state) => {
          const url = buildOAuthAuthorizeUrl(provider, status, state);
          if (url) popup.location.href = url;
          else popup.close();
        },
        onError: () => {
          popup.close();
          setOAuthNonce(null);
        },
      },
    );
  }

  if (
    methodsQuery.isPending ||
    (statusQuery.isPending && offered.some((o) => o.method === "oauth"))
  ) {
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

      {method === "oauth" ? (
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {oauthNonce
              ? t("SETTINGS.SECURITY.VERIFY.OAUTH_WAITING")
              : t("SETTINGS.SECURITY.VERIFY.OAUTH_HINT")}
          </p>
          <div className="flex flex-wrap gap-2">
            {oauthProviders.map((provider) => (
              <Button
                key={provider.slug}
                type="button"
                onClick={() => verifyWithOAuth(provider.slug)}
                disabled={busy || oauthStateMutation.isPending}
              >
                <Icon
                  name={PROVIDER_ICON[provider.slug] ?? "log-in"}
                  className="h-4 w-4"
                />
                {t("SETTINGS.SECURITY.VERIFY.OAUTH_BUTTON", {
                  provider: provider.name,
                })}
              </Button>
            ))}
          </div>
        </div>
      ) : method === "passkey" ? (
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
