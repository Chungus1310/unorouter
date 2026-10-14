import { ImpressumContent } from "@/components/pages/legal/impressum-content";
import { LegalPage, legalMetadata } from "@/components/pages/legal/legal-page";

export function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}) {
  return legalMetadata("impressum", props);
}

export default async function ImpressumPage(props: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <LegalPage slug="impressum" params={props.params}>
      <ImpressumContent />
    </LegalPage>
  );
}
