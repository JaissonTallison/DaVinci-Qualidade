import type { InputHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import { ajudaDoCampo, erroDoCampo } from "@/lib/estilos";

/** Campo das telas de acesso: o mesmo do cartão de entrar (ícone à esquerda, rótulo só para leitor de tela). */
export function CampoDeAcesso({
  id,
  rotulo,
  icone: Icone,
  erro,
  ajuda,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  rotulo: string;
  icone: LucideIcon;
  erro?: string;
  ajuda?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="sr-only">
        {rotulo}
      </label>
      <div className="relative">
        <Icone
          aria-hidden
          size={18}
          strokeWidth={1.75}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-texto-2"
        />
        <input
          id={id}
          name={id}
          placeholder={rotulo}
          className={`dv-acesso-campo pr-4 pl-12 ${className}`}
          aria-invalid={Boolean(erro)}
          aria-describedby={erro || ajuda ? `${id}-nota` : undefined}
          {...props}
        />
      </div>
      {erro ? (
        <p id={`${id}-nota`} className={erroDoCampo}>
          {erro}
        </p>
      ) : (
        ajuda && (
          <p id={`${id}-nota`} className={ajudaDoCampo}>
            {ajuda}
          </p>
        )
      )}
    </div>
  );
}

/** Título e texto centralizados, como no cartão de entrar. */
export function CabecalhoDeAcesso({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <h1 className="text-center text-2xl">{titulo}</h1>
      <p className="mt-1 text-center text-md text-texto-2">{children}</p>
    </>
  );
}
