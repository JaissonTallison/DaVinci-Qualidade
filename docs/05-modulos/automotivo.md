# Automotivo (IATF 16949)

> **Status:** em uso · **Serviço:** `qualidade` · **Atualizado em:** 16/10/2026
> Referências: IATF 16949:2016 (8.3.3.3, 8.5.1.1 e anexo A), manual de FMEA AIAG-VDA (2019) e manual PPAP da AIAG (4ª edição). Regras decididas por nós (decisão Q9).

Três documentos ligados: o **FMEA de processo** analisa o que pode falhar; o **plano de controle** diz como controlar; o **PPAP** reúne as evidências para o cliente aprovar a peça.

## 1. FMEA de processo (AIAG-VDA)

| Regra                                                                                                                                                                                                                       | Por quê                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Cada linha: etapa, função ou requisito, modo de falha, efeito, severidade (S), classe especial (CC/SC), causa, controle de prevenção, ocorrência (O), controle de detecção, detecção (D), ação, responsável, prazo e status | Colunas dos passos 2 a 6 do manual    |
| **Prioridade de Ação (AP)** calculada pela tabela AIAG-VDA (alta, média, baixa); o NPR (S×O×D) aparece só como referência                                                                                                   | O manual de 2019 trocou o NPR pela AP |
| **AP alta exige ação (ou justificativa), responsável e prazo**                                                                                                                                                              | O manual pede tratar toda AP alta     |
| O documento é salvo inteiro, com controle de versão (duas pessoas não sobrescrevem uma à outra)                                                                                                                             | O FMEA é revisado como um todo        |
| Numeração `FMEA-AAAA-NNN`                                                                                                                                                                                                   | Igual aos demais registros            |

A tabela da AP fica em `packages/types/src/automotivo.ts`, com testes por faixa de severidade.

## 2. Plano de controle

Fase (protótipo, pré-lançamento, produção) e, por característica: etapa, máquina, característica, tipo (produto ou processo), classe especial, especificação, método de avaliação, amostra, frequência, método de controle e plano de reação. **Gerado do FMEA**, cria uma linha por etapa e característica, já com a classe e os controles de prevenção e detecção; especificação, amostra e frequência ficam "A definir". Numeração `PC-AAAA-NNN`. Versão para imprimir em paisagem.

## 3. PPAP

| Regra                                                                                                                                             | Por quê                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Os 18 elementos do manual, cada um com status (pendente, em andamento, concluído, não aplicável) e observação                                     | Lista do manual PPAP                                                        |
| O **nível de submissão** (1 a 5) define o que vai ao cliente: tabela de retenção e submissão da AIAG (S submeter, R reter, * a pedido no nível 4) | Nível 1: PSW e aparência; nível 3: tudo menos amostra padrão e dispositivos |
| **Submeter** exige todo elemento "submeter" concluído, ou não aplicável **com justificativa**                                                     | Evita PSW incompleto                                                        |
| Submetido e aprovado não mudam; rejeitado volta a "em preparação" ao ser corrigido                                                                | O registro mostra o que foi ao cliente                                      |
| Decisão do cliente: aprovado, aprovação provisória ou rejeitado, com o parecer                                                                    | Campos do PSW                                                               |
| Liga ao PFMEA e ao plano de controle                                                                                                              | Rastreabilidade entre os documentos                                         |

## 4. Ainda não feito

- [ ] DFMEA (FMEA de projeto) e diagrama de fluxo do processo
- [ ] MSA (R&R) e estudos de capabilidade (Cp, Cpk) como registros próprios
- [ ] Anexos por elemento do PPAP
