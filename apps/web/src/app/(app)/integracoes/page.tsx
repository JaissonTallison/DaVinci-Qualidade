import type { Metadata } from "next";
import {
  Blocks,
  ChartColumn,
  ChevronRight,
  Info,
  KeyRound,
  Lock,
  Mail,
  MessageCircle,
  Network,
  Paperclip,
  Send,
  type LucideIcon,
} from "@/components/icones";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { painel, sobretitulo } from "@/lib/estilos";

export const metadata: Metadata = { title: "Integrações" };

type Plataforma = {
  nome: string;
  descricao: string;
  icone: LucideIcon;
  /** Provedor já funcional: o cartão vira um link para a tela de configuração. */
  href?: string;
};

type Categoria = {
  titulo: string;
  descricao: string;
  plataformas: Plataforma[];
};

/**
 * Catálogo de integrações (prévia visual, sem backend ainda — decisão de 09/11/2026).
 * As plataformas foram escolhidas pelo usuário: comunicação, BI e dados, login e anexos, outros sistemas.
 * Quando entrar a conexão de verdade, cada cartão passa a mostrar o estado real e abrir a configuração.
 */
const CATALOGO: Categoria[] = [
  {
    titulo: "Comunicação",
    descricao: "Avise as pessoas pelos canais que a sua empresa já usa.",
    plataformas: [
      {
        nome: "E-mail (servidor próprio)",
        descricao:
          "Envie notificações e alertas de prazo pelo servidor de e-mail da sua empresa, com o seu remetente.",
        icone: Mail,
      },
      {
        nome: "WhatsApp",
        descricao:
          "Avise os responsáveis pelo WhatsApp oficial (Meta) quando um prazo vencer ou uma tarefa for atribuída.",
        icone: MessageCircle,
      },
    ],
  },
  {
    titulo: "BI e dados",
    descricao: "Leve os indicadores para fora e conecte outros sistemas.",
    plataformas: [
      {
        nome: "Power BI",
        descricao:
          "Leve indicadores de TF/TG, não conformidades, auditorias e ESG para painéis no Power BI.",
        icone: ChartColumn,
      },
      {
        nome: "API de acesso",
        descricao:
          "Gere uma chave para outros sistemas lerem seus dados com segurança — só o que você liberar.",
        icone: KeyRound,
        href: "/integracoes/api",
      },
      {
        nome: "Webhooks",
        descricao:
          "Dispare um aviso para um endereço externo sempre que algo acontecer: uma NC aberta, um prazo vencido.",
        icone: Send,
        href: "/integracoes/webhook",
      },
    ],
  },
  {
    titulo: "Login e anexos",
    descricao: "Acesso corporativo e armazenamento de evidências.",
    plataformas: [
      {
        nome: "Login único (SSO)",
        descricao:
          "Deixe a equipe entrar com a conta corporativa do Google Workspace ou do Microsoft Entra.",
        icone: Lock,
      },
      {
        nome: "Armazenamento em nuvem",
        descricao:
          "Guarde evidências e anexos no Google Drive ou no Amazon S3 da sua empresa.",
        icone: Paperclip,
      },
    ],
  },
  {
    titulo: "Outros sistemas",
    descricao: "Troque dados com o que a sua empresa já roda.",
    plataformas: [
      {
        nome: "ERP ou sistema de RH",
        descricao:
          "Importe funcionários, setores e funções de um ERP ou de um sistema de recursos humanos.",
        icone: Network,
      },
      {
        nome: "Outro sistema",
        descricao:
          "Precisa integrar com algo específico? Registre aqui o que falta e a gente avalia a conexão.",
        icone: Blocks,
      },
    ],
  },
];

export default function Integracoes() {
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="Integrações"
        descricao="Conecte o DaVinci Qualidade às plataformas que a sua empresa já usa."
      />

      <div className="mt-6 flex items-start gap-3 rounded-md border border-info-borda bg-info-suave px-4 py-3 text-sm text-texto">
        <Info
          aria-hidden
          size={18}
          strokeWidth={1.75}
          className="mt-0.5 shrink-0 text-info"
        />
        <p>
          Esta é a prévia do catálogo. As conexões ainda não estão ativas —
          estamos montando a experiência antes de ligar cada plataforma. Em
          breve você vai configurar e conectar por aqui.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {CATALOGO.map((categoria) => (
          <section key={categoria.titulo}>
            <h2 className={sobretitulo}>{categoria.titulo}</h2>
            <p className="mt-1 text-sm text-texto-2">{categoria.descricao}</p>
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categoria.plataformas.map((p) => (
                <li key={p.nome} className={`${painel} flex flex-col p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-afundado text-texto-2 shadow-xs">
                      <p.icone aria-hidden size={20} strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-texto">
                        {p.nome}
                      </h3>
                      <p className="mt-1 text-sm text-texto-2">{p.descricao}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-borda pt-3">
                    <span className="text-sm text-texto-3">
                      {p.href ? "Disponível" : "Não conectado"}
                    </span>
                    {p.href ? (
                      <Botao
                        href={p.href}
                        variante="secundario"
                        tamanho="pequeno"
                        iconeDireita={ChevronRight}
                      >
                        Configurar
                      </Botao>
                    ) : (
                      <Botao
                        variante="secundario"
                        tamanho="pequeno"
                        disabled
                        motivo="Em breve: as conexões ainda não estão ativas."
                      >
                        Configurar
                      </Botao>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
