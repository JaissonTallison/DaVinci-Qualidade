import { z } from 'zod';
import { cnpjValido, normalizarDocumento } from './documento.js';
import {
  INDICADORES_IE,
  REGIMES_TRIBUTARIOS,
  SITUACOES_CADASTRAIS,
  codigoCnae,
  enderecoSchema,
  type Endereco,
  type IndicadorIE,
  type RegimeTributario,
  type SituacaoCadastral,
} from './parceiros.js';
import {
  chaves,
  data,
  email,
  enumOpcional,
  lista,
  opcional,
  telefone,
  texto,
  textoOpcional,
} from './validadores.js';

/**
 * Empresa de desenvolvimento: usada enquanto o serviço de Identidade (Passo 2)
 * não existe. Todo registro já nasce com empresa_id; quando o login chegar,
 * muda só a ORIGEM do empresaId (do token), não as tabelas.
 */
export const EMPRESA_DESENVOLVIMENTO_ID =
  '00000000-0000-7000-8000-000000000001';

// ---------------------------------------------------------------- dados da empresa (Passo 2.5 · Bloco 3A)

/**
 * A "empresa" é o GRUPO (o inquilino): cadastros como parceiros e plano de contas são dela.
 * Cada CNPJ é um ESTABELECIMENTO (a matriz e as filiais), com inscrições, atividade e endereço próprios.
 */
export const TIPOS_ESTABELECIMENTO = {
  matriz: 'Matriz',
  filial: 'Filial',
} as const;
export type TipoEstabelecimento = keyof typeof TIPOS_ESTABELECIMENTO;

const versao = z
  .string({ error: 'Versão do cadastro ausente: recarregue a página.' })
  .min(1, 'Versão do cadastro ausente: recarregue a página.');

export const estabelecimentoSchema = z
  .object({
    cnpj: z
      .string({ error: 'Informe o CNPJ.' })
      .transform(normalizarDocumento)
      .refine(
        cnpjValido,
        'CNPJ inválido. Confira os dígitos (aceita o formato alfanumérico).',
      ),
    /** Como a equipe chama o estabelecimento ("Matriz", "Loja Campinas"). */
    nome: texto('um nome curto (ex.: Loja Campinas)', 60, 2),
    razaoSocial: texto('a razão social', 150, 2),
    nomeFantasia: textoOpcional(150),
    indicadorIE: z
      .enum(chaves(INDICADORES_IE), { error: 'Selecione a situação no ICMS.' })
      .default('contribuinte'),
    inscricaoEstadual: opcional(
      z
        .string()
        .trim()
        .toUpperCase()
        .regex(/^[0-9A-Z.\-/]{2,20}$/, 'Inscrição estadual inválida.'),
    ),
    inscricaoMunicipal: textoOpcional(20),
    cnaePrincipal: opcional(codigoCnae),
    cnaesSecundarios: lista(codigoCnae, 99, 'atividades secundárias').transform(
      (c) => [...new Set(c)],
    ),
    situacaoCadastral: enumOpcional(
      SITUACOES_CADASTRAIS,
      'Situação cadastral inválida.',
    ),
    dataAbertura: opcional(data('a data de abertura')),
    endereco: opcional(enderecoSchema),
    telefone: opcional(telefone),
    email: opcional(email('fiscal@empresa.com.br')),
  })
  .superRefine((d, ctx) => {
    if (d.indicadorIE === 'contribuinte' && !d.inscricaoEstadual) {
      ctx.addIssue({
        code: 'custom',
        path: ['inscricaoEstadual'],
        message: 'Contribuinte do ICMS precisa da inscrição estadual.',
      });
    }
  });

export const atualizarEstabelecimentoSchema = z.intersection(
  estabelecimentoSchema,
  z.object({ versao }),
);
export const situacaoDoEstabelecimentoSchema = z.object({
  versao,
  motivo: textoOpcional(300),
});

export const dadosDaEmpresaSchema = z.object({
  /** Nome do grupo, como aparece no menu e nos relatórios. */
  nome: texto('o nome da empresa', 80, 2),
  regimeTributario: enumOpcional(
    REGIMES_TRIBUTARIOS,
    'Selecione o regime tributário.',
  ),
  email: opcional(email('contato@empresa.com.br')),
  telefone: opcional(telefone),
  site: textoOpcional(150),
  versao,
});

/** Logo: PNG, JPG ou SVG, até 500 KB, enviada em base64 (o conteúdo é conferido no servidor). */
export const TAMANHO_MAXIMO_LOGO = 500 * 1024;
export const TIPOS_LOGO = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
export const logoSchema = z.object({
  tipo: z.enum(TIPOS_LOGO, { error: 'Use uma imagem PNG, JPG ou SVG.' }),
  base64: z
    .string({ error: 'Escolha uma imagem.' })
    .min(1, 'Escolha uma imagem.')
    .refine(
      (b) => Math.floor((b.length * 3) / 4) <= TAMANHO_MAXIMO_LOGO + 2,
      'A imagem passa de 500 KB. Reduza o tamanho e tente de novo.',
    ),
});

export type NovoEstabelecimento = z.input<typeof estabelecimentoSchema>;
export type DadosDaEmpresaEntrada = z.input<typeof dadosDaEmpresaSchema>;

export interface Estabelecimento {
  id: string;
  tipo: TipoEstabelecimento;
  cnpj: string;
  nome: string;
  razaoSocial: string;
  nomeFantasia: string | null;
  indicadorIE: IndicadorIE;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  cnaePrincipal: string | null;
  cnaesSecundarios: string[];
  situacaoCadastral: SituacaoCadastral | null;
  dataAbertura: string | null;
  endereco: Endereco | null;
  telefone: string | null;
  email: string | null;
  ativo: boolean;
  motivoInativacao: string | null;
  versao: string;
}

export interface DadosDaEmpresa {
  id: string;
  nome: string;
  regimeTributario: RegimeTributario | null;
  email: string | null;
  telefone: string | null;
  site: string | null;
  /** Muda a cada troca de logo (serve para o navegador não usar a imagem antiga). */
  logoVersao: string | null;
  estabelecimentos: Estabelecimento[];
  versao: string;
}

export interface Logo {
  tipo: (typeof TIPOS_LOGO)[number];
  base64: string;
}
