# Histórico de mudanças

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda mudança entra em **Não lançado** no mesmo PR.

## [Não lançado]

### Adicionado

- Não conformidades no serviço `qualidade`: abertura com numeração `NC-AAAA-NNN`, ciclo aberta → em tratamento → em verificação → encerrada, verificação de eficácia com ciclos, cancelamento com motivo, lista com filtros e resumo. Rotas em `/nao-conformidades` ([módulo](docs/05-modulos/nao-conformidades.md)).
- Checagem que recusa migração com esquema `"public"` fixo (`scripts/conferir-migracoes.mjs`, roda no `pnpm lint` e no CI).

### Corrigido

- Chaves estrangeiras da migração do `codex` apontavam para `"public"`, o que quebrava os testes de integração de parceiros.

## 0.1.0 — 15/10/2026

- Estrutura inicial: gateway e 12 microsserviços no padrão da DaVinci Finance, kit de marca, padrão de interface e regras contra vibecode.
