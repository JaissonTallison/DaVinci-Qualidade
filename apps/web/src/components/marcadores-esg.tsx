import {
  NIVEIS_DE_MATERIALIDADE,
  ODS,
  type NivelDeMaterialidade,
} from "@davinci/types";
import { Selo, tomDoNivel } from "./selo";

/** "Alta · 20": selo no tom do nível, sempre com a nota. */
export function Materialidade({
  nivel,
  nota,
}: {
  nivel: NivelDeMaterialidade | null;
  nota: number | null;
}) {
  if (!nivel || nota === null) return <Selo>Não avaliado</Selo>;
  return (
    <Selo tom={tomDoNivel(nivel)}>
      {NIVEIS_DE_MATERIALIDADE[nivel]} · {nota}
    </Selo>
  );
}

/** Ícone do ODS: o número sobre a cor oficial da ONU (exceção de cor da interface.md §5.6). */
export function IconeOds({
  numero,
  tamanho = "sm",
}: {
  numero: number;
  tamanho?: "sm" | "lg";
}) {
  return (
    <span
      title={`ODS ${numero} · ${ODS[numero]}`}
      style={{ background: `var(--dv-ods-${numero})` }}
      className={`inline-flex shrink-0 items-center justify-center rounded-xs font-semibold text-primaria-texto tabular-nums ${tamanho === "lg" ? "size-12 text-xl" : "size-6 text-xs"}`}
    >
      {numero}
    </span>
  );
}
