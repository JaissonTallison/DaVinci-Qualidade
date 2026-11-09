import type { Metadata } from "next";
import {
  ClipboardCheck,
  FileSearch,
  FileText,
  Info,
  Lightbulb,
  Mic,
  Search,
  Sparkles,
  type LucideIcon,
} from "@/components/icones";
import {
  CONFIG_DE_INTEGRACOES_PADRAO,
  PROVEDORES_DE_IA,
  type ConfigDeIntegracoes,
} from "@davinci/types";
import { Botao } from "@/components/botao";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { chamarApi } from "@/lib/api";
import { painel, sobretitulo } from "@/lib/estilos";
import { FormularioDeProvedorIa } from "./provedor";

export const metadata: Metadata = { title: "IA / Assistente" };

/**
 * Governança da IA (prévia visual, sem backend ainda — decisão de 09/11/2026).
 * Os seis copilotos ficam embutidos nas telas onde o trabalho acontece; esta página é só onde se
 * configura o provedor, liga/desliga por módulo e se acompanha o consumo. A IA sempre sugere e a
 * pessoa confirma (humano no fim). Ligar de verdade depende da chave do provedor e dos termos de dados.
 */
type Copiloto = {
  nome: string;
  onde: string;
  icone: LucideIcon;
};

const COPILOTOS: Copiloto[] = [
  {
    nome: "Leitura de documentos",
    onde: 'Botão "Preencher com IA" nos formulários — terceiros, licença, calibração.',
    icone: FileSearch,
  },
  {
    nome: "Assistente de auditoria",
    onde: "Constatações e rascunho de relatório, dentro de Auditorias.",
    icone: ClipboardCheck,
  },
  {
    nome: "Causa e ação da não conformidade",
    onde: "Sugestão de causa (5 porquês) e de ações, na tela de NC.",
    icone: Lightbulb,
  },
  {
    nome: "Campo sem teclado",
    onde: "Voz e foto viram itens da inspeção, no celular.",
    icone: Mic,
  },
  {
    nome: "Resumos da direção e ESG",
    onde: "Rascunho da análise crítica e dos textos de materialidade.",
    icone: FileText,
  },
  {
    nome: "Pergunte ao sistema",
    onde: "Busca que vira ação, na barra superior.",
    icone: Search,
  },
];

export default async function IA() {
  const r = await chamarApi<ConfigDeIntegracoes>("/integracoes/config");
  const ia = r.ok ? r.dados.ia : CONFIG_DE_INTEGRACOES_PADRAO.ia;
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="IA / Assistente"
        descricao="Configure onde a inteligência artificial ajuda a sua equipe. A IA sempre sugere; a pessoa confirma."
      />

      <div className="mt-6 flex items-start gap-3 rounded-md border border-info-borda bg-info-suave px-4 py-3 text-sm text-texto">
        <Info
          aria-hidden
          size={18}
          strokeWidth={1.75}
          className="mt-0.5 shrink-0 text-info"
        />
        <p>
          Prévia: os copilotos ainda não estão ativos. Para ligar, falta conectar
          o provedor de IA e fechar os termos de dados (LGPD). Nada é gravado sem
          a sua confirmação.
        </p>
      </div>

      <section className="mt-8">
        <h2 className={sobretitulo}>Provedor de IA</h2>
        <p className="mt-1 text-sm text-texto-2">
          O modelo que gera as sugestões. A chave fica cifrada e o acesso é só o
          que você liberar.
        </p>
        <div className={`${painel} mt-3 p-5`}>
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-afundado text-texto-2 shadow-xs">
              <Sparkles aria-hidden size={20} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-texto">
                {ia.provedor
                  ? `${PROVEDORES_DE_IA[ia.provedor]} conectado`
                  : "Nenhum provedor conectado"}
              </h3>
              <p className="mt-1 text-sm text-texto-2">
                {ia.temChave
                  ? "Chave guardada (cifrada). Os copilotos ligam quando a chamada ao modelo for ativada."
                  : "Escolha um provedor e cole a chave (com termos de não-treino dos dados) para habilitar os copilotos."}
              </p>
            </div>
          </div>
          <div className="mt-4 border-t border-borda pt-4">
            <FormularioDeProvedorIa ia={ia} />
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className={sobretitulo}>Copilotos por módulo</h2>
        <p className="mt-1 text-sm text-texto-2">
          Cada copiloto vive dentro da tela onde o trabalho acontece. Ligue só os
          que fizerem sentido.
        </p>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {COPILOTOS.map((c) => (
            <li key={c.nome} className={`${painel} flex flex-col p-5`}>
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-afundado text-texto-2 shadow-xs">
                  <c.icone aria-hidden size={20} strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-texto">{c.nome}</h3>
                  <p className="mt-1 text-sm text-texto-2">{c.onde}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-borda pt-3">
                <span className="text-sm text-texto-3">Desligado</span>
                <Botao
                  variante="secundario"
                  tamanho="pequeno"
                  disabled
                  motivo="Em breve: conecte o provedor para ligar os copilotos."
                >
                  Configurar
                </Botao>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className={sobretitulo}>Como a IA se comporta</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm text-texto-2">
          <li>
            <span className="font-medium text-texto">Humano sempre no fim.</span>{" "}
            A IA preenche e sugere; a pessoa confere e confirma. Nada é gravado
            sozinho.
          </li>
          <li>
            <span className="font-medium text-texto">Dado protegido.</span> Dado
            de saúde (ASO, exame, acidente) só com termos de não-treino e envio
            mínimo.
          </li>
          <li>
            <span className="font-medium text-texto">Custo visível.</span> O
            consumo por módulo aparece aqui quando a IA estiver ativa.
          </li>
        </ul>
      </section>
    </div>
  );
}
