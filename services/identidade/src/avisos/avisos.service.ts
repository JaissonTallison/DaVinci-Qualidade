import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import {
  ehPermissao,
  recursosEfetivos,
  TODAS_AS_PERMISSOES,
  type DestinatarioDeAviso,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { empresas, perfis, usuarios, vinculos } from '../db/schema.js';

type Db = Database<typeof schema>;

/**
 * Quem recebe os avisos diários de vencimento: todo usuário ativo, com acesso ativo, em empresa ativa.
 * Chamada do sistema (serviço paineis), por isso atravessa as empresas.
 */
@Injectable()
export class AvisosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async destinatarios(): Promise<DestinatarioDeAviso[]> {
    const linhas = await this.db
      .select({
        empresaId: empresas.id,
        empresaNome: empresas.razaoSocial,
        fantasia: empresas.nomeFantasia,
        recursos: empresas.recursos,
        nome: usuarios.nome,
        email: usuarios.email,
        permissoes: perfis.permissoes,
        protegido: perfis.protegido,
      })
      .from(vinculos)
      .innerJoin(usuarios, eq(usuarios.id, vinculos.usuarioId))
      .innerJoin(perfis, eq(perfis.id, vinculos.perfilId))
      .innerJoin(empresas, eq(empresas.id, vinculos.empresaId))
      .where(
        and(
          eq(vinculos.ativo, true),
          eq(usuarios.ativo, true),
          eq(perfis.ativo, true),
          eq(empresas.ativa, true),
        ),
      );
    return linhas.map((l) => ({
      empresaId: l.empresaId,
      empresaNome: l.fantasia ?? l.empresaNome,
      nome: l.nome,
      email: l.email,
      permissoes: l.protegido
        ? [...TODAS_AS_PERMISSOES]
        : l.permissoes.filter(ehPermissao),
      recursos: recursosEfetivos(l.recursos),
    }));
  }
}
