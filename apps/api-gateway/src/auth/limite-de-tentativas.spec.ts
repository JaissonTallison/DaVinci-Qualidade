import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { ErroDoServico } from '../mensageria.service.js';
import {
  GuardaDeLimite,
  type RegraDeLimite,
} from './limite-de-tentativas.js';

/** ExecutionContext mínimo: um handler/classe nomeados e um request com o IP no cabeçalho. */
function contexto(ip: string, handler = 'login'): ExecutionContext {
  const fn = { name: handler } as unknown as () => void;
  const classe = { name: 'AuthController' } as unknown as new () => unknown;
  const req = { headers: { 'x-davinci-ip': ip }, ip };
  return {
    getHandler: () => fn,
    getClass: () => classe,
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

function guardaCom(regra: RegraDeLimite | undefined): GuardaDeLimite {
  const reflector = {
    getAllAndOverride: () => regra,
  } as unknown as Reflector;
  return new GuardaDeLimite(reflector);
}

describe('GuardaDeLimite', () => {
  const regra: RegraDeLimite = { max: 3, janelaMs: 60_000 };

  it('deixa passar até o limite e barra a partir dele (por IP)', () => {
    const guarda = guardaCom(regra);
    const ctx = contexto('1.2.3.4');
    for (let i = 0; i < 3; i++) expect(guarda.canActivate(ctx)).toBe(true);
    try {
      guarda.canActivate(ctx);
      expect.unreachable('a 4ª tentativa deveria ser barrada');
    } catch (e) {
      expect(e).toBeInstanceOf(ErroDoServico);
      expect((e as ErroDoServico).erro.codigo).toBe('EXCESSO_DE_TENTATIVAS');
    }
  });

  it('cada IP tem a própria contagem', () => {
    const guarda = guardaCom(regra);
    for (let i = 0; i < 3; i++)
      expect(guarda.canActivate(contexto('1.1.1.1'))).toBe(true);
    // Outro IP ainda está no começo da janela
    expect(guarda.canActivate(contexto('2.2.2.2'))).toBe(true);
  });

  it('rota sem @Limite nunca é barrada', () => {
    const guarda = guardaCom(undefined);
    const ctx = contexto('9.9.9.9');
    for (let i = 0; i < 100; i++) expect(guarda.canActivate(ctx)).toBe(true);
  });

  it('a janela reabre quando expira', () => {
    const guarda = guardaCom({ max: 2, janelaMs: 20 });
    const ctx = contexto('3.3.3.3');
    expect(guarda.canActivate(ctx)).toBe(true);
    expect(guarda.canActivate(ctx)).toBe(true);
    expect(() => guarda.canActivate(ctx)).toThrow(ErroDoServico);
    return new Promise<void>((r) => setTimeout(r, 30)).then(() => {
      expect(guarda.canActivate(ctx)).toBe(true);
    });
  });
});
