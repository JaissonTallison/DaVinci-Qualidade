# @davinci/identidade

**Camada:** Plataforma (transversal: usado por todos os módulos)
**Responsabilidade:** empresas e filiais (multiempresa), usuários, perfis e permissões; base da autenticação no gateway.

| Item          | Valor                                           |
| ------------- | ----------------------------------------------- |
| Fila RabbitMQ | `davinci.identidade`                            |
| Banco         | `davinci_identidade` (usuário `svc_identidade`) |
| HTTP          | nenhum: só mensagens, via gateway               |

O que este serviço faz e o que **não** faz, eventos publicados e consumidos:
[docs/02-arquitetura/dominios.md](../../docs/02-arquitetura/dominios.md).

```bash
pnpm turbo run dev --filter=@davinci/api-gateway --filter=@davinci/identidade
curl localhost:3171/health/services
```
