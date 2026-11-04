import { createFileRoute } from "@tanstack/react-router";
import { TermsConditions } from "@/features/legal/TermsConditions";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Text When You Get Home" },
      {
        name: "description",
        content:
          "Read the Terms & Conditions and Community Guidelines for the Text When You Get Home community archive project.",
      },
      {
        property: "og:title",
        content: "Terms & Conditions & Community Guidelines — Text When You Get Home",
      },
      {
        property: "og:description",
        content:
          "Read the Terms & Conditions and Community Guidelines for the Text When You Get Home community archive project.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: TermsConditions,
});
