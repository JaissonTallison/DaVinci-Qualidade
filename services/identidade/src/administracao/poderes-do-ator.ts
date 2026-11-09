import { and, eq } from 'drizzle-orm';
import type { Database } from '@davinci/database';
import {
  TODAS_AS_PERMISSOES,
  ehPermissao,
  type Permissao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { perfis, vinculos } from '../db/schema.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/**
 * O que o próprio solicitante pode conceder. A permissão `usuarios.gerenciar`/`perfis.gerenciar` deixa
 * administrar acessos, mas não pode virar escada para privilégios que a pessoa não tem: ninguém dá um
 * perfil (ou cria/edita um perfil) com mais poder do que o seu. O Administrador (perfil protegido) tem tudo.
 */
export interface PoderesDoAtor {
  /** Está no perfil protegido (Administrador): pode conceder qualquer coisa. */
  admin: boolean;
  /** Perfil ativo do solicitante nesta empresa (para proibir editar o próprio perfil). */
  perfilId: string | null;
  permissoes: ReadonlySet<Permissao>;
}

/** Lê o perfil ativo do solicitante na empresa do contexto e o traduz em poderes. */
export async function poderesDoAtor(
  db: Tx | Db,
  empresaId: string,
  usuarioId: string | null,
): Promise<PoderesDoAtor> {
  const [linha] = usuarioId
    ? await db
        .select({
          perfilId: perfis.id,
          protegido: perfis.protegido,
          permissoes: perfis.permissoes,
        })
        .from(vinculos)
        .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
        .where(
          and(
            eq(vinculos.empresaId, empresaId),
            eq(vinculos.usuarioId, usuarioId),
            eq(vinculos.ativo, true),
          ),
        )
    : [];
  if (!linha) return { admin: false, perfilId: null, permissoes: new Set() };
  if (linha.protegido)
    return {
      admin: true,
      perfilId: linha.perfilId,
      permissoes: new Set(TODAS_AS_PERMISSOES),
    };
  return {
    admin: false,
    perfilId: linha.perfilId,
    permissoes: new Set(linha.permissoes.filter(ehPermissao)),
  };
}

/** As permissões de `alvo` que o solicitante ainda não possui (vazio = pode conceder todas). */
export function permissoesAlemDoAtor(
  poderes: PoderesDoAtor,
  alvo: readonly Permissao[],
): Permissao[] {
  if (poderes.admin) return [];
  return alvo.filter((p) => !poderes.permissoes.has(p));
}
