import { headers } from "next/headers";

/** Endereço público do sistema (protocolo e host da requisição), para montar links enviados ao cliente. */
export async function enderecoDoSistema(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3170";
  const protocolo =
    h.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}
