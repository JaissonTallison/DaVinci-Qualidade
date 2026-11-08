import { CaixaDeAlerta } from "@/components/caixa-de-alerta";

/** Senha mostrada uma única vez: quem administra repassa à pessoa, que troca no primeiro acesso. */
export function SenhaProvisoria({ senha }: { senha: string }) {
  return (
    <CaixaDeAlerta tom="atencao" className="mt-4">
      <p className="text-base text-texto">
        Senha provisória:{" "}
        <span className="font-mono text-lg font-semibold select-all">
          {senha}
        </span>
      </p>
      <p className="mt-1 text-sm text-texto-2">
        Anote agora: ela não aparece de novo. A pessoa troca a senha no primeiro
        acesso.
      </p>
    </CaixaDeAlerta>
  );
}
