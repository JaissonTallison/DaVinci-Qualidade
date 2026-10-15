# @davinci/qualidade

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** controle de produto e processo: inspeções, checklists, não conformidades, planos de ação, rastreabilidade e calibração.

| Item          | Valor                                         |
| ------------- | --------------------------------------------- |
| Fila RabbitMQ | `davinci.qualidade`                           |
| Banco         | `davinci_qualidade` (usuário `svc_qualidade`) |
| HTTP          | nenhum: só mensagens, via gateway             |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/qualidade
curl localhost:3171/health/services
```
