# Serviços

> **Status:** em uso · **Serviço:** `servicos` · **Atualizado em:** 16/10/2026
> Referência: ISO 9001 (8.5 prestação do serviço, 9.1.2 satisfação do cliente, 8.4 provedores externos). Regras decididas por nós (decisão Q9).

Clientes e fornecedores vêm do cadastro único do `codex` (Cadastros › Clientes e fornecedores). O `servicos` confere no codex se existe, está ativo e tem o papel certo, e guarda o nome do dia.

| Função                        | Regras                                                                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ordens de serviço**         | `OS-AAAA-NNN`. Aberta → em execução → concluída (com relatório); cancelada antes de concluir (gestor, com motivo). Prazo passado em aberto: atrasada. Concluída recebe uma avaliação do cliente (1 a 5). Anexos |
| **Satisfação (NPS)**          | Resposta de 0 a 10 por cliente. 9–10 promotor, 7–8 neutro, 0–6 detrator. NPS = % promotores − % detratores, nos últimos 12 meses                                                                                |
| **Avaliação de fornecedores** | Qualidade, prazo, atendimento e documentação de 1 a 5. Média ≥ 4 aprovado (reavaliar em 12 meses), ≥ 3 com restrição (6 meses), abaixo reprovado (3 meses). Vale a mais recente; as outras ficam no histórico   |

| **Catálogo de serviços** | Serviço com checklist de execução e horas padrão. A OS aberta com ele copia os passos; **só conclui com todos os passos feitos ou "não se aplica"** |
| **Execução da OS** | Com a OS em execução: checklist, horas por técnico (sem data futura, até 24 h por apontamento) e materiais. Conclusão registra quem recebeu pelo cliente. Relatório da OS para imprimir com o aceite do cliente |
| **Contratos e SLA** | `CT-AAAA-NNN`. Cliente, objeto, vigência, **SLA em dias por OS** e meta de OS no prazo (padrão 95%). OS do contrato: só com contrato vigente e do mesmo cliente; sem prazo informado, prazo = hoje + SLA. Cumprimento = OS concluídas até o prazo ÷ concluídas, 12 meses. Encerrado não muda |
| **Reclamações de clientes** | `RCL-AAAA-NNN` (ISO 10002). Aberta → analisada → respondida → encerrada. Prazo de resposta padrão de 7 dias. A análise diz se procede; procedente pode **abrir a NC na Qualidade** (origem Reclamação de cliente, prazo de 30 dias). Responder exige análise; encerrar exige resposta e registra se o cliente ficou satisfeito. Indicadores: em aberto, fora do prazo, % procedentes, tempo médio de resposta e satisfação com a solução |
| **Pesquisa por link** | Convite com token aleatório de 256 bits, válido por 30 dias e **uma resposta**. O cliente responde em `/pesquisa/<token>`, sem login; a nota entra no NPS e, com OS concluída ainda sem avaliação, vira a nota da OS. Link para copiar, e-mail e WhatsApp |

Painel de vencimentos: OS em aberto, reavaliação de fornecedor, fim da vigência de contrato (60 dias antes) e prazo de resposta de reclamação. Pesquisa geral: OS por número, título ou cliente.

Ainda não feito: envio automático do e-mail da pesquisa (hoje o link é copiado ou enviado pelo e-mail/WhatsApp de quem gera); limite de requisições nas rotas públicas.
