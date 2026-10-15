# Painel de vencimentos e avisos por e-mail

> **Status:** em uso · **Serviço:** `paineis` · **Atualizado em:** 15/10/2026

Cada serviço é dono dos próprios prazos e responde `PATTERNS.prazos.<servico>` com o que venceu ou vence em até 30 dias. O `paineis` pergunta a todos e junta (regra 3 do AGENTS.md: ninguém lê o banco do outro).

| Serviço     | Prazos                                                                                                                              |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `qualidade` | NC em aberto, tarefa de plano pendente, calibração                                                                                  |
| `seguranca` | CAT (primeiro dia útil), troca de EPI, CA de EPI, ação do PGR (alto e crítico), PT liberada sem encerramento, documento de terceiro |
| `codex`     | ASO e treinamentos                                                                                                                  |
| `sgi`       | tratamento de risco ou oportunidade, mudança aprovada a implementar, próxima análise crítica                                        |

## Regras

| Regra                                                                                                                       | Por quê                                           |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| O gateway manda só os módulos que a pessoa vê (permissão e módulo ligado)                                                   | Ninguém vê prazo de módulo alheio                 |
| Serviço que não responde não derruba o painel: os outros aparecem e a tela avisa quem faltou                                | Um serviço fora não pode esconder todos os prazos |
| Aviso diário a partir das 7h (Brasília), uma vez por empresa por dia (tabela `avisos_enviados`)                             | Reiniciar o serviço não manda de novo             |
| Cada usuário recebe só os módulos dele, e só quando há algo vencido ou nos próximos 7 dias; até 15 itens, o resto no painel | E-mail diário sem novidade vira ruído             |
| O administrador (`empresa.gerenciar`) pode mandar agora pelo painel                                                         | Teste e cobrança pontual                          |
| `AVISOS_AUTOMATICOS=nao` desliga a rotina (ex.: ambiente de testes); `APP_URL` monta o link do e-mail                       | Configuração por ambiente                         |

Ainda não feito: o usuário escolher não receber; relatórios em PDF; gráficos.
