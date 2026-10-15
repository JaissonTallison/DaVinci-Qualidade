/**
 * Peças de validação reaproveitadas pelos contratos (parceiros, empresa…).
 * Mensagens em português, dizendo como corrigir. Uso interno do pacote.
 */
import { z } from 'zod';

export const soDigitos = (v: string) => v.replace(/\D/g, '');
export const chaves = <T extends Record<string, string>>(o: T) =>
  Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];

/** Campo opcional: ausente, vazio ou só espaços vira `null` (tipo de envio continua opcional). */
export function opcional<T extends z.ZodType>(schema: T) {
  return z
    .preprocess(
      (v: z.input<T> | null | undefined) =>
        v === undefined ||
        v === null ||
        (typeof v === 'string' && v.trim() === '')
          ? null
          : v,
      schema.nullable(),
    )
    .optional()
    .transform((v) => v ?? null);
}

export const texto = (rotulo: string, max: number, min = 1) =>
  z
    .string({ error: `Informe ${rotulo}.` })
    .trim()
    .min(
      min,
      min > 1
        ? `Informe ${rotulo} (mínimo ${min} caracteres).`
        : `Informe ${rotulo}.`,
    )
    .max(max, `Use no máximo ${max} caracteres.`);

export const textoOpcional = (max: number) =>
  opcional(z.string().trim().max(max, `Use no máximo ${max} caracteres.`));
export const email = (exemplo = 'financeiro@empresa.com.br') =>
  z.email(`Informe um e-mail válido (ex.: ${exemplo}).`).max(150);
export const telefone = z
  .string()
  .transform(soDigitos)
  .pipe(
    z
      .string()
      .regex(/^\d{10,11}$/, 'Informe o telefone com DDD (10 ou 11 dígitos).'),
  );
export const data = (rotulo: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Informe ${rotulo} completa.`)
    .refine(
      (v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)),
      `Informe ${rotulo} válida.`,
    );
export const lista = <T extends z.ZodType>(
  item: T,
  max: number,
  rotulo: string,
) =>
  z
    .array(item)
    .max(max, `Use no máximo ${max} ${rotulo}.`)
    .optional()
    .transform((v) => v ?? []);
export const enumOpcional = <T extends Record<string, string>>(
  o: T,
  mensagem: string,
) => opcional(z.enum(chaves(o), { error: mensagem }));
