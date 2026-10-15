# Calibração

> **Status:** em construção · **Serviço:** `qualidade` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (Calibração) e ISO 9001:2015 cláusula 7.1.5 (recursos de monitoramento e medição). Regras decididas por nós (decisão Q9).

Instrumento que mede sem calibração válida invalida a inspeção que dependeu dele. Aqui ficam os instrumentos, o histórico de calibrações e a situação de cada um, calculada sozinha: ninguém precisa lembrar de marcar "vencido".

---

## 1. Regras

| Regra                                                                                                                                              | Por quê                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **A situação é calculada**, nunca digitada: sem calibração, em dia, vence em até 30 dias, vencido ou reprovado                                     | O vencimento muda com o calendário; um status digitado fica errado no dia seguinte                                   |
| **Próxima calibração = data da última + frequência (meses)**. Fim de mês é respeitado: 31/01 + 1 mês = 28/02 (ou 29)                               | Calendário civil, não "30 dias"                                                                                      |
| **Calibração reprovada bloqueia o instrumento** até uma nova calibração aprovada                                                                   | ISO 9001 7.1.5.2: instrumento inadequado não pode ser usado, e o efeito nas medições anteriores precisa ser avaliado |
| Reprovada oferece "Abrir NC", com origem Calibração                                                                                                | Avaliar as medições feitas com o instrumento é tratamento de NC                                                      |
| **O histórico não se edita.** Calibração registrada por engano é anulada com motivo e sai das contas                                               | É evidência de auditoria                                                                                             |
| Calibração com data no futuro é recusada; data anterior à última registrada é aceita (lançamento atrasado), e a situação usa sempre a mais recente | Lançar o histórico antigo de um instrumento é comum na implantação                                                   |
| Instrumento fora de uso sai dos alertas, sem perder o histórico                                                                                    | Instrumento aposentado não vence                                                                                     |

## 2. Campos

**Instrumento:** TAG (única na empresa, ex.: `PAQ-0042`), descrição, fabricante, modelo, número de série, local, responsável, faixa de medição, critério de aceitação (ex.: erro máximo ± 0,02 mm), frequência de calibração em meses (1 a 60) e situação de uso (em uso ou fora de uso).

**Calibração:** data, laboratório, número do certificado, resultado (aprovada ou reprovada), erro ou incerteza encontrados, observação, custo (R$).

## 3. Ainda não feito

- [ ] Anexar o certificado em PDF (serviço `plataforma`)
- [ ] Ligar a inspeção ao instrumento usado nela
- [ ] Aviso de calibração vencendo (painel de vencimentos, serviço `paineis`)
