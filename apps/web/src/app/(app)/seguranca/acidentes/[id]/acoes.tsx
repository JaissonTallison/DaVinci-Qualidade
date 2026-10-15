"use client";

import type { Acidente } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import {
  cancelarAcidente,
  concluirInvestigacao,
  iniciarInvestigacao,
  registrarCat,
} from "@/lib/acoes-acidentes";
import { hojeEmBrasilia } from "@/lib/datas";
import { areaDeTexto, campo } from "@/lib/estilos";

export function RegistrarCat({ acidente }: { acidente: Acidente }) {
  return (
    <Bloco
      titulo="Registrar a CAT"
      descricao="Número da Comunicação de Acidente de Trabalho emitida e a data de emissão."
    >
      <Formulario
        acao={registrarCat.bind(null, acidente.id)}
        versao={acidente.versao}
        rotuloDoBotao="Registrar CAT"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-3">
            <Campo id="numero" rotulo="Número da CAT" erro={erros.numero}>
              <input
                id="numero"
                name="numero"
                defaultValue={v.numero}
                maxLength={30}
                className={`${campo} font-mono`}
                aria-invalid={Boolean(erros.numero)}
              />
            </Campo>
            <Campo id="data" rotulo="Emitida em" erro={erros.data}>
              <input
                id="data"
                name="data"
                type="date"
                min={acidente.data}
                max={hojeEmBrasilia()}
                defaultValue={v.data ?? hojeEmBrasilia()}
                className={campo}
                aria-invalid={Boolean(erros.data)}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

export function IniciarInvestigacao({ acidente }: { acidente: Acidente }) {
  return (
    <Bloco
      titulo="Investigar"
      descricao="Ouça o acidentado e as testemunhas, veja o local e o equipamento. Ao concluir, registre as causas e as medidas."
    >
      <Formulario
        acao={iniciarInvestigacao.bind(null, acidente.id)}
        versao={acidente.versao}
        rotuloDoBotao="Iniciar investigação"
      >
        {() => null}
      </Formulario>
    </Bloco>
  );
}

export function ConcluirInvestigacao({ acidente }: { acidente: Acidente }) {
  const semCat =
    (acidente.tipo === "com_afastamento" ||
      acidente.tipo === "sem_afastamento") &&
    !acidente.catNumero;
  return (
    <Bloco
      titulo="Concluir investigação"
      descricao={
        semCat
          ? "Registre a CAT antes de concluir: todo acidente com lesão gera CAT."
          : "Causas encontradas e o que será feito para o evento não se repetir."
      }
    >
      <Formulario
        acao={concluirInvestigacao.bind(null, acidente.id)}
        versao={acidente.versao}
        rotuloDoBotao="Concluir investigação"
      >
        {(erros, v) => (
          <>
            <Campo
              id="causas"
              rotulo="Causas"
              erro={erros.causas}
              ajuda="Causas imediatas e básicas: o que permitiu que acontecesse."
            >
              <textarea
                id="causas"
                name="causas"
                rows={3}
                defaultValue={v.causas}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.causas)}
              />
            </Campo>
            <Campo
              id="medidas"
              rotulo="Medidas para evitar a repetição"
              erro={erros.medidas}
            >
              <textarea
                id="medidas"
                name="medidas"
                rows={3}
                defaultValue={v.medidas}
                className={areaDeTexto}
                aria-invalid={Boolean(erros.medidas)}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

export function CancelarAcidente({ acidente }: { acidente: Acidente }) {
  return (
    <Recolhido titulo="Cancelar este registro">
      <p className="text-base text-texto-2">
        Use para registro em duplicidade ou por engano. Ele não é apagado e
        deixa de contar nos indicadores.
      </p>
      <Formulario
        acao={cancelarAcidente.bind(null, acidente.id)}
        versao={acidente.versao}
        rotuloDoBotao={`Cancelar ${acidente.numero}`}
        perigo
      >
        {(erros, v) => (
          <Campo
            id="motivo"
            rotulo="Motivo do cancelamento"
            erro={erros.motivo}
          >
            <textarea
              id="motivo"
              name="motivo"
              rows={2}
              defaultValue={v.motivo}
              className={areaDeTexto}
              aria-invalid={Boolean(erros.motivo)}
            />
          </Campo>
        )}
      </Formulario>
    </Recolhido>
  );
}
