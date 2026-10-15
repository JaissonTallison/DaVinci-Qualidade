# @davinci/ambiental

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** meio ambiente (ISO 14001): aspectos e impactos, requisitos legais, licenças e condicionantes, resíduos/MTR, químicos, consumo, GEE e monitoramento.

| Item          | Valor                                         |
| ------------- | --------------------------------------------- |
| Fila RabbitMQ | `davinci.ambiental`                           |
| Banco         | `davinci_ambiental` (usuário `svc_ambiental`) |
| HTTP          | nenhum: só mensagens, via gateway             |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/ambiental
curl localhost:3171/health/services
```
