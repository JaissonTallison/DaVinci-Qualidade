import { criarBancoDeTeste } from '@davinci/database/teste';
import { ErroDeNegocio } from '@davinci/shared';
import { uuidv7, type Contexto, type ErroPadrao } from '@davinci/types';
import * as schema from '../db/schema.js';
import { empresas, estabelecimentos } from '../db/schema.js';
import { EmpresaService, conferirImagem } from './empresa.service.js';

let banco: Awaited<ReturnType<typeof criarBancoDeTeste<typeof schema>>>;
let servico: EmpresaService;
const ids = { alfa: uuidv7(), beta: uuidv7() };
const ctx = (empresaId = ids.alfa): Contexto => ({
  empresaId,
  usuarioId: uuidv7(),
  rastreioId: uuidv7(),
});

async function recusa(p: Promise<unknown>): Promise<ErroPadrao> {
  const e = await p.then(
    () => expect.unreachable('era esperada uma recusa'),
    (x: unknown) => x,
  );
  expect(e).toBeInstanceOf(ErroDeNegocio);
  return (e as ErroDeNegocio).getError() as ErroPadrao;
}

const PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da63f8ffff3f0005fe02fea7d6a4f00000000049454e44ae426082',
  'hex',
);

beforeAll(async () => {
  banco = await criarBancoDeTeste(schema);
  servico = new EmpresaService(banco.db);
  await banco.db.insert(empresas).values([
    { id: ids.alfa, cnpj: '11222333000181', razaoSocial: 'Alfa Ltda.' },
    { id: ids.beta, cnpj: '11444777000161', razaoSocial: 'Beta S.A.' },
  ]);
  await banco.db.insert(estabelecimentos).values([
    {
      empresaId: ids.alfa,
      tipo: 'matriz',
      cnpj: '11222333000181',
      nome: 'Matriz',
      razaoSocial: 'Alfa Ltda.',
      indicadorIE: 'nao_contribuinte',
    },
    {
      empresaId: ids.beta,
      tipo: 'matriz',
      cnpj: '11444777000161',
      nome: 'Matriz',
      razaoSocial: 'Beta S.A.',
      indicadorIE: 'nao_contribuinte',
    },
  ]);
});

afterAll(async () => {
  await banco?.encerrar();
});

describe('dados da empresa', () => {
  it('obtém a empresa com a matriz primeiro; atualiza nome, regime e contato com a versão', async () => {
    const e = await servico.obter(ctx());
    expect(e).toMatchObject({
      nome: 'Alfa Ltda.',
      logoVersao: null,
      estabelecimentos: [{ tipo: 'matriz', cnpj: '11222333000181' }],
    });
    const nova = await servico.atualizar(ctx(), {
      nome: 'Grupo Alfa',
      regimeTributario: 'simples',
      telefone: '(11) 3456-7890',
      versao: e.versao,
    });
    expect(nova).toMatchObject({
      nome: 'Grupo Alfa',
      regimeTributario: 'simples',
      telefone: '1134567890',
    });
    expect(
      (
        await recusa(
          servico.atualizar(ctx(), { nome: 'Outro', versao: e.versao }),
        )
      ).codigo,
    ).toBe('CONFLITO');
  });
});

describe('estabelecimentos', () => {
  const filial = {
    cnpj: '11.222.333/0002-62',
    nome: 'Loja Campinas',
    razaoSocial: 'Alfa Ltda.',
    inscricaoEstadual: '244.123.456.110',
    cnaePrincipal: '4721-1/02',
    endereco: {
      cep: '13010-000',
      logradouro: 'Rua Barão de Jaguara',
      numero: '100',
      bairro: 'Centro',
      cidade: 'Campinas',
      uf: 'SP',
    },
  };

  it('cria filial com endereço e atividade; aparece depois da matriz', async () => {
    const f = await servico.criarEstabelecimento(ctx(), filial);
    expect(f).toMatchObject({
      tipo: 'filial',
      cnpj: '11222333000262',
      cnaePrincipal: '4721102',
      endereco: { cidade: 'Campinas', cep: '13010000' },
    });
    expect(
      (await servico.obter(ctx())).estabelecimentos.map((e) => e.nome),
    ).toEqual(['Matriz', 'Loja Campinas']);
  });

  it('CNPJ repetido: diz qual estabelecimento (se for desta empresa) e não revela outra empresa', async () => {
    expect(
      (await recusa(servico.criarEstabelecimento(ctx(), filial))).mensagem,
    ).toBe('Este CNPJ já é do estabelecimento "Loja Campinas".');
    expect(
      (
        await recusa(
          servico.criarEstabelecimento(ctx(), {
            ...filial,
            cnpj: '11.444.777/0001-61',
          }),
        )
      ).mensagem,
    ).toBe('Este CNPJ já está cadastrado em outra empresa do sistema.');
  });

  it('alterar a matriz atualiza o CNPJ e a razão social da empresa', async () => {
    const matriz = (await servico.obter(ctx())).estabelecimentos.find(
      (e) => e.tipo === 'matriz',
    )!;
    await servico.atualizarEstabelecimento(ctx(), {
      ...filial,
      id: matriz.id,
      cnpj: '11222333000181',
      nome: 'Matriz',
      razaoSocial: 'Alfa Comércio Ltda.',
      versao: matriz.versao,
    });
    const [e] = await banco.db
      .select()
      .from(empresas)
      .where((await import('drizzle-orm')).eq(empresas.id, ids.alfa));
    expect(e!.razaoSocial).toBe('Alfa Comércio Ltda.');
  });

  it('matriz não inativa; filial inativa com motivo e reativa', async () => {
    const lista = (await servico.obter(ctx())).estabelecimentos;
    const matriz = lista.find((e) => e.tipo === 'matriz')!;
    const loja = lista.find((e) => e.tipo === 'filial')!;
    expect(
      (
        await recusa(
          servico.inativarEstabelecimento(ctx(), {
            id: matriz.id,
            versao: matriz.versao,
            motivo: 'x',
          }),
        )
      ).mensagem,
    ).toBe('A matriz não pode ser inativada.');
    expect(
      (
        await recusa(
          servico.inativarEstabelecimento(ctx(), {
            id: loja.id,
            versao: loja.versao,
          }),
        )
      ).detalhes,
    ).toEqual([
      { campo: 'motivo', mensagem: 'Informe o motivo (ex.: filial fechada).' },
    ]);
    const inativa = await servico.inativarEstabelecimento(ctx(), {
      id: loja.id,
      versao: loja.versao,
      motivo: 'Loja fechada',
    });
    expect(inativa).toMatchObject({
      ativo: false,
      motivoInativacao: 'Loja fechada',
    });
    expect(
      (
        await servico.reativarEstabelecimento(ctx(), {
          id: loja.id,
          versao: inativa.versao,
        })
      ).ativo,
    ).toBe(true);
  });

  it('uma empresa não vê nem altera estabelecimento de outra', async () => {
    const loja = (await servico.obter(ctx())).estabelecimentos.find(
      (e) => e.tipo === 'filial',
    )!;
    expect((await servico.obter(ctx(ids.beta))).estabelecimentos).toHaveLength(
      1,
    );
    expect(
      (
        await recusa(
          servico.atualizarEstabelecimento(ctx(ids.beta), {
            ...filial,
            id: loja.id,
            versao: loja.versao,
          }),
        )
      ).codigo,
    ).toBe('NAO_ENCONTRADO');
  });
});

describe('logo', () => {
  it('salva PNG verdadeiro, devolve e remove; versão muda a cada troca', async () => {
    const { logoVersao } = await servico.salvarLogo(ctx(), {
      tipo: 'image/png',
      base64: PNG.toString('base64'),
    });
    expect((await servico.obter(ctx())).logoVersao).toBe(logoVersao);
    expect(await servico.obterLogo(ctx())).toEqual({
      tipo: 'image/png',
      base64: PNG.toString('base64'),
    });
    await servico.removerLogo(ctx());
    expect((await recusa(servico.obterLogo(ctx()))).codigo).toBe(
      'NAO_ENCONTRADO',
    );
  });

  it('confere o conteúdo: "PNG" que não é PNG e SVG com script são recusados', async () => {
    expect(
      (
        await recusa(
          servico.salvarLogo(ctx(), {
            tipo: 'image/png',
            base64: Buffer.from('não sou png').toString('base64'),
          }),
        )
      ).mensagem,
    ).toBe('O arquivo não é um PNG válido.');
    const malicioso =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
    expect(
      (
        await recusa(
          servico.salvarLogo(ctx(), {
            tipo: 'image/svg+xml',
            base64: Buffer.from(malicioso).toString('base64'),
          }),
        )
      ).mensagem,
    ).toContain('scripts ou links externos');
    expect(
      conferirImagem('image/svg+xml', Buffer.from('<svg onload="x()"></svg>')),
    ).not.toBeNull();
    expect(
      conferirImagem(
        'image/svg+xml',
        Buffer.from(
          '<svg viewBox="0 0 10 10"><use href="#a"/><circle r="4"/></svg>',
        ),
      ),
    ).toBeNull();
  });
});
