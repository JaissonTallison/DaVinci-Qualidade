# Histórico de mudanças

Formato: [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda mudança entra em **Não lançado** no mesmo PR.

## [Não lançado]

### Adicionado

- Agenda ESG no serviço `esg` ([módulo](docs/05-modulos/esg.md)): catálogo com os 14 temas da Agenda ESG (material de domínio), dupla materialidade (impacto × relevância) com meta, responsável e andamento para os temas materiais, matriz de materialidade, mapa dos ODS redesenhado do material (educação na base, três blocos e parcerias), os 17 ODS com as cores oficiais e painel ESG que abre com os 5 pilares da sustentabilidade e traz os indicadores dos outros módulos. Entra nos vencimentos, na pesquisa, no botão Novo e numa aba do início (sétima cor de série, `serie-7`).
- Gráficos: eixo abreviado a partir de 10 mil ("20 mil") para os números não ficarem cortados. Barra inferior do celular com nome próprio ("Navegação") para leitores de tela.
- Meio Ambiente, parte 2 ([módulo](docs/05-modulos/ambiental.md)): produtos químicos com perigos do GHS e revisão da FDS a cada 5 anos; consumo mensal de água, energia e combustíveis com gráfico do ano; inventário de GEE (escopos 1 e 2) com fatores de emissão informados pela empresa; monitoramentos com limites, resultados conformes ou fora do limite e próxima coleta. Entram nos vencimentos, na pesquisa, no botão Novo e na aba do início.
- Sistema responsivo para celular e tablet, como na DaVinci Finance (decisão Q15): menu em gaveta abaixo de 1024 px, barra inferior no celular (Início · NCs · + · Vencimentos · Menu, com o "+" abrindo os registros do botão Novo), tabelas que viram cartões, filtros na largura toda, abas com rolagem lateral e destaque do início empilhado.
- Meio Ambiente no serviço `ambiental` ([módulo](docs/05-modulos/ambiental.md)), parte 1: aspectos e impactos (LAIA) com significância calculada e controle obrigatório quando significativo, requisitos legais com avaliação anual de atendimento, licenças com alerta de renovação (120 dias, CONAMA 237), protocolo e condicionantes periódicas, resíduos com saídas por MTR e cobrança do CDF em 30 dias; entram no painel de vencimentos, na pesquisa, no botão Novo e numa aba do início (sexta cor de série, `serie-6`).
- Recolher e expandir o menu lateral com animação suave da largura (400 ms); o modo compacto surge ao fim, esmaecendo. Sem animação para quem pediu "reduzir movimento".
- Botões de criar mostram o ícone do assunto (o mesmo do menu) no lugar do "+"; o botão Novo da barra superior mostra a seta de lista. Listas de prazos (início, sino e painel) com o ícone do assunto e um selo de texto com a situação.
- Início redesenhado (decisões Q13 e Q14): destaque com a saúde do sistema de gestão (anel animado e o pior indicador com "Resolver agora"), atalhos, abas por assunto, filtro de período (30 dias, 90 dias, 12 meses), gráficos de prazos por semana, prazos por módulo, NCs por mês e taxa de frequência, com tooltip, realce e clique para a lista; prazos no painel com horizonte de até 365 dias; NCs abertas e encerradas por mês na API.
- Versão do sistema no rodapé do menu lateral, lida do `package.json` da raiz.
- Menu lateral verde-petróleo (token `menu`, #1C5560): texto claro, logo para fundo escuro, ícones dos grupos e barra do item ativo em ouro claro (token `ouro-claro`, #D9A441).
- Ícones dos grupos do menu lateral em ouro.
- Serviços no serviço `servicos` ([módulo](docs/05-modulos/servicos.md)): ordens de serviço com relatório e avaliação do cliente, NPS dos últimos 12 meses e avaliação de fornecedores com classificação e próxima avaliação; entram no painel de vencimentos, na pesquisa e no início.
- Cadastros › Clientes e fornecedores: tela enxuta sobre o cadastro do `codex` (documento, nome, papéis, contato), usada por Serviços.
- Pesquisa geral ([módulo](docs/05-modulos/busca.md)): Ctrl+K ou botão na barra superior abre uma janela que encontra telas e registros de todos os módulos que a pessoa vê. A barra superior fica fixa ao rolar a página.
- Barra superior em branco gelo (token `barra`, #F8FAFC, 56 px): trilha da página, botão "+ Novo" com os registros que a pessoa pode criar, sino com os prazos vencidos e menu do usuário (iniciais, nome, empresa, trocar a senha, sair).
- Ícones Lucide no menu (grupos e telas), nos botões de criar, filtrar, voltar e anexar, na barra superior e nos avisos; situação que exige ação ganha ícone de alerta além da cor.
- Menu lateral: ícones nos grupos, grupos recolhíveis (lembrados entre acessos) e modo compacto só com ícones, alternado por um botão na barra superior. Os vencidos ficam no sino da barra superior.
- Painel de vencimentos no serviço `paineis` ([módulo](docs/05-modulos/paineis.md)): prazos vencidos e dos próximos 30 dias de Qualidade, Segurança, ASO e treinamentos e SGI, cada serviço respondendo os seus; resumo no início. Aviso diário por e-mail às 7h, por usuário e só com os módulos dele, e envio manual pelo administrador.
- Gestão do SGI no serviço `sgi` ([módulo](docs/05-modulos/sgi.md)): riscos e oportunidades com classificação e tratamento, objetivos da qualidade com medição mensal, análise crítica pela direção com roteiro da 9.3.2 e números dos módulos, gestão de mudanças com decisão de outro gestor e verificação; resumo no início.
- Terceiros ([módulo](docs/05-modulos/terceiros.md)): empresas terceirizadas com CNPJ e contrato, documentos de SST com validade (o novo substitui o antigo), situação liberada ou com pendência (PGR, PCMSO e ASO obrigatórios), anexos.
- Registros de segurança ([módulo](docs/05-modulos/registros-de-seguranca.md)): DDS, APR, reunião da CIPA e simulado de emergência, com anexos, anulação com motivo e alertas de CIPA sem reunião mensal e simulado com mais de 12 meses.
- PGR ([módulo](docs/05-modulos/pgr.md)): inventário de riscos, matriz severidade × probabilidade, plano obrigatório para alto e crítico.
- Permissões de trabalho ([módulo](docs/05-modulos/permissoes-de-trabalho.md)): solicitar, liberar por outra pessoa autorizada, encerrar, cancelar; até 12 horas; anexos.
- PGR no serviço `seguranca` ([módulo](docs/05-modulos/pgr.md)): inventário de riscos por grupo e local, nível pela matriz severidade × probabilidade, plano obrigatório para risco alto ou crítico, ações vencidas no resumo.
- Permissões de trabalho no serviço `seguranca` ([módulo](docs/05-modulos/permissoes-de-trabalho.md)): solicitar, liberar (outra pessoa, com `seguranca.liberar-pt`), encerrar e cancelar; no máximo 12 horas; horário vencido sem encerramento em destaque; anexos.
- Exames ocupacionais (ASO) e treinamentos no serviço `codex` ([módulo](docs/05-modulos/exames-e-treinamentos.md)): ASO com próximo exame (menos o demissional) e anulação com motivo; catálogo de treinamentos com carga horária e validade; registro de turma para várias pessoas de uma vez; tela de vencimentos (vencido, vence em até 30 dias) e resumo no início. `somarMeses` passa para `@davinci/shared`.
- Anexos e evidências no serviço `plataforma` ([módulo](docs/05-modulos/anexos.md), decisão Q11): PDF, fotos, DOCX e XLSX até 10 MB, com o conteúdo conferido pelo tipo, ligados a NC, plano de ação, inspeção, instrumento, auditoria e acidente; a permissão é a do módulo dono do registro; remover tira da lista sem apagar o arquivo.
- Telas de Administração (grupo próprio no menu): usuários (cadastrar com senha provisória mostrada uma vez, trocar perfil, tirar e devolver acesso, gerar nova senha provisória, desativar duas etapas), perfis de acesso (permissões agrupadas por módulo, exigir duas etapas, inativar) e módulos contratados.
- Funcionários no serviço `codex` ([módulo](docs/05-modulos/funcionarios.md)): setores e funções da empresa (com CBO), funcionário com matrícula e CPF únicos na empresa, desligamento com data e motivo, readmissão com a mesma matrícula; setor ou função com funcionário ativo não se inativa. Rotas em `/funcionarios`, `/setores-da-empresa` e `/funcoes`; telas no grupo Cadastros, sempre ligado.
- Controle de EPIs no serviço `seguranca` ([módulo](docs/05-modulos/epis.md)): catálogo com CA e validade, entrega só com CA válido na data e só para funcionário ativo (conferido no `codex`), próxima troca pela vida útil, troca vencida, devolução e anulação com motivo. Rotas em `/epis` e `/epis/entregas`; telas de catálogo e entregas, ficha de EPI na página do funcionário e resumo no início.

- Segurança do Trabalho no serviço `seguranca` ([módulo](docs/05-modulos/acidentes.md)): acidentes com e sem afastamento, incidentes e quase-acidentes; CAT com prazo legal (primeiro dia útil seguinte) e alerta de atraso; investigação com causas e medidas; acidente com lesão exige CAT para concluir; TF, TG e dias sem acidente pela NBR 14280, com as horas-homem lançadas por mês (mês sem horas fica sem taxa, nunca zero). Rotas em `/acidentes`; telas de acidentes e indicadores; o acidente abre a NC já preenchida; o início ganha o resumo de segurança.

- Auditorias no serviço `auditorias` ([módulo](docs/05-modulos/auditorias.md)): planejar (tipo, escopo, normas, equipe), iniciar, registrar constatações (conformidade, NC maior, NC menor, observação, oportunidade de melhoria) com norma, cláusula e evidência, formalizar a constatação de NC como NC no serviço `qualidade` (origem Auditoria, prazo padrão de 30 dias), concluir com conclusão escrita e toda NC formalizada. Rotas em `/auditorias`; telas e grupo próprio no menu.
- `pedir()` em `@davinci/shared`: um serviço pede a outro e espera a resposta, repassando a recusa original (decisão Q10). `hojeEmBrasilia` e `somarDias` passam para `@davinci/shared`.

- Calibração no serviço `qualidade` ([módulo](docs/05-modulos/calibracao.md)): instrumentos com TAG única, histórico de calibrações, situação calculada (sem calibração, em dia, vence em até 30 dias, vencido, reprovado, fora de uso), próxima calibração pela frequência em meses respeitando o fim do mês, reprovada bloqueia até nova aprovada, anulação com motivo no lugar de edição. Rotas em `/instrumentos`; telas de lista, cadastro e detalhe; instrumento reprovado abre a NC já preenchida; o início ganha o resumo de calibração.

- Inspeções no serviço `qualidade` ([módulo](docs/05-modulos/inspecoes.md)): uma tela para inspeções e checklists, com tipo; itens respondidos OK, NOK ou N/A; um NOK reprova; concluir exige tudo respondido e NOK descrito; concluída, vira registro. Modelos de inspeção reaproveitáveis, com itens copiados para cada inspeção. Rotas em `/inspecoes` e `/modelos-de-inspecao`.
- Telas de inspeções e modelos; inspeção reprovada abre a NC já preenchida com os itens NOK, e lista as NCs abertas a partir dela; o início ganha o resumo das inspeções.
- [Armadilhas conhecidas](docs/01-engenharia/armadilhas.md) do projeto.

- Planos de ação no serviço `qualidade` ([módulo](docs/05-modulos/planos-de-acao.md)): tarefas no formato 5W2H, status que segue as tarefas (concluir a última leva a "aguardando eficácia"), verificação de eficácia que pede tarefas novas quando o objetivo não foi alcançado, progresso e prazo calculados, cancelamento de tarefa e de plano com motivo. Rotas em `/planos-de-acao`.
- Telas de planos de ação (lista, criação e detalhe com as ações na linha de cada tarefa); a NC mostra os planos ligados e cria um plano já preenchido; a tela de início ganha o resumo dos planos.
- `pnpm db:generate` de todos os serviços tira sozinho o esquema `"public"` que o drizzle-kit escreve nas chaves estrangeiras.

- Não conformidades no serviço `qualidade`: abertura com numeração `NC-AAAA-NNN`, ciclo aberta → em tratamento → em verificação → encerrada, verificação de eficácia com ciclos, cancelamento com motivo, lista com filtros e resumo. Rotas em `/nao-conformidades` ([módulo](docs/05-modulos/nao-conformidades.md)).
- `apps/web` (Next.js 16, porta 3170): login, código de 2 etapas, troca da senha inicial, casca com menu dos grupos do QSSMA (filtrado por módulo e permissão) e as telas de Não conformidades: lista, abertura e detalhe com o ciclo de tratamento.
- `packages/tokens`: cores, tipografia (família Source), cantos e sombras do padrão da Qualidade, com o tema do Tailwind zerado.
- ESLint do web recusa degradê, cor solta, canto e sombra grandes, vidro fosco, animação decorativa, emoji e as fontes Inter, Geist, Manrope, Sora e Poppins.
- `pnpm dev:tudo`: um comando sobe infraestrutura, migrações, web, gateway e serviços, com os logs no mesmo terminal; `--essencial` sobe só o que as telas usam. Ctrl+C encerra o grupo inteiro de processos.
- Checagem que recusa migração com esquema `"public"` fixo (`scripts/conferir-migracoes.mjs`, roda no `pnpm lint` e no CI).

### Alterado

- O sistema é sempre claro, mesmo com o computador no modo escuro (decisão Q12).

### Corrigido

- Selects controlados (tipo do acidente, modelo da inspeção) também perdiam o valor depois de um erro de validação.
- Selects controlados (tipo do acidente, modelo da inspeção) também perdiam o valor depois de um erro de validação.
- Listas ordenadas por nome punham os acentuados no fim ("Óculos" depois de "Protetor"): a ordem agora usa a collation ICU `pt-BR` (`ordemAlfabetica` em `@davinci/database`).
- Depois de um erro de validação, os campos de escolha (`<select>`) voltavam para "Escolha" e a pessoa tinha de escolher de novo (componente `Selecao`).
- No celular, tabelas com coluna de ações alargavam a página inteira; agora rolam dentro do próprio quadro.

- Formulário de ação mostrava um erro antigo depois de outra ação na mesma tela; agora recomeça quando a versão do registro muda.

- `pnpm db:generate --name=<assunto>` repassa o nome ao drizzle-kit (antes, ia parar na checagem e a migração saía com nome aleatório).

- Chaves estrangeiras da migração do `codex` apontavam para `"public"`, o que quebrava os testes de integração de parceiros.

## 0.1.0 — 15/10/2026

- Estrutura inicial: gateway e 12 microsserviços no padrão da DaVinci Finance, kit de marca, padrão de interface e regras contra vibecode.
