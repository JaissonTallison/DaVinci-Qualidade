import type { ConfiguracaoEsocial, DadosDaCat } from '@davinci/types';
import { idDoEvento, xmlS2210, xmlS2220, xmlS2240 } from './xml.js';

const config: ConfiguracaoEsocial = {
  cnpj: '11222333000181',
  ambiente: 2,
  inicioSst: '2023-01-01',
  medicoNome: 'Dra. Helena Costa',
  medicoCpf: null,
  medicoCrm: '123456',
  medicoUf: 'SP',
  ambientalNome: 'Eng. Paulo Lima',
  ambientalCpf: '52998224725',
  ambientalOrgao: 4,
  ambientalNumero: '5061234567',
  ambientalUf: 'SP',
  epiDeclaracao: {
    medProtecao: 'S',
    condFuncto: 'S',
    usoInint: 'S',
    przValid: 'S',
    periodicTroca: 'S',
    higienizacao: 'S',
  },
};
const vinculo = { cpf: '11144477735', matricula: 'A-10' };

describe('Id do evento', () => {
  it('ID + 1 + CNPJ (14) + data e hora de Brasília + sequencial (5) = 36 caracteres', () => {
    const id = idDoEvento(
      '11222333000181',
      new Date('2026-10-16T15:04:05Z'),
      7,
    );
    expect(id).toBe('ID1112223330001812026101612040500007');
    expect(id).toHaveLength(36);
  });
});

describe('S-2220', () => {
  it('monta o evento do ASO com os exames e o responsável pelo PCMSO, escapando texto', () => {
    const xml = xmlS2220(config, 'ID1', vinculo, {
      tipo: 'periodico',
      data: '2026-10-01',
      resultado: 'apto_com_restricao',
      medico: 'Dr. Ana & Filhos',
      crm: '98.765',
      ufCrm: 'SP',
      exames: [{ data: '2026-09-28', procedimento: '0295' }],
    });
    expect(xml).toContain(
      'xmlns="http://www.esocial.gov.br/schema/evt/evtMonit/v_S_01_03_00"',
    );
    expect(xml).toContain(
      '<ideEmpregador><tpInsc>1</tpInsc><nrInsc>11222333</nrInsc></ideEmpregador>',
    );
    expect(xml).toContain('<tpExameOcup>1</tpExameOcup>');
    expect(xml).toContain('<resAso>1</resAso>');
    expect(xml).toContain(
      '<exame><dtExm>2026-09-28</dtExm><procRealizado>0295</procRealizado></exame>',
    );
    expect(xml).toContain(
      '<nmMed>Dr. Ana &amp; Filhos</nmMed><nrCRM>98765</nrCRM>',
    );
    expect(xml).toContain('<respMonit><nmResp>Dra. Helena Costa</nmResp>');
  });
});

describe('S-2210', () => {
  it('local no estabelecimento leva a inscrição; afastamento vai em houveAfast e indAfast', () => {
    const cat: DadosDaCat = {
      acidentadoId: '0190',
      tpAcid: 1,
      hrAcid: '0930',
      hrsTrab: '0300',
      tpLocal: 1,
      dscLocal: 'Linha 2',
      dscLograd: 'Rua das Prensas',
      nrLograd: '100',
      codMunic: '3550308',
      uf: 'SP',
      codSitGeradora: '200004300',
      codParteAting: '753030000',
      lateralidade: 2,
      codAgntCausador: '302010300',
      indCatObito: 'N',
      dtObito: null,
      indComunPolicia: 'N',
      dtAtendimento: '2026-10-10',
      hrAtendimento: '1015',
      indInternacao: 'N',
      durTrat: 15,
      dscLesao: '702000000',
      codCID: 'S610',
      nmEmit: 'Dr. Rui',
      ideOC: 1,
      nrOC: '4567',
      ufOC: 'SP',
    };
    const xml = xmlS2210(
      config,
      'ID2',
      vinculo,
      { data: '2026-10-10', houveAfastamento: true },
      cat,
    );
    expect(xml).toContain('<evtCAT Id="ID2">');
    expect(xml).toContain('<houveAfast>S</houveAfast>');
    expect(xml).toContain(
      '<ideLocalAcid><tpInsc>1</tpInsc><nrInsc>11222333000181</nrInsc></ideLocalAcid>',
    );
    expect(xml).toContain(
      '<indAfast>S</indAfast><dscLesao>702000000</dscLesao><codCID>S610</codCID>',
    );
    expect(xml).not.toContain('dtObito');
  });
});

describe('S-2240', () => {
  it('sem agente nocivo informa 09.01.001; com agente, avaliação, EPI pelo CA e declaração', () => {
    const sem = xmlS2240(
      config,
      'ID3',
      vinculo,
      {
        inicio: '2024-03-01',
        setor: 'Escritório',
        atividades: 'Rotinas administrativas',
      },
      [],
      [],
    );
    expect(sem).toContain('<agNoc><codAgNoc>09.01.001</codAgNoc></agNoc>');
    const com = xmlS2240(
      config,
      'ID4',
      vinculo,
      {
        inicio: '2024-03-01',
        setor: 'Prensas',
        atividades: 'Operar prensa excêntrica',
      },
      [
        {
          perigo: 'Ruído contínuo',
          controles: 'Enclausuramento',
          dados: {
            codAgNoc: '02.01.001',
            tpAval: 1,
            intConc: 92,
            limTol: 85,
            unMed: 1,
            tecMedicao: 'NHO 01',
          },
        },
      ],
      ['5745'],
    );
    expect(com).toContain(
      '<codAgNoc>02.01.001</codAgNoc><dscAgNoc>Ruído contínuo</dscAgNoc><tpAval>1</tpAval><intConc>92</intConc><limTol>85</limTol><unMed>1</unMed><tecMedicao>NHO 01</tecMedicao>',
    );
    expect(com).toContain(
      '<utilizEPC>2</utilizEPC><eficEpc>S</eficEpc><utilizEPI>2</utilizEPI><eficEpi>S</eficEpi><epi><docAval>5745</docAval></epi>',
    );
    expect(com).toContain(
      '<respReg><cpfResp>52998224725</cpfResp><ideOC>4</ideOC><nrOC>5061234567</nrOC><ufOC>SP</ufOC></respReg>',
    );
  });
});
