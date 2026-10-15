import { Test } from '@nestjs/testing';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { SERVICE_NAMES } from '@davinci/types';
import { HealthController } from './health.controller.js';

function clientMock(reply: 'ok' | 'erro'): Pick<ClientProxy, 'send'> {
  const send = () =>
    reply === 'ok'
      ? of({ status: 'ok', database: 'ok' })
      : throwError(() => new Error('sem resposta'));
  return { send: send as ClientProxy['send'] };
}

async function controllerWith(reply: 'ok' | 'erro') {
  const moduleRef = await Test.createTestingModule({
    controllers: [HealthController],
    providers: SERVICE_NAMES.map((name) => ({
      provide: name,
      useValue: clientMock(reply),
    })),
  }).compile();
  return moduleRef.get(HealthController);
}

describe('HealthController', () => {
  it('informa o estado do próprio gateway', async () => {
    const controller = await controllerWith('ok');
    expect(controller.self()).toMatchObject({
      service: 'api-gateway',
      status: 'ok',
    });
  });

  it('marca todos os serviços como ok quando respondem', async () => {
    const result = await (await controllerWith('ok')).services();
    expect(result).toHaveLength(SERVICE_NAMES.length);
    expect(result.every((s) => s.status === 'ok')).toBe(true);
  });

  it('marca como indisponível quando o serviço não responde', async () => {
    const result = await (await controllerWith('erro')).services();
    expect(result.every((s) => s.status === 'indisponivel')).toBe(true);
  });
});
