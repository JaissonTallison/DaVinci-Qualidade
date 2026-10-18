import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  Leaf,
  Shield,
  Wrench,
  type LucideIcon,
} from "lucide-react";

interface AtalhoDeModulo {
  rotulo: string;
  descricao: string;
  href: string;
  Icone: LucideIcon;
  /** Cor cheia do card. */
  cor: string;
  /** Imagem temática de fundo (bem suave sob a cor). Créditos em docs/06-referencias/creditos-imagens.md. */
  img: string;
  permissao: string;
}

/** Os 5 módulos de navegação, cada um com sua cor, ícone e imagem de fundo próprios. Ordem fixa. */
const MODULOS: AtalhoDeModulo[] = [
  {
    rotulo: "Qualidade",
    descricao: "Não conformidades, planos de ação, inspeções e melhoria contínua",
    href: "/qualidade/nao-conformidades",
    Icone: ClipboardList,
    cor: "#2684e8",
    img: "/modulos/qualidade.jpg",
    permissao: "qualidade.ver",
  },
  {
    rotulo: "Serviços",
    descricao: "Ordens de serviço, contratos, reclamações e satisfação",
    href: "/servicos/ordens",
    Icone: Wrench,
    cor: "#7a56ec",
    img: "/modulos/servicos.jpg",
    permissao: "servicos.ver",
  },
  {
    rotulo: "Segurança do Trabalho",
    descricao: "SST, riscos ocupacionais, EPIs, acidentes e treinamentos",
    href: "/seguranca/acidentes",
    Icone: Shield,
    cor: "#ee7f3c",
    img: "/modulos/seguranca.jpg",
    permissao: "seguranca.ver",
  },
  {
    rotulo: "Meio Ambiente",
    descricao: "Licenças, resíduos, aspectos ambientais e monitoramentos",
    href: "/ambiental/licencas",
    Icone: Leaf,
    cor: "#2aa15c",
    img: "/modulos/ambiental.jpg",
    permissao: "ambiental.ver",
  },
  {
    rotulo: "Agenda ESG",
    descricao: "Indicadores, metas e relatórios de sustentabilidade",
    href: "/esg/painel",
    Icone: BarChart3,
    cor: "#149a8b",
    img: "/modulos/esg.jpg",
    permissao: "esg.ver",
  },
];

/** Grade de atalhos por módulo no Início: card de cor cheia com imagem temática bem suave ao fundo. */
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
              className="group relative isolate flex h-full flex-col overflow-hidden rounded-md p-5 text-primaria-texto shadow-cartao transition hover:brightness-110"
              style={{ backgroundColor: m.cor }}
            >
              <Image
                src={m.img}
                alt=""
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 640px) 50vw, 100vw"
                className="-z-10 object-cover"
              />
              <span
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{ backgroundColor: m.cor, opacity: 0.94 }}
              />
              <m.Icone aria-hidden size={26} strokeWidth={2} />
              <span className="mt-3 font-semibold">{m.rotulo}</span>
              <span className="mt-1 flex-1 text-sm text-primaria-texto/85">
                {m.descricao}
              </span>
              <span className="mt-4 inline-flex h-9 w-fit items-center gap-2 rounded-campo bg-primaria-texto/15 px-4 text-base font-semibold text-primaria-texto transition-colors group-hover:bg-primaria-texto/25">
                Acessar
                <ArrowRight
                  aria-hidden
                  size={16}
                  strokeWidth={2}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
