# @davinci/servicos

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** qualidade entregue e comprada: ordens de serviço, avaliação de serviços, satisfação do cliente (NPS) e avaliação de fornecedores.

| Item          | Valor                                       |
| ------------- | ------------------------------------------- |
| Fila RabbitMQ | `davinci.servicos`                          |
| Banco         | `davinci_servicos` (usuário `svc_servicos`) |
| HTTP          | nenhum: só mensagens, via gateway           |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/servicos
curl localhost:3171/health/services
```
