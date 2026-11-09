import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/** Versão do sistema: a do package.json da raiz do monorepo (a mesma do CHANGELOG). */
const { version } = JSON.parse(
  readFileSync(join(process.cwd(), "../../package.json"), "utf8"),
) as { version: string };

/**
 * Cabeçalhos de segurança em toda resposta (ERR-05). Clickjacking: `frame-ancestors 'none'` +
 * `X-Frame-Options`. HSTS: só no navegador, e o proxy já serve HTTPS. A CSP cobre só o enquadramento;
 * uma CSP de `script-src` com nonce fica como evolução, para não quebrar o Next sem necessidade.
 */
const CABECALHOS_DE_SEGURANCA = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
] as const;

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_VERSAO: version },
  // Não anunciar o framework (ERR-05)
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: [...CABECALHOS_DE_SEGURANCA] },
    ];
  },
  // Em dev, aceitar o app aberto também por 127.0.0.1 (e não só localhost): sem isto, o Next
  // bloqueia os recursos de origem cruzada e o "Entrar" não dispara requisição nenhuma.
  allowedDevOrigins: ["127.0.0.1"],
  // Anexos de até 10 MB passam por Server Action (docs/05-modulos/anexos.md)
  experimental: { serverActions: { bodySizeLimit: "11mb" } },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
