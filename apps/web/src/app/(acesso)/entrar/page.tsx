import type { Metadata } from "next";
import { ChartColumn, Leaf, Settings } from "lucide-react";
import { lerCookie } from "@/lib/cookie";
import { provedoresAtivos } from "@/lib/provedores-externos";
import { COOKIE_LEMBRAR, COOKIE_RECUSA } from "@/lib/sessao";
import { FormularioEntrar } from "./formulario-entrar";

export const metadata: Metadata = { title: "Entrar" };

const AVISOS: Record<string, string> = {
  "sessao-encerrada": "Sua sessão foi encerrada. Entre novamente.",
  "senha-redefinida": "Senha criada. Entre com a nova senha.",
};

const DESTAQUES = [
  { icone: Settings, texto: "Conformidade e auditorias" },
  { icone: ChartColumn, texto: "Indicadores e relatórios" },
  { icone: Leaf, texto: "Menos riscos, mais eficiência" },
];

export default async function Entrar({ searchParams }: PageProps<"/entrar">) {
  const { volta, aviso } = (await searchParams) as {
    volta?: string;
    aviso?: string;
  };
  // Recusa do login com Microsoft/Google (gravada pela volta do provedor)
  const recusa = await lerCookie(COOKIE_RECUSA);
  return (
    <section>
      <h1 className="text-2xl text-texto">Entrar</h1>
      <p className="mt-1 text-base text-texto-2">
        Acesse o ambiente da sua empresa.
      </p>
      {aviso && AVISOS[aviso] && (
        <p
          role="status"
          className="mt-4 rounded-sm border border-borda bg-superficie-2 px-4 py-2.5 text-base text-texto-2"
        >
          {AVISOS[aviso]}
        </p>
      )}
      <FormularioEntrar
        volta={volta}
        provedores={provedoresAtivos()}
        recusa={recusa}
        lembrar={Boolean(await lerCookie(COOKIE_LEMBRAR))}
      />
      <p className="mt-6 text-center text-sm text-texto-3">
        Ainda não tem acesso? Fale com o administrador da sua empresa.
      </p>
      <ul className="mt-6 grid grid-cols-3 divide-x divide-borda border-t border-borda pt-5">
        {DESTAQUES.map(({ icone: Icone, texto }) => (
          <li
            key={texto}
            className="flex flex-col items-center gap-1.5 px-2 text-center text-sm text-texto-2"
          >
            <Icone aria-hidden size={18} strokeWidth={1.75} />
            {texto}
          </li>
        ))}
      </ul>
    </section>
  );
}
