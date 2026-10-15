# @davinci/sgi

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** governança do sistema de gestão: riscos e oportunidades, objetivos da qualidade, análise crítica e gestão de mudanças.

| Item          | Valor                             |
| ------------- | --------------------------------- |
| Fila RabbitMQ | `davinci.sgi`                     |
| Banco         | `davinci_sgi` (usuário `svc_sgi`) |
| HTTP          | nenhum: só mensagens, via gateway |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/sgi
curl localhost:3171/health/services
```
