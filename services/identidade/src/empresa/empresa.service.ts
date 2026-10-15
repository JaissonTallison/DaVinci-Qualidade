import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, ne, sql } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarEstabelecimentoSchema,
  dadosDaEmpresaSchema,
  estabelecimentoSchema,
  formatarDocumento,
  isUuid,
  logoSchema,
  situacaoDoEstabelecimentoSchema,
  TAMANHO_MAXIMO_LOGO,
  type Contexto,
  type DadosDaEmpresa,
  type Estabelecimento,
  type Logo,
  recursosEfetivos,
  salvarRecursosSchema,
  type Recurso,
  type RecursosDaEmpresa,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { empresas, estabelecimentos } from '../db/schema.js';

type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type LinhaEstab = typeof estabelecimentos.$inferSelect;
type DadosEstab = ReturnType<typeof estabelecimentoSchema.parse>;

const ALTERADO =
  'Estes dados foram alterados por outra pessoa. Recarregue para ver a versão atual.';
const idDe = (dados: unknown): unknown =>
  (dados as { id?: unknown } | null)?.id;

/** Confere o CONTEÚDO da imagem (não confia no tipo declarado). SVG com script ou link externo é recusado. */
export function conferirImagem(
  tipo: Logo['tipo'],
  bytes: Buffer,
): string | null {
  if (bytes.length === 0) return 'Escolha uma imagem.';
  if (bytes.length > TAMANHO_MAXIMO_LOGO)
    return 'A imagem passa de 500 KB. Reduza o tamanho e tente de novo.';
  if (tipo === 'image/png')
    return bytes
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
      ? null
      : 'O arquivo não é um PNG válido.';
  if (tipo === 'image/jpeg')
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff
      ? null
      : 'O arquivo não é um JPG válido.';
  const svg = bytes.toString('utf8');
  if (!/<svg[\s>]/i.test(svg)) return 'O arquivo não é um SVG válido.';
  if (
    /<script|<foreignObject|\son[a-z]+\s*=|javascript:|<!ENTITY|xlink:href\s*=\s*["']?(?!#)|href\s*=\s*["']?(https?:|\/\/)/i.test(
      svg,
    )
  ) {
    return 'Este SVG contém scripts ou links externos e não pode ser usado. Exporte a logo como PNG ou como SVG simples.';
  }
  return null;
}

function paraEstabelecimento(l: LinhaEstab): Estabelecimento {
  return {
    id: l.id,
    tipo: l.tipo as Estabelecimento['tipo'],
    cnpj: l.cnpj,
    nome: l.nome,
    razaoSocial: l.razaoSocial,
    nomeFantasia: l.nomeFantasia,
    indicadorIE: l.indicadorIE as Estabelecimento['indicadorIE'],
    inscricaoEstadual: l.inscricaoEstadual,
    inscricaoMunicipal: l.inscricaoMunicipal,
    cnaePrincipal: l.cnaePrincipal,
    cnaesSecundarios: l.cnaesSecundarios,
    situacaoCadastral:
      l.situacaoCadastral as Estabelecimento['situacaoCadastral'],
    dataAbertura: l.dataAbertura,
    endereco:
      l.cep && l.logradouro && l.numero && l.bairro && l.cidade && l.uf
        ? {
            tipo: 'principal',
            cep: l.cep,
            logradouro: l.logradouro,
            numero: l.numero,
            complemento: l.complemento,
            bairro: l.bairro,
            cidade: l.cidade,
            uf: l.uf as never,
            codigoMunicipio: l.codigoMunicipio,
          }
        : null,
    telefone: l.telefone,
    email: l.email,
    ativo: l.ativo,
    motivoInativacao: l.motivoInativacao,
    versao: l.atualizadoEm.toISOString(),
  };
}

function colunasEstab(d: DadosEstab) {
  const e = d.endereco;
  return {
    cnpj: d.cnpj,
    nome: d.nome,
    razaoSocial: d.razaoSocial,
    nomeFantasia: d.nomeFantasia,
    indicadorIE: d.indicadorIE,
    inscricaoEstadual:
      d.indicadorIE === 'nao_contribuinte' ? null : d.inscricaoEstadual,
    inscricaoMunicipal: d.inscricaoMunicipal,
    cnaePrincipal: d.cnaePrincipal,
    cnaesSecundarios: d.cnaesSecundarios.filter((c) => c !== d.cnaePrincipal),
    situacaoCadastral: d.situacaoCadastral,
    dataAbertura: d.dataAbertura,
    cep: e?.cep ?? null,
    logradouro: e?.logradouro ?? null,
    numero: e?.numero ?? null,
    complemento: e?.complemento ?? null,
    bairro: e?.bairro ?? null,
    cidade: e?.cidade ?? null,
    uf: e?.uf ?? null,
    codigoMunicipio: e?.codigoMunicipio ?? null,
    telefone: d.telefone,
    email: d.email,
  };
}

/** Dados da empresa (grupo), estabelecimentos e logo (docs/05-modulos/identidade.md). */
@Injectable()
export class EmpresaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- recursos (A122)

  async recursos(ctx: Contexto): Promise<RecursosDaEmpresa> {
    const [e] = await this.db
      .select({ recursos: empresas.recursos })
      .from(empresas)
      .where(eq(empresas.id, ctx.empresaId));
    if (!e)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Empresa não encontrada.');
    return {
      ligados: recursosEfetivos(e.recursos),
      escolhidos: (e.recursos as Recurso[] | null) ?? null,
    };
  }

  /** Grava a escolha ; vale para cada pessoa na próxima renovação da sessão. */
  async salvarRecursos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RecursosDaEmpresa> {
    const { recursos } = validar(salvarRecursosSchema, dados);
    await this.db
      .update(empresas)
      .set({
        recursos: recursosEfetivos(recursos),
        atualizadoPor: ctx.usuarioId,
      })
      .where(eq(empresas.id, ctx.empresaId));
    return this.recursos(ctx);
  }

  /** Liga módulos sem desligar nenhum dos que já estão ligados. */
  async ligarRecursos(
    ctx: Contexto,
    dados: unknown,
  ): Promise<RecursosDaEmpresa> {
    const { recursos } = validar(salvarRecursosSchema, dados);
    const atual = await this.recursos(ctx);
    if (atual.escolhidos === null) return atual;
    await this.db
      .update(empresas)
      .set({
        recursos: recursosEfetivos([
          ...new Set([...atual.escolhidos, ...recursos]),
        ]),
        atualizadoPor: ctx.usuarioId,
      })
      .where(eq(empresas.id, ctx.empresaId));
    return this.recursos(ctx);
  }

  async obter(ctx: Contexto): Promise<DadosDaEmpresa> {
    const [e] = await this.db
      .select({
        id: empresas.id,
        razaoSocial: empresas.razaoSocial,
        nomeFantasia: empresas.nomeFantasia,
        regimeTributario: empresas.regimeTributario,
        email: empresas.email,
        telefone: empresas.telefone,
        site: empresas.site,
        logoAtualizadaEm: empresas.logoAtualizadaEm,
        atualizadoEm: empresas.atualizadoEm,
      })
      .from(empresas)
      .where(eq(empresas.id, ctx.empresaId));
    if (!e)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Empresa não encontrada.');
    const estabs = await this.db
      .select()
      .from(estabelecimentos)
      .where(eq(estabelecimentos.empresaId, ctx.empresaId))
      .orderBy(
        sql`${estabelecimentos.tipo} = 'matriz' desc`,
        asc(estabelecimentos.nome),
      );
    return {
      id: e.id,
      nome: e.nomeFantasia ?? e.razaoSocial,
      regimeTributario:
        e.regimeTributario as DadosDaEmpresa['regimeTributario'],
      email: e.email,
      telefone: e.telefone,
      site: e.site,
      logoVersao: e.logoAtualizadaEm?.toISOString() ?? null,
      estabelecimentos: estabs.map(paraEstabelecimento),
      versao: e.atualizadoEm.toISOString(),
    };
  }

  async atualizar(ctx: Contexto, dados: unknown): Promise<DadosDaEmpresa> {
    const d = validar(dadosDaEmpresaSchema, dados);
    const lida = new Date(d.versao);
    const [linha] = Number.isNaN(lida.getTime())
      ? []
      : await this.db
          .update(empresas)
          .set({
            nomeFantasia: d.nome,
            regimeTributario: d.regimeTributario,
            email: d.email,
            telefone: d.telefone,
            site: d.site,
            atualizadoPor: ctx.usuarioId,
          })
          .where(
            and(
              eq(empresas.id, ctx.empresaId),
              eq(empresas.atualizadoEm, lida),
            ),
          )
          .returning({ id: empresas.id });
    if (!linha) throw new ErroDeNegocio('CONFLITO', ALTERADO);
    return this.obter(ctx);
  }

  // ---------------------------------------------------------------- logo

  async obterLogo(ctx: Contexto): Promise<Logo> {
    const [e] = await this.db
      .select({ logo: empresas.logo, tipo: empresas.logoTipo })
      .from(empresas)
      .where(eq(empresas.id, ctx.empresaId));
    if (!e?.logo || !e.tipo)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'A empresa ainda não tem logo.',
      );
    return { tipo: e.tipo as Logo['tipo'], base64: e.logo.toString('base64') };
  }

  async salvarLogo(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ logoVersao: string }> {
    const { tipo, base64 } = validar(logoSchema, dados);
    const bytes = Buffer.from(base64, 'base64');
    const problema = conferirImagem(tipo, bytes);
    if (problema)
      throw new ErroDeNegocio('DADOS_INVALIDOS', problema, [
        { campo: 'logo', mensagem: problema },
      ]);
    const agora = new Date();
    await this.db
      .update(empresas)
      .set({
        logo: bytes,
        logoTipo: tipo,
        logoAtualizadaEm: agora,
        atualizadoPor: ctx.usuarioId,
      })
      .where(eq(empresas.id, ctx.empresaId));
    return { logoVersao: agora.toISOString() };
  }

  async removerLogo(ctx: Contexto): Promise<{ removida: true }> {
    await this.db
      .update(empresas)
      .set({
        logo: null,
        logoTipo: null,
        logoAtualizadaEm: null,
        atualizadoPor: ctx.usuarioId,
      })
      .where(eq(empresas.id, ctx.empresaId));
    return { removida: true };
  }

  // ---------------------------------------------------------------- estabelecimentos

  async criarEstabelecimento(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Estabelecimento> {
    const d = validar(estabelecimentoSchema, dados);
    await this.recusarCnpjRepetido(ctx, d.cnpj);
    const [l] = await this.db
      .insert(estabelecimentos)
      .values({
        ...colunasEstab(d),
        empresaId: ctx.empresaId,
        tipo: 'filial',
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning();
    return paraEstabelecimento(l!);
  }

  async atualizarEstabelecimento(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Estabelecimento> {
    const d = validar(atualizarEstabelecimentoSchema, dados);
    const atual = await this.buscar(ctx, this.db, idDe(dados));
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Reative o estabelecimento para alterá-lo.',
      );
    if (d.cnpj !== atual.cnpj)
      await this.recusarCnpjRepetido(ctx, d.cnpj, atual.id);
    return this.db.transaction(async (tx) => {
      const l = await this.gravar(ctx, tx, atual.id, d.versao, colunasEstab(d));
      // A matriz é a "cara" da empresa: CNPJ e razão social acompanham
      if (l.tipo === 'matriz') {
        await tx
          .update(empresas)
          .set({
            cnpj: l.cnpj,
            razaoSocial: l.razaoSocial,
            atualizadoPor: ctx.usuarioId,
          })
          .where(eq(empresas.id, ctx.empresaId));
      }
      return paraEstabelecimento(l);
    });
  }

  async inativarEstabelecimento(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Estabelecimento> {
    const { versao, motivo } = validar(situacaoDoEstabelecimentoSchema, dados);
    const atual = await this.buscar(ctx, this.db, idDe(dados));
    if (atual.tipo === 'matriz')
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A matriz não pode ser inativada.',
      );
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este estabelecimento já está inativo.',
      );
    if (!motivo)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        [
          {
            campo: 'motivo',
            mensagem: 'Informe o motivo (ex.: filial fechada).',
          },
        ],
      );
    return paraEstabelecimento(
      await this.gravar(ctx, this.db, atual.id, versao, {
        ativo: false,
        motivoInativacao: motivo,
      }),
    );
  }

  async reativarEstabelecimento(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Estabelecimento> {
    const { versao } = validar(situacaoDoEstabelecimentoSchema, dados);
    const atual = await this.buscar(ctx, this.db, idDe(dados));
    if (atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este estabelecimento já está ativo.',
      );
    return paraEstabelecimento(
      await this.gravar(ctx, this.db, atual.id, versao, {
        ativo: true,
        motivoInativacao: null,
      }),
    );
  }

  // ---------------------------------------------------------------------------

  private async buscar(
    ctx: Contexto,
    tx: Tx | Db,
    id: unknown,
  ): Promise<LinhaEstab> {
    const [l] = isUuid(id)
      ? await tx
          .select()
          .from(estabelecimentos)
          .where(
            and(
              eq(estabelecimentos.id, id),
              eq(estabelecimentos.empresaId, ctx.empresaId),
            ),
          )
      : [];
    if (!l)
      throw new ErroDeNegocio(
        'NAO_ENCONTRADO',
        'Estabelecimento não encontrado.',
      );
    return l;
  }

  private async gravar(
    ctx: Contexto,
    tx: Tx | Db,
    id: string,
    versao: string,
    valores: Partial<typeof estabelecimentos.$inferInsert>,
  ): Promise<LinhaEstab> {
    const lida = new Date(versao);
    const [l] = Number.isNaN(lida.getTime())
      ? []
      : await tx
          .update(estabelecimentos)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(estabelecimentos.id, id),
              eq(estabelecimentos.empresaId, ctx.empresaId),
              eq(estabelecimentos.atualizadoEm, lida),
            ),
          )
          .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', ALTERADO);
    return l;
  }

  /** CNPJ é único no sistema todo. Se for de outra empresa, não diz qual (dado de outro cliente). */
  private async recusarCnpjRepetido(
    ctx: Contexto,
    cnpj: string,
    exceto?: string,
  ) {
    const [igual] = await this.db
      .select({
        id: estabelecimentos.id,
        empresaId: estabelecimentos.empresaId,
        nome: estabelecimentos.nome,
      })
      .from(estabelecimentos)
      .where(
        and(
          eq(estabelecimentos.cnpj, cnpj),
          exceto ? ne(estabelecimentos.id, exceto) : undefined,
        ),
      );
    if (!igual) return;
    const daqui = igual.empresaId === ctx.empresaId;
    throw new ErroDeNegocio(
      'CONFLITO',
      daqui
        ? `Este CNPJ já é do estabelecimento "${igual.nome}".`
        : 'Este CNPJ já está cadastrado em outra empresa do sistema.',
      [
        {
          campo: 'cnpj',
          mensagem: `CNPJ ${formatarDocumento(cnpj)} já cadastrado.`,
        },
      ],
    );
  }
}
