# DaVinci Qualidade — visão geral do sistema

> **Atualizado em:** 06/11/2026 · **Status:** em produção (hospedado) · **Estrutura:** espelha a DaVinci Finance
> Este documento é o panorama de como o sistema está hoje. Os detalhes de cada regra estão nas docs por módulo (`docs/05-modulos/`), de arquitetura (`docs/02-arquitetura/decisoes.md`) e de operação (`docs/03-operacao/`).

## 1. O que é

Sistema de **gestão da qualidade (QSSMA)** e **Agenda ESG** para empresas: qualidade, auditorias, SGI, serviços, segurança do trabalho, meio ambiente e ESG, num só lugar, com rastreabilidade (quem fez, quando, com qual evidência). É **multiempresa** e **modular**: cada grupo do menu é um módulo que a empresa liga ou desliga (`RECURSOS`); empresa nova começa com todos.

O domínio vem dos materiais de referência (documento do QSSMA e Agenda ESG, kit do auditor); **as regras são decisões nossas, escritas com teste** — não copiamos o código do DaVinciERP (decisão Q9).

## 2. Estado atual (produção)

- **Hospedado no Railway** (plano Hobby), projeto `appealing-ambition`, ambiente `production`.
- **17 recursos no ar, todos rodando sem crash:** web + api-gateway + 12 microsserviços + Postgres + RabbitMQ.
- **Endereço:** `https://davinciqualidade.j4gtecnologia.com.br` (web na porta 3170; o gateway, na 3171, não tem domínio público — o navegador nunca chama a API direto).
- **Publicação:** a branch `main` publica sozinha; PR e merge só quando o time decide.
- **Primeiro acesso:** administrador `admin@davinci.local`, com senha provisória trocada no 1º acesso; a empresa provisória e os perfis padrão são criados pelo instalador do Identidade.

**Pendências de infraestrutura (fora do código):**
- Configurar os 2 registros de **DNS** do domínio personalizado para validar o certificado (CNAME + TXT de verificação).
- Trocar a senha da conta Railway que foi exposta durante a configuração.
- Remover, pelo painel, um serviço **Postgres duplicado e vazio** criado por engano (o em uso é `Postgres-Xd6l`).

## 3. Arquitetura

Microsserviços com **um dono por dado** (decisão Q2/Q3): cada serviço grava só no próprio banco e conversa com os outros por **RabbitMQ** — `send` para consultar, `emit` para avisar de um evento. Quem precisa da resposta de outro serviço usa `pedir()` (request/reply pela fila do outro, levando o contexto de quem pediu; a recusa volta com o código e os campos originais, Q10).

- **Plataforma (4 serviços):** `identidade` (login, perfis, JWT), `codex` (funcionários, setores, funções, ASO, treinamentos), `integracoes` (adaptadores externos, NF-e), `plataforma` (anexos de todos os módulos — `bytea` no Postgres, até 10 MB por arquivo, Q11).
- **Domínio (7 serviços, um por grupo do menu):** `qualidade`, `auditorias`, `sgi`, `servicos`, `seguranca`, `ambiental`, `esg`.
- **Inteligência (1 serviço):** `paineis` (indicadores e vencimentos, lendo os outros por fila).
- **Borda:** `api-gateway` (NestJS) traduz HTTP ↔ fila, monta o **contexto** a partir do JWT (empresa, usuário, nome, rastreio) e confere permissões; `web` (Next.js) é a interface, que fala só com o gateway.
- **Mensageria:** cada serviço é um microsserviço NestJS que ouve a própria fila (`davinci.<serviço>`).

## 4. Stack tecnológico

- **Monorepo:** pnpm + Turborepo (`turbo`), Node ≥ 24, TypeScript estrito (sem `any`, sem `@ts-ignore`).
- **Front:** Next.js 16 (App Router, Server Components e Server Actions, Turbopack), React.
- **Back:** NestJS (microsserviços por RabbitMQ), Drizzle ORM, **um Postgres por serviço**.
- **Mensageria:** RabbitMQ.
- **Autenticação:** JWT **Ed25519 (EdDSA)**; segredos de criptografia/integração em chaves de 32 bytes, guardados só nas variáveis do Railway.
- **Build/deploy:** Docker (um Dockerfile para todos os serviços, `turbo prune` por pacote) no Railway; CI no GitHub Actions (lint, typecheck, teste — inclusive integração com Postgres real — e build).

## 5. Módulos e telas

Os módulos seguem a ordem do menu. Cada item é uma tela existente (item sem tela seria link quebrado).

| Grupo | Telas |
| --- | --- |
| **Monitoramento** | Indicadores gerais · Vencimentos |
| **Qualidade** | Não conformidades · Inspeções · Planos de ação · Calibração · Modelos de inspeção |
| **Auditorias** | Auditorias · Biblioteca de evidências · Banco de NCs · Prompts de IA · Minha biblioteca · Log do Auditor · Manual de uso |
| **Gestão do SGI** | Riscos · Oportunidades · Objetivos da qualidade · Análise crítica · Gestão de inovação |
| **Serviços** | Ordens de serviço · Satisfação do cliente (ISC) · Avaliação de fornecedores · Reclamações de clientes · Contratos e SLA |
| **Segurança do Trabalho** | Acidentes · Indicadores de SST · PGR (inventário de riscos) · Requisitos legais · Permissões de trabalho · DDS/APR/CIPA/simulados · Terceiros · Vencimentos de ASO e treinamentos · Entregas de EPI · Catálogo de EPIs · Equipamentos de emergência · Brigada e plano de emergência |
| **Meio Ambiente** | Aspectos e impactos · Requisitos legais · Licenças · Resíduos · Produtos químicos · Consumo de água e energia · Inventário de GEE · Monitoramentos · Ocorrências · Obrigações legais · Transportadores e destinadores · Ecoeficiência · Programas e metas |
| **Agenda ESG** | Painel ESG · Temas ESG · Matriz de materialidade · ODS |
| **Cadastros** | Clientes e fornecedores · Profissionais · Treinamentos · Setores e funções · Listas de apoio |
| **Administração** | Usuários · Perfis de acesso · Módulos contratados |

A tela de **início** traz o resumo do dia (indicadores, vencimentos, saúde dos módulos), a **busca global**, o atalho **"+ Novo"** e a barra superior/inferior.

## 6. Módulos desativados (ocultos, dados preservados)

Desativados da interface, com o **código de tela removido** e as **tabelas mantidas no banco** para reativação futura (nunca dropar):

- **eSocial SST** — desativado em 04/11/2026 (`docs/05-modulos/esocial.md`).
- **Catálogo de serviços** — desativado em 04/11/2026; a OS passou a digitar os passos direto (`docs/05-modulos/servicos.md`).
- **Automotivo (IATF 16949)** — FMEA de processo, Planos de controle e PPAP; desativado em 06/11/2026 por o público não ser fornecedor automotivo (`docs/05-modulos/automotivo.md`). O serviço `qualidade` e as tabelas continuam; a qualidade geral (NC, Inspeções, Planos de ação, Calibração, Modelos de inspeção) permanece.

## 7. Segurança e acesso

- **Login** com JWT Ed25519; 2FA e controle de sessões/navegadores disponíveis na conta.
- **Perfis padrão:** Administrador, Gestor do SGI, Analista, Auditor, Consulta (Q5). Ações sensíveis (excluir, liberar PT, importar catálogo ESG) são de gestor.
- **Permissões por recurso** (`<modulo>.ver` / `.editar`): o menu e os atalhos só mostram o que a pessoa pode, e o gateway confere a permissão em cada chamada.
- **Módulos contratados** por empresa (`RECURSOS`): grupo de módulo desligado não aparece.

## 8. Design e interface

Padrão visual próprio, **sem "cara de IA"** (decisões Q7/Q12 e `docs/04-design/interface.md`): tipografia Source Serif 4 / Sans 3 / Code Pro, marinho como cor de trabalho e ouro como assinatura, **tema sempre claro**, ícones só do Lucide, sem degradê (exceção única: o destaque do topo da tela de início), sem cartão com ícone em círculo colorido, sem pontos de status coloridos.

**Responsivo em três tamanhos** (Q15): celular (< 640 px) com tabela virando lista de cartões; barra inferior abaixo de 768 px (Início · NCs · + · Vencimentos · Menu); menu em gaveta abaixo de 1024 px. Toda tela passa pelo checklist de interface antes de entregar.

## 9. Qualidade de engenharia

- **Sem vibecode** (`docs/01-engenharia/sem-vibecode.md`, Q8): mudança pequena, testada, sem `any`/`@ts-ignore`, sem dependência sem justificativa, sem código que o autor não saiba explicar.
- **Regras com teste** (Q9): cada regra de negócio nasce com teste (unitário e de integração com Postgres real).
- **Commits** em português, Conventional Commits; publicação só por PR com CI verde.
- **Antes de terminar qualquer tarefa:** `pnpm turbo run lint typecheck test build` passando e documentação atualizada quando a mudança altera como algo funciona.

## 10. Operação e deploy

- **Build pelo Dockerfile** (`infra/docker/servico.Dockerfile`): cada serviço define `RAILWAY_DOCKERFILE_PATH` + `PACOTE=@davinci/<nome>`; sem isso o Railway cai no autodetector e falha.
- **Bancos:** um banco e um usuário por serviço (`davinci_<nome>` / `svc_<nome>`), com senha própria; migrações pelo Drizzle.
- **Segredos de produção** (chaves JWT, criptografia, integrações, RabbitMQ, senhas de banco) ficam só nas variáveis do Railway.
- Detalhes em `docs/03-operacao/deploy-railway.md`.

## 11. Próximos passos

- **Infraestrutura:** concluir o DNS do domínio, trocar a senha da Railway, remover o Postgres duplicado.
- **Produto (mapeado em rodadas anteriores):** melhorias da barra superior; lote de "menos digitação" (linha do tempo + autocomplete); decisões/itens que ficaram da rodada de QA (ex.: "Tirar de uso" com motivo, independência do auditor ISO 9.2.2, conclusão sem evidência); implementação a partir do material do AuditExpert.

## 12. Onde ler mais

- Arquitetura e decisões: `docs/02-arquitetura/decisoes.md`
- Engenharia (sem vibecode, armadilhas): `docs/01-engenharia/`
- Operação (deploy Railway): `docs/03-operacao/deploy-railway.md`
- Design (interface, logos): `docs/04-design/`
- Módulos (uma doc por módulo): `docs/05-modulos/`
- Referências (AuditExpert, créditos): `docs/06-referencias/`
