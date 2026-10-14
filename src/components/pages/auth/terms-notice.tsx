"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const MESSAGE_KEYS = {
  register: "AUTH.TERMS_NOTICE.REGISTER",
  oauth: "AUTH.TERMS_NOTICE.OAUTH",
} as const;

type TermsNoticeProps = {
  variant: keyof typeof MESSAGE_KEYS;
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
