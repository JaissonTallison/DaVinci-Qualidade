# Identidade e acesso

> **Status:** em uso · **Serviço:** `identidade` (web: `app/(acesso)`, `lib/sessao*.ts`, `proxy.ts`) · **Atualizado em:** 16/10/2026

Quem entra no sistema, em qual empresa e por quanto tempo. O web nunca guarda token em JavaScript: os dois tokens ficam em cookies HttpOnly e só o servidor do Next os repassa ao gateway.

---

## 1. Formas de entrar

| Forma                       | Como funciona                                                                                                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E-mail e senha              | 5 senhas erradas bloqueiam por 15 minutos. E-mail inexistente e senha errada recebem a mesma mensagem                                                                                   |
| Código do 2FA               | Depois da senha (ou da conta externa), se o usuário ativou o aplicativo autenticador. "Confiar neste navegador" pula o código por 30 dias                                               |
| Microsoft ou Google         | Só entra quem **já é usuário** com o mesmo e-mail: a conta externa prova o e-mail, não cria usuário. Usuário inativo, bloqueado ou sem empresa continua barrado. O 2FA continua valendo |
| Link de "Esqueceu a senha?" | Link por e-mail, 30 minutos, uso único, 3 pedidos por hora. A resposta é sempre a mesma, exista ou não o e-mail. Criar a senha nova encerra todas as sessões                            |

## 2. Sessão

- Token de acesso de 15 minutos e token de renovação de 7 dias (uso único; cópia reaparecendo revoga a família inteira).
- O `proxy.ts` renova sozinho quando falta menos de 1 minuto para o acesso vencer.
- **Lembrar de mim** (cookie `davinci_lembrar`, 30 dias): marcado, os cookies dos tokens têm validade e sobrevivem ao fechar o navegador; desmarcado, viram cookies de sessão do navegador e somem ao fechá-lo. A escolha vale para as renovações e para o 2FA daquele login.

## 3. Entrar com Microsoft ou Google

Fluxo OpenID Connect com código e PKCE, montado no servidor do web (`lib/provedores-externos.ts` e as rotas `entrar/externo/[provedor]`):

1. O botão leva a `/entrar/externo/<provedor>`, que guarda state, nonce e o verificador do PKCE num cookie HttpOnly de 10 minutos e redireciona ao provedor.
2. Na volta (`/entrar/externo/<provedor>/retorno`), o web confere o state, troca o código pelo `id_token` (com o segredo do aplicativo) e o envia ao gateway (`POST /auth/login/externo`).
3. O Identidade confere assinatura (chaves públicas do provedor), destinatário, emissor, validade e nonce, e só aceita e-mail garantido: no Google, `email_verified`; na Microsoft, conta pessoal ou o claim `xms_edov` (domínio verificado pela empresa). Sem essa garantia alguém poderia criar uma conta externa com o e-mail de outra pessoa.
4. Daí em diante é o mesmo caminho do login por senha. O histórico de acessos registra "Entrou com a conta Microsoft/Google".

O botão de cada provedor só aparece quando o web tem o ID e o segredo dele. Para ligar:

| Provedor  | Onde registrar                                                                                 | Endereço de retorno                          | Observação                                                                                        |
| --------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Microsoft | Microsoft Entra ID → Registros de aplicativo (contas de qualquer organização e pessoais)       | `<APP_URL>/entrar/externo/microsoft/retorno` | Em "Configuração de token", adicionar o claim opcional `xms_edov` ao token de ID e também `email` |
| Google    | Google Cloud Console → APIs e serviços → Credenciais → ID do cliente OAuth (aplicativo da Web) | `<APP_URL>/entrar/externo/google/retorno`    | Tela de consentimento com os escopos `openid`, `email` e `profile`                                |

Variáveis: no **web**, `APP_URL`, `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`; no **identidade**, `MICROSOFT_CLIENT_ID` e `GOOGLE_CLIENT_ID` (os mesmos IDs, para conferir o destinatário do token).

## 4. Tela de entrar

Foto de fundo (`public/acesso/fundo.webp`) com véu marinho e o cartão branco por cima, em todas as larguras. No computador (a partir de 1024 px), o painel da marca à esquerda: título, as cinco áreas e a faixa das normas. Visual próprio, exceção registrada em docs/04-design/interface.md e escopado em `.dv-acesso` (`globals.css`). A contagem de normas vem de `NORMAS` (`@davinci/types`): edições da mesma norma contam uma vez e o "SGI integrado" não entra. Os botões Microsoft e Google aparecem sempre; sem o aplicativo configurado, o clique volta para a tela com o aviso de que ainda não está disponível.

## 5. Ainda não feito

- [ ] Vincular a conta externa ao usuário pelo identificador do provedor (hoje o vínculo é pelo e-mail)
