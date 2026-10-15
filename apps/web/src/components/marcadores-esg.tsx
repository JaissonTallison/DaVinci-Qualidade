import {
  NIVEIS_DE_MATERIALIDADE,
  ODS,
  type NivelDeMaterialidade,
} from "@davinci/types";

const COR_DO_NIVEL: Record<NivelDeMaterialidade, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
};

/** "Alta · 20": a cor fica só no marcador; o texto do nível vem sempre com a nota (interface.md §5.4). */
export function Materialidade({
  nivel,
  nota,
}: {
  nivel: NivelDeMaterialidade | null;
  nota: number | null;
}) {
  if (!nivel || nota === null)
    return <span className="text-texto-3">Não avaliado</span>;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2.5 shrink-0 rounded-xs ${COR_DO_NIVEL[nivel]}`}
      />
      {NIVEIS_DE_MATERIALIDADE[nivel]} · {nota}
    </span>
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
