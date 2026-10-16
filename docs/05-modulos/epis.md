# Controle de EPIs

> **Status:** em construção · **Serviço:** `seguranca` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (Controle de EPIs) e NR-6 (Equipamento de Proteção Individual), itens 6.6.1 (deveres do empregador: fornecer EPI com CA, registrar o fornecimento, substituir quando danificado). Regras decididas por nós (decisão Q9).

O catálogo guarda cada EPI com o seu **Certificado de Aprovação (CA)**. A entrega registra quem recebeu, o quê, quando e por quê. A **ficha de EPI** de cada funcionário é a lista dessas entregas, que é o registro que a NR-6 pede.

---

## 1. Regras

| Regra                                                                                                                         | Por quê                                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **Só se entrega EPI com CA válido na data da entrega**                                                                        | NR-6: o EPI só pode ser posto à venda ou utilizado com o CA. CA vencido recusa a entrega e aponta a data de vencimento |
| **Só funcionário ativo recebe EPI.** O `seguranca` confere no `codex` (dono do cadastro) e guarda nome e matrícula na entrega | A ficha continua mostrando a pessoa mesmo depois de desligada                                                          |
| **Próxima troca = entrega + vida útil (dias)**, quando o EPI tem vida útil. Passou da data sem devolução: **troca vencida**   | Substituição periódica (ex.: protetor auricular de espuma)                                                             |
| Devolução registra a data (não anterior à entrega) e encerra a entrega                                                        | O EPI saiu do uso; não vence mais                                                                                      |
| Entregas não se apagam nem se editam; registro errado é **anulado** com motivo                                                | A ficha é documento legal                                                                                              |
| EPI do catálogo é inativado, não apagado; inativo sai da escolha na entrega                                                   | As entregas antigas continuam mostrando o EPI                                                                          |
| CA que vence em até 30 dias aparece no resumo                                                                                 | Dá tempo de comprar o lote com CA novo                                                                                 |

## 2. Telas

- **Segurança do Trabalho › Catálogo de EPIs**: cadastro, edição do CA (vale para as próximas entregas) e inativação.
- **Segurança do Trabalho › Entregas de EPI**: todas as entregas, com filtro por EPI e situação, e o resumo (trocas vencidas, sem termo, CAs vencendo).
- **Cadastros › Funcionários › (pessoa)**: a ficha de EPI, com registrar entrega, devolver e anular (gestor).

## 3. Campos

**EPI:** nome (ex.: Luva de vaqueta), número do CA, validade do CA, vida útil em dias (opcional) e situação.

**Entrega:** funcionário, EPI, quantidade, data, motivo (primeira entrega, troca por desgaste, troca periódica, perda, dano), termo assinado (sim ou não), observação, devolução (data) e anulação (motivo).

## 4. Ainda não feito

- [x] Ficha de EPI com o termo para assinar ([emergência e documentos](emergencia.md))
- [x] EPIs obrigatórios por função (ligado ao PGR) e a conformidade do funcionário ([competências](competencias.md))
- [ ] Baixa no estoque do almoxarifado
