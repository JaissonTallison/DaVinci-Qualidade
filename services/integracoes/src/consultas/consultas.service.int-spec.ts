import { eq } from 'drizzle-orm';
import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import type { ErroPadrao } from '@davinci/types';
import * as schema from '../db/schema.js';
import { consultasCache } from '../db/schema.js';
import { ConsultasService, VALIDADE } from './consultas.service.js';
import type { Buscar } from './fontes.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;

/** "Internet" falsa: cada URL responde o que o teste mandar; registra as chamadas. */
const rede = {
  chamadas: [] as string[],
  respostas: new Map<string, () => Response>(),
};
const buscar: Buscar = async (url) => {
  const u =
    url instanceof Request ? url.url : url instanceof URL ? url.href : url;
  rede.chamadas.push(u);
  const r = [...rede.respostas].find(([prefixo]) => u.startsWith(prefixo))?.[1];
  if (!r) throw new TypeError('fetch failed (sem rede)');
  return r();
};
const json =
  (corpo: unknown, status = 200) =>
  () =>
    new Response(JSON.stringify(corpo), {
      status,
      headers: { 'content-type': 'application/json' },
    });

const RECEITA = {
  cnpj: '19131243000197',
  razao_social: 'OPEN KNOWLEDGE BRASIL',
  nome_fantasia: 'REDE PELO CONHECIMENTO LIVRE',
  situacao_cadastral: 2,
  data_inicio_atividade: '2013-10-03',
  natureza_juridica: 'Associação Privada',
  codigo_porte: 5,
  opcao_pelo_simples: null,
  opcao_pelo_mei: null,
  cnae_fiscal: 9430800,
  cnaes_secundarios: [{ codigo: 9493600 }, { codigo: 0 }],
  email: 'CONTATO@OK.ORG.BR',
  ddd_telefone_1: '1123851939',
  cep: '01311902',
  descricao_tipo_de_logradouro: 'AVENIDA',
  logradouro: 'PAULISTA 37',
  numero: '37',
  complemento: 'ANDAR 4',
  bairro: 'BELA VISTA',
  municipio: 'SAO PAULO',
  uf: 'SP',
  codigo_municipio_ibge: 3550308,
  identificador_matriz_filial: 1,
  qsa: [{ nome_socio: 'FULANO DE TAL' }],
};
const CEP = {
  cep: '01311902',
  state: 'SP',
  city: 'São Paulo',
  neighborhood: 'Bela Vista',
  street: 'Avenida Paulista',
  ibge: { city: '3550308' },
};

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}

let servico: ConsultasService;

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new ConsultasService(banco.db, buscar);
});

afterAll(async () => {
  await banco?.encerrar();
});

beforeEach(() => {
  rede.chamadas = [];
  rede.respostas.clear();
});

describe('CNPJ', () => {
  it('traduz a Receita para o vocabulário do DaVinci, com grafia do CEP e sem quadro de sócios', async () => {
    rede.respostas.set('https://brasilapi.com.br/api/cnpj/', json(RECEITA));
    rede.respostas.set('https://brasilapi.com.br/api/cep/', json(CEP));
    const r = await servico.cnpj({ cnpj: '19.131.243/0001-97' });
    expect(r).toMatchObject({
      razaoSocial: 'OPEN KNOWLEDGE BRASIL',
      situacaoCadastral: 'ativa',
      situacaoDesde: null,
      porte: 'demais',
      regimeTributario: null,
      cnaePrincipal: '9430800',
      cnaesSecundarios: ['9493600'],
      email: 'contato@ok.org.br',
      telefone: '1123851939',
      matriz: true,
      fonte: 'BrasilAPI',
      endereco: {
        cep: '01311902',
        logradouro: 'Avenida Paulista',
        numero: '37',
        complemento: 'ANDAR 4',
        cidade: 'São Paulo',
        codigoMunicipio: '3550308',
      },
    });
    const [guardado] = await banco.db
      .select()
      .from(consultasCache)
      .where(eq(consultasCache.chave, '19131243000197'));
    expect(JSON.stringify(guardado!.dados)).not.toContain('FULANO');
  });

  it('a segunda consulta vem do cache, sem ir à internet', async () => {
    const r = await servico.cnpj({ cnpj: '19131243000197' });
    expect(r.razaoSocial).toBe('OPEN KNOWLEDGE BRASIL');
    expect(rede.chamadas).toEqual([]);
  });

  it('fonte principal fora do ar: usa a reserva', async () => {
    await banco.db
      .update(consultasCache)
      .set({ consultadoEm: new Date(Date.now() - VALIDADE.cnpj - 1000) })
      .where(eq(consultasCache.tipo, 'cnpj'));
    rede.respostas.set(
      'https://brasilapi.com.br/api/cnpj/',
      json({ message: 'erro' }, 502),
    );
    rede.respostas.set(
      'https://minhareceita.org/',
      json({
        ...RECEITA,
        situacao_cadastral: 8,
        data_situacao_cadastral: '2020-05-01',
      }),
    );
    const r = await servico.cnpj({ cnpj: '19131243000197' });
    expect(r).toMatchObject({
      fonte: 'Minha Receita',
      situacaoCadastral: 'baixada',
      situacaoDesde: '2020-05-01',
    });
  });

  it('todas as fontes fora do ar: devolve a consulta guardada (antiga) em vez de falhar', async () => {
    await banco.db
      .update(consultasCache)
      .set({ consultadoEm: new Date(Date.now() - VALIDADE.cnpj - 1000) })
      .where(eq(consultasCache.tipo, 'cnpj'));
    const r = await servico.cnpj({ cnpj: '19131243000197' });
    expect(r.fonte).toBe('Minha Receita');
    expect(rede.chamadas).toHaveLength(2);
  });

  it('sem cache e sem fontes: mensagem clara para preencher à mão', async () => {
    expect(
      await recusa(servico.cnpj({ cnpj: '11.444.777/0001-61' })),
    ).toMatchObject({
      codigo: 'SERVICO_INDISPONIVEL',
      mensagem:
        'Não foi possível consultar a Receita agora. Preencha à mão ou tente de novo em instantes.',
    });
  });

  it('não encontrado: avisa e guarda a resposta (por menos tempo)', async () => {
    rede.respostas.set(
      'https://brasilapi.com.br/api/cnpj/',
      json({ message: 'CNPJ não encontrado' }, 404),
    );
    expect(
      (await recusa(servico.cnpj({ cnpj: '11.444.777/0001-61' }))).codigo,
    ).toBe('NAO_ENCONTRADO');
    rede.chamadas = [];
    expect(
      (await recusa(servico.cnpj({ cnpj: '11.444.777/0001-61' }))).codigo,
    ).toBe('NAO_ENCONTRADO');
    expect(rede.chamadas).toEqual([]);
  });

  it('CNPJ inválido nem sai do sistema; alfanumérico avisa que a consulta pública não cobre', async () => {
    expect(
      (await recusa(servico.cnpj({ cnpj: '11.111.111/1111-11' }))).codigo,
    ).toBe('DADOS_INVALIDOS');
    expect(
      (await recusa(servico.cnpj({ cnpj: '12.ABC.345/01DE-35' }))).mensagem,
    ).toContain('alfanumérico');
    expect(rede.chamadas).toEqual([]);
  });

  it('MEI e Simples viram o regime tributário', async () => {
    rede.respostas.set(
      'https://brasilapi.com.br/api/cnpj/',
      json({
        ...RECEITA,
        cnpj: '45997418000153',
        opcao_pelo_mei: true,
        opcao_pelo_simples: true,
      }),
    );
    expect(await servico.cnpj({ cnpj: '45997418000153' })).toMatchObject({
      regimeTributario: 'mei',
      porte: 'mei',
    });
  });
});

describe('CEP', () => {
  it('BrasilAPI fora: usa o ViaCEP', async () => {
    rede.respostas.set(
      'https://viacep.com.br/',
      json({
        logradouro: 'Avenida Afonso Pena',
        bairro: 'Centro',
        localidade: 'Belo Horizonte',
        uf: 'MG',
        ibge: '3106200',
      }),
    );
    expect(await servico.cep({ cep: '30130-000' })).toMatchObject({
      cidade: 'Belo Horizonte',
      uf: 'MG',
      codigoMunicipio: '3106200',
      fonte: 'ViaCEP',
    });
  });

  it('CEP inexistente (ViaCEP responde erro) e CEP mal digitado', async () => {
    rede.respostas.set(
      'https://brasilapi.com.br/api/cep/',
      json({ message: 'não encontrado' }, 404),
    );
    expect((await recusa(servico.cep({ cep: '99999-998' }))).mensagem).toBe(
      'CEP não encontrado. Confira os números ou preencha o endereço à mão.',
    );
    expect((await recusa(servico.cep({ cep: '123' }))).codigo).toBe(
      'DADOS_INVALIDOS',
    );
  });
});
