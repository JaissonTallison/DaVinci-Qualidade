# Deploy no Railway

> **Data:** 15/10/2026 · Projeto Railway `DaVinci Qualidade` (`cfe1cafe…`), ambiente `production`. Mesmo modelo da DaVinci Finance.

Endereço: **web** https://davinciweb-production.up.railway.app. O gateway não tem domínio público: a web fala com ele pela
rede interna (o navegador nunca chama a API direto).

## Serviços

Todos partem da raiz do monorepo (Root Directory vazio), da branch `main`, com o mesmo `infra/docker/servico.Dockerfile`
(`turbo prune <PACOTE> --docker`). As configurações de cada um (Dockerfile, pastas observadas, migração antes do deploy,
reinício, healthcheck) estão em `infra/railway/<serviço>.json` e são **aplicadas pela API do Railway**
(`serviceInstanceUpdate`); mudou um desses arquivos, aplique de novo. A API não aceita mais o campo `builder`: o caminho do
Dockerfile já basta.

| Serviço                                                                                                                                      | Domínio público  | Pre-deploy                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------- |
| `@davinci/web`                                                                                                                               | ✅               | — (healthcheck em `/entrar`)                              |
| `@davinci/api-gateway`                                                                                                                       | ❌               | —                                                         |
| `identidade`, `plataforma`, `codex`, `integracoes`, `paineis`, `qualidade`, `auditorias`, `sgi`, `servicos`, `seguranca`, `ambiental`, `esg` | ❌ (só RabbitMQ) | `pnpm --filter @davinci/<nome> db:migrate`                |
| `Postgres`                                                                                                                                   | ❌               | banco gerenciado do Railway                               |
| `RabbitMQ`                                                                                                                                   | ❌               | imagem `rabbitmq:4-alpine`, volume em `/var/lib/rabbitmq` |

## Bancos

Um banco e um usuário por serviço, como no local (`infra/postgres/init`), com senha forte própria. O Postgres não tem acesso
público: abra um proxy TCP temporário, rode o script e apague o proxy.

```bash
PG_ADMIN_URL=<url do postgres pelo proxy> PG_SENHAS='{"qualidade":"…",…}' node scripts/railway-bancos.mjs
```

`DATABASE_URL`: `postgresql://svc_<nome>:<senha>@${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/davinci_<nome>`.

## Variáveis

Em todos: `NODE_ENV=production` e `PACOTE=@davinci/<nome>` (variável de build do Dockerfile). Menos na web:
`RABBITMQ_URL=amqp://davinci:<senha>@${{RabbitMQ.RAILWAY_PRIVATE_DOMAIN}}:5672`.

| Serviço       | Variáveis próprias                                                                                                                                                                                    |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `web`         | `PORT=3170`, `DAVINCI_API_URL=http://${{@davinci/api-gateway.RAILWAY_PRIVATE_DOMAIN}}:3171`. Para Microsoft/Google: `APP_URL` e os `*_CLIENT_ID`/`*_CLIENT_SECRET` (docs/05-modulos/identidade.md §3) |
| `api-gateway` | `PORT=3171`, `JWT_CHAVE_PUBLICA`                                                                                                                                                                      |
| `identidade`  | `JWT_CHAVE_PRIVADA`, `CRIPTOGRAFIA_CHAVE`, `APP_URL`; para Microsoft/Google, `MICROSOFT_CLIENT_ID` e `GOOGLE_CLIENT_ID`                                                                               |
| `integracoes` | `INTEGRACOES_CHAVE`, `NFE_PROVEDOR=simulado`                                                                                                                                                          |
| `paineis`     | `AVISOS_AUTOMATICOS=nao` e `APP_URL`: o e-mail está desligado por enquanto                                                                                                                            |
| `plataforma`  | E-mail desligado. Ao ligar: o Railway bloqueia SMTP nos planos menores; usar provedor por API HTTP (ex.: Brevo) e tirar o `AVISOS_AUTOMATICOS`                                                        |
| `RabbitMQ`    | `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS`, `RABBITMQ_NODENAME=rabbit@localhost` (nome fixo: sem ele as filas do volume se perdem a cada deploy)                                                |

As chaves de produção foram geradas só para produção e estão apenas nas variáveis do Railway: **guarde uma cópia num
cofre de senhas**.

## Primeiro acesso

O instalador do Identidade (`dist/instalar.js`) roda contra o banco de produção pelo proxy temporário e cria a empresa
provisória, os perfis padrão e o administrador, com senha provisória trocada no primeiro acesso. Os dados da empresa são
ajustados depois na tela da empresa.

## Armadilhas

- **Branch:** o Railway publica a `main`. Trabalho em branch só vai ao ar depois do merge.
- **Pastas observadas:** cada serviço observa a própria pasta, `packages/`, o lockfile, `turbo.json` e `infra/docker/`.
- **Endereço interno:** use `${{<serviço>.RAILWAY_PRIVATE_DOMAIN}}`; não muda ao renomear o serviço.
- **Pre-deploy sem shell:** o Railway roda o comando sem shell; `cd pasta && …` não funciona.
