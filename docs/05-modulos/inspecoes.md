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

## 4. Amostragem e fornecedor

**Amostragem (NBR 5426, equivalente à ISO 2859-1):** opcional. Com o **NQA** escolhido (0,065% a 10%) e o **nível de inspeção** (I, II ou III; padrão II), a quantidade passa a ser o **tamanho do lote** e o sistema calcula o plano: letra-código (tabela 1), tamanho da amostra, número de aceitação (Ac) e de rejeição (Re) (tabela 2-A, amostragem simples, inspeção normal), seguindo as setas da tabela. A regra fica em `packages/types/src/amostragem.ts`, com testes contra valores da tabela.

| Regra                                                                         | Por quê                                                   |
| ----------------------------------------------------------------------------- | --------------------------------------------------------- |
| Com NQA, informar o tamanho do lote é obrigatório                             | O plano depende dele                                      |
| Amostra maior que o lote vira inspeção de 100%                                | A tabela manda inspecionar tudo                           |
| Concluir pede os **defeituosos na amostra**, de 0 até o tamanho da amostra    | É o que decide o lote                                     |
| Defeituosos ≤ Ac: lote **aprovado**; ≥ Re: **reprovado** (mesmo com item NOK) | É a lógica do NQA: alguns defeitos na amostra são aceitos |
| Sem amostragem, vale a regra de sempre: um NOK reprova                        | Inspeção de 100% ou de processo                           |
| Seta para cima na primeira letra (A), sem plano acima, segue para baixo       | Decisão nossa: a escolha mais conservadora                |

**Fornecedor:** na inspeção (normalmente de recebimento) pode-se escolher o fornecedor do cadastro (`codex`, papel fornecedor, ativo); o nome do dia fica guardado. Em **Serviços › Avaliação de fornecedores**, cada fornecedor mostra o **recebimento dos últimos 12 meses** (aprovadas ÷ concluídas), base para a nota de qualidade. A lista de inspeções também busca pelo nome do fornecedor.

## 5. Ainda não feito

- [x] Foto ou anexo por item (serviço `plataforma`)
- [x] Amostragem (NBR 5426, seção 4)
- [x] Inspeção ligada a fornecedor (seção 4)
- [ ] Inspeção severa e atenuada (regras de comutação da NBR 5426)
