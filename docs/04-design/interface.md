# Interface: o padrão visual da DaVinci Qualidade

> **Status:** vigente (v2, design system de 08/11/2026) · **Atualizado em:** 08/11/2026
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
2. **Sobriedade de documento oficial.** A referência visual é um relatório de auditoria ou uma norma ISO impressa, não um app de consumo. Hierarquia clara, margens regulares, nenhum ornamento.
3. **Status sempre legível sem cor.** Toda cor de status vem com texto ("Não conforme", "Vencida"). Quem é daltônico ou imprime em preto e branco precisa entender igual.
4. **A marca aparece pouco e no lugar certo.** O azul da marca (`#172477`) aparece em três lugares: menu lateral, botão primário e indicador ativo (aba, barra de progresso). O ouro (`ouro-claro`, #D9A441) só marca o item ativo do menu. O resto da tela é neutro, para que os status se destaquem.
5. **Densidade de ferramenta.** Quem usa passa o dia no sistema. Mais linhas visíveis, menos rolagem, menos cliques.

---

## 3. Cara de IA: o que é proibido

| Proibido                                                                          | Como fazemos                                                                                                  |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Inter, Geist, Manrope, Sora, Poppins                                              | **IBM Plex Sans** e **IBM Plex Mono** (seção 4)                                                               |
| Degradês em fundo, botão, card ou texto                                           | Cores sólidas dos tokens. Nenhum degradê no sistema (o Início também não tem)                                 |
| Cantos muito arredondados (`rounded-lg` para cima)                                | 4 px em selo e caixa de marcar, 6 px em botão, campo e alerta, 8 px em card e modal. Maiores não existem      |
| Sombra grande e difusa, "brilho" em volta de card, vidro fosco                    | Elevação em camadas dos tokens (seção 6). Card sem borda visível: a sombra já traz o contorno de 1 px         |
| Ícone dentro de círculo colorido em cada card, ilustração de fundo                | Ícone só com função (navegação, ação, campo, estado), na cor do texto                                         |
| Faixa lateral colorida em alerta ou card, fita com dobra                          | Alerta com fundo e borda suaves e o ícone padrão do Lucide no tom (`CaixaDeAlerta`)                           |
| Ponto colorido em selo de status                                                  | Selo retangular só com texto (`Selo`), sem ponto                                                              |
| Card de cor cheia por módulo                                                      | Card branco; a cor fica para o status                                                                         |
| Emoji em título, botão, mensagem ou estado vazio                                  | Nenhum emoji na interface                                                                                     |
| "Bem-vindo de volta!", "Ops! Algo deu errado", "Tudo pronto! 🎉"                  | Texto direto e específico (seção 9)                                                                           |
| Hero com foto e título gigante dentro do sistema                                  | Título da página em 24 px, ações à direita                                                                    |
| Cor hexadecimal solta no código (`text-[#7C3AED]`)                                | Só tokens semânticos (`text-nao-conforme`, `bg-atencao-suave`)                                                |
| Animação de entrada em lista, _hover_ que "pula"                                  | Transição só de cor e opacidade, até 150 ms                                                                   |
| Texto de exemplo (_lorem ipsum_, "Usuário Teste", "Empresa XYZ") em tela entregue | Dados reais ou de demonstração plausíveis (NC-2026-014, "Calibração do paquímetro TAG-0042")                  |
| Ícones de várias bibliotecas misturadas                                           | Só **Lucide** (`lucide-react`), traço 1,75; 14 px em metadado, 16 px em botão e campo, 18 px no menu e alerta |

---

## 4. Tipografia

### 4.1 Decisão (08/11/2026)

| Uso                                                   | Família           | Pesos           |
| ----------------------------------------------------- | ----------------- | --------------- |
| Interface e títulos: textos, tabelas, botões, campos  | **IBM Plex Sans** | 400 · 500 · 600 |
| Números de registro, CNPJ/CPF, TAG, CAS, ONU, códigos | **IBM Plex Mono** | 400 · 500       |

A família Source foi trocada pela IBM Plex junto com o design system aprovado para a feira (decisão de 08/11/2026). Não há serifa: `font-serif` aponta para o Plex Sans. As duas fontes têm licença livre (SIL OFL) e vêm do `next/font/google`.

### 4.2 Escala

| Token       | Tamanho / linha | Uso                                                       |
| ----------- | --------------- | --------------------------------------------------------- |
| `text-xs`   | 12 / 16 px      | Selo, cabeçalho de tabela (caixa alta), legenda, metadado |
| `text-sm`   | 13 / 20 px      | Descrição de card, ajuda do campo, paginação              |
| `text-base` | 14 / 20 px      | **Corpo**, célula de tabela, botão, campo, rótulo         |
| `text-md`   | 15 / 22 px      | Título de card, texto de leitura (descrição da NC)        |
| `text-lg`   | 16 / 24 px      | Título de modal                                           |
| `text-xl`   | 18 / 26 px      | Título de seção                                           |
| `text-2xl`  | 24 / 32 px      | **Título da página** (`tituloDaPagina`)                   |
| `text-3xl`  | 28 / 36 px      | Número em destaque de indicador                           |

### 4.3 Regras

- **Números tabulares** em toda tabela e indicador, para alinhar dígito com dígito.
- **Número de registro em mono:** `NC-2026-014`, `TAG-0042`, `MTR 123456`. Facilita ler e copiar.
- **Pesos:** 400 no texto, 500 em rótulo e botão, 600 em título e valor. Nada de 300 nem de 700.
- **Caixa alta** só em siglas (NC, PGR, ASO) e no sobretítulo (`sobretitulo`: cabeçalho de tabela, título de grupo de campos), em 12 px com espaçamento de 0,04em.
- **Linha de leitura** com até ~72 caracteres em textos corridos (causa raiz, ata, roteiro).

---

## 5. Cores

As cores saem da logo (ver [logos.md](logos.md)). O contraste de cada par texto/fundo foi medido (WCAG 2.2) e está ao lado. Texto exige 4,5:1 e marcador gráfico exige 3:1.

### 5.1 Marca

| Token         | HEX       | Papel                                                              |
| ------------- | --------- | ------------------------------------------------------------------ |
| `acao`        | `#172477` | **Azul da marca:** botão primário, aba ativa, barra de progresso   |
| `acao-escuro` | `#101A5C` | Botão primário no hover                                            |
| `menu`        | `#172477` | Fundo do menu lateral                                              |
| `ouro-claro`  | `#D9A441` | Só a barra do item ativo do menu e os ícones dos grupos            |
| `foco`        | `#3B4FD1` | Anel de foco de 2 px com folga de 2 px em todo elemento interativo |

### 5.2 Neutros (tema claro)

| Token          | HEX       | Uso                                                                |
| -------------- | --------- | ------------------------------------------------------------------ |
| `fundo`        | `#EEF1F6` | Fundo da página, um tom abaixo do card para a elevação aparecer    |
| `superficie`   | `#FFFFFF` | Card, tabela, campo, modal, barra superior                         |
| `superficie-2` | `#F8F9FC` | Cabeçalho de tabela, hover de linha, rodapé de card                |
| `afundado`     | `#E7EBF1` | Campo desabilitado ou só leitura, trilho do seletor e do progresso |
| `borda`        | `#DFE3EA` | Divisórias de tabela e de card                                     |
| `borda-campo`  | `#D3D8E2` | Contorno do campo e do botão secundário em repouso                 |
| `borda-forte`  | `#8C94A8` | Contorno no hover; caixa de marcar e rádio (3:1)                   |
| `texto`        | `#131A33` | Texto principal                                                    |
| `texto-2`      | `#4F5870` | Texto secundário, cabeçalho de tabela, descrição (≥ 4,5:1)         |
| `texto-3`      | `#677087` | Placeholder, ícone auxiliar, "(opcional)" (≥ 4,5:1)                |

### 5.3 Status do registro

Cada status tem a cor cheia (ícone, número), o fundo suave, a borda suave e o texto escuro para usar sobre o fundo suave. O selo e o alerta usam o trio suave + borda + texto.

| Status         | Cheia     | Suave          | Borda     | Texto     | Significa                                                   |
| -------------- | --------- | -------------- | --------- | --------- | ----------------------------------------------------------- |
| `conforme`     | `#157A52` | `#E7F5EE`      | `#B3DCC8` | `#0F6342` | Aprovado, Conforme, Vigente, Encerrado, Liberado            |
| `nao-conforme` | `#B42318` | `#FDEEEC`      | `#F2C4BE` | `#A01D13` | Reprovado, Vencido, Atrasado, NC maior, pendência que trava |
| `atencao`      | `#B45309` | `#FFF5E5`      | `#F3D29B` | `#8A4500` | Vence em breve, Aguardando eficácia, NC menor, Solicitada   |
| `info`         | `#24339A` | `#E9ECF8`      | `#C3CBEE` | —         | Em andamento, Em tratamento, Em análise                     |
| `neutro`       | `#4F5870` | `superficie-2` | `borda`   | `texto-2` | Rascunho, Planejada, Cancelado, Não se aplica               |

### 5.4 Escalas de nível (risco, significância, materialidade)

Risco, gravidade da NC, significância do aspecto, materialidade ESG e risco da evidência usam o selo no tom do nível (`tomDoNivel`): baixo em `conforme`, médio/moderado em `atencao`, alto e crítico em `nao-conforme`. A matriz 5×5 continua com os marcadores de nível (`nivel-baixo` a `nivel-critico`) nos quadrados. O texto do nível vem sempre escrito ("Alta · 20").

### 5.5 Tema: sempre claro

O sistema é **sempre claro**, mesmo quando o computador está no modo escuro (decisão Q12): todo mundo vê o mesmo visual, igual aos prints, manuais e treinamentos. Não há tokens nem `dark:` no código; o `color-scheme: light` mantém claros também os campos nativos (data, seleção).

### 5.6 Exceção: cores oficiais dos ODS

A tela de ODS usa as **17 cores oficiais da ONU** (tokens `--dv-ods-1` a `--dv-ods-17`, componente `IconeOds`), porque são reconhecidas por quem trabalha com ESG. Elas aparecem só no ícone de cada ODS, nunca no resto da interface.

---

## 6. Escala, cantos e sombras

| Elemento                 | Medida                       |
| ------------------------ | ---------------------------- |
| Unidade de espaço        | 4 px                         |
| Botão                    | 36 px (pequeno: 30 px)       |
| Campo de formulário      | 40 px (filtro: 36 px)        |
| Linha de tabela          | 44 px (12 px acima e abaixo) |
| Espaço entre seções      | 24 px                        |
| Margem lateral da página | 24 px (16 px no celular)     |

| Token                          | Valor | Uso                                                 |
| ------------------------------ | ----- | --------------------------------------------------- |
| `rounded-xs`                   | 4 px  | Selo, caixa de marcar, opção do seletor segmentado  |
| `rounded-sm` / `rounded-campo` | 6 px  | Botão, campo, alerta, chip de filtro                |
| `rounded-md`                   | 8 px  | Card, painel, tabela, menu suspenso, modal (máximo) |
| `rounded-full`                 | —     | Só avatar e chave liga/desliga                      |

| Elevação        | Uso                                                      |
| --------------- | -------------------------------------------------------- |
| `shadow-xs`     | Campo, botão, opção ativa do seletor                     |
| `shadow-cartao` | Card e painel (já traz o contorno de 1 px: sem `border`) |
| `shadow-sm`     | Menu suspenso, dica de gráfico, barra de ações em lote   |
| `shadow-md`     | Modal, busca, painel lateral                             |

As classes prontas ficam em `lib/estilos.ts`: `campo`, `campoCompacto`, `areaDeTexto`, `botaoPrimario`, `botaoSecundario`, `botaoFantasma`, `botaoPerigo`, `botaoPequeno`, `botaoIcone`, `botaoLink`, `linkDiscreto`, `painel`, `cabecalhoDoPainel`, `tituloDoPainel`, `tituloDaPagina`, `subtituloDaPagina`, `tituloDaSecao`, `sobretitulo`, `trilho` + `aba`, `opcaoSegmentada`, `linhaDeAbas` + `abaDePagina`, `selo`. Componente novo reaproveita daqui.

---

## 7. Estrutura de tela

**Profundidade dos cards:** todo card e painel tem a sombra `shadow-cartao`, que já traz o contorno de 1 px (sem `border`). Menus suspensos seguem com `shadow-sm` e modais com `shadow-md`.

**Barra superior (`BarraSuperior`, 08/11/2026):** 56 px, `superficie`, linha de baixo em `borda`, igual em todas as telas autenticadas. Da esquerda para a direita:

1. **Recolher o menu**: botão fantasma de 36 px, ícone de 18 px; no tablet, o botão da gaveta; abaixo de 1024 px, o símbolo da marca.
2. **Trilha**: Módulo › Tela › Detalhe na mesma caixa, 13 px, anteriores em `texto-2` como links, a atual em `texto` 500; estrela para fixar a tela nos favoritos.
3. **Busca** de 300 px e 34 px em `superficie-2`, com `Ctrl K`; no celular, só a lupa.
4. **Novo**: botão secundário com `chevron-down`; menu "Criar registro" com o ícone de cada tela.
5. **Notificações** (`bell`): contador em `nao-conforme` (até "99+") com anel branco; painel de 400 px com título, os prazos vencidos (ícone na cor da situação, título de 13 px, origem e há quanto tempo em 12 px) e "Ver todos os vencimentos".
6. **Menu do usuário**: avatar redondo de 32 px, nome, **empresa ativa sempre à vista** e `chevrons-up-down`. Abre com nome e e-mail, **Empresa ativa** (nome, CNPJ em mono e o check na atual), Alterar senha e Sair (em vermelho).

Menus suspensos: largura fixa, 6 px abaixo do botão, itens de 36 px com canto de 8 px, fecham com `Esc` e clique fora. Botões só com ícone têm `aria-label` e `title`.

**Cabeçalho da página (`CabecalhoDaPagina`, 08/11/2026):** toda tela começa com a mesma faixa branca, de ponta a ponta logo abaixo da barra superior, com linha embaixo. De cima para baixo:

1. **Identificação** (registro): número em mono, selo do status e selos de contexto (reincidente).
2. **Título** de 24 px, com o **voltar** quadrado à esquerda nas telas internas e as **ações** à direita (botões grandes, primário por último).
3. **Descrição**: uma frase do que a tela faz, em `texto-2`.
4. **Régua**: os números e dados que resumem a tela, lado a lado, com divisória vertical; rótulo em caixa alta de 12 px e o valor embaixo (número em 18 px, texto em 14 px). Valor que pede ação vai em vermelho e vira link para a lista filtrada. Listagem: contagens (Em aberto · Graves · Vencidas). Detalhe: dados do registro (Gravidade · Origem · Responsável · Prazo · Aberta em).
5. **Abas**, quando há, encostadas na linha de baixo.

**Início (cartão de visita do sistema):** o cabeçalho traz a saudação, a empresa, o relógio e a régua do dia (Prazos vencidos · Vencem em 7 dias · NCs em aberto · Planos em execução · Saúde do SGI). Logo abaixo, dois cards: **Saúde do sistema de gestão** (anel com a média e uma barra por componente, na cor da faixa: 90% ou mais em dia, 70 a 89% atenção, abaixo de 70% ação) e **Prioridade agora** (o componente mais baixo, o que falta e o botão que resolve). Depois, os atalhos dos módulos, o panorama das auditorias, "Precisa da sua atenção" e os gráficos, todos em card com cabeçalho e linha.

Aviso de confirmação e alerta de bloqueio ficam logo abaixo da faixa, não dentro. Telas antigas com cabeçalho próprio usam `CabecalhoComVoltar` (mesma faixa, com `regua` opcional).

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
│ Meio Amb.  │  │NC-2026-014│ Paquímetro fora de… │Inspeção │ 22/10│[Aberta]│
│ ESG        │  │ …        │                      │         │      │      ││
│ ────────── │  └──────────────────────────────────────────────────────────┘│
│ Cadastros  │                                                              │
│ Relatórios │                                                              │
└────────────┴──────────────────────────────────────────────────────────────┘
```

- **Menu lateral** no azul da marca (`menu`, #172477), com os grupos do QSSMA na ordem do documento de domínio. Grupo de módulo não contratado não aparece. O item ativo tem fundo um pouco mais claro e uma barra de 3 px em `ouro-claro` à esquerda.
- **Cabeçalho da página:** título de 24 px, uma linha de resumo em `texto-2` com os números que importam, e as ações à direita (primária por último).
- **A lista é uma tabela,** com filtros no topo. Não usamos cards para listar registros (no celular a própria tabela é que vira cartões, §7.1).
- **Registro aberto:** número em mono e status no topo. Conteúdo em cards com título de 15 px. O **histórico de alterações** fica sempre no rodapé do registro, porque é a trilha que o auditor pede.

### 7.1 Celular e tablet (decisão Q15)

O mesmo modelo da DaVinci Finance:

- **Computador (≥ 1024 px):** menu lateral fixo, recolhível.
- **Tablet (768–1023 px):** o menu abre como **gaveta** pelo botão da barra superior (fecha ao navegar, ao tocar fora, no X e com Esc); a trilha encolhe; tabelas largas rolam dentro do próprio quadro.
- **Celular (< 768 px):** **barra inferior** fixa, Início · NCs · **+** · Vencimentos · Menu (atalho sem permissão não aparece). O "+" abre uma folha com os mesmos registros do botão Novo, que some da barra superior; Menu abre a gaveta. O conteúdo ganha folga embaixo para não ficar atrás da barra, respeitando a área segura do iPhone.
- **Celular estreito (< 640 px):** toda tabela com cabeçalho vira **lista de cartões**: a primeira coluna com texto é o título, as outras aparecem como "rótulo valor" (o rótulo vem do cabeçalho, copiado por `components/rotulos-das-tabelas.tsx`). Tabela que precisa continuar tabela: `data-tabela="fixa"`. Abas numa linha só, com rolagem lateral; filtros e campos na largura toda.
- Regras globais em `app/globals.css`. Evite largura fixa (`w-64`, `min-w-60`) sem prefixo `sm:`.

### 7.2 Tela de cadastro (08/11/2026)

Vale para registrar e editar em página (mais de 6 campos; até 6, modal). Peças em `components/pagina-de-cadastro.tsx`; modelo: Gestão do SGI › Riscos e Oportunidades (`sgi/_ro`).

1. **Cabeçalho** (`CabecalhoDeCadastro`): botão de voltar quadrado, só com `ArrowLeft` (`aria-label` "Voltar para …"), à esquerda do título com verbo ("Registrar risco"); uma linha de descrição embaixo.
2. **Uma seção por bloco** (`SecaoDoCadastro`): painel com título, para que serve e a situação do preenchimento em texto ("Completa", "2 obrigatórios pendentes", "Opcional"). Nunca o formulário inteiro num único quadro, nem campos soltos no fundo da página.
3. **Coluna de resumo** (`ColunaDeResumo`, 288 px, fixa ao rolar no computador): **Resumo** com os valores que importam (inclusive os calculados, como o nível do risco) e **Preenchimento** com "5 de 7 obrigatórios · 71%" em texto e a lista das seções, que leva até cada uma.
4. **Regra condicional à vista:** quando um valor torna campos obrigatórios (nível alto exige ação, responsável e prazo), a seção mostra o aviso e os rótulos perdem o "(opcional)".
5. **Ações**: no computador (a partir de 1024 px), no fim do card de preenchimento, que flutua com o resumo ao rolar (os dois cards juntos, sem espaço entre eles); primário em cima, Cancelar embaixo, os dois na largura do card. Abaixo de 1024 px, num card (`BarraDeAcoes`) preso ao pé da tela no tablet e no fim da página no celular, com quantos obrigatórios faltam à esquerda. Nada de faixa solta de ponta a ponta.
6. **Voltar nas outras telas** (detalhe, configuração, documento para imprimir): o mesmo botão quadrado, ao lado do título. Use `CabecalhoComVoltar` (`components/pagina-de-cadastro.tsx`) envolvendo o que forma o cabeçalho (número e status, título, ações, resumo rápido); na barra de impressão, `BotaoVoltar` sozinho. O botão some no papel (`print:hidden`). Ações de texto secundárias ("Limpar filtros", "Inativar") usam `linkDiscreto` (`lib/estilos.ts`), nunca uma seta de voltar.

**Como montar um cadastro novo.** Use `CadastroEmBlocos` e `Bloco` (`components/cadastro-em-blocos.tsx`) dentro do `<form noValidate>`: cada `Bloco` é uma seção; o componente lê os campos e monta a situação de cada bloco, o "x de y obrigatórios", o resumo e a barra de ações. Regras:

- **Obrigatório é o campo com `required`.** O formulário continua com `noValidate`: quem valida é o servidor; o `required` só informa a tela (e o leitor de tela). Obrigatório condicional vira `required={condição}` com o rótulo trocando para "(opcional)" quando não vale (ex.: plano do PGR em risco alto ou crítico).
- `minLength` conta como mínimo para considerar o campo preenchido. Grupo de rádio ou de caixas conta uma vez, pelo `name`.
- `resumo` lista os campos que aparecem na coluna (rótulo + `name`); o valor sai como a pessoa vê (texto da opção, data em dd/mm/aaaa).
- Formulário usado também na edição dentro do detalhe: `embutido` mostra só os campos e o botão de salvar, sem blocos nem resumo.
- Telas montadas assim: abrir NC, plano de ação, inspeção, modelo de inspeção, instrumento de calibração; cliente ou fornecedor, funcionário, turma de treinamento; risco do PGR, acidente, entrega de EPI, permissão de trabalho, registro de SST, requisito legal, terceiro; aspecto ambiental, licença, monitoramento, produto químico, requisito legal ambiental; risco e oportunidade, análise crítica, inovação; auditoria e programação de auditoria; ordem de serviço; tema ESG; perfil de acesso.

### 7.3 Telas de erro (08/11/2026)

Peças em `components/pagina-de-erro.tsx` e `components/erros-do-sistema.tsx`. Mesma estrutura em todas: código em mono ("Erro 404"), título em linguagem comum, causa provável, ações e **detalhes técnicos copiáveis** (endereço, data e hora, ID do erro) para o suporte. Sem ilustração, sem número gigante, sem "Ops!".

| Arquivo                   | Quando                                                   | Onde aparece                                 | Ação primária    |
| ------------------------- | -------------------------------------------------------- | -------------------------------------------- | ---------------- |
| `app/(app)/not-found.tsx` | `notFound()` numa tela do sistema (registro inexistente) | Dentro do sistema, com menu e barra superior | Ir para o início |
| `app/not-found.tsx`       | Endereço que não existe                                  | Página independente (logo, sem menu)         | Ir para o início |
| `app/(app)/error.tsx`     | Falha ao montar uma tela                                 | Dentro do sistema                            | Tentar novamente |
| `app/global-error.tsx`    | Falha no layout raiz                                     | Página independente                          | Tentar novamente |

O "ID do erro" é o `digest` do Next, o mesmo que fica no log do servidor.

---

## 8. Componentes do QSSMA

| Componente                            | Regra                                                                                                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status** (`Selo`)                   | Retângulo de 22 px, canto de 4 px, só texto, sem ponto. Tons: perigo, atenção, sucesso, info, neutro. Os componentes de `marcadores*.tsx` já escolhem o tom de cada status  |
| **Vencido / atrasado** (`Alerta`)     | Selo de perigo com há quanto tempo ("Vencida há 3 dias") e, embaixo, o status e a data em cinza                                                                             |
| **Alerta em caixa** (`CaixaDeAlerta`) | Fundo e borda suaves no tom, ícone padrão do Lucide (`circle-alert`, `triangle-alert`, `circle-check`, `info`), título opcional e as ações que resolvem. Sem faixa lateral  |
| **Número do registro**                | Mono, `texto`, copiável com um clique                                                                                                                                       |
| **Prazo**                             | Data `dd/mm/aaaa`; vencendo, selo de atenção ao lado; vencido, `Alerta`                                                                                                     |
| **Tabela**                            | Cabeçalho em `superficie-2`, 12 px em caixa alta; linhas de 44 px com divisória e hover em `superficie-2`; ordenação com seta; paginação com números                        |
| **Matriz de risco 5×5**               | Quadrados com o marcador do nível (5.4) e a contagem de riscos. Eixos rotulados: Probabilidade (1–5) e Impacto (1–5)                                                        |
| **Checklist de inspeção**             | Três botões por item: OK, NOK, N/A, com o fundo suave do tom quando marcado                                                                                                 |
| **Faixa de indicadores**              | Uma moldura, indicadores separados por divisória vertical. Sem ícone                                                                                                        |
| **Card** (`painel`)                   | Cabeçalho com `cabecalhoDoPainel` (título `tituloDoPainel` de 15 px, descrição de 13 px, ações à direita) sobre a linha; corpo com `p-5`. Tabela encosta nas bordas do card |
| **Campos nativos**                    | Caixa de marcar e rádio de 16 px no azul da marca; seleção com a seta dupla do Lucide; rótulo de 14 px em `font-medium`, "(opcional)" em cinza                              |
| **Estado vazio**                      | Ícone de 28 px em `texto-3`, título do que falta, uma frase e o botão que resolve                                                                                           |
| **Botões** (`Botao`)                  | Ver §8.1. Verbo + objeto: "Abrir NC", "Liberar permissão". Um primário por área, em azul da marca                                                                           |

| **Seção recolhível** (`Recolhido`) | Card com cabeçalho clicável: ícone pelo verbo do título (`plus` cria, `pencil` edita, `ban` cancela ou inativa, `rotate-ccw` reativa, `book-open` leitura), título de 15 px e o chevron num quadrado à direita (para baixo fechado, para cima aberto). Sem o triângulo do navegador. `aberto` abre ao carregar (ex.: formulário de cadastro quando a lista está vazia); `fixo` não recolhe, para conteúdo que a pessoa sempre precisa ver (descrição do cargo, treinamentos e EPIs da função, como funciona o ISC). Resumo em texto ("Ver histórico") usa `dv-abrir`, que põe o chevron depois do texto |

### 8.1 Botões

Todo botão é o componente `Botao` (`components/botao.tsx`); só com ícone, `BotaoIcone`. O ESLint recusa classe de botão solta em `className`.

| Variante     | Quando                                                             |
| ------------ | ------------------------------------------------------------------ |
| `primario`   | A ação que conclui a tarefa. Um por área (cabeçalho, card, modal)  |
| `secundario` | Apoio: Exportar, Imprimir, Filtrar, Cancelar no cadastro (padrão)  |
| `fantasma`   | Ações de linha (Retirar, Manter), descartar, botão só com ícone    |
| `perigo`     | Excluir, anular, inativar: vermelho cheio e sempre com confirmação |
| `link`       | Navegação no meio do texto ("Cadastre o cliente")                  |

| Tamanho   | Altura | Onde                                                  |
| --------- | ------ | ----------------------------------------------------- |
| `grande`  | 40 px  | Cabeçalho da página e barra de ações do cadastro      |
| `medio`   | 36 px  | Corpo da tela, filtros, modais, estado vazio (padrão) |
| `pequeno` | 30 px  | Linha de tabela, cabeçalho de card, ações em lote     |

**Ícone pela ação, nunca o da tela do menu** (16 px; 14 no pequeno; traço 1,75; cor do texto). À esquerda, exceto seta de avançar e abrir menu, à direita:

| Ação                                           | Ícone                                  |
| ---------------------------------------------- | -------------------------------------- |
| Criar registro (Abrir NC, Registrar acidente…) | `Plus`                                 |
| Salvar, concluir, aprovar                      | Nenhum                                 |
| Editar                                         | `Pencil`                               |
| Excluir, anular, remover                       | `Trash2`                               |
| Filtrar                                        | `ListFilter`                           |
| Exportar, baixar planilha                      | `Download`                             |
| Imprimir, PDF                                  | `Printer`                              |
| Enviar, e-mail, WhatsApp                       | `Send`, `Mail`, `MessageCircle`        |
| Anexar · Copiar · Consultar                    | `Paperclip` · `Copy` · `Search`        |
| Tentar de novo · Voltar                        | `RotateCw` · `ArrowLeft`               |
| Avançar, resolver · Abrir menu                 | `ArrowRight` · `ChevronDown` (direita) |

**Verbos de criar:** Abrir (NC, OS), Registrar (eventos: acidente, inspeção, entrega, análise, turma), Cadastrar (cadastros: instrumento, terceiro, licença, produto, requisito, aspecto, tema, profissional, risco) e os do domínio (Solicitar PT, Planejar auditoria, Propor inovação, Criar plano). Nada de "Novo X".

**Estados:** `carregando` troca o texto ("Salvando…"), tira o ícone e trava o botão, sem giro (o sistema não anima); desabilitado leva `motivo`, que aparece ao passar o mouse. Com `href` o botão é link; com `download` ou endereço de fora (e-mail, WhatsApp), âncora comum.

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
- [ ] Texto em IBM Plex Sans, números de registro em IBM Plex Mono
- [ ] Status em `Selo`, avisos em `CaixaDeAlerta`, botões e campos das classes de `lib/estilos.ts`; nada de classe de cor, canto ou sombra montada à mão
- [ ] Textos com verbo + objeto e mensagens de erro que dizem como corrigir
- [ ] Cadastro em página segue a §7.2 (voltar, um bloco por seção, resumo, barra de ações)
- [ ] Conferida em 1280 px e 390 px de largura
- [ ] Dados de demonstração plausíveis, sem _lorem ipsum_
- [ ] Uma pessoa olhou a tela pronta e responderia "não" para "isso parece feito por IA?"

---

## 11. Diferenças em relação à Finance

A estrutura (monorepo, microsserviços, gateway, pacotes) é a mesma da Finance. O visual é próprio:

|                           | Finance           | Qualidade                                             |
| ------------------------- | ----------------- | ----------------------------------------------------- |
| Tipografia                | IBM Plex          | IBM Plex Sans / Mono (mesma família desde 08/11/2026) |
| Cor de destaque           | Laranja Finance   | Azul da marca #172477; ouro só no item ativo do menu  |
| Centro da tela            | Números e valores | Registro, número e status                             |
| Cores semânticas próprias | Finanças          | Conformidade, prazos e níveis de risco                |

Os tokens estão em `packages/tokens/css/tema.css`. O tema do Tailwind é zerado e só recebe estes tokens, e o ESLint do `apps/web` recusa degradê, cor solta, canto e sombra grandes, emoji e as fontes Inter, Geist, Manrope, Sora e Poppins. A referência visual completa (componentes e telas de exemplo) é o design system aprovado em 08/11/2026. Qualquer mudança de cor passa por aqui primeiro, com o contraste medido.

## Ícones

Biblioteca única: **Lucide** (`lucide-react`, versão fixa no catálogo do monorepo). Onde entra:

| Lugar              | Regra                                                                                                                                                                                                                                                 |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Menu lateral       | Um ícone por grupo (18 px) e por tela (16 px), mapeados em `components/icones-do-menu.tsx`. Tela nova ganha ícone lá                                                                                                                                  |
| Botões             | Criar e registrar: `Plus`. Filtrar: `ListFilter`. Voltar: `ArrowLeft`. Anexar: `Paperclip`. Ícone antes do texto, 16 px                                                                                                                               |
| Barra superior     | Recolher o menu, trilha, busca, Novo, notificações e o menu do usuário com a empresa ativa (§7)                                                                                                                                                       |
| Avisos e situações | Sucesso: `CircleCheck` verde. Erro: `CircleAlert`. Situação que exige ação (vencido, bloqueado, pendente) usa o componente `Alerta` (texto em vermelho com há quanto tempo; sem caixa nem ícone) em vez de `CircleAlert`, para não depender só da cor |

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

As telas de acesso (`.dv-acesso`) são a única área com degradê do sistema. O resumo do início é um painel branco comum (16/10/2026): saudação, prazos vencidos, a prioridade com link e a saúde do sistema de gestão em lista compacta.

As telas de acesso (entrar, esqueci a senha, código do 2FA) seguem o mesmo design system desde 08/11/2026: no computador, o painel da marca em azul sólido (`menu`) à esquerda, com a logo, uma frase do que o sistema faz, as cinco áreas com ícone em `ouro-claro` e as normas em selos de contorno; à direita, o cartão branco (`painel`) sobre o `fundo`, com campos de 40 px e botão primário. Sem foto, degradê, vidro, sombra grande nem "Bem-vindo(a)". As classes `.dv-acesso-*` só aplicam os tokens.
