import { Test } from '@nestjs/testing';
import { DATABASE } from '@davinci/database';
import { SERVICES } from '@davinci/types';
import { HealthController } from './health.controller.js';

async function controllerCom(execute: () => Promise<unknown>) {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: [{ provide: DATABASE, useValue: { execute } }],
  }).compile();
  return moduleRef.get(HealthController);
}

describe('HealthController', () => {
  it('responde ao ping com o nome do serviço e o banco ok', async () => {
    const pong = await (await controllerCom(async () => ({ rows: [] }))).ping();
    expect(pong).toMatchObject({
      service: SERVICES.SERVICOS,
      status: 'ok',
      database: 'ok',
    });
  });

  it('informa banco indisponível sem derrubar o serviço', async () => {
    const pong = await (
      await controllerCom(() => Promise.reject(new Error('recusado')))
    ).ping();
    expect(pong).toMatchObject({ status: 'ok', database: 'indisponivel' });
  });
});
