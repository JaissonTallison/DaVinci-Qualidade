# @davinci/integracoes

**Camada:** Plataforma (transversal: usado por todos os módulos)
**Responsabilidade:** adaptadores para sistemas externos: bancos (CNAB, extratos OFX/Open Finance), API Pix e outros parceiros.

| Item          | Valor                                             |
| ------------- | ------------------------------------------------- |
| Fila RabbitMQ | `davinci.integracoes`                             |
| Banco         | `davinci_integracoes` (usuário `svc_integracoes`) |
| HTTP          | nenhum: só mensagens, via gateway                 |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/integracoes
curl localhost:3171/health/services
```
