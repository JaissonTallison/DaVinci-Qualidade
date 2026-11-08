import type { Metadata } from "next";
import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import { criarMonitoramento } from "@/lib/acoes-ambiental";
import { FormularioDeMonitoramento } from "../formulario";

export const metadata: Metadata = { title: "Novo monitoramento" };

export default function NovoMonitoramento() {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: "/ambiental/monitoramentos", rotulo: "Monitoramentos" }}
        titulo="Novo monitoramento"
      />
      <FormularioDeMonitoramento acao={criarMonitoramento} />
    </>
  );
}
