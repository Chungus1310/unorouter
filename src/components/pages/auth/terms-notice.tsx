"use client";

import { Link } from "@/i18n/navigation";
import { TERMS_VERSION } from "@/i18n/terms-version";
import { useLocale, useTranslations } from "next-intl";

const MESSAGE_KEYS = {
  register: "AUTH.TERMS_NOTICE.REGISTER",
  oauth: "AUTH.TERMS_NOTICE.OAUTH",
} as const;

export type TermsNoticeVariant = keyof typeof MESSAGE_KEYS;

type TermsNoticeProps = {
  variant: TermsNoticeVariant;
};

export function TermsNotice(props: TermsNoticeProps) {
  const t = useTranslations();

  return (
    <p className="text-muted-foreground text-center text-xs leading-relaxed">
      {t.rich(MESSAGE_KEYS[props.variant], {
        terms: (chunks) => (
          <Link href="/terms" className="text-foreground hover:underline">
            {chunks}
          </Link>
        ),
        privacy: (chunks) => (
          <Link href="/privacy" className="text-foreground hover:underline">
            {chunks}
          </Link>
        ),
      })}
    </p>
  );
}

// Sent with a signup so the gateway records the notice as the accepted terms
// version and the new account is not asked again after its first login.
export function useTermsShown(variant: TermsNoticeVariant) {
  const t = useTranslations();
  const locale = useLocale();
  return {
    terms_version: TERMS_VERSION,
    terms_locale: locale,
    terms_text: t.markup(MESSAGE_KEYS[variant], {
      terms: (chunks) => chunks,
      privacy: (chunks) => chunks,
    }),
  };
}
