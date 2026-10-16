/** Identidade: login, sessão e senha (contratos e regras). */
import { z } from 'zod';
import type { Recurso } from './recursos.js';
import type { Permissao } from './permissoes.js';

export const SENHA_MINIMO = 10;

export const loginSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Informe um e-mail válido.')),
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
  /** Empresa desejada; se ausente, a última usada ou a primeira disponível. */
  empresaId: z.string().optional(),
  /** Token de "navegador confiável" (pula o código do 2FA por 30 dias). */
  navegadorConfiavel: z.string().max(100).optional(),
});

/** Contas de fora aceitas no login ("Entrar com Microsoft/Google"): só entra quem já é usuário, pelo e-mail. */
export const PROVEDORES_EXTERNOS = {
  microsoft: 'Microsoft',
  google: 'Google',
} as const;
export type ProvedorExterno = keyof typeof PROVEDORES_EXTERNOS;

/**
 * Login por conta externa: o web troca o código do provedor pelo id_token e o repassa; quem confere a assinatura,
 * o destinatário e o nonce é o Identidade.
 */
export const loginExternoSchema = z.object({
  provedor: z.enum(['microsoft', 'google'], { error: 'Provedor inválido.' }),
  idToken: z.string().min(20, 'Resposta do provedor inválida.').max(8000),
  nonce: z.string().min(16, 'Resposta do provedor inválida.').max(200),
  navegadorConfiavel: z.string().max(100).optional(),
});

/** Segunda etapa do login (2FA): código do aplicativo (6 dígitos) ou de recuperação (XXXX-XXXX). */
export const codigo2faSchema = z
  .string({ error: 'Informe o código.' })
  .trim()
  .toUpperCase()
  .transform((c) => c.replace(/\s/g, ''))
  .pipe(
    z
      .string()
      .regex(
        /^(\d{6}|[A-Z0-9]{4}-?[A-Z0-9]{4})$/,
        'Informe os 6 números do aplicativo ou um código de recuperação.',
      ),
  );

export const login2faSchema = z.object({
  desafio: z
    .string({ error: 'Sessão de login expirada. Entre de novo.' })
    .min(20, 'Sessão de login expirada. Entre de novo.'),
  codigo: codigo2faSchema,
  /** "Confiar neste navegador por 30 dias". */
  confiar: z.boolean().default(false),
});

export const confirmar2faSchema = z.object({ codigo: codigo2faSchema });
export const desativar2faSchema = z.object({
  senha: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
  codigo: codigo2faSchema,
});

/** De onde veio o acesso (o web repassa; vai para o histórico e para a lista de sessões). */
export interface OrigemDoAcesso {
  ip: string | null;
  navegador: string | null;
}

/** Login com 2FA: a senha estava certa, falta o código. */
export interface Desafio2fa {
  desafio2fa: string;
  expiraEm: string;
}

export const DIAS_NAVEGADOR_CONFIAVEL = 30;

export const novaSenhaSchema = z
  .string({ error: 'Informe a nova senha.' })
  .min(SENHA_MINIMO, `Use pelo menos ${SENHA_MINIMO} caracteres.`)
  .max(128, 'Use no máximo 128 caracteres.');

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z
      .string({ error: 'Informe a senha atual.' })
      .min(1, 'Informe a senha atual.'),
    novaSenha: novaSenhaSchema,
  })
  .refine((d) => d.novaSenha !== d.senhaAtual, {
    path: ['novaSenha'],
    message: 'A nova senha deve ser diferente da atual.',
  });

export const renovarSchema = z.object({
  tokenRenovacao: z.string().min(20, 'Sessão inválida.'),
});
export const trocarEmpresaSchema = z.object({
  tokenRenovacao: z.string().min(20, 'Sessão inválida.'),
  empresaId: z.string(),
});

export type Login = z.input<typeof loginSchema>;
export type TrocarSenha = z.input<typeof trocarSenhaSchema>;

export interface EmpresaResumo {
  id: string;
  nome: string;
  cnpj: string;
  /** Versão da logo (null = sem logo). */
  logoVersao?: string | null;
}

/** Devolvido pelo login, pela renovação e pela troca de empresa. */
export interface Sessao {
  /** JWT curto (15 min) para o cabeçalho Authorization. */
  tokenAcesso: string;
  acessoExpiraEm: string;
  /** Opaco, de uso único (troca a cada renovação), 7 dias. */
  tokenRenovacao: string;
  renovacaoExpiraEm: string;
  usuario: {
    id: string;
    nome: string;
    email: string;
    deveTrocarSenha: boolean;
    tema: Tema;
  };
  empresa: EmpresaResumo;
  empresas: EmpresaResumo[];
  permissoes: Permissao[];
  /** A122: recursos ligados na empresa (as permissões já vêm sem os desligados). */
  recursos: Recurso[];
  /** Só quando a pessoa marcou "confiar neste navegador": guarde em cookie HttpOnly. */
  navegadorConfiavel?: { token: string; expiraEm: string };
}

export type RespostaLogin = Sessao | Desafio2fa;
export const ehDesafio2fa = (r: RespostaLogin): r is Desafio2fa =>
  'desafio2fa' in r;

/** Resposta de GET /auth/eu: quem está logado, onde e com quais permissões. */
export type DadosDoUsuario = Pick<
  Sessao,
  'usuario' | 'empresa' | 'empresas' | 'permissoes' | 'recursos'
>;

/** Conteúdo do token de acesso (claims). */
export interface ConteudoDoToken {
  sub: string; // usuarioId
  emp: string; // empresaId
  nom: string; // nome do usuário
  per: Permissao[];
  /** Deve trocar a senha: enquanto true, o gateway só libera trocar senha, "eu" e sair. */
  dts: boolean;
  /** Configurar 2FA pendente (o perfil exige e a pessoa ainda não ativou): mesmas restrições do dts. */
  c2f: boolean;
  /** Sessão (família) que emitiu o token: permite ao gateway recusá-lo na hora em que a sessão é encerrada. */
  sid?: string;
  /** A122: recursos ligados (ausente = todos, tokens de antes dos recursos). */
  rec?: Recurso[];
}

/** Evento: estas sessões foram encerradas à força; tokens delas devem ser recusados já. */
export interface SessoesRevogadas {
  familias: string[];
}

// ---------------------------------------------------------------- recuperar senha (3C)

export const MINUTOS_LINK_DE_SENHA = 30;
export const PEDIDOS_DE_SENHA_POR_HORA = 3;

export const recuperarSenhaSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Informe um e-mail válido.')),
});

export const redefinirSenhaSchema = z.object({
  token: z
    .string({ error: 'Link inválido.' })
    .min(20, 'Link inválido. Peça um novo em "Esqueceu a senha?".'),
  novaSenha: novaSenhaSchema,
});

// ---------------------------------------------------------------- segurança da conta (3B)

export interface SessaoAtiva {
  /** Família da sessão (identifica o login; sobrevive às renovações). */
  id: string;
  empresa: string;
  inicio: string;
  ultimaRenovacao: string;
  ip: string | null;
  navegador: string | null;
  estaSessao: boolean;
}

export const RESULTADOS_ACESSO = {
  sucesso: 'Entrou',
  senha_errada: 'Senha errada',
  bloqueado: 'Bloqueado por tentativas',
  codigo_errado: 'Código do 2FA errado',
  codigo_recuperacao: 'Entrou com código de recuperação',
  inativo: 'Usuário inativo',
  recuperacao_pedida: 'Pediu link para criar nova senha',
  senha_redefinida: 'Criou nova senha pelo link do e-mail',
  externo_microsoft: 'Entrou com a conta Microsoft',
  externo_google: 'Entrou com a conta Google',
} as const;
export type ResultadoAcesso = keyof typeof RESULTADOS_ACESSO;

export interface Acesso {
  momento: string;
  resultado: ResultadoAcesso;
  ip: string | null;
  navegador: string | null;
}

export interface SegurancaDaConta {
  doisFatores: {
    ativo: boolean;
    ativadoEm: string | null;
    codigosRestantes: number;
    exigidoPeloPerfil: boolean;
  };
  navegadoresConfiaveis: number;
  sessoes: SessaoAtiva[];
  acessos: Acesso[];
}

export interface Inicio2fa {
  /** Segredo em base32 (para digitar à mão) e o endereço otpauth:// (para o QR Code). */
  segredo: string;
  uri: string;
}

export interface CodigosDeRecuperacao {
  codigos: string[];
}

export const DIAS_HISTORICO_DE_ACESSOS = 180;

export const TOKEN_EMISSOR = 'davinci-identidade';
export const TOKEN_PUBLICO = 'davinci-gateway';

/** Tema da interface: o DaVinci abre no claro (independe do navegador); o escuro é escolha do usuário, salva no perfil. */
export const TEMAS = { claro: 'Claro', escuro: 'Escuro' } as const;
export type Tema = keyof typeof TEMAS;
/** Preferências da pessoa (colunas das listas…): chave curta e valor JSON pequeno. */
export const CHAVES_DE_PREFERENCIA = ['listas.colunas'] as const;
export type ChaveDePreferencia = (typeof CHAVES_DE_PREFERENCIA)[number];
export const salvarPreferenciaSchema = z.object({
  chave: z.enum(CHAVES_DE_PREFERENCIA, { error: 'Preferência desconhecida.' }),
  valor: z.array(z.string().max(40)).max(40),
});
export const salvarTemaSchema = z.object({
  tema: z.enum(['claro', 'escuro'], { error: 'Escolha o tema.' }),
});
