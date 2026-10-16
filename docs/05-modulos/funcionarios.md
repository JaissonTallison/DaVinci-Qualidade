# Funcionários, setores e funções

> **Status:** em construção · **Serviço:** `codex` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (a Segurança cruza funcionários, exames, treinamentos e EPIs) e decisão Q3 (o cadastro mora no `codex`, sem depender de um RH externo).

Quem trabalha na empresa, em qual setor e em qual função. É a base da Segurança do Trabalho: EPI é entregue a um funcionário, o risco é da função, o exame e o treinamento são da pessoa. Aqui fica só o cadastro. O que é de SST (EPIs, exames, treinamentos) fica no serviço `seguranca`, que consulta o `codex`.

---

## 1. Regras

| Regra                                                                                                                          | Por quê                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| **Matrícula e CPF são únicos na empresa**                                                                                      | São como o RH e o eSocial identificam a pessoa                      |
| CPF é validado pelos dígitos verificadores                                                                                     | Erro de digitação vira outra pessoa                                 |
| Funcionário **não se apaga: é desligado**, com data e motivo. Desligado sai das escolhas (EPI, treinamento) e o histórico fica | A ficha de EPI e os acidentes precisam continuar mostrando a pessoa |
| Desligamento não pode ser anterior à admissão                                                                                  | Coerência das datas                                                 |
| Readmitir devolve o funcionário à lista de ativos, mantendo a matrícula                                                        | Volta de afastamento ou recontratação                               |
| Setor e função não se apagam: são inativados e saem das escolhas. O nome é único na empresa                                    | O funcionário antigo continua mostrando o setor em que estava       |
| Funcionário ativo só pode ser ligado a setor e função ativos                                                                   | Evita cadastrar pessoa num setor extinto                            |

## 2. Campos

**Funcionário:** matrícula, nome, CPF, setor, função, data de admissão, e-mail e telefone (opcionais), data e motivo do desligamento.

**Setor:** nome. **Função:** nome e CBO (Classificação Brasileira de Ocupações, opcional, 6 dígitos).

## 3. Ainda não feito

- [ ] Importar funcionários por planilha
- [ ] Integração com um RH externo (adaptador no `integracoes`)
- [x] Exames (ASO) e treinamentos ([módulo](exames-e-treinamentos.md)) e competências por função ([módulo](competencias.md))
