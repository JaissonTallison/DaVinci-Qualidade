/**
 * Parceiros de negócio (Codex): contratos e regras de validação.
 * As MESMAS regras valem no formulário (web), no gateway e no serviço.
 * Mensagens em português, específicas e dizendo como corrigir (docs/04-design/interface.md §11).
 */
import { z } from 'zod';
import { cnpjValido, cpfValido, normalizarDocumento } from './documento.js';
import {
  chaves,
  data,
  email,
  enumOpcional,
  lista,
  opcional,
  soDigitos,
  telefone,
  texto,
  textoOpcional,
} from './validadores.js';

/** Catálogo oficial (código `tPag` da NF-e / Banco Central). Cada empresa só liga e desliga. */
export const FORMAS_PAGAMENTO = {
  pix: { nome: 'Pix', codigoNfe: '17' },
  boleto: { nome: 'Boleto bancário', codigoNfe: '15' },
  transferencia: { nome: 'Transferência (TED/DOC)', codigoNfe: '18' },
  cartao_credito: { nome: 'Cartão de crédito', codigoNfe: '03' },
  cartao_debito: { nome: 'Cartão de débito', codigoNfe: '04' },
  dinheiro: { nome: 'Dinheiro', codigoNfe: '01' },
  cheque: { nome: 'Cheque', codigoNfe: '02' },
  deposito: { nome: 'Depósito bancário', codigoNfe: '16' },
  debito_automatico: { nome: 'Débito automático', codigoNfe: '99' },
} as const;
export type FormaPagamento = keyof typeof FORMAS_PAGAMENTO;
export const ehFormaPagamento = (v: unknown): v is FormaPagamento =>
  typeof v === 'string' && v in FORMAS_PAGAMENTO;

export const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
] as const;

// ---------------------------------------------------------------- vocabulário

export const TIPOS_PESSOA = {
  PJ: 'Pessoa jurídica (CNPJ)',
  PF: 'Pessoa física (CPF)',
  EX: 'Estrangeiro',
} as const;
export type TipoPessoa = keyof typeof TIPOS_PESSOA;

export const PAPEIS = {
  cliente: 'Cliente',
  fornecedor: 'Fornecedor',
  transportadora: 'Transportadora',
  representante: 'Representante / vendedor',
  colaborador: 'Colaborador',
} as const;
export type Papel = keyof typeof PAPEIS;

/** Indicador da inscrição estadual (NF-e: indIEDest). */
export const INDICADORES_IE = {
  contribuinte: 'Contribuinte do ICMS',
  isento: 'Contribuinte isento de inscrição',
  nao_contribuinte: 'Não contribuinte',
} as const;
export type IndicadorIE = keyof typeof INDICADORES_IE;

export const REGIMES_TRIBUTARIOS = {
  mei: 'MEI',
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
} as const;
export type RegimeTributario = keyof typeof REGIMES_TRIBUTARIOS;

export const SITUACOES_CADASTRAIS = {
  ativa: 'Ativa',
  suspensa: 'Suspensa',
  inapta: 'Inapta',
  baixada: 'Baixada',
  nula: 'Nula',
} as const;
export type SituacaoCadastral = keyof typeof SITUACOES_CADASTRAIS;

export const PORTES = {
  mei: 'Microempreendedor individual',
  me: 'Microempresa',
  epp: 'Empresa de pequeno porte',
  demais: 'Demais',
} as const;
export type Porte = keyof typeof PORTES;

/** Retenções na fonte que o contas a pagar aplica a este fornecedor. */
export const RETENCOES = {
  iss: 'ISS',
  ir: 'IRRF',
  pis: 'PIS',
  cofins: 'COFINS',
  csll: 'CSLL',
  inss: 'INSS',
} as const;
export type Retencao = keyof typeof RETENCOES;

export const TIPOS_ENDERECO = {
  principal: 'Principal',
  cobranca: 'Cobrança',
  entrega: 'Entrega',
} as const;
export type TipoEndereco = keyof typeof TIPOS_ENDERECO;

export const TIPOS_CONTA = {
  corrente: 'Conta corrente',
  poupanca: 'Poupança',
  pagamento: 'Conta de pagamento',
} as const;
export type TipoConta = keyof typeof TIPOS_CONTA;

export const TIPOS_CHAVE_PIX = {
  cpf: 'CPF',
  cnpj: 'CNPJ',
  email: 'E-mail',
  telefone: 'Celular',
  aleatoria: 'Chave aleatória',
} as const;
export type TipoChavePix = keyof typeof TIPOS_CHAVE_PIX;

export const LIMITES = {
  contatos: 20,
  enderecos: 10,
  contasBancarias: 10,
  chavesPix: 10,
  etiquetas: 20,
  cnaesSecundarios: 99,
} as const;

// ---------------------------------------------------------------- blocos de validação

/** Código CNAE (subclasse), com ou sem pontuação: "4721-1/02" → "4721102". */
export const codigoCnae = z
  .string()
  .transform(soDigitos)
  .pipe(
    z
      .string()
      .regex(
        /^\d{7}$/,
        'Informe a atividade (CNAE) com 7 dígitos, ex.: 4721-1/02.',
      ),
  );

export const enderecoSchema = z.object({
  tipo: z
    .enum(chaves(TIPOS_ENDERECO), { error: 'Selecione o tipo do endereço.' })
    .default('principal'),
  cep: z
    .string({ error: 'Informe o CEP.' })
    .transform(soDigitos)
    .pipe(z.string().regex(/^\d{8}$/, 'Informe um CEP com 8 dígitos.')),
  logradouro: texto('o logradouro', 150, 2),
  numero: texto('o número (ou S/N)', 20),
  complemento: textoOpcional(60),
  bairro: texto('o bairro', 80),
  cidade: texto('a cidade', 80, 2),
  uf: z.enum(UFS, { error: 'Selecione a UF.' }),
  /** Código IBGE do município (vem da consulta de CEP; a NF-e exige). */
  codigoMunicipio: opcional(
    z.string().regex(/^\d{7}$/, 'Código de município inválido.'),
  ),
});

export const contatoSchema = z
  .object({
    nome: texto('o nome do contato', 100, 2),
    cargo: textoOpcional(60),
    email: opcional(email('ana@empresa.com.br')),
    telefone: opcional(telefone),
    whatsapp: z.boolean().default(false),
  })
  .refine((c) => c.email || c.telefone, {
    path: ['email'],
    message: 'Informe o e-mail ou o telefone do contato.',
  });

export const contaBancariaSchema = z.object({
  banco: z
    .string({ error: 'Selecione o banco.' })
    .transform(soDigitos)
    .pipe(z.string().regex(/^\d{1,3}$/, 'Selecione o banco.'))
    .transform((v) => v.padStart(3, '0')),
  agencia: z
    .string({ error: 'Informe a agência.' })
    .trim()
    .regex(
      /^\d{1,5}(-[\dXx])?$/,
      'Informe a agência (até 5 dígitos, com dígito opcional: 1234-5).',
    ),
  conta: z
    .string({ error: 'Informe a conta.' })
    .trim()
    .regex(/^\d{1,20}-[\dXx]$/, 'Informe a conta com o dígito (ex.: 12345-6).'),
  tipo: z
    .enum(chaves(TIPOS_CONTA), { error: 'Selecione o tipo de conta.' })
    .default('corrente'),
  /** Titular, quando diferente do próprio parceiro. */
  titular: textoOpcional(150),
  documentoTitular: opcional(z.string().transform(normalizarDocumento)),
});

export const chavePixSchema = z
  .object({
    tipo: z.enum(chaves(TIPOS_CHAVE_PIX), {
      error: 'Selecione o tipo da chave.',
    }),
    chave: z
      .string({ error: 'Informe a chave Pix.' })
      .trim()
      .min(1, 'Informe a chave Pix.'),
  })
  .transform((c, ctx) => {
    const erro = (message: string) => {
      ctx.addIssue({ code: 'custom', path: ['chave'], message });
      return z.NEVER;
    };
    switch (c.tipo) {
      case 'cpf':
        return cpfValido(c.chave)
          ? { ...c, chave: soDigitos(c.chave) }
          : erro('CPF inválido para chave Pix.');
      case 'cnpj':
        return cnpjValido(c.chave)
          ? { ...c, chave: normalizarDocumento(c.chave) }
          : erro('CNPJ inválido para chave Pix.');
      case 'email':
        return z.email().safeParse(c.chave.toLowerCase()).success
          ? { ...c, chave: c.chave.toLowerCase() }
          : erro('E-mail inválido para chave Pix.');
      case 'telefone': {
        const d = soDigitos(c.chave).replace(/^55(?=\d{10,11}$)/, '');
        return /^\d{10,11}$/.test(d)
          ? { ...c, chave: `+55${d}` }
          : erro('Informe o celular com DDD para a chave Pix.');
      }
      case 'aleatoria':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          c.chave,
        )
          ? { ...c, chave: c.chave.toLowerCase() }
          : erro(
              'Chave aleatória inválida (formato 123e4567-e89b-12d3-a456-426614174000).',
            );
    }
  });

const retencoesSchema = z
  .object(
    Object.fromEntries(
      Object.keys(RETENCOES).map((r) => [r, z.boolean().default(false)]),
    ) as Record<Retencao, z.ZodDefault<z.ZodBoolean>>,
  )
  .partial()
  .optional()
  .transform(
    (r) =>
      Object.fromEntries(
        Object.keys(RETENCOES).map((k) => [k, r?.[k as Retencao] ?? false]),
      ) as Record<Retencao, boolean>,
  );

/** Valor em reais como texto canônico "1234.56" (sem perder centavos em ponto flutuante). */
const valorEmReais = z
  .string()
  .trim()
  .regex(/^\d{1,13}(\.\d{1,2})?$/, 'Informe um valor válido (ex.: 15000.00).');

// ---------------------------------------------------------------- o parceiro

const camposParceiro = {
  tipoPessoa: z.enum(chaves(TIPOS_PESSOA), {
    error: 'Selecione o tipo de pessoa.',
  }),
  documento: z
    .string({ error: 'Informe o documento.' })
    .transform(normalizarDocumento),
  nome: texto('o nome ou a razão social', 150, 2),
  nomeFantasia: textoOpcional(150),
  papeis: z
    .array(z.enum(chaves(PAPEIS)), { error: 'Marque pelo menos um papel.' })
    .transform((p) => [...new Set(p)])
    .refine(
      (p) => p.length > 0,
      'Marque pelo menos um papel (cliente, fornecedor…).',
    ),

  // Pessoa física
  rg: textoOpcional(20),
  rgOrgao: textoOpcional(20),
  nascimento: opcional(data('a data de nascimento')),
  // Estrangeiro
  pais: textoOpcional(60),

  // Ramo e dados da Receita
  cnaePrincipal: opcional(codigoCnae),
  cnaesSecundarios: lista(
    codigoCnae,
    LIMITES.cnaesSecundarios,
    'atividades secundárias',
  ).transform((c) => [...new Set(c)]),
  situacaoCadastral: enumOpcional(
    SITUACOES_CADASTRAIS,
    'Situação cadastral inválida.',
  ),
  dataAbertura: opcional(data('a data de abertura')),
  naturezaJuridica: textoOpcional(120),
  porte: enumOpcional(PORTES, 'Porte inválido.'),

  // Fiscal
  indicadorIE: z
    .enum(chaves(INDICADORES_IE), { error: 'Selecione a situação no ICMS.' })
    .default('nao_contribuinte'),
  inscricaoEstadual: opcional(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[0-9A-Z.\-/]{2,20}$/, 'Inscrição estadual inválida.'),
  ),
  inscricaoMunicipal: textoOpcional(20),
  suframa: opcional(
    z
      .string()
      .transform(soDigitos)
      .pipe(
        z.string().regex(/^\d{8,9}$/, 'Inscrição SUFRAMA com 8 ou 9 dígitos.'),
      ),
  ),
  regimeTributario: enumOpcional(
    REGIMES_TRIBUTARIOS,
    'Selecione o regime tributário.',
  ),
  consumidorFinal: z.boolean().default(false),
  retencoes: retencoesSchema,

  // Contato
  email: opcional(email()),
  telefone: opcional(telefone),
  site: textoOpcional(150),
  emailCobranca: opcional(email('cobranca@empresa.com.br')),
  emailNfe: opcional(email('nfe@empresa.com.br')),
  contatos: lista(contatoSchema, LIMITES.contatos, 'contatos'),
  enderecos: lista(enderecoSchema, LIMITES.enderecos, 'endereços'),

  // Bancário
  contasBancarias: lista(
    contaBancariaSchema,
    LIMITES.contasBancarias,
    'contas',
  ),
  chavesPix: lista(chavePixSchema, LIMITES.chavesPix, 'chaves Pix'),

  // Financeiro
  limiteCredito: opcional(valorEmReais),
  bloqueado: z.boolean().default(false),
  motivoBloqueio: textoOpcional(300),

  // Padrões dos títulos (Bloco 4): preenchem o lançamento automaticamente
  formaPagamento: opcional(
    z.string().refine(ehFormaPagamento, 'Forma de pagamento desconhecida.'),
  ),
  condicaoPagamentoId: opcional(z.string()),
  contaReceitaId: opcional(z.string()),
  contaDespesaId: opcional(z.string()),

  // Classificação
  etiquetas: lista(
    z.string().trim().min(1).max(40, 'Etiqueta com no máximo 40 caracteres.'),
    LIMITES.etiquetas,
    'etiquetas',
  ).transform((e) => [...new Set(e.filter(Boolean))]),
  origem: textoOpcional(60),
  observacoes: textoOpcional(2000),
};

type DadosParceiro = {
  tipoPessoa: TipoPessoa;
  documento: string;
  pais: string | null;
  indicadorIE: IndicadorIE;
  inscricaoEstadual: string | null;
  bloqueado: boolean;
  motivoBloqueio: string | null;
  enderecos: { tipo: TipoEndereco }[];
  nascimento: string | null;
};

/** Regras que envolvem mais de um campo. */
function regrasDoParceiro(d: DadosParceiro, ctx: z.RefinementCtx) {
  const problema = (path: (string | number)[], message: string) =>
    ctx.addIssue({ code: 'custom', path, message });
  if (d.tipoPessoa === 'PJ' && !cnpjValido(d.documento))
    problema(
      ['documento'],
      'CNPJ inválido. Confira os dígitos (aceita o formato alfanumérico).',
    );
  if (d.tipoPessoa === 'PF' && !cpfValido(d.documento))
    problema(['documento'], 'CPF inválido. Confira os dígitos.');
  if (d.tipoPessoa === 'EX') {
    if (d.documento.length < 3 || d.documento.length > 30)
      problema(
        ['documento'],
        'Informe o documento estrangeiro (3 a 30 letras ou números).',
      );
    if (!d.pais) problema(['pais'], 'Informe o país do parceiro estrangeiro.');
  }
  if (d.indicadorIE === 'contribuinte' && !d.inscricaoEstadual)
    problema(
      ['inscricaoEstadual'],
      'Contribuinte do ICMS precisa da inscrição estadual.',
    );
  if (d.bloqueado && !d.motivoBloqueio)
    problema(['motivoBloqueio'], 'Informe o motivo do bloqueio.');
  if (d.nascimento && d.nascimento > new Date().toISOString().slice(0, 10))
    problema(['nascimento'], 'A data de nascimento não pode ser no futuro.');
  for (const tipo of ['principal', 'cobranca'] as const) {
    const indices = d.enderecos.flatMap((e, i) => (e.tipo === tipo ? [i] : []));
    if (indices.length > 1)
      problema(
        ['enderecos', indices[1]!, 'tipo'],
        `Só pode haver um endereço ${TIPOS_ENDERECO[tipo].toLowerCase()}.`,
      );
  }
}

/** Versão do registro (o `atualizadoEm` lido), para detectar edição simultânea. */
const versao = z
  .string({ error: 'Versão do cadastro ausente: recarregue a página.' })
  .min(1, 'Versão do cadastro ausente: recarregue a página.');

export const novoParceiroSchema = z
  .object(camposParceiro)
  .superRefine((d, ctx) => regrasDoParceiro(d as DadosParceiro, ctx));
export const atualizarParceiroSchema = z
  .object({ ...camposParceiro, versao })
  .superRefine((d, ctx) => regrasDoParceiro(d as DadosParceiro, ctx));

/** Setor = seção da CNAE (A a U). */
export const SETORES = 'ABCDEFGHIJKLMNOPQRSTU'.split('');

export const filtroParceirosSchema = z.object({
  busca: opcional(z.string().trim().max(100, 'Use no máximo 100 caracteres.')),
  papel: opcional(z.enum(chaves(PAPEIS))),
  situacao: z.enum(['ativos', 'inativos', 'todos']).default('ativos'),
  setor: opcional(z.enum(SETORES as [string, ...string[]])),
  uf: opcional(z.enum(UFS)),
  etiqueta: opcional(z.string().trim().max(40)),
  pagina: z.coerce.number().int().min(1).default(1),
  porPagina: z.coerce
    .number()
    .int()
    .refine(
      (v) => v === 25 || v === 50 || v === 100,
      'Use 25, 50 ou 100 por página.',
    )
    .default(25),
});

export const inativarParceiroSchema = z.object({
  motivo: texto('o motivo da inativação', 500, 3),
  versao,
});

export const reativarParceiroSchema = z.object({ versao });

/** O que a tela/gateway ENVIA (antes da validação). */
export type NovoParceiro = z.input<typeof novoParceiroSchema>;
export type AtualizarParceiro = z.input<typeof atualizarParceiroSchema>;
export type FiltroParceiros = z.input<typeof filtroParceirosSchema>;
export type InativarParceiro = z.input<typeof inativarParceiroSchema>;
export type Endereco = z.output<typeof enderecoSchema>;
export type Contato = z.output<typeof contatoSchema>;
export type ContaBancaria = z.output<typeof contaBancariaSchema>;
export type ChavePix = z.output<typeof chavePixSchema>;

// ---------------------------------------------------------------- o que o serviço devolve

export interface AtividadeCnae {
  /** 7 dígitos, sem pontuação; formate com formatarCnae(). */
  codigo: string;
  descricao: string;
  setor: string;
}

export interface Setor {
  /** Letra da seção CNAE (A a U). */
  id: string;
  nome: string;
}

export interface Banco {
  /** Código COMPE com 3 dígitos. */
  codigo: string;
  nome: string;
}

export interface Parceiro {
  id: string;
  /** Número amigável, sequencial por empresa. */
  codigo: number;
  tipoPessoa: TipoPessoa;
  /** Normalizado (sem pontuação); formate com formatarDocumento(). */
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  papeis: Papel[];
  rg: string | null;
  rgOrgao: string | null;
  nascimento: string | null;
  pais: string | null;
  cnaePrincipal: AtividadeCnae | null;
  cnaesSecundarios: AtividadeCnae[];
  /** Setor da atividade principal. */
  setor: Setor | null;
  situacaoCadastral: SituacaoCadastral | null;
  dataAbertura: string | null;
  naturezaJuridica: string | null;
  porte: Porte | null;
  indicadorIE: IndicadorIE;
  inscricaoEstadual: string | null;
  inscricaoMunicipal: string | null;
  suframa: string | null;
  regimeTributario: RegimeTributario | null;
  consumidorFinal: boolean;
  retencoes: Record<Retencao, boolean>;
  email: string | null;
  telefone: string | null;
  site: string | null;
  emailCobranca: string | null;
  emailNfe: string | null;
  contatos: Contato[];
  enderecos: Endereco[];
  contasBancarias: (ContaBancaria & { bancoNome: string | null })[];
  chavesPix: ChavePix[];
  limiteCredito: string | null;
  formaPagamento: FormaPagamento | null;
  condicaoPagamentoId: string | null;
  contaReceitaId: string | null;
  contaDespesaId: string | null;
  bloqueado: boolean;
  motivoBloqueio: string | null;
  etiquetas: string[];
  origem: string | null;
  observacoes: string | null;
  ativo: boolean;
  inativadoEm: string | null;
  motivoInativacao: string | null;
  criadoEm: string;
  atualizadoEm: string;
  /** Envie de volta ao atualizar/inativar/reativar. */
  versao: string;
}

/** Linha da lista de parceiros (sem as listas internas). */
export interface ParceiroResumo {
  id: string;
  codigo: number;
  tipoPessoa: TipoPessoa;
  documento: string;
  nome: string;
  nomeFantasia: string | null;
  papeis: Papel[];
  setor: Setor | null;
  cidade: string | null;
  uf: string | null;
  etiquetas: string[];
  bloqueado: boolean;
  ativo: boolean;
}

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

export const PARCEIROS_POR_PAGINA = 50;

/** "4721102" → "4721-1/02". */
export function formatarCnae(codigo: string): string {
  const d = codigo.replace(/\D/g, '');
  return d.length === 7
    ? `${d.slice(0, 4)}-${d.slice(4, 5)}/${d.slice(5)}`
    : codigo;
}
