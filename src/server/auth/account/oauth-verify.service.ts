import {
  LOCALE_COOKIE,
  LOCALES,
  OAUTH_VERIFY_CHANNEL,
} from "@/lib/config/constants";
import { cookieString, getUserId } from "@/server/constants";
import type { Cookie } from "elysia";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { exchangeOAuthCode } from "@/openapi";

type OAuthVerifyResult = { proof?: string; scope?: string; error?: string };

async function readOAuthProof(
  code: string | undefined,
  cookie: Record<string, Cookie<unknown>>,
): Promise<OAuthVerifyResult> {
  if (!code) return {};
  const res = await exchangeOAuthCode({ code }).catch(() => null);
  const data = res?.data.success ? res.data.data : null;
  // The proof only works with the session that started the flow, so a code
  // that lands in another account's browser is refused here as well.
  if (
    !data?.proof_token ||
    data.action !== "verify" ||
    data.user_id !== (await getUserId(cookie, true))
  )
    return {};
  return { proof: data.proof_token, scope: data.scope };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Runs in the window the step-up panel opened: it hands the result to the
// panel over a same-origin channel and closes itself. The proof travels in the
// page body, never in a URL.
export async function oauthVerifyResultPage(args: {
  nonce: string;
  code?: string;
  error?: string;
  cookie: Record<string, Cookie<unknown>>;
}) {
  const result = args.error
    ? { error: args.error }
    : await readOAuthProof(args.code, args.cookie);
  const preferred = cookieString(args.cookie[LOCALE_COOKIE]?.value);
  const locale = hasLocale(LOCALES, preferred) ? preferred : LOCALES[0];
  const t = await getTranslations({ locale });
  const title = escapeHtml(
    result.proof
      ? t("SETTINGS.SECURITY.VERIFY.OAUTH_DONE")
      : t("SETTINGS.SECURITY.VERIFY.OAUTH_FAILED"),
  );
  const hint = escapeHtml(t("SETTINGS.SECURITY.VERIFY.OAUTH_CLOSE_WINDOW"));
  const message = JSON.stringify({ nonce: args.nonce, ...result }).replace(
    /</g,
    "\\u003c",
  );
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta name="color-scheme" content="light dark"><title>${title}</title></head><body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;text-align:center;padding:16px"><div><h1 style="font-size:1.25rem">${title}</h1><p>${hint}</p></div><script>try{const c=new BroadcastChannel(${JSON.stringify(OAUTH_VERIFY_CHANNEL)});c.postMessage(${message});c.close()}catch(e){}window.close()</script></body></html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "referrer-policy": "no-referrer",
    },
  });
}
