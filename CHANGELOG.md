# Histórico de mudanças

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda mudança entra em **Não lançado** no mesmo PR.

## [Não lançado]

### Adicionado

- Auditorias no serviço `auditorias` ([módulo](docs/05-modulos/auditorias.md)): planejar (tipo, escopo, normas, equipe), iniciar, registrar constatações (conformidade, NC maior, NC menor, observação, oportunidade de melhoria) com norma, cláusula e evidência, formalizar a constatação de NC como NC no serviço `qualidade` (origem Auditoria, prazo padrão de 30 dias), concluir com conclusão escrita e toda NC formalizada. Rotas em `/auditorias`; telas e grupo próprio no menu.
- `pedir()` em `@davinci/shared`: um serviço pede a outro e espera a resposta, repassando a recusa original (decisão Q10). `hojeEmBrasilia` e `somarDias` passam para `@davinci/shared`.

- Calibração no serviço `qualidade` ([módulo](docs/05-modulos/calibracao.md)): instrumentos com TAG única, histórico de calibrações, situação calculada (sem calibração, em dia, vence em até 30 dias, vencido, reprovado, fora de uso), próxima calibração pela frequência em meses respeitando o fim do mês, reprovada bloqueia até nova aprovada, anulação com motivo no lugar de edição. Rotas em `/instrumentos`; telas de lista, cadastro e detalhe; instrumento reprovado abre a NC já preenchida; o início ganha o resumo de calibração.

- Inspeções no serviço `qualidade` ([módulo](docs/05-modulos/inspecoes.md)): uma tela para inspeções e checklists, com tipo; itens respondidos OK, NOK ou N/A; um NOK reprova; concluir exige tudo respondido e NOK descrito; concluída, vira registro. Modelos de inspeção reaproveitáveis, com itens copiados para cada inspeção. Rotas em `/inspecoes` e `/modelos-de-inspecao`.
- Telas de inspeções e modelos; inspeção reprovada abre a NC já preenchida com os itens NOK, e lista as NCs abertas a partir dela; o início ganha o resumo das inspeções.
- [Armadilhas conhecidas](docs/01-engenharia/armadilhas.md) do projeto.

- Planos de ação no serviço `qualidade` ([módulo](docs/05-modulos/planos-de-acao.md)): tarefas no formato 5W2H, status que segue as tarefas (concluir a última leva a "aguardando eficácia"), verificação de eficácia que pede tarefas novas quando o objetivo não foi alcançado, progresso e prazo calculados, cancelamento de tarefa e de plano com motivo. Rotas em `/planos-de-acao`.
- Telas de planos de ação (lista, criação e detalhe com as ações na linha de cada tarefa); a NC mostra os planos ligados e cria um plano já preenchido; a tela de início ganha o resumo dos planos.
- `pnpm db:generate` de todos os serviços tira sozinho o esquema `"public"` que o drizzle-kit escreve nas chaves estrangeiras.

- Não conformidades no serviço `qualidade`: abertura com numeração `NC-AAAA-NNN`, ciclo aberta → em tratamento → em verificação → encerrada, verificação de eficácia com ciclos, cancelamento com motivo, lista com filtros e resumo. Rotas em `/nao-conformidades` ([módulo](docs/05-modulos/nao-conformidades.md)).
- `apps/web` (Next.js 16, porta 3170): login, código de 2 etapas, troca da senha inicial, casca com menu dos grupos do QSSMA (filtrado por módulo e permissão) e as telas de Não conformidades: lista, abertura e detalhe com o ciclo de tratamento.
- `packages/tokens`: cores, tipografia (família Source), cantos e sombras do padrão da Qualidade, com o tema do Tailwind zerado.
- ESLint do web recusa degradê, cor solta, canto e sombra grandes, vidro fosco, animação decorativa, emoji e as fontes Inter, Geist, Manrope, Sora e Poppins.
- `pnpm dev:tudo`: um comando sobe infraestrutura, migrações, web, gateway e serviços, com os logs no mesmo terminal; `--essencial` sobe só o que as telas usam. Ctrl+C encerra o grupo inteiro de processos.
- Checagem que recusa migração com esquema `"public"` fixo (`scripts/conferir-migracoes.mjs`, roda no `pnpm lint` e no CI).

### Corrigido

- Formulário de ação mostrava um erro antigo depois de outra ação na mesma tela; agora recomeça quando a versão do registro muda.

- `pnpm db:generate --name=<assunto>` repassa o nome ao drizzle-kit (antes, ia parar na checagem e a migração saía com nome aleatório).

- Chaves estrangeiras da migração do `codex` apontavam para `"public"`, o que quebrava os testes de integração de parceiros.

## 0.1.0 — 15/10/2026

- Estrutura inicial: gateway e 12 microsserviços no padrão da DaVinci Finance, kit de marca, padrão de interface e regras contra vibecode.
