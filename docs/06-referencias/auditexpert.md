# Material de referência: AuditExpert SGI

> **Fonte:** telas do AuditExpert SGI enviadas pelo usuário (15/10/2026). Usamos só o **conteúdo** (decisão Q9): o visual
> e o código não entram no DaVinci Qualidade. Este arquivo junta o material até a implementação no módulo de Auditorias.

## 1. Organização da ferramenta

Jornada em 5 etapas, com uma **auditoria ativa** escolhida na faixa do topo (sem auditoria ativa, os módulos funcionam
só como consulta aos bancos). Contadores no topo: perguntas selecionadas e NCs no relatório.

| Etapa        | Telas                                                          |
| ------------ | -------------------------------------------------------------- |
| 1. Planejar  | Kit Pré-Auditoria, Plano de Auditoria, Roteiros de Entrevista  |
| 2. Auditar   | Biblioteca de Evidências                                       |
| 3. Registrar | Banco de NCs                                                   |
| 4. Tratar    | Planos de Ação (PAC)                                           |
| 5. Entregar  | Relatório de Auditoria                                         |
| Apoio        | Prompts de IA, Minha biblioteca, Log do Auditor, Manual de Uso |

Cada tela tem um checklist automático da etapa (itens automáticos marcam sozinhos; os manuais a pessoa confirma) e um
bloco "Próximo passo" no fim. O Dashboard mostra o percentual de prontidão do kit, NCs e planos abertos e o próximo passo
recomendado.

Fluxo dos dados: perguntas selecionadas nos Roteiros → aparecem na Biblioteca de Evidências para resposta → respostas
Parcial e Não conforme viram achados no Banco de NCs → cada NC vira um plano no PAC → tudo entra no Relatório.

## 2. Módulos

**Kit Pré-Auditoria (externa):** linha do tempo dos 90 dias antes da auditoria de certificação ou recertificação. Cada
item tem responsável sugerido, status (Pendente, Em andamento, Concluído) e, às vezes, um atalho "Ir para" outro
módulo (Roteiros, Evidências, NCs). Percentual de prontidão = itens concluídos ÷ total (ex.: 18 de 30 = 60%). O progresso
fica salvo na conta. Itens na seção 3.

**Roteiros de Entrevista:** perguntas por processo com objetivo, **resposta esperada** (conforme) e **sinal de alerta**
(não conforme). 14 processos: Comercial, Produção, RH, Compras, Qualidade, Manutenção, Logística, Meio Ambiente, SSO,
Alta Direção, Projeto e Desenvolvimento, Assistência Técnica, TI e Segurança da Informação, Contratadas e Terceiros.
Filtros por norma, cláusula/requisito e processo, busca por palavra; "Incluir na auditoria"; perguntas próprias ("Minhas
perguntas", salvas para as próximas auditorias); conjuntos de filtros salvos com nome; exportar o roteiro de campo em PDF
com espaço para anotação. Roteiro realista: 8 a 15 perguntas por processo.
Exemplo: processo Compras, ISO 9001, cláusula 8.4: 6 perguntas sobre qualificação de fornecedores.

**Biblioteca de Evidências e execução:** responder as perguntas da auditoria ativa (Conforme, Parcial, Não conforme),
registrar a evidência objetiva verificada; consultar, por cláusula, qual evidência pedir, o tipo (documento, registro,
entrevista, observação in loco) e o risco se ela não existir. Normas: 9001, 14001, 45001, 27001, 28000, 31000 e SGI
integrado; na 27001, o controle do Anexo A:2022 (93 controles em 4 temas). Exporta a lista filtrada em PDF.
Exemplo: "Ata da análise crítica de 12/03/2026, com lista de presença assinada e plano de ação n.º …".
Erros comuns: registrar opinião no lugar de evidência (cite documento, número e data); deixar perguntas em Pendente
(travam o avanço da etapa e do relatório).

**Banco de NCs:** modelos de redação de não conformidade, causa raiz comum, ação corretiva e evidência de fechamento.
Formalizar em um clique os achados Parciais e Não conformes; filtrar por norma, cláusula e tipo de desvio (documentação,
execução, registro, competência, comunicação, recursos); copiar a redação e ajustar; levar a NC ao relatório ou a um
plano. Exemplo: "Não foi evidenciada a análise crítica pela direção referente ao exercício de 2025, contrariando o
requisito 9.3.2 da ISO 9001." Erros comuns: citar cláusula genérica (só "ISO 9001"), em vez do requisito.

**Planos de Ação (PAC):** NCs da auditoria ativa sem plano; plano a partir de uma NC ou do zero; causa raiz, ação
corretiva, responsável, prazo; status (aberto, em andamento, concluído) e evidência de fechamento.
Exemplo: causa raiz "procedimento sem responsável definido"; ação "revisar o PR-08 incluindo aprovador"; responsável Ana
(Qualidade); prazo 30/09; evidência "PR-08 rev.4 publicado". Erros comuns: ação "orientar a equipe" sem mudar processo ou
documento; fechar o plano sem anexar a evidência.

**Relatório de Auditoria:** empresa, unidade, datas, escopo, objetivo, equipe e metodologia; entrevistas conduzidas e
constatações das etapas anteriores; incluir outras constatações por busca e norma; editar qualquer redação ou criar NC
própria; planos de ação, pontos fortes e conclusão; PDF em um clique. Exemplo de escopo: "Auditoria interna do SGQ na
unidade Matriz, abrangendo os processos Comercial, Compras e Produção, conforme ISO 9001:2015." Erros comuns: PDF sem
conclusão (é o que a diretoria lê primeiro); repetir a descrição da NC no campo de causa raiz.

**Prompts de IA:** biblioteca de comandos prontos para ferramentas de IA, filtrável por norma, categoria (redação de NC,
causa raiz, plano de ação, comunicação com liderança e outras) e tipo de evidência; copiar com um clique; dica de uso em
cada um. Regra: revisar a resposta com os dados reais; o prompt acelera a redação, não substitui a evidência.

**Ainda não visto (telas a receber):** Plano de Auditoria, Minha biblioteca, Log do Auditor, Dashboard, o detalhe de cada
evidência (seção 7), o conteúdo dos bancos de perguntas, modelos de NC e prompts e as respostas das perguntas frequentes.

## 3. Kit Pré-Auditoria Externa: itens

Transcritos das telas. Itens repetidos no original estão marcados como **(repetido)** e entram uma vez só.

**90 dias antes**

| Item                                                                                                                 | Responsável sugerido           | Atalho     |
| -------------------------------------------------------------------------------------------------------------------- | ------------------------------ | ---------- |
| Confirmar escopo da auditoria e normas aplicáveis com o organismo certificador                                       | Coordenador de Qualidade / SGI | —          |
| Confirmar escopo, sítios e normas da auditoria com o Organismo Certificador **(repetido do anterior, com "sítios")** | Coordenador de Qualidade       | —          |
| Revisar planejamento anual de auditorias internas e reagendar pendências                                             | Coordenador de Qualidade       | Roteiros   |
| Revisar Manual do SGI e política, garantindo aderência à versão vigente das normas                                   | Coordenador de Qualidade       | Evidências |
| Atualizar matriz de requisitos legais (Qualidade, Meio Ambiente e SSO)                                               | Coordenador do SGI             | Evidências |
| Levantar mudanças significativas ocorridas desde a última auditoria (processos, layout, produtos)                    | Gerentes de área               | —          |
| Iniciar análise crítica preliminar de indicadores e riscos                                                           | Alta Direção                   | —          |
| Iniciar programa completo de auditorias internas cobrindo 100% do escopo                                             | Auditores Internos             | Roteiros   |

**30 dias antes**

| Item                                                                                     | Responsável sugerido     | Atalho     |
| ---------------------------------------------------------------------------------------- | ------------------------ | ---------- |
| Realizar auditoria interna cruzada em todos os processos do escopo **(aparece 2 vezes)** | Coordenador de Qualidade | Roteiros   |
| Consolidar indicadores de desempenho dos últimos 12 meses por processo                   | Donos dos Processos      | —          |
| Atualizar matriz de requisitos legais (aplicável a 14001/45001)                          | Meio Ambiente / SSO      | Evidências |
| Revisar tratamento de todas as NCs abertas nos últimos 12 meses                          | Coordenador do SGI       | NCs        |
| Revisar matriz de aspectos e impactos ambientais                                         | Meio Ambiente            | Evidências |
| Revisar matriz de perigos e riscos ocupacionais                                          | SSO                      | Evidências |
| Simular perguntas de auditoria com donos de processo usando os roteiros de entrevista    | Coordenador do SGI       | Roteiros   |
| Confirmar vigência de treinamentos NR e calibrações                                      | RH / Manutenção          | Evidências |

**15 dias antes**

| Item                                                                                 | Responsável sugerido      | Atalho     |
| ------------------------------------------------------------------------------------ | ------------------------- | ---------- |
| Fechar todas as NCs abertas com evidência objetiva de eficácia **(aparece 2 vezes)** | Responsáveis por processo | NCs        |
| Preparar apresentação de abertura (escopo, política, indicadores, plano de melhoria) | Alta Direção              | —          |
| Consolidar evidências objetivas por cláusula em pasta única                          | Coordenador de Qualidade  | Evidências |
| Organizar pastas físicas/digitais de evidências por cláusula                         | Coordenador de Qualidade  | Evidências |
| Revisar disponibilidade e agenda dos entrevistados-chave                             | Coordenador de Qualidade  | Roteiros   |
| _(um item não apareceu nas telas)_                                                   |                           |            |
| Verificar documentação legal ambiental (licenças, MTR, CDF) vigente                  | Meio Ambiente             | Evidências |

**1 semana antes**

| Item                                                                                         | Responsável sugerido     | Atalho     |
| -------------------------------------------------------------------------------------------- | ------------------------ | ---------- |
| Realizar Reunião de Análise Crítica com pauta completa da cláusula 9.3 **(aparece 2 vezes)** | Alta Direção             | Evidências |
| Comunicar plano de auditoria a todos os colaboradores envolvidos                             | RH / Comunicação         | —          |
| Verificar disponibilidade de intérpretes, EPIs para o auditor e crachás de visitante         | Facilities / SESMT       | —          |
| Realizar briefing com auditados: postura, o que apresentar, como responder                   | Coordenador de Qualidade | Roteiros   |
| Simular perguntas críticas com gestores de processo                                          | Coordenador de Qualidade | Roteiros   |
| Preparar apresentação de abertura (escopo, política, objetivos, indicadores)                 | Alta Direção             | —          |
| Testar acesso do auditor externo aos sistemas (leitura) e organizar credenciais              | TI                       | —          |

**Dia da auditoria**

| Item                                                                                                | Responsável sugerido                    | Atalho     |
| --------------------------------------------------------------------------------------------------- | --------------------------------------- | ---------- |
| Disponibilizar sala, acesso ao sistema e organograma atualizado **(aparece 3 vezes)**               | RH / Facilities                         | —          |
| Designar acompanhante fixo do auditor com autonomia para acessar documentos                         | Coordenador de Qualidade                | —          |
| Manter equipe de resposta rápida pronta para localizar evidências solicitadas **(aparece 2 vezes)** | Donos dos Processos                     | Evidências |
| Ter guia designado para acompanhar o auditor em campo                                               | Coordenador de Qualidade                | —          |
| Ter escriba/anotador registrando pontos levantados em tempo real                                    | Coordenador de Qualidade                | —          |
| Manter kit de evidências digital acessível para consulta rápida                                     | Coordenador de Qualidade                | Evidências |
| Realizar reunião de fechamento diária para alinhar achados                                          | Coordenador de Qualidade / Alta Direção | —          |

## 4. Glossário

| Termo                               | Definição                                                                                                                      | Exemplo                                                                                                                    |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Critérios de auditoria              | Conjunto de requisitos usado como referência: normas, documentos internos, requisitos legais e de cliente                      | ISO 9001:2015; procedimentos internos; requisitos específicos do cliente (CSR)                                             |
| Horas de auditoria                  | Tempo efetivo de auditoria conduzido, sem contar preparação e redação do relatório                                             |                                                                                                                            |
| Prontidão                           | Percentual de itens concluídos sobre o total do kit                                                                            | 18 de 30 itens = 60%                                                                                                       |
| Incluir na auditoria                | A pergunta marcada vai para a etapa Auditar, onde se registra a resposta, e alimenta as NCs e o relatório                      |                                                                                                                            |
| Resposta esperada × sinal de alerta | Esperada caracteriza conformidade; alerta indica desvio e pede aprofundamento                                                  | Esperada: "avaliamos o fornecedor a cada 6 meses e registramos em planilha". Alerta: "a gente confia, é fornecedor antigo" |
| Minhas perguntas                    | Perguntas criadas pelo auditor, salvas na conta e listadas junto com o banco nas próximas auditorias                           |                                                                                                                            |
| Conforme, Parcial, Não conforme     | Atendido e evidenciado; atende em parte ou sem evidência completa; requisito não atendido                                      |                                                                                                                            |
| Evidência objetiva                  | Dado verificável que comprova o atendimento: documento, registro, medição ou observação identificada                           | Certificado de calibração n.º 8821, válido até 09/2026                                                                     |
| Nível de risco                      | Impacto provável caso a evidência não exista; ajuda a priorizar o que investigar                                               |                                                                                                                            |
| Controle do Anexo A                 | Nas evidências da ISO 27001, o controle do Anexo A:2022 (93 controles em 4 temas) ligado ao item                               |                                                                                                                            |
| NC maior, NC menor, observação      | Falha sistêmica ou ausência total do requisito; falha pontual e isolada; ponto de atenção que ainda não é desvio               |                                                                                                                            |
| Causa raiz                          | Motivo que permitiu o desvio, não a repetição do fato                                                                          | Fato: registro sem assinatura. Causa: procedimento não define responsável pela aprovação                                   |
| Formalizar achado                   | Leva o item Não conforme ou Parcial da etapa Auditar para a lista de NCs do relatório                                          |                                                                                                                            |
| Correção × ação corretiva           | Correção resolve o caso; ação corretiva elimina a causa para não se repetir                                                    | Correção: assinar o registro. Corretiva: revisar o procedimento definindo o aprovador                                      |
| Evidência de fechamento             | Registro que comprova que a ação foi executada                                                                                 | Documento revisado, lista de presença, print do sistema                                                                    |
| Verificação de eficácia             | Checagem posterior (normalmente 30 a 90 dias) de que o problema não voltou                                                     |                                                                                                                            |
| Escopo × objetivo                   | Escopo é o que foi auditado (processos, unidade, norma); objetivo é o porquê (verificar conformidade, preparar recertificação) |                                                                                                                            |
| Metodologia                         | Como a auditoria foi feita: entrevistas, análise documental, observação in loco e amostragem                                   |                                                                                                                            |
| NC própria                          | Não conformidade escrita do zero, que entra no PDF igual às do banco                                                           |                                                                                                                            |

## 5. Perguntas frequentes (só os títulos; as respostas não vieram nas telas)

Para que serve a auditoria ativa; usar só para consultar os bancos; como as perguntas chegam ao relatório; transformar NC
em plano de ação; checklist do topo de cada tela; normas incluídas; gerar e editar o relatório; NC que não está no banco;
acesso vitalício e mais de um aparelho; e-mail de acesso e senha esquecida; anotações ficam salvas; exportar evidências e
roteiros em PDF; controles do Anexo A e o filtro; salvar e reutilizar filtros; é curso, recebe atualizações; tela não
carregou; falar com o suporte.

## 6. Como entra no DaVinci Qualidade (rascunho para a implementação)

- Já existe: auditoria com ciclo de vida, constatações, formalizar NC em um clique (vai para a Qualidade) e planos de
  ação 5W2H ligados à NC (cobre o PAC).
- A construir no serviço `auditorias`: kit pré-auditoria (modelo + status por auditoria, prontidão, prazo pela data da
  auditoria), roteiros e perguntas (banco + perguntas próprias), resposta por pergunta na execução, banco de modelos de
  NC, prompts, relatório em PDF (com objetivo, metodologia e pontos fortes), etapas guiadas com checklist e manual de uso.
- O kit tem itens que o sistema já sabe responder sozinho (requisitos legais avaliados, aspectos revisados, NCs abertas,
  treinamentos e calibrações em dia, licenças, MTR e CDF): candidatos a "itens automáticos" do checklist.

## 7. Biblioteca de Evidências Objetivas (etapa 2, Auditar)

"Saiba exatamente o que apresentar em cada cláusula das normas ISO." Na auditoria ativa, a pessoa responde as perguntas
selecionadas e registra o status de cada uma. Botão "Nova evidência minha" (evidências próprias, como as perguntas).

**Filtros:** norma, cláusula, busca por palavra; para a ISO 27001, tema e controle do Anexo A.

| Filtro          | Opções vistas                                                                                                                                                                                                                                                                                             |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Norma           | ISO 9001:2026, ISO 9001:2015, ISO 14001:2026, ISO 14001:2015, ISO 27001, ISO 28000, ISO 31000, ISO 45001, SGI, IATF 16949:2016                                                                                                                                                                            |
| Cláusula        | 4, 5, 6, 7, 8, 9, 10 e Anexo A (ISO 27001)                                                                                                                                                                                                                                                                |
| Tema do Anexo A | Controles organizacionais, de pessoas, físicos e tecnológicos                                                                                                                                                                                                                                             |
| Controle        | A.5.1 Políticas de segurança da informação; A.5.2 Papéis e responsabilidades pela segurança da informação; A.5.3 Segregação de funções; A.5.4 Responsabilidades da direção; A.5.5 Contato com autoridades; A.5.6 Contato com grupos de interesse especial; A.5.7 Inteligência de ameaças; … (93 no total) |

**Visão por processo:** escolhido um processo (ex.: Alta Direção), mostra, por norma, as cláusulas mapeadas para ele com
o total de perguntas, evidências e NCs do banco, e o status de cada cláusula (Não iniciado…). Os processos da auditoria
vêm do cabeçalho do relatório (etapa Entregar); sem eles, escolhe-se qualquer processo. Exemplo, Alta Direção:

| Norma           | Cláusulas mapeadas                                                                                                                                                                                                                                                                                                                                                      | Perguntas · evidências · NCs |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| ISO 9001:2015   | 5.1.1 Comprometimento da liderança; 5.1.2 Foco no cliente; 6.2 Objetivos da qualidade e planejamento                                                                                                                                                                                                                                                                    | 3 · 5 · 3                    |
| ISO 9001:2026   | 4.1 Contexto da organização; 4.2 Partes interessadas; 5.1.1 Promoção da cultura da qualidade e do comportamento ético; 5.1.2 Foco no cliente demonstrado pela liderança; 6.2 Objetivos da qualidade e planejamento; 6.3 Planejamento de mudanças no SGQ                                                                                                                 | 7 · 16 · 10                  |
| ISO 14001:2015  | 9.1.2 Avaliação do atendimento aos requisitos legais                                                                                                                                                                                                                                                                                                                    | 1 · 3 · 1                    |
| ISO 14001:2026  | 4.1 Contexto e condições ambientais; 5.1 Governança ambiental integrada ao negócio; 9.1.2 Avaliação de conformidade                                                                                                                                                                                                                                                     | 3 · 7 · 5                    |
| ISO 27001       | 4.3 Escopo do SGSI; 5.1 Liderança e comprometimento; 5.2 Política de segurança da informação; 6.2 Objetivos de segurança da informação; 7.1 Recursos; 9.3 Análise crítica pela direção                                                                                                                                                                                  | 6 · 6 · 5                    |
| ISO 28000       | 4.1 Análise de contexto da cadeia de suprimentos; 4.2 Matriz de partes interessadas e requisitos de segurança; 4.3 Declaração de escopo do sistema de segurança; 5.1; 5.2 Política de segurança da cadeia de suprimentos; 6.2 Plano de objetivos e metas de segurança; 7.1; 8.3 Plano de continuidade da cadeia de suprimentos; 9.3 Ata de análise crítica pela direção | 9 · 7 · 7                    |
| ISO 31000       | 4; 5.2 Declaração de comprometimento da direção com riscos; 6.4.4 Registro de decisão sobre riscos; 6.5 Análise de risco de fornecedores críticos; 6.7 Histórico de decisões de risco                                                                                                                                                                                   | 7 · 9 · 9                    |
| ISO 45001       | 5.4 Consulta e participação dos trabalhadores                                                                                                                                                                                                                                                                                                                           | 1 · 4 · 2                    |
| IATF 16949:2016 | 4.3.1 Escopo do SGQ automotivo; 4.4.1.2 Segurança do produto; 5.1.1.1 Responsabilidade corporativa; 5.1.1.2 Eficácia e eficiência de processo; 5.1.1.3; 5.3.1; 6.1.2.3 Planos de contingência; 9.3.2.1 Entradas da análise crítica; 9.3.3.1; 10.3.1 Melhoria contínua                                                                                                   | 10 · 7 · 3                   |
| SGI             | 4.1; 4.2 Avaliação de obrigações de conformidade; 5.2 Política integrada do SGI; 6.1 Matriz integrada de riscos; 6.3; 7.1; 9.3 Ata de análise crítica integrada; 10.3 Evidência de melhoria contínua                                                                                                                                                                    | 8 · 5 · 2                    |

Cláusulas sem título acima aparecem no original como "Requisito da norma" (título genérico, a completar).

**Execução da auditoria:** bloco "Auditar: perguntas desta auditoria" com contadores pendente, conforme, parcial e não
conforme; sem perguntas, aponta para os Roteiros de Entrevista.

**Lista de evidências:** 492 no banco. Cada uma tem norma, cláusula, título, **tipo** (Documento ou Registro; o manual
cita também entrevista e observação in loco) e **risco** se não existir (Alto, Médio, Baixo); abre para ver o detalhe
(ainda não visto). Seleção de várias e exportar PDF. Exemplos vistos:

| Norma                 | Cláusula                 | Evidência                                                                                                             | Tipo                  | Risco         |
| --------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------- |
| ISO 9001:2015 / 2026  | 4.1                      | Contexto da organização                                                                                               | Documento             | Médio ou Alto |
| ISO 9001:2015 / 2026  | 4.1                      | Análise de questões internas e externas                                                                               | Registro              | Alto          |
| ISO 9001:2026         | 4.1                      | Contexto e relevância da mudança climática                                                                            | Documento             | Alto          |
| ISO 14001:2015 / 2026 | 4.1                      | Contexto e condições ambientais                                                                                       | Documento             | Médio         |
| ISO 14001:2026        | 4.1                      | Mudança climática no contexto ambiental                                                                               | Documento             | Alto          |
| ISO 27001             | 4.1                      | Compreensão da organização e seu contexto                                                                             | Documento             | Médio         |
| ISO 28000             | 4.1                      | Análise de contexto da cadeia de suprimentos                                                                          | Documento             | Alto          |
| ISO 9001:2015 / 2026  | 4.2                      | Partes interessadas                                                                                                   | Documento ou Registro | Alto ou Médio |
| ISO 9001:2015 / 2026  | 4.2                      | Necessidades e expectativas de partes interessadas                                                                    | Registro              | Alto          |
| ISO 9001:2026         | 4.2                      | Requisitos climáticos de partes interessadas                                                                          | Registro              | Médio         |
| ISO 14001:2015 / 2026 | 4.2                      | Partes interessadas ambientais                                                                                        | Documento             | Alto          |
| ISO 27001             | 4.2                      | Necessidades e expectativas das partes interessadas                                                                   | Documento             | Médio         |
| ISO 28000             | 4.2                      | Matriz de partes interessadas e requisitos de segurança                                                               | Documento             | Médio         |
| ISO 45001             | 4.2                      | Requisitos de trabalhadores                                                                                           | Documento             | Médio         |
| SGI                   | 4.2                      | Avaliação de obrigações de conformidade                                                                               | Documento             | Alto          |
| ISO 14001:2015        | 4.3                      | Escopo do SGA definido                                                                                                | Documento             | Médio         |
| ISO 9001:2015 / 2026  | 10.2                     | Não conformidade e ação corretiva                                                                                     | Registro              | Alto          |
| ISO 14001:2015 / 2026 | 10.2                     | Ação corretiva ambiental; Não conformidade e ação corretiva ambiental                                                 | Registro              | Alto          |
| ISO 45001             | 10.2                     | Investigação de incidentes; Plano de ação de incidentes; Incidentes e não conformidades SSO                           | Registro              | Alto          |
| ISO 27001             | 10.2                     | Não conformidade e ação corretiva                                                                                     | Registro              | Alto          |
| ISO 28000             | 10.2                     | Registros de investigação de incidentes                                                                               | Registro              | Alto          |
| SGI                   | 10.2                     | Procedimento único de tratamento de NCs (Documento); Plano de ação corretiva (PAC); Não conformidade e ação corretiva | Documento / Registro  | Alto          |
| IATF 16949:2016       | 10.2.3 · 10.2.4 · 10.2.6 | Solução de problemas; Dispositivos à prova de erros; Reclamações e falhas de campo                                    | Registro              | Alto          |
| ISO 27001             | 10.1                     | Melhoria contínua                                                                                                     | Registro              | Médio         |
| ISO 28000             | 10.3                     | Registro de lições aprendidas                                                                                         | Registro              | Médio         |
| SGI                   | 10.3                     | Evidência de melhoria contínua                                                                                        | Registro              | Médio         |
| IATF 16949:2016       | 10.3.1                   | Melhoria contínua                                                                                                     | Documento             | Baixo         |

**Observações para a implementação:** o banco original tem itens repetidos (mesma norma, cláusula e título) e um prefixo
"[v3]" em vários títulos, que é marca de versão interna e não entra. As normas 9001:2026 e 14001:2026 são as revisões em
andamento; manter as duas versões lado a lado. O conteúdo de cada evidência (o que pedir, exemplo) ainda não foi visto:
abre na seta de cada linha.

## 8. Conteúdo completo capturado (15/10/2026) e o que falta implementar

Capturado da conta do usuário no AuditExpert (dados que as telas carregam). Os bancos viram arquivos de conteúdo do
serviço `auditorias` (`services/auditorias/src/conteudo/`), sem repetições e sem o prefixo "[v3]".

| Banco                   | Registros             | Campos                                                                                                                                                  |
| ----------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Perguntas de entrevista | 570 (18 processos)    | processo, norma, cláusula, pergunta, objetivo da pergunta, resposta esperada, sinal de alerta                                                           |
| Evidências              | 492                   | norma, cláusula, título do requisito, tipo, descrição (o que pedir), exemplo prático, risco se ausente, controle do Anexo A                             |
| Modelos de NC           | 387                   | norma, cláusula, tipo de desvio, título, redação pronta, causa raiz comum, ação corretiva modelo, evidência de fechamento sugerida, controle do Anexo A |
| Prompts de IA           | 125                   | norma, cláusula, categoria, título, objetivo, prompt, dica de uso, processo, tipo de evidência                                                          |
| Kit pré-auditoria       | 40 (36 sem repetição) | etapa, ação, responsável sugerido, módulo relacionado                                                                                                   |
| Controles do Anexo A    | 93                    | código, nome, tema                                                                                                                                      |

**Normas e edições** (como o AuditExpert define): ISO 9001:2026 (6ª edição, vigente desde 16/09/2026) e 9001:2015
(em transição até 30/09/2029); ISO 14001:2026 (4ª edição, vigente desde 15/04/2026) e 14001:2015 (em transição até
30/04/2029); ISO/IEC 27001:2022 + Amd 1:2024; ISO 28000:2022; ISO 31000:2018 (diretriz, não certificável); ISO
45001:2018 (revisão prevista para 2027); IATF 16949:2016 (revisão em andamento); SGI integrado. Regra: cada auditoria
usa uma edição só por referencial.

**Processos (18):** os 14 dos roteiros mais Gestão de Fornecedores, Metrologia e Laboratório, Inspeção e Ensaios e
Planejamento da Qualidade.

**Packs Anti-NC** (filtro rápido de cláusulas onde mais se emitem NCs): IATF Anti-Major (10.2.3, 10.2.1, 6.1.2.3, 4.3.2,
8.5.1.1, 8.5.1.5, 7.1.5.1.1, 8.4, 9.2); ISO 9001 Anti-NC (4.1, 4.2, 6.1, 6.2, 7.2, 8.4, 9.1, 10.2); ISO 14001 Anti-NC
(6.1.2, 6.1.3, 8.2, 9.1.2, 10.2); ISO 45001 Anti-NC (6.1.2, 5.4, 10.2, 8.2, 9.1.2).

**Funcionalidades a implementar** (checklist da implementação):

- [x] Kit pré-auditoria por auditoria, com prazo pela data e prontidão (trocar pelo conteúdo capturado)
- [x] Roteiros: banco, perguntas próprias, seleção por auditoria, roteiro de campo para imprimir (trocar pelo conteúdo)
- [x] Biblioteca de evidências com filtros e evidências próprias (trocar pelo conteúdo)
- [x] Packs Anti-NC nos filtros de roteiros, evidências e NCs
- [x] Auditar: responder perguntas (Conforme, Parcial, Não conforme) com anotação da resposta e evidência; visão por
      processo com as cláusulas mapeadas
- [x] Registrar: achados (Parcial e Não conforme) a formalizar; Banco de NCs com filtros (norma, cláusula, tipo de
      desvio, controle); formalizar com a redação modelo ou NC própria (título, tipo, descrição, causa raiz, ação
      corretiva, evidência de fechamento)
- [x] Assistente de NC: 3 prompts prontos (reescrever a NC no padrão requisito + fato + evidência; 5 porquês;
      correção, ação corretiva, evidência e eficácia em 5W2H), com "copiar prompt"
- [x] Tratar: NCs da auditoria sem plano de ação; plano com causa raiz, ação corretiva, responsável, prazo, status e
      evidência de fechamento (usa os Planos de Ação da Qualidade)
- [x] Cadeia de rastreabilidade da NC: pergunta → resposta e evidência → NC → plano de ação → fechamento
- [x] Plano de Auditoria (PDF para o auditado): objetivo, escopo, critérios (sugeridos pelas normas; IATF inclui CSR e
      manuais APQP, PPAP, FMEA, MSA, SPC), cronograma hora a hora, auditados convocados, logística, emissor, papel do
      auditor (líder ou em treinamento) e horas
- [x] Relatório: dados (empresa, unidade, datas, normas, equipe com líder e auditores, escopo, objetivo, metodologia com
      texto padrão ISO 19011, processos), entrevistas conduzidas, constatações (do banco ou próprias), checklist do kit
      em anexo, pontos fortes, conclusão; revisão automática (17 verificações); modelo Clássico e modelo Executivo
      (índice de conformidade, gráficos por norma e processo, NCs e planos em tabela)
- [x] Log do Auditor: auditorias, horas, referenciais, processos, perguntas conduzidas e achados; declaração de
      experiência em PDF com organizações anonimizadas
- [x] Minha biblioteca: processos, critérios próprios (legislação, norma interna, requisito contratual, com
      requisitos), perguntas, evidências e NCs próprias; importação por planilha
- [x] Prompts de IA: filtros por norma, categoria, processo e tipo de evidência; copiar com um clique
- [x] Dashboard da auditoria com a trilha e o próximo passo; checklist automático de cada etapa
- [x] Manual de uso: fluxo, guia por módulo, glossário e as 17 perguntas frequentes (respostas na seção 9)
- [x] Buscas salvas (filtros com nome)

## 9. Respostas das perguntas frequentes (adaptar ao DaVinci Qualidade)

- **Auditoria ativa:** é a auditoria em que se trabalha; o que se seleciona, responde e registra segue para as etapas
  seguintes (perguntas → respostas → NCs → planos → relatório). Várias podem ficar abertas.
- **Só consultar:** sem auditoria ativa, Biblioteca, Banco de NCs, Roteiros e Prompts funcionam como consulta.
- **Perguntas no relatório:** incluídas nos Roteiros aparecem em Auditar; as respondidas entram como entrevistas
  conduzidas; Parcial e Não conforme viram achados a formalizar.
- **NC em plano:** as NCs sem plano aparecem no topo de Tratar; o plano já vem preenchido com a NC.
- **Checklist de cada tela:** itens verificáveis marcam sozinhos; os de julgamento a pessoa confirma.
- **Relatório editável:** metodologia, descrição da NC, causa raiz, ação corretiva, pontos fortes e conclusão.
- **NC fora do banco:** criar NC própria (norma, cláusula, descrição, causa raiz, ação) ou partir de um modelo parecido.
- **PDF:** biblioteca e roteiros exportam respeitando os filtros; o roteiro sai com espaço para anotação.
- **Anexo A:** 93 controles em 4 temas; evidências, NCs e perguntas da 27001 trazem o controle e filtram por ele.
- **Filtros salvos:** dar nome ao conjunto de filtros e reaplicar na próxima auditoria.
