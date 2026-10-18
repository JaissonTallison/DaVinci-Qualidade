# Não Conformidades

> **Status:** em construção · **Serviço:** `qualidade` · **Atualizado em:** 15/10/2026
> Referências: documento "QSSMA e Agenda ESG" (grupo Qualidade) e ISO 9001:2015, cláusula 10.2. Regras decididas por nós (decisão Q9).

A não conformidade (NC) é o registro de que algo não atendeu a um requisito. Ela nasce de uma inspeção, auditoria, reclamação de cliente ou falha de processo, e só termina quando a ação corretiva é **verificada como eficaz**. É o registro que o auditor mais pede, por isso nunca é apagado.

---

## 1. Ciclo de vida

```text
            registrar tratamento       enviar p/ verificação       eficaz
  ABERTA ─────────────────────▶ EM TRATAMENTO ─────────────▶ EM VERIFICAÇÃO ─────▶ ENCERRADA
    │   exige causa raiz          ▲  │ exige data de implantação     │
    │   e ação corretiva          │  └ registrar tratamento de novo:  │ ineficaz
    │                             │    revisa causa e ação            │
    │                             └──────── volta, ciclo + 1 ────────┘
    │
    └── cancelar (qualquer status não final; exige motivo) ──▶ CANCELADA
```

| Status           | Significa                                              | Quem pode mudar              |
| ---------------- | ------------------------------------------------------ | ---------------------------- |
| `aberta`         | Registrada; pode ter contenção imediata                | `qualidade.editar`           |
| `em_tratamento`  | Causa analisada e ação corretiva definida, em execução | `qualidade.editar`           |
| `em_verificacao` | Ação implantada, aguardando a verificação de eficácia  | `qualidade.editar`           |
| `encerrada`      | Ação verificada como eficaz. Final                     | —                            |
| `cancelada`      | Aberta por engano ou duplicada. Final, com motivo      | `qualidade.excluir` (gestor) |

**Por que assim:**

- **Não existe excluir.** A ISO pede evidência do tratamento de toda NC. Cancelar guarda o motivo, quem cancelou e quando.
- **Encerrar só com eficácia verificada** (ISO 9001 10.2.1 d). Uma ação ineficaz devolve a NC para tratamento e soma um **ciclo**. Uma NC com 2 ou mais ciclos aparece destacada, porque o problema está voltando.
- **As exigências ficam na transição, não no cadastro.** Abrir uma NC precisa ser rápido (o que aconteceu, gravidade, responsável, prazo). Causa raiz e ação corretiva são exigidas só para registrar o tratamento.
- **Depois de uma ação ineficaz, a análise é revista.** A NC volta para "em tratamento" sem data de implantação, e registrar o tratamento de novo atualiza a causa e a ação. O ciclo conta quantas vezes a ação foi tentada.
- **Prazo e implantação são datas civis no fuso de Brasília.** A implantação não pode ser anterior à abertura nem estar no futuro.
- **Vencida não é status.** É calculado: prazo anterior a hoje e status não final. Assim a NC continua no passo em que está, e a lista mostra "venceu há 3 dias".

## 2. Campos

| Grupo            | Campos                                                                        | Obrigatório                                                      |
| ---------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Identificação    | número `NC-AAAA-NNN` (automático), título, descrição                          | título, descrição                                                |
| Classificação    | origem, referência da origem (ex.: `AUD-2026-003`), tipo, gravidade           | origem, tipo, gravidade                                          |
| Onde             | setor, processo ou área, produto ou serviço, lote                             | —                                                                |
| Responsabilidade | responsável, prazo                                                            | os dois                                                          |
| Contenção        | ação imediata para conter o efeito                                            | —                                                                |
| Análise          | método, categoria 6M, tipo de causa ou desvio, os porquês (até 5), causa raiz | causa raiz para registrar o tratamento                           |
| Tratamento       | ação corretiva, data de implantação                                           | ação para registrar o tratamento; data para enviar à verificação |
| Eficácia         | resultado (eficaz/ineficaz), parecer, quem verificou e quando, ciclos         | resultado e parecer para verificar                               |
| Custo            | custo estimado da falha (R$)                                                  | —                                                                |

| Lista        | Valores                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------ |
| Origem       | Inspeção, Auditoria, Reclamação de cliente, Fornecedor, Processo interno, Acidente ou incidente, Outra |
| Tipo         | Produto, Serviço, Processo, Sistema de gestão                                                          |
| Gravidade    | Baixa, Média, Alta, Crítica                                                                            |
| Categoria 6M | Mão de obra, Método, Máquina, Material, Medição, Meio ambiente                                         |

**Numeração:** sequencial por empresa e por ano (`NC-2026-001`, `NC-2026-002`…), por contador atômico no banco. Número usado nunca se repete, nem se a NC for cancelada.

**Seleção em vez de digitação (16/10/2026):** setor vem do cadastro de Setores; processo/área e tipo de causa vêm de **Cadastros › Listas de cadastro** (listas que a empresa mantém, serviço `codex`, tabela `listas_cadastro`, API `/listas/:lista`). O responsável é autocomplete do cadastro de funcionários. O "registro de origem" é autocomplete dos registros reais da origem (auditoria, inspeção, acidente, reclamação) e, no detalhe, vira link clicável para o registro. Se a lista estiver vazia, o campo cai para texto livre com dica de onde cadastrar.

**Edição:** campos descritivos podem ser corrigidos enquanto a NC não está encerrada nem cancelada. Toda gravação confere a versão lida: se outra pessoa alterou antes, a gravação é recusada.

## 3. Lista

Filtros: status, gravidade, origem, só vencidas e busca por número ou título. Ordem padrão: as abertas com prazo mais próximo primeiro. Resumo no topo: abertas, vencidas e críticas ou altas em aberto.

## 4. API (gateway)

| Método e rota                                         | Permissão           | O que faz                                                                                       |
| ----------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| `GET /nao-conformidades`                              | `qualidade.ver`     | Lista com filtros (`status`, `gravidade`, `origem`, `vencidas`, `busca`, `pagina`, `porPagina`) |
| `GET /nao-conformidades/resumo`                       | `qualidade.ver`     | Abertas, vencidas e graves em aberto                                                            |
| `GET /nao-conformidades/:id`                          | `qualidade.ver`     | A NC completa, com `versao`                                                                     |
| `POST /nao-conformidades`                             | `qualidade.editar`  | Abre a NC                                                                                       |
| `PUT /nao-conformidades/:id`                          | `qualidade.editar`  | Corrige campos descritivos                                                                      |
| `POST /nao-conformidades/:id/tratamento`              | `qualidade.editar`  | Registra análise e ação corretiva                                                               |
| `POST /nao-conformidades/:id/enviar-para-verificacao` | `qualidade.editar`  | Informa a implantação                                                                           |
| `POST /nao-conformidades/:id/verificar-eficacia`      | `qualidade.editar`  | Eficaz encerra; ineficaz volta para tratamento                                                  |
| `POST /nao-conformidades/:id/cancelar`                | `qualidade.excluir` | Cancela com motivo                                                                              |

Toda alteração leva a `versao` que a tela leu. Versão desatualizada responde `409` com "Esta NC foi alterada por outra pessoa".

## 5. Telas (web)

| Tela     | Caminho                             | O que tem                                                                                                                                                   |
| -------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lista    | `/qualidade/nao-conformidades`      | Resumo no topo, filtros na URL (dá para compartilhar o link), tabela com prazo relativo e marcação de reincidência                                          |
| Abrir NC | `/qualidade/nao-conformidades/nova` | Só o necessário para abrir; custo aceita "1.250,00"                                                                                                         |
| Detalhe  | `/qualidade/nao-conformidades/:id`  | Linha do tempo do ciclo, o registro em seções, planos de ação, outras NCs do mesmo registro de origem (recorrência) e, embaixo, só a próxima ação do status |

## 6. Ainda não feito (próximos passos)

- [ ] Abrir NC a partir de outro serviço por evento (constatação de auditoria, reclamação de cliente, inspeção reprovada)
- [x] Ligar a NC a um Plano de Ação (5W2H): ver [planos-de-acao.md](planos-de-acao.md)
- [x] Evidências anexadas (serviço `plataforma`)
- [x] Responsável sugerido do cadastro de funcionários ativos (lista `pessoas` no layout); continua texto, para aceitar quem é de fora
- [ ] Histórico de alterações centralizado
- [ ] Corrigir campos descritivos pela tela (a rota `PUT` já existe)
- [ ] Tabela da lista em formato de cartões no celular (hoje rola na horizontal)
