import {
  LegalDoc,
  type LegalDocSection,
} from "@/components/pages/legal/legal-doc";

const SECTIONS: LegalDocSection[] = [
  {
    title: "PROVIDER_TITLE",
    para: { key: "PROVIDER_CONTENT", values: true },
  },
  { title: "CONTACT_TITLE", para: { key: "CONTACT_CONTENT", values: true } },
  { title: "VAT_TITLE", para: { key: "VAT_CONTENT" } },
  { title: "RESPONSIBLE_TITLE", para: { key: "RESPONSIBLE_CONTENT" } },
  { title: "DISPUTE_TITLE", para: { key: "DISPUTE_CONTENT" } },
];

export function ImpressumContent() {
  return <LegalDoc ns="IMPRESSUM" sections={SECTIONS} />;
}
