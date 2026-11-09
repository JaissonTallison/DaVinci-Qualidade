import type { Metadata } from "next";
import Link from "next/link";
import { MODULOS_DA_BUSCA, type ResumoDeNotificacoes } from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import { CabecalhoDaPagina } from "@/components/cabecalho-da-pagina";
import { Selo } from "@/components/selo";
import { chamarApi } from "@/lib/api";
import { painel } from "@/lib/estilos";
import { BotaoMarcarTodas } from "./botao-marcar-todas";

export const metadata: Metadata = { title: "Notificações" };

/** "Ver todas" do centro de notificações: a lista completa do usuário. */
function haQuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} ${d === 1 ? "dia" : "dias"}`;
}

export default async function Notificacoes() {
  const r = await chamarApi<ResumoDeNotificacoes>("/notificacoes?filtro=todas");
  return (
    <div className="w-full">
      <CabecalhoDaPagina
        titulo="Notificações"
        descricao="Tudo o que o sistema avisou para você."
      />
      {!r.ok ? (
        <div className="mt-6">
          <AvisoDeErro erro={r.erro} />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-texto-2">
              {r.dados.naoLidas}{" "}
              {r.dados.naoLidas === 1 ? "não lida" : "não lidas"}.
            </p>
            <BotaoMarcarTodas />
          </div>
          {r.dados.itens.length === 0 ? (
            <p
              className={`${painel} px-5 py-10 text-center text-sm text-texto-2`}
            >
              Nenhuma notificação ainda.
            </p>
          ) : (
            <ul className={`${painel} divide-y divide-borda`}>
              {r.dados.itens.map((n) => {
                const rodape = [
                  n.modulo ? MODULOS_DA_BUSCA[n.modulo] : null,
                  haQuanto(n.criadaEm),
                ]
                  .filter(Boolean)
                  .join(" · ");
                const corpo = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <span className="min-w-0 text-base font-medium text-texto">
                        {n.titulo}
                      </span>
                      {!n.lida && (
                        <Selo tom="info" title="Não lida">
                          Nova
                        </Selo>
                      )}
                    </div>
                    {n.descricao && (
                      <p className="mt-0.5 text-sm text-texto-2">
                        {n.descricao}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-texto-3">{rodape}</p>
                  </>
                );
                return (
                  <li key={n.id}>
                    {n.href ? (
                      <Link
                        href={n.href}
                        className="block px-5 py-3.5 hover:bg-superficie-2"
                      >
                        {corpo}
                      </Link>
                    ) : (
                      <div className="px-5 py-3.5">{corpo}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
