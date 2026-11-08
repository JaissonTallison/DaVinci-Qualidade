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
          "Cantos de no máximo 8 px: rounded-xs (4 px, selo), rounded-sm ou rounded-campo (6 px, botão e campo), rounded-md (8 px, card).",
        ),
        ...proibido(
          "/(^|\\s)shadow-(lg|xl|2xl)/",
          "Elevação só pelos tokens: shadow-xs (campo), shadow-cartao (card), shadow-sm (menu, aviso flutuante) e shadow-md (modal).",
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
            "Tipografia é IBM Plex Sans e IBM Plex Mono (design system de 08/11/2026). Inter, Geist, Manrope, Sora e Poppins são a cara dos sistemas gerados por IA.",
        },
        {
          selector:
            "JSXAttribute[name.name='className'] Identifier[name=/^botao(Primario|Secundario|Perigo|Fantasma|Pequeno|Icone|Link)$/]",
          message:
            "Use o componente Botao (components/botao.tsx) com variante e tamanho; a classe solta fica só para o gatilho do Suspenso.",
        },
      ],
    },
  },
  {
    // Ícone da tela é navegação: só no menu, na barra superior, na busca e nos atalhos de tela. Em botão, o ícone diz a ação (interface.md §8).
    files: ["src/**/*.tsx"],
    ignores: [
      "src/components/icones-do-menu.tsx",
      "src/components/menu-lateral.tsx",
      "src/components/barra-superior.tsx",
      "src/components/barra-inferior.tsx",
      "src/components/pesquisa.tsx",
      "src/components/linha-de-prazo.tsx",
      "src/app/(app)/qualidade/configuracoes/page.tsx",
      "src/app/(app)/auditorias/biblioteca-do-auditor/page.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/components/icones-do-menu",
              importNames: ["IconeDaTela"],
              message:
                "Ícone da tela é do menu. Em botão use o ícone da ação (Plus cria, Pencil edita, Trash2 exclui) no prop icone do Botao.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
