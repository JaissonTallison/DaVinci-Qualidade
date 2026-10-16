"use client";

import type { OrdemDeServico } from "@davinci/types";
import { Campo } from "@/components/campo";
import { Bloco, Formulario, Recolhido } from "@/components/formulario-de-acao";
import { Selecao } from "@/components/selecao";
import {
  avaliarOs,
  cancelarOs,
  concluirOs,
  iniciarOs,
} from "@/lib/acoes-servicos";
import { areaDeTexto, campo } from "@/lib/estilos";

export function IniciarOs({ os }: { os: OrdemDeServico }) {
  return (
    <Bloco titulo="Iniciar a execução" descricao="Marca o início do serviço.">
      <Formulario
        acao={iniciarOs.bind(null, os.id)}
        versao={os.versao}
        rotuloDoBotao="Iniciar"
      >
        {() => null}
      </Formulario>
    </Bloco>
  );
}

export function ConcluirOs({ os }: { os: OrdemDeServico }) {
  return (
    <Bloco
      titulo="Concluir"
      descricao="Registre o que foi feito: é o relatório que o cliente recebe."
    >
      <Formulario
        acao={concluirOs.bind(null, os.id)}
        versao={os.versao}
        rotuloDoBotao="Concluir OS"
      >
        {(erros, v) => (
          <>
            <Campo id="relatorio" rotulo="Relatório" erro={erros.relatorio}>
              <textarea
                id="relatorio"
                name="relatorio"
                rows={4}
                maxLength={2000}
                defaultValue={v.relatorio}
                className={areaDeTexto}
              />
            </Campo>
            <Campo
              id="recebidoPor"
              rotulo="Recebido por (cliente)"
              erro={erros.recebidoPor}
              ajuda="Quem aceitou o serviço do lado do cliente."
            >
              <input
                id="recebidoPor"
                name="recebidoPor"
                maxLength={120}
                defaultValue={v.recebidoPor}
                className={campo}
              />
            </Campo>
          </>
        )}
      </Formulario>
    </Bloco>
  );
}

export function AvaliarOs({ os }: { os: OrdemDeServico }) {
  return (
    <Bloco
      titulo="Avaliação do cliente"
      descricao="Como o cliente avaliou o serviço, de 1 (ruim) a 5 (excelente)."
    >
      <Formulario
        acao={avaliarOs.bind(null, os.id)}
        versao={os.versao}
        rotuloDoBotao="Registrar avaliação"
      >
        {(erros, v) => (
          <div className="grid gap-5 sm:grid-cols-4">
            <Campo id="nota" rotulo="Nota" erro={erros.nota}>
              <Selecao
                id="nota"
                name="nota"
                defaultValue={v.nota ?? ""}
                className={campo}
              >
                <option value="">Escolha</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Selecao>
            </Campo>
            <Campo
              id="comentario"
              rotulo="Comentário (opcional)"
              erro={erros.comentario}
              className="sm:col-span-3"
            >
              <input
                id="comentario"
                name="comentario"
                maxLength={500}
                defaultValue={v.comentario}
                className={campo}
              />
            </Campo>
          </div>
        )}
      </Formulario>
    </Bloco>
  );
}

export function CancelarOs({ os }: { os: OrdemDeServico }) {
  return (
    <Recolhido titulo="Cancelar a OS">
      <Formulario
        acao={cancelarOs.bind(null, os.id)}
        versao={os.versao}
        rotuloDoBotao="Cancelar OS"
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
  );
}
