import { campoCompacto, erroDoCampo } from "@/lib/estilos";

const COLUNAS = [
  {
    nome: "oQue",
    rotulo: "O que fazer",
    classe: "min-w-64 flex-[3]",
    max: 300,
  },
  { nome: "responsavel", rotulo: "Quem", classe: "min-w-36 flex-1", max: 120 },
  { nome: "prazo", rotulo: "Até quando", classe: "w-40", tipo: "date" },
  { nome: "onde", rotulo: "Onde", classe: "min-w-28 flex-1", max: 150 },
  { nome: "como", rotulo: "Como", classe: "min-w-40 flex-[2]", max: 1000 },
] as const;

/**
 * Linhas de tarefa no formato 5W2H. Os campos vão como `tarefa_<campo>` repetidos; linha toda vazia é ignorada.
 * Erros chegam como `tarefas.<linha>.<campo>` (criação) ou `tarefa.<campo>` (inclusão de uma só).
 */
export function LinhasDeTarefa({
  quantidade,
  hoje,
  valores,
  erros,
  prefixoDoErro = "tarefas",
}: {
  quantidade: number;
  hoje: string;
  valores?: Record<string, string>[];
  erros: Record<string, string>;
  prefixoDoErro?: "tarefas" | "tarefa";
}) {
  return (
    <div className="mt-3 flex flex-col gap-3">
      {Array.from({ length: quantidade }, (_, i) => {
        const erro = (c: string) =>
          erros[
            prefixoDoErro === "tarefas" ? `tarefas.${i}.${c}` : `tarefa.${c}`
          ];
        return (
          <fieldset key={i} className="flex flex-wrap items-start gap-2">
            <legend className="sr-only">Tarefa {i + 1}</legend>
            {COLUNAS.map((c) => (
              <div key={c.nome} className={`flex flex-col gap-1 ${c.classe}`}>
                <label
                  className="text-xs text-texto-2"
                  htmlFor={`tarefa-${i}-${c.nome}`}
                >
                  {c.rotulo}
                </label>
                <input
                  id={`tarefa-${i}-${c.nome}`}
                  name={`tarefa_${c.nome}`}
                  type={"tipo" in c ? c.tipo : "text"}
                  min={"tipo" in c ? hoje : undefined}
                  maxLength={"max" in c ? c.max : undefined}
                  list={c.nome === "responsavel" ? "pessoas" : undefined}
                  defaultValue={valores?.[i]?.[c.nome]}
                  aria-invalid={Boolean(erro(c.nome))}
                  className={`${campoCompacto} w-full`}
                />
                {erro(c.nome) && (
                  <span className={erroDoCampo}>{erro(c.nome)}</span>
                )}
              </div>
            ))}
          </fieldset>
        );
      })}
    </div>
  );
}
