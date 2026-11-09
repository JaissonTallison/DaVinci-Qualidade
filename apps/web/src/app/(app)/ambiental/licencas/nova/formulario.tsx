"use client";

import { useActionState } from "react";
import { DIAS_PARA_RENOVAR, TIPOS_LICENCA } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { FaixaDeIA } from "@/components/faixa-de-ia";
import { Campo } from "@/components/campo";
import { Bloco, CadastroEmBlocos } from "@/components/cadastro-em-blocos";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarLicenca } from "@/lib/acoes-ambiental";
import { campo } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";
import { Botao } from "@/components/botao";

export function FormularioDeLicenca() {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarLicenca,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={enviar} noValidate className="mt-6">
      <CadastroEmBlocos
        resumo={[
          { rotulo: "Tipo", campo: "tipo" },
          { rotulo: "Número", campo: "numero" },
          { rotulo: "Validade", campo: "validade" },
        ]}
        acoes={
          <>
            <Botao href="/ambiental/licencas" tamanho="grande">
              Cancelar
            </Botao>
            <Botao
              type="submit"
              carregando={salvando}
              textoCarregando="Salvando…"
              variante="primario"
              tamanho="grande"
            >
              Cadastrar licença
            </Botao>
          </>
        }
      >
        <Bloco
          id="licenca"
          titulo="Licença"
          descricao="Tipo, número, órgão emissor e o que a licença autoriza."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <FaixaDeIA rotulo="Preencher com IA">
                a IA lê a licença (PDF) e preenche tipo, número, órgão e validade
                para você conferir.
              </FaixaDeIA>
            </div>
            {estado.erro && !estado.erro.detalhes?.length && (
              <div className="sm:col-span-3">
                <AvisoDeErro erro={estado.erro} />
              </div>
            )}
            <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
              <Selecao
                id="tipo"
                required
                name="tipo"
                defaultValue={v.tipo ?? ""}
                className={campo}
                aria-invalid={Boolean(erros.tipo)}
              >
                <option value="">Escolha</option>
                {Object.entries(TIPOS_LICENCA).map(([k, n]) => (
                  <option key={k} value={k}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo id="numero" rotulo="Número" erro={erros.numero}>
              <input
                id="numero"
                required
                name="numero"
                maxLength={60}
                defaultValue={v.numero}
                className={campo}
                aria-invalid={Boolean(erros.numero)}
              />
            </Campo>
            <Campo
              id="orgao"
              rotulo="Órgão emissor"
              erro={erros.orgao}
              ajuda="Ex.: IAT-PR, CETESB, IBAMA, prefeitura"
            >
              <input
                id="orgao"
                required
                name="orgao"
                maxLength={120}
                defaultValue={v.orgao}
                className={campo}
                aria-invalid={Boolean(erros.orgao)}
              />
            </Campo>
            <Campo
              id="descricao"
              rotulo="O que autoriza (opcional)"
              erro={erros.descricao}
              className="sm:col-span-3"
            >
              <input
                id="descricao"
                name="descricao"
                maxLength={300}
                defaultValue={v.descricao}
                className={campo}
              />
            </Campo>
          </div>
        </Bloco>
        <Bloco
          id="validade"
          titulo="Validade e renovação"
          descricao="Datas da licença e com quanta antecedência pedir a renovação."
        >
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="emissao" rotulo="Emissão" erro={erros.emissao}>
              <input
                id="emissao"
                required
                name="emissao"
                type="date"
                defaultValue={v.emissao}
                className={campo}
                aria-invalid={Boolean(erros.emissao)}
              />
            </Campo>
            <Campo id="validade" rotulo="Validade" erro={erros.validade}>
              <input
                id="validade"
                required
                name="validade"
                type="date"
                defaultValue={v.validade}
                className={campo}
                aria-invalid={Boolean(erros.validade)}
              />
            </Campo>
            <Campo
              id="diasParaRenovar"
              rotulo="Pedir renovação com (dias)"
              erro={erros.diasParaRenovar}
              ajuda="CONAMA 237: 120 dias antes do vencimento. Siga o prazo da própria licença se for outro."
            >
              <input
                id="diasParaRenovar"
                name="diasParaRenovar"
                type="number"
                min={0}
                max={365}
                defaultValue={v.diasParaRenovar ?? DIAS_PARA_RENOVAR}
                className={campo}
              />
            </Campo>
          </div>
        </Bloco>
      </CadastroEmBlocos>
    </form>
  );
}
