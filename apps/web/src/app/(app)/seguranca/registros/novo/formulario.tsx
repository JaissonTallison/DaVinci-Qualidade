"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { TIPOS_REGISTRO_SST, type TipoRegistroSst } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import { criarRegistroSst } from "@/lib/acoes-pgr-pt";
import { hojeEmBrasilia } from "@/lib/datas";
import {
  areaDeTexto,
  botaoPrimario,
  botaoSecundario,
  campo,
  painel,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

export function FormularioDeRegistro({
  tipoInicial,
}: {
  tipoInicial?: TipoRegistroSst;
}) {
  const [estado, acao, salvando] = useActionState<EstadoDaAcao, FormData>(
    criarRegistroSst,
    {},
  );
  const erros = errosPorCampo(estado.erro?.detalhes);
  const v = estado.valores ?? {};
  const [tipo, setTipo] = useState<string>(v.tipo ?? tipoInicial ?? "");
  const rotuloDoConteudo =
    tipo in TIPOS_REGISTRO_SST
      ? TIPOS_REGISTRO_SST[tipo as TipoRegistroSst].conteudo
      : "Conteúdo";
  return (
    <form action={acao} noValidate className={`${painel} mt-6 max-w-4xl`}>
      <div className="grid gap-5 p-5 sm:grid-cols-3">
        {estado.erro && !estado.erro.detalhes?.length && (
          <div className="sm:col-span-3">
            <AvisoDeErro erro={estado.erro} />
          </div>
        )}
        <Campo
          id="tipo"
          rotulo="Tipo"
          erro={erros.tipo}
          className="sm:col-span-2"
        >
          <Selecao
            id="tipo"
            name="tipo"
            defaultValue={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className={campo}
            aria-invalid={Boolean(erros.tipo)}
          >
            <option value="">Escolha</option>
            {Object.entries(TIPOS_REGISTRO_SST).map(([k, t]) => (
              <option key={k} value={k}>
                {t.rotulo}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="data" rotulo="Data" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            max={hojeEmBrasilia()}
            defaultValue={v.data ?? hojeEmBrasilia()}
            className={campo}
            aria-invalid={Boolean(erros.data)}
          />
        </Campo>
        <Campo
          id="tema"
          rotulo="Tema ou atividade"
          erro={erros.tema}
          className="sm:col-span-3"
        >
          <input
            id="tema"
            name="tema"
            maxLength={200}
            defaultValue={v.tema}
            className={campo}
            aria-invalid={Boolean(erros.tema)}
          />
        </Campo>
        <Campo id="responsavel" rotulo="Quem conduziu" erro={erros.responsavel}>
          <input
            id="responsavel"
            name="responsavel"
            maxLength={120}
            defaultValue={v.responsavel}
            className={campo}
            aria-invalid={Boolean(erros.responsavel)}
          />
        </Campo>
        <Campo
          id="participantes"
          rotulo="Participantes"
          erro={erros.participantes}
        >
          <input
            id="participantes"
            name="participantes"
            inputMode="numeric"
            defaultValue={v.participantes}
            className={campo}
            aria-invalid={Boolean(erros.participantes)}
          />
        </Campo>
        <Campo id="local" rotulo="Local (opcional)" erro={erros.local}>
          <input
            id="local"
            name="local"
            maxLength={120}
            defaultValue={v.local}
            className={campo}
          />
        </Campo>
        <Campo
          id="conteudo"
          rotulo={rotuloDoConteudo}
          erro={erros.conteudo}
          className="sm:col-span-3"
          ajuda="A lista de presença assinada entra como anexo depois de salvar."
        >
          <textarea
            id="conteudo"
            name="conteudo"
            rows={6}
            maxLength={4000}
            defaultValue={v.conteudo}
            className={areaDeTexto}
            aria-invalid={Boolean(erros.conteudo)}
          />
        </Campo>
      </div>
      <div className="flex justify-end gap-3 border-t border-borda px-5 py-3">
        <Link href="/seguranca/registros" className={botaoSecundario}>
          <ArrowLeft aria-hidden size={16} strokeWidth={2} />
          Voltar
        </Link>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar registro"}
        </button>
      </div>
    </form>
  );
}
