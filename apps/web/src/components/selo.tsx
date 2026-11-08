import type { ReactNode } from "react";
import { selo, type TomDoSelo } from "@/lib/estilos";

/**
 * Selo de status (badge do design system): retângulo de 22 px, só texto, sem ponto colorido. O tom diz se
 * pede ação (perigo, atenção), se está resolvido (sucesso), em curso (info) ou parado (neutro).
 * Ícone só quando muda o sentido (ex.: cadeado em "Bloqueado").
 */
export function Selo({
  tom = "neutro",
  icone,
  title,
  children,
}: {
  tom?: TomDoSelo;
  icone?: ReactNode;
  title?: string;
  children: ReactNode;
}) {
  return (
    <span className={selo(tom)} title={title}>
      {icone}
      {children}
    </span>
  );
}

/** Tom do nível (risco, gravidade, significância, materialidade): baixo resolvido, médio atenção, alto e crítico perigo. */
export function tomDoNivel(nivel: string): TomDoSelo {
  if (nivel === "baixo" || nivel === "baixa") return "sucesso";
  if (nivel === "moderado" || nivel === "medio" || nivel === "media")
    return "atencao";
  return "perigo";
}
