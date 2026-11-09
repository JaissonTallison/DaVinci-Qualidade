import Link from "next/link";
import { ChevronRight } from "@/components/icones";

interface AtalhoDeModulo {
  numero: string;
  rotulo: string;
  descricao: string;
  href: string;
  permissao: string;
  /** Acento temático (tokens de série): filete à esquerda, número/link na cor e realce fraco no hover. */
  tema: { borda: string; texto: string; hover: string };
}

/** Os 5 módulos de navegação. Ordem fixa. Cada um com a cor do seu tema. */
const MODULOS: AtalhoDeModulo[] = [
  {
    numero: "01",
    rotulo: "Qualidade",
    descricao:
      "Não conformidades, planos de ação, inspeções e melhoria contínua",
    href: "/qualidade/nao-conformidades",
    permissao: "qualidade.ver",
    // Azul
    tema: { borda: "border-serie-1", texto: "text-serie-1", hover: "hover:bg-serie-1/5" },
  },
  {
    numero: "02",
    rotulo: "Serviços",
    descricao: "Ordens de serviço, contratos, reclamações e satisfação",
    href: "/servicos/ordens",
    permissao: "servicos.ver",
    // Roxo
    tema: { borda: "border-serie-7", texto: "text-serie-7", hover: "hover:bg-serie-7/5" },
  },
  {
    numero: "03",
    rotulo: "Segurança do Trabalho",
    descricao: "SST, riscos ocupacionais, EPIs, acidentes e treinamentos",
    href: "/seguranca/acidentes",
    permissao: "seguranca.ver",
    // Laranja (segurança)
    tema: { borda: "border-serie-2", texto: "text-serie-2", hover: "hover:bg-serie-2/5" },
  },
  {
    numero: "04",
    rotulo: "Meio Ambiente",
    descricao: "Licenças, resíduos, aspectos ambientais e monitoramentos",
    href: "/ambiental/licencas",
    permissao: "ambiental.ver",
    // Verde
    tema: { borda: "border-serie-6", texto: "text-serie-6", hover: "hover:bg-serie-6/5" },
  },
  {
    numero: "05",
    rotulo: "Agenda ESG",
    descricao: "Indicadores, metas e relatórios de sustentabilidade",
    href: "/esg/painel",
    permissao: "esg.ver",
    // Esmeralda/teal
    tema: { borda: "border-serie-3", texto: "text-serie-3", hover: "hover:bg-serie-3/5" },
  },
];

/**
 * Grade de atalhos por módulo no Início: card branco do design system com um acento na cor do tema
 * (filete à esquerda, número e "Acessar" na cor, realce bem fraco no hover). Sem cor cheia nem degradê.
 */
export function AtalhosDeModulos({ permissoes }: { permissoes: string[] }) {
  const visiveis = MODULOS.filter((m) => permissoes.includes(m.permissao));
  if (visiveis.length === 0) return null;
  return (
    <section aria-label="Ir para um módulo">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {visiveis.map((m) => (
          <li key={m.rotulo}>
            <Link
              href={m.href}
              className={`group flex h-full flex-col rounded-md border-l-4 ${m.tema.borda} bg-superficie p-5 shadow-sm transition hover:shadow-md ${m.tema.hover}`}
            >
              <span className={`font-mono text-xs ${m.tema.texto}`}>
                {m.numero}
              </span>
              <span className="mt-1 text-md font-semibold text-texto">
                {m.rotulo}
              </span>
              <span className="mt-1 flex-1 text-sm text-texto-2">
                {m.descricao}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-info underline-offset-2 group-hover:underline">
                Acessar
                <ChevronRight aria-hidden size={16} strokeWidth={2} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
