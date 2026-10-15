/**
 * Administração de acesso (Identidade): usuários da empresa e perfis.
 * As MESMAS regras valem no formulário (web), no gateway e no serviço.
 */
import { z } from 'zod';
import { ehPermissao, type Permissao } from './permissoes.js';

const versao = z
  .string({ error: 'Versão do cadastro ausente: recarregue a página.' })
  .min(1, 'Versão do cadastro ausente: recarregue a página.');
const id = (rotulo: string) =>
  z.string({ error: `Selecione ${rotulo}.` }).min(1, `Selecione ${rotulo}.`);

// ---------------------------------------------------------------- usuários

export const novoUsuarioSchema = z.object({
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(2, 'Informe o nome completo.')
    .max(150, 'Use no máximo 150 caracteres.'),
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(
      z
        .email('Informe um e-mail válido (ex.: ana@empresa.com.br).')
        .max(150, 'Use no máximo 150 caracteres.'),
    ),
  perfilId: id('o perfil'),
});

export const alterarPerfilDoUsuarioSchema = z.object({
  perfilId: id('o perfil'),
  versao,
});
export const removerAcessoSchema = z.object({
  motivo: z
    .string({ error: 'Informe o motivo.' })
    .trim()
    .min(3, 'Informe o motivo (mínimo 3 caracteres).')
    .max(500, 'Use no máximo 500 caracteres.'),
  versao,
});
export const devolverAcessoSchema = z.object({ versao });

export type NovoUsuario = z.input<typeof novoUsuarioSchema>;

/** Um usuário visto pela empresa (o acesso dele AQUI). */
export interface UsuarioDaEmpresa {
  /** Id do usuário. */
  id: string;
  nome: string;
  email: string;
  perfil: { id: string; nome: string; protegido: boolean };
  /** Acesso a esta empresa ativo? */
  ativo: boolean;
  motivoInativacao: string | null;
  inativadoEm: string | null;
  ultimoAcessoEm: string | null;
  /** Ainda usa a senha provisória. */
  deveTrocarSenha: boolean;
  /** Acessa outras empresas: nome e senha só a própria pessoa altera. */
  acessaOutrasEmpresas: boolean;
  /** Tem verificação em duas etapas ativa. */
  doisFatores: boolean;
  /** É quem está logado (não pode tirar o próprio acesso nem mudar o próprio perfil). */
  euMesmo: boolean;
  /** Versão do acesso (envie ao alterar, remover e devolver). */
  versao: string;
}

export interface UsuarioCriado {
  usuario: UsuarioDaEmpresa;
  /** Senha provisória (só para pessoa nova). Mostrada UMA vez; não fica guardada em lugar nenhum. */
  senhaProvisoria: string | null;
  /** O e-mail já era de alguém (de outra empresa): só ganhou acesso a esta. */
  pessoaJaExistia: boolean;
}

export interface SenhaRedefinida {
  senhaProvisoria: string;
}

// ---------------------------------------------------------------- perfis

const permissoes = z
  .array(z.string(), { error: 'Marque as permissões.' })
  .transform((lista) => [...new Set(lista)])
  .pipe(
    z
      .array(z.custom<Permissao>(ehPermissao, 'Permissão desconhecida.'))
      .min(1, 'Marque pelo menos uma permissão.'),
  );

const camposPerfil = {
  nome: z
    .string({ error: 'Informe o nome.' })
    .trim()
    .min(2, 'Informe o nome do perfil (mínimo 2 caracteres).')
    .max(60, 'Use no máximo 60 caracteres.'),
  descricao: z
    .string()
    .trim()
    .max(200, 'Use no máximo 200 caracteres.')
    .nullish()
    .transform((v) => (v ? v : null)),
  permissoes,
};

export const novoPerfilSchema = z.object(camposPerfil);
export const atualizarPerfilSchema = z.object({ ...camposPerfil, versao });
/** Exigir 2FA de quem usa o perfil (vale também para o Administrador). */
export const exige2faSchema = z.object({ exige: z.boolean(), versao });
export const situacaoDoPerfilSchema = z.object({ versao });

export type NovoPerfil = z.input<typeof novoPerfilSchema>;
export type AtualizarPerfil = z.input<typeof atualizarPerfilSchema>;

export interface Perfil {
  id: string;
  nome: string;
  descricao: string | null;
  permissoes: Permissao[];
  /** Administrador: não pode ser alterado nem inativado. */
  protegido: boolean;
  ativo: boolean;
  /** Quem usa o perfil precisa de verificação em duas etapas. */
  exige2fa: boolean;
  /** Usuários com acesso ativo usando este perfil. */
  usuarios: number;
  versao: string;
}
