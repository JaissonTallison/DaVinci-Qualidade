# Competências por função

> **Status:** em uso · **Serviços:** `codex` (treinamentos e ASO) e `seguranca` (EPIs) · **Atualizado em:** 16/10/2026
> Referências: NR-1 (PGR: medidas de prevenção por risco), NR-6 (EPI adequado ao risco), NR-7 (PCMSO, ASO periódico) e ISO 9001/45001 cláusula 7.2 (competência). Regras decididas por nós (decisão Q9).

Cada função diz o que exige de quem a ocupa; o sistema mostra quem atende. Cada dado fica com o seu dono: a lista de treinamentos exigidos mora no `codex`, junto do catálogo de treinamentos; a de EPIs mora na `seguranca`, junto do catálogo de EPIs e do PGR.

## 1. Regras

| Regra                                                                                                                                               | Por quê                                                      |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Toda função exige o **ASO em dia** (NR-7), sem precisar marcar                                                                                      | Todo empregado tem PCMSO                                     |
| Treinamentos e EPIs exigidos são escolhidos por função; salvar substitui a lista inteira                                                            | A função muda de exigência como um todo                      |
| EPI exigido pode citar o **risco do PGR** que o justifica                                                                                           | NR-6: o EPI é escolhido pelo risco; a matriz mostra o porquê |
| Situação do requisito: **em dia**, **vence em breve** (até 30 dias), **vencido**, **não tem**                                                       | Mesmo critério dos vencimentos de ASO e calibração           |
| Treinamento: vale o último registro não anulado; sem validade no catálogo, não vence                                                                | O catálogo define a reciclagem                               |
| ASO: vale o mais recente não anulado; a validade é a data do próximo exame                                                                          | Igual ao painel de vencimentos                               |
| EPI: atende quem tem uma entrega **em uso** (não devolvida nem anulada); troca vencida conta como vencido, troca em até 30 dias como vence em breve | A ficha de EPI é a prova de fornecimento                     |
| Pendência = vencido ou não tem. Vence em breve é aviso                                                                                              | Só o que já descumpre pesa                                   |
| Só funcionários ativos entram na matriz                                                                                                             | Desligado não ocupa a função                                 |

## 2. Telas

- **Cadastros › Competências por função**: cada função com o número de requisitos, de pessoas e de pessoas com pendência.
- **Cadastros › Setores e funções › Competências** (por função): matriz pessoas × requisitos e a definição dos treinamentos e EPIs exigidos.
- **Cadastros › Funcionários › (pessoa)**: o que a função exige e a situação de cada item.

## 3. Ainda não feito

- [ ] Pendências de competência no painel de vencimentos e no aviso por e-mail
- [ ] Exigência por setor ou por risco, além da função
