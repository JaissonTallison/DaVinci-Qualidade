import { Inject, Injectable } from '@nestjs/common';
import {
  and,
  asc,
  count,
  eq,
  ilike,
  inArray,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';
import { DATABASE, type Database, violacaoUnica } from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarParceiroSchema,
  filtroParceirosSchema,
  formatarCnae,
  formatarDocumento,
  inativarParceiroSchema,
  isUuid,
  normalizarDocumento,
  importacaoSchema,
  type ResultadoDaImportacaoPlanilha,
  novoParceiroSchema,
  reativarParceiroSchema,
  type AtividadeCnae,
  type Contexto,
  type Pagina,
  type Papel,
  type Parceiro,
  type ParceiroResumo,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import {
  bancos,
  cnaes,
  parceiroChavesPix,
  parceiroContasBancarias,
  parceiroContatos,
  parceiroEnderecos,
  parceiros,
  sequencias,
  setores,
} from '../db/schema.js';

type Linha = typeof parceiros.$inferSelect;
type Db = Database<typeof schema>;
type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];
type Dados = ReturnType<typeof novoParceiroSchema.parse>;

const NAO_ENCONTRADO = 'Parceiro não encontrado.';
const ALTERADO_POR_OUTRA_PESSOA =
  'Este cadastro foi alterado por outra pessoa. Recarregue para ver a versão atual.';
const NOME_DOCUMENTO = { PJ: 'CNPJ', PF: 'CPF', EX: 'documento' } as const;

/** Campos simples do formulário → colunas do parceiro (as listas vão para tabelas próprias). */
function paraColunas(d: Dados) {
  return {
    tipoPessoa: d.tipoPessoa,
    documento: d.documento,
    nome: d.nome,
    nomeFantasia: d.nomeFantasia,
    papeis: d.papeis,
    rg: d.tipoPessoa === 'PF' ? d.rg : null,
    rgOrgao: d.tipoPessoa === 'PF' ? d.rgOrgao : null,
    nascimento: d.tipoPessoa === 'PF' ? d.nascimento : null,
    pais: d.tipoPessoa === 'EX' ? d.pais : null,
    cnaePrincipal: d.cnaePrincipal,
    cnaesSecundarios: d.cnaesSecundarios.filter((c) => c !== d.cnaePrincipal),
    situacaoCadastral: d.situacaoCadastral,
    dataAbertura: d.dataAbertura,
    naturezaJuridica: d.naturezaJuridica,
    porte: d.porte,
    indicadorIE: d.indicadorIE,
    inscricaoEstadual: d.inscricaoEstadual,
    inscricaoMunicipal: d.inscricaoMunicipal,
    suframa: d.suframa,
    regimeTributario: d.regimeTributario,
    consumidorFinal: d.consumidorFinal,
    retemIss: d.retencoes.iss,
    retemIr: d.retencoes.ir,
    retemPis: d.retencoes.pis,
    retemCofins: d.retencoes.cofins,
    retemCsll: d.retencoes.csll,
    retemInss: d.retencoes.inss,
    email: d.email,
    telefone: d.telefone,
    site: d.site,
    emailCobranca: d.emailCobranca,
    emailNfe: d.emailNfe,
    limiteCredito: d.limiteCredito,
    formaPagamento: d.formaPagamento,
    condicaoPagamentoId: d.condicaoPagamentoId,
    contaReceitaId: d.contaReceitaId,
    contaDespesaId: d.contaDespesaId,
    bloqueado: d.bloqueado,
    motivoBloqueio: d.bloqueado ? d.motivoBloqueio : null,
    etiquetas: d.etiquetas,
    origem: d.origem,
    observacoes: d.observacoes,
  };
}

function exigirId(id: unknown): string {
  if (!isUuid(id)) throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO);
  return id;
}

@Injectable()
export class ParceirosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(ctx: Contexto, dados: unknown): Promise<Pagina<ParceiroResumo>> {
    const f = validar(filtroParceirosSchema, dados ?? {});
    const condicoes: SQL[] = [eq(parceiros.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      condicoes.push(eq(parceiros.ativo, f.situacao === 'ativos'));
    if (f.papel) condicoes.push(sql`${f.papel} = ANY(${parceiros.papeis})`);
    if (f.etiqueta)
      condicoes.push(sql`${f.etiqueta} = ANY(${parceiros.etiquetas})`);
    if (f.setor) condicoes.push(eq(cnaes.setor, f.setor));
    if (f.uf) condicoes.push(eq(parceiroEnderecos.uf, f.uf));
    if (f.busca) {
      const termo = `%${f.busca}%`;
      const busca: SQL[] = [
        sql`unaccent(${parceiros.nome}) ILIKE unaccent(${termo})`,
        sql`unaccent(coalesce(${parceiros.nomeFantasia}, '')) ILIKE unaccent(${termo})`,
        sql`unaccent(coalesce(${parceiroEnderecos.cidade}, '')) ILIKE unaccent(${termo})`,
      ];
      const doc = normalizarDocumento(f.busca);
      if (doc.length >= 3) busca.push(ilike(parceiros.documento, `%${doc}%`));
      if (/^\d{1,9}$/.test(f.busca))
        busca.push(eq(parceiros.codigo, Number(f.busca)));
      condicoes.push(or(...busca)!);
    }
    const onde = and(...condicoes);
    // Endereço principal e setor (pela atividade principal) entram na linha da lista
    const principal = and(
      eq(parceiroEnderecos.parceiroId, parceiros.id),
      eq(parceiroEnderecos.tipo, 'principal'),
    );
    const [linhas, [{ total }]] = await Promise.all([
      this.db
        .select({
          p: parceiros,
          cidade: parceiroEnderecos.cidade,
          uf: parceiroEnderecos.uf,
          setorId: setores.id,
          setorNome: setores.nome,
        })
        .from(parceiros)
        .leftJoin(parceiroEnderecos, principal)
        .leftJoin(cnaes, eq(cnaes.codigo, parceiros.cnaePrincipal))
        .leftJoin(setores, eq(setores.id, cnaes.setor))
        .where(onde)
        .orderBy(asc(parceiros.nome), asc(parceiros.codigo))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db
        .select({ total: count() })
        .from(parceiros)
        .leftJoin(parceiroEnderecos, principal)
        .leftJoin(cnaes, eq(cnaes.codigo, parceiros.cnaePrincipal))
        .where(onde),
    ]);
    return {
      itens: linhas.map(({ p, cidade, uf, setorId, setorNome }) => ({
        id: p.id,
        codigo: p.codigo,
        tipoPessoa: p.tipoPessoa,
        documento: p.documento,
        nome: p.nome,
        nomeFantasia: p.nomeFantasia,
        papeis: p.papeis as Papel[],
        setor: setorId ? { id: setorId, nome: setorNome! } : null,
        cidade,
        uf,
        etiquetas: p.etiquetas,
        bloqueado: p.bloqueado,
        ativo: p.ativo,
      })),
      total: Number(total),
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Parceiro> {
    return this.montar(
      ctx,
      this.db,
      await this.buscar(ctx, this.db, exigirId(dados?.id)),
    );
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Parceiro> {
    const novo = validar(novoParceiroSchema, dados);
    await Promise.all([
      this.recusarDocumentoRepetido(ctx, novo.tipoPessoa, novo.documento),
      this.conferirReferencias(ctx, novo),
    ]);
    try {
      return await this.db.transaction(async (tx) => {
        const [{ ultimo }] = await tx
          .insert(sequencias)
          .values({ empresaId: ctx.empresaId, nome: 'parceiros', ultimo: 1 })
          .onConflictDoUpdate({
            target: [sequencias.empresaId, sequencias.nome],
            set: { ultimo: sql`${sequencias.ultimo} + 1` },
          })
          .returning({ ultimo: sequencias.ultimo });
        const [linha] = await tx
          .insert(parceiros)
          .values({
            ...paraColunas(novo),
            empresaId: ctx.empresaId,
            codigo: ultimo!,
            criadoPor: ctx.usuarioId,
            atualizadoPor: ctx.usuarioId,
          })
          .returning();
        await this.gravarListas(ctx, tx, linha!.id, novo);
        return this.montar(ctx, tx, linha!);
      });
    } catch (erro) {
      // corrida: outra pessoa cadastrou o mesmo documento entre a verificação e a gravação
      if (violacaoUnica(erro) === 'parceiros_documento_por_empresa')
        await this.recusarDocumentoRepetido(
          ctx,
          novo.tipoPessoa,
          novo.documento,
        );
      throw erro;
    }
  }

  async atualizar(
    ctx: Contexto,
    dados: { id?: unknown; alteracoes?: unknown },
  ): Promise<Parceiro> {
    const id = exigirId(dados?.id);
    const a = validar(atualizarParceiroSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, this.db, id);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Reative o parceiro para alterar o cadastro.',
      );
    await Promise.all([
      a.documento !== atual.documento
        ? this.recusarDocumentoRepetido(ctx, a.tipoPessoa, a.documento, id)
        : undefined,
      this.conferirReferencias(ctx, a),
    ]);
    try {
      return await this.db.transaction(async (tx) => {
        const linha = await this.gravarVersao(ctx, tx, id, a.versao, {
          ...paraColunas(a),
          atualizadoPor: ctx.usuarioId,
        });
        await this.gravarListas(ctx, tx, id, a);
        return this.montar(ctx, tx, linha);
      });
    } catch (erro) {
      if (violacaoUnica(erro) === 'parceiros_documento_por_empresa')
        await this.recusarDocumentoRepetido(ctx, a.tipoPessoa, a.documento, id);
      throw erro;
    }
  }

  async inativar(
    ctx: Contexto,
    dados: { id?: unknown; motivo?: unknown; versao?: unknown },
  ): Promise<Parceiro> {
    const id = exigirId(dados?.id);
    const { motivo, versao } = validar(inativarParceiroSchema, dados);
    if (!(await this.buscar(ctx, this.db, id)).ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este parceiro já está inativo.',
      );
    const linha = await this.gravarVersao(ctx, this.db, id, versao, {
      ativo: false,
      inativadoEm: new Date(),
      inativadoPor: ctx.usuarioId,
      motivoInativacao: motivo,
      atualizadoPor: ctx.usuarioId,
    });
    return this.montar(ctx, this.db, linha);
  }

  async reativar(
    ctx: Contexto,
    dados: { id?: unknown; versao?: unknown },
  ): Promise<Parceiro> {
    const id = exigirId(dados?.id);
    const { versao } = validar(reativarParceiroSchema, dados);
    if ((await this.buscar(ctx, this.db, id)).ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este parceiro já está ativo.',
      );
    const linha = await this.gravarVersao(ctx, this.db, id, versao, {
      ativo: true,
      inativadoEm: null,
      inativadoPor: null,
      motivoInativacao: null,
      atualizadoPor: ctx.usuarioId,
    });
    return this.montar(ctx, this.db, linha);
  }

  // ---------------------------------------------------------------------------

  /** Sempre filtra pela empresa do contexto: uma empresa nunca vê dado da outra. */
  private async buscar(ctx: Contexto, tx: Tx | Db, id: string): Promise<Linha> {
    const [linha] = await tx
      .select()
      .from(parceiros)
      .where(and(eq(parceiros.id, id), eq(parceiros.empresaId, ctx.empresaId)));
    if (!linha) throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO);
    return linha;
  }

  /** Linha + listas + nomes das atividades e dos bancos → contrato `Parceiro`. */
  private async montar(
    ctx: Contexto,
    tx: Tx | Db,
    l: Linha,
  ): Promise<Parceiro> {
    const doParceiro = <
      T extends
        | typeof parceiroEnderecos
        | typeof parceiroContatos
        | typeof parceiroContasBancarias
        | typeof parceiroChavesPix,
    >(
      t: T,
    ) =>
      tx
        .select()
        .from(t as typeof parceiroEnderecos)
        .where(and(eq(t.parceiroId, l.id), eq(t.empresaId, ctx.empresaId)))
        .orderBy(asc(t.ordem)) as unknown as Promise<T['$inferSelect'][]>;
    const codigos = [l.cnaePrincipal, ...l.cnaesSecundarios].filter(
      (c): c is string => Boolean(c),
    );
    const [enderecos, contatos, contas, pix, atividades] = await Promise.all([
      doParceiro(parceiroEnderecos),
      doParceiro(parceiroContatos),
      doParceiro(parceiroContasBancarias),
      doParceiro(parceiroChavesPix),
      codigos.length
        ? tx
            .select({
              codigo: cnaes.codigo,
              descricao: cnaes.descricao,
              setor: cnaes.setor,
              setorNome: setores.nome,
            })
            .from(cnaes)
            .innerJoin(setores, eq(setores.id, cnaes.setor))
            .where(inArray(cnaes.codigo, codigos))
        : Promise.resolve([]),
    ]);
    const nomesDosBancos = contas.length
      ? new Map(
          (
            await tx
              .select({ codigo: bancos.codigo, nome: bancos.nomeCurto })
              .from(bancos)
              .where(
                inArray(bancos.codigo, [
                  ...new Set(contas.map((c) => c.banco)),
                ]),
              )
          ).map((b) => [b.codigo, b.nome]),
        )
      : new Map<string, string>();
    const atividade = (codigo: string): AtividadeCnae => {
      const a = atividades.find((x) => x.codigo === codigo);
      return {
        codigo,
        descricao: a?.descricao ?? `Atividade ${formatarCnae(codigo)}`,
        setor: a?.setor ?? '',
      };
    };
    const principal = l.cnaePrincipal
      ? atividades.find((a) => a.codigo === l.cnaePrincipal)
      : undefined;

    return {
      id: l.id,
      codigo: l.codigo,
      tipoPessoa: l.tipoPessoa,
      documento: l.documento,
      nome: l.nome,
      nomeFantasia: l.nomeFantasia,
      papeis: l.papeis as Papel[],
      rg: l.rg,
      rgOrgao: l.rgOrgao,
      nascimento: l.nascimento,
      pais: l.pais,
      cnaePrincipal: l.cnaePrincipal ? atividade(l.cnaePrincipal) : null,
      cnaesSecundarios: l.cnaesSecundarios.map(atividade),
      setor: principal
        ? { id: principal.setor, nome: principal.setorNome }
        : null,
      situacaoCadastral: l.situacaoCadastral as Parceiro['situacaoCadastral'],
      dataAbertura: l.dataAbertura,
      naturezaJuridica: l.naturezaJuridica,
      porte: l.porte as Parceiro['porte'],
      indicadorIE: l.indicadorIE as Parceiro['indicadorIE'],
      inscricaoEstadual: l.inscricaoEstadual,
      inscricaoMunicipal: l.inscricaoMunicipal,
      suframa: l.suframa,
      regimeTributario: l.regimeTributario as Parceiro['regimeTributario'],
      consumidorFinal: l.consumidorFinal,
      retencoes: {
        iss: l.retemIss,
        ir: l.retemIr,
        pis: l.retemPis,
        cofins: l.retemCofins,
        csll: l.retemCsll,
        inss: l.retemInss,
      },
      email: l.email,
      telefone: l.telefone,
      site: l.site,
      emailCobranca: l.emailCobranca,
      emailNfe: l.emailNfe,
      contatos: contatos.map(({ nome, cargo, email, telefone, whatsapp }) => ({
        nome,
        cargo,
        email,
        telefone,
        whatsapp,
      })),
      enderecos: enderecos.map(
        ({
          tipo,
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf,
          codigoMunicipio,
        }) => ({
          tipo: tipo as Parceiro['enderecos'][number]['tipo'],
          cep,
          logradouro,
          numero,
          complemento,
          bairro,
          cidade,
          uf: uf as Parceiro['enderecos'][number]['uf'],
          codigoMunicipio,
        }),
      ),
      contasBancarias: contas.map(
        ({ banco, agencia, conta, tipo, titular, documentoTitular }) => ({
          banco,
          bancoNome: nomesDosBancos.get(banco) ?? null,
          agencia,
          conta,
          tipo: tipo as Parceiro['contasBancarias'][number]['tipo'],
          titular,
          documentoTitular,
        }),
      ),
      chavesPix: pix.map(({ tipo, chave }) => ({
        tipo: tipo as Parceiro['chavesPix'][number]['tipo'],
        chave,
      })),
      limiteCredito: l.limiteCredito,
      formaPagamento: l.formaPagamento as Parceiro['formaPagamento'],
      condicaoPagamentoId: l.condicaoPagamentoId,
      contaReceitaId: l.contaReceitaId,
      contaDespesaId: l.contaDespesaId,
      bloqueado: l.bloqueado,
      motivoBloqueio: l.motivoBloqueio,
      etiquetas: l.etiquetas,
      origem: l.origem,
      observacoes: l.observacoes,
      ativo: l.ativo,
      inativadoEm: l.inativadoEm?.toISOString() ?? null,
      motivoInativacao: l.motivoInativacao,
      criadoEm: l.criadoEm.toISOString(),
      atualizadoEm: l.atualizadoEm.toISOString(),
      versao: l.atualizadoEm.toISOString(),
    };
  }

  /**
   * As listas são PARTE do parceiro: a tela envia a lista inteira e ela substitui a anterior,
   * na mesma transação da versão do parceiro (quem salvar com versão antiga não muda nada).
   */
  private async gravarListas(
    ctx: Contexto,
    tx: Tx,
    parceiroId: string,
    d: Dados,
  ) {
    const base = (ordem: number) => ({
      empresaId: ctx.empresaId,
      parceiroId,
      ordem,
    });
    const tabelas = [
      parceiroEnderecos,
      parceiroContatos,
      parceiroContasBancarias,
      parceiroChavesPix,
    ] as const;
    for (const t of tabelas)
      await tx
        .delete(t)
        .where(
          and(eq(t.parceiroId, parceiroId), eq(t.empresaId, ctx.empresaId)),
        );
    if (d.enderecos.length)
      await tx
        .insert(parceiroEnderecos)
        .values(d.enderecos.map((e, i) => ({ ...base(i), ...e })));
    if (d.contatos.length)
      await tx
        .insert(parceiroContatos)
        .values(d.contatos.map((c, i) => ({ ...base(i), ...c })));
    if (d.contasBancarias.length)
      await tx
        .insert(parceiroContasBancarias)
        .values(d.contasBancarias.map((c, i) => ({ ...base(i), ...c })));
    if (d.chavesPix.length)
      await tx
        .insert(parceiroChavesPix)
        .values(d.chavesPix.map((c, i) => ({ ...base(i), ...c })));
  }

  /** Atividades (CNAE) e bancos precisam existir. */
  private async conferirReferencias(ctx: Contexto, d: Dados) {
    const detalhes: { campo: string; mensagem: string }[] = [];
    const codigos = [d.cnaePrincipal, ...d.cnaesSecundarios].filter(
      (c): c is string => Boolean(c),
    );
    if (codigos.length) {
      const existentes = new Set(
        (
          await this.db
            .select({ c: cnaes.codigo })
            .from(cnaes)
            .where(inArray(cnaes.codigo, codigos))
        ).map((x) => x.c),
      );
      if (d.cnaePrincipal && !existentes.has(d.cnaePrincipal))
        detalhes.push({
          campo: 'cnaePrincipal',
          mensagem: `Atividade ${formatarCnae(d.cnaePrincipal)} não existe na CNAE.`,
        });
      d.cnaesSecundarios.forEach((c, i) => {
        if (!existentes.has(c))
          detalhes.push({
            campo: `cnaesSecundarios.${i}`,
            mensagem: `Atividade ${formatarCnae(c)} não existe na CNAE.`,
          });
      });
    }
    const codigosBancos = [...new Set(d.contasBancarias.map((c) => c.banco))];
    if (codigosBancos.length) {
      const existentes = new Set(
        (
          await this.db
            .select({ c: bancos.codigo })
            .from(bancos)
            .where(inArray(bancos.codigo, codigosBancos))
        ).map((x) => x.c),
      );
      d.contasBancarias.forEach((c, i) => {
        if (!existentes.has(c.banco))
          detalhes.push({
            campo: `contasBancarias.${i}.banco`,
            mensagem: `Banco ${c.banco} não encontrado. Selecione da lista.`,
          });
      });
    }
    if (detalhes.length)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        detalhes,
      );
  }

  /** Atualiza só se a versão (atualizadoEm) for a mesma que a tela leu: edição simultânea. */
  private async gravarVersao(
    ctx: Contexto,
    tx: Tx | Db,
    id: string,
    versao: string,
    valores: Partial<typeof parceiros.$inferInsert>,
  ): Promise<Linha> {
    const lida = new Date(versao);
    if (Number.isNaN(lida.getTime()))
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    const [linha] = await tx
      .update(parceiros)
      .set(valores)
      .where(
        and(
          eq(parceiros.id, id),
          eq(parceiros.empresaId, ctx.empresaId),
          eq(parceiros.atualizadoEm, lida),
        ),
      )
      .returning();
    if (!linha) {
      await this.buscar(ctx, tx, id); // NAO_ENCONTRADO se não existir
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    }
    return linha;
  }

  private async recusarDocumentoRepetido(
    ctx: Contexto,
    tipo: keyof typeof NOME_DOCUMENTO,
    documento: string,
    exceto?: string,
  ): Promise<void> {
    const [existente] = await this.db
      .select({
        id: parceiros.id,
        codigo: parceiros.codigo,
        nome: parceiros.nome,
      })
      .from(parceiros)
      .where(
        and(
          eq(parceiros.empresaId, ctx.empresaId),
          eq(parceiros.documento, documento),
        ),
      );
    if (existente && existente.id !== exceto) {
      const nome = NOME_DOCUMENTO[tipo];
      const exibido = tipo === 'EX' ? documento : formatarDocumento(documento);
      throw new ErroDeNegocio(
        'CONFLITO',
        `Já existe um parceiro com este ${nome} (nº ${existente.codigo} · ${existente.nome}).`,
        [
          {
            campo: 'documento',
            mensagem: `${nome === 'documento' ? 'Documento' : nome} ${exibido} já cadastrado.`,
          },
        ],
      );
    }
  }

  /** PDV (R6, A108): o parceiro "Consumidor final" (documento 00000000000; a NFC-e sai sem destinatário). */
  async consumidorFinal(ctx: Contexto): Promise<{ id: string; nome: string }> {
    const [ja] = await this.db
      .select({ id: parceiros.id, nome: parceiros.nome })
      .from(parceiros)
      .where(
        and(
          eq(parceiros.empresaId, ctx.empresaId),
          eq(parceiros.documento, '00000000000'),
        ),
      );
    if (ja) return ja;
    return this.db.transaction(async (tx) => {
      const [{ ultimo }] = await tx
        .insert(sequencias)
        .values({ empresaId: ctx.empresaId, nome: 'parceiros', ultimo: 1 })
        .onConflictDoUpdate({
          target: [sequencias.empresaId, sequencias.nome],
          set: { ultimo: sql`${sequencias.ultimo} + 1` },
        })
        .returning({ ultimo: sequencias.ultimo });
      const [n] = await tx
        .insert(parceiros)
        .values({
          empresaId: ctx.empresaId,
          codigo: ultimo!,
          tipoPessoa: 'PF',
          documento: '00000000000',
          nome: 'Consumidor final',
          papeis: ['cliente'],
          indicadorIE: 'nao_contribuinte',
          consumidorFinal: true,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .onConflictDoNothing()
        .returning({ id: parceiros.id, nome: parceiros.nome });
      if (n) return n;
      const [x] = await tx
        .select({ id: parceiros.id, nome: parceiros.nome })
        .from(parceiros)
        .where(
          and(
            eq(parceiros.empresaId, ctx.empresaId),
            eq(parceiros.documento, '00000000000'),
          ),
        );
      return x!;
    });
  }

  /**
   * I3/I4: acha o parceiro pelo CPF/CNPJ (garantindo o papel) ou cria com o mínimo. Sem documento: cliente vira o
   * "Consumidor final"; fornecedor sem documento é recusado.
   */
  async garantir(
    ctx: Contexto,
    dados: unknown,
  ): Promise<{ id: string; nome: string; criado: boolean }> {
    const d = (dados ?? {}) as {
      documento?: string | null;
      nome?: string;
      papel?: string;
      email?: string | null;
    };
    const papel = (
      d.papel === 'fornecedor' ? 'fornecedor' : 'cliente'
    ) as Papel;
    const documento = normalizarDocumento(d.documento ?? '');
    if (!documento) {
      if (papel === 'cliente')
        return { ...(await this.consumidorFinal(ctx)), criado: false };
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Informe o CPF ou o CNPJ do fornecedor.',
      );
    }
    const [ja] = await this.db
      .select()
      .from(parceiros)
      .where(
        and(
          eq(parceiros.empresaId, ctx.empresaId),
          eq(parceiros.documento, documento),
        ),
      );
    if (ja) {
      if (!ja.papeis.includes(papel))
        await this.db
          .update(parceiros)
          .set({ papeis: [...ja.papeis, papel], atualizadoPor: ctx.usuarioId })
          .where(eq(parceiros.id, ja.id));
      return { id: ja.id, nome: ja.nome, criado: false };
    }
    const p = await this.criar(ctx, {
      tipoPessoa: documento.length === 11 ? 'PF' : 'PJ',
      documento,
      nome: (d.nome || documento).slice(0, 150),
      papeis: [papel],
      email: d.email || null,
    });
    return { id: p.id, nome: p.nome, criado: true };
  }

  /** I3: planilha de clientes e fornecedores (simular = só confere). Já cadastrado é ignorado com aviso. */
  async importar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<ResultadoDaImportacaoPlanilha> {
    const d = validar(importacaoSchema, dados);
    const erros: ResultadoDaImportacaoPlanilha['erros'] = [];
    const validos: { linha: number; dados: Record<string, unknown> }[] = [];
    const vistos = new Set<string>();
    for (const [k, l] of d.linhas.entries()) {
      const linha = k + 2;
      const papeis = (l.papeis ?? 'cliente')
        .split(/[,/;|]/)
        .map((x) => x.trim().toLowerCase())
        .filter(Boolean)
        .map((x) =>
          x.startsWith('forn')
            ? 'fornecedor'
            : x.startsWith('transp')
              ? 'transportadora'
              : x.startsWith('repr') || x.startsWith('vend')
                ? 'representante'
                : x.startsWith('colab')
                  ? 'colaborador'
                  : 'cliente',
        );
      const documento = normalizarDocumento(l.documento ?? '');
      const tipo =
        (l.tipo_pessoa ?? '').trim().toUpperCase() ||
        (documento.length === 11 ? 'PF' : 'PJ');
      const entrada = {
        tipoPessoa:
          tipo === 'PF' || tipo === 'PJ' || tipo === 'EX' ? tipo : 'PJ',
        documento,
        nome: l.nome ?? '',
        papeis,
        email: l.email || null,
        telefone: l.telefone || null,
        nomeFantasia: l.nome_fantasia || null,
        inscricaoEstadual: l.inscricao_estadual || null,
        indicadorIE: l.inscricao_estadual ? 'contribuinte' : 'nao_contribuinte',
      };
      const r = novoParceiroSchema.safeParse(entrada);
      if (!r.success) {
        erros.push({
          linha,
          mensagem: r.error.issues.map((i) => i.message).join(' · '),
        });
        continue;
      }
      if (vistos.has(documento)) {
        erros.push({ linha, mensagem: 'Documento repetido na planilha.' });
        continue;
      }
      vistos.add(documento);
      validos.push({ linha, dados: entrada });
    }
    const docs = validos.map((v) => String(v.dados.documento)).filter(Boolean);
    const existentes = docs.length
      ? new Set(
          (
            await this.db
              .select({ d: parceiros.documento })
              .from(parceiros)
              .where(
                and(
                  eq(parceiros.empresaId, ctx.empresaId),
                  inArray(parceiros.documento, docs),
                ),
              )
          ).map((x) => x.d),
        )
      : new Set<string>();
    const novos = validos.filter((v) => {
      if (existentes.has(String(v.dados.documento))) {
        erros.push({
          linha: v.linha,
          mensagem: 'Já cadastrado: linha ignorada.',
        });
        return false;
      }
      return true;
    });
    let criadas = 0;
    if (!d.simular) {
      for (const v of novos) {
        try {
          await this.criar(ctx, v.dados);
          criadas++;
        } catch (e) {
          erros.push({
            linha: v.linha,
            mensagem:
              (
                (e as ErroDeNegocio).getError?.() as
                  { detalhes?: { mensagem: string }[] } | undefined
              )?.detalhes?.[0]?.mensagem ?? (e as Error).message,
          });
        }
      }
    }
    return {
      total: d.linhas.length,
      validas: novos.length,
      criadas,
      erros: erros.sort((a, b) => a.linha - b.linha),
    };
  }
}
