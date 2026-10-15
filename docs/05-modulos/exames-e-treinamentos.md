# Exames ocupacionais (ASO) e treinamentos

> **Status:** em uso · **Serviço:** `codex` (junto do funcionário) · **Atualizado em:** 15/10/2026
> Referências: NR-7 (PCMSO: exames admissional, periódico, de retorno, de mudança de risco e demissional) e as NRs que exigem treinamento com reciclagem (NR-10, NR-33, NR-35...). Regras decididas por nós (decisão Q9).

## 1. Regras

| Regra                                                                                                                                   | Por quê                                                                           |
| --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Todo ASO tem data do próximo exame, menos o demissional                                                                                 | É o que vence e precisa ser acompanhado                                           |
| Vale o ASO mais recente da pessoa; os antigos ficam como histórico                                                                      | Um periódico novo substitui o anterior                                            |
| Desligado só recebe ASO demissional; só o admissional pode ser anterior à admissão                                                      | O demissional costuma sair depois do desligamento                                 |
| Treinamento do catálogo tem carga horária e validade em meses (em branco: não vence)                                                    | A validade de cada participação é calculada na gravação, respeitando o fim do mês |
| Turma: o mesmo treinamento, na mesma data, para várias pessoas. Se alguém está desligado ou foi admitido depois da data, nada é gravado | Turma pela metade gera ficha errada                                               |
| Mudar a validade no catálogo vale para as próximas turmas                                                                               | As já registradas guardam a validade do dia                                       |
| ASO e participação não se editam: registro errado é anulado com motivo                                                                  | Histórico de saúde e capacitação é documento                                      |
| Vencimentos: só funcionários ativos; vencido no dia seguinte à validade, "vence em breve" até 30 dias antes                             | Mesmo critério da calibração                                                      |

## 2. Telas

- **Cadastros › Funcionários › (pessoa)**: exames (registrar, anular) e treinamentos da pessoa.
- **Cadastros › Treinamentos**: catálogo e registro de turma.
- **Segurança do Trabalho › Vencimentos de ASO e treinamentos**: tudo o que vence, com filtro por situação e tipo. Resumo no início.

## 3. Ainda não feito

- [ ] Treinamentos e exames obrigatórios por função (ligado ao PGR) e a conformidade de cada pessoa
- [ ] Certificado da turma em PDF e lista de presença
- [ ] Aviso por e-mail dos vencimentos
