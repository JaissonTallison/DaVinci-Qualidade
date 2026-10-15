/**
 * Pesquisa geral (Ctrl+K): cada serviço pesquisa nos próprios registros; o paineis junta. docs/05-modulos/busca.md
 */
import { z } from 'zod';

export const MODULOS_DA_BUSCA = {
  qualidade: 'Qualidade',
  auditorias: 'Auditorias',
  sgi: 'Gestão do SGI',
  servicos: 'Serviços',
  ambiental: 'Meio Ambiente',
  esg: 'Agenda ESG',
  seguranca: 'Segurança do Trabalho',
  funcionarios: 'Cadastros',
} as const;
export type ModuloDaBusca = keyof typeof MODULOS_DA_BUSCA;

/** Por tipo de registro, no máximo estes resultados: a pesquisa aponta, a lista da tela filtra. */
export const RESULTADOS_POR_TIPO = 5;

export const buscaSchema = z.object({
  termo: z
    .string({ error: 'Digite o que procura.' })
    .trim()
    .min(2, 'Digite ao menos 2 letras.')
    .max(80, 'Use no máximo 80 caracteres.'),
});
export const buscaNoPainelSchema = buscaSchema.extend({
  modulos: z
    .array(
      z.enum(
        Object.keys(MODULOS_DA_BUSCA) as [ModuloDaBusca, ...ModuloDaBusca[]],
      ),
    )
    .max(10),
});

export interface ResultadoDaBusca {
  modulo: ModuloDaBusca;
  /** "Não conformidade", "Funcionário"... */
  tipo: string;
  titulo: string;
  detalhe: string | null;
  href: string;
}

export interface Busca {
  resultados: ResultadoDaBusca[];
  indisponiveis: ModuloDaBusca[];
}

const EXIGE: Record<
  ModuloDaBusca,
  { permissao: string; recurso: string | null }
> = {
  qualidade: { permissao: 'qualidade.ver', recurso: 'qualidade' },
  auditorias: { permissao: 'auditorias.ver', recurso: 'auditorias' },
  sgi: { permissao: 'sgi.ver', recurso: 'sgi' },
  servicos: { permissao: 'servicos.ver', recurso: 'servicos' },
  ambiental: { permissao: 'ambiental.ver', recurso: 'ambiental' },
  esg: { permissao: 'esg.ver', recurso: 'esg' },
  seguranca: { permissao: 'seguranca.ver', recurso: 'seguranca' },
  funcionarios: { permissao: 'funcionarios.ver', recurso: null },
};

/** Onde a pessoa pode pesquisar: permissão de ver e módulo ligado. */
export function modulosDaBusca(
  permissoes: readonly string[],
  recursos: readonly string[],
): ModuloDaBusca[] {
  return (Object.keys(EXIGE) as ModuloDaBusca[]).filter(
    (m) =>
      permissoes.includes(EXIGE[m].permissao) &&
      (!EXIGE[m].recurso || recursos.includes(EXIGE[m].recurso!)),
  );
}

/** `%termo%` para ILIKE, com % e _ do próprio termo escapados. */
export function padraoDeBusca(termo: string): string {
  return `%${termo.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}
