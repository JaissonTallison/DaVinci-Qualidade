import type { Metadata } from "next";
import Link from "next/link";
import type { DadosDoUsuario, ModeloDeInspecao } from "@davinci/types";
import { chamarApi } from "@/lib/api";
import { hojeEmBrasilia } from "@/lib/datas";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioNovaInspecao } from "./formulario";

export const metadata: Metadata = { title: "Nova inspeção" };

export default async function NovaInspecao() {
  const [modelos, eu] = await Promise.all([
    chamarApi<ModeloDeInspecao[]>("/modelos-de-inspecao"),
    chamarApi<DadosDoUsuario>("/auth/eu"),
  ]);
  return (
    <>
      <Link
        href="/qualidade/inspecoes"
        className="text-sm text-texto-2 hover:underline"
      >
        Inspeções
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Nova inspeção</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">
        Identifique o que está sendo inspecionado. Os itens vêm do modelo
        escolhido; em seguida, responda cada um como OK, NOK ou N/A.
      </p>
      <FormularioNovaInspecao
        modelos={modelos.ok ? modelos.dados : []}
        hoje={hojeEmBrasilia()}
        inspetor={eu.ok ? eu.dados.usuario.nome : ""}
      />
    </>
  );
}
