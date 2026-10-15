import { PILARES_DA_SUSTENTABILIDADE } from "@davinci/types";
import { painel } from "@/lib/estilos";

/** Conceito de sustentabilidade da Agenda ESG (material de domínio): cinco pilares sobre o modelo de governança. */
export function PilaresDaSustentabilidade() {
  return (
    <section
      className={`${painel} mt-6 overflow-hidden`}
      aria-label="Pilares da sustentabilidade"
    >
      <p className="px-5 pt-5 text-base text-texto-2">
        Pilares do conceito de sustentabilidade assumido pela DaVinci: fazem
        parte dos planos estratégicos, táticos e operacionais e envolvem todos
        os profissionais das empresas que usam o sistema.
      </p>
      <ul className="mt-4 grid grid-cols-2 border-t border-borda sm:grid-cols-5">
        {PILARES_DA_SUSTENTABILIDADE.map((p) => (
          <li
            key={p}
            className="border-b border-borda px-4 py-3 text-center sm:border-r sm:border-b-0 sm:last:border-r-0"
          >
            <span className="block text-xs text-texto-2">Sustentabilidade</span>
            <span className="font-serif text-lg">{p}</span>
          </li>
        ))}
      </ul>
      <p className="border-t-2 border-ouro-claro bg-superficie-2 px-5 py-2.5 text-center text-sm font-semibold">
        Base: modelo de governança corporativa
      </p>
    </section>
  );
}
