# Acidentes e indicadores de SST

> **Status:** em construção · **Serviço:** `seguranca` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (grupo Segurança), ISO 45001:2018 cláusula 10.2, NBR 14280 (cadastro de acidente do trabalho) e Lei 8.213/1991 art. 22 (CAT). Regras decididas por nós (decisão Q9).

Todo acidente, incidente e quase-acidente é registrado, investigado e encerrado com as causas. Os indicadores (taxa de frequência, taxa de gravidade e dias sem acidente) saem dos registros e das horas trabalhadas lançadas por mês. Ninguém digita indicador.

---

## 1. Tipos

| Tipo                     | O que é                                                                             | Entra na TF e na TG |
| ------------------------ | ----------------------------------------------------------------------------------- | ------------------- |
| Acidente com afastamento | Lesão que afasta a pessoa do trabalho por pelo menos um dia além do dia do acidente | Sim                 |
| Acidente sem afastamento | Lesão sem afastamento (atendimento e retorno no mesmo dia)                          | Não                 |
| Incidente                | Evento sem lesão, com dano material ou ambiental                                    | Não                 |
| Quase-acidente           | Evento que poderia ter causado lesão e não causou                                   | Não                 |

## 2. Ciclo de vida

```text
  REGISTRADO ── iniciar investigação ──▶ EM INVESTIGAÇÃO ── concluir ──▶ CONCLUÍDO
       └──────────────── cancelar (com motivo) ─────────────────┘  ▶ CANCELADO
```

| Regra                                                                                            | Por quê                                                                          |
| ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Acidente (com ou sem afastamento) **exige a CAT** para concluir a investigação                   | Lei 8.213 art. 22: toda lesão por acidente de trabalho gera CAT                  |
| **CAT atrasada** é sinalizada: acidente sem CAT depois do primeiro dia útil seguinte ao acidente | Prazo legal da CAT (feriados não são considerados; a data limite é conservadora) |
| Concluir a investigação exige as **causas** e as **medidas**                                     | ISO 45001 10.2: investigar a causa e agir sobre ela                              |
| Acidente com afastamento **exige os dias perdidos** (ao menos 1)                                 | É a base da taxa de gravidade                                                    |
| O acidente oferece "Abrir NC" no Qualidade, já preenchida, com origem Acidente                   | O tratamento (ação corretiva e eficácia) segue o ciclo da NC                     |
| Data no futuro é recusada; nada é apagado (cancelar exige motivo)                                | Registro legal                                                                   |

## 3. Indicadores (NBR 14280)

```latex
TF = \frac{\text{acidentes com afastamento} \times 1\,000\,000}{\text{horas-homem trabalhadas}} \qquad TG = \frac{(\text{dias perdidos} + \text{dias debitados}) \times 1\,000\,000}{\text{horas-homem trabalhadas}}
```

- As **horas-homem trabalhadas** são lançadas por mês (competência `AAAA-MM`). Sem horas lançadas no período, a TF e a TG ficam "sem dados", nunca zero.
- **Dias debitados** (NBR 14280, morte ou incapacidade permanente) são informados no acidente, quando houver.
- **Dias sem acidente:** dias desde o último acidente com afastamento não cancelado.
- Acidentes cancelados não contam.

## 4. Ainda não feito

- [ ] Acidentado escolhido do cadastro de funcionários (`codex`); por enquanto é texto
- [ ] EPIs, PGR, permissão de trabalho, CIPA/DDS/APR, emergência e terceiros
- [ ] Testemunhas e investigação em formato estruturado (5 porquês, árvore de causas)
