"use client";

import { useActionState } from "react";
import { formatarDocumento, type Terceiro } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import type { EstadoDaAcao } from "@/lib/acao";
import { salvarTerceiro } from "@/lib/acoes-terceiros";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export function FormularioDeTerceiro({
  terceiro,
  embutido = false,
}: {
  terceiro?: Terceiro;
  embutido?: boolean;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    salvarTerceiro.bind(null, terceiro?.id ?? null),
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v: Record<string, string> = estado.valores ?? {
    razaoSocial: terceiro?.razaoSocial ?? "",
    cnpj: terceiro ? formatarDocumento(terceiro.cnpj) : "",
    servico: terceiro?.servico ?? "",
    contato: terceiro?.contato ?? "",
    inicioContrato: terceiro?.inicioContrato ?? "",
    fimContrato: terceiro?.fimContrato ?? "",
  };
  return (
    <form action={acao} noValidate className={embutido ? "" : "mt-6"}>
      {terceiro && (
        <input type="hidden" name="versao" value={terceiro.versao} />
      )}
      <CadastroEmBlocos
        embutido={embutido}
        acoesEmbutido={
          <>
            <Botao type="submit" disabled={salvando} variante="primario">
              {salvando
                ? "Salvando…"
                : terceiro
                  ? "Salvar"
                  : "Cadastrar terceiro"}
            </Botao>
          </>
        }
        resumo={[
          { rotulo: "CNPJ", campo: "cnpj" },
          { rotulo: "Serviço", campo: "servico" },
          { rotulo: "Início", campo: "inicioContrato" },
        ]}
        acoes={
          <>
            <Botao href="/seguranca/terceiros" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              disabled={salvando}
              variante="primario"
              tamanho="grande"
            >
              {salvando
                ? "Salvando…"
                : terceiro
                  ? "Salvar"
                  : "Cadastrar terceiro"}
            </Botao>
          </>
        }
      >
        <Bloco
          id="empresa"
          titulo="Empresa"
          descricao="Razão social, CNPJ e serviço prestado."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo
              id="razaoSocial"
              rotulo="Razão social"
              erro={erros.razaoSocial}
              className="sm:col-span-2"
            >
              <input
                id="razaoSocial"
                required
                name="razaoSocial"
                maxLength={150}
                defaultValue={v.razaoSocial}
                className={campo}
                aria-invalid={Boolean(erros.razaoSocial)}
              />
            </Campo>
            <Campo id="cnpj" rotulo="CNPJ" erro={erros.cnpj}>
              <input
                id="cnpj"
                required
                name="cnpj"
                inputMode="numeric"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                defaultValue={v.cnpj}
                className={`${campo} font-mono`}
                aria-invalid={Boolean(erros.cnpj)}
              />
            </Campo>
            <Campo
              id="servico"
              rotulo="Serviço prestado"
              erro={erros.servico}
              className="sm:col-span-2"
            >
              <input
                id="servico"
                required
                name="servico"
                maxLength={200}
                defaultValue={v.servico}
                className={campo}
                aria-invalid={Boolean(erros.servico)}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="contrato"
          titulo="Contrato"
          descricao="Contato e vigência do contrato."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo
              id="contato"
              rotulo="Contato (opcional)"
              erro={erros.contato}
            >
              <input
                id="contato"
                name="contato"
                maxLength={120}
                defaultValue={v.contato}
                className={campo}
              />
            </Campo>
            <Campo
              id="inicioContrato"
              rotulo="Início do contrato"
              erro={erros.inicioContrato}
            >
              <input
                id="inicioContrato"
                required
                name="inicioContrato"
                type="date"
                defaultValue={v.inicioContrato}
                className={campo}
                aria-invalid={Boolean(erros.inicioContrato)}
              />
            </Campo>
            <Campo
              id="fimContrato"
              rotulo="Fim do contrato (opcional)"
              erro={erros.fimContrato}
            >
              <input
                id="fimContrato"
                name="fimContrato"
                type="date"
                defaultValue={v.fimContrato}
                className={campo}
                aria-invalid={Boolean(erros.fimContrato)}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
