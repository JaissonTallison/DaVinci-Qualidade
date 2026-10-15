# Histórico de mudanças

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda mudança entra em **Não lançado** no mesmo PR.

## [Não lançado]

### Adicionado

- Não conformidades no serviço `qualidade`: abertura com numeração `NC-AAAA-NNN`, ciclo aberta → em tratamento → em verificação → encerrada, verificação de eficácia com ciclos, cancelamento com motivo, lista com filtros e resumo. Rotas em `/nao-conformidades` ([módulo](docs/05-modulos/nao-conformidades.md)).
- `apps/web` (Next.js 16, porta 3170): login, código de 2 etapas, troca da senha inicial, casca com menu dos grupos do QSSMA (filtrado por módulo e permissão) e as telas de Não conformidades: lista, abertura e detalhe com o ciclo de tratamento.
- `packages/tokens`: cores, tipografia (família Source), cantos e sombras do padrão da Qualidade, com o tema do Tailwind zerado.
- ESLint do web recusa degradê, cor solta, canto e sombra grandes, vidro fosco, animação decorativa, emoji e as fontes Inter, Geist, Manrope, Sora e Poppins.
- Checagem que recusa migração com esquema `"public"` fixo (`scripts/conferir-migracoes.mjs`, roda no `pnpm lint` e no CI).

### Corrigido

- Chaves estrangeiras da migração do `codex` apontavam para `"public"`, o que quebrava os testes de integração de parceiros.

## 0.1.0 — 15/10/2026

- Estrutura inicial: gateway e 12 microsserviços no padrão da DaVinci Finance, kit de marca, padrão de interface e regras contra vibecode.
