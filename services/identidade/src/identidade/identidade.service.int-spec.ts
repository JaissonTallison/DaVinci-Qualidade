import { generateKeyPairSync } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import {
  PERFIS_PADRAO,
  TODOS_OS_RECURSOS,
  TOKEN_EMISSOR,
  TOKEN_PUBLICO,
  uuidv7,
  type Contexto,
  type ErroPadrao,
  ehDesafio2fa,
  type Sessao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  acessos,
  empresas,
  perfis,
  sessoes,
  usuarios,
  vinculos,
} from '../db/schema.js';
import { protegerSenha } from '../seguranca/senhas.js';
import { CARENCIA_SEGUNDOS, hashDoToken } from '../seguranca/tokens.js';
import { EmpresaService } from '../empresa/empresa.service.js';
import { IdentidadeService, MAXIMO_DE_FALHAS } from './identidade.service.js';

// Login externo: a conferência do id_token tem teste próprio (provedores.spec.ts); aqui o "token" já é o e-mail
vi.mock('../seguranca/provedores.js', () => ({
  conferirTokenExterno: (_: string, idToken: string) =>
    Promise.resolve(idToken),
}));

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: IdentidadeService;
const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const SENHA = 'senha-correta-123';
const ids = {
  empresaA: uuidv7(),
  empresaB: uuidv7(),
  empresaC: uuidv7(),
  ana: uuidv7(),
  bruno: uuidv7(),
  inativo: uuidv7(),
  semAcesso: uuidv7(),
};

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}
const ctx = (usuarioId: string, empresaId: string): Contexto => ({
  usuarioId,
  empresaId,
  rastreioId: uuidv7(),
});
const conferirToken = (t: string) =>
  jwtVerify(t, publicKey, { issuer: TOKEN_EMISSOR, audience: TOKEN_PUBLICO });

/** Login que deve terminar em sessão (sem 2FA). */
async function entrar(
  dados: Parameters<IdentidadeService['autenticar']>[0],
): Promise<Sessao> {
  const r = await servico.autenticar(dados);
  if (ehDesafio2fa(r))
    throw new Error('era esperada uma sessão, veio um desafio de 2FA');
  return r;
}

beforeAll(async () => {
  process.env.JWT_CHAVE_PRIVADA = Buffer.from(
    privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  ).toString('base64');
  banco = await criarBancoDeTeste(schema);
  servico = new IdentidadeService(banco.db);
  const { db } = banco;
  const hash = await protegerSenha(SENHA, 2 ** 12);
  await db.insert(empresas).values([
    {
      id: ids.empresaA,
      cnpj: '11222333000181',
      razaoSocial: 'Alfa Ltda.',
      nomeFantasia: 'Alfa',
    },
    { id: ids.empresaB, cnpj: '11444777000161', razaoSocial: 'Beta S.A.' },
    { id: ids.empresaC, cnpj: '45997418000153', razaoSocial: 'Gama Ltda.' },
  ]);
  const perfil: Record<string, string> = {};
  for (const emp of [ids.empresaA, ids.empresaB]) {
    for (const p of PERFIS_PADRAO) {
      const [r] = await db
        .insert(perfis)
        .values({ empresaId: emp, nome: p.nome, permissoes: p.permissoes })
        .returning();
      perfil[`${emp}:${p.nome}`] = r!.id;
    }
  }
  await db.insert(usuarios).values([
    {
      id: ids.ana,
      nome: 'Ana Souza',
      email: 'ana@exemplo.com.br',
      senhaHash: hash,
    },
    {
      id: ids.bruno,
      nome: 'Bruno Lima',
      email: 'bruno@exemplo.com.br',
      senhaHash: hash,
    },
    {
      id: ids.inativo,
      nome: 'Inativo',
      email: 'inativo@exemplo.com.br',
      senhaHash: hash,
      ativo: false,
    },
    {
      id: ids.semAcesso,
      nome: 'Sem Acesso',
      email: 'sem@exemplo.com.br',
      senhaHash: hash,
    },
  ]);
  await db.insert(vinculos).values([
    {
      empresaId: ids.empresaA,
      usuarioId: ids.ana,
      perfilId: perfil[`${ids.empresaA}:Administrador`]!,
    },
    {
      empresaId: ids.empresaB,
      usuarioId: ids.ana,
      perfilId: perfil[`${ids.empresaB}:Consulta`]!,
    },
    {
      empresaId: ids.empresaA,
      usuarioId: ids.bruno,
      perfilId: perfil[`${ids.empresaA}:Gestor do SGI`]!,
    },
    {
      empresaId: ids.empresaA,
      usuarioId: ids.inativo,
      perfilId: perfil[`${ids.empresaA}:Consulta`]!,
    },
  ]);
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('login', () => {
  it('entra, recebe token assinado com empresa e permissões, e lista as empresas do usuário', async () => {
    const s = await entrar({ email: '  ANA@exemplo.com.br ', senha: SENHA });
    const { payload } = await conferirToken(s.tokenAcesso);
    expect(payload).toMatchObject({
      sub: ids.ana,
      emp: s.empresa.id,
      nom: 'Ana Souza',
    });
    expect(s.empresas.map((e) => e.nome)).toEqual(['Alfa', 'Beta S.A.']);
    expect(
      new Date(s.acessoExpiraEm).getTime() - Date.now(),
    ).toBeLessThanOrEqual(15 * 60_000);
  });

  it('respeita a empresa escolhida e aplica o perfil DAQUELA empresa', async () => {
    const s = await entrar({
      email: 'ana@exemplo.com.br',
      senha: SENHA,
      empresaId: ids.empresaB,
    });
    expect(s.empresa.id).toBe(ids.empresaB);
    expect(s.permissoes).toEqual(
      PERFIS_PADRAO.find((p) => p.nome === 'Consulta')!.permissoes,
    ); // Consulta (a lista vem do código: cresce com os módulos)
  });

  it('não entra em empresa sem vínculo', async () => {
    expect(
      (
        await recusa(
          servico.autenticar({
            email: 'ana@exemplo.com.br',
            senha: SENHA,
            empresaId: ids.empresaC,
          }),
        )
      ).codigo,
    ).toBe('SEM_PERMISSAO');
  });

  it('senha errada e e-mail inexistente recebem a MESMA mensagem (não revela quem existe)', async () => {
    const a = await recusa(
      servico.autenticar({ email: 'bruno@exemplo.com.br', senha: 'errada' }),
    );
    const b = await recusa(
      servico.autenticar({ email: 'ninguem@exemplo.com.br', senha: 'errada' }),
    );
    expect(a).toEqual({
      codigo: 'NAO_AUTENTICADO',
      mensagem: 'E-mail ou senha incorretos.',
    });
    expect(b).toEqual(a);
  });

  it(`bloqueia por 15 min após ${MAXIMO_DE_FALHAS} senhas erradas, mesmo com a senha certa depois`, async () => {
    await banco.db
      .update(usuarios)
      .set({ falhasLogin: 0, bloqueadoAte: null })
      .where(eq(usuarios.id, ids.bruno));
    for (let i = 0; i < MAXIMO_DE_FALHAS; i++)
      await recusa(
        servico.autenticar({ email: 'bruno@exemplo.com.br', senha: 'errada' }),
      );
    const erro = await recusa(
      servico.autenticar({ email: 'bruno@exemplo.com.br', senha: SENHA }),
    );
    expect(erro.mensagem).toBe(
      'Acesso bloqueado temporariamente por excesso de tentativas. Tente novamente em 15 minutos.',
    );
    await banco.db
      .update(usuarios)
      .set({ bloqueadoAte: null })
      .where(eq(usuarios.id, ids.bruno));
  });

  it('usuário inativo e usuário sem empresa não entram, com mensagem clara', async () => {
    expect(
      (
        await recusa(
          servico.autenticar({ email: 'inativo@exemplo.com.br', senha: SENHA }),
        )
      ).mensagem,
    ).toContain('inativo');
    expect(
      (
        await recusa(
          servico.autenticar({ email: 'sem@exemplo.com.br', senha: SENHA }),
        )
      ).mensagem,
    ).toContain('não tem acesso a nenhuma empresa');
  });
});

describe('login com conta externa (Microsoft/Google)', () => {
  const externo = (email: string) =>
    servico.autenticarExterno({
      provedor: 'google',
      idToken: email,
      nonce: 'nonce-de-teste-0123456789',
    });

  it('e-mail de usuário cadastrado → sessão, e o histórico registra o provedor', async () => {
    const r = await externo('bruno@exemplo.com.br');
    if (ehDesafio2fa(r)) throw new Error('era esperada uma sessão');
    expect(r.usuario.id).toBe(ids.bruno);
    const [ultimo] = await banco.db
      .select({ resultado: acessos.resultado })
      .from(acessos)
      .where(eq(acessos.usuarioId, ids.bruno))
      .orderBy(desc(acessos.momento))
      .limit(1);
    expect(ultimo?.resultado).toBe('externo_google');
  });

  it('e-mail sem cadastro não cria usuário: recusa e manda falar com o administrador', async () => {
    expect(
      (await recusa(externo('estranho@exemplo.com.br'))).mensagem,
    ).toContain('Peça ao administrador');
  });

  it('usuário inativo continua barrado', async () => {
    expect(
      (await recusa(externo('inativo@exemplo.com.br'))).mensagem,
    ).toContain('inativo');
  });
});

describe('sessão', () => {
  it('renovar troca o token (uso único) e mantém a empresa', async () => {
    const s1 = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    const s2 = await servico.renovar({ tokenRenovacao: s1.tokenRenovacao });
    expect(s2.tokenRenovacao).not.toBe(s1.tokenRenovacao);
    expect(s2.empresa.id).toBe(s1.empresa.id);
  });

  /** Simula a passagem do tempo: a troca de R1 aconteceu há mais tempo que a carência. */
  const envelhecer = (token: string) =>
    banco.db
      .update(sessoes)
      .set({
        revogadaEm: new Date(Date.now() - (CARENCIA_SEGUNDOS + 1) * 1000),
      })
      .where(eq(sessoes.tokenHash, hashDoToken(token)));

  it(`requisições simultâneas: o token antigo ainda renova por ${CARENCIA_SEGUNDOS} s, sem derrubar a sessão`, async () => {
    const s1 = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    const [a, b] = await Promise.all([
      servico.renovar({ tokenRenovacao: s1.tokenRenovacao }),
      servico.renovar({ tokenRenovacao: s1.tokenRenovacao }),
    ]);
    expect(a.tokenRenovacao).not.toBe(b.tokenRenovacao);
    expect(
      (await servico.renovar({ tokenRenovacao: a.tokenRenovacao })).usuario.id,
    ).toBe(ids.bruno);
    expect(
      (await servico.renovar({ tokenRenovacao: b.tokenRenovacao })).usuario.id,
    ).toBe(ids.bruno);
  });

  it('token já trocado reaparecendo DEPOIS da carência = cópia: revoga a família inteira (inclusive o token novo)', async () => {
    const s1 = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    const s2 = await servico.renovar({ tokenRenovacao: s1.tokenRenovacao });
    await envelhecer(s1.tokenRenovacao);
    expect(
      (await recusa(servico.renovar({ tokenRenovacao: s1.tokenRenovacao })))
        .mensagem,
    ).toBe('Sua sessão expirou. Entre novamente.');
    expect(
      (await recusa(servico.renovar({ tokenRenovacao: s2.tokenRenovacao })))
        .codigo,
    ).toBe('NAO_AUTENTICADO');
  });

  it('sair encerra a sessão', async () => {
    const s = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    await servico.encerrar({ tokenRenovacao: s.tokenRenovacao });
    expect(
      (await recusa(servico.renovar({ tokenRenovacao: s.tokenRenovacao })))
        .codigo,
    ).toBe('NAO_AUTENTICADO');
  });

  it('o banco guarda só o hash do token de renovação', async () => {
    const s = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    const todas = await banco.db.select({ h: sessoes.tokenHash }).from(sessoes);
    expect(todas.some((x) => x.h === s.tokenRenovacao)).toBe(false);
  });

  it('troca de empresa abre sessão com as permissões da outra empresa', async () => {
    const s = await entrar({
      email: 'ana@exemplo.com.br',
      senha: SENHA,
      empresaId: ids.empresaA,
    });
    const outra = await servico.trocarEmpresa({
      tokenRenovacao: s.tokenRenovacao,
      empresaId: ids.empresaB,
    });
    expect(outra.empresa.id).toBe(ids.empresaB);
    expect(outra.permissoes).not.toContain('usuarios.gerenciar');
    expect(
      (
        await recusa(
          servico.trocarEmpresa({
            tokenRenovacao: outra.tokenRenovacao,
            empresaId: ids.empresaC,
          }),
        )
      ).codigo,
    ).toBe('SEM_PERMISSAO');
  });
});

describe('senha e dados do usuário', () => {
  it('senha pendente vai no token (dts) e sai dele depois da troca + renovação', async () => {
    await banco.db
      .update(usuarios)
      .set({ deveTrocarSenha: true })
      .where(eq(usuarios.id, ids.bruno));
    const s = await entrar({ email: 'bruno@exemplo.com.br', senha: SENHA });
    expect((await conferirToken(s.tokenAcesso)).payload.dts).toBe(true);
    await servico.trocarSenha(ctx(ids.bruno, ids.empresaA), {
      senhaAtual: SENHA,
      novaSenha: 'outra-senha-forte-1',
      tokenRenovacao: s.tokenRenovacao,
    });
    const nova = await servico.renovar({ tokenRenovacao: s.tokenRenovacao });
    expect((await conferirToken(nova.tokenAcesso)).payload.dts).toBe(false);
    expect(nova.usuario.deveTrocarSenha).toBe(false);
    await banco.db
      .update(usuarios)
      .set({ senhaHash: await protegerSenha(SENHA, 2 ** 12) })
      .where(eq(usuarios.id, ids.bruno));
  });

  it('"eu" devolve usuário, empresa atual, empresas e permissões', async () => {
    const r = await servico.eu(ctx(ids.bruno, ids.empresaA));
    expect(r).toMatchObject({
      usuario: { nome: 'Bruno Lima' },
      empresa: { id: ids.empresaA },
      permissoes: PERFIS_PADRAO[1]!.permissoes,
    });
  });

  it('trocar senha: exige a atual, encerra as OUTRAS sessões e mantém a atual', async () => {
    const outraSessao = await entrar({
      email: 'ana@exemplo.com.br',
      senha: SENHA,
    });
    const atual = await entrar({ email: 'ana@exemplo.com.br', senha: SENHA });
    const erro = await recusa(
      servico.trocarSenha(ctx(ids.ana, ids.empresaA), {
        senhaAtual: 'errada',
        novaSenha: 'nova-senha-forte-2026',
      }),
    );
    expect(erro.detalhes).toEqual([
      { campo: 'senhaAtual', mensagem: 'Senha atual incorreta.' },
    ]);

    await servico.trocarSenha(ctx(ids.ana, ids.empresaA), {
      senhaAtual: SENHA,
      novaSenha: 'nova-senha-forte-2026',
      tokenRenovacao: atual.tokenRenovacao,
    });
    expect(
      (
        await recusa(
          servico.renovar({ tokenRenovacao: outraSessao.tokenRenovacao }),
        )
      ).codigo,
    ).toBe('NAO_AUTENTICADO');
    expect(
      (await servico.renovar({ tokenRenovacao: atual.tokenRenovacao })).usuario
        .email,
    ).toBe('ana@exemplo.com.br');
    expect(
      (
        await entrar({
          email: 'ana@exemplo.com.br',
          senha: 'nova-senha-forte-2026',
        })
      ).usuario.id,
    ).toBe(ids.ana);
  });

  it('nova senha curta é recusada com mensagem no campo', async () => {
    const erro = await recusa(
      servico.trocarSenha(ctx(ids.bruno, ids.empresaA), {
        senhaAtual: SENHA,
        novaSenha: 'curta',
      }),
    );
    expect(erro.detalhes).toContainEqual({
      campo: 'novaSenha',
      mensagem: 'Use pelo menos 10 caracteres.',
    });
  });
});

describe('recursos por empresa (A122)', () => {
  it('sem lista, tudo ligado; desligar tira as permissões do módulo (até do Administrador); ligar não desliga nada', async () => {
    // O teste de troca de senha muda a senha da Ana: volta a senha original
    await banco.db
      .update(usuarios)
      .set({ senhaHash: await protegerSenha(SENHA, 2 ** 12) })
      .where(eq(usuarios.id, ids.ana));
    const antes = await entrar({
      email: 'ana@exemplo.com.br',
      senha: SENHA,
      empresaId: ids.empresaA,
    });
    expect(antes.recursos).toContain('seguranca');
    expect(antes.permissoes).toContain('seguranca.liberar-pt');
    const empresa = new EmpresaService(banco.db);
    const A = { empresaId: ids.empresaA, usuarioId: ids.ana, rastreioId: 'r' };
    const r = await empresa.salvarRecursos(A, {
      recursos: ['sgi', 'qualidade'],
    });
    expect(r.ligados).toEqual(['qualidade', 'sgi']);
    const s = await entrar({
      email: 'ana@exemplo.com.br',
      senha: SENHA,
      empresaId: ids.empresaA,
    });
    expect(s.recursos).toEqual(['qualidade', 'sgi']);
    expect(
      s.permissoes.some(
        (p) =>
          p.startsWith('seguranca.') ||
          p.startsWith('ambiental.') ||
          p.startsWith('esg.'),
      ),
    ).toBe(false);
    expect(s.permissoes).toContain('qualidade.ver');
    expect(s.permissoes).toContain('parceiros.ver');
    const { payload } = await conferirToken(s.tokenAcesso);
    expect(payload.rec).toEqual(['qualidade', 'sgi']);
    expect(
      (
        await servico.eu({
          empresaId: ids.empresaA,
          usuarioId: ids.ana,
          rastreioId: 'r',
        })
      ).recursos,
    ).toEqual(['qualidade', 'sgi']);
    // Ligar um módulo mantém os que já estavam ligados
    const l = await empresa.ligarRecursos(A, { recursos: ['esg'] });
    expect(l.ligados).toEqual(['qualidade', 'sgi', 'esg']);
    await empresa.salvarRecursos(A, { recursos: [...TODOS_OS_RECURSOS] });
  });
});
