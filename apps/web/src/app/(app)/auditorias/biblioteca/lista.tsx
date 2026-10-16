import {
  NORMAS,
  TEMAS_DO_ANEXO_A,
  type EvidenciaDaBiblioteca,
} from "@davinci/types";
import {
  RiscoDaEvidenciaMarcador,
  TipoDaEvidencia,
} from "@/components/marcadores-auditoria";

/** Lista da biblioteca: norma, cláusula, título, tipo e risco; abre para o que pedir e um exemplo. */
export function ListaDeEvidencias({
  evidencias,
  impressao = false,
}: {
  evidencias: EvidenciaDaBiblioteca[];
  impressao?: boolean;
}) {
  return (
    <ul className="divide-y divide-borda">
      {evidencias.map((e) => (
        <li key={e.codigo} className="break-inside-avoid px-4 py-2.5">
          <details open={impressao} className="group">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1">
              <span className="w-28 shrink-0 text-sm font-semibold text-texto-2">
                {NORMAS[e.norma]}
              </span>
              <span className="w-20 shrink-0 font-mono text-sm">
                {e.clausula}
              </span>
              <span className="min-w-0 flex-1 text-base">
                {e.titulo}
                {e.origem === "propria" && (
                  <span className="text-sm text-texto-2"> · minha</span>
                )}
              </span>
              <TipoDaEvidencia tipo={e.tipo} />
              <RiscoDaEvidenciaMarcador risco={e.risco} />
            </summary>
            <div className="mt-2 grid gap-1 pl-0 text-sm sm:pl-[12.5rem]">
              <p>
                <span className="font-semibold">O que pedir:</span>{" "}
                {e.oQuePedir}
              </p>
              <p>
                <span className="font-semibold">Exemplo aceitável:</span>{" "}
                {e.exemplo}
              </p>
              {e.tema && (
                <p className="text-texto-2">{TEMAS_DO_ANEXO_A[e.tema]}</p>
              )}
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
