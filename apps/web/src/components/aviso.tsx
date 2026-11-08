import { CaixaDeAlerta } from "@/components/caixa-de-alerta";

/** Confirmação depois de uma ação (vem na URL como ?aviso=). Chave desconhecida não mostra nada. */
export function Aviso({
  avisos,
  chave,
}: {
  avisos: Record<string, string>;
  chave?: string;
}) {
  const texto = chave ? avisos[chave] : undefined;
  if (!texto) return null;
  return (
    <CaixaDeAlerta tom="sucesso" className="mt-4">
      {texto}
    </CaixaDeAlerta>
  );
}
