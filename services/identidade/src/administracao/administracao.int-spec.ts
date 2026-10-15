import { generateKeyPairSync } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import {
  PERFIS_PADRAO,
  TODAS_AS_PERMISSOES,
  uuidv7,
  type Contexto,
  type ErroPadrao,
  ehDesafio2fa,
  type Sessao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { empresas, perfis, usuarios, vinculos } from '../db/schema.js';
import { ContaService } from '../conta/conta.service.js';
import { IdentidadeService } from '../identidade/identidade.service.js';
import { protegerSenha } from '../seguranca/senhas.js';
import { PerfisService } from './perfis.service.js';
import { UsuariosService } from './usuarios.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let usuariosSvc: UsuariosService;
let perfisSvc: PerfisService;
let identidade: IdentidadeService;
const SENHA = 'senha-correta-123';
const ids = {
  alfa: uuidv7(),
  beta: uuidv7(),
  admin: uuidv7(),
  contador: uuidv7(),
};
const perfil: Record<string, string> = {};
const ctxAlfa = (): Contexto => ({
  empresaId: ids.alfa,
  usuarioId: ids.admin,
  rastreioId: uuidv7(),
});
const ctxBeta = (): Contexto => ({
  empresaId: ids.beta,
  usuarioId: ids.contador,
  rastreioId: uuidv7(),
});

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}

/** Login que deve terminar em sessão (sem 2FA). */
async function entrar(
  dados: Parameters<IdentidadeService['autenticar']>[0],
): Promise<Sessao> {
  const r = await identidade.autenticar(dados);
  if (ehDesafio2fa(r))
    throw new Error('era esperada uma sessão, veio um desafio de 2FA');
  return r;
}

beforeAll(async () => {
  process.env.JWT_CHAVE_PRIVADA = Buffer.from(
    generateKeyPairSync('ed25519')
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString(),
  ).toString('base64');
  banco = await criarBancoDeTeste(schema);
  identidade = new IdentidadeService(banco.db);
  usuariosSvc = new UsuariosService(
    banco.db,
    new ContaService(banco.db, identidade),
  );
  perfisSvc = new PerfisService(banco.db);
  const { db } = banco;
  await db.insert(empresas).values([
    { id: ids.alfa, cnpj: '11222333000181', razaoSocial: 'Alfa Ltda.' },
    { id: ids.beta, cnpj: '11444777000161', razaoSocial: 'Beta S.A.' },
  ]);
  for (const emp of [ids.alfa, ids.beta]) {
    for (const p of PERFIS_PADRAO) {
      const [r] = await db
        .insert(perfis)
        .values({
          empresaId: emp,
          nome: p.nome,
          permissoes: p.permissoes,
          protegido: p.nome === 'Administrador',
        })
        .returning();
      perfil[`${emp}:${p.nome}`] = r!.id;
    }
  }
  const hash = await protegerSenha(SENHA, 2 ** 12);
  await db.insert(usuarios).values([
    {
      id: ids.admin,
      nome: 'Ana Admin',
      email: 'ana@alfa.com.br',
      senhaHash: hash,
    },
    {
      id: ids.contador,
      nome: 'Carlos Contador',
      email: 'carlos@contabil.com.br',
      senhaHash: hash,
    },
  ]);
  await db.insert(vinculos).values([
    {
      empresaId: ids.alfa,
      usuarioId: ids.admin,
      perfilId: perfil[`${ids.alfa}:Administrador`]!,
    },
    {
      empresaId: ids.beta,
      usuarioId: ids.contador,
      perfilId: perfil[`${ids.beta}:Administrador`]!,
    },
  ]);
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('cadastrar usuário', () => {
  it('pessoa nova: senha provisória legível (mostrada 1 vez), troca obrigatória, consegue entrar', async () => {
    const r = await usuariosSvc.criar(ctxAlfa(), {
      nome: ' Bruno Lima ',
      email: 'Bruno@Alfa.com.br',
      perfilId: perfil[`${ids.alfa}:Gestor do SGI`],
    });
    expect(r.pessoaJaExistia).toBe(false);
    expect(r.senhaProvisoria).toMatch(/^[a-zA-Z2-9]{4}(-[a-zA-Z2-9]{4}){3}$/);
    expect(r.usuario).toMatchObject({
      nome: 'Bruno Lima',
      email: 'bruno@alfa.com.br',
      perfil: { nome: 'Gestor do SGI' },
      ativo: true,
      deveTrocarSenha: true,
      euMesmo: false,
    });
    const s = await entrar({
      email: 'bruno@alfa.com.br',
      senha: r.senhaProvisoria!,
    });
    expect(s.usuario.deveTrocarSenha).toBe(true);
  });

  it('e-mail de outra empresa: só ganha acesso (sem senha nova; a dele continua valendo)', async () => {
    const r = await usuariosSvc.criar(ctxAlfa(), {
      nome: 'Outro Nome',
      email: 'carlos@contabil.com.br',
      perfilId: perfil[`${ids.alfa}:Consulta`],
    });
    expect(r).toMatchObject({
      pessoaJaExistia: true,
      senhaProvisoria: null,
      usuario: { nome: 'Carlos Contador', acessaOutrasEmpresas: true },
    });
    const s = await entrar({
      email: 'carlos@contabil.com.br',
      senha: SENHA,
      empresaId: ids.alfa,
    });
    expect(s.empresas.map((e) => e.nome).sort()).toEqual([
      'Alfa Ltda.',
      'Beta S.A.',
    ]);
  });

  it('e-mail que já tem acesso a esta empresa: conflito no campo', async () => {
    const e = await recusa(
      usuariosSvc.criar(ctxAlfa(), {
        nome: 'Bruno',
        email: 'bruno@alfa.com.br',
        perfilId: perfil[`${ids.alfa}:Consulta`],
      }),
    );
    expect(e).toMatchObject({
      codigo: 'CONFLITO',
      mensagem: 'Bruno Lima já tem acesso a esta empresa.',
    });
  });

  it('perfil de OUTRA empresa não serve', async () => {
    const e = await recusa(
      usuariosSvc.criar(ctxAlfa(), {
        nome: 'Dani',
        email: 'dani@alfa.com.br',
        perfilId: perfil[`${ids.beta}:Consulta`],
      }),
    );
    expect(e.detalhes).toEqual([
      {
        campo: 'perfilId',
        mensagem: 'Selecione um perfil ativo desta empresa.',
      },
    ]);
  });

  it('a lista de uma empresa não mostra usuários de outra', async () => {
    const beta = await usuariosSvc.listar(ctxBeta());
    expect(beta.map((u) => u.nome)).toEqual(['Carlos Contador']);
    expect(
      (await recusa(usuariosSvc.obter(ctxBeta(), { id: ids.admin }))).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});

describe('alterar perfil, remover e devolver acesso', () => {
  const bruno = async () =>
    (await usuariosSvc.listar(ctxAlfa())).find(
      (u) => u.email === 'bruno@alfa.com.br',
    )!;

  it('altera o perfil com a versão lida; versão antiga = conflito', async () => {
    const b = await bruno();
    const alterado = await usuariosSvc.alterarPerfil(ctxAlfa(), {
      id: b.id,
      perfilId: perfil[`${ids.alfa}:Consulta`],
      versao: b.versao,
    });
    expect(alterado.perfil.nome).toBe('Consulta');
    expect(
      (
        await recusa(
          usuariosSvc.alterarPerfil(ctxAlfa(), {
            id: b.id,
            perfilId: perfil[`${ids.alfa}:Gestor do SGI`],
            versao: b.versao,
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
  });

  it('ninguém altera o próprio perfil nem remove o próprio acesso', async () => {
    const eu = (await usuariosSvc.listar(ctxAlfa())).find((u) => u.euMesmo)!;
    expect(
      (
        await recusa(
          usuariosSvc.alterarPerfil(ctxAlfa(), {
            id: eu.id,
            perfilId: perfil[`${ids.alfa}:Consulta`],
            versao: eu.versao,
          }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
    expect(
      (
        await recusa(
          usuariosSvc.removerAcesso(ctxAlfa(), {
            id: eu.id,
            motivo: 'teste',
            versao: eu.versao,
          }),
        )
      ).mensagem,
    ).toBe('Você não pode remover o seu próprio acesso.');
  });

  it('a empresa nunca fica sem administrador ativo', async () => {
    // Bruno vira administrador; outro admin (Bruno) tenta rebaixar a Ana → ok; depois rebaixar Bruno (último) → recusa
    let b = await bruno();
    b = await usuariosSvc.alterarPerfil(ctxAlfa(), {
      id: b.id,
      perfilId: perfil[`${ids.alfa}:Administrador`],
      versao: b.versao,
    });
    const ctxBruno: Contexto = {
      empresaId: ids.alfa,
      usuarioId: b.id,
      rastreioId: uuidv7(),
    };
    const ana = (await usuariosSvc.listar(ctxBruno)).find(
      (u) => u.id === ids.admin,
    )!;
    await usuariosSvc.alterarPerfil(ctxBruno, {
      id: ana.id,
      perfilId: perfil[`${ids.alfa}:Consulta`],
      versao: ana.versao,
    });
    // Agora só o Bruno é administrador: a Ana (sem permissão na vida real) não conseguiria; aqui testamos a regra do serviço
    const e = await recusa(
      usuariosSvc.removerAcesso(ctxAlfa(), {
        id: b.id,
        motivo: 'Saiu da empresa',
        versao: (await bruno()).versao,
      }),
    );
    expect(e.mensagem).toContain('pelo menos um administrador ativo');
    // Volta ao estado inicial
    const anaAgora = (await usuariosSvc.listar(ctxBruno)).find(
      (u) => u.id === ids.admin,
    )!;
    await usuariosSvc.alterarPerfil(ctxBruno, {
      id: ids.admin,
      perfilId: perfil[`${ids.alfa}:Administrador`],
      versao: anaAgora.versao,
    });
    const bAgora = await bruno();
    await usuariosSvc.alterarPerfil(ctxAlfa(), {
      id: bAgora.id,
      perfilId: perfil[`${ids.alfa}:Gestor do SGI`],
      versao: bAgora.versao,
    });
  });

  it('remover acesso: exige motivo, encerra as sessões NESTA empresa e a pessoa não entra mais nela', async () => {
    const s = await entrar({
      email: 'carlos@contabil.com.br',
      senha: SENHA,
      empresaId: ids.alfa,
    });
    const c = (await usuariosSvc.listar(ctxAlfa())).find(
      (u) => u.id === ids.contador,
    )!;
    expect(
      (
        await recusa(
          usuariosSvc.removerAcesso(ctxAlfa(), {
            id: c.id,
            motivo: '',
            versao: c.versao,
          }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');

    const removido = await usuariosSvc.removerAcesso(ctxAlfa(), {
      id: c.id,
      motivo: 'Contrato encerrado',
      versao: c.versao,
    });
    expect(removido).toMatchObject({
      ativo: false,
      motivoInativacao: 'Contrato encerrado',
    });
    expect(
      (await recusa(identidade.renovar({ tokenRenovacao: s.tokenRenovacao })))
        .codigo,
    ).toBe('NAO_AUTENTICADO');
    expect(
      (
        await recusa(
          identidade.autenticar({
            email: 'carlos@contabil.com.br',
            senha: SENHA,
            empresaId: ids.alfa,
          }),
        )
      ).codigo,
    ).toBe('SEM_PERMISSAO');
    // Na empresa de origem, continua tudo normal
    expect(
      (await entrar({ email: 'carlos@contabil.com.br', senha: SENHA })).empresa
        .id,
    ).toBe(ids.beta);

    const devolvido = await usuariosSvc.devolverAcesso(ctxAlfa(), {
      id: c.id,
      versao: removido.versao,
    });
    expect(devolvido).toMatchObject({ ativo: true, motivoInativacao: null });
  });
});

describe('redefinir senha', () => {
  it('pessoa só desta empresa: senha provisória nova, troca obrigatória, sessões encerradas, desbloqueia', async () => {
    const b = (await usuariosSvc.listar(ctxAlfa())).find(
      (u) => u.email === 'bruno@alfa.com.br',
    )!;
    const antes = await entrar({
      email: 'bruno@alfa.com.br',
      senha: (await redefinir(b.id)).senhaProvisoria,
    });
    await banco.db
      .update(usuarios)
      .set({ bloqueadoAte: new Date(Date.now() + 600_000), falhasLogin: 3 })
      .where(eq(usuarios.id, b.id));
    const { senhaProvisoria } = await redefinir(b.id);
    expect(
      (
        await recusa(
          identidade.renovar({ tokenRenovacao: antes.tokenRenovacao }),
        )
      ).codigo,
    ).toBe('NAO_AUTENTICADO');
    const depois = await entrar({
      email: 'bruno@alfa.com.br',
      senha: senhaProvisoria,
    });
    expect(depois.usuario.deveTrocarSenha).toBe(true);
  });

  it('pessoa que acessa outras empresas: recusa (só ela troca a própria senha)', async () => {
    const e = await recusa(
      usuariosSvc.redefinirSenha(ctxAlfa(), { id: ids.contador }),
    );
    expect(e.mensagem).toContain('também acessa outras empresas');
    const [c] = await banco.db
      .select({ d: usuarios.deveTrocarSenha })
      .from(usuarios)
      .where(eq(usuarios.id, ids.contador));
    expect(c!.d).toBe(false);
  });

  it('a própria senha não se redefine por aqui', async () => {
    expect(
      (await recusa(usuariosSvc.redefinirSenha(ctxAlfa(), { id: ids.admin })))
        .mensagem,
    ).toContain('Alterar senha');
  });

  const redefinir = (id: string) =>
    usuariosSvc.redefinirSenha(ctxAlfa(), { id });
});

describe('perfis', () => {
  it('lista com o Administrador primeiro e quantas pessoas usam cada perfil', async () => {
    const lista = await perfisSvc.listar(ctxAlfa());
    expect(lista[0]).toMatchObject({
      nome: 'Administrador',
      protegido: true,
      permissoes: TODAS_AS_PERMISSOES,
    });
    expect(lista.find((p) => p.nome === 'Gestor do SGI')?.usuarios).toBe(1);
  });

  it('cria perfil próprio; nome repetido (sem diferenciar maiúsculas) é recusado; permissão desconhecida também', async () => {
    const p = await perfisSvc.criar(ctxAlfa(), {
      nome: 'Estagiário',
      descricao: '',
      permissoes: ['parceiros.ver', 'parceiros.ver'],
    });
    expect(p).toMatchObject({
      nome: 'Estagiário',
      descricao: null,
      permissoes: ['parceiros.ver'],
      usuarios: 0,
      protegido: false,
    });
    expect(
      (
        await recusa(
          perfisSvc.criar(ctxAlfa(), {
            nome: 'estagiário',
            permissoes: ['parceiros.ver'],
          }),
        )
      ).codigo,
    ).toBe('CONFLITO');
    expect(
      (
        await recusa(
          perfisSvc.criar(ctxAlfa(), {
            nome: 'X',
            permissoes: ['apagar.tudo'],
          }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');
    expect(
      (
        await recusa(
          perfisSvc.criar(ctxAlfa(), { nome: 'Vazio', permissoes: [] }),
        )
      ).detalhes,
    ).toContainEqual({
      campo: 'permissoes',
      mensagem: 'Marque pelo menos uma permissão.',
    });
  });

  it('editar permissões vale na próxima renovação da sessão de quem usa o perfil', async () => {
    const fin = (await perfisSvc.listar(ctxAlfa())).find(
      (p) => p.nome === 'Gestor do SGI',
    )!;
    const b = (await usuariosSvc.listar(ctxAlfa())).find(
      (u) => u.email === 'bruno@alfa.com.br',
    )!;
    const { senhaProvisoria } = await usuariosSvc.redefinirSenha(ctxAlfa(), {
      id: b.id,
    });
    const s = await entrar({
      email: 'bruno@alfa.com.br',
      senha: senhaProvisoria,
    });
    expect(s.permissoes).toContain('parceiros.inativar');
    await perfisSvc.atualizar(ctxAlfa(), {
      id: fin.id,
      nome: 'Gestor do SGI',
      descricao: fin.descricao,
      permissoes: ['parceiros.ver', 'parceiros.editar'],
      versao: fin.versao,
    });
    expect(
      (await identidade.renovar({ tokenRenovacao: s.tokenRenovacao }))
        .permissoes,
    ).toEqual(['parceiros.ver', 'parceiros.editar']);
  });

  it('Administrador é protegido; perfil em uso não inativa; sem uso inativa e reativa', async () => {
    const lista = await perfisSvc.listar(ctxAlfa());
    const admin = lista.find((p) => p.protegido)!;
    expect(
      (
        await recusa(
          perfisSvc.atualizar(ctxAlfa(), {
            id: admin.id,
            nome: 'Chefe',
            permissoes: ['parceiros.ver'],
            versao: admin.versao,
          }),
        )
      ).mensagem,
    ).toContain('Administrador');
    expect(
      (
        await recusa(
          perfisSvc.inativar(ctxAlfa(), { id: admin.id, versao: admin.versao }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');

    const fin = lista.find((p) => p.nome === 'Gestor do SGI')!;
    expect(
      (
        await recusa(
          perfisSvc.inativar(ctxAlfa(), { id: fin.id, versao: fin.versao }),
        )
      ).mensagem,
    ).toBe(
      '1 pessoa usa este perfil. Mude o perfil delas antes de inativá-lo.',
    );

    const est = lista.find((p) => p.nome === 'Estagiário')!;
    const inativo = await perfisSvc.inativar(ctxAlfa(), {
      id: est.id,
      versao: est.versao,
    });
    expect(inativo.ativo).toBe(false);
    // Perfil inativo não aparece como opção para cadastrar usuário
    expect(
      (
        await recusa(
          usuariosSvc.criar(ctxAlfa(), {
            nome: 'Eva',
            email: 'eva@alfa.com.br',
            perfilId: est.id,
          }),
        )
      ).codigo,
    ).toBe('DADOS_INVALIDOS');
    expect(
      (
        await perfisSvc.reativar(ctxAlfa(), {
          id: est.id,
          versao: inativo.versao,
        })
      ).ativo,
    ).toBe(true);
  });

  it('perfis de uma empresa não aparecem na outra', async () => {
    const est = (await perfisSvc.listar(ctxAlfa())).find(
      (p) => p.nome === 'Estagiário',
    )!;
    expect(
      (await perfisSvc.listar(ctxBeta())).some((p) => p.nome === 'Estagiário'),
    ).toBe(false);
    expect(
      (await recusa(perfisSvc.obter(ctxBeta(), { id: est.id }))).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});
