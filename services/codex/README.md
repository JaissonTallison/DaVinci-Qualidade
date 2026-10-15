# @davinci/codex

**Camada:** Plataforma (transversal: usado por todos os módulos)
**Responsabilidade:** dados mestres (_master data_) compartilhados por todos os módulos: parceiros de negócio (clientes e fornecedores), produtos, materiais e centros de custo.

| Item          | Valor                                 |
| ------------- | ------------------------------------- |
| Fila RabbitMQ | `davinci.codex`                       |
| Banco         | `davinci_codex` (usuário `svc_codex`) |
| HTTP          | nenhum: só mensagens, via gateway     |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/codex
curl localhost:3171/health/services
```
