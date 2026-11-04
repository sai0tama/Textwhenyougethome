import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/community-guidelines")({
  beforeLoad: () => {
    throw redirect({
      to: "/terms",
      hash: "community-guidelines",
    });
  },
});
