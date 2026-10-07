import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mboa Credit Union — Gestion de l’épargne" },
      {
        name: "description",
        content:
          "Accédez à votre espace de gestion des collectes et de l’épargne quotidienne Mboa.",
      },
      { property: "og:title", content: "Mboa Credit Union — Gestion de l’épargne" },
      {
        property: "og:description",
        content: "Votre espace de suivi de l’épargne et des collectes quotidiennes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: "/tableau-de-bord" });
  },
  component: () => null,
});
