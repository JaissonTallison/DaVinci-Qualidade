import { headers } from "next/headers";

/**
 * Lê um cookie da requisição pelo cabeçalho `cookie`.
 *
 * Por que não `cookies().get()`: no Next 16.4 em modo dev, ler `cookies()` numa Server Action
 * que devolve erro (sem redirecionar) e depois renderizar a página dispara um erro interno do
 * Next ("Invariant: … does not match either `cookies` or `mutableCookies`"). Para LER, o
 * cabeçalho dá o mesmo resultado (o proxy já atualiza esse cabeçalho quando renova a sessão).
 * `cookies()` continua sendo usado para GRAVAR e APAGAR, dentro das ações.
 */
export async function lerCookie(nome: string): Promise<string | undefined> {
  const cabecalho = (await headers()).get("cookie");
  if (!cabecalho) return undefined;
  for (const parte of cabecalho.split(/;\s*/)) {
    const i = parte.indexOf("=");
    if (i > 0 && parte.slice(0, i) === nome)
      return decodeURIComponent(parte.slice(i + 1));
  }
  return undefined;
}
