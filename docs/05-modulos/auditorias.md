# Auditorias

> **Status:** em construção · **Serviço:** `auditorias` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (grupo Auditorias), ISO 19011:2018 (diretrizes para auditoria) e ISO 9001:2015 cláusula 9.2. Material do AuditExpert ainda não lido (acesso pendente). Regras decididas por nós (decisão Q9).

A auditoria é planejada, conduzida e concluída aqui. O que o auditor encontra vira **constatação**; constatação de não conformidade vira **NC** no serviço `qualidade` com um clique, com origem Auditoria e prazo padrão de 30 dias.

---

## 1. Ciclo de vida

```text
  PLANEJADA ── iniciar ──▶ EM ANDAMENTO ── concluir ──▶ CONCLUÍDA
      │                          │          (exige conclusão escrita e
      └──────── cancelar ────────┘           toda NC formalizada)
                    ▼
                CANCELADA
```

| Regra                                                                                                                                                                          | Por quê                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Constatações só são registradas com a auditoria **em andamento**                                                                                                               | Constatação é o que se viu na auditoria, não antes nem depois                                                 |
| Concluir exige a **conclusão** escrita e **toda constatação de NC formalizada**                                                                                                | Na ISO 19011, o relatório traz as constatações e as NCs são registradas para tratamento; NC sem registro some |
| Constatação de NC (maior ou menor) **vira NC com um clique**, no serviço `qualidade`                                                                                           | Cada dado tem um dono: a NC é da Qualidade. A auditoria guarda o número da NC criada                          |
| A NC criada vem com origem Auditoria, referência `AUD-AAAA-NNN`, norma, cláusula, a constatação e a evidência; gravidade: maior = Alta, menor = Média; prazo padrão de 30 dias | Valores do documento de referência; a gravidade pode ser ajustada na própria NC                               |
| Concluída, a auditoria não muda mais                                                                                                                                           | É o registro que vai para a análise crítica                                                                   |
| Cancelar exige motivo; nada é apagado                                                                                                                                          | Rastreabilidade                                                                                               |

## 2. Campos

**Auditoria:** número `AUD-AAAA-NNN`, tipo (interna, externa de certificação, de fornecedor), escopo, normas auditadas (ISO 9001, 14001, 45001, 27001, 28000, 31000, IATF 16949), áreas ou processos, auditor líder, equipe, representante da área auditada, data de início e de fim, conclusão.

**Constatação:** tipo (conformidade, NC maior, NC menor, observação, oportunidade de melhoria), norma, cláusula (ex.: 8.5.1), área, descrição, evidência objetiva e, quando formalizada, o número da NC.

## 3. Formalizar NC entre serviços

O serviço `auditorias` pede ao `qualidade` (fila `davinci.qualidade`, padrão `nao-conformidades.criar`) e espera a resposta. Se o `qualidade` recusar (por exemplo, prazo inválido), o erro volta como veio, com os campos. Se o `qualidade` não responder, nada é gravado na constatação e a pessoa pode tentar de novo.

**Risco conhecido:** se a NC for criada e a gravação do número na constatação falhar logo em seguida, a NC existe sem vínculo. Ela continua achável pela referência `AUD-AAAA-NNN` na lista de NCs. Como os dois serviços não compartilham transação, esse é o custo aceito da separação.

## 4. Ainda não feito

- [ ] Banco de apoio: roteiros de entrevista, biblioteca de evidências, modelos de NC, prompts de IA (conteúdo do AuditExpert)
- [ ] Kit pré-auditoria
- [ ] Cadastro de auditores qualificados (formação, normas, validade)
- [ ] Relatório de auditoria em PDF
