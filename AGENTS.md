# Regras para quem trabalha neste repositório (pessoas e assistentes de IA)

DaVinci Qualidade: sistema de gestão da qualidade (QSSMA + Agenda ESG) em microsserviços. A **estrutura** segue a DaVinci Finance (`../DaVinci-Finance`); o **visual** é próprio.

## Regras que não se negociam

1. **Nada de cara de IA na interface.** Siga [docs/04-design/interface.md](docs/04-design/interface.md): sem degradê, sem emoji, sem cantos grandes, sem card com ícone em círculo, sem Inter/Geist, sem "Bem-vindo de volta!". Toda tela passa pelo checklist da seção 10.
2. **Nada de vibecode.** Siga [docs/01-engenharia/sem-vibecode.md](docs/01-engenharia/sem-vibecode.md): mudança pequena, testada, sem `any`/`@ts-ignore`, sem dependência sem justificativa, sem código que o autor não saiba explicar.
3. **Cada dado tem um dono.** Um serviço só grava no próprio banco; fala com os outros por RabbitMQ (`send` para consulta, `emit` para evento). Ver [docs/02-arquitetura/decisoes.md](docs/02-arquitetura/decisoes.md).
4. **Não copie o DaVinciERP.** O domínio vem dos materiais de referência (documento do QSSMA e Agenda ESG, kit do auditor); as regras são decisões nossas, escritas com teste (decisão Q9).
5. **Português** no domínio, nos textos e nos commits (Conventional Commits).

## Antes de terminar qualquer tarefa

`pnpm turbo run lint typecheck test build` passando, e documentação atualizada se a mudança altera como algo funciona.
