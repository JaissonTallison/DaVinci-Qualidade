import { CabecalhoDeCadastro } from "@/components/pagina-de-cadastro";
import type { ConfigRo } from "./config";
import { FormularioDeRo } from "./formulario";

export function NovoRo({ cfg }: { cfg: ConfigRo }) {
  return (
    <>
      <CabecalhoDeCadastro
        voltar={{ href: cfg.base, rotulo: cfg.titulo }}
        titulo={cfg.registrar}
        descricao={cfg.intro}
      />
      <FormularioDeRo cfg={cfg} />
    </>
  );
}
