# Planos de Ação

> **Status:** em construção · **Serviço:** `qualidade` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (grupo Qualidade), ISO 9001:2015 cláusulas 6.1 e 10.2, método 5W2H. Regras decididas por nós (decisão Q9).

O plano de ação organiza **o que vai ser feito, por quem e até quando** para tratar uma causa. Ele nasce de uma NC, de uma auditoria, de um risco, da análise crítica ou de uma ideia de melhoria. Cada tarefa do plano segue o 5W2H. O plano termina quando todas as tarefas estão concluídas **e** alguém verifica que o resultado foi alcançado.

---

## 1. Ciclo de vida

```text
                 todas as tarefas concluídas            eficaz
  EM EXECUÇÃO ───────────────────────────────▶ AGUARDANDO EFICÁCIA ─────────▶ ENCERRADO
       ▲         (automático)                        │
       │   reabrir ou incluir tarefa                 │ ineficaz: inclua novas tarefas
       └─────────────────────────────────────────────┘
  cancelar (qualquer status não final; exige motivo) ──▶ CANCELADO
```

| Status                | Significa                                                                |
| --------------------- | ------------------------------------------------------------------------ |
| `em_execucao`         | Há tarefa por concluir                                                   |
| `aguardando_eficacia` | Todas as tarefas concluídas; falta verificar se o objetivo foi alcançado |
| `encerrado`           | Verificado como eficaz. Final                                            |
| `cancelado`           | Não será executado. Final, com motivo                                    |

**Por que assim:**

- **O status segue as tarefas, sem clique a mais.** Concluir a última tarefa leva o plano para "aguardando eficácia". Incluir ou reabrir uma tarefa devolve para "em execução".
- **Concluir tarefas não encerra o plano.** Fazer tudo o que foi planejado não garante o resultado (ISO 9001 10.2.1 d). A verificação de eficácia é um passo próprio, com parecer.
- **Ineficaz não reabre tarefas antigas.** O plano volta para execução e pede tarefas novas: o que foi feito continua registrado como feito.
- **Progresso é calculado:** tarefas concluídas ÷ total. Ninguém digita percentual.
- **Plano vazio não existe.** Ele nasce com ao menos uma tarefa.
- **Nada é apagado.** Plano cancelado guarda o motivo; tarefa que não faz mais sentido é marcada como cancelada, não excluída.

## 2. Campos

**Plano**

| Campo                                                                                                  | Obrigatório | 5W2H    |
| ------------------------------------------------------------------------------------------------------ | ----------- | ------- |
| Número `PA-AAAA-NNN` (automático)                                                                      | —           |         |
| Título                                                                                                 | sim         | O quê   |
| Objetivo: o resultado esperado                                                                         | sim         | Por quê |
| Tipo: Corretiva, Preventiva, Melhoria                                                                  | sim         |         |
| Origem: NC, Auditoria, Risco, Análise crítica, Acidente, Melhoria, Outra                               | sim         |         |
| Referência da origem (ex.: `NC-2026-014`) e, quando a origem é uma NC deste sistema, o vínculo com ela | não         |         |
| Responsável pelo plano                                                                                 | sim         | Quem    |
| Custo previsto (R$)                                                                                    | não         | Quanto  |

**Tarefa** (até 30 por plano)

| Campo                                                                              | Obrigatório | 5W2H   |
| ---------------------------------------------------------------------------------- | ----------- | ------ |
| O que fazer                                                                        | sim         | O quê  |
| Responsável                                                                        | sim         | Quem   |
| Prazo                                                                              | sim         | Quando |
| Onde                                                                               | não         | Onde   |
| Como                                                                               | não         | Como   |
| Situação: pendente, concluída (com data e quem concluiu) ou cancelada (com motivo) | —           |        |

O **prazo do plano** é calculado: o maior prazo entre as tarefas não canceladas. Plano **atrasado** = alguma tarefa pendente com prazo vencido.

## 3. Ligação com a NC

- Na NC, o botão "Criar plano de ação" abre o plano já com origem NC, a referência e o vínculo.
- O detalhe da NC lista os planos ligados a ela, com progresso e status.
- O ciclo da NC não depende do plano: quem decide enviar a NC para verificação é o responsável por ela. O plano ajuda a organizar a execução.

## 4. Ainda não feito

- [ ] Abrir plano a partir de auditoria, risco e análise crítica (quando esses módulos existirem)
- [ ] Evidências anexadas por tarefa
- [ ] Aviso de tarefa vencendo (serviço `plataforma`)
