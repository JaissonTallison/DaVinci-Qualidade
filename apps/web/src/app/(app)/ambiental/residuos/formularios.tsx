"use client";

import { useActionState } from "react";
import {
  CLASSES_RESIDUO,
  UNIDADES_RESIDUO,
  type Destinador,
  type Residuo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Campo } from "@/components/campo";
import { Selecao } from "@/components/selecao";
import type { EstadoDaAcao } from "@/lib/acao";
import {
  criarResiduo,
  registrarCdf,
  registrarSaida,
} from "@/lib/acoes-ambiental";
import { hojeEmBrasilia } from "@/lib/datas";
import {
  botaoPrimario,
  botaoSecundario,
  campo,
  campoCompacto,
} from "@/lib/estilos";
import { errosPorCampo } from "@/lib/formularios";

function useFormulario(
  acao: (e: EstadoDaAcao, f: FormData) => Promise<EstadoDaAcao>,
) {
  const [estado, enviar, salvando] = useActionState<EstadoDaAcao, FormData>(
    acao,
    {},
  );
  return {
    estado,
    enviar,
    salvando,
    erros: errosPorCampo(estado.erro?.detalhes),
    v: estado.valores ?? {},
  };
}

export function FormularioDeResiduo() {
  const { estado, enviar, salvando, erros, v } = useFormulario(criarResiduo);
  const texto = (id: string, rotulo: string, ajuda?: string) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]} ajuda={ajuda}>
      <input
        id={id}
        name={id}
        maxLength={150}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate className="flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-5 sm:grid-cols-3">
        {texto("nome", "Resíduo", "Ex.: borra de tinta, papelão, lâmpadas")}
        <Campo id="classe" rotulo="Classe (NBR 10004)" erro={erros.classe}>
          <Selecao
            id="classe"
            name="classe"
            defaultValue={v.classe ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.classe)}
          >
            <option value="">Escolha</option>
            {Object.entries(CLASSES_RESIDUO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="unidade" rotulo="Unidade" erro={erros.unidade}>
          <Selecao
            id="unidade"
            name="unidade"
            defaultValue={v.unidade ?? "kg"}
            className={campo}
          >
            {Object.entries(UNIDADES_RESIDUO).map(([k, n]) => (
              <option key={k} value={k}>
                {n}
              </option>
            ))}
          </Selecao>
        </Campo>
        {texto("origem", "Onde é gerado")}
        {texto("acondicionamento", "Como é armazenado")}
        {texto("destinacao", "Destinação")}
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Cadastrar resíduo"}
        </button>
      </div>
    </form>
  );
}

export function FormularioDeSaida({
  residuos,
  destinadores,
}: {
  residuos: Residuo[];
  destinadores: Destinador[];
}) {
  const { estado, enviar, salvando, erros, v } = useFormulario(registrarSaida);
  const texto = (id: string, rotulo: string, max: number) => (
    <Campo id={id} rotulo={rotulo} erro={erros[id]}>
      <input
        id={id}
        name={id}
        maxLength={max}
        defaultValue={v[id]}
        className={campo}
        aria-invalid={Boolean(erros[id])}
      />
    </Campo>
  );
  return (
    <form action={enviar} noValidate className="flex flex-col gap-5">
      {estado.erro && !estado.erro.detalhes?.length && (
        <AvisoDeErro erro={estado.erro} />
      )}
      <div className="grid gap-5 sm:grid-cols-4">
        <Campo
          id="residuoId"
          rotulo="Resíduo"
          erro={erros.residuoId}
          className="sm:col-span-2"
        >
          <Selecao
            id="residuoId"
            name="residuoId"
            defaultValue={v.residuoId ?? ""}
            className={campo}
            aria-invalid={Boolean(erros.residuoId)}
          >
            <option value="">Escolha</option>
            {residuos.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nome} ({UNIDADES_RESIDUO[r.unidade]})
              </option>
            ))}
          </Selecao>
        </Campo>
        <Campo id="data" rotulo="Data da saída" erro={erros.data}>
          <input
            id="data"
            name="data"
            type="date"
            defaultValue={v.data ?? hojeEmBrasilia()}
            className={campo}
          />
        </Campo>
        <Campo id="quantidade" rotulo="Quantidade" erro={erros.quantidade}>
          <input
            id="quantidade"
            name="quantidade"
            inputMode="decimal"
            defaultValue={v.quantidade}
            className={campo}
            aria-invalid={Boolean(erros.quantidade)}
          />
        </Campo>
        {texto("mtr", "Número do MTR", 40)}
        {(["transportador", "destinador"] as const).map((papel) => {
          const opcoes = destinadores.filter(
            (d) => d.tipo === papel || d.tipo === "ambos",
          );
          return opcoes.length ? (
            <Campo
              key={papel}
              id={`${papel}Id`}
              rotulo={
                papel === "transportador"
                  ? "Transportador (licenciado)"
                  : "Destinador (licenciado)"
              }
              erro={erros[`${papel}Id`] ?? erros[papel]}
            >
              <Selecao
                id={`${papel}Id`}
                name={`${papel}Id`}
                defaultValue={v[`${papel}Id`] ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {opcoes.map((d) => (
                  <option key={d.id} value={d.id} disabled={d.licencaVencida}>
                    {d.nome}
                    {d.licencaVencida ? " (licença vencida)" : ""}
                  </option>
                ))}
              </Selecao>
            </Campo>
          ) : (
            <span key={papel}>
              {texto(
                papel,
                papel === "transportador" ? "Transportador" : "Destinador",
                150,
              )}
            </span>
          );
        })}
        {texto("custo", "Custo da destinação (R$)", 15)}
      </div>
      <div>
        <button type="submit" className={botaoPrimario} disabled={salvando}>
          {salvando ? "Salvando…" : "Registrar saída"}
        </button>
      </div>
    </form>
  );
}

/** CDF na própria linha da saída: número e data. */
export function RegistrarCdf({ saidaId }: { saidaId: string }) {
  const { estado, enviar, salvando, erros, v } = useFormulario(
    registrarCdf.bind(null, saidaId),
  );
  const erro =
    erros.numero ??
    erros.data ??
    (estado.erro && !estado.erro.detalhes?.length
      ? estado.erro.mensagem
      : undefined);
  return (
    <form
      action={enviar}
      noValidate
      className="flex flex-wrap items-center gap-2"
    >
      <input
        name="numero"
        maxLength={40}
        placeholder="Nº do CDF"
        aria-label="Número do CDF"
        defaultValue={v.numero}
        className={`${campoCompacto} w-28`}
      />
      <input
        name="data"
        type="date"
        aria-label="Data do CDF"
        defaultValue={v.data ?? hojeEmBrasilia()}
        className={campoCompacto}
      />
      <button type="submit" className={botaoSecundario} disabled={salvando}>
        {salvando ? "…" : "Registrar CDF"}
      </button>
      {erro && <p className="w-full text-sm text-nao-conforme">{erro}</p>}
    </form>
  );
}
