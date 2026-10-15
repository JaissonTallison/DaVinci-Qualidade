# @davinci/plataforma

**Camada:** Plataforma (transversal: usado por todos os módulos)
**Responsabilidade:** serviços transversais: documentos e anexos, notificações (e-mail, WhatsApp) e trilha de auditoria.

| Item          | Valor                                           |
| ------------- | ----------------------------------------------- |
| Fila RabbitMQ | `davinci.plataforma`                            |
| Banco         | `davinci_plataforma` (usuário `svc_plataforma`) |
| HTTP          | nenhum: só mensagens, via gateway               |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/plataforma
curl localhost:3171/health/services
```
