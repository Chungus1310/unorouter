import { CodeBlock } from "@/components/elements/code/code-block";
import { LINK_CHUNKS } from "@/components/pages/blog/post-sections";
import { CONSENT_ERROR } from "@/components/pages/docs/platform/content/consents-content";
import { Link } from "@/i18n/navigation";
import { APP_VALUES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { getTranslations } from "next-intl/server";

const P = "BLOG.POSTS.CONSENT_PER_PROVIDER";

export async function ConsentPerProviderContent() {
  const t = await getTranslations();
  const marks = {
    ...LINK_CHUNKS,
    ...APP_VALUES,
    c: (chunks: React.ReactNode) => <code>{chunks}</code>,
    s: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
    consents: (chunks: React.ReactNode) => (
      <Link href="/consents">{chunks}</Link>
    ),
    terms: (chunks: React.ReactNode) => <Link href="/terms">{chunks}</Link>,
    docs: (chunks: React.ReactNode) => (
      <Link
        href={{
          pathname: "/docs/platform/[slug]",
          params: { slug: "consents" },
        }}
      >
        {chunks}
      </Link>
    ),
    discord: (chunks: React.ReactNode) =>
      env.discordUrl ? (
        <a href={env.discordUrl} rel="noopener noreferrer" target="_blank">
          {chunks}
        </a>
      ) : (
        <>{chunks}</>
      ),
  };

  return (
    <>
      <p>{t.rich(`${P}.INTRO`, marks)}</p>

      <h2 id="what-changed">{t(`${P}.H_WHAT`)}</h2>
      <p>{t.rich(`${P}.P_WHAT`, marks)}</p>

      <h2 id="how-to-give-consent">{t(`${P}.H_HOW`)}</h2>
      <p>{t.rich(`${P}.P_HOW`, marks)}</p>

      <h2 id="objecting-instead">{t(`${P}.H_OBJECT`)}</h2>
      <p>{t.rich(`${P}.P_OBJECT`, marks)}</p>

      <h2 id="if-you-use-the-api">{t(`${P}.H_API`)}</h2>
      <p>{t.rich(`${P}.P_API_1`, marks)}</p>
      <div className="not-prose my-6">
        <CodeBlock language="json" code={CONSENT_ERROR} />
      </div>
      <p>{t.rich(`${P}.P_API_2`, marks)}</p>

      <h2 id="when-blocking-starts">{t(`${P}.H_WHEN`)}</h2>
      <p>{t.rich(`${P}.P_WHEN`, marks)}</p>

      <h2 id="updated-terms-and-privacy-policy">{t(`${P}.H_TERMS`)}</h2>
      <p>{t.rich(`${P}.P_TERMS`, marks)}</p>

      <p>{t.rich(`${P}.CTA`, marks)}</p>
    </>
  );
}
