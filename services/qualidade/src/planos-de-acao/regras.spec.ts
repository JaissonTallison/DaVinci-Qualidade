import {
  formatarNumeroPlano,
  planoAtrasado,
  prazoDoPlano,
  progresso,
  recusaPorStatusFinal,
  statusPelasTarefas,
} from './regras.js';

const t = (
  situacao: 'pendente' | 'concluida' | 'cancelada',
  prazo = '2026-10-20',
) => ({ situacao, prazo });

describe('status pelas tarefas', () => {
  it('tudo concluído aguarda eficácia; qualquer pendente volta para execução', () => {
    expect(statusPelasTarefas([t('concluida'), t('concluida')])).toBe(
      'aguardando_eficacia',
    );
    expect(statusPelasTarefas([t('concluida'), t('pendente')])).toBe(
      'em_execucao',
    );
  });

  it('tarefa cancelada não conta', () => {
    expect(statusPelasTarefas([t('concluida'), t('cancelada')])).toBe(
      'aguardando_eficacia',
    );
  });

  it('sem tarefa válida não há o que verificar', () => {
    expect(statusPelasTarefas([t('cancelada')])).toBe('em_execucao');
  });
});

describe('progresso e prazo', () => {
  it('progresso ignora canceladas e arredonda', () => {
    expect(
      progresso([t('concluida'), t('pendente'), t('pendente'), t('cancelada')]),
    ).toBe(33);
    expect(progresso([t('cancelada')])).toBe(0);
  });

  it('prazo do plano é o maior entre as tarefas válidas', () => {
    expect(
      prazoDoPlano([
        t('pendente', '2026-11-01'),
        t('concluida', '2026-10-20'),
        t('cancelada', '2027-01-01'),
      ]),
    ).toBe('2026-11-01');
  });

  it('atrasado: pendente com prazo vencido, e só em plano não final', () => {
    const tarefas = [t('pendente', '2026-10-14'), t('concluida', '2026-10-01')];
    expect(planoAtrasado('em_execucao', tarefas, '2026-10-15')).toBe(true);
    expect(
      planoAtrasado(
        'em_execucao',
        [t('concluida', '2026-10-01')],
        '2026-10-15',
      ),
    ).toBe(false);
    expect(planoAtrasado('cancelado', tarefas, '2026-10-15')).toBe(false);
  });
});

describe('plano terminado e número', () => {
  it('encerrado ou cancelado não aceita mais nada', () => {
    expect(recusaPorStatusFinal('encerrado')).toBe(
      'O plano está encerrado: não aceita mais alterações.',
    );
    expect(recusaPorStatusFinal('aguardando_eficacia')).toBeNull();
  });

  it('número PA-AAAA-NNN', () => {
    expect(formatarNumeroPlano(2026, 4)).toBe('PA-2026-004');
  });
});
