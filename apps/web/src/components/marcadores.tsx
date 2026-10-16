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
import { Alerta } from "./alerta";

/** Só texto. Vencida vira alerta: há quanto tempo, com o status e o prazo embaixo (interface.md §8). */
export function StatusDaNc({
  status,
  vencida = false,
  prazo,
}: {
  status: StatusNc;
  vencida?: boolean;
  prazo?: string | null;
}) {
  if (vencida)
    return <Alerta texto="Vencida" desde={prazo} detalhe={STATUS_NC[status]} />;
  return (
    <span className="whitespace-nowrap text-texto">{STATUS_NC[status]}</span>
  );
}

/** A cor fica só no marcador; o texto do nível fica na cor do texto (interface.md §5.4). */
export function GravidadeDaNc({ gravidade }: { gravidade: GravidadeNc }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {GRAVIDADES_NC[gravidade]}
    </span>
  );
}

/** Mesmo padrão da NC: atrasado vira alerta com há quanto tempo. */
export function StatusDoPlano({
  status,
  atrasado = false,
  prazo,
}: {
  status: StatusPlano;
  atrasado?: boolean;
  prazo?: string | null;
}) {
  if (atrasado)
    return (
      <Alerta texto="Atrasado" desde={prazo} detalhe={STATUS_PLANO[status]} />
    );
  return (
    <span className="whitespace-nowrap text-texto">{STATUS_PLANO[status]}</span>
  );
}

/** Progresso em texto: quantos de quantos e a porcentagem (sem barra). Concluído em verde. */
export function Progresso({
  valor,
  feitos,
  total,
  unidade = "tarefas",
}: {
  valor: number;
  feitos?: number;
  total?: number;
  unidade?: string;
}) {
  return (
    <span
      className={`whitespace-nowrap ${valor >= 100 ? "font-semibold text-conforme" : "text-texto"}`}
    >
      {total !== undefined && feitos !== undefined
        ? `${feitos} de ${total} ${unidade} · ${valor}%`
        : `${valor}% concluído`}
    </span>
  );
}

/** Reprovada vira alerta: é o resultado que pede ação (abrir NC). */
export function StatusDaInspecao({ status }: { status: StatusInspecao }) {
  if (status === "reprovada") return <Alerta texto={STATUS_INSPECAO[status]} />;
  return (
    <span className="whitespace-nowrap text-texto">
      {STATUS_INSPECAO[status]}
    </span>
  );
}

/** Vencido e reprovado viram alerta: o instrumento não deve ser usado. */
export function SituacaoDoInstrumento({
  situacao,
  desde,
}: {
  situacao: SituacaoInstrumento;
  /** Data em que a calibração venceu. */
  desde?: string | null;
}) {
  if (situacao === "vencido")
    return <Alerta texto={SITUACOES_INSTRUMENTO[situacao]} desde={desde} />;
  if (situacao === "reprovado")
    return <Alerta texto={SITUACOES_INSTRUMENTO[situacao]} />;
  return (
    <span className="whitespace-nowrap text-texto">
      {SITUACOES_INSTRUMENTO[situacao]}
    </span>
  );
}

export function StatusDaAuditoria({ status }: { status: StatusAuditoria }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {STATUS_AUDITORIA[status]}
    </span>
  );
}

/** Tipo da constatação: marcador na cor do nível, texto na cor do texto (interface.md §5.4). */
export function TipoDaConstatacao({ tipo }: { tipo: TipoConstatacao }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {TIPOS_CONSTATACAO[tipo]}
    </span>
  );
}

export function StatusDoAcidente({ status }: { status: StatusAcidente }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {STATUS_ACIDENTE[status]}
    </span>
  );
}

export function TipoDoAcidente({ tipo }: { tipo: TipoAcidente }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {TIPOS_ACIDENTE[tipo]}
    </span>
  );
}

/** Troca vencida vira alerta. */
export function SituacaoDaEntrega({ situacao }: { situacao: SituacaoEntrega }) {
  if (situacao === "troca_vencida")
    return <Alerta texto={SITUACOES_ENTREGA[situacao]} />;
  return (
    <span className="whitespace-nowrap text-texto">
      {SITUACOES_ENTREGA[situacao]}
    </span>
  );
}

/** Validade do CA: vencido vira alerta (bloqueia a entrega); vencendo, só o texto em atenção. */
export function ValidadeDoCa({
  validade,
  vencido,
  venceEmBreve,
}: {
  validade: string;
  vencido: boolean;
  venceEmBreve: boolean;
}) {
  if (vencido) return <Alerta texto="Vencido" desde={validade} />;
  const [a, m, d] = validade.split("-");
  return (
    <span
      className={`whitespace-nowrap ${venceEmBreve ? "text-atencao" : "text-texto"}`}
    >
      {`${d}/${m}/${a}`}
      {venceEmBreve && " · vence em breve"}
    </span>
  );
}

/** A cor fica só no marcador; o texto do nível na cor do texto (interface.md §5.4). */
export function NivelDoRisco({ nivel }: { nivel: NivelDeRisco }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {NIVEIS_DE_RISCO[nivel]}
    </span>
  );
}

/** Liberada com o horário passado vira alerta. */
export function StatusDaPt({
  status,
  vencida = false,
  fim,
}: {
  status: StatusPt;
  vencida?: boolean;
  /** Fim do horário autorizado. */
  fim?: string | null;
}) {
  if (vencida)
    return (
      <Alerta texto="Horário vencido" desde={fim} detalhe={STATUS_PT[status]} />
    );
  return (
    <span className="whitespace-nowrap text-texto">{STATUS_PT[status]}</span>
  );
}

export function ClasseDoRo({ classe }: { classe: ClasseRo }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {CLASSES_RO[classe]}
    </span>
  );
}

export function StatusDaMudanca({ status }: { status: StatusMudanca }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-texto">
      {STATUS_MUDANCA[status]}
    </span>
  );
}

/** Atrasada vira alerta com há quanto tempo. */
export function StatusDaOs({
  status,
  atrasada = false,
  prazo,
}: {
  status: StatusOs;
  atrasada?: boolean;
  prazo?: string | null;
}) {
  if (atrasada)
    return (
      <Alerta texto="Atrasada" desde={prazo} detalhe={STATUS_OS[status]} />
    );
  return (
    <span className="whitespace-nowrap text-texto">{STATUS_OS[status]}</span>
  );
}
