import { createFileRoute } from "@tanstack/react-router";
import { PrivacyPolicy } from "@/features/legal/PrivacyPolicy";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Street Speak Archive" },
      {
        name: "description",
        content: "Read the Privacy Policy for the Street Speak Archive community project.",
      },
    ],
  }),
  component: PrivacyPolicy,
});
