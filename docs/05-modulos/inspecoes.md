# Inspeções

> **Status:** em construção · **Serviço:** `qualidade` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (Inspeções e Checklists de Controle) e ISO 9001:2015 cláusulas 8.6 e 8.7. Regras decididas por nós (decisão Q9).

A inspeção confere um produto, serviço ou processo contra uma lista de itens. Cada item é respondido OK, NOK ou N/A, e o resultado é calculado: **um NOK reprova**. Inspeção reprovada vira não conformidade com um clique, já preenchida.

---

## 1. Decisão: uma tela, não duas

O documento de referência tem "Inspeções" e "Checklists de Controle" como telas separadas, mas as duas fazem a mesma coisa: itens respondidos e resultado calculado. Aqui é **um registro só**, a Inspeção, com um **tipo**: recebimento, processo, produto final, serviço, segurança ou outra. Assim existe uma regra, um relatório e uma lista para filtrar.

As listas que se repetem ficam em **Modelos de inspeção**, por exemplo "Recebimento de matéria-prima" com 12 itens. Ao criar a inspeção, os itens do modelo são **copiados** para ela. Alterar o modelo depois não muda nenhuma inspeção já feita, porque o registro tem que mostrar exatamente o que foi conferido naquele dia.

## 2. Ciclo de vida

```text
  EM ANDAMENTO ──── concluir (todos os itens respondidos) ───▶ APROVADA   (nenhum NOK)
       │                                                  └──▶ REPROVADA  (algum NOK) ──▶ Abrir NC
       └── cancelar (com motivo) ──▶ CANCELADA
```

| Regra                                                                                        | Por quê                                                           |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Respostas podem ser mudadas enquanto a inspeção está em andamento                            | Quem inspeciona preenche aos poucos, no chão de fábrica           |
| Concluir exige todos os itens respondidos                                                    | Item sem resposta não é "OK por omissão"                          |
| Item NOK exige uma observação (o que foi encontrado)                                         | A observação é a evidência objetiva que vai para a NC             |
| Concluída, a inspeção não muda mais                                                          | É registro de qualidade (ISO 9001 8.6: evidência de conformidade) |
| N/A não conta como OK nem NOK, mas precisa ser escolhido                                     | Diferencia "não se aplica" de "esqueci"                           |
| Inspeção reprovada oferece "Abrir NC", com origem, referência e os itens NOK já na descrição | O caminho mais comum de uma NC começa aqui                        |

O progresso mostra quantos itens já foram respondidos ("8 de 12").

## 3. Campos

**Inspeção:** número `INS-AAAA-NNN` (automático), tipo, objeto inspecionado (produto, serviço ou processo), lote, local, quantidade inspecionada, inspetor, data, modelo usado (quando houver), observações gerais e os itens.

**Item:** o que verificar, critério de aceitação (opcional: "diâmetro 10,0 ± 0,1 mm"), resposta (OK, NOK, N/A) e observação.

**Modelo de inspeção:** nome, tipo e itens (o que verificar e critério), de 1 a 60 itens. Modelo não se apaga: é inativado e some da escolha.

## 4. Ainda não feito

- [ ] Foto ou anexo por item (serviço `plataforma`)
- [ ] Amostragem (tamanho da amostra e quantidade reprovada, NBR 5426)
- [ ] Inspeção ligada a fornecedor (quando Serviços existir)
