import { ListFilter } from "lucide-react";
import type { Metadata } from "next";
import {
  MODULOS_DO_PAINEL,
  type DadosDoUsuario,
  type PainelDeVencimentos,
  type Prazo,
} from "@davinci/types";
import { AvisoDeErro } from "@/components/aviso-de-erro";
import {
  LinhaDePrazo,
  telaDoIcone,
  textoDoSelo,
} from "@/components/linha-de-prazo";
import { SelecaoDeFiltro } from "@/components/filtros";
import { chamarApi } from "@/lib/api";
import { formatarData, prazoRelativo } from "@/lib/datas";
import {
  botaoSecundario,
  painel,
  tituloDaPagina,
  tituloDaSecao,
} from "@/lib/estilos";
import { EnviarAvisos } from "./enviar-avisos";

export const metadata: Metadata = { title: "Painel de vencimentos" };

export default async function Vencimentos({
  searchParams,
}: PageProps<"/paineis/vencimentos">) {
  const { modulo } = (await searchParams) as { modulo?: string };
  const [r, eu] = await Promise.all([
    chamarApi<PainelDeVencimentos>("/paineis/vencimentos"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  const podeAvisar = eu.ok && eu.dados.permissoes.includes("empresa.gerenciar");
  if (!r.ok) return <AvisoDeErro erro={r.erro} />;
  const prazos = r.dados.prazos.filter((p) => !modulo || p.modulo === modulo);
  const vencidos = prazos.filter((p) => p.situacao === "vencido");
  const proximos = prazos.filter((p) => p.situacao === "vence_em_breve");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={tituloDaPagina}>Painel de vencimentos</h1>
          <p className="mt-1 max-w-2xl text-base text-texto-2">
            Tudo o que venceu ou vence nos próximos 30 dias, de todos os módulos
            que você acompanha. Todo dia às 7h, quem tem prazo vencido ou para
            os próximos 7 dias recebe um resumo por e-mail.
          </p>
        </div>
        {podeAvisar && <EnviarAvisos />}
      </header>
      {r.dados.indisponiveis.length > 0 && (
        <p
          role="alert"
          className="mt-4 rounded-sm border border-atencao px-4 py-2.5 text-base text-texto"
        >
          Sem resposta de:{" "}
          {r.dados.indisponiveis.map((m) => MODULOS_DO_PAINEL[m]).join(", ")}.
          Os prazos desses módulos não aparecem agora; recarregue em instantes.
        </p>
      )}
      <form className="mt-6 flex flex-wrap items-end gap-3">
        <SelecaoDeFiltro
          nome="modulo"
          rotulo="Módulo"
          opcoes={MODULOS_DO_PAINEL}
          valor={modulo}
        />
        <button type="submit" className={botaoSecundario}>
          <ListFilter aria-hidden size={16} strokeWidth={2} />
          Filtrar
        </button>
      </form>
      <Grupo
        titulo={`Vencidos (${vencidos.length})`}
        prazos={vencidos}
        vazio="Nada vencido."
      />
      <Grupo
        titulo={`Vencem nos próximos 30 dias (${proximos.length})`}
        prazos={proximos}
        vazio="Nada vencendo nos próximos 30 dias."
      />
    </>
  );
}

function Grupo({
  titulo,
  prazos,
  vazio,
}: {
  titulo: string;
  prazos: Prazo[];
  vazio: string;
}) {
  return (
    <section className={`${painel} mt-6`}>
      <h2 className={`${tituloDaSecao} px-5 pt-5`}>{titulo}</h2>
      {prazos.length === 0 ? (
        <p className="px-5 pt-2 pb-5 text-base text-texto-2">{vazio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-borda border-t border-borda">
          {prazos.map((p, i) => (
            <li key={`${p.href}-${p.tipo}-${i}`}>
              <LinhaDePrazo
                href={p.href}
                icone={telaDoIcone(p.tipo, p.href)}
                titulo={`${p.tipo}: ${p.descricao}`}
                detalhe={`${MODULOS_DO_PAINEL[p.modulo]} · ${formatarData(p.data)}`}
                selo={textoDoSelo(prazoRelativo(p.data))}
                tom={p.situacao === "vencido" ? "vencido" : "proximo"}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
