import type { ReactNode } from "react";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
} from "@/components/icones";

/** Os quatro tons do alerta do design system. Sem faixa lateral: a cor está no fundo, na borda e no ícone. */
export type TomDoAlerta = "perigo" | "atencao" | "sucesso" | "info";

const TOM: Record<
  TomDoAlerta,
  {
    caixa: string;
    icone: string;
    Icone: typeof Info;
    papel: "alert" | "status";
  }
> = {
  perigo: {
    caixa: "border-nao-conforme-borda bg-nao-conforme-suave",
    icone: "text-nao-conforme-texto",
    Icone: CircleAlert,
    papel: "alert",
  },
  atencao: {
    caixa: "border-atencao-borda bg-atencao-suave",
    icone: "text-atencao-texto",
    Icone: TriangleAlert,
    papel: "status",
  },
  sucesso: {
    caixa: "border-conforme-borda bg-conforme-suave",
    icone: "text-conforme-texto",
    Icone: CircleCheck,
    papel: "status",
  },
  info: {
    caixa: "border-info-borda bg-info-suave",
    icone: "text-info",
    Icone: Info,
    papel: "status",
  },
};

/**
 * Alerta em caixa (interface.md §8): ícone padrão do Lucide no tom, título opcional em negrito, texto e as
 * ações que resolvem. Bloqueio diz o quê, por quê e oferece a ação.
 */
export function CaixaDeAlerta({
  tom,
  titulo,
  acoes,
  className = "",
  children,
}: {
  tom: TomDoAlerta;
  titulo?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const { caixa, icone, Icone, papel } = TOM[tom];
  return (
    <div
      role={papel}
      className={`flex items-start gap-2.5 rounded-campo border px-4 py-3 text-base text-texto ${caixa} ${className}`}
    >
      <Icone
        aria-hidden
        size={16}
        strokeWidth={2}
        className={`mt-0.5 shrink-0 ${icone}`}
      />
      <div className="min-w-0 flex-1">
        {titulo && <p className="font-semibold">{titulo}</p>}
        {children && <div className={titulo ? "mt-0.5" : ""}>{children}</div>}
        {acoes && (
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            {acoes}
          </div>
        )}
      </div>
    </div>
  );
}
