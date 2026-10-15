/**
 * UUID versão 7 (RFC 9562): 48 bits de tempo (ms) + 74 bits aleatórios.
 * Ordenado pelo tempo de criação: índices do Postgres ficam compactos e
 * rápidos, e não há colisão entre serviços ou empresas.
 */
export function uuidv7(agora: number = Date.now()): string {
  const bytes = new Uint8Array(16);
  globalThis.crypto.getRandomValues(bytes);
  // 48 bits de timestamp em milissegundos (big-endian)
  let ts = agora;
  for (let i = 5; i >= 0; i--) {
    bytes[i] = ts % 256;
    ts = Math.floor(ts / 256);
  }
  bytes[6] = (bytes[6]! & 0x0f) | 0x70; // versão 7
  bytes[8] = (bytes[8]! & 0x3f) | 0x80; // variante RFC 9562
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(
    '',
  );
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(valor: unknown): valor is string {
  return typeof valor === 'string' && UUID.test(valor);
}
