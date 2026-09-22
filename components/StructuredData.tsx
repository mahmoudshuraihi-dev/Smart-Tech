import { SITE_URL, SITE_NAME } from "@/lib/site-config";

// Deliberately omits address/telephone/sameAs — fabricating placeholder business details in
// structured data is worse than omitting them; fill these in once the real values are final.
export default function StructuredData() {
  const data = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Academic consulting, editing, statistical, and research support services for graduate students.",
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
