import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { painel, tituloDaPagina, tituloDaSecao } from "@/lib/estilos";

export const metadata: Metadata = { title: "Manual de auditorias" };

const ETAPAS: {
  n: number;
  nome: string;
  o: string;
  telas: [string, string][];
}[] = [
  {
    n: 1,
    nome: "Planejar",
    o: "Kit pré-auditoria com prazos de 90 dias ao dia D, plano enviado ao auditado e roteiro de entrevista por processo.",
    telas: [
      ["Kit", "kit"],
      ["Plano", "plano"],
      ["Roteiro", "roteiro"],
    ],
  },
  {
    n: 2,
    nome: "Auditar",
    o: "Responder cada pergunta como Conforme, Parcial ou Não conforme com a evidência objetiva; ao lado, o que pedir naquela cláusula.",
    telas: [["Execução", "execucao"]],
  },
  {
    n: 3,
    nome: "Registrar",
    o: "Parcial e Não conforme viram constatações, com modelo do banco de NCs ou redação própria; as NCs são abertas na Qualidade.",
    telas: [["Achados", "achados"]],
  },
  {
    n: 4,
    nome: "Tratar",
    o: "Cada NC acompanhada até a eficácia: plano de ação, tarefas, evidência de fechamento e verificação.",
    telas: [["Tratar", "tratar"]],
  },
  {
    n: 5,
    nome: "Entregar",
    o: "Revisão automática em 20 verificações, pontos fortes, conclusão e o PDF nos modelos Clássico e Executivo.",
    telas: [["Relatório", "relatorio"]],
  },
];

const APOIO: [string, string, string][] = [
  [
    "Biblioteca de evidências",
    "/auditorias/biblioteca",
    "O que pedir em cada cláusula, o tipo de evidência e o risco se ela não existir. Na ISO 27001, filtre pelo tema e pelo controle do Anexo A.",
  ],
  [
    "Banco de NCs",
    "/auditorias/banco-de-ncs",
    "Modelos de redação com causa raiz comum, ação corretiva e evidência de fechamento, e o assistente com três prompts.",
  ],
  [
    "Prompts de IA",
    "/auditorias/prompts",
    "Comandos prontos por norma, categoria, processo e tipo de evidência, com dica de uso.",
  ],
  [
    "Minha biblioteca",
    "/auditorias/minha-biblioteca",
    "Critérios, perguntas, evidências e modelos de NC da empresa; importação por planilha.",
  ],
  [
    "Log do Auditor",
    "/auditorias/log",
    "Histórico de quem audita e a declaração de experiência com as organizações anonimizadas.",
  ],
];

const GLOSSARIO: [string, string, string?][] = [
  [
    "Critérios de auditoria",
    "Requisitos usados como referência: normas, documentos internos, requisitos legais e do cliente.",
    "ISO 9001:2026; PR-08; requisitos específicos do cliente (CSR).",
  ],
  [
    "Horas de auditoria",
    "Tempo efetivo de auditoria conduzida, sem a preparação e a redação do relatório.",
  ],
  [
    "Prontidão",
    "Itens do kit concluídos sobre o total.",
    "18 de 30 itens = 60%.",
  ],
  [
    "Resposta esperada e sinal de alerta",
    "A esperada caracteriza conformidade; o alerta indica desvio e pede aprofundamento.",
    "Esperada: avaliamos o fornecedor a cada 6 meses. Alerta: a gente confia, é fornecedor antigo.",
  ],
  [
    "Conforme, Parcial, Não conforme",
    "Atendido e evidenciado; atendido em parte ou sem evidência completa; requisito não atendido.",
  ],
  [
    "Evidência objetiva",
    "Dado verificável que comprova o atendimento: documento, registro, medição ou observação identificada.",
    "Certificado de calibração 8821, válido até 09/2027.",
  ],
  [
    "Nível de risco",
    "Impacto provável se a evidência não existir; ajuda a priorizar o que investigar.",
  ],
  [
    "Controle do Anexo A",
    "Nas evidências da ISO 27001, o controle do Anexo A:2022 (93 controles em 4 temas) ligado ao item.",
  ],
  [
    "NC maior, NC menor, observação",
    "Falha sistêmica ou ausência do requisito; falha pontual e isolada; ponto de atenção que ainda não é desvio.",
  ],
  [
    "Causa raiz",
    "O que permitiu o desvio, não a repetição do fato.",
    "Fato: registro sem assinatura. Causa: o procedimento não define quem aprova.",
  ],
  [
    "Correção e ação corretiva",
    "A correção resolve o caso; a ação corretiva elimina a causa para não se repetir.",
    "Correção: assinar o registro. Corretiva: revisar o procedimento definindo o aprovador.",
  ],
  [
    "Evidência de fechamento",
    "Registro que comprova que a ação foi executada.",
    "Documento revisado, lista de presença, tela do sistema.",
  ],
  [
    "Verificação de eficácia",
    "Checagem posterior, em geral de 30 a 90 dias, de que o problema não voltou.",
  ],
  [
    "Escopo e objetivo",
    "Escopo é o que foi auditado (processos, unidade, norma); objetivo é o porquê (verificar conformidade, preparar a recertificação).",
  ],
  [
    "Metodologia",
    "Como a auditoria foi feita: entrevistas, análise documental, observação in loco e amostragem (ISO 19011).",
  ],
  [
    "Índice de conformidade",
    "Conformes sobre conformes, parciais e não conformes, em porcentagem. Pendentes não contam.",
  ],
];

const FAQ: [string, ReactNode][] = [
  [
    "Várias auditorias podem ficar abertas?",
    "Sim. Cada auditoria tem as próprias etapas; o que se seleciona, responde e registra numa delas segue só para as etapas seguintes dela (perguntas, respostas, NCs, planos e relatório).",
  ],
  [
    "Dá para consultar os bancos sem auditoria?",
    "Sim. Biblioteca de evidências, Banco de NCs e Prompts de IA funcionam como consulta, sem auditoria.",
  ],
  [
    "Como uma pergunta chega ao relatório?",
    "Incluída no roteiro, ela aparece em Auditar. Respondida, entra no relatório como entrevista conduzida; Parcial e Não conforme viram achados a registrar.",
  ],
  [
    "Como uma NC vira plano de ação?",
    "Formalizada na etapa Registrar, a NC abre na Qualidade. Em Tratar, cada NC sem plano tem o atalho para criar o plano já ligado a ela.",
  ],
  [
    "As verificações impedem o relatório?",
    "Não. As 20 verificações apontam o que falta e onde corrigir; o PDF sai a qualquer momento. Só concluir a auditoria exige as NCs formalizadas.",
  ],
  [
    "Quais normas estão incluídas?",
    "ISO 9001:2026 e 2015, ISO 14001:2026 e 2015, ISO 45001:2018, ISO/IEC 27001:2022, ISO 28000:2022, ISO 31000:2018, IATF 16949:2016 e SGI integrado. Cada auditoria usa uma edição só por norma.",
  ],
  [
    "O que posso editar no relatório?",
    "Dados e metodologia no plano; redação, causa raiz e ação de cada constatação na etapa Registrar; pontos fortes e conclusão no Relatório.",
  ],
  [
    "E a NC que não está no banco?",
    "Registre como NC personalizada (sem modelo) ou parta de um modelo parecido e ajuste. Modelos que se repetem podem ir para a Minha biblioteca.",
  ],
  [
    "As respostas ficam salvas?",
    "Sim, cada resposta é gravada ao salvar, com a data. Concluída a auditoria, nada muda mais.",
  ],
  [
    "Como exporto em PDF?",
    "Roteiro de campo, biblioteca (respeitando os filtros), plano, relatório e declaração têm versão para imprimir; no navegador, escolha Salvar como PDF.",
  ],
  [
    "Como funcionam os controles do Anexo A?",
    "Na ISO 27001, evidências e modelos de NC trazem o controle (ex.: A.5.15) e o tema; filtre por eles na biblioteca e no banco de NCs.",
  ],
  [
    "Posso salvar um filtro?",
    "Sim. Depois de filtrar, dê um nome em Buscas salvas. Ele fica neste navegador para reaplicar na próxima auditoria.",
  ],
  [
    "Quem pode registrar e quem só consulta?",
    "Consultar pede a permissão de ver auditorias; responder, registrar, montar o plano e importar pedem a de editar. Ajuste em Administração, perfis.",
  ],
];

/** Manual da jornada de auditoria: fluxo, guia por tela, glossário e perguntas frequentes. */
export default function Manual() {
  return (
    <article className="max-w-5xl">
      <h1 className={tituloDaPagina}>Manual de auditorias</h1>
      <p className="mt-1 max-w-3xl text-base text-texto-2">
        Cada etapa alimenta a seguinte: as perguntas do roteiro viram respostas,
        as respostas viram achados, os achados viram NCs, as NCs viram planos e
        tudo entra no relatório.
      </p>

      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>O fluxo</h2>
        <ol className="mt-3 grid gap-3 md:grid-cols-5">
          {ETAPAS.map((e) => (
            <li key={e.n} className="border-l-2 border-menu pl-3">
              <p className="text-sm text-texto-2 tabular-nums">Etapa {e.n}</p>
              <p className="font-semibold">{e.nome}</p>
              <p className="mt-1 text-sm">{e.o}</p>
              <p className="mt-1 text-xs text-texto-3">
                Na auditoria: {e.telas.map(([t]) => t).join(", ")}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-sm text-texto-2">
          Comece em{" "}
          <Link href="/auditorias/nova" className="text-info hover:underline">
            Nova auditoria
          </Link>
          ; o resumo de cada auditoria mostra a trilha e o próximo passo.
        </p>
      </section>

      <section className={`${painel} mt-6 p-5`}>
        <h2 className={tituloDaSecao}>Apoio a qualquer momento</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-2">
          {APOIO.map(([t, href, d]) => (
            <div key={t}>
              <dt>
                <Link
                  href={href}
                  className="font-semibold text-info hover:underline"
                >
                  {t}
                </Link>
              </dt>
              <dd className="mt-0.5 text-sm">{d}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Glossário</h2>
        <dl className="mt-3 divide-y divide-borda border-t border-borda">
          {GLOSSARIO.map(([t, d, ex]) => (
            <div
              key={t}
              className="grid gap-1 px-5 py-2.5 sm:grid-cols-[14rem_minmax(0,1fr)]"
            >
              <dt className="font-semibold">{t}</dt>
              <dd className="text-sm">
                {d}
                {ex && (
                  <span className="mt-0.5 block text-texto-2">
                    Exemplo: {ex}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={`${painel} mt-6`}>
        <h2 className={`${tituloDaSecao} px-5 pt-5`}>Perguntas frequentes</h2>
        <ul className="mt-3 divide-y divide-borda border-t border-borda">
          {FAQ.map(([p, r]) => (
            <li key={p} className="px-5 py-2.5">
              <details>
                <summary className="cursor-pointer font-semibold">{p}</summary>
                <p className="mt-1 max-w-[80ch] text-sm">{r}</p>
              </details>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
