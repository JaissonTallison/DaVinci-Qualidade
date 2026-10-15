"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useActionState } from "react";
import { DIAS_PARA_RENOVAR, TIPOS_LICENCA } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarLicenca } from "@/lib/acoes-ambiental";
import { botaoPrimario, botaoSecundario, campo, painel } from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeLicenca() {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarLicenca,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  return (
    <form action={enviar} noValidate className={`${painel} mt-6 max-w-4xl`}>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo id="tipo" rotulo="Tipo" erro={erros.tipo}>
          <Selecao
            id="tipo"
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
        <Campo id="emissao" rotulo="Emissão" erro={erros.emissao}>
          <input
            id="emissao"
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
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/ambiental/licencas" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Cadastrar licença"}
        </button>
      </div>
    </form>
  );
}
