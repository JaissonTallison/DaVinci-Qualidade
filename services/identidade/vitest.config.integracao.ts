import { defineConfig } from 'vitest/config';

// Testes de integração: exigem o Postgres local no ar (pnpm infra:up).
export default defineConfig({
  test: {
    globals: true,
    root: './',
    setupFiles: ['./src/teste/sem-rabbitmq.ts'],
    include: ['src/**/*.int-spec.ts'],
    testTimeout: 20_000,
    hookTimeout: 30_000,
  },
});
