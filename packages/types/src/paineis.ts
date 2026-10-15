/**
 * Painel de vencimentos e avisos por e-mail (serviço paineis). Cada serviço responde os próprios prazos;
 * o paineis junta. docs/05-modulos/paineis.md
 */
import { z } from 'zod';

/** Horizonte do painel e do aviso: vencidos e o que vence nestes dias. */
export const DIAS_DO_PAINEL = 30;

export const MODULOS_DO_PAINEL = {
  qualidade: 'Qualidade',
  seguranca: 'Segurança do Trabalho',
  funcionarios: 'ASO e treinamentos',
  sgi: 'Gestão do SGI',
  servicos: 'Serviços',
  ambiental: 'Meio Ambiente',
} as const;
export type ModuloDoPainel = keyof typeof MODULOS_DO_PAINEL;

/** Um prazo de qualquer módulo, já com o caminho da tela onde se resolve. */
export interface Prazo {
  modulo: ModuloDoPainel;
  /** Rótulo curto: "NC", "Tarefa de plano", "Calibração", "CAT"... */
  tipo: string;
  descricao: string;
  data: string;
  situacao: 'vencido' | 'vence_em_breve';
  href: string;
}

/** Horizonte do painel em dias à frente: 30, 90 ou 365. */
export const HORIZONTES = [30, 90, 365] as const;
const horizonte = z.coerce
  .number()
  .int()
  .refine(
    (d) => (HORIZONTES as readonly number[]).includes(d),
    'Use 30, 90 ou 365 dias.',
  )
  .default(30);
export const horizonteSchema = z.object({ dias: horizonte });

export const filtroPainelSchema = z.object({
  dias: horizonte,
  modulos: z
    .array(
      z.enum(
        Object.keys(MODULOS_DO_PAINEL) as [ModuloDoPainel, ...ModuloDoPainel[]],
      ),
    )
    .max(10),
});

export interface PainelDeVencimentos {
  prazos: Prazo[];
  /** Módulos que não responderam a tempo: o painel mostra o resto e avisa. */
  indisponiveis: ModuloDoPainel[];
}

/** Usuário ativo de uma empresa, com o que pode ver: o aviso só leva os módulos dele. */
export interface DestinatarioDeAviso {
  empresaId: string;
  empresaNome: string;
  nome: string;
  email: string;
  permissoes: string[];
  recursos: string[];
}

export interface ResultadoDosAvisos {
  empresas: number;
  emails: number;
}

/** Monta o prazo com a situação a partir de hoje (vencido: data anterior a hoje). */
export function prazo(p: Omit<Prazo, 'situacao'>, hoje: string): Prazo {
  return { ...p, situacao: p.data < hoje ? 'vencido' : 'vence_em_breve' };
}

const EXIGE: Record<
  ModuloDoPainel,
  { permissao: string; recurso: string | null }
> = {
  qualidade: { permissao: 'qualidade.ver', recurso: 'qualidade' },
  seguranca: { permissao: 'seguranca.ver', recurso: 'seguranca' },
  funcionarios: { permissao: 'funcionarios.ver', recurso: null },
  sgi: { permissao: 'sgi.ver', recurso: 'sgi' },
  servicos: { permissao: 'servicos.ver', recurso: 'servicos' },
  ambiental: { permissao: 'ambiental.ver', recurso: 'ambiental' },
};

/** Módulos do painel que a pessoa vê: precisa da permissão e do módulo ligado na empresa. */
export function modulosVisiveis(
  permissoes: readonly string[],
  recursos: readonly string[],
): ModuloDoPainel[] {
  return (Object.keys(EXIGE) as ModuloDoPainel[]).filter(
    (m) =>
      permissoes.includes(EXIGE[m].permissao) &&
      (!EXIGE[m].recurso || recursos.includes(EXIGE[m].recurso!)),
  );
}
