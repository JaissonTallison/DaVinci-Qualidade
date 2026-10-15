# DaVinci Qualidade

Sistema de gestão da qualidade em **microsserviços**, com a mesma estrutura da DaVinci Finance: monorepo pnpm + Turborepo, front-end Next.js, API Gateway e serviços NestJS, comunicação por RabbitMQ e um banco Postgres por serviço.

## Estrutura

```text
apps/        api-gateway (NestJS) → 3171 · web (Next.js, a criar) → 3170
services/    12 microsserviços NestJS, cada um com fila RabbitMQ e banco próprios
  plataforma:   identidade/  codex/  integracoes/  plataforma/
  domínio:      qualidade/  auditorias/  sgi/  servicos/  seguranca/  ambiental/  esg/
  inteligência: paineis/
packages/    pacotes compartilhados (@davinci/*)
infra/       infraestrutura local (Postgres)
scripts/     automações
docs/        documentação
```

## Pré-requisitos

- Node.js 24 (`nvm use`)
- pnpm 11
- Docker com Compose

## Como rodar

```bash
pnpm install
pnpm env:criar      # cria os .env (raiz, apps e serviços) a partir dos .env.example
pnpm infra:up       # RabbitMQ + Postgres + Mailpit (aguarda ficarem saudáveis)
pnpm db:migrate     # tabelas dos 12 serviços
pnpm identidade:instalar   # chaves de login, empresa, perfis e administrador (mostra a senha UMA vez)
pnpm dev            # gateway + 12 serviços
```

Com login, `GET localhost:3171/health/services` mostra os 12 serviços com o banco de cada um.

## Antes de contribuir

Leia o [AGENTS.md](AGENTS.md). Em resumo: a interface **não pode ter cara de IA** ([interface.md](docs/04-design/interface.md)) e o código **não pode ser vibecode** ([sem-vibecode.md](docs/01-engenharia/sem-vibecode.md)).

## Documentação

| Documento                                          | Assunto                                                    |
| -------------------------------------------------- | ---------------------------------------------------------- |
| [Interface](docs/04-design/interface.md)           | Padrão visual: tipografia, cores, layout, o que é proibido |
| [Sem vibecode](docs/01-engenharia/sem-vibecode.md) | Como o código entra no projeto                             |
| [Decisões](docs/02-arquitetura/decisoes.md)        | Registro das decisões de arquitetura e produto             |
| [Logos](docs/04-design/logos.md)                   | Kit de marca e como regenerar                              |

## Variáveis de ambiente

O `.env` da raiz configura a infraestrutura do `compose.yaml`. Cada app e serviço terá o próprio `.env`. Nenhum `.env` é versionado: só os `.env.example`.

| Variável                                   | Padrão                | Uso                                        |
| ------------------------------------------ | --------------------- | ------------------------------------------ |
| `POSTGRES_USER` · `POSTGRES_PASSWORD`      | `davinci` / `davinci` | Superusuário do Postgres local             |
| `POSTGRES_PORTA`                           | `5550`                | Porta do Postgres no host                  |
| `RABBITMQ_USUARIO` · `RABBITMQ_SENHA`      | `davinci` / `davinci` | Usuário do RabbitMQ                        |
| `RABBITMQ_PORTA` · `RABBITMQ_PAINEL_PORTA` | `5551` · `5552`       | AMQP e painel web                          |
| `SMTP_PORTA` · `MAILPIT_PORTA`             | `5553` · `5554`       | SMTP de desenvolvimento e caixa de entrada |

## Portas locais

| Serviço                         | Porta                        |
| ------------------------------- | ---------------------------- |
| Web                             | 3170                         |
| API Gateway                     | 3171                         |
| Postgres                        | 5550                         |
| RabbitMQ (AMQP)                 | 5551                         |
| Painel do RabbitMQ              | 5552 (`davinci` / `davinci`) |
| Mailpit SMTP / caixa de entrada | 5553 / 5554                  |
