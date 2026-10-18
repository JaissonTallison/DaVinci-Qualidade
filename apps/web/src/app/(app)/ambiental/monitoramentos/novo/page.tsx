import type { Metadata } from "next";
import Link from "next/link";
import { criarMonitoramento } from "@/lib/acoes-ambiental";
import { tituloDaPagina } from "@/lib/estilos";
import { FormularioDeMonitoramento } from "../formulario";

export const metadata: Metadata = { title: "Novo monitoramento" };

export default function NovoMonitoramento() {
  return (
    <>
      <Link
        href="/ambiental/monitoramentos"
        className="dv-voltar"
      >
        Monitoramentos
      </Link>
      <h1 className={`${tituloDaPagina} mt-1`}>Novo monitoramento</h1>
      <FormularioDeMonitoramento acao={criarMonitoramento} />
    </>
  );
}
