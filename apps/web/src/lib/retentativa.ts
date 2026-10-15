/**
 * Logo depois de o sistema subir ou ser atualizado, a primeira chamada de uma ação pode voltar com "An unexpected
 * response was received from the server" (o servidor ainda compilando, ou a página aberta antes da atualização).
 * Tenta mais uma vez após uma pausa curta; se falhar de novo, o erro segue para a tela de erro, que recarrega a página.
 */
export const ehRespostaInesperada = (erro: unknown) =>
  erro instanceof Error &&
  /unexpected response was received from the server|Failed to find Server Action/i.test(
    erro.message,
  );

export function comRetentativa<E, D>(
  acao: (estado: E, dados: D) => Promise<E>,
): (estado: E, dados: D) => Promise<E> {
  return async (estado, dados) => {
    try {
      return await acao(estado, dados);
    } catch (erro) {
      if (!ehRespostaInesperada(erro)) throw erro;
      await new Promise((r) => setTimeout(r, 1500));
      return acao(estado, dados);
    }
  };
}
