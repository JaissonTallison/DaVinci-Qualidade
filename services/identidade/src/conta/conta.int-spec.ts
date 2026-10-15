import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import {
  ehDesafio2fa,
  uuidv7,
  type Contexto,
  type ErroPadrao,
  type RespostaLogin,
  type Sessao,
} from '@davinci/types';
import { UsuariosService } from '../administracao/usuarios.service.js';
import { PerfisService } from '../administracao/perfis.service.js';
import * as schema from '../db/schema.js';
import { acessos, empresas, perfis, usuarios, vinculos } from '../db/schema.js';
import {
  IdentidadeService,
  TENTATIVAS_DO_CODIGO,
} from '../identidade/identidade.service.js';
import { esquecerChave } from '../seguranca/cripto.js';
import { protegerSenha } from '../seguranca/senhas.js';
import { codigoNoPasso, deBase32, passoAtual } from '../seguranca/totp.js';
import { ContaService } from './conta.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let identidade: IdentidadeService;
let conta: ContaService;
let usuariosSvc: UsuariosService;
let perfisSvc: PerfisService;
const SENHA = 'senha-correta-123';
const ids = {
  empresa: uuidv7(),
  ana: uuidv7(),
  bruno: uuidv7(),
  perfilAdmin: uuidv7(),
  perfilConsulta: uuidv7(),
};
const ctx = (usuarioId = ids.ana): Contexto => ({
  empresaId: ids.empresa,
  usuarioId,
  rastreioId: uuidv7(),
});
const origem = {
  ip: '200.10.20.30',
  navegador: 'Mozilla/5.0 (X11; Linux) Chrome/140',
};
let segredo = '';
/** Código do aplicativo em um passo à frente (cada uso precisa de um passo novo: o mesmo código não vale 2 vezes). */
let desloc = 0;
const codigoAtual = () =>
  codigoNoPasso(deBase32(segredo), passoAtual() + (desloc++ % 2));

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}
const login = (
  email = 'ana@alfa.com.br',
  extra: Record<string, unknown> = {},
): Promise<RespostaLogin> =>
  identidade.autenticar({ email, senha: SENHA, origem, ...extra });
const comoSessao = (r: RespostaLogin): Sessao => {
  if (ehDesafio2fa(r)) throw new Error('veio desafio');
  return r;
};

beforeAll(async () => {
  process.env.JWT_CHAVE_PRIVADA = Buffer.from(
    generateKeyPairSync('ed25519')
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString(),
  ).toString('base64');
  process.env.CRIPTOGRAFIA_CHAVE = randomBytes(32).toString('base64');
  esquecerChave();
  banco = await criarBancoDeTeste(schema);
  identidade = new IdentidadeService(banco.db);
  conta = new ContaService(banco.db, identidade);
  usuariosSvc = new UsuariosService(banco.db, conta);
  perfisSvc = new PerfisService(banco.db);
  const hash = await protegerSenha(SENHA, 2 ** 12);
  await banco.db.insert(empresas).values({
    id: ids.empresa,
    cnpj: '11222333000181',
    razaoSocial: 'Alfa Ltda.',
  });
  await banco.db.insert(perfis).values([
    {
      id: ids.perfilAdmin,
      empresaId: ids.empresa,
      nome: 'Administrador',
      permissoes: ['usuarios.gerenciar', 'perfis.gerenciar'],
      protegido: true,
    },
    {
      id: ids.perfilConsulta,
      empresaId: ids.empresa,
      nome: 'Consulta',
      permissoes: ['parceiros.ver'],
    },
  ]);
  await banco.db.insert(usuarios).values([
    { id: ids.ana, nome: 'Ana', email: 'ana@alfa.com.br', senhaHash: hash },
    {
      id: ids.bruno,
      nome: 'Bruno',
      email: 'bruno@alfa.com.br',
      senhaHash: hash,
    },
  ]);
  await banco.db.insert(vinculos).values([
    { empresaId: ids.empresa, usuarioId: ids.ana, perfilId: ids.perfilAdmin },
    {
      empresaId: ids.empresa,
      usuarioId: ids.bruno,
      perfilId: ids.perfilConsulta,
    },
  ]);
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('ativar o 2FA', () => {
  it('iniciar gera segredo (guardado cifrado) e o endereço do QR; ainda não está ativo', async () => {
    const r = await conta.iniciar2fa(ctx());
    segredo = r.segredo;
    expect(r.uri).toContain(`secret=${r.segredo}`);
    const [u] = await banco.db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, ids.ana));
    expect(u!.totpPendente).not.toContain(r.segredo);
    expect(u!.totpSegredo).toBeNull();
    expect(ehDesafio2fa(await login())).toBe(false);
  });

  it('código errado não ativa; certo ativa e devolve 10 códigos de recuperação legíveis', async () => {
    expect(
      (await recusa(conta.confirmar2fa(ctx(), { codigo: '000000' }))).detalhes,
    ).toEqual([{ campo: 'codigo', mensagem: 'Código incorreto.' }]);
    const { codigos } = await conta.confirmar2fa(ctx(), {
      codigo: codigoAtual(),
    });
    expect(codigos).toHaveLength(10);
    expect(codigos[0]).toMatch(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    expect((await conta.seguranca(ctx(), {})).doisFatores).toMatchObject({
      ativo: true,
      codigosRestantes: 10,
    });
    recuperacao = codigos;
  });
});
let recuperacao: string[] = [];

describe('login com 2FA', () => {
  it('senha certa devolve um DESAFIO, não a sessão', async () => {
    const r = await login();
    expect(ehDesafio2fa(r)).toBe(true);
  });

  it('código certo abre a sessão; o mesmo código não vale de novo', async () => {
    const d = await login();
    if (!ehDesafio2fa(d)) throw new Error();
    const codigo = codigoNoPasso(deBase32(segredo), passoAtual() + 1);
    const s = await identidade.autenticar2fa({
      desafio: d.desafio2fa,
      codigo,
      origem,
    });
    expect(s.usuario.id).toBe(ids.ana);
    const d2 = await login();
    if (!ehDesafio2fa(d2)) throw new Error();
    expect(
      (
        await recusa(
          identidade.autenticar2fa({ desafio: d2.desafio2fa, codigo, origem }),
        )
      ).mensagem,
    ).toMatch(/^Código incorreto\./);
  });

  it(`${TENTATIVAS_DO_CODIGO} códigos errados invalidam o desafio`, async () => {
    const d = await login();
    if (!ehDesafio2fa(d)) throw new Error();
    for (let i = 0; i < TENTATIVAS_DO_CODIGO - 1; i++)
      await recusa(
        identidade.autenticar2fa({
          desafio: d.desafio2fa,
          codigo: '111111',
          origem,
        }),
      );
    expect(
      (
        await recusa(
          identidade.autenticar2fa({
            desafio: d.desafio2fa,
            codigo: '111111',
            origem,
          }),
        )
      ).mensagem,
    ).toContain('Muitas tentativas');
    expect(
      (
        await recusa(
          identidade.autenticar2fa({
            desafio: d.desafio2fa,
            codigo: codigoAtual(),
            origem,
          }),
        )
      ).mensagem,
    ).toContain('Entre de novo');
  });

  it('código de recuperação entra UMA vez (com ou sem hífen, maiúsculas ou não)', async () => {
    const d = await login();
    if (!ehDesafio2fa(d)) throw new Error();
    await identidade.autenticar2fa({
      desafio: d.desafio2fa,
      codigo: recuperacao[0]!.toLowerCase().replace('-', ''),
      origem,
    });
    const d2 = await login();
    if (!ehDesafio2fa(d2)) throw new Error();
    await recusa(
      identidade.autenticar2fa({
        desafio: d2.desafio2fa,
        codigo: recuperacao[0]!,
        origem,
      }),
    );
    expect(
      (await conta.seguranca(ctx(), {})).doisFatores.codigosRestantes,
    ).toBe(9);
  });

  it('"confiar neste navegador": no próximo login, entra só com a senha; trocar a senha cancela a confiança', async () => {
    const d = await login();
    if (!ehDesafio2fa(d)) throw new Error();
    const s = await identidade.autenticar2fa({
      desafio: d.desafio2fa,
      codigo: recuperacao[2]!,
      confiar: true,
      origem,
    });
    const token = s.navegadorConfiavel!.token;
    expect(
      comoSessao(await login('ana@alfa.com.br', { navegadorConfiavel: token }))
        .usuario.id,
    ).toBe(ids.ana);
    await identidade.trocarSenha(ctx(), {
      senhaAtual: SENHA,
      novaSenha: 'outra-senha-forte-9',
    });
    await banco.db
      .update(usuarios)
      .set({ senhaHash: await protegerSenha(SENHA, 2 ** 12) })
      .where(eq(usuarios.id, ids.ana));
    expect(
      ehDesafio2fa(
        await login('ana@alfa.com.br', { navegadorConfiavel: token }),
      ),
    ).toBe(true);
  });
});

describe('sessões e histórico', () => {
  it('lista as sessões ativas com navegador e IP, marca "esta sessão" e encerra as outras', async () => {
    const a = comoSessao(await login('bruno@alfa.com.br'));
    const b = comoSessao(await login('bruno@alfa.com.br'));
    const seg = await conta.seguranca(ctx(ids.bruno), {
      tokenRenovacao: b.tokenRenovacao,
    });
    expect(seg.sessoes.length).toBeGreaterThanOrEqual(2);
    expect(seg.sessoes.filter((s) => s.estaSessao)).toHaveLength(1);
    expect(seg.sessoes[0]).toMatchObject({
      ip: '200.10.20.30',
      navegador: origem.navegador,
      empresa: 'Alfa Ltda.',
    });
    expect(
      (
        await conta.encerrarOutras(ctx(ids.bruno), {
          tokenRenovacao: b.tokenRenovacao,
        })
      ).encerradas,
    ).toBeGreaterThanOrEqual(1);
    expect(
      (await recusa(identidade.renovar({ tokenRenovacao: a.tokenRenovacao })))
        .codigo,
    ).toBe('NAO_AUTENTICADO');
    expect(
      (await identidade.renovar({ tokenRenovacao: b.tokenRenovacao })).usuario
        .id,
    ).toBe(ids.bruno);
  });

  it('não encerra sessão de outra pessoa', async () => {
    const seg = await conta.seguranca(ctx(ids.bruno), {});
    expect(
      (
        await recusa(
          conta.encerrarSessao(ctx(ids.ana), { id: seg.sessoes[0]!.id }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });

  it('histórico registra acerto e erro de senha (com IP); apaga o que passou de 180 dias', async () => {
    await recusa(
      identidade.autenticar({
        email: 'bruno@alfa.com.br',
        senha: 'errada',
        origem,
      }),
    );
    const hist = (await conta.seguranca(ctx(ids.bruno), {})).acessos;
    expect(hist[0]).toMatchObject({
      resultado: 'senha_errada',
      ip: '200.10.20.30',
    });
    expect(hist.some((a) => a.resultado === 'sucesso')).toBe(true);
    await banco.db.insert(acessos).values({
      usuarioId: ids.bruno,
      email: 'bruno@alfa.com.br',
      resultado: 'sucesso',
      momento: new Date(Date.now() - 181 * 86_400_000),
    });
    expect(await conta.apagarHistoricoAntigo()).toBe(1);
  });
});

describe('perfil exige 2FA', () => {
  it('perfil exige e a pessoa não tem: entra com a pendência (c2f) no token', async () => {
    const consulta = (await perfisSvc.listar(ctx())).find(
      (p) => p.nome === 'Consulta',
    )!;
    await perfisSvc.exige2fa(ctx(), {
      id: consulta.id,
      exige: true,
      versao: consulta.versao,
    });
    const s = comoSessao(await login('bruno@alfa.com.br'));
    const conteudo = JSON.parse(
      Buffer.from(s.tokenAcesso.split('.')[1]!, 'base64url').toString(),
    );
    expect(conteudo.c2f).toBe(true);
  });

  it('com o perfil exigindo, a pessoa não consegue desativar o próprio 2FA', async () => {
    const admin = (await perfisSvc.listar(ctx())).find((p) => p.protegido)!;
    await perfisSvc.exige2fa(ctx(), {
      id: admin.id,
      exige: true,
      versao: admin.versao,
    });
    expect(
      (
        await recusa(
          conta.desativar2fa(ctx(), { senha: SENHA, codigo: codigoAtual() }),
        )
      ).mensagem,
    ).toContain('exige a verificação em duas etapas');
    const depois = (await perfisSvc.listar(ctx())).find((p) => p.protegido)!;
    await perfisSvc.exige2fa(ctx(), {
      id: admin.id,
      exige: false,
      versao: depois.versao,
    });
  });

  it('desativar o próprio 2FA exige senha e código; depois o login volta a ser só com senha', async () => {
    expect(
      (
        await recusa(
          conta.desativar2fa(ctx(), { senha: 'errada', codigo: '123456' }),
        )
      ).detalhes,
    ).toEqual([{ campo: 'senha', mensagem: 'Senha incorreta.' }]);
    await conta.desativar2fa(ctx(), { senha: SENHA, codigo: recuperacao[1]! });
    expect(ehDesafio2fa(await login())).toBe(false);
  });

  it('administrador desativa o 2FA de quem perdeu o celular (e encerra as sessões dela)', async () => {
    await conta.iniciar2fa(ctx(ids.bruno));
    const [u] = await banco.db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, ids.bruno));
    const { decifrar } = await import('../seguranca/cripto.js');
    await conta.confirmar2fa(ctx(ids.bruno), {
      codigo: codigoNoPasso(deBase32(decifrar(u!.totpPendente!)), passoAtual()),
    });
    expect(
      (await usuariosSvc.listar(ctx())).find((x) => x.id === ids.bruno)
        ?.doisFatores,
    ).toBe(true);
    await usuariosSvc.desativar2fa(ctx(), { id: ids.bruno });
    expect(
      (await usuariosSvc.listar(ctx())).find((x) => x.id === ids.bruno)
        ?.doisFatores,
    ).toBe(false);
    expect(
      (await recusa(usuariosSvc.desativar2fa(ctx(), { id: ids.ana }))).mensagem,
    ).toContain('Segurança da conta');
  });
});
