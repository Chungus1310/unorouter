import { CodeBlock } from "@/components/elements/code/code-block";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";

const VERIFIER_URL = "https://github.com/unorouter/ai-model-verifier";
const NPM_URL = "https://www.npmjs.com/package/ai-model-verifier";
const SYNC_URL = "https://github.com/unorouter/new-api-sync";

const external = (href: string) => (chunks: React.ReactNode) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {chunks}
  </a>
);

const marks = {
  s: (chunks: React.ReactNode) => <strong>{chunks}</strong>,
  link: (chunks: React.ReactNode) => (
    <Link href="/ai-api-model-tester">{chunks}</Link>
  ),
  verifier: external(VERIFIER_URL),
  npm: external(NPM_URL),
  sync: external(SYNC_URL),
};

const P = "BLOG.POSTS.CLAUDE_AUTHENTICITY";

export async function ClaudeAuthenticityContent() {
  const t = await getTranslations();

  return (
    <>
      <p>{t(`${P}.INTRO_P1`)}</p>
      <p>{t(`${P}.INTRO_P2`)}</p>

      <h2 id="asking">{t(`${P}.H_ASKING`)}</h2>
      <p>{t(`${P}.ASK_P1`)}</p>
      <p>{t.rich(`${P}.ASK_TOLD`, marks)}</p>
      <p>{t.rich(`${P}.ASK_CUTOFF`, marks)}</p>
      <p>{t(`${P}.ASK_OUTRO`)}</p>

      <h2 id="tells">{t(`${P}.H_TELLS`)}</h2>
      <p>{t(`${P}.TELLS_FAIL_INTRO`)}</p>
      <ul>
        <li>{t.rich(`${P}.TELL_PRODUCT`, marks)}</li>
        <li>{t.rich(`${P}.TELL_DISGUISE`, marks)}</li>
        <li>{t.rich(`${P}.TELL_LABEL`, marks)}</li>
        <li>{t.rich(`${P}.TELL_THINKING`, marks)}</li>
        <li>{t.rich(`${P}.TELL_LANGUAGE`, marks)}</li>
        <li>{t.rich(`${P}.TELL_ERROR`, marks)}</li>
      </ul>
      <p>{t(`${P}.TELLS_EVIDENCE_INTRO`)}</p>
      <ul>
        <li>{t.rich(`${P}.EV_SIGNATURE`, marks)}</li>
        <li>{t.rich(`${P}.EV_TOKENS`, marks)}</li>
        <li>{t.rich(`${P}.EV_ANSWERS`, marks)}</li>
        <li>{t.rich(`${P}.EV_PROMPTS`, marks)}</li>
      </ul>
      <p>{t(`${P}.TELLS_OUTRO`)}</p>

      <h2 id="not-fake">{t(`${P}.H_NOT_FAKE`)}</h2>
      <p>{t(`${P}.NOT_FAKE_P`)}</p>

      <h2 id="limits">{t(`${P}.H_LIMITS`)}</h2>
      <p>{t(`${P}.LIMITS_P`)}</p>

      <h2 id="history">{t(`${P}.H_HISTORY`)}</h2>
      <p>{t.rich(`${P}.HISTORY_P`, marks)}</p>

      <h2 id="test">{t(`${P}.H_TEST`)}</h2>
      <p>{t.rich(`${P}.TEST_P`, marks)}</p>
      <p>{t(`${P}.TEST_CURL`)}</p>
      <div className="not-prose my-6">
        <CodeBlock
          language="bash"
          code={`curl https://YOUR-PROVIDER/v1/messages \\
  -H "x-api-key: $YOUR_KEY" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "content-type: application/json" \\
  -d '{
    "model": "claude-opus-4-7",
    "max_tokens": 150,
    "messages": [{
      "role": "user",
      "content": "Tell me a 2-sentence sad story about a lost kitten."
    }]
  }'`}
        />
      </div>
      <p>{t.rich(`${P}.TEST_OPEN`, marks)}</p>
    </>
  );
}
