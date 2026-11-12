"use client";

import type { Processo } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import {
  aprovarProcesso,
  cancelarProcesso,
  encerrarProcesso,
  enviarRevisaoProcesso,
  novaRevisaoProcesso,
  publicarProcesso,
} from "@/lib/acoes-processos";
import { areaDeTexto, campo } from "@/lib/estilos";

export function EnviarParaRevisao({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Enviar para revisão"
      descricao="O processo sai de elaboração e fica pronto para um gestor aprovar."
    >
      <Formulario
        acao={enviarRevisaoProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Enviar para revisão"
      >
        {() => (
          <p className="text-base text-texto-2">
            Confira a definição do processo antes de enviar.
          </p>
        )}
      </Formulario>
    </Bloco>
  );
}

export function AprovarProcesso({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Aprovar revisão"
      descricao="Ao aprovar, o processo fica aprovado e entra no histórico; depois é publicado."
    >
      <Formulario
        acao={aprovarProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Aprovar processo"
      >
        {(erros, v) => (
          <Campo
            id="dataProximaRevisao"
            rotulo="Próxima revisão"
            erro={erros.dataProximaRevisao}
            ajuda="Opcional: quando o processo deve ser revisado de novo."
          >
            <input
              id="dataProximaRevisao"
              name="dataProximaRevisao"
              type="date"
              defaultValue={v.dataProximaRevisao}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function PublicarProcesso({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Publicar"
      descricao="Torna a revisão aprovada a versão vigente para toda a organização."
    >
      <Formulario
        acao={publicarProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Publicar processo"
      >
        {() => (
          <p className="text-base text-texto-2">
            A revisão {processo.revisaoAtual} passa a ser a versão publicada.
          </p>
        )}
      </Formulario>
    </Bloco>
  );
}

export function NovaRevisao({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Abrir nova revisão"
      descricao="Diga o que muda; o processo volta para elaboração e, ao ser aprovado, vira a próxima revisão."
    >
      <Formulario
        acao={novaRevisaoProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Abrir revisão"
      >
        {(erros, v) => (
          <Campo
            id="oQueMudou"
            rotulo="O que muda nesta revisão"
            erro={erros.oQueMudou}
          >
            <textarea
              id="oQueMudou"
              name="oQueMudou"
              rows={2}
              maxLength={500}
              defaultValue={v.oQueMudou}
              className={areaDeTexto}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function EncerrarProcesso({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Tornar obsoleto"
      descricao="Tira o processo de circulação. O histórico de revisões é preservado."
    >
      <Formulario
        acao={encerrarProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Tornar obsoleto"
      >
        {(erros, v) => (
          <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
            <input
              id="motivo"
              name="motivo"
              maxLength={500}
              defaultValue={v.motivo}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}

export function CancelarProcesso({ processo }: { processo: Processo }) {
  return (
    <Bloco
      titulo="Cancelar"
      descricao="Encerra o processo ainda em elaboração ou revisão, sem publicá-lo."
    >
      <Formulario
        acao={cancelarProcesso.bind(null, processo.id)}
        versao={processo.versao}
        rotuloDoBotao="Cancelar processo"
      >
        {(erros, v) => (
          <Campo id="motivo" rotulo="Motivo" erro={erros.motivo}>
            <input
              id="motivo"
              name="motivo"
              maxLength={500}
              defaultValue={v.motivo}
              className={campo}
            />
          </Campo>
        )}
      </Formulario>
    </Bloco>
  );
}
