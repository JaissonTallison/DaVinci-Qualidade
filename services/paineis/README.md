# @davinci/paineis

**Camada:** Inteligência (lê de todos, não grava em ninguém)
**Responsabilidade:** dashboard de vencimentos e relatórios em PDF do QSSMA, lidos dos outros serviços (não grava em nenhum).

| Item          | Valor                                     |
| ------------- | ----------------------------------------- |
| Fila RabbitMQ | `davinci.paineis`                         |
| Banco         | `davinci_paineis` (usuário `svc_paineis`) |
| HTTP          | nenhum: só mensagens, via gateway         |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/paineis
curl localhost:3171/health/services
```
