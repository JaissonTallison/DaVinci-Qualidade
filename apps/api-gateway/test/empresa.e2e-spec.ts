import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { of, type Observable } from 'rxjs';
import { PATTERNS, SERVICES } from '@davinci/types';
import { AppModule } from './../src/app.module.js';
import { configurarApp } from './../src/configurar.js';
import { comLogin } from './acesso.js';

const identidade = {
  recebidas: [] as { padrao: string; mensagem: any }[],
  resposta: (): Observable<unknown> => of({}),
  send(padrao: string, mensagem: unknown) {
    this.recebidas.push({ padrao, mensagem });
    return this.resposta();
  },
};

describe('Empresa (e2e no gateway)', () => {
  let app: NestExpressApplication;
  const http = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SERVICES.IDENTIDADE)
      .useValue(identidade)
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>();
    configurarApp(app);
    await app.init();
  });

  beforeEach(() => {
    identidade.recebidas = [];
  });

  afterAll(async () => {
    await app.close();
  });

  it('dados da empresa exigem empresa.gerenciar; a logo só exige login', async () => {
    await http()
      .get('/empresa')
      .set(await comLogin(['parceiros.ver']))
      .expect(403);
    await http()
      .get('/empresa')
      .set(await comLogin(['empresa.gerenciar']))
      .expect(200);
    await http()
      .get('/empresa/logo')
      .set(await comLogin([]))
      .expect(200);
    await http().get('/empresa/logo').expect(401);
    expect(identidade.recebidas.map((r) => r.padrao)).toEqual([
      PATTERNS.empresa.obter,
      PATTERNS.empresa.obterLogo,
    ]);
  });

  it('logo de ~600 KB em base64 passa pelo limite do corpo; tipo inválido é recusado antes', async () => {
    const admin = await comLogin(['empresa.gerenciar']);
    await http()
      .put('/empresa/logo')
      .set(admin)
      .send({ tipo: 'image/png', base64: 'A'.repeat(600_000) })
      .expect(200);
    await http()
      .put('/empresa/logo')
      .set(admin)
      .send({ tipo: 'image/gif', base64: 'AAAA' })
      .expect(400);
    expect(identidade.recebidas).toHaveLength(1);
  });

  it('filial: valida e leva o id da URL', async () => {
    const admin = await comLogin(['empresa.gerenciar']);
    await http()
      .post('/empresa/estabelecimentos')
      .set(admin)
      .send({ cnpj: '123' })
      .expect(400);
    await http()
      .put('/empresa/estabelecimentos/e1')
      .set(admin)
      .send({
        cnpj: '11.222.333/0002-62',
        nome: 'Loja',
        razaoSocial: 'Alfa',
        indicadorIE: 'nao_contribuinte',
        versao: 'v',
      })
      .expect(200);
    expect(identidade.recebidas[0]).toMatchObject({
      padrao: PATTERNS.empresa.atualizarEstabelecimento,
      mensagem: { dados: { id: 'e1' } },
    });
  });
});
