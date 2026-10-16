import type { Metadata } from "next";
import { FormularioPedido } from "./formulario-pedido";

export const metadata: Metadata = { title: "Esqueci a senha" };

export default function EsqueciASenha() {
  return (
    <section>
      <h1 className="text-2xl text-texto">Esqueci a senha</h1>
      <p className="mt-1 text-base text-texto-2">
        Informe o e-mail de acesso. Enviamos um link para criar uma senha nova.
      </p>
      <FormularioPedido />
    </section>
  );
}
