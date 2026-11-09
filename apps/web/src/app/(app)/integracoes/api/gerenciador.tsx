"use client";

import { useActionState, useState, useTransition } from "react";
import type { ChaveDeApi } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { Botao } from "@/components/botao";
import { Campo } from "@/components/campo";
import { Copy, KeyRound, Plus, Trash2 } from "@/components/icones";
import { campo, painel, sobretitulo } from "@/lib/estilos";
import { formatarData } from "@/lib/datas";
import {
  criarChave,
  revogarChave,
  type EstadoNovaChave,
} from "@/lib/acoes-chaves-api";

/** Lista as chaves de API, cria (mostra a chave uma vez) e revoga. */
export function GerenciadorDeChaves({ chaves }: { chaves: ChaveDeApi[] }) {
  const [estado, criar, criando] = useActionState<EstadoNovaChave, FormData>(
    criarChave,
    {},
  );
  const [copiada, setCopiada] = useState(false);
  const [revogando, iniciarRevogacao] = useTransition();
  const ativas = chaves.filter((c) => !c.revogada);
  const erroDoCampo = estado.erro?.detalhes?.[0]?.mensagem;
  const erroGeral =
    estado.erro && !estado.erro.detalhes?.length ? estado.erro : undefined;

  function copiar(texto: string) {
    navigator.clipboard?.writeText(texto).then(
      () => {
        setCopiada(true);
        setTimeout(() => setCopiada(false), 2000);
      },
      () => undefined,
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-8">
      {estado.chave && (
        <div className="rounded-md border border-conforme-borda bg-conforme-suave p-4">
          <p className="text-sm font-semibold text-conforme-texto">
            Chave criada. Copie agora — ela não será mostrada de novo.
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="min-w-0 flex-1 truncate rounded-sm bg-superficie px-3 py-2 font-mono text-sm text-texto">
              {estado.chave.chave}
            </code>
            <Botao
              variante="secundario"
              tamanho="pequeno"
              icone={Copy}
              onClick={() => copiar(estado.chave!.chave)}
            >
              {copiada ? "Copiada" : "Copiar"}
            </Botao>
          </div>
        </div>
      )}

      <section className={`${painel} p-5`}>
        <h2 className={sobretitulo}>Nova chave</h2>
        <form
          action={criar}
          className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <Campo
            id="nome"
            rotulo="Nome da integração"
            erro={erroDoCampo}
            className="sm:max-w-sm sm:flex-1"
          >
            <input
              id="nome"
              name="nome"
              maxLength={80}
              defaultValue={estado.nome}
              placeholder="Ex.: Power BI financeiro"
              className={campo}
              aria-invalid={Boolean(erroDoCampo)}
            />
          </Campo>
          <Botao
            type="submit"
            icone={Plus}
            carregando={criando}
            textoCarregando="Gerando…"
          >
            Gerar chave
          </Botao>
        </form>
        {erroGeral && (
          <div className="mt-3">
            <AvisoDeErro erro={erroGeral} />
          </div>
        )}
      </section>

      <section className={`${painel} overflow-hidden`}>
        <div className="border-b border-borda px-5 py-3">
          <h2 className="text-md font-semibold text-texto">Chaves ativas</h2>
          <p className="text-sm text-texto-2">
            {ativas.length} {ativas.length === 1 ? "chave em uso" : "chaves em uso"}.
          </p>
        </div>
        {ativas.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-texto-2">
            Nenhuma chave ativa. Gere a primeira acima.
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-superficie-2 text-xs tracking-[0.04em] text-texto-2 uppercase">
              <tr className="border-b border-borda text-left">
                <th className="py-2.5 pr-3 pl-5 font-semibold">Nome</th>
                <th className="px-3 py-2.5 font-semibold">Prefixo</th>
                <th className="px-3 py-2.5 font-semibold">Criada</th>
                <th className="px-3 py-2.5 font-semibold">Último uso</th>
                <th className="px-3 py-2.5 pr-5" />
              </tr>
            </thead>
            <tbody>
              {ativas.map((c) => (
                <tr key={c.id} className="border-b border-borda last:border-0">
                  <td className="py-3 pr-3 pl-5 text-sm text-texto">
                    <span className="inline-flex items-center gap-2">
                      <KeyRound
                        aria-hidden
                        size={16}
                        strokeWidth={1.75}
                        className="text-texto-3"
                      />
                      {c.nome}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-mono text-sm text-texto-2">
                    {c.prefixo}…
                  </td>
                  <td className="px-3 py-3 text-sm text-texto-2">
                    {formatarData(c.criadaEm)}
                  </td>
                  <td className="px-3 py-3 text-sm text-texto-2">
                    {c.ultimoUso ? formatarData(c.ultimoUso) : "Nunca usada"}
                  </td>
                  <td className="px-3 py-3 pr-5 text-right">
                    <Botao
                      variante="fantasma"
                      tamanho="pequeno"
                      icone={Trash2}
                      disabled={revogando}
                      onClick={() =>
                        iniciarRevogacao(async () => {
                          await revogarChave(c.id);
                        })
                      }
                    >
                      Revogar
                    </Botao>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
