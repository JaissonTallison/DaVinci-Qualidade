import Link from "next/link";
import { ChevronRight } from "@/components/icones";
import {
  STATUS_AUDITORIA,
  TIPOS_AUDITORIA,
  type PanoramaAuditorias,
  type StatusAuditoria,
} from "@davinci/types";

const MESES = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];
const periodo = (iso: string) =>
  `${MESES[Number(iso.slice(5, 7)) - 1]}/${iso.slice(2, 4)}`;

/** Segmentos da conformidade, na ordem e cor do desvio (do bom ao grave). */
const SEGMENTOS = [
  { chave: "conformidade", rotulo: "Conforme", cor: "var(--color-conforme)" },
  { chave: "nc_menor", rotulo: "NC menor", cor: "var(--color-atencao)" },
  { chave: "nc_maior", rotulo: "NC maior", cor: "var(--color-nao-conforme)" },
  { chave: "observacao", rotulo: "Observação", cor: "var(--color-texto-3)" },
  {
    chave: "oportunidade",
    rotulo: "Oportunidade",
    cor: "var(--color-serie-1)",
  },
] as const;

/** Cor de cada situação (para o donut e o ponto da tabela). */
const COR_STATUS: Record<StatusAuditoria, string> = {
  planejada: "var(--color-serie-1)",
  em_andamento: "var(--color-atencao)",
  concluida: "var(--color-conforme)",
  cancelada: "var(--color-texto-3)",
};
/** Cor do texto do chip de status. */
const CHIP_STATUS: Record<StatusAuditoria, string> = {
  planejada: "text-texto-2",
  em_andamento: "text-atencao",
  concluida: "text-conforme",
  cancelada: "text-texto-3",
};

function Quadro({
  titulo,
  subtitulo,
  children,
  classe = "",
}: {
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
  classe?: string;
}) {
  return (
    <div
      className={`rounded-md border border-borda bg-superficie p-5 shadow-cartao ${classe}`}
    >
      <h3 className="text-base font-semibold text-texto">{titulo}</h3>
      <p className="mb-4 text-sm text-texto-2">{subtitulo}</p>
      {children}
    </div>
  );
}

/** Painel analítico de Auditorias no Início: conformidade, carga por auditor, situação e recentes. */
export function AuditoriasPanorama({ dados }: { dados: PanoramaAuditorias }) {
  const { conformidadePorTipo, porAuditor, porSituacao, recentes } = dados;
  const maxAuditor = Math.max(1, ...porAuditor.map((a) => a.total));
  const totalSituacao = porSituacao.reduce((t, s) => t + s.total, 0);

  // Arcos do donut de situação (empilhados, começando do topo), sem acumulador mutável
  const r = 42;
  const circ = 2 * Math.PI * r;
  const comprimento = (total: number) =>
    totalSituacao > 0 ? (total / totalSituacao) * circ : 0;
  const visiveis = porSituacao.filter((s) => s.total > 0);
  const arcos = visiveis.map((s, i) => ({
    status: s.status,
    traco: Math.max(comprimento(s.total) - 1.5, 0.5),
    deslocamento: -visiveis
      .slice(0, i)
      .reduce((t, x) => t + comprimento(x.total), 0),
  }));

  return (
    <section
      aria-label="Panorama de auditorias"
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg text-texto">Auditorias — panorama</h2>
          <p className="text-sm text-texto-2">
            Conformidade, carga por auditor, situação e andamento.
          </p>
        </div>
        <Link
          href="/auditorias"
          className="inline-flex items-center gap-1 text-sm font-semibold text-acao hover:underline"
        >
          Ver auditorias
          <ChevronRight aria-hidden size={14} strokeWidth={2} />
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr_0.9fr]">
        {/* Conformidade por tipo (barras empilhadas horizontais) */}
        <Quadro
          titulo="Conformidade por auditoria"
          subtitulo="Constatações por tipo de auditoria"
        >
          {conformidadePorTipo.length === 0 ? (
            <p className="text-sm text-texto-3">
              Nenhuma constatação registrada ainda.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {conformidadePorTipo.map((linha) => {
                  const total = SEGMENTOS.reduce(
                    (t, s) => t + linha[s.chave],
                    0,
                  );
                  return (
                    <li key={linha.tipo} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-right text-xs leading-tight text-texto-2">
                        {TIPOS_AUDITORIA[linha.tipo]}
                      </span>
                      <span className="flex h-5.5 flex-1 overflow-hidden rounded-sm bg-superficie-2">
                        {SEGMENTOS.map((s) =>
                          linha[s.chave] > 0 ? (
                            <span
                              key={s.chave}
                              className="flex items-center justify-center text-[0.7rem] font-bold text-primaria-texto"
                              style={{
                                flexGrow: linha[s.chave],
                                background: s.cor,
                              }}
                              title={`${s.rotulo}: ${linha[s.chave]}`}
                            >
                              {total >= 1 ? linha[s.chave] : ""}
                            </span>
                          ) : null,
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
              <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-texto-2">
                {SEGMENTOS.map((s) => (
                  <li key={s.chave} className="flex items-center gap-1.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-xs"
                      style={{ background: s.cor }}
                    />
                    {s.rotulo}
                  </li>
                ))}
              </ul>
            </>
          )}
        </Quadro>

        {/* Por auditor líder (barras horizontais) */}
        <Quadro titulo="Por auditor líder" subtitulo="Auditorias conduzidas">
          {porAuditor.length === 0 ? (
            <p className="text-sm text-texto-3">
              Nenhuma auditoria cadastrada.
            </p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {porAuditor.map((a) => (
                <li key={a.auditor} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate text-sm text-texto">
                    {a.auditor}
                  </span>
                  <span className="h-3 flex-1 overflow-hidden rounded-full bg-superficie-2">
                    <span
                      className="block h-full rounded-full bg-serie-1"
                      style={{ width: `${(a.total / maxAuditor) * 100}%` }}
                    />
                  </span>
                  <span className="w-5 text-right text-sm font-bold text-texto tabular-nums">
                    {a.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Quadro>

        {/* Por situação (donut) */}
        <Quadro titulo="Situação das auditorias" subtitulo="Total por status">
          {totalSituacao === 0 ? (
            <p className="text-sm text-texto-3">
              Nenhuma auditoria cadastrada.
            </p>
          ) : (
            <div className="flex items-center gap-5">
              <div className="relative size-28 shrink-0">
                <svg
                  viewBox="0 0 100 100"
                  className="size-full -rotate-90"
                  aria-hidden
                >
                  <circle
                    cx={50}
                    cy={50}
                    r={r}
                    fill="none"
                    strokeWidth={16}
                    className="stroke-superficie-2"
                  />
                  {arcos.map((a) => (
                    <circle
                      key={a.status}
                      cx={50}
                      cy={50}
                      r={r}
                      fill="none"
                      strokeWidth={16}
                      stroke={COR_STATUS[a.status]}
                      strokeDasharray={`${a.traco} ${circ - a.traco}`}
                      strokeDashoffset={a.deslocamento}
                    />
                  ))}
                </svg>
                <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="text-xl font-extrabold text-texto tabular-nums">
                    {totalSituacao}
                  </span>
                  <span className="text-[0.6rem] text-texto-2">total</span>
                </span>
              </div>
              <ul className="flex-1 text-sm">
                {porSituacao.map((s) => (
                  <li key={s.status} className="flex items-center gap-2 py-0.5">
                    <span
                      aria-hidden
                      className="size-2.5 rounded-xs"
                      style={{ background: COR_STATUS[s.status] }}
                    />
                    <span className="text-texto-2">
                      {STATUS_AUDITORIA[s.status]}
                    </span>
                    <span className="ml-auto font-bold text-texto tabular-nums">
                      {s.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Quadro>
      </div>

      {/* Acompanhamento (tabela) */}
      {recentes.length > 0 && (
        <div className="overflow-hidden rounded-md border border-borda bg-superficie shadow-cartao">
          <div className="border-b border-borda px-5 py-3.5">
            <h3 className="text-base font-semibold text-texto">
              Auditorias recentes
            </h3>
            <p className="text-sm text-texto-2">
              Últimas auditorias e situação
            </p>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-borda text-left text-xs text-texto-2">
                <th className="py-2.5 pr-3 pl-5 font-semibold">Código</th>
                <th className="px-3 py-2.5 font-semibold">Tipo</th>
                <th className="px-3 py-2.5 font-semibold">Escopo</th>
                <th className="px-3 py-2.5 font-semibold">Período</th>
                <th className="px-3 py-2.5 pr-5 font-semibold">Situação</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-borda last:border-0 odd:bg-superficie-2/40"
                >
                  <td className="py-2.5 pr-3 pl-5">
                    <Link
                      href={`/auditorias/${a.id}`}
                      className="font-mono text-sm font-semibold text-acao hover:underline"
                    >
                      {a.numero}
                    </Link>
                  </td>
                  <td className="px-3 py-3.5 text-sm text-texto-2">
                    {TIPOS_AUDITORIA[a.tipo]}
                  </td>
                  <td className="max-w-xs truncate px-3 py-3.5 text-sm text-texto">
                    {a.escopo}
                  </td>
                  <td className="px-3 py-3.5 text-sm text-texto-2">
                    {periodo(a.dataInicio)}
                  </td>
                  <td className="px-3 py-3.5 pr-5">
                    <span
                      className={`text-sm font-semibold ${CHIP_STATUS[a.status]}`}
                    >
                      {STATUS_AUDITORIA[a.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
