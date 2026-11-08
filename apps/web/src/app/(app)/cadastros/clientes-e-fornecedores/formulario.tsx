"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { formatarDocumento, type Parceiro } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import {
  BarraDeAcoes,
  ColunaDeResumo,
  SecaoDoCadastro,
  type SituacaoDaSecao,
} from "@/components/pagina-de-cadastro";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarParceiro } from "@/lib/acoes-parceiros";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

const PAPEIS_DO_FORMULARIO = [
  ["cliente", "Cliente"],
  ["fornecedor", "Fornecedor"],
] as const;

/** Dígitos do documento: CPF tem 11, CNPJ tem 14 (a validação do dígito fica no servidor). */
const digitos = (doc: string) => doc.replace(/\D/g, "").length;

const naoInformado = (texto: string) => (
  <span className="font-normal text-texto-3">{texto}</span>
);

/** Cadastro enxuto: identificação, papéis e contato. Endereço e dados fiscais ficam para quando o sistema precisar. */
export function FormularioDeParceiro({
  parceiro,
  embutido = false,
}: {
  parceiro?: Parceiro;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarParceiro.bind(null, parceiro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    tipoPessoa: parceiro?.tipoPessoa ?? "PJ",
    documento: parceiro ? formatarDocumento(parceiro.documento) : "",
    nome: parceiro?.nome ?? "",
    nomeFantasia: parceiro?.nomeFantasia ?? "",
    papeis: (parceiro?.papeis ?? []).join(","),
    email: parceiro?.email ?? "",
    telefone: parceiro?.telefone ?? "",
    observacoes: parceiro?.observacoes ?? "",
  };
  const papeisIniciais = new Set(v.papeis?.split(",").filter(Boolean) ?? []);
  // Obrigatórios acompanhados na coluna de resumo (o formulário continua não controlado).
  const [tipoPessoa, setTipoPessoa] = useState(v.tipoPessoa ?? "PJ");
  const [documento, setDocumento] = useState(v.documento ?? "");
  const [nome, setNome] = useState(v.nome ?? "");
  const [papeis, setPapeis] = useState<Set<string>>(papeisIniciais);
  const marcarPapel = (papel: string, marcado: boolean) =>
    setPapeis((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(papel);
      else novo.delete(papel);
      return novo;
    });

  const erroGeral = estado.erro && !estado.erro.detalhes?.length && (
    <AvisoDeErro erro={estado.erro} />
  );
  const textoDoBotao = salvando
    ? "Salvando…"
    : parceiro
      ? "Salvar"
      : "Cadastrar";

  // ---------- Campos (os mesmos nos dois modos) ----------
  const campoTipo = (
    <Campo id="tipoPessoa" rotulo="Tipo" erro={erros.tipoPessoa}>
      <Selecao
        id="tipoPessoa"
        name="tipoPessoa"
        defaultValue={v.tipoPessoa}
        onChange={(e) => setTipoPessoa(e.target.value)}
        className={campo}
      >
        <option value="PJ">Empresa (CNPJ)</option>
        <option value="PF">Pessoa física (CPF)</option>
      </Selecao>
    </Campo>
  );
  const campoDocumento = (
    <Campo
      id="documento"
      rotulo={tipoPessoa === "PF" ? "CPF" : "CNPJ"}
      erro={erros.documento}
    >
      <input
        id="documento"
        name="documento"
        inputMode="numeric"
        maxLength={18}
        defaultValue={v.documento}
        onChange={(e) => setDocumento(e.target.value)}
        className={`${campo} font-mono`}
        aria-invalid={Boolean(erros.documento)}
      />
    </Campo>
  );
  const campoPapel = (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="text-base font-medium text-texto">Papel</legend>
      <div className="flex h-9 items-center gap-5 text-base">
        {PAPEIS_DO_FORMULARIO.map(([k, n]) => (
          <label key={k} className="flex items-center gap-2">
            <input
              type="checkbox"
              name="papeis"
              value={k}
              defaultChecked={papeisIniciais.has(k)}
              onChange={(e) => marcarPapel(k, e.target.checked)}
            />{" "}
            {n}
          </label>
        ))}
      </div>
      {erros.papeis && (
        <p className="text-sm text-nao-conforme">{erros.papeis}</p>
      )}
    </fieldset>
  );
  const campoNome = (
    <Campo id="nome" rotulo="Razão social ou nome" erro={erros.nome}>
      <input
        id="nome"
        name="nome"
        maxLength={150}
        defaultValue={v.nome}
        onChange={(e) => setNome(e.target.value)}
        className={campo}
        aria-invalid={Boolean(erros.nome)}
      />
    </Campo>
  );
  const campoFantasia = (
    <Campo
      id="nomeFantasia"
      rotulo="Nome fantasia (opcional)"
      erro={erros.nomeFantasia}
    >
      <input
        id="nomeFantasia"
        name="nomeFantasia"
        maxLength={150}
        defaultValue={v.nomeFantasia}
        className={campo}
      />
    </Campo>
  );
  const campoEmail = (
    <Campo id="email" rotulo="E-mail (opcional)" erro={erros.email}>
      <input
        id="email"
        name="email"
        type="email"
        maxLength={150}
        defaultValue={v.email}
        className={campo}
        aria-invalid={Boolean(erros.email)}
      />
    </Campo>
  );
  const campoTelefone = (
    <Campo id="telefone" rotulo="Telefone (opcional)" erro={erros.telefone}>
      <input
        id="telefone"
        name="telefone"
        inputMode="tel"
        maxLength={20}
        defaultValue={v.telefone}
        className={campo}
        aria-invalid={Boolean(erros.telefone)}
      />
    </Campo>
  );
  const campoObservacoes = (
    <Campo
      id="observacoes"
      rotulo="Observações (opcional)"
      erro={erros.observacoes}
    >
      <textarea
        id="observacoes"
        name="observacoes"
        rows={embutido ? 2 : 3}
        maxLength={2000}
        defaultValue={v.observacoes}
        className={areaDeTexto}
      />
    </Campo>
  );
  const oculto = parceiro && (
    <input type="hidden" name="versao" value={parceiro.versao} />
  );

  // ---------- Modo embutido (edição dentro do detalhe): grade única, como antes ----------
  if (embutido)
    return (
      <form action={acao} noValidate>
        {oculto}
        <div className="grid gap-5 sm:grid-cols-3">
          {erroGeral && <div className="sm:col-span-3">{erroGeral}</div>}
          {campoTipo}
          {campoDocumento}
          {campoPapel}
          <div className="sm:col-span-2">{campoNome}</div>
          {campoFantasia}
          {campoEmail}
          {campoTelefone}
          <div className="sm:col-span-3">{campoObservacoes}</div>
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button type="submit" className={botaoPrimario} disabled={salvando}>
            {textoDoBotao}
          </button>
        </div>
      </form>
    );

  // ---------- Página de cadastro: uma seção por bloco + resumo (interface.md §7.2) ----------
  const documentoCompleto =
    digitos(documento) === (tipoPessoa === "PF" ? 11 : 14);
  const faltamIdentificacao =
    Number(!documentoCompleto) +
    Number(nome.trim().length < 2) +
    Number(papeis.size === 0);
  const total = 3;
  const identificacao: SituacaoDaSecao =
    faltamIdentificacao === 0
      ? { tipo: "completa" }
      : { tipo: "pendente", faltam: faltamIdentificacao };
  const SECOES = {
    identificacao: {
      id: "identificacao",
      titulo: "Identificação",
      situacao: identificacao,
    },
    contato: {
      id: "contato",
      titulo: "Contato",
      situacao: { tipo: "opcional" } as SituacaoDaSecao,
    },
  };
  const papeisEscolhidos = PAPEIS_DO_FORMULARIO.filter(([k]) =>
    papeis.has(k),
  ).map(([, n]) => n);

  return (
    <form action={acao} noValidate className="mt-6">
      {oculto}
      {erroGeral && <div className="mb-5">{erroGeral}</div>}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-5">
          <SecaoDoCadastro
            {...SECOES.identificacao}
            descricao="Documento, nome e se a empresa é cliente, fornecedor ou os dois."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {campoTipo}
              {campoDocumento}
              <div className="sm:col-span-2">{campoNome}</div>
              {campoFantasia}
              {campoPapel}
            </div>
          </SecaoDoCadastro>
          <SecaoDoCadastro
            {...SECOES.contato}
            descricao="Para avisos e cobranças. Pode ser preenchido depois."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              {campoEmail}
              {campoTelefone}
              <div className="sm:col-span-2">{campoObservacoes}</div>
            </div>
          </SecaoDoCadastro>
        </div>
        <ColunaDeResumo
          itens={[
            {
              rotulo: tipoPessoa === "PF" ? "CPF" : "CNPJ",
              valor: documento.trim() ? (
                <span className="font-mono">{documento.trim()}</span>
              ) : (
                naoInformado("Não informado")
              ),
            },
            {
              rotulo: "Nome",
              valor: nome.trim() || naoInformado("Não informado"),
            },
            {
              rotulo: "Papel",
              valor:
                papeisEscolhidos.join(" e ") || naoInformado("Não marcado"),
            },
          ]}
          obrigatorios={{ feitos: total - faltamIdentificacao, total }}
          secoes={Object.values(SECOES)}
        />
      </div>
      <BarraDeAcoes
        situacao={
          faltamIdentificacao
            ? `${faltamIdentificacao} ${faltamIdentificacao === 1 ? "campo obrigatório pendente" : "campos obrigatórios pendentes"}`
            : "Campos obrigatórios preenchidos"
        }
      >
        <Link
          href="/cadastros/clientes-e-fornecedores"
          className={botaoSecundario}
        >
          Cancelar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {textoDoBotao}
        </button>
      </BarraDeAcoes>
    </form>
  );
}
