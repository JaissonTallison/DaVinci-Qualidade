import { CircleAlert } from "lucide-react";
import {
  GRAVIDADES_NC,
  SITUACOES_INSTRUMENTO,
  STATUS_AUDITORIA,
  STATUS_INSPECAO,
  STATUS_NC,
  STATUS_PLANO,
  TIPOS_CONSTATACAO,
  type GravidadeNc,
  type SituacaoInstrumento,
  type StatusAuditoria,
  type StatusInspecao,
  type StatusNc,
  type StatusPlano,
  type TipoConstatacao,
  STATUS_ACIDENTE,
  SITUACOES_ENTREGA,
  STATUS_OS,
  type StatusOs,
  CLASSES_RO,
  STATUS_MUDANCA,
  type ClasseRo,
  type StatusMudanca,
  NIVEIS_DE_RISCO,
  STATUS_PT,
  type NivelDeRisco,
  type StatusPt,
  type SituacaoEntrega,
  TIPOS_ACIDENTE,
  type StatusAcidente,
  type TipoAcidente,
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
      {vencida ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${vencida ? "bg-nao-conforme" : COR_DO_STATUS[status]}`}
        />
      )}
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
      {atrasado ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${atrasado ? "bg-nao-conforme" : COR_DO_PLANO[status]}`}
        />
      )}
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

const COR_DA_INSPECAO: Record<StatusInspecao, string> = {
  em_andamento: "bg-info",
  aprovada: "bg-conforme",
  reprovada: "bg-nao-conforme",
  cancelada: "bg-neutro",
};

/** Reprovada ganha fundo: é o resultado que pede ação (abrir NC). */
export function StatusDaInspecao({ status }: { status: StatusInspecao }) {
  const reprovada = status === "reprovada";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${reprovada ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {reprovada ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${COR_DA_INSPECAO[status]}`}
        />
      )}
      {STATUS_INSPECAO[status]}
    </span>
  );
}

const COR_DO_INSTRUMENTO: Record<SituacaoInstrumento, string> = {
  em_dia: "bg-conforme",
  vence_em_breve: "bg-atencao",
  vencido: "bg-nao-conforme",
  reprovado: "bg-nao-conforme",
  sem_calibracao: "bg-neutro",
  fora_de_uso: "bg-neutro",
};

/** Vencido e reprovado ganham fundo: o instrumento não deve ser usado. */
export function SituacaoDoInstrumento({
  situacao,
}: {
  situacao: SituacaoInstrumento;
}) {
  const bloqueia = situacao === "vencido" || situacao === "reprovado";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${bloqueia ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {bloqueia ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${COR_DO_INSTRUMENTO[situacao]}`}
        />
      )}
      {SITUACOES_INSTRUMENTO[situacao]}
    </span>
  );
}

const COR_DA_AUDITORIA: Record<StatusAuditoria, string> = {
  planejada: "bg-neutro",
  em_andamento: "bg-info",
  concluida: "bg-conforme",
  cancelada: "bg-neutro",
};

export function StatusDaAuditoria({ status }: { status: StatusAuditoria }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR_DA_AUDITORIA[status]}`}
      />
      {STATUS_AUDITORIA[status]}
    </span>
  );
}

const COR_DA_CONSTATACAO: Record<TipoConstatacao, string> = {
  conformidade: "bg-conforme",
  nc_maior: "bg-nivel-critico",
  nc_menor: "bg-nivel-alto",
  observacao: "bg-nivel-medio",
  oportunidade: "bg-info",
};

/** Tipo da constatação: marcador na cor do nível, texto na cor do texto (interface.md §5.4). */
export function TipoDaConstatacao({ tipo }: { tipo: TipoConstatacao }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-xs ${COR_DA_CONSTATACAO[tipo]}`}
      />
      {TIPOS_CONSTATACAO[tipo]}
    </span>
  );
}

const COR_DO_ACIDENTE: Record<StatusAcidente, string> = {
  registrado: "bg-atencao",
  em_investigacao: "bg-info",
  concluido: "bg-conforme",
  cancelado: "bg-neutro",
};

export function StatusDoAcidente({ status }: { status: StatusAcidente }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR_DO_ACIDENTE[status]}`}
      />
      {STATUS_ACIDENTE[status]}
    </span>
  );
}

const COR_DO_TIPO_DE_ACIDENTE: Record<TipoAcidente, string> = {
  com_afastamento: "bg-nivel-critico",
  sem_afastamento: "bg-nivel-alto",
  incidente: "bg-nivel-medio",
  quase_acidente: "bg-nivel-baixo",
};

export function TipoDoAcidente({ tipo }: { tipo: TipoAcidente }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-xs ${COR_DO_TIPO_DE_ACIDENTE[tipo]}`}
      />
      {TIPOS_ACIDENTE[tipo]}
    </span>
  );
}

const COR_DA_ENTREGA: Record<SituacaoEntrega, string> = {
  em_uso: "bg-conforme",
  troca_vencida: "bg-nao-conforme",
  devolvido: "bg-neutro",
  anulada: "bg-neutro",
};

/** Troca vencida pede ação: fundo. */
export function SituacaoDaEntrega({ situacao }: { situacao: SituacaoEntrega }) {
  const alerta = situacao === "troca_vencida";
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${alerta ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {alerta ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${COR_DA_ENTREGA[situacao]}`}
        />
      )}
      {SITUACOES_ENTREGA[situacao]}
    </span>
  );
}

/** Validade do CA: vencido bloqueia a entrega (fundo); vencendo, só o texto em atenção. */
export function ValidadeDoCa({
  validade,
  vencido,
  venceEmBreve,
}: {
  validade: string;
  vencido: boolean;
  venceEmBreve: boolean;
}) {
  const [a, m, d] = validade.split("-");
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap ${vencido ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : venceEmBreve ? "text-atencao" : "text-texto"}`}
    >
      {vencido && (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      )}
      {`${d}/${m}/${a}`}
      {vencido ? " · vencido" : venceEmBreve ? " · vence em breve" : ""}
    </span>
  );
}

const COR_DO_RISCO: Record<NivelDeRisco, string> = {
  baixo: "bg-nivel-baixo",
  moderado: "bg-nivel-medio",
  alto: "bg-nivel-alto",
  critico: "bg-nivel-critico",
};

/** A cor fica só no marcador; o texto do nível na cor do texto (interface.md §5.4). */
export function NivelDoRisco({ nivel }: { nivel: NivelDeRisco }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2.5 shrink-0 rounded-xs ${COR_DO_RISCO[nivel]}`}
      />
      {NIVEIS_DE_RISCO[nivel]}
    </span>
  );
}

const COR_DA_PT: Record<StatusPt, string> = {
  solicitada: "bg-atencao",
  liberada: "bg-conforme",
  encerrada: "bg-neutro",
  cancelada: "bg-neutro",
};

/** Liberada com o horário passado pede ação: fundo. */
export function StatusDaPt({
  status,
  vencida = false,
}: {
  status: StatusPt;
  vencida?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${vencida ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {vencida ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${vencida ? "bg-nao-conforme" : COR_DA_PT[status]}`}
        />
      )}
      {STATUS_PT[status]}
      {vencida && " · horário vencido"}
    </span>
  );
}

const COR_DA_CLASSE: Record<ClasseRo, string> = {
  baixa: "bg-nivel-baixo",
  media: "bg-nivel-medio",
  alta: "bg-nivel-alto",
};

export function ClasseDoRo({ classe }: { classe: ClasseRo }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2.5 shrink-0 rounded-xs ${COR_DA_CLASSE[classe]}`}
      />
      {CLASSES_RO[classe]}
    </span>
  );
}

const COR_DA_MUDANCA: Record<StatusMudanca, string> = {
  proposta: "bg-atencao",
  aprovada: "bg-info",
  implementada: "bg-conforme",
  rejeitada: "bg-neutro",
};

export function StatusDaMudanca({ status }: { status: StatusMudanca }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      <span
        aria-hidden
        className={`size-2 shrink-0 rounded-full ${COR_DA_MUDANCA[status]}`}
      />
      {STATUS_MUDANCA[status]}
    </span>
  );
}

const COR_DA_OS: Record<StatusOs, string> = {
  aberta: "bg-atencao",
  em_execucao: "bg-info",
  concluida: "bg-conforme",
  cancelada: "bg-neutro",
};

/** Atrasada pede ação: fundo e ícone. */
export function StatusDaOs({
  status,
  atrasada = false,
}: {
  status: StatusOs;
  atrasada?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap ${atrasada ? "rounded-xs bg-nao-conforme/10 px-1.5 text-nao-conforme" : "text-texto"}`}
    >
      {atrasada ? (
        <CircleAlert
          aria-hidden
          size={14}
          strokeWidth={2}
          className="shrink-0"
        />
      ) : (
        <span
          aria-hidden
          className={`size-2 shrink-0 rounded-full ${COR_DA_OS[status]}`}
        />
      )}
      {STATUS_OS[status]}
      {atrasada && " · atrasada"}
    </span>
  );
}
