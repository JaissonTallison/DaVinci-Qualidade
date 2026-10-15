import { pingDatabase } from './health.js';

describe('pingDatabase', () => {
  it('retorna true quando o banco responde', async () => {
    const db = { execute: async () => ({ rows: [] }) } as never;
    expect(await pingDatabase(db)).toBe(true);
  });

  it('retorna false quando a consulta falha', async () => {
    const db = {
      execute: async () => Promise.reject(new Error('conexão recusada')),
    } as never;
    expect(await pingDatabase(db)).toBe(false);
  });

  it('retorna false quando o banco não responde no prazo', async () => {
    const db = { execute: () => new Promise(() => {}) } as never;
    expect(await pingDatabase(db, 50)).toBe(false);
  });
});

describe('createDatabase', () => {
  it('registra tratador de erro no pool (conexão ociosa perdida não derruba o processo)', async () => {
    const { createDatabase } = await import('./connection.js');
    const recebidos: string[] = [];
    const { db, close } = createDatabase({
      url: 'postgresql://ninguem:x@127.0.0.1:1/nada',
      schema: {},
      onConnectionError: (e) => recebidos.push(e.message),
    });
    const pool = (db as unknown as { $client: import('pg').Pool }).$client;
    expect(pool.listenerCount('error')).toBe(1);
    pool.emit(
      'error',
      new Error('terminating connection due to administrator command'),
    );
    expect(recebidos).toEqual([
      'terminating connection due to administrator command',
    ]);
    await close();
  });
});
