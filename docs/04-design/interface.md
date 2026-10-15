# Interface: o padrão visual da DaVinci Qualidade

> **Status:** vigente (v1) · **Atualizado em:** 15/10/2026
> Vale para toda tela do `apps/web`. A estrutura do projeto segue a DaVinci Finance; **o visual não**. Layout, cores e tipografia são da Qualidade e estão definidos aqui.

---

## Sumário

1. [A regra que vem antes de todas](#1-a-regra-que-vem-antes-de-todas)
2. [Princípios](#2-princípios)
3. [Cara de IA: o que é proibido](#3-cara-de-ia-o-que-é-proibido)
4. [Tipografia](#4-tipografia)
5. [Cores](#5-cores)
6. [Escala, cantos e sombras](#6-escala-cantos-e-sombras)
7. [Estrutura de tela](#7-estrutura-de-tela)
8. [Componentes do QSSMA](#8-componentes-do-qssma)
9. [Textos](#9-textos)
10. [Checklist de tela](#10-checklist-de-tela)
11. [Diferenças em relação à Finance](#11-diferenças-em-relação-à-finance)

---

## 1. A regra que vem antes de todas

**A DaVinci Qualidade não pode ter cara de sistema gerado por IA.** Quem usa o sistema é gestor da qualidade, técnico de segurança e auditor. Eles conhecem software corporativo e reconhecem na hora uma tela montada por template: degradê roxo, card com ícone em círculo, emoji no título, "Bem-vindo de volta!". Uma tela assim passa a mensagem de que o produto foi feito às pressas, e isso é o oposto do que se vende para quem cuida de certificação.

Toda tela nova passa pelo [checklist da seção 10](#10-checklist-de-tela) antes do merge. Se um item falhar, a tela volta.

---

## 2. Princípios

1. **O registro é o centro.** O QSSMA é um sistema de registros auditáveis: NC, inspeção, acidente, licença. A tela mostra o registro, o número dele, o status e quem mexeu, sem decoração competindo.
2. **Sobriedade de documento oficial.** A referência visual é um relatório de auditoria ou uma norma ISO impressa, não um app de consumo. Serifa nos títulos, hierarquia clara, margens regulares.
3. **Status sempre legível sem cor.** Toda cor de status vem com texto ("Não conforme", "Vencida"). Quem é daltônico ou imprime em preto e branco precisa entender igual.
4. **A marca aparece pouco e no lugar certo.** O marinho é a cor de trabalho. O ouro é a assinatura: entra só na logo, no item ativo do menu, nos ícones dos grupos do menu e em selos de certificação. A barra superior é branco gelo (`barra`) e o menu lateral é verde-petróleo (`menu`, #1C5560); no menu o ouro usado é o `ouro-claro` (#D9A441), que mantém contraste no fundo escuro.
5. **Densidade de ferramenta.** Quem usa passa o dia no sistema. Mais linhas visíveis, menos rolagem, menos cliques.

---

## 3. Cara de IA: o que é proibido

| Proibido                                                                          | Como fazemos                                                                                          |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Inter, Geist ou fonte padrão do sistema em tudo                                   | Família **Source** (seção 4): serifa nos títulos, sem serifa na interface                             |
| Degradês em fundo, botão ou texto (roxo → azul, "aurora")                         | Cores sólidas dos tokens. O único gradiente é o metálico da logo                                      |
| Cantos muito arredondados (`rounded-xl` para cima)                                | Cantos de 2 a 6 px. Os tamanhos maiores não existem no tema                                           |
| Sombra grande e difusa, "brilho" em volta de card, vidro fosco (_glassmorphism_)  | Borda fina separa camadas. Sombra só em menu suspenso e modal                                         |
| Ícone dentro de círculo colorido em cada card                                     | Ícone pequeno, alinhado ao rótulo, na cor do texto                                                    |
| Grade de cards de indicador soltos, cada um de uma cor                            | Indicadores numa faixa única com divisórias, cor só no número que pede atenção                        |
| Emoji em título, botão, mensagem ou estado vazio                                  | Nenhum emoji na interface                                                                             |
| "Bem-vindo de volta!", "Ops! Algo deu errado", "Tudo pronto! 🎉"                  | Texto direto e específico (seção 9)                                                                   |
| Ilustração "fofa" ou genérica em estado vazio                                     | Uma frase do que falta e o botão que resolve                                                          |
| Hero com título gigante dentro do sistema                                         | Título da página em 26 px serifado, ações à direita                                                   |
| Badge colorido e cheio para todo status                                           | Ponto colorido + texto; fundo colorido só em status que exige ação                                    |
| Cor hexadecimal solta no código (`text-[#7C3AED]`)                                | Só tokens semânticos (`text-nao-conforme`)                                                            |
| Animação de entrada em lista, _hover_ que "pula"                                  | Transição só de cor e opacidade, até 150 ms                                                           |
| Texto de exemplo (_lorem ipsum_, "Usuário Teste", "Empresa XYZ") em tela entregue | Dados reais ou de demonstração plausíveis (NC-2026-014, "Calibração do paquímetro TAG-0042")          |
| Ícones de várias bibliotecas misturadas                                           | Só **Lucide** (`lucide-react`), traço 1,75 a 2, 16 px em botão e item de menu, 18 px em grupo e aviso |

---

## 4. Tipografia

### 4.1 Decisão

| Uso                                              | Família             | Pesos     |
| ------------------------------------------------ | ------------------- | --------- |
| Títulos de página e de seção (`h1`, `h2`)        | **Source Serif 4**  | 600       |
| Interface: textos, tabelas, botões, campos       | **Source Sans 3**   | 400 · 600 |
| Números de registro, TAG, CAS, ONU, CID, códigos | **Source Code Pro** | 400 · 500 |

**Por quê.** A Source é uma família da Adobe pensada para leitura longa e dados, com acentuação completa e números bem desenhados. A serifa dos títulos conversa com o "daVINCI" da logo e com a aparência de norma técnica. As três variantes foram desenhadas juntas, então combinam sem ajuste. As três têm licença livre (SIL OFL) e estão no `next/font/google`.

A Finance usa IBM Plex. A Qualidade usa Source para que os dois produtos não pareçam o mesmo sistema com outra cor.

### 4.2 Escala

Corpo de **14 px**, como em sistemas de gestão densos.

| Token       | Tamanho / linha | Uso                                                |
| ----------- | --------------- | -------------------------------------------------- |
| `text-xs`   | 12 / 16 px      | Rótulo de coluna, legenda, metadado                |
| `text-sm`   | 13 / 18 px      | Tabela densa, histórico de alterações              |
| `text-base` | 14 / 20 px      | **Corpo**, célula de tabela, botão, campo          |
| `text-md`   | 16 / 24 px      | Texto de leitura: descrição da NC, causa raiz, ata |
| `text-lg`   | 18 / 26 px      | Subtítulo, título de modal                         |
| `text-xl`   | 22 / 28 px      | Título de seção (serifado), valor de indicador     |
| `text-2xl`  | 26 / 32 px      | **Título da página** (serifado)                    |
| `text-3xl`  | 32 / 36 px      | Número em destaque dos cards do início             |

### 4.3 Regras

- **Números tabulares** em toda tabela e indicador, para alinhar dígito com dígito.
- **Número de registro em mono:** `NC-2026-014`, `TAG-0042`, `MTR 123456`. Facilita ler e copiar.
- **Pesos:** 400 no texto e 600 em título, rótulo de destaque e valor. Nada de 300 nem de 700+.
- **Caixa alta só em siglas** (NC, PGR, ASO, FISPQ, MTR). Título em caixa alta é proibido.
- **Linha de leitura** com até ~72 caracteres em textos corridos (causa raiz, ata, roteiro).

---

## 5. Cores

As cores saem da logo (ver [logos.md](logos.md)). O contraste de cada par texto/fundo foi medido (WCAG 2.2) e está ao lado. Texto exige 4,5:1 e marcador gráfico exige 3:1.

### 5.1 Marca

| Token        | HEX       | Papel                                                                                   |
| ------------ | --------- | --------------------------------------------------------------------------------------- |
| `marinho`    | `#001228` | **Cor de trabalho:** botão primário, texto forte, cabeçalho da tabela no PDF            |
| `ouro`       | `#A06D10` | Só gráfico: moldura da logo, selo. **Nunca como texto** (4,48:1 sobre branco, reprova)  |
| `ouro-texto` | `#986600` | Ouro quando precisa ser texto (4,96:1). Uso raro: selo "Certificado", destaque de marca |

### 5.2 Neutros (tema claro)

Cinzas levemente puxados para o azul do marinho, para não brigar com ele.

| Token          | HEX       | Uso                                    | Contraste sobre branco |
| -------------- | --------- | -------------------------------------- | ---------------------- |
| `fundo`        | `#F4F5F7` | Fundo da página                        | —                      |
| `superficie`   | `#FFFFFF` | Painéis, tabelas, formulários          | —                      |
| `superficie-2` | `#EEF0F3` | Cabeçalho de tabela, linha selecionada | —                      |
| `borda`        | `#D5DAE1` | Divisórias e contornos                 | —                      |
| `borda-forte`  | `#9AA3B0` | Contorno de campo de formulário        | 2,55:1                 |
| `texto`        | `#0E1A2B` | Texto principal                        | 17,48:1                |
| `texto-2`      | `#475264` | Rótulos, texto secundário              | 7,90:1                 |
| `texto-3`      | `#5F6B7C` | Metadados, legenda                     | 5,41:1                 |

### 5.3 Status do registro

O QSSMA vive de status: conforme, não conforme, vencido, a vencer. São tokens próprios, separados da marca.

| Token          | Claro            | Escuro    | Significa                                                |
| -------------- | ---------------- | --------- | -------------------------------------------------------- |
| `conforme`     | `#1D7044` (6,08) | `#5CC48A` | Aprovado, Conforme, Vigente, Eficaz, Habilitada, Regular |
| `nao-conforme` | `#B3261E` (6,54) | `#F2877E` | Reprovado, Não conforme, Vencida, Ineficaz, Irregular    |
| `atencao`      | `#A8470A` (5,88) | `#F0A35C` | A vencer, Condicional, Pendente, Atrasada, Atenção       |
| `info`         | `#2B5597` (7,37) | `#8AB0EE` | Em andamento, Planejado                                  |
| `neutro`       | `#586273` (6,16) | `#9AA4B2` | Rascunho, Não iniciado, Não se aplica                    |

O `atencao` é laranja de propósito, para nunca ser confundido com o ouro da marca.

### 5.4 Escalas de nível (risco, significância, materialidade)

Riscos (probabilidade × impacto), aspectos ambientais e materialidade ESG usam a mesma escala. **A cor fica só no marcador** (quadrado da matriz, ponto na lista). O texto do nível fica em `texto` e vem sempre com a nota: "Alto · 16".

| Nível   | Marcador (claro) | Regra no QSSMA                                    |
| ------- | ---------------- | ------------------------------------------------- |
| Baixo   | `#1D7044`        | Risco < 6 · Significância < 6 · Materialidade < 6 |
| Médio   | `#C99A06`        | Risco 6–11 · Significância e materialidade 6–14   |
| Alto    | `#B4470B`        | Risco 12–19 · Significância e materialidade ≥ 15  |
| Crítico | `#8E1B1B`        | Risco ≥ 20                                        |

### 5.5 Tema: sempre claro

O sistema é **sempre claro**, mesmo quando o computador está no modo escuro (decisão Q12): todo mundo vê o mesmo visual, igual aos prints, manuais e treinamentos. Não há tokens nem `dark:` no código; o `color-scheme: light` mantém claros também os campos nativos (data, seleção).

### 5.6 Exceção: cores oficiais dos ODS

A tela de ODS usa as **17 cores oficiais da ONU** (tokens `--dv-ods-1` a `--dv-ods-17`, componente `IconeOds`), porque são reconhecidas por quem trabalha com ESG. Elas aparecem só no ícone de cada ODS, nunca no resto da interface.

---

## 6. Escala, cantos e sombras

| Elemento                 | Medida                   |
| ------------------------ | ------------------------ |
| Unidade de espaço        | 4 px                     |
| Linha de tabela          | 36 px (densa: 32 px)     |
| Botão e campo            | 36 px de altura          |
| Espaço entre seções      | 24 px                    |
| Margem lateral da página | 24 px (16 px no celular) |

| Token        | Valor | Uso                          |
| ------------ | ----- | ---------------------------- |
| `rounded-xs` | 2 px  | Checkbox, marcador de status |
| `rounded-sm` | 4 px  | Botão, campo, etiqueta       |
| `rounded-md` | 6 px  | Painel, tabela, menu, modal  |

Não existe `rounded-lg` para cima. Sombra só em menu suspenso (`shadow-sm`) e modal (`shadow-md`).

---

## 7. Estrutura de tela

```text
┌────────────┬──────────────────────────────────────────────────────────────┐
│ [símbolo]  │  Qualidade › Não Conformidades              [Empresa ▾] [AS] │
│            ├──────────────────────────────────────────────────────────────┤
│ Painel     │  Não Conformidades                    [Exportar] [Nova NC]   │
│ Qualidade ▸│  12 abertas · 3 vencidas · prazo médio de 18 dias            │
│ Auditorias │  ┌──────────────────────────────────────────────────────────┐│
│ Gestão SGI │  │ Status ▾  Gravidade ▾  Origem ▾  Responsável ▾  Buscar  ││
│ Serviços   │  ├──────────┬──────────────────────┬─────────┬──────┬──────┤│
│ Segurança  │  │ Número   │ Descrição            │ Origem  │ Prazo│Status││
│ Meio Amb.  │  │NC-2026-014│ Paquímetro fora de… │Inspeção │ 22/10│● Aberta│
│ ESG        │  │ …        │                      │         │      │      ││
│ ────────── │  └──────────────────────────────────────────────────────────┘│
│ Cadastros  │                                                              │
│ Relatórios │                                                              │
└────────────┴──────────────────────────────────────────────────────────────┘
```

- **Menu lateral** verde-petróleo (`menu`), com os grupos do QSSMA na ordem do documento de domínio. Grupo de módulo não contratado não aparece. O item ativo tem fundo um pouco mais claro e uma barra de 3 px em `ouro-claro` à esquerda.
- **Cabeçalho da página:** título serifado, uma linha de resumo em `texto-2` com os números que importam, e as ações à direita (primária por último).
- **A lista é uma tabela,** com filtros no topo. Não usamos cards para listar registros (no celular a própria tabela é que vira cartões, §7.1).
- **Registro aberto:** número em mono e status no topo. Conteúdo em seções com título serifado. O **histórico de alterações** fica sempre no rodapé do registro, porque é a trilha que o auditor pede.

### 7.1 Celular e tablet (decisão Q15)

O mesmo modelo da DaVinci Finance:

- **Computador (≥ 1024 px):** menu lateral fixo, recolhível.
- **Tablet (768–1023 px):** o menu abre como **gaveta** pelo botão da barra superior (fecha ao navegar, ao tocar fora, no X e com Esc); a trilha encolhe; tabelas largas rolam dentro do próprio quadro.
- **Celular (< 768 px):** **barra inferior** fixa, Início · NCs · **+** · Vencimentos · Menu (atalho sem permissão não aparece). O "+" abre uma folha com os mesmos registros do botão Novo, que some da barra superior; Menu abre a gaveta. O conteúdo ganha folga embaixo para não ficar atrás da barra, respeitando a área segura do iPhone.
- **Celular estreito (< 640 px):** toda tabela com cabeçalho vira **lista de cartões**: a primeira coluna com texto é o título, as outras aparecem como "rótulo valor" (o rótulo vem do cabeçalho, copiado por `components/rotulos-das-tabelas.tsx`). Tabela que precisa continuar tabela: `data-tabela="fixa"`. Abas numa linha só, com rolagem lateral; filtros e campos na largura toda.
- Regras globais em `app/globals.css`. Evite largura fixa (`w-64`, `min-w-60`) sem prefixo `sm:`.

---

## 8. Componentes do QSSMA

| Componente                | Regra                                                                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Status**                | Ponto de 8 px na cor do status + texto. Fundo colorido (10 % da cor) só quando exige ação: Vencida, Reprovado, Atrasada        |
| **Número do registro**    | Mono, `texto`, copiável com um clique                                                                                          |
| **Prazo**                 | Data `dd/mm/aaaa`. Vencido fica em `nao-conforme`; até 30 dias, em `atencao`. Ao lado, "vence em 5 dias" ou "venceu há 3 dias" |
| **Matriz de risco 5×5**   | Quadrados com o marcador do nível (5.4) e a contagem de riscos. Eixos rotulados: Probabilidade (1–5) e Impacto (1–5)           |
| **Checklist de inspeção** | Três botões por item: OK, NOK, N/A. O resultado aparece calculado no topo ("Reprovada: 1 item NOK")                            |
| **Faixa de indicadores**  | Uma moldura, indicadores separados por divisória vertical. Número em 22 px, rótulo em 12 px. Sem ícone                         |
| **Vencimentos**           | Lista agrupada por semana, com a origem (EPI, calibração, licença) em texto                                                    |
| **Botões**                | Verbo + objeto: "Abrir NC", "Liberar permissão", "Gerar ata". Primário em `marinho`, um por tela                               |

---

## 9. Textos

Escrevemos como um auditor experiente fala: direto, específico e sem entusiasmo.

| Evite                                                        | Escreva                                                                |
| ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| "Ops! Algo deu errado 😅"                                    | "Não foi possível salvar a NC: o prazo é anterior à data de abertura." |
| "Sucesso!"                                                   | "NC-2026-014 aberta. Prazo: 22/10/2026."                               |
| "Nenhum dado encontrado"                                     | "Nenhuma calibração vence nos próximos 30 dias."                       |
| "Tem certeza?"                                               | "Excluir a inspeção INS-2026-031? O histórico registra quem excluiu."  |
| "Enviar" / "OK"                                              | "Liberar permissão" / "Salvar plano"                                   |
| "Gerencie suas não conformidades de forma fácil e intuitiva" | Não escrevemos frase de marketing dentro do sistema                    |

Use os termos da norma: não conformidade, ação corretiva, análise crítica, eficácia, evidência objetiva.

---

## 10. Checklist de tela

Antes do merge, quem abriu o PR confere:

- [ ] Nenhum item da [tabela da seção 3](#3-cara-de-ia-o-que-é-proibido) aparece na tela
- [ ] Só tokens de cor, nenhum HEX no componente
- [ ] Todo status tem texto, não só cor
- [ ] Ouro aparece só no menu (barra do ativo e ícones dos grupos, em `ouro-claro`) e na logo
- [ ] Títulos em Source Serif 4, números de registro em Source Code Pro
- [ ] Textos com verbo + objeto e mensagens de erro que dizem como corrigir
- [ ] Conferida em 1280 px e 390 px de largura
- [ ] Dados de demonstração plausíveis, sem _lorem ipsum_
- [ ] Uma pessoa olhou a tela pronta e responderia "não" para "isso parece feito por IA?"

---

## 11. Diferenças em relação à Finance

A estrutura (monorepo, microsserviços, gateway, pacotes) é a mesma da Finance. O visual é próprio:

|                           | Finance           | Qualidade                                                  |
| ------------------------- | ----------------- | ---------------------------------------------------------- |
| Tipografia                | IBM Plex          | Source Serif 4 / Sans 3 / Code Pro                         |
| Cor de destaque           | Laranja Finance   | Ouro da logo, só como assinatura; ação primária em marinho |
| Centro da tela            | Números e valores | Registro, número e status                                  |
| Cores semânticas próprias | Finanças          | Conformidade, prazos e níveis de risco                     |

Os tokens estão em `packages/tokens/css/tema.css`. O tema do Tailwind é zerado e só recebe estes tokens, e o ESLint do `apps/web` recusa degradê, cor solta, canto e sombra grandes, emoji e as fontes Inter, Geist, Manrope, Sora e Poppins. Qualquer mudança de cor passa por aqui primeiro, com o contraste medido.

## Ícones

Biblioteca única: **Lucide** (`lucide-react`, versão fixa no catálogo do monorepo). Onde entra:

| Lugar              | Regra                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu lateral       | Um ícone por grupo (18 px) e por tela (16 px), mapeados em `components/icones-do-menu.tsx`. Tela nova ganha ícone lá                                                            |
| Botões             | Criar e registrar: `Plus`. Filtrar: `ListFilter`. Voltar: `ArrowLeft`. Anexar: `Paperclip`. Ícone antes do texto, 16 px                                                         |
| Barra superior     | Recolher o menu, empresa, usuário e sair                                                                                                                                        |
| Avisos e situações | Sucesso: `CircleCheck` verde. Erro: `CircleAlert`. Situação que exige ação (vencido, bloqueado, pendente) troca o ponto colorido por `CircleAlert`, para não depender só da cor |

Sempre `aria-hidden`: o texto ao lado já diz o que é. Nunca dentro de círculo colorido.

## Animações (decisão Q13)

Só na tela de início e sempre uma vez, ao carregar; nada que pisque, gire ou repita. Quem marcou "reduzir movimento" no sistema operacional não vê nenhuma.

| Animação                    | Onde                           | Como                                                                     |
| --------------------------- | ------------------------------ | ------------------------------------------------------------------------ |
| Entrada suave               | Blocos do início, em sequência | `.dv-entrar` (opacidade e 8 px de subida, 420 ms; atraso por `--atraso`) |
| Números contando            | Número principal dos cards     | `Contador` (de 0 ao valor em 700 ms)                                     |
| Barras crescendo            | Barras de proporção dos cards  | `.dv-crescer` (700 ms)                                                   |
| Elevação no passar do mouse | Cards clicáveis                | Sobe 2 px, borda mais forte e `shadow-sm` (200 ms)                       |

As classes ficam em `apps/web/src/app/globals.css`. As `animate-*` do Tailwind continuam proibidas pelo ESLint.

## Gráficos (decisão Q14)

SVG próprio em `components/graficos.tsx`: colunas empilhadas, colunas agrupadas, rosca e linha. Regras:

| Regra                                                       | Como                                                                                                                                         |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Cor por módulo, em ordem fixa, nunca recalculada por filtro | Tokens `serie-1` a `serie-7` (Qualidade, Segurança, ASO e treinamentos, SGI, Serviços, Meio Ambiente, Agenda ESG), validados para daltonismo |
| Três cores ficam abaixo de 3:1 sobre o branco               | Legenda sempre visível e com os números; tooltip com o valor exato                                                                           |
| Marcas finas                                                | Coluna de no máximo 24 px, topo arredondado de 4 px e base reta; 2 px de respiro entre segmentos; linha de 2 px; grade de 1 px               |
| Texto nunca na cor da série                                 | Rótulos e valores nas cores de texto; a cor fica no quadradinho ao lado                                                                      |
| Interação                                                   | Tooltip ao passar o mouse, realce da série pela legenda, clique abre a lista filtrada                                                        |

O destaque do topo do início (`.dv-destaque` em `globals.css`) é a única área com degradê e canto de 12 px do sistema.
