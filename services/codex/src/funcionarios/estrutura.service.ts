import { Inject, Injectable } from '@nestjs/common';
import { and, count, eq, type SQL } from 'drizzle-orm';
import {
  DATABASE,
  type Database,
  violacaoUnica,
  ordemAlfabetica,
} from '@davinci/database';
import { ErroDeNegocio, validar } from '@davinci/shared';
import {
  atualizarFuncaoSchema,
  atualizarSetorSchema,
  filtroCadastroSimplesSchema,
  isUuid,
  novaFuncaoSchema,
  novoSetorSchema,
  situacaoDoCadastroSchema,
  type Contexto,
  type Funcao,
  type SetorDaEmpresa,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { funcionarios, funcoes, setoresEmpresa } from '../db/schema.js';

type Db = Database<typeof schema>;
type ComId = { id?: unknown; alteracoes?: unknown };

const ALTERADO_POR_OUTRA_PESSOA =
  'Este cadastro foi alterado por outra pessoa. Recarregue a página para ver a versão atual.';

/** Setores e funções da empresa: cadastros simples, que se inativam em vez de se apagar. */
@Injectable()
export class EstruturaService {
  constructor(@Inject(DATABASE) private readonly db: Db) {}

  // ---------------------------------------------------------------- setores

  async listarSetores(
    ctx: Contexto,
    dados: unknown,
  ): Promise<SetorDaEmpresa[]> {
    const { situacao } = validar(filtroCadastroSimplesSchema, dados ?? {});
    const condicoes: SQL[] = [eq(setoresEmpresa.empresaId, ctx.empresaId)];
    if (situacao !== 'todos')
      condicoes.push(eq(setoresEmpresa.ativo, situacao === 'ativos'));
    const [linhas, ativos] = await Promise.all([
      this.db
        .select()
        .from(setoresEmpresa)
        .where(and(...condicoes))
        .orderBy(ordemAlfabetica(setoresEmpresa.nome)),
      this.ativosPor(ctx, 'setor'),
    ]);
    return linhas.map((l) => ({
      id: l.id,
      nome: l.nome,
      ativo: l.ativo,
      funcionariosAtivos: ativos.get(l.id) ?? 0,
      versao: l.atualizadoEm.toISOString(),
    }));
  }

  async criarSetor(ctx: Contexto, dados: unknown): Promise<SetorDaEmpresa> {
    const { nome } = validar(novoSetorSchema, dados);
    const [l] = await this.db
      .insert(setoresEmpresa)
      .values({
        nome,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning()
      .catch(nomeRepetido('setores_empresa_nome_por_empresa', 'setor'));
    return {
      id: l!.id,
      nome: l!.nome,
      ativo: l!.ativo,
      funcionariosAtivos: 0,
      versao: l!.atualizadoEm.toISOString(),
    };
  }

  async atualizarSetor(ctx: Contexto, dados: ComId): Promise<SetorDaEmpresa> {
    const { nome, versao } = validar(atualizarSetorSchema, dados?.alteracoes);
    await this.gravarSetor(ctx, dados?.id, versao, { nome });
    return this.setorPorId(ctx, dados?.id);
  }

  /** Inativar setor com funcionário ativo é recusado: mude as pessoas de setor antes. */
  async mudarSituacaoDoSetor(
    ctx: Contexto,
    dados: ComId,
  ): Promise<SetorDaEmpresa> {
    const { ativo, versao } = validar(
      situacaoDoCadastroSchema,
      dados?.alteracoes,
    );
    if (!ativo && isUuid(dados?.id)) {
      const pessoas = (await this.ativosPor(ctx, 'setor')).get(dados.id) ?? 0;
      if (pessoas)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          `${pessoas === 1 ? '1 funcionário ativo está' : `${pessoas} funcionários ativos estão`} neste setor. Mude de setor antes de inativá-lo.`,
        );
    }
    await this.gravarSetor(ctx, dados?.id, versao, { ativo });
    return this.setorPorId(ctx, dados?.id);
  }

  // ---------------------------------------------------------------- funções

  async listarFuncoes(ctx: Contexto, dados: unknown): Promise<Funcao[]> {
    const { situacao } = validar(filtroCadastroSimplesSchema, dados ?? {});
    const condicoes: SQL[] = [eq(funcoes.empresaId, ctx.empresaId)];
    if (situacao !== 'todos')
      condicoes.push(eq(funcoes.ativo, situacao === 'ativos'));
    const [linhas, ativos] = await Promise.all([
      this.db
        .select()
        .from(funcoes)
        .where(and(...condicoes))
        .orderBy(ordemAlfabetica(funcoes.nome)),
      this.ativosPor(ctx, 'funcao'),
    ]);
    return linhas.map((l) => ({
      id: l.id,
      nome: l.nome,
      cbo: l.cbo,
      ativo: l.ativo,
      funcionariosAtivos: ativos.get(l.id) ?? 0,
      versao: l.atualizadoEm.toISOString(),
    }));
  }

  async criarFuncao(ctx: Contexto, dados: unknown): Promise<Funcao> {
    const nova = validar(novaFuncaoSchema, dados);
    const [l] = await this.db
      .insert(funcoes)
      .values({
        ...nova,
        empresaId: ctx.empresaId,
        criadoPor: ctx.usuarioId,
        atualizadoPor: ctx.usuarioId,
      })
      .returning()
      .catch(nomeRepetido('funcoes_nome_por_empresa', 'função'));
    return {
      id: l!.id,
      nome: l!.nome,
      cbo: l!.cbo,
      ativo: l!.ativo,
      funcionariosAtivos: 0,
      versao: l!.atualizadoEm.toISOString(),
    };
  }

  async atualizarFuncao(ctx: Contexto, dados: ComId): Promise<Funcao> {
    const { versao, ...campos } = validar(
      atualizarFuncaoSchema,
      dados?.alteracoes,
    );
    await this.gravarFuncao(ctx, dados?.id, versao, campos);
    return this.funcaoPorId(ctx, dados?.id);
  }

  async mudarSituacaoDaFuncao(ctx: Contexto, dados: ComId): Promise<Funcao> {
    const { ativo, versao } = validar(
      situacaoDoCadastroSchema,
      dados?.alteracoes,
    );
    if (!ativo && isUuid(dados?.id)) {
      const pessoas = (await this.ativosPor(ctx, 'funcao')).get(dados.id) ?? 0;
      if (pessoas)
        throw new ErroDeNegocio(
          'REGRA_DE_NEGOCIO',
          `${pessoas === 1 ? '1 funcionário ativo tem' : `${pessoas} funcionários ativos têm`} esta função. Mude a função antes de inativá-la.`,
        );
    }
    await this.gravarFuncao(ctx, dados?.id, versao, { ativo });
    return this.funcaoPorId(ctx, dados?.id);
  }

  // ---------------------------------------------------------------- apoio

  private async gravarSetor(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof setoresEmpresa.$inferInsert>,
  ) {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(setoresEmpresa)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(setoresEmpresa.id, id),
                eq(setoresEmpresa.empresaId, ctx.empresaId),
                eq(setoresEmpresa.atualizadoEm, lida),
              ),
            )
            .returning()
            .catch(nomeRepetido('setores_empresa_nome_por_empresa', 'setor'))
        : [];
    if (!l) {
      await this.setorPorId(ctx, id);
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    }
  }

  private async gravarFuncao(
    ctx: Contexto,
    id: unknown,
    versao: string,
    valores: Partial<typeof funcoes.$inferInsert>,
  ) {
    const lida = new Date(versao);
    const [l] =
      isUuid(id) && !Number.isNaN(lida.getTime())
        ? await this.db
            .update(funcoes)
            .set({ ...valores, atualizadoPor: ctx.usuarioId })
            .where(
              and(
                eq(funcoes.id, id),
                eq(funcoes.empresaId, ctx.empresaId),
                eq(funcoes.atualizadoEm, lida),
              ),
            )
            .returning()
            .catch(nomeRepetido('funcoes_nome_por_empresa', 'função'))
        : [];
    if (!l) {
      await this.funcaoPorId(ctx, id);
      throw new ErroDeNegocio('CONFLITO', ALTERADO_POR_OUTRA_PESSOA);
    }
  }

  private async setorPorId(
    ctx: Contexto,
    id: unknown,
  ): Promise<SetorDaEmpresa> {
    const s = (await this.listarSetores(ctx, { situacao: 'todos' })).find(
      (x) => x.id === id,
    );
    if (!s) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Setor não encontrado.');
    return s;
  }

  private async funcaoPorId(ctx: Contexto, id: unknown): Promise<Funcao> {
    const f = (await this.listarFuncoes(ctx, { situacao: 'todos' })).find(
      (x) => x.id === id,
    );
    if (!f) throw new ErroDeNegocio('NAO_ENCONTRADO', 'Função não encontrada.');
    return f;
  }

  private async ativosPor(
    ctx: Contexto,
    chave: 'setor' | 'funcao',
  ): Promise<Map<string, number>> {
    const coluna =
      chave === 'setor' ? funcionarios.setorId : funcionarios.funcaoId;
    const linhas = await this.db
      .select({ id: coluna, total: count() })
      .from(funcionarios)
      .where(
        and(
          eq(funcionarios.empresaId, ctx.empresaId),
          eq(funcionarios.ativo, true),
        ),
      )
      .groupBy(coluna);
    return new Map(linhas.map((l) => [l.id, l.total]));
  }
}

/** Nome repetido vira erro no campo `nome`; qualquer outro erro segue como veio. */
function nomeRepetido(regra: string, coisa: 'setor' | 'função') {
  return (erro: unknown): never => {
    if (violacaoUnica(erro) === regra) {
      const mensagem = `Já existe ${coisa === 'setor' ? 'um setor' : 'uma função'} com este nome.`;
      throw new ErroDeNegocio('CONFLITO', mensagem, [
        { campo: 'nome', mensagem },
      ]);
    }
    throw erro;
  };
}
