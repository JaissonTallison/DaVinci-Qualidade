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
  STATUS_DOCUMENTO,
  STATUS_PROCESSO,
  type ClasseRo,
  type StatusMudanca,
  type StatusDocumento,
  type StatusProcesso,
  NIVEIS_DE_RISCO,
  STATUS_PT,
  type NivelDeRisco,
  type StatusPt,
  type SituacaoEntrega,
  TIPOS_ACIDENTE,
  type StatusAcidente,
  type TipoAcidente,
} from "@davinci/types";
import type { TomDoSelo } from "@/lib/estilos";
import { Alerta } from "./alerta";
import { Selo, tomDoNivel } from "./selo";

const TOM_NC: Record<StatusNc, TomDoSelo> = {
  aberta: "info",
  em_tratamento: "info",
  em_verificacao: "atencao",
  encerrada: "sucesso",
  cancelada: "neutro",
};

/** Selo do status. Vencida vira alerta: há quanto tempo, com o status e o prazo embaixo (interface.md §8). */
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
  return <Selo tom={TOM_NC[status]}>{STATUS_NC[status]}</Selo>;
}

/** Gravidade no tom do nível (baixa, média, alta, crítica). */
export function GravidadeDaNc({ gravidade }: { gravidade: GravidadeNc }) {
  return <Selo tom={tomDoNivel(gravidade)}>{GRAVIDADES_NC[gravidade]}</Selo>;
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
  const tom: Record<StatusPlano, TomDoSelo> = {
    em_execucao: "info",
    aguardando_eficacia: "atencao",
    encerrado: "sucesso",
    cancelado: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_PLANO[status]}</Selo>;
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
  const tom: Record<StatusInspecao, TomDoSelo> = {
    em_andamento: "info",
    aprovada: "sucesso",
    reprovada: "perigo",
    cancelada: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_INSPECAO[status]}</Selo>;
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
  const tom: Record<SituacaoInstrumento, TomDoSelo> = {
    sem_calibracao: "atencao",
    em_dia: "sucesso",
    vence_em_breve: "atencao",
    vencido: "perigo",
    reprovado: "perigo",
    fora_de_uso: "neutro",
  };
  return <Selo tom={tom[situacao]}>{SITUACOES_INSTRUMENTO[situacao]}</Selo>;
}

export function StatusDaAuditoria({ status }: { status: StatusAuditoria }) {
  const tom: Record<StatusAuditoria, TomDoSelo> = {
    planejada: "neutro",
    em_andamento: "info",
    concluida: "sucesso",
    cancelada: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_AUDITORIA[status]}</Selo>;
}

/** Tipo da constatação: NC maior em perigo, NC menor em atenção, conformidade em sucesso. */
export function TipoDaConstatacao({ tipo }: { tipo: TipoConstatacao }) {
  const tom: Record<TipoConstatacao, TomDoSelo> = {
    conformidade: "sucesso",
    nc_maior: "perigo",
    nc_menor: "atencao",
    observacao: "info",
    oportunidade: "neutro",
  };
  return <Selo tom={tom[tipo]}>{TIPOS_CONSTATACAO[tipo]}</Selo>;
}

export function StatusDoAcidente({ status }: { status: StatusAcidente }) {
  const tom: Record<StatusAcidente, TomDoSelo> = {
    registrado: "atencao",
    em_investigacao: "info",
    concluido: "sucesso",
    cancelado: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_ACIDENTE[status]}</Selo>;
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
  const tom: Record<SituacaoEntrega, TomDoSelo> = {
    em_uso: "sucesso",
    troca_vencida: "perigo",
    devolvido: "neutro",
    anulada: "neutro",
  };
  return <Selo tom={tom[situacao]}>{SITUACOES_ENTREGA[situacao]}</Selo>;
}

/** Validade do CA: vencido vira alerta (bloqueia a entrega); vencendo, selo de atenção ao lado da data. */
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
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-texto">
      {`${d}/${m}/${a}`}
      {venceEmBreve && <Selo tom="atencao">Vence em breve</Selo>}
    </span>
  );
}

/** Nível do risco no tom do nível (baixo, moderado, alto, crítico). */
export function NivelDoRisco({ nivel }: { nivel: NivelDeRisco }) {
  return <Selo tom={tomDoNivel(nivel)}>{NIVEIS_DE_RISCO[nivel]}</Selo>;
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
  const tom: Record<StatusPt, TomDoSelo> = {
    solicitada: "atencao",
    liberada: "sucesso",
    encerrada: "neutro",
    cancelada: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_PT[status]}</Selo>;
}

export function ClasseDoRo({ classe }: { classe: ClasseRo }) {
  return <Selo tom={tomDoNivel(classe)}>{CLASSES_RO[classe]}</Selo>;
}

export function StatusDaMudanca({ status }: { status: StatusMudanca }) {
  const tom: Record<StatusMudanca, TomDoSelo> = {
    proposta: "neutro",
    aprovada: "info",
    implementada: "sucesso",
    rejeitada: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_MUDANCA[status]}</Selo>;
}

/** Revisão vencida vira alerta (vigente com a próxima revisão no passado). */
export function StatusDoDocumento({
  status,
  vencida = false,
  proximaRevisao,
}: {
  status: StatusDocumento;
  vencida?: boolean;
  proximaRevisao?: string | null;
}) {
  const tom: Record<StatusDocumento, TomDoSelo> = {
    rascunho: "neutro",
    em_revisao: "atencao",
    vigente: "sucesso",
    obsoleto: "neutro",
  };
  if (vencida)
    return (
      <Alerta
        texto="Revisão vencida"
        desde={proximaRevisao}
        detalhe={STATUS_DOCUMENTO[status]}
      />
    );
  return <Selo tom={tom[status]}>{STATUS_DOCUMENTO[status]}</Selo>;
}

export function StatusDoProcesso({
  status,
  vencida = false,
  proximaRevisao,
}: {
  status: StatusProcesso;
  vencida?: boolean;
  proximaRevisao?: string | null;
}) {
  const tom: Record<StatusProcesso, TomDoSelo> = {
    em_elaboracao: "neutro",
    em_revisao: "atencao",
    aprovado: "info",
    publicado: "sucesso",
    obsoleto: "neutro",
    cancelado: "neutro",
  };
  if (vencida)
    return (
      <Alerta
        texto="Revisão vencida"
        desde={proximaRevisao}
        detalhe={STATUS_PROCESSO[status]}
      />
    );
  return <Selo tom={tom[status]}>{STATUS_PROCESSO[status]}</Selo>;
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
  const tom: Record<StatusOs, TomDoSelo> = {
    aberta: "neutro",
    em_execucao: "info",
    concluida: "sucesso",
    cancelada: "neutro",
  };
  return <Selo tom={tom[status]}>{STATUS_OS[status]}</Selo>;
}
