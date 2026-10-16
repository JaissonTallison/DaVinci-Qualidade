# Auditorias

> **Status:** em construção · **Serviço:** `auditorias` · **Atualizado em:** 16/10/2026
> Referências: documento "QSSMA e Agenda ESG" (grupo Auditorias), ISO 19011:2018 (diretrizes para auditoria) e ISO 9001:2015 cláusula 9.2. Conteúdo dos bancos e fluxo da jornada a partir do material de referência do AuditExpert ([docs/06-referencias/auditexpert.md](../06-referencias/auditexpert.md)). Regras decididas por nós (decisão Q9).

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

## 4. Jornada em cinco etapas

Cada auditoria tem um resumo com a **trilha** (as cinco etapas com o andamento) e o **próximo passo** (regra `proximoPasso` em `@davinci/types`, testada). Cada etapa alimenta a seguinte.

| Etapa     | Tela                                        | O que faz                                                                                                                                                                                                                                                                                                                                                           |
| --------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Planejar  | `/auditorias/:id/kit`, `/plano`, `/roteiro` | Kit pré-auditoria (90 dias ao dia D, prontidão em %), plano para o auditado (objetivo, critérios sugeridos pelas normas, metodologia ISO 19011, processos, cronograma, convocados, logística, papel e horas, versão para imprimir e assinar) e roteiro de entrevista com o banco de 568 perguntas                                                                   |
| Auditar   | `/execucao`                                 | Resposta Conforme, Parcial ou Não conforme com a evidência objetiva (obrigatória fora de Pendente); ao lado, o que pedir naquela cláusula, da biblioteca de evidências; filtro por processo e só pendentes                                                                                                                                                          |
| Registrar | `/achados`                                  | Respostas Parcial e Não conforme sem constatação; a constatação parte de um modelo do banco de NCs (preenche redação, causa raiz, ação e evidência de fechamento) ou é personalizada; guarda a pergunta de origem; formaliza a NC na Qualidade                                                                                                                      |
| Tratar    | `/tratar`                                   | Cadeia de rastreabilidade de cada NC: pergunta → resposta e evidência → NC na Qualidade → plano de ação → eficácia, com o atalho para criar o plano já ligado à NC                                                                                                                                                                                                  |
| Entregar  | `/relatorio`                                | Índice de conformidade (conformes ÷ avaliadas), resultado (Não conforme; Implementado com pontos de melhoria; Conforme), 20 verificações orientativas com o atalho para corrigir, pontos fortes, conclusão e PDF nos modelos Clássico (completo, com entrevistas e o checklist do kit em anexo) e Executivo (gráficos por norma e processo, NCs e planos em tabela) |

Apoio, fora de uma auditoria: Biblioteca de evidências (474 do banco e os 93 controles do Anexo A), Banco de NCs (385 modelos e o assistente com três prompts), Prompts de IA (123), Minha biblioteca (critérios próprios, perguntas, evidências e modelos de NC da empresa; importação por planilha CSV, validada inteira antes de gravar), Log do Auditor (horas, referenciais, processos; declaração de experiência com organizações anonimizadas) e Manual de uso. Packs Anti-NC filtram roteiro, biblioteca e banco de NCs; buscas salvas ficam no navegador de quem usa.

Normas: ISO 9001:2026 e 2015, ISO 14001:2026 e 2015, ISO 45001:2018, ISO/IEC 27001:2022, ISO 28000:2022, ISO 31000:2018, IATF 16949:2016 e SGI; uma edição por norma em cada auditoria.

## 5. Ainda não feito

- [ ] Cadastro de auditores qualificados (formação, normas, validade)
- [ ] Processos próprios além dos 18 do banco (hoje a área da constatação é livre)
- [ ] Buscas salvas no servidor (hoje ficam no navegador)
