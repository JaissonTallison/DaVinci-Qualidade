import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Classe no className: literal ou trecho de template. */
const naClasse = (padrao) =>
  [`Literal[value=${padrao}]`, `TemplateElement[value.raw=${padrao}]`].map(
    (s) => `JSXAttribute[name.name="className"] ${s}`,
  );

const proibido = (padrao, message) =>
  naClasse(padrao).map((selector) => ({ selector, message }));

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // "Cara de IA" não entra (docs/04-design/interface.md §3). O tema também não tem essas classes;
    // o lint explica o porquê na hora, em vez de a classe simplesmente não funcionar.
    rules: {
      "no-restricted-syntax": [
        "error",
        ...proibido(
          "/(^|\\s)(bg-(linear|radial|conic|gradient)-|from-|via-|to-)/",
          "Sem degradê: use cores sólidas dos tokens (bg-superficie, bg-primaria…).",
        ),
        ...proibido(
          "/-\\[(#|rgb|hsl|oklch)/",
          "Sem cor solta (ex.: text-[#7C3AED]): use um token (text-nao-conforme, bg-superficie…).",
        ),
        ...proibido(
          "/(^|\\s)rounded-(lg|xl|2xl|3xl)/",
          "Cantos de no máximo 8 px: rounded-xs (2 px), rounded-sm, rounded-md ou rounded-campo (8 px).",
        ),
        ...proibido(
          "/(^|\\s)shadow-(lg|xl|2xl)/",
          "Sombra só em menu (shadow-sm) e modal (shadow-md); separe camadas com borda.",
        ),
        ...proibido(
          "/(^|\\s)(backdrop-blur|bg-clip-text)/",
          "Sem vidro fosco nem texto com degradê.",
        ),
        ...proibido(
          "/(^|\\s)animate-(bounce|ping|pulse|spin)/",
          "Sem animação decorativa: transição só de cor e opacidade.",
        ),
        {
          selector:
            "JSXText[value=/[\\u{1F300}-\\u{1FAFF}\\u{2600}-\\u{27BF}]/u]",
          message: "Sem emoji na interface: escreva o texto.",
        },
        {
          selector:
            "ImportDeclaration[source.value='next/font/google'] ImportSpecifier[imported.name=/^(Inter|Geist|Manrope|Sora|Poppins)/]",
          message:
            "Tipografia é a família Source (Serif 4, Sans 3, Code Pro). Inter, Geist, Manrope, Sora e Poppins são a cara dos sistemas gerados por IA.",
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
