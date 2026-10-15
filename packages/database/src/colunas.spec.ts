import { drizzle } from 'drizzle-orm/node-postgres';
import { pgTable, text } from 'drizzle-orm/pg-core';
import { isUuid } from '@davinci/types';
import { colunasPadrao } from './colunas.js';

const exemplo = pgTable('exemplo', {
  ...colunasPadrao(),
  nome: text().notNull(),
});
const db = drizzle.mock({ casing: 'snake_case' });

describe('colunasPadrao', () => {
  it('gera nomes snake_case no banco', () => {
    const { sql } = db
      .insert(exemplo)
      .values({ empresaId: '00000000-0000-7000-8000-000000000001', nome: 'X' })
      .toSQL();
    for (const coluna of [
      '"id"',
      '"empresa_id"',
      '"criado_em"',
      '"atualizado_em"',
      '"criado_por"',
      '"atualizado_por"',
      '"nome"',
    ]) {
      expect(sql).toContain(coluna);
    }
  });

  it('gera o id (UUID v7) automaticamente na inserção', () => {
    const { params } = db
      .insert(exemplo)
      .values({ empresaId: '00000000-0000-7000-8000-000000000001', nome: 'X' })
      .toSQL();
    const id = params.find(
      (p) => isUuid(p) && p !== '00000000-0000-7000-8000-000000000001',
    ) as string;
    expect(id[14]).toBe('7');
  });

  it('exige empresaId (multiempresa) no tipo de inserção', () => {
    // @ts-expect-error empresaId é obrigatório
    const semEmpresa: typeof exemplo.$inferInsert = { nome: 'X' };
    expect(semEmpresa).toBeDefined();
  });

  it('datas em milissegundos (precision 3), compatíveis com o JavaScript', async () => {
    const { getTableConfig } = await import('drizzle-orm/pg-core');
    const tipos = Object.fromEntries(
      getTableConfig(exemplo).columns.map((c) => [c.name, c.getSQLType()]),
    );
    expect(tipos.criadoEm ?? tipos.criado_em).toBe(
      'timestamp (3) with time zone',
    );
  });

  it('atualiza atualizado_em sozinho no update', () => {
    const { sql } = db.update(exemplo).set({ nome: 'Y' }).toSQL();
    expect(sql).toContain('"atualizado_em"');
  });
});

describe('colunas de valor', () => {
  it('dinheiro é numeric(18,2) e quantidade numeric(18,4)', async () => {
    const { getTableConfig } = await import('drizzle-orm/pg-core');
    const { colunaDinheiro, colunaQuantidade } = await import('./colunas.js');
    const t = pgTable('t', {
      ...colunasPadrao(),
      valor: colunaDinheiro().notNull(),
      qtd: colunaQuantidade(),
    });
    const tipos = Object.fromEntries(
      getTableConfig(t).columns.map((c) => [c.name, c.getSQLType()]),
    );
    expect(tipos.valor).toBe('numeric(18, 2)');
    expect(tipos.qtd).toBe('numeric(18, 4)');
  });
});

describe('colunasBase (cadastros globais)', () => {
  it('tem id, datas e autoria, mas não empresa', async () => {
    const { colunasBase } = await import('./colunas.js');
    const global = pgTable('global', { ...colunasBase(), nome: text() });
    const { sql } = db.insert(global).values({ nome: 'X' }).toSQL();
    expect(sql).toContain('"criado_em"');
    expect(sql).not.toContain('"empresa_id"');
  });
});
