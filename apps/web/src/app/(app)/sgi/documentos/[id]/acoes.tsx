"use client";

import type { Documento } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario } from "@/components/formulario-de-acao";
import {
  aprovarDocumento,
  enviarRevisaoDocumento,
  novaRevisaoDocumento,
  obsoletarDocumento,
} from "@/lib/acoes-documentos";
import { areaDeTexto, campo } from "@/lib/estilos";

export function EnviarParaRevisao({ documento }: { documento: Documento }) {
  return (
    <Bloco
      titulo="Enviar para revisão"
      descricao="O documento sai de rascunho e fica pronto para um gestor aprovar."
    >
      <Formulario
        acao={enviarRevisaoDocumento.bind(null, documento.id)}
        versao={documento.versao}
        rotuloDoBotao="Enviar para revisão"
      >
        {() => (
          <p className="text-base text-texto-2">
            Confira o conteúdo e o arquivo anexo antes de enviar.
          </p>
        )}
      </Formulario>
    </Bloco>
  );
}

export function AprovarDocumento({ documento }: { documento: Documento }) {
  return (
    <Bloco
      titulo="Aprovar e tornar vigente"
      descricao="Ao aprovar, o documento vira a revisão vigente e entra no histórico."
    >
      <Formulario
        acao={aprovarDocumento.bind(null, documento.id)}
        versao={documento.versao}
        rotuloDoBotao="Aprovar documento"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-2">
            <Campo
              id="dataVigencia"
              rotulo="Data de vigência"
              erro={erros.dataVigencia}
            >
              <input
                id="dataVigencia"
                name="dataVigencia"
                type="date"
                defaultValue={v.dataVigencia}
                className={campo}
              />
            </Campo>
            <Campo
              id="proximaRevisao"
              rotulo="Próxima revisão"
              erro={erros.proximaRevisao}
              ajuda="Opcional: quando o documento deve ser revisado de novo."
            >
              <input
                id="proximaRevisao"
                name="proximaRevisao"
                type="date"
                defaultValue={v.proximaRevisao}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

export function NovaRevisao({ documento }: { documento: Documento }) {
  return (
    <Bloco
      titulo="Abrir nova revisão"
      descricao="Diga o que muda; o documento volta para revisão e, ao ser aprovado, vira a próxima revisão."
    >
      <Formulario
        acao={novaRevisaoDocumento.bind(null, documento.id)}
        versao={documento.versao}
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

export function TornarObsoleto({ documento }: { documento: Documento }) {
  return (
    <Bloco
      titulo="Tornar obsoleto"
      descricao="Tira o documento de circulação. O histórico de revisões é preservado."
    >
      <Formulario
        acao={obsoletarDocumento.bind(null, documento.id)}
        versao={documento.versao}
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
