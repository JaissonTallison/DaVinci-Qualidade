# @davinci/seguranca

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** saúde e segurança do trabalho (ISO 45001 e NRs): acidentes, indicadores SST, PGR, permissões de trabalho, EPIs, CIPA/DDS/APR, emergência e terceiros.

| Item          | Valor                                         |
| ------------- | --------------------------------------------- |
| Fila RabbitMQ | `davinci.seguranca`                           |
| Banco         | `davinci_seguranca` (usuário `svc_seguranca`) |
| HTTP          | nenhum: só mensagens, via gateway             |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/seguranca
curl localhost:3171/health/services
```
