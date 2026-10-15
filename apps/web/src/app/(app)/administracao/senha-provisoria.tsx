/** Senha mostrada uma única vez: quem administra repassa à pessoa, que troca no primeiro acesso. */
export function SenhaProvisoria({ senha }: { senha: string }) {
  return (
    <div
      role="status"
      className="mt-4 rounded-sm border border-borda-forte bg-superficie px-4 py-3"
    >
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
    </div>
  );
}
