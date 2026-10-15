import { CircleCheck } from "lucide-react";

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
    <p
      role="status"
      className="mt-4 flex items-start gap-2 rounded-sm border border-borda bg-superficie px-4 py-2.5 text-base text-texto"
    >
      <CircleCheck
        aria-hidden
        size={18}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0 text-conforme"
      />
      {texto}
    </p>
  );
}
