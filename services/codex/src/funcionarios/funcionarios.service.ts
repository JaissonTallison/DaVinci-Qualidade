import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, ilike, or, type SQL } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  violacaoUnica,
  ordemAlfabetica,
} from '@davinci/database';
import { ErroDeNegocio, hojeEmBrasilia, validar } from '@davinci/shared';
import {
  atualizarFuncionarioSchema,
  desligarFuncionarioSchema,
  filtroFuncionariosSchema,
  isUuid,
  novoFuncionarioSchema,
  normalizarDocumento,
  readmitirFuncionarioSchema,
  type Contexto,
  type Funcionario,
  type FuncionarioResumo,
  type Pagina,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { funcionarios, funcoes, setoresEmpresa } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este funcionário foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';
const REPETIDO: Record<string, [string, string]> = {
  funcionarios_matricula_por_empresa: [
    'matricula',
    'Já existe um funcionário com esta matrícula.',
  ],
  funcionarios_cpf_por_empresa: [
    'cpf',
    'Já existe um funcionário com este CPF.',
  ],
};

@Injectable()
export class FuncionariosService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  async listar(
    ctx: Contexto,
    dados: unknown,
  ): Promise<Pagina<FuncionarioResumo>> {
    const f = validar(filtroFuncionariosSchema, dados ?? {});
    const condicoes: SQL[] = [eq(funcionarios.empresaId, ctx.empresaId)];
    if (f.situacao !== 'todos')
      condicoes.push(eq(funcionarios.ativo, f.situacao === 'ativos'));
    if (f.setorId) condicoes.push(eq(funcionarios.setorId, f.setorId));
    if (f.funcaoId) condicoes.push(eq(funcionarios.funcaoId, f.funcaoId));
    if (f.busca) {
      const termo = `%${f.busca}%`;
      const doc = normalizarDocumento(f.busca);
      condicoes.push(
        or(
          ilike(funcionarios.nome, termo),
          ilike(funcionarios.matricula, termo),
          ...(doc.length >= 3 ? [ilike(funcionarios.cpf, `%${doc}%`)] : []),
        )!,
      );
    }
    const onde = and(...condicoes);
    const [linhas, [{ total }]] = await Promise.all([
      this.consulta()
        .where(onde)
        .orderBy(ordemAlfabetica(funcionarios.nome))
        .limit(f.porPagina)
        .offset((f.pagina - 1) * f.porPagina),
      this.db.select({ total: count() }).from(funcionarios).where(onde),
    ]);
    return {
      itens: linhas.map((l) => {
        const x = montar(l);
        return {
          id: x.id,
          matricula: x.matricula,
          nome: x.nome,
          setorNome: x.setorNome,
          funcaoNome: x.funcaoNome,
          admissao: x.admissao,
          ativo: x.ativo,
          desligamento: x.desligamento,
        };
      }),
      total: total!,
      pagina: f.pagina,
      porPagina: f.porPagina,
    };
  }

  async obter(ctx: Contexto, dados: { id?: unknown }): Promise<Funcionario> {
    return this.buscar(ctx, dados?.id);
  }

  async criar(ctx: Contexto, dados: unknown): Promise<Funcionario> {
    const novo = validar(novoFuncionarioSchema, dados);
    await this.conferirEstrutura(ctx, novo.setorId, novo.funcaoId);
    try {
      const [l] = await this.db
        .insert(funcionarios)
        .values({
          ...novo,
          empresaId: ctx.empresaId,
          criadoPor: ctx.usuarioId,
          atualizadoPor: ctx.usuarioId,
        })
        .returning();
      return this.buscar(ctx, l!.id);
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  /** Mudar de setor ou de função também é por aqui. Desligado não muda: readmita antes. */
  async atualizar(ctx: Contexto, dados: ComId): Promise<Funcionario> {
    const { versao, ...campos } = validar(
      atualizarFuncionarioSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Funcionário desligado não é alterado. Readmita-o antes.',
      );
    await this.conferirEstrutura(ctx, campos.setorId, campos.funcaoId);
    try {
      return await this.gravar(ctx, atual.id, versao, campos);
    } catch (erro) {
      throw repetido(erro) ?? erro;
    }
  }

  async desligar(ctx: Contexto, dados: ComId): Promise<Funcionario> {
    const { versao, data, motivo } = validar(
      desligarFuncionarioSchema,
      dados?.alteracoes,
    );
    const atual = await this.buscar(ctx, dados?.id);
    if (!atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este funcionário já está desligado.',
      );
    if (data < atual.admissao)
      throw invalido(
        'data',
        'O desligamento não pode ser anterior à admissão.',
      );
    if (data > hojeEmBrasilia())
      throw invalido(
        'data',
        'O desligamento não pode estar no futuro: registre no dia.',
      );
    return this.gravar(ctx, atual.id, versao, {
      ativo: false,
      desligamento: data,
      motivoDesligamento: motivo,
    });
  }

  /** Volta à lista de ativos com a mesma matrícula. Setor e função precisam estar ativos. */
  async readmitir(ctx: Contexto, dados: ComId): Promise<Funcionario> {
    const { versao } = validar(readmitirFuncionarioSchema, dados?.alteracoes);
    const atual = await this.buscar(ctx, dados?.id);
    if (atual.ativo)
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'Este funcionário já está ativo.',
      );
    await this.conferirEstrutura(ctx, atual.setorId, atual.funcaoId);
    return this.gravar(ctx, atual.id, versao, {
      ativo: true,
      desligamento: null,
      motivoDesligamento: null,
    });
  }

  private consulta() {
    return this.db
      .select({
        f: funcionarios,
        setorNome: setoresEmpresa.nome,
        funcaoNome: funcoes.nome,
      })
      .from(funcionarios)
      .innerJoin(setoresEmpresa, eq(setoresEmpresa.id, funcionarios.setorId))
      .innerJoin(funcoes, eq(funcoes.id, funcionarios.funcaoId))
      .$dynamic();
  }

  private async buscar(ctx: Contexto, id: unknown): Promise<Funcionario> {
    const [l] = isUuid(id)
      ? await this.consulta().where(
          and(
            eq(funcionarios.id, id),
            eq(funcionarios.empresaId, ctx.empresaId),
          ),
        )
      : [];
    if (!l)
      throw new ErroDeNegocio('NAO_ENCONTRADO', 'Funcionário não encontrado.');
    return montar(l);
  }

  private async gravar(
    ctx: Contexto,
    id: string,
    versao: string,
    valores: Partial<typeof funcionarios.$inferInsert>,
  ): Promise<Funcionario> {
    const lida = new Date(versao);
    const [l] = Number.isNaN(lida.getTime())
      ? []
      : await this.db
          .update(funcionarios)
          .set({ ...valores, atualizadoPor: ctx.usuarioId })
          .where(
            and(
              eq(funcionarios.id, id),
              eq(funcionarios.empresaId, ctx.empresaId),
              eq(funcionarios.atualizadoEm, lida),
            ),
          )
          .returning();
    if (!l) throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    return this.buscar(ctx, id);
  }

  /** Setor e função precisam existir na empresa e estar ativos. */
  private async conferirEstrutura(
    ctx: Contexto,
    setorId: string,
    funcaoId: string,
  ): Promise<void> {
    const [[setor], [funcao]] = await Promise.all([
      this.db
        .select({ ativo: setoresEmpresa.ativo })
        .from(setoresEmpresa)
        .where(
          and(
            eq(setoresEmpresa.id, setorId),
            eq(setoresEmpresa.empresaId, ctx.empresaId),
          ),
        ),
      this.db
        .select({ ativo: funcoes.ativo })
        .from(funcoes)
        .where(
          and(eq(funcoes.id, funcaoId), eq(funcoes.empresaId, ctx.empresaId)),
        ),
    ]);
    const detalhes: { campo: string; mensagem: string }[] = [];
    if (!setor?.ativo)
      detalhes.push({
        campo: 'setorId',
        mensagem: 'Setor não encontrado ou inativo.',
      });
    if (!funcao?.ativo)
      detalhes.push({
        campo: 'funcaoId',
        mensagem: 'Função não encontrada ou inativa.',
      });
    if (detalhes.length)
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Verifique os campos destacados.',
        detalhes,
      );
  }
}

function repetido(erro: unknown): ErroDeNegocio | null {
  const regra = violacaoUnica(erro);
  const campo = regra ? REPETIDO[regra] : undefined;
  return campo
    ? new ErroDeNegocio('CONFLITO', campo[1], [
        { campo: campo[0], mensagem: campo[1] },
      ])
    : null;
}

function invalido(campo: string, mensagem: string): ErroDeNegocio {
  return new ErroDeNegocio(
    'DADOS_INVALIDOS',
    'Verifique os campos destacados.',
    [{ campo, mensagem }],
  );
}

function montar(l: {
  f: typeof funcionarios.$inferSelect;
  setorNome: string;
  funcaoNome: string;
}): Funcionario {
  const f = l.f;
  return {
    id: f.id,
    matricula: f.matricula,
    nome: f.nome,
    cpf: f.cpf,
    setorId: f.setorId,
    setorNome: l.setorNome,
    funcaoId: f.funcaoId,
    funcaoNome: l.funcaoNome,
    admissao: f.admissao,
    email: f.email,
    telefone: f.telefone,
    ativo: f.ativo,
    desligamento: f.desligamento,
    motivoDesligamento: f.motivoDesligamento,
    versao: f.atualizadoEm.toISOString(),
  };
}
