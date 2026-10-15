import {
  GRAVIDADES_NC,
  STATUS_NC,
  STATUS_PLANO,
  type GravidadeNc,
  type StatusNc,
  type StatusPlano,
} from "@davinci/types";

const COR_DO_STATUS: Record<StatusNc, string> = {
  aberta: "bg-atencao",
  em_tratamento: "bg-info",
  em_verificacao: "bg-info",
  encerrada: "bg-conforme",
  cancelada: "bg-neutro",
};

/** Ponto + texto. Fundo colorido só quando exige ação: vencida (interface.md §8). */
export function StatusDaNc({
  status,
  vencida = false,
}: {
  status: StatusNc;
  vencida?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${vencida ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${vencida ? "bg-nao-conforme" : COR_DO_STATUS[status]}`}
      />
      {STATUS_NC[status]}
      {vencida && " · vencida"}
    </span>
  );
}

const COR_DO_NIVEL: Record<GravidadeNc, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
  critica: "bg-nivel-critico",
};

/** A cor fica só no marcador; o texto do nível fica na cor do texto (interface.md §5.4). */
export function GravidadeDaNc({ gravidade }: { gravidade: GravidadeNc }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-xs ${COR_DO_NIVEL[gravidade]}`}
      />
      {GRAVIDADES_NC[gravidade]}
    </span>
  );
}

const COR_DO_PLANO: Record<StatusPlano, string> = {
  em_execucao: "bg-info",
  aguardando_eficacia: "bg-atencao",
  encerrado: "bg-conforme",
  cancelado: "bg-neutro",
};

/** Mesmo padrão da NC: ponto + texto; fundo colorido só quando atrasado. */
export function StatusDoPlano({
  status,
  atrasado = false,
}: {
  status: StatusPlano;
  atrasado?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${atrasado ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${atrasado ? "bg-nao-conforme" : COR_DO_PLANO[status]}`}
      />
      {STATUS_PLANO[status]}
      {atrasado && " · atrasado"}
    </span>
  );
}

/** Barra fina de progresso, com o número ao lado: a barra ajuda a comparar, o número é o dado. */
export function Progresso({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span
        aria-hidden
        className="h-1.5 w-16 overflow-hidden rounded-xs bg-superficie-2"
      >
        <span
          className="block h-full bg-conforme"
          style={{ width: `${valor}%` }}
        />
      </span>
      <span className="text-sm text-texto-2">{valor}%</span>
    </span>
  );
}
