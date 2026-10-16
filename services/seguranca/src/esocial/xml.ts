import {
  LEIAUTE_ESOCIAL,
  SEM_AGENTE_NOCIVO,
  type ConfiguracaoEsocial,
  type DadosDaCat,
  type DadosEsocialDoRisco,
  type ExameDoAso,
  type ResultadoAso,
  type TipoAso,
} from '@davinci/types';

/**
 * Montagem dos eventos de SST no leiaute do eSocial. Funções puras: recebem os dados já conferidos e devolvem o
 * XML sem assinatura (a assinatura e a transmissão são do transmissor da empresa).
 */

const escapar = (v: string) =>
  v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** Elemento com texto; vazio ou ausente não sai (campo opcional). */
function e(nome: string, valor: string | number | null | undefined): string {
  if (valor === null || valor === undefined || valor === '') return '';
  return `<${nome}>${escapar(String(valor))}</${nome}>`;
}
/** Grupo: só sai se tiver algum filho. */
function g(nome: string, ...filhos: string[]): string {
  const corpo = filhos.join('');
  return corpo ? `<${nome}>${corpo}</${nome}>` : '';
}

/** Id do evento: "ID" + tipo de inscrição + CNPJ com 14 dígitos + AAAAMMDDHHMMSS + sequencial de 5 dígitos. */
export function idDoEvento(
  cnpj: string,
  momento: Date,
  sequencial: number,
): string {
  const brasilia = new Date(momento.getTime() - 3 * 3600_000).toISOString();
  const carimbo = brasilia.slice(0, 19).replace(/\D/g, '');
  return `ID1${cnpj.padStart(14, '0')}${carimbo}${String(sequencial % 100000).padStart(5, '0')}`;
}

function envelope(evento: string, id: string, corpo: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><eSocial xmlns="http://www.esocial.gov.br/schema/evt/${evento}/${LEIAUTE_ESOCIAL}"><${evento} Id="${id}">${corpo}</${evento}></eSocial>`;
}

function cabecalho(c: ConfiguracaoEsocial): string {
  return (
    g(
      'ideEvento',
      e('indRetif', 1),
      e('tpAmb', c.ambiente),
      e('procEmi', 1),
      e('verProc', 'DaVinci-Qualidade'),
    ) + g('ideEmpregador', e('tpInsc', 1), e('nrInsc', c.cnpj.slice(0, 8)))
  );
}

export interface Vinculo {
  cpf: string;
  matricula: string;
}

const ideVinculo = (v: Vinculo) =>
  g('ideVinculo', e('cpfTrab', v.cpf), e('matricula', v.matricula));
const dataSemHora = (d: string) => d.slice(0, 10);

// ---------------------------------------------------------------- S-2210

export function xmlS2210(
  c: ConfiguracaoEsocial,
  id: string,
  v: Vinculo,
  acidente: { data: string; houveAfastamento: boolean },
  cat: DadosDaCat,
): string {
  const corpo =
    cabecalho(c) +
    ideVinculo(v) +
    g(
      'cat',
      e('dtAcid', acidente.data),
      e('tpAcid', cat.tpAcid),
      e('hrAcid', cat.hrAcid),
      e('hrsTrab', cat.hrsTrab),
      e('tpCat', 1),
      e('indCatObito', cat.indCatObito),
      cat.indCatObito === 'S' ? e('dtObito', cat.dtObito) : '',
      e('indComunPolicia', cat.indComunPolicia),
      e('codSitGeradora', cat.codSitGeradora),
      e('iniciatCAT', 1),
      e('houveAfast', acidente.houveAfastamento ? 'S' : 'N'),
      g(
        'localAcidente',
        e('tpLocal', cat.tpLocal),
        e('dscLocal', cat.dscLocal),
        e('dscLograd', cat.dscLograd),
        e('nrLograd', cat.nrLograd),
        e('codMunic', cat.codMunic),
        e('uf', cat.uf),
        cat.tpLocal === 1
          ? g('ideLocalAcid', e('tpInsc', 1), e('nrInsc', c.cnpj))
          : '',
      ),
      g(
        'parteAtingida',
        e('codParteAting', cat.codParteAting),
        e('lateralidade', cat.lateralidade),
      ),
      g('agenteCausador', e('codAgntCausador', cat.codAgntCausador)),
      g(
        'atestado',
        e('dtAtendimento', cat.dtAtendimento),
        e('hrAtendimento', cat.hrAtendimento),
        e('indInternacao', cat.indInternacao),
        e('durTrat', cat.durTrat),
        e('indAfast', acidente.houveAfastamento ? 'S' : 'N'),
        e('dscLesao', cat.dscLesao),
        e('codCID', cat.codCID),
        g(
          'emitente',
          e('nmEmit', cat.nmEmit),
          e('ideOC', cat.ideOC),
          e('nrOC', cat.nrOC),
          e('ufOC', cat.ufOC),
        ),
      ),
    );
  return envelope('evtCAT', id, corpo);
}

// ---------------------------------------------------------------- S-2220

const TIPO_DO_EXAME: Record<TipoAso, number> = {
  admissional: 0,
  periodico: 1,
  retorno_ao_trabalho: 2,
  mudanca_de_risco: 3,
  demissional: 9,
};
const RESULTADO: Record<ResultadoAso, number> = {
  apto: 1,
  apto_com_restricao: 1,
  inapto: 2,
};

export function xmlS2220(
  c: ConfiguracaoEsocial,
  id: string,
  v: Vinculo,
  aso: {
    tipo: TipoAso;
    data: string;
    resultado: ResultadoAso;
    medico: string;
    crm: string;
    ufCrm: string;
    exames: ExameDoAso[];
  },
): string {
  const corpo =
    cabecalho(c) +
    ideVinculo(v) +
    g(
      'exMedOcup',
      e('tpExameOcup', TIPO_DO_EXAME[aso.tipo]),
      g(
        'aso',
        e('dtAso', aso.data),
        e('resAso', RESULTADO[aso.resultado]),
        aso.exames
          .map((x) =>
            g('exame', e('dtExm', x.data), e('procRealizado', x.procedimento)),
          )
          .join(''),
        g(
          'medico',
          e('nmMed', aso.medico),
          e('nrCRM', aso.crm.replace(/\D/g, '')),
          e('ufCRM', aso.ufCrm),
        ),
      ),
      g(
        'respMonit',
        e('cpfResp', c.medicoCpf),
        e('nmResp', c.medicoNome),
        e('nrCRM', c.medicoCrm),
        e('ufCRM', c.medicoUf),
      ),
    );
  return envelope('evtMonit', id, corpo);
}

// ---------------------------------------------------------------- S-2240

export interface RiscoNoS2240 {
  perigo: string;
  controles: string | null;
  dados: DadosEsocialDoRisco;
}

export function xmlS2240(
  c: ConfiguracaoEsocial,
  id: string,
  v: Vinculo,
  t: { inicio: string; setor: string; atividades: string },
  riscos: RiscoNoS2240[],
  cas: string[],
): string {
  const nocivos = riscos.filter((r) => r.dados.codAgNoc !== SEM_AGENTE_NOCIVO);
  const agentes = nocivos.length
    ? nocivos
        .map((r) =>
          g(
            'agNoc',
            e('codAgNoc', r.dados.codAgNoc),
            e('dscAgNoc', r.perigo.slice(0, 100)),
            e('tpAval', r.dados.tpAval),
            r.dados.tpAval === 1 ? e('intConc', r.dados.intConc) : '',
            r.dados.tpAval === 1 ? e('limTol', r.dados.limTol) : '',
            r.dados.tpAval === 1 ? e('unMed', r.dados.unMed) : '',
            r.dados.tpAval === 1 ? e('tecMedicao', r.dados.tecMedicao) : '',
            g(
              'epcEpi',
              e('utilizEPC', r.controles ? 2 : 1),
              r.controles ? e('eficEpc', 'S') : '',
              e('utilizEPI', cas.length ? 2 : 1),
              cas.length ? e('eficEpi', 'S') : '',
              cas.map((ca) => g('epi', e('docAval', ca))).join(''),
              cas.length
                ? g(
                    'epiCompl',
                    e('medProtecao', c.epiDeclaracao.medProtecao),
                    e('condFuncto', c.epiDeclaracao.condFuncto),
                    e('usoInint', c.epiDeclaracao.usoInint),
                    e('przValid', c.epiDeclaracao.przValid),
                    e('periodicTroca', c.epiDeclaracao.periodicTroca),
                    e('higienizacao', c.epiDeclaracao.higienizacao),
                  )
                : '',
            ),
          ),
        )
        .join('')
    : g('agNoc', e('codAgNoc', SEM_AGENTE_NOCIVO));
  const corpo =
    cabecalho(c) +
    ideVinculo(v) +
    g(
      'infoExpRisco',
      e('dtIniCondicao', dataSemHora(t.inicio)),
      g(
        'infoAmb',
        e('localAmb', 1),
        e('dscSetor', t.setor.slice(0, 100)),
        e('tpInsc', 1),
        e('nrInsc', c.cnpj),
      ),
      g('infoAtiv', e('dscAtivDes', t.atividades.slice(0, 999))),
      agentes,
      g(
        'respReg',
        e('cpfResp', c.ambientalCpf),
        e('ideOC', c.ambientalOrgao),
        c.ambientalOrgao === 9 ? e('dscOC', 'Conselho profissional') : '',
        e('nrOC', c.ambientalNumero),
        e('ufOC', c.ambientalUf),
      ),
    );
  return envelope('evtExpRisco', id, corpo);
}
