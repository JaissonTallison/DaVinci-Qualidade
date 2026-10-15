import { generateKeyPairSync } from 'node:crypto';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { of, throwError, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { AppModule } from './../src/app.module.js';
import { RevogacoesService } from './../src/auth/revogacoes.service.js';
import { comLogin, EMPRESA_ID, USUARIO_ID } from './acesso.js';

/** Serviço falso: registra o que recebeu e responde o que o teste mandar. */
function servicoFalso() {
  return {
    recebidas: [] as { padrao: string; mensagem: any }[],
    resposta: (): Observable<unknown> => of({}),
    send(padrao: string, mensagem: unknown) {
      this.recebidas.push({ padrao, mensagem });
      return this.resposta();
    },
  };
}
const codex = servicoFalso();
const identidade = servicoFalso();

describe('Acesso (login e permissões no gateway)', () => {
  let app: INestApplication<App>;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.CODEX)
      .useValue(codex)
      .overrideProvider(SERVICES.IDENTIDADE)
      .useValue(identidade)
      .compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    for (const s of [codex, identidade]) {
      s.recebidas = [];
      s.resposta = () => of({});
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('sem token → 401 "Entre para continuar." e o serviço nem é chamado', async () => {
    const res = await http().get('/parceiros').expect(401);
    expect(res.body.erro).toEqual({
      codigo: 'NAO_AUTENTICADO',
      mensagem: 'Entre para continuar.',
      rastreioId: res.headers['x-rastreio-id'],
    });
    expect(codex.recebidas).toHaveLength(0);
  });

  it('token vencido, adulterado, de outra chave ou para outro destino → 401 "sessão expirou"', async () => {
    const outraChave = generateKeyPairSync('ed25519').privateKey;
    const valido = (await comLogin()).authorization;
    const casos = [
      await comLogin(undefined, {
        expiraEm: Math.floor(Date.now() / 1000) - 60,
      }),
      await comLogin(undefined, { chave: outraChave }),
      await comLogin(undefined, { publico: 'outro-sistema' }),
      { authorization: `${valido.slice(0, -4)}AAAA` },
      { authorization: 'Bearer abc.def.ghi' },
    ];
    for (const cabecalho of casos) {
      const res = await http().get('/parceiros').set(cabecalho).expect(401);
      expect(res.body.erro.mensagem).toBe(
        'Sua sessão expirou. Entre novamente.',
      );
    }
    expect(codex.recebidas).toHaveLength(0);
  });

  it('sem a permissão da rota → 403, sem chamar o serviço', async () => {
    const consulta = await comLogin(['parceiros.ver', 'sistema.status']);
    await http().get('/parceiros').set(consulta).expect(200);
    const res = await http()
      .post('/parceiros')
      .set(consulta)
      .send({})
      .expect(403);
    expect(res.body.erro).toMatchObject({
      codigo: 'SEM_PERMISSAO',
      mensagem:
        'Você não tem permissão para esta ação. Fale com o administrador da empresa.',
    });
    await http()
      .post('/parceiros/abc/inativar')
      .set(await comLogin(['parceiros.ver', 'parceiros.editar']))
      .send({})
      .expect(403);
    expect(codex.recebidas).toHaveLength(1); // só o GET permitido
  });

  it('a empresa vem SEMPRE do token: cabeçalho x-empresa-id é ignorado', async () => {
    await http()
      .get('/parceiros')
      .set(await comLogin())
      .set('x-empresa-id', '0192f1c4-0000-7000-8000-0000000bad00')
      .expect(200);
    expect(codex.recebidas[0]?.mensagem.contexto).toMatchObject({
      empresaId: EMPRESA_ID,
      usuarioId: USUARIO_ID,
    });
  });

  it('/health é público; /health/services exige login e sistema.status', async () => {
    await http().get('/health').expect(200);
    await http().get('/health/services').expect(401);
    await http()
      .get('/health/services')
      .set(await comLogin(['parceiros.ver']))
      .expect(403);
  });

  it('POST /auth/login é público, valida antes de chamar e repassa só dados + rastreio', async () => {
    const res = await http()
      .post('/auth/login')
      .send({ email: 'nao-e-email', senha: '' })
      .expect(400);
    expect(
      res.body.erro.detalhes.map((d: { campo: string }) => d.campo),
    ).toEqual(expect.arrayContaining(['email', 'senha']));
    expect(identidade.recebidas).toHaveLength(0);

    identidade.resposta = () =>
      of({ tokenAcesso: 't', usuario: { nome: 'Ana' } });
    await http()
      .post('/auth/login')
      .send({ email: 'ana@exemplo.com.br', senha: 'x' })
      .expect(200);
    expect(identidade.recebidas[0]).toMatchObject({
      padrao: PATTERNS.identidade.autenticar,
      mensagem: { dados: { email: 'ana@exemplo.com.br' } },
    });
    expect(Object.keys(identidade.recebidas[0]!.mensagem.contexto)).toEqual([
      'rastreioId',
    ]);
  });

  it('login recusado pelo Identidade → 401 com a mensagem do serviço', async () => {
    identidade.resposta = () =>
      throwError(() => ({
        codigo: 'NAO_AUTENTICADO',
        mensagem: 'E-mail ou senha incorretos.',
      }));
    const res = await http()
      .post('/auth/login')
      .send({ email: 'ana@exemplo.com.br', senha: 'errada' })
      .expect(401);
    expect(res.body.erro.mensagem).toBe('E-mail ou senha incorretos.');
  });

  it('senha inicial pendente: só "eu" e trocar senha funcionam, mesmo com todas as permissões', async () => {
    const pendente = await comLogin(undefined, { dts: true });
    const res = await http().get('/parceiros').set(pendente).expect(403);
    expect(res.body.erro.mensagem).toBe(
      'Troque a senha inicial para continuar.',
    );
    await http().get('/health/services').set(pendente).expect(403);
    await http().get('/auth/eu').set(pendente).expect(200);
    await http()
      .post('/auth/senha')
      .set(pendente)
      .send({ senhaAtual: 'atual-123', novaSenha: 'nova-senha-forte' })
      .expect(200);
    expect(codex.recebidas).toHaveLength(0);
  });

  it('/auth/eu e /auth/senha exigem login e levam o contexto do token', async () => {
    await http().get('/auth/eu').expect(401);
    await http()
      .get('/auth/eu')
      .set(await comLogin([]))
      .expect(200);
    expect(identidade.recebidas[0]?.mensagem.contexto).toMatchObject({
      usuarioId: USUARIO_ID,
      empresaId: EMPRESA_ID,
    });
    await http()
      .post('/auth/senha')
      .send({ senhaAtual: 'a', novaSenha: 'nova-senha-forte' })
      .expect(401);
  });

  it('2FA pendente (c2f): só segurança da conta e ativar 2FA; mensagem própria', async () => {
    const pendente = await comLogin(undefined, { c2f: true });
    const res = await http().get('/parceiros').set(pendente).expect(403);
    expect(res.body.erro.mensagem).toContain(
      'exige a verificação em duas etapas',
    );
    await http().get('/conta/seguranca').set(pendente).expect(200);
    await http().post('/conta/2fa/iniciar').set(pendente).expect(200);
    await http()
      .post('/conta/2fa/desativar')
      .set(pendente)
      .send({ senha: 'x', codigo: '123456' })
      .expect(403);
  });

  it('login repassa IP (x-davinci-ip) e navegador; 2ª etapa valida o código antes', async () => {
    identidade.resposta = () =>
      of({ desafio2fa: 'd'.repeat(43), expiraEm: 'x' });
    await http()
      .post('/auth/login')
      .set('x-davinci-ip', '200.10.20.30, 10.0.0.1')
      .set('user-agent', 'Chrome/140')
      .send({ email: 'ana@exemplo.com.br', senha: 'x' })
      .expect(200);
    expect(identidade.recebidas[0]?.mensagem.dados.origem).toEqual({
      ip: '200.10.20.30',
      navegador: 'Chrome/140',
    });
    await http()
      .post('/auth/login/2fa')
      .send({ desafio: 'd'.repeat(43), codigo: '12' })
      .expect(400);
    await http()
      .post('/auth/login/2fa')
      .set('x-davinci-ip', 'não é ip')
      .send({ desafio: 'd'.repeat(43), codigo: '123456' })
      .expect(200);
    expect(identidade.recebidas[1]?.mensagem.dados.origem.ip).toBeNull();
  });

  it('sessão revogada por evento: o token dela é recusado NA HORA (sem esperar vencer)', async () => {
    const sid = '0192f1c4-0000-7000-8000-0000000005e5';
    const login = await comLogin(undefined, { sid });
    await http().get('/parceiros').set(login).expect(200);
    app.get(RevogacoesService).registrar([sid]);
    const res = await http().get('/parceiros').set(login).expect(401);
    expect(res.body.erro.mensagem).toBe('Sua sessão expirou. Entre novamente.');
    await http()
      .get('/parceiros')
      .set(
        await comLogin(undefined, {
          sid: '0192f1c4-0000-7000-8000-0000000005e6',
        }),
      )
      .expect(200);
  });

  it('recuperar e redefinir senha são públicos e validam antes', async () => {
    identidade.resposta = () => of({ enviado: true });
    await http().post('/auth/recuperar-senha').send({ email: 'x' }).expect(400);
    await http()
      .post('/auth/recuperar-senha')
      .send({ email: 'ana@exemplo.com.br' })
      .expect(200);
    await http()
      .post('/auth/redefinir-senha')
      .send({ token: 'curto', novaSenha: 'nova-senha-forte' })
      .expect(400);
    expect(identidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.identidade.recuperarSenha,
    ]);
  });
});
