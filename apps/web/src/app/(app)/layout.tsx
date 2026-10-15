import type { DadosDoUsuario } from "@davinci/types";
import { BarraSuperior } from "@/components/barra-superior";
import { MenuLateral } from "@/components/menu-lateral";
import { gruposVisiveis } from "@/components/navegacao";
import { chamarApi } from "@/lib/api";

/** Casca do sistema: menu lateral com os grupos do QSSMA, barra superior e o conteúdo. */
export default async function LayoutDoSistema({ children }: LayoutProps<"/">) {
  const r = await chamarApi<DadosDoUsuario>("/auth/eu");
  const eu = r.ok ? r.dados : undefined;
  const grupos = eu ? gruposVisiveis(eu.permissoes, eu.recursos) : [];
  return (
    <div className="flex min-h-screen flex-1">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 lg:block print:hidden">
        <MenuLateral grupos={grupos} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior eu={eu} />
        {/* Telas estreitas: o mesmo menu, recolhido no topo */}
        <details className="border-b border-borda bg-superficie lg:hidden print:hidden">
          <summary className="cursor-pointer px-4 py-2.5 text-base font-semibold text-texto">
            Menu
          </summary>
          <div className="border-t border-borda">
            <MenuLateral grupos={grupos} />
          </div>
        </details>
        <main id="conteudo" className="min-w-0 flex-1 px-4 py-6 sm:px-6">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </main>
      </div>
    </div>
  );
}
