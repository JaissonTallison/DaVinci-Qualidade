import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * TOTP (RFC 6238), o código de 6 dígitos dos aplicativos autenticadores
 * (Google Authenticator, Microsoft Authenticator, 1Password…). Implementado com o crypto do Node.
 */
export const PASSO_SEGUNDOS = 30;
export const DIGITOS = 6;
/** Aceita o código do passo anterior e do seguinte (relógio do celular adiantado/atrasado). */
const JANELA = 1;

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32(bytes: Buffer): string {
  let bits = 0;
  let valor = 0;
  let saida = '';
  for (const b of bytes) {
    valor = (valor << 8) | b;
    bits += 8;
    while (bits >= 5) {
      saida += ALFABETO[(valor >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) saida += ALFABETO[(valor << (5 - bits)) & 31];
  return saida;
}

export function deBase32(texto: string): Buffer {
  const limpo = texto.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let valor = 0;
  const bytes: number[] = [];
  for (const c of limpo) {
    valor = (valor << 5) | ALFABETO.indexOf(c);
    bits += 5;
    if (bits >= 8) {
      bytes.push((valor >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

/** Segredo novo: 20 bytes (160 bits), em base32. */
export const novoSegredo = () => base32(randomBytes(20));

export function codigoNoPasso(
  segredo: Buffer,
  passo: number,
  digitos = DIGITOS,
): string {
  const contador = Buffer.alloc(8);
  contador.writeBigUInt64BE(BigInt(passo));
  const hmac = createHmac('sha1', segredo).update(contador).digest();
  const deslocamento = hmac[hmac.length - 1]! & 0xf;
  const numero = (hmac.readUInt32BE(deslocamento) & 0x7fffffff) % 10 ** digitos;
  return String(numero).padStart(digitos, '0');
}

export const passoAtual = (agora = Date.now()) =>
  Math.floor(agora / 1000 / PASSO_SEGUNDOS);

/**
 * Confere o código e devolve o PASSO em que ele vale (para impedir reuso), ou null.
 * `ultimoPassoUsado`: um código já aceito não vale de novo (proteção contra repetição).
 */
export function conferirCodigo(
  segredoBase32: string,
  codigo: string,
  ultimoPassoUsado: number | null,
  agora = Date.now(),
): number | null {
  if (!/^\d{6}$/.test(codigo)) return null;
  const segredo = deBase32(segredoBase32);
  const atual = passoAtual(agora);
  for (let d = -JANELA; d <= JANELA; d++) {
    const passo = atual + d;
    if (ultimoPassoUsado !== null && passo <= ultimoPassoUsado) continue;
    const esperado = codigoNoPasso(segredo, passo);
    if (timingSafeEqual(Buffer.from(esperado), Buffer.from(codigo)))
      return passo;
  }
  return null;
}

/** Endereço que vira QR Code: o aplicativo lê emissor, conta e segredo. */
export function enderecoOtpauth(
  segredo: string,
  conta: string,
  emissor = 'DaVinci Qualidade',
): string {
  const rotulo = encodeURIComponent(`${emissor}:${conta}`);
  return `otpauth://totp/${rotulo}?secret=${segredo}&issuer=${encodeURIComponent(emissor)}&algorithm=SHA1&digits=${DIGITOS}&period=${PASSO_SEGUNDOS}`;
}
