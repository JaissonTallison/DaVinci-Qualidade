# eSocial SST

> **Status:** em uso · **Serviço:** `seguranca` (com dados do `codex`) · **Atualizado em:** 16/10/2026
> Referências: leiautes do eSocial versão S-1.3 (eventos S-2210, S-2220 e S-2240), tabelas 13, 14, 15, 17, 24 e 27 do eSocial, NR-7 e NR-9. Regras decididas por nós (decisão Q9).

O sistema **monta** os três eventos de SST no leiaute oficial e mostra o que falta para cada um. A **assinatura** com o certificado digital ICP-Brasil e o **envio** ficam com o transmissor da empresa (ou do escritório contábil); o número do recibo volta para cá.

## 1. De onde vem cada evento

| Evento                          | Origem                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Pendências conferidas                                    |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **S-2210** CAT                  | Acidente com lesão (não cancelado) + complemento eSocial no acidente: acidentado do cadastro, tipo, horas, local, situação geradora, parte atingida e lateralidade, agente causador, óbito, comunicação à polícia e o atestado (data e hora, internação, duração, natureza da lesão, CID, médico)                                                                                                                                                               | Complemento preenchido                                   |
| **S-2220** ASO                  | ASO do codex (não anulado) desde o início do SST: tipo (admissional 0, periódico 1, retorno 2, mudança de risco 3, demissional 9), resultado (apto e apto com restrição 1, inapto 2), exames com o procedimento da tabela 27, médico com CRM e UF; responsável pelo PCMSO da configuração                                                                                                                                                                       | Médico, CRM, UF do CRM e ao menos um exame               |
| **S-2240** Condições ambientais | Funcionário ativo: setor, **atividades da ordem de serviço da função**, **riscos do PGR ligados à função** com o agente nocivo da tabela 24 e a avaliação (quantitativa com intensidade, limite, unidade e técnica), EPIs exigidos da função pelo CA, declaração sobre os EPIs e o responsável pelos registros ambientais. Sem risco ligado: `09.01.001` (ausência de agente nocivo). Início da condição: a admissão ou o início do SST, o que for mais recente | Agente nocivo em todo risco ligado; atividades descritas |

## 2. Regras

| Regra                                                                                                                        | Por quê                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sem configuração (CNPJ, ambiente, início do SST, médico do PCMSO, responsável ambiental, declaração dos EPIs), nada é gerado | São campos obrigatórios em todos os eventos                                                   |
| Códigos das tabelas são **digitados** com validação de formato (9 dígitos; `00.00.000` na tabela 24; 4 dígitos na tabela 27) | O sistema não embute as tabelas; quem preenche consulta a versão vigente no portal do eSocial |
| Id do evento: `ID` + 1 + CNPJ (14) + data e hora de Brasília + sequencial (5)                                                | Formato do leiaute                                                                            |
| Gerar de novo guarda um evento novo; os anteriores ficam no histórico                                                        | O XML do dia é o que foi enviado                                                              |
| O recibo é registrado à mão depois do envio                                                                                  | A transmissão é fora do sistema                                                               |
| A versão do leiaute fica em `LEIAUTE_ESOCIAL` (`packages/types/src/esocial.ts`)                                              | Muda quando o governo publica nova versão                                                     |

## 3. Ainda não feito

- [ ] Eventos de retificação e exclusão (S-3000)
- [ ] Validação do XML contra o XSD oficial
- [ ] Assinatura e transmissão direta (exige certificado A1 da empresa)
