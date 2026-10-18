"use client";

import { useEffect, useState } from "react";

const horaFmt = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});
const dataFmt = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "America/Sao_Paulo",
});

/**
 * Relógio ao vivo (hora e data em Brasília) para a faixa de abertura do Início.
 * Começa com a hora que o servidor renderizou e passa a atualizar no navegador.
 */
export function RelogioDoDia({ inicialISO }: { inicialISO: string }) {
  const [agora, setAgora] = useState(() => new Date(inicialISO));
  useEffect(() => {
    const atualizar = () => setAgora(new Date());
    // Sincroniza com o relógio do navegador logo após montar e depois a cada 20s.
    const inicial = setTimeout(atualizar, 0);
    const intervalo = setInterval(atualizar, 20_000);
    return () => {
      clearTimeout(inicial);
      clearInterval(intervalo);
    };
  }, []);
  return (
    <div className="text-right">
      <p
        suppressHydrationWarning
        className="text-3xl font-semibold text-primaria-texto tabular-nums"
      >
        {horaFmt.format(agora)}
      </p>
      <p
        suppressHydrationWarning
        className="mt-0.5 text-sm text-primaria-texto/75 first-letter:uppercase"
      >
        {dataFmt.format(agora)}
      </p>
    </div>
  );
}
