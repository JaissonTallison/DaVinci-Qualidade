# @davinci/auditorias

**Camada:** Domínio (registros do sistema de gestão: QSSMA e ESG)
**Responsabilidade:** auditorias do planejamento ao relatório, kit pré-auditoria e bancos de apoio (roteiros, evidências, modelos de NC, prompts, auditores).

| Item          | Valor                                           |
| ------------- | ----------------------------------------------- |
| Fila RabbitMQ | `davinci.auditorias`                            |
| Banco         | `davinci_auditorias` (usuário `svc_auditorias`) |
| HTTP          | nenhum: só mensagens, via gateway               |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/auditorias
curl localhost:3171/health/services
```
