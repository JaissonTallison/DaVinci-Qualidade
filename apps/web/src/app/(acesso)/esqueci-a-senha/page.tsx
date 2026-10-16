import type { Metadata } from "next";
import { CabecalhoDeAcesso } from "../campo-de-acesso";
import { FormularioPedido } from "./formulario-pedido";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default function EsqueciASenha() {
  return (
    <section>
      <CabecalhoDeAcesso titulo="Esqueci a senha">
        Informe o e-mail de acesso. Enviamos um link para criar uma senha nova.
      </CabecalhoDeAcesso>
      <FormularioPedido />
    </section>
  );
}
