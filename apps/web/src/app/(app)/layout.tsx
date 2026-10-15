import { cookies } from "next/headers";
import type {
  DadosDoUsuario,
  PainelDeVencimentos,
  Prazo,
} from "@davinci/types";
import { BarraSuperior } from "@/components/barra-superior";
import { ColunaDoMenu, ProvedorDoMenu } from "@/components/estado-do-menu";
import { MenuLateral } from "@/components/menu-lateral";
import {
  COOKIE_GRUPOS_FECHADOS,
  COOKIE_MENU_COMPACTO,
} from "@/components/preferencias-do-menu";
import { atalhosVisiveis, gruposVisiveis } from "@/components/navegacao";
import { chamarApi } from "@/lib/api";

/** Casca do sistema: menu lateral com os grupos do QSSMA, barra superior e o conteúdo. */
export default async function LayoutDoSistema({ children }: LayoutProps<"/">) {
  const r = await chamarApi<DadosDoUsuario>("/auth/eu");
  const eu = r.ok ? r.dados : undefined;
  const grupos = eu ? gruposVisiveis(eu.permissoes, eu.recursos) : [];
  const loja = await cookies();
  const compacto = loja.get(COOKIE_MENU_COMPACTO)?.value === "sim";
  const fechados = decodeURIComponent(
    loja.get(COOKIE_GRUPOS_FECHADOS)?.value ?? "",
  )
    .split("|")
    .filter(Boolean);

  // Prazos vencidos para o sino da barra superior
  const listaDeVencidos: Prazo[] = [];
  if (eu?.permissoes.includes("paineis.ver")) {
    const painel = await chamarApi<PainelDeVencimentos>("/paineis/vencimentos");
    if (painel.ok)
      for (const p of painel.dados.prazos) {
        if (p.situacao !== "vencido") continue;
        listaDeVencidos.push(p);
      }
  }

  return (
    <ProvedorDoMenu compactoInicial={compacto}>
      <div className="flex min-h-screen flex-1">
        <ColunaDoMenu>
          <MenuLateral grupos={grupos} fechadosIniciais={fechados} />
        </ColunaDoMenu>
        <div className="flex min-w-0 flex-1 flex-col">
          <BarraSuperior
            eu={eu}
            grupos={grupos}
            atalhos={eu ? atalhosVisiveis(eu.permissoes, eu.recursos) : []}
            vencidos={listaDeVencidos}
          />
          {/* Telas estreitas: o mesmo menu, recolhido no topo */}
          <details className="border-b border-borda bg-superficie lg:hidden print:hidden">
            <summary className="cursor-pointer px-4 py-2.5 text-base font-semibold text-texto">
              Menu
            </summary>
            <div className="border-t border-borda">
              <MenuLateral
                grupos={grupos}
                fechadosIniciais={fechados}
                permiteCompactar={false}
              />
            </div>
          </details>
          <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-[90rem]">{children}</div>
          </main>
        </div>
      </div>
    </ProvedorDoMenu>
  );
}
