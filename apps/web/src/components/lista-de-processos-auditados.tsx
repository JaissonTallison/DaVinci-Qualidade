import { PROCESSOS_AUDITADOS } from "@davinci/types";

/**
 * Sugestões dos 18 processos auditáveis: um `<datalist id="processos-auditados">`. Campos de processo
 * (`list="processos-auditados"`) autocompletam; o valor continua livre para quem quiser detalhar.
 * A lista é fixa (vem do material de referência), então o componente pode ser usado em qualquer formulário.
 */
export function ListaDeProcessosAuditados() {
  return (
    <datalist id="processos-auditados">
      {Object.values(PROCESSOS_AUDITADOS).map((nome) => (
        <option key={nome} value={nome} />
      ))}
    </datalist>
  );
}
