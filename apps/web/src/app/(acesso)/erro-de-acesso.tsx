import type { ErroPadrao } from "@davinci/types";

/** Falha do sistema (não do usuário): só aí a referência ajuda o suporte. */
const FALHA_DO_SISTEMA = new Set<ErroPadrao["codigo"]>([
  "INTERNO",
  "SERVICO_INDISPONIVEL",
]);

/** Erro geral das telas de acesso: uma linha discreta, sem caixa; a referência só em falha do sistema. */
export function ErroDeAcesso({ erro }: { erro: ErroPadrao }) {
  return (
    <p id="erro-geral" role="alert" className="text-sm text-nao-conforme">
      {erro.mensagem}
      {FALHA_DO_SISTEMA.has(erro.codigo) && erro.rastreioId && (
        <span className="mt-0.5 block text-xs text-texto-3">
          Referência para o suporte: {erro.rastreioId}
        </span>
      )}
    </p>
  );
}
