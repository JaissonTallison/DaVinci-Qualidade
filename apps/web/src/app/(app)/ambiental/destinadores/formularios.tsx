"use client";

import { TIPOS_DE_DESTINADOR, type Destinador } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Formulario } from "@/components/formulario-de-acao";
import {
  atualizarDestinador,
  criarDestinador,
} from "@/lib/acoes-ambiental-gestao";
import { campo } from "@/lib/estilos";

function Campos({
  erros,
  v,
  d,
}: {
  erros: Record<string, string>;
  v: Record<string, string>;
  d?: Destinador;
}) {
  const x = (k: keyof Destinador) =>
    v[k] ?? (d?.[k] === null || d?.[k] === undefined ? "" : String(d[k]));
  const p = d?.id ?? "novo";
  return (
    <div className="grid gap-4 sm:grid-cols-4">
      <Campo
        id={`${p}-nome`}
        rotulo="Nome"
        erro={erros.nome}
        className="sm:col-span-2"
      >
        <input
          id={`${p}-nome`}
          name="nome"
          maxLength={150}
          defaultValue={x("nome")}
          className={campo}
        />
      </Campo>
      <Campo id={`${p}-cnpj`} rotulo="CNPJ" erro={erros.cnpj}>
        <input
          id={`${p}-cnpj`}
          name="cnpj"
          maxLength={18}
          defaultValue={x("cnpj")}
          className={campo}
        />
      </Campo>
      <Campo id={`${p}-tipo`} rotulo="Atua como" erro={erros.tipo}>
        <select
          id={`${p}-tipo`}
          name="tipo"
          defaultValue={x("tipo") || "destinador"}
          className={campo}
        >
          {Object.entries(TIPOS_DE_DESTINADOR).map(([k, n]) => (
            <option key={k} value={k}>
              {n}
            </option>
          ))}
        </select>
      </Campo>
      <Campo
        id={`${p}-licencaNumero`}
        rotulo="Licença"
        erro={erros.licencaNumero}
      >
        <input
          id={`${p}-licencaNumero`}
          name="licencaNumero"
          maxLength={60}
          defaultValue={x("licencaNumero")}
          className={campo}
        />
      </Campo>
      <Campo id={`${p}-licencaOrgao`} rotulo="Órgão" erro={erros.licencaOrgao}>
        <input
          id={`${p}-licencaOrgao`}
          name="licencaOrgao"
          maxLength={60}
          defaultValue={x("licencaOrgao")}
          className={campo}
        />
      </Campo>
      <Campo
        id={`${p}-licencaValidade`}
        rotulo="Validade da licença"
        erro={erros.licencaValidade}
      >
        <input
          id={`${p}-licencaValidade`}
          name="licencaValidade"
          type="date"
          defaultValue={x("licencaValidade")}
          className={campo}
        />
      </Campo>
      <Campo
        id={`${p}-atividades`}
        rotulo="Resíduos e atividades licenciados"
        erro={erros.atividades}
      >
        <input
          id={`${p}-atividades`}
          name="atividades"
          maxLength={500}
          defaultValue={x("atividades")}
          className={campo}
        />
      </Campo>
    </div>
  );
}

export function NovoDestinador() {
  return (
    <Formulario acao={criarDestinador} versao="" rotuloDoBotao="Cadastrar">
      {(erros, v) => <Campos erros={erros} v={v} />}
    </Formulario>
  );
}

export function EditarDestinador({ d }: { d: Destinador }) {
  return (
    <Formulario
      acao={atualizarDestinador.bind(null, d.id)}
      versao={d.versao}
      rotuloDoBotao="Salvar"
    >
      {(erros, v) => <Campos erros={erros} v={v} d={d} />}
    </Formulario>
  );
}
