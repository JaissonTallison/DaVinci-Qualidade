import type { TipoDeAnexo } from '@davinci/types';

/**
 * Confere os primeiros bytes do arquivo com o tipo declarado: um executável renomeado para .pdf é recusado.
 * DOCX e XLSX são ZIP por dentro (PK).
 */
const ASSINATURAS: Record<TipoDeAnexo, (b: Buffer) => boolean> = {
  'application/pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) =>
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) =>
    b.subarray(0, 4).toString('latin1') === 'RIFF' &&
    b.subarray(8, 12).toString('latin1') === 'WEBP',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    ehZip,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ehZip,
};

function ehZip(b: Buffer): boolean {
  return b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04;
}

export function conteudoConfere(tipo: TipoDeAnexo, conteudo: Buffer): boolean {
  return ASSINATURAS[tipo](conteudo);
}
