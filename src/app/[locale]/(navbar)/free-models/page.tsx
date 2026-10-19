import { FreeModelsPage } from "@/components/pages/navbar/free-models/free-models-page";
import { pageMetadata } from "@/lib/seo/metadata";
import { ownPurposeEnabled } from "@/server/auth/free-consent/free-consent.service";

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  return pageMetadata({
    props,
    namespace: (await ownPurposeEnabled())
      ? "FREE_CONSENT.TRAINING_USE"
      : "FREE_CONSENT",
    href: "/free-models",
    robots: false,
  });
}

export default function Page() {
  return <FreeModelsPage />;
}
