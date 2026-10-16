"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import {
  formatarDocumento,
  type Funcao,
  type Funcionario,
  type SetorDaEmpresa,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarFuncionario } from "@/lib/acoes-cadastros";
import { hojeEmBrasilia } from "@/lib/datas";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

/** Cadastrar (sem `funcionario`) ou editar. Setor e função vêm só dos ativos (mais o atual, se inativado). */
export function FormularioDeFuncionario({
  funcionario,
  setores,
  funcoes,
  embutido = false,
}: {
  funcionario?: Funcionario;
  setores: SetorDaEmpresa[];
  funcoes: Funcao[];
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarFuncionario.bind(null, funcionario?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    matricula: funcionario?.matricula ?? "",
    nome: funcionario?.nome ?? "",
    cpf: funcionario ? formatarDocumento(funcionario.cpf) : "",
    setorId: funcionario?.setorId ?? "",
    funcaoId: funcionario?.funcaoId ?? "",
    admissao: funcionario?.admissao ?? "",
    email: funcionario?.email ?? "",
    telefone: funcionario?.telefone ?? "",
  };
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;
  const opcoesDeSetor = setores.filter(
    (s) => s.ativo || s.id === funcionario?.setorId,
  );
  const opcoesDeFuncao = funcoes.filter(
    (f) => f.ativo || f.id === funcionario?.funcaoId,
  );

  return (
    <form
      action={acao}
      noValidate
      className={embutido ? "" : `${painel} mt-6`}
    >
      {funcionario && (
        <input type="hidden" name="versao" value={funcionario.versao} />
      )}
      <div className={`grid gap-5 sm:grid-cols-3 ${embutido ? "" : "p-5"}`}>
        {erroGeral && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={erroGeral} />
          </div>
        )}
        <Campo
          id="matricula"
          rotulo="Matrícula"
          erro={erros.matricula}
          ajuda="Única na empresa."
        >
          <input
            id="matricula"
            name="matricula"
            defaultValue={v.matricula}
            maxLength={20}
            className={`${campo} font-mono`}
            aria-invalid={Boolean(erros.matricula)}
          />
        </Campo>
        <Campo
          id="nome"
          rotulo="Nome completo"
          erro={erros.nome}
          className="sm:col-span-2"
        >
          <input
            id="nome"
            name="nome"
            defaultValue={v.nome}
            maxLength={120}
            className={campo}
            aria-invalid={Boolean(erros.nome)}
          />
        </Campo>
        <Campo id="cpf" rotulo="CPF" erro={erros.cpf}>
          <input
            id="cpf"
            name="cpf"
            inputMode="numeric"
            placeholder="000.000.000-00"
            defaultValue={v.cpf}
            maxLength={14}
            className={`${campo} font-mono`}
            aria-invalid={Boolean(erros.cpf)}
          />
        </Campo>
        <Campo id="setorId" rotulo="Setor" erro={erros.setorId}>
          <Selecao
            id="setorId"
            name="setorId"
            defaultValue={v.setorId}
            className={campo}
            aria-invalid={Boolean(erros.setorId)}
          >
            <option value="">Escolha</option>
            {opcoesDeSetor.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="funcaoId" rotulo="Função" erro={erros.funcaoId}>
          <Selecao
            id="funcaoId"
            name="funcaoId"
            defaultValue={v.funcaoId}
            className={campo}
            aria-invalid={Boolean(erros.funcaoId)}
          >
            <option value="">Escolha</option>
            {opcoesDeFuncao.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="admissao" rotulo="Admissão" erro={erros.admissao}>
          <input
            id="admissao"
            name="admissao"
            type="date"
            max={hojeEmBrasilia()}
            defaultValue={v.admissao}
            className={campo}
            aria-invalid={Boolean(erros.admissao)}
          />
        </Campo>
        <Campo id="email" rotulo="E-mail (opcional)" erro={erros.email}>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={v.email}
            maxLength={150}
            className={campo}
            aria-invalid={Boolean(erros.email)}
          />
        </Campo>
        <Campo id="telefone" rotulo="Telefone (opcional)" erro={erros.telefone}>
          <input
            id="telefone"
            name="telefone"
            inputMode="tel"
            defaultValue={v.telefone}
            maxLength={20}
            className={campo}
            aria-invalid={Boolean(erros.telefone)}
          />
        </Campo>
      </div>
      <div
        className={`flex justify-end gap-3 ${embutido ? "mt-5" : "border-t border-borda px-5 py-3"}`}
      >
        {!embutido && (
          <Link href="/cadastros/funcionarios" className={botaoSecundario}>
            <ArrowLeft aria-hidden size={16} strokeWidth={2} />
            Voltar
          </Link>
        )}
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando
            ? "Salvando…"
            : funcionario
              ? "Salvar funcionário"
              : "Cadastrar funcionário"}
        </button>
      </div>
    </form>
  );
}
