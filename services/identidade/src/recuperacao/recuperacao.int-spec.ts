import { generateKeyPairSync } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import {
  PATTERNS,
  PEDIDOS_DE_SENHA_POR_HORA,
  ehDesafio2fa,
  uuidv7,
  type EmailParaEnviar,
  type ErroPadrao,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  empresas,
  perfis,
  recuperacoesSenha,
  sessoes,
  usuarios,
  vinculos,
} from '../db/schema.js';
import { IdentidadeService } from '../identidade/identidade.service.js';
import { protegerSenha } from '../seguranca/senhas.js';
import { anunciadas } from '../teste/sem-rabbitmq.js';
import { RecuperacaoService } from './recuperacao.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let recuperacao: RecuperacaoService;
let identidade: IdentidadeService;
const SENHA = 'senha-correta-123';
const ids = { empresa: uuidv7(), ana: uuidv7() };
/** Plataforma falsa: guarda os e-mails "enviados". */
const emails: EmailParaEnviar[] = [];
const plataforma = {
  emit: (padrao: string, m: { dados: EmailParaEnviar }) =>
    (padrao === PATTERNS.notificacoes.enviarEmail && emails.push(m.dados),
    undefined) as never,
};
const tokenDoUltimoEmail = () =>
  new URL(emails.at(-1)!.botao!.url).searchParams.get('token')!;

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}

beforeAll(async () => {
  process.env.JWT_CHAVE_PRIVADA = Buffer.from(
    generateKeyPairSync('ed25519')
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString(),
  ).toString('base64');
  process.env.APP_URL = 'https://erp.exemplo.com.br/';
  banco = await criarBancoDeTeste(schema);
  recuperacao = new RecuperacaoService(banco.db, plataforma as never);
  identidade = new IdentidadeService(banco.db);
  const perfil = uuidv7();
  await banco.db.insert(empresas).values({
    id: ids.empresa,
    cnpj: '11222333000181',
    razaoSocial: 'Alfa Ltda.',
  });
  await banco.db.insert(perfis).values({
    id: perfil,
    empresaId: ids.empresa,
    nome: 'Consulta',
    permissoes: ['parceiros.ver'],
  });
  await banco.db.insert(usuarios).values({
    id: ids.ana,
    nome: 'Ana Souza',
    email: 'ana@alfa.com.br',
    senhaHash: await protegerSenha(SENHA, 2 ** 12),
    falhasLogin: 3,
  });
  await banco.db
    .insert(vinculos)
    .values({ empresaId: ids.empresa, usuarioId: ids.ana, perfilId: perfil });
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('pedir o link', () => {
  it('e-mail inexistente: mesma resposta, nenhum e-mail enviado', async () => {
    expect(
      await recuperacao.solicitar({ email: 'ninguem@alfa.com.br' }),
    ).toEqual({ enviado: true });
    expect(emails).toHaveLength(0);
  });

  it('e-mail cadastrado: envia o link (endereço do sistema + token), 30 min, com o primeiro nome', async () => {
    await recuperacao.solicitar({
      email: ' ANA@alfa.com.br ',
      origem: { ip: '200.1.2.3' },
    });
    const e = emails.at(-1)!;
    expect(e).toMatchObject({
      para: 'ana@alfa.com.br',
      assunto: 'Criar nova senha · DaVinci Qualidade',
      paragrafos: ['Olá, Ana.', expect.stringContaining('30 minutos')],
    });
    expect(e.botao!.url).toMatch(
      /^https:\/\/erp\.exemplo\.com\.br\/redefinir-senha\?token=[\w-]{40,}$/,
    );
    const [guardado] = await banco.db
      .select()
      .from(recuperacoesSenha)
      .where(eq(recuperacoesSenha.usuarioId, ids.ana));
    expect(guardado!.tokenHash).not.toBe(tokenDoUltimoEmail());
  });

  it(`no máximo ${PEDIDOS_DE_SENHA_POR_HORA} por hora (o 4º responde igual, mas não envia)`, async () => {
    await recuperacao.solicitar({ email: 'ana@alfa.com.br' });
    await recuperacao.solicitar({ email: 'ana@alfa.com.br' });
    const antes = emails.length;
    expect(await recuperacao.solicitar({ email: 'ana@alfa.com.br' })).toEqual({
      enviado: true,
    });
    expect(emails).toHaveLength(antes);
  });
});

describe('criar a nova senha', () => {
  it('pedido mais novo invalida o link anterior', async () => {
    await banco.db
      .delete(recuperacoesSenha)
      .where(eq(recuperacoesSenha.usuarioId, ids.ana));
    await recuperacao.solicitar({ email: 'ana@alfa.com.br' });
    const antigo = tokenDoUltimoEmail();
    await recuperacao.solicitar({ email: 'ana@alfa.com.br' });
    expect(
      (
        await recusa(
          recuperacao.redefinir({
            token: antigo,
            novaSenha: 'nova-senha-forte-1',
          }),
        )
      ).mensagem,
    ).toContain('não vale mais');
  });

  it('link certo: troca a senha, desbloqueia, encerra TODAS as sessões e anuncia a revogação; uso único', async () => {
    const s = await identidade.autenticar({
      email: 'ana@alfa.com.br',
      senha: SENHA,
    });
    if (ehDesafio2fa(s)) throw new Error();
    const token = tokenDoUltimoEmail();
    anunciadas.length = 0;
    await recuperacao.redefinir({ token, novaSenha: 'nova-senha-forte-1' });
    expect(anunciadas.flatMap((a) => a.familias)).toHaveLength(1);
    expect(
      (await recusa(identidade.renovar({ tokenRenovacao: s.tokenRenovacao })))
        .codigo,
    ).toBe('NAO_AUTENTICADO');
    const [u] = await banco.db
      .select()
      .from(usuarios)
      .where(eq(usuarios.id, ids.ana));
    expect(u).toMatchObject({
      falhasLogin: 0,
      bloqueadoAte: null,
      deveTrocarSenha: false,
    });
    expect(
      ehDesafio2fa(
        await identidade.autenticar({
          email: 'ana@alfa.com.br',
          senha: 'nova-senha-forte-1',
        }),
      ),
    ).toBe(false);
    expect(
      (
        await recusa(
          recuperacao.redefinir({ token, novaSenha: 'outra-senha-forte-2' }),
        )
      ).codigo,
    ).toBe('REGRA_DE_NEGOCIO');
  });

  it('link vencido não vale; senha curta é recusada no campo', async () => {
    await banco.db
      .delete(recuperacoesSenha)
      .where(eq(recuperacoesSenha.usuarioId, ids.ana));
    await recuperacao.solicitar({ email: 'ana@alfa.com.br' });
    expect(
      (
        await recusa(
          recuperacao.redefinir({
            token: tokenDoUltimoEmail(),
            novaSenha: 'curta',
          }),
        )
      ).detalhes,
    ).toContainEqual({
      campo: 'novaSenha',
      mensagem: 'Use pelo menos 10 caracteres.',
    });
    await banco.db
      .update(recuperacoesSenha)
      .set({ expiraEm: new Date(Date.now() - 1000) })
      .where(eq(recuperacoesSenha.usuarioId, ids.ana));
    expect(
      (
        await recusa(
          recuperacao.redefinir({
            token: tokenDoUltimoEmail(),
            novaSenha: 'nova-senha-forte-3',
          }),
        )
      ).mensagem,
    ).toContain('venceu');
  });
});

describe('revogação imediata', () => {
  it('sair e trocar senha anunciam as sessões encerradas; renovar NÃO anuncia', async () => {
    const a = await identidade.autenticar({
      email: 'ana@alfa.com.br',
      senha: 'nova-senha-forte-1',
    });
    const b = await identidade.autenticar({
      email: 'ana@alfa.com.br',
      senha: 'nova-senha-forte-1',
    });
    if (ehDesafio2fa(a) || ehDesafio2fa(b)) throw new Error();
    anunciadas.length = 0;
    await identidade.renovar({ tokenRenovacao: a.tokenRenovacao });
    expect(anunciadas).toHaveLength(0);
    await identidade.encerrar({ tokenRenovacao: b.tokenRenovacao });
    expect(anunciadas).toHaveLength(1);
    const [sb] = await banco.db
      .select({ f: sessoes.familia })
      .from(sessoes)
      .where(
        eq(
          sessoes.tokenHash,
          (await import('../seguranca/tokens.js')).hashDoToken(
            b.tokenRenovacao,
          ),
        ),
      );
    expect(anunciadas[0]!.familias).toEqual([sb!.f]);
    expect((await recuperacao.revogacoesRecentes()).familias).toContain(sb!.f);
  });

  it('o token de acesso leva a sessão (sid) para o gateway poder recusá-lo', async () => {
    const s = await identidade.autenticar({
      email: 'ana@alfa.com.br',
      senha: 'nova-senha-forte-1',
    });
    if (ehDesafio2fa(s)) throw new Error();
    const conteudo = JSON.parse(
      Buffer.from(s.tokenAcesso.split('.')[1]!, 'base64url').toString(),
    );
    expect(conteudo.sid).toMatch(/^[0-9a-f-]{36}$/);
  });
});
