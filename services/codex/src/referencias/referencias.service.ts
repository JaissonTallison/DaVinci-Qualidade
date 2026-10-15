import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import type { AtividadeCnae, Banco, Setor } from '@davinci/types';
import * as schema from '../db/schema.js';
import { bancos, cnaes, setores } from '../db/schema.js';

const MAXIMO_DE_RESULTADOS = 30;

/** Tabelas oficiais (CNAE/IBGE e bancos/Banco Central): iguais para todas as empresas, só leitura. */
@Injectable()
export class ReferenciasService {
  constructor(@Inject(DATABASE) private readonly db: Database<typeof schema>) {}

  /**
   * Busca atividades por código ("4721", "4721-1/02"), descrição ou atividades típicas
   * ("padaria" encontra "Padaria e confeitaria…"), sem depender de acento.
   * Ordem: código exato/prefixo, depois descrição, depois palavras típicas.
   */
  async cnaes(dados: unknown): Promise<AtividadeCnae[]> {
    const { busca, setor, codigos } = (dados ?? {}) as {
      busca?: unknown;
      setor?: unknown;
      codigos?: unknown;
    };
    if (Array.isArray(codigos)) {
      const lista = codigos
        .filter((c): c is string => typeof c === 'string' && /^\d{7}$/.test(c))
        .slice(0, 100);
      return lista.length
        ? this.db
            .select({
              codigo: cnaes.codigo,
              descricao: cnaes.descricao,
              setor: cnaes.setor,
            })
            .from(cnaes)
            .where(inArray(cnaes.codigo, lista))
        : [];
    }
    const texto = typeof busca === 'string' ? busca.trim().slice(0, 100) : '';
    const condicoes: SQL[] = [];
    if (typeof setor === 'string' && /^[A-U]$/.test(setor))
      condicoes.push(eq(cnaes.setor, setor));
    let relevancia: SQL = sql`0`;
    if (texto) {
      const digitos = texto.replace(/\D/g, '');
      const termo = `%${texto}%`;
      const partes: SQL[] = [
        sql`unaccent(${cnaes.descricao}) ILIKE unaccent(${termo})`,
        sql`unaccent(${cnaes.palavras}) ILIKE unaccent(${termo})`,
      ];
      if (
        digitos.length >= 2 &&
        digitos.length === texto.replace(/[\s.\-/]/g, '').length
      )
        partes.push(sql`${cnaes.codigo} LIKE ${`${digitos}%`}`);
      condicoes.push(or(...partes)!);
      relevancia = sql`CASE WHEN ${cnaes.codigo} LIKE ${`${digitos || '-'}%`} THEN 0 WHEN unaccent(${cnaes.descricao}) ILIKE unaccent(${termo}) THEN 1 ELSE 2 END`;
    }
    return this.db
      .select({
        codigo: cnaes.codigo,
        descricao: cnaes.descricao,
        setor: cnaes.setor,
      })
      .from(cnaes)
      .where(condicoes.length ? and(...condicoes) : undefined)
      .orderBy(relevancia, asc(cnaes.codigo))
      .limit(MAXIMO_DE_RESULTADOS);
  }

  setores(): Promise<Setor[]> {
    return this.db.select().from(setores).orderBy(asc(setores.id));
  }

  /** Todos os bancos (≈460): a tela filtra enquanto a pessoa digita. Os mais usados primeiro. */
  async bancos(): Promise<Banco[]> {
    const linhas = await this.db
      .select({ codigo: bancos.codigo, nome: bancos.nomeCurto })
      .from(bancos)
      .orderBy(asc(bancos.codigo));
    const comuns = [
      '001',
      '237',
      '341',
      '104',
      '033',
      '260',
      '077',
      '336',
      '290',
      '756',
      '748',
      '041',
      '070',
      '422',
      '212',
      '380',
    ];
    const ordem = (c: string) =>
      comuns.includes(c) ? comuns.indexOf(c) : comuns.length;
    return linhas.sort((a, b) => ordem(a.codigo) - ordem(b.codigo));
  }
}
