import type { MetadataRoute } from "next";

// PWA: permite instalar na tela de início e abrir em tela cheia, sem a barra do navegador
// (nem a barra de URL em cima, nem a de navegação embaixo). Só vale depois de "Adicionar à
// Tela de Início" e abrir pelo ícone — numa aba normal o navegador sempre mostra sua interface.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DaVinci Qualidade",
    short_name: "Qualidade",
    description: "Gestão da qualidade, saúde, segurança e meio ambiente",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#F4F7FA",
    theme_color: "#102A43",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
