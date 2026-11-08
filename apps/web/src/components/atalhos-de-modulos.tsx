import Link from "next/link";
import { ArrowRight } from "@/components/icones";

interface AtalhoDeModulo {
  numero: string;
  rotulo: string;
  descricao: string;
  href: string;
  permissao: string;
}

/** Os 5 módulos de navegação. Ordem fixa. */
const MODULOS: AtalhoDeModulo[] = [
  {
    numero: "01",
    rotulo: "Qualidade",
    descricao:
      "Não conformidades, planos de ação, inspeções e melhoria contínua",
    href: "/qualidade/nao-conformidades",
    permissao: "qualidade.ver",
  },
  {
    numero: "02",
    rotulo: "Serviços",
    descricao: "Ordens de serviço, contratos, reclamações e satisfação",
    href: "/servicos/ordens",
    permissao: "servicos.ver",
  },
  {
    numero: "03",
    rotulo: "Segurança do Trabalho",
    descricao: "SST, riscos ocupacionais, EPIs, acidentes e treinamentos",
    href: "/seguranca/acidentes",
    permissao: "seguranca.ver",
  },
  {
    numero: "04",
    rotulo: "Meio Ambiente",
    descricao: "Licenças, resíduos, aspectos ambientais e monitoramentos",
    href: "/ambiental/licencas",
    permissao: "ambiental.ver",
  },
  {
    numero: "05",
    rotulo: "Agenda ESG",
    descricao: "Indicadores, metas e relatórios de sustentabilidade",
    href: "/esg/painel",
    permissao: "esg.ver",
  },
];

/** Grade de atalhos por módulo no Início: card branco do design system, sem cor cheia nem ilustração. */
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
              className="group flex h-full flex-col rounded-md bg-superficie p-5 shadow-cartao transition-shadow hover:shadow-sm"
            >
              <span className="font-mono text-xs text-texto-3">{m.numero}</span>
              <span className="mt-1 text-md font-semibold text-texto">
                {m.rotulo}
              </span>
              <span className="mt-1 flex-1 text-sm text-texto-2">
                {m.descricao}
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-info group-hover:underline">
                Acessar
                <ArrowRight aria-hidden size={14} strokeWidth={1.75} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
