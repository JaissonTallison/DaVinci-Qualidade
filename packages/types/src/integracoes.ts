/** Configuração das integrações de uma empresa (framework). O envio/conexão real fica nos adaptadores. */
import { z } from 'zod';

/** Webhook de saída: avisa um endereço externo quando algo acontece (o envio em si vem depois). */
export interface ConfigWebhook {
  url: string | null;
  ativo: boolean;
}

/**
 * Config que a tela recebe: NUNCA traz segredo, só o que é público (URLs, flags). Cada provedor
 * ganha o seu campo aqui conforme a estrutura cresce (smtp, whatsapp, powerbi, sso, nuvem…).
 */
/** Provedor de modelo de IA da empresa. A chave fica cifrada e nunca é devolvida à tela. */
export const PROVEDORES_DE_IA = {
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
} as const;
export type ProvedorDeIa = keyof typeof PROVEDORES_DE_IA;

export interface ConfigIa {
  provedor: ProvedorDeIa | null;
  /** Há uma chave guardada? A chave em si nunca sai do backend. */
  temChave: boolean;
}

export interface ConfigDeIntegracoes {
  webhook: ConfigWebhook;
  ia: ConfigIa;
}

export const CONFIG_DE_INTEGRACOES_PADRAO: ConfigDeIntegracoes = {
  webhook: { url: null, ativo: false },
  ia: { provedor: null, temChave: false },
};

export const salvarIaSchema = z.object({
  provedor: z.enum(['claude', 'openai', 'gemini']),
  /** Opcional: a chave só é trocada quando vier preenchida (deixe em branco para manter). */
  chave: z.string().trim().max(200).optional(),
});
export type SalvarIa = z.infer<typeof salvarIaSchema>;

export const salvarWebhookSchema = z
  .object({
    ativo: z.boolean().default(false),
    url: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((u) => (u ? u : undefined)),
  })
  .refine((d) => !d.ativo || (!!d.url && /^https:\/\//i.test(d.url)), {
    message: 'Para ativar, informe uma URL https válida.',
    path: ['url'],
  });
export type SalvarWebhook = z.infer<typeof salvarWebhookSchema>;
