/** Chaves de API da empresa, para integrações externas lerem e gravarem no DaVinci. */
import { z } from 'zod';
import { texto } from './validadores.js';

export interface ChaveDeApi {
  id: string;
  nome: string;
  prefixo: string;
  criadaPor: string | null;
  criadaEm: string;
  ultimoUso: string | null;
  revogada: boolean;
}
export const novaChaveSchema = z.object({
  nome: texto('o nome da integração', 80, 3),
});
export interface ChaveCriada extends ChaveDeApi {
  /** Mostrada uma única vez. */
  chave: string;
}
