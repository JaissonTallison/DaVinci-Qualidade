import { situacaoDoTerceiro } from './regras.js';

const hoje = '2026-10-15';
const doc = (tipo: string, validade: string, id = tipo + validade) => ({
  id,
  tipo,
  validade,
});

describe('situacaoDoTerceiro', () => {
  it('sem os obrigatórios fica pendente, dizendo o que falta', () => {
    expect(situacaoDoTerceiro(null, [doc('pgr', '2027-01-01')], hoje)).toEqual({
      situacao: 'pendente',
      pendencias: ['PCMSO não enviado', 'ASO dos trabalhadores não enviado'],
    });
  });

  it('vale o documento mais novo do tipo; qualquer vigente vencido pendura', () => {
    const docs = [
      doc('pgr', '2026-01-01'),
      doc('pgr', '2027-01-01'),
      doc('pcmso', '2027-01-01'),
      doc('aso', '2027-01-01'),
    ];
    expect(situacaoDoTerceiro(null, docs, hoje).situacao).toBe('liberada');
    expect(
      situacaoDoTerceiro(null, [...docs, doc('seguro', '2026-10-14')], hoje)
        .pendencias,
    ).toEqual(['Seguro de vida vencido em 14/10/2026']);
    expect(situacaoDoTerceiro('2026-10-14', docs, hoje).situacao).toBe(
      'contrato_encerrado',
    );
  });
});
