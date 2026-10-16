import { cookies } from "next/headers";
import type {
  DadosDoUsuario,
  PainelDeVencimentos,
  Prazo,
} from "@davinci/types";
import { BarraSuperior } from "@/components/barra-superior";
import { BarraInferior } from "@/components/barra-inferior";
import {
  ColunaDoMenu,
  GavetaDoMenu,
  ProvedorDoMenu,
} from "@/components/estado-do-menu";
import { MenuLateral } from "@/components/menu-lateral";
import {
  COOKIE_GRUPOS_FECHADOS,
  COOKIE_MENU_COMPACTO,
} from "@/components/preferencias-do-menu";
import { atalhosVisiveis, gruposVisiveis } from "@/components/navegacao";
import { ListaDePessoas } from "@/components/lista-de-pessoas";
import { RotulosDasTabelas } from "@/components/rotulos-das-tabelas";
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
          <MenuLateral
            grupos={grupos}
            fechadosIniciais={fechados}
            usuarioId={eu?.usuario.id}
          />
        </ColunaDoMenu>
        <div className="flex min-w-0 flex-1 flex-col">
          <BarraSuperior
            eu={eu}
            grupos={grupos}
            atalhos={eu ? atalhosVisiveis(eu.permissoes, eu.recursos) : []}
            vencidos={listaDeVencidos}
          />
          <main
            id="conteudo"
            className="min-w-0 flex-1 px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 md:pb-6 xl:px-8"
          >
            <div className="w-full">{children}</div>
            <ListaDePessoas
              podeVer={Boolean(eu?.permissoes.includes("funcionarios.ver"))}
            />
          </main>
        </div>
      </div>
      <GavetaDoMenu>
        <MenuLateral
          grupos={grupos}
          fechadosIniciais={fechados}
          permiteCompactar={false}
          usuarioId={eu?.usuario.id}
        />
      </GavetaDoMenu>
      <BarraInferior
        atalhos={eu ? atalhosVisiveis(eu.permissoes, eu.recursos) : []}
        verNcs={grupos.some((g) =>
          g.itens.some((i) => i.href === "/qualidade/nao-conformidades"),
        )}
        verVencimentos={grupos.some((g) =>
          g.itens.some((i) => i.href === "/paineis/vencimentos"),
        )}
      />
      <RotulosDasTabelas />
    </ProvedorDoMenu>
  );
}
