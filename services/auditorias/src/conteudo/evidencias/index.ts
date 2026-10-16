import type { EvidenciaDaBiblioteca } from '@davinci/types';
import { EVIDENCIAS_DO_ANEXO_A } from './anexo-a-proprias.js';
import { EVIDENCIAS_DO_BANCO } from './banco.js';

const controlesNoBanco = new Set(
  EVIDENCIAS_DO_BANCO.map((e) => e.controle).filter(Boolean),
);

/**
 * Biblioteca de evidências: o banco do material de referência e, nos controles do Anexo A que ele não cobre, a
 * evidência que escrevemos (os 93 controles ficam cobertos).
 */
export const BIBLIOTECA_DE_EVIDENCIAS: EvidenciaDaBiblioteca[] = [
  ...EVIDENCIAS_DO_BANCO,
  ...EVIDENCIAS_DO_ANEXO_A.filter((e) => !controlesNoBanco.has(e.controle)),
];
