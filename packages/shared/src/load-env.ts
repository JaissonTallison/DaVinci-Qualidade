// Import com efeito colateral: deve ser o PRIMEIRO import do main.ts, para que
// o .env esteja carregado antes de qualquer módulo ler process.env.
import { loadEnv } from './env.js';

loadEnv();
