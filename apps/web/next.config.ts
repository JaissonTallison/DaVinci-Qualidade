import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { NextConfig } from "next";

/** Versão do sistema: a do package.json da raiz do monorepo (a mesma do CHANGELOG). */
const { version } = JSON.parse(
  readFileSync(join(process.cwd(), "../../package.json"), "utf8"),
) as { version: string };

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_VERSAO: version },
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
