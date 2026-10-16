"use client";

import type { Contrato, ParceiroResumo } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  atualizarContrato,
  criarContrato,
  encerrarContrato,
} from "@/lib/acoes-servicos";
import { areaDeTexto, campo } from "@/lib/estilos";
import { EscolhaDeParceiro } from "../escolha-de-parceiro";

function Campos({
  erros,
  v,
  c,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  c?: Contrato;
}) {
  const d = (k: keyof Contrato) =>
    v[k] ?? (c?.[k] === null || c?.[k] === undefined ? "" : String(c[k]));
  return (
    <>
      <Campo id="objeto" rotulo="Objeto do contrato" erro={erros.objeto}>
        <input
          id="objeto"
          name="objeto"
          maxLength={300}
          defaultValue={d("objeto")}
          className={campo}
        />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-5">
        <Campo id="inicio" rotulo="Início" erro={erros.inicio}>
          <input
            id="inicio"
            name="inicio"
            type="date"
            defaultValue={d("inicio")}
            className={campo}
          />
        </Campo>
        <Campo id="fim" rotulo="Fim" erro={erros.fim}>
          <input
            id="fim"
            name="fim"
            type="date"
            defaultValue={d("fim")}
            className={campo}
          />
        </Campo>
        <Campo
          id="prazoAtendimentoDias"
          rotulo="SLA (dias por OS)"
          erro={erros.prazoAtendimentoDias}
        >
          <input
            id="prazoAtendimentoDias"
            name="prazoAtendimentoDias"
            inputMode="numeric"
            defaultValue={d("prazoAtendimentoDias")}
            className={campo}
          />
        </Campo>
        <Campo
          id="metaNoPrazo"
          rotulo="Meta no prazo (%)"
          erro={erros.metaNoPrazo}
        >
          <input
            id="metaNoPrazo"
            name="metaNoPrazo"
            inputMode="numeric"
            defaultValue={d("metaNoPrazo") || "95"}
            className={campo}
          />
        </Campo>
        <Campo
          id="valorMensal"
          rotulo="Valor mensal (R$)"
          erro={erros.valorMensal}
        >
          <input
            id="valorMensal"
            name="valorMensal"
            inputMode="decimal"
            defaultValue={d("valorMensal")}
            className={campo}
          />
        </Campo>
      </div>
      <Campo id="observacoes" rotulo="Observações" erro={erros.observacoes}>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          maxLength={1000}
          defaultValue={d("observacoes")}
          className={areaDeTexto}
        />
      </Campo>
    </>
  );
}

export function NovoContrato({ clientes }: { clientes: ParceiroResumo[] }) {
  return (
    <Formulario
      acao={criarContrato}
      versao=""
      rotuloDoBotao="Cadastrar contrato"
    >
      {(erros, v) => (
        <>
          <Campo id="clienteId" rotulo="Cliente" erro={erros.clienteId}>
            <EscolhaDeParceiro
              id="clienteId"
              parceiros={clientes}
              valor={v.clienteId}
              invalido={Boolean(erros.clienteId)}
            />
          </Campo>
          <Campos erros={erros} v={v} />
        </>
      )}
    </Formulario>
  );
}

export function EditarContrato({ c }: { c: Contrato }) {
  return (
    <>
      <Recolhido titulo="Revisar ou renovar">
        <Formulario
          acao={atualizarContrato.bind(null, c.id)}
          versao={c.versao}
          rotuloDoBotao="Salvar contrato"
        >
          {(erros, v) => <Campos erros={erros} v={v} c={c} />}
        </Formulario>
      </Recolhido>
      <Recolhido titulo="Encerrar contrato">
        <Formulario
          acao={encerrarContrato.bind(null, c.id)}
          versao={c.versao}
          rotuloDoBotao={`Encerrar ${c.numero}`}
          perigo
        >
          {(erros, v) => (
            <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
              <input
                id="motivo"
                name="motivo"
                maxLength={300}
                defaultValue={v.motivo}
                className={campo}
              />
            </Campo>
          )}
        </Formulario>
      </Recolhido>
    </>
  );
}
