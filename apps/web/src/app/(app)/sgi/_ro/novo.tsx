import Link from "next/link";
import { tituloDaPagina } from "@/lib/estilos";
import type { ConfigRo } from "./config";
import { FormularioDeRo } from "./formulario";

export function NovoRo({ cfg }: { cfg: ConfigRo }) {
  return (
    <>
      <Link href={cfg.base} className="dv-voltar">
        {cfg.titulo}
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>{cfg.registrar}</h1>
      <p className="mt-1 max-w-2xl text-base text-texto-2">{cfg.intro}</p>
      <FormularioDeRo cfg={cfg} />
    </>
  );
}
