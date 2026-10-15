# @davinci/esg

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** Agenda ESG: temas materiais, materialidade, ODS e painel ESG com indicadores lidos dos outros serviços.

| Item          | Valor                             |
| ------------- | --------------------------------- |
| Fila RabbitMQ | `davinci.esg`                     |
| Banco         | `davinci_esg` (usuário `svc_esg`) |
| HTTP          | nenhum: só mensagens, via gateway |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/esg
curl localhost:3171/health/services
```
