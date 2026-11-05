/**
 * Auditoria interna simples: um documento só (cabeçalho + tabela por setor), à parte da auditoria
 * completa (plano/execução/constatações). ISO 19011. Serviço auditorias.
 */
import { z } from 'zod';
import { data, texto, textoOpcional } from './validadores.js';

const versao = z
  .string({ error: 'Versão do registro ausente: recarregue a página.' })
  .min(1);

export const linhaDaAuditoriaSimplesSchema = z.object({
  setor: texto('o setor', 120, 1),
  comentarios: textoOpcional(2000),
  pontosPositivos: textoOpcional(2000),
  observacoes: textoOpcional(2000),
  naoConformidade: textoOpcional(2000),
});

const campos = {
  data: data('a data'),
  horario: textoOpcional(20),
  unidade: textoOpcional(120),
  setoresEnvolvidos: textoOpcional(300),
  auditores: textoOpcional(300),
  areaFoco: textoOpcional(1000),
  linhas: z
    .array(linhaDaAuditoriaSimplesSchema)
    .max(50, 'No máximo 50 setores.')
    .default([]),
};
export const novaAuditoriaSimplesSchema = z.object(campos);
export type NovaAuditoriaSimples = z.input<typeof novaAuditoriaSimplesSchema>;
export const atualizarAuditoriaSimplesSchema = z.object({ ...campos, versao });

export interface LinhaDaAuditoriaSimples {
  setor: string;
  comentarios: string | null;
  pontosPositivos: string | null;
  observacoes: string | null;
  naoConformidade: string | null;
}

export interface AuditoriaSimples {
  id: string;
  numero: string;
  data: string;
  horario: string | null;
  unidade: string | null;
  setoresEnvolvidos: string | null;
  auditores: string | null;
  areaFoco: string | null;
  linhas: LinhaDaAuditoriaSimples[];
  versao: string;
}

export interface AuditoriaSimplesResumo {
  id: string;
  numero: string;
  data: string;
  unidade: string | null;
  setores: number;
}
