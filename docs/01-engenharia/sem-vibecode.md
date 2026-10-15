# Sem vibecode: como o código entra no projeto

> **Status:** vigente · **Atualizado em:** 15/10/2026
> Vale para todo código, escrito por pessoa ou por assistente de IA.

---

## 1. A regra

**Nenhum código entra no projeto sem que alguém do time saiba explicar cada linha.** Usar IA para escrever é permitido. Aceitar o que ela escreveu sem ler, sem testar e sem entender, não. Isso é _vibecode_, e o resultado aparece rápido: código duplicado, regra de negócio errada que "parece certa", dependência que ninguém pediu e erro que ninguém sabe corrigir.

A Qualidade vende controle e rastreabilidade para empresas certificadas. O próprio código precisa passar no tipo de auditoria que o sistema ajuda a fazer.

---

## 2. Sinais de vibecode (recusados na revisão)

| Sinal                                                                                             | Por que é problema                                                             |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| PR enorme, com dezenas de arquivos sem relação                                                    | Ninguém consegue revisar de verdade                                            |
| Código que o autor não sabe explicar ("a IA fez assim")                                           | Quando quebrar, ninguém sabe consertar                                         |
| Regra de negócio sem teste (cálculo de risco, prazo, NPS, TF/TG)                                  | Erro silencioso em dado que vai para auditoria                                 |
| Função ou arquivo duplicado com nome parecido (`calcularRisco2`, `utils-novo.ts`)                 | Duas verdades para a mesma regra                                               |
| Dependência nova para algo que a stack já faz                                                     | Mais superfície de ataque e de atualização                                     |
| `any`, `@ts-ignore`, `eslint-disable` para "fazer passar"                                         | Esconde o erro em vez de resolver                                              |
| `try/catch` que engole o erro, `console.log` esquecido                                            | Falha invisível em produção                                                    |
| Comentário que repete o código (`// incrementa i`) ou fala com o leitor como chat ("Aqui vamos…") | Ruído; comentário bom explica o **porquê**                                     |
| Código morto, TODO sem dono, arquivo de exemplo esquecido                                         | Confunde quem vem depois                                                       |
| Nome em inglês misturado com português no mesmo domínio                                           | O domínio é em português (`naoConformidade`, `planoDeAcao`)                    |
| Texto de interface ou dado de exemplo genérico (_lorem ipsum_, "Test User")                       | Ver [interface.md §3](../04-design/interface.md#3-cara-de-ia-o-que-é-proibido) |

---

## 3. Como trabalhamos

1. **Ler antes de escrever.** Antes de criar algo, veja como o projeto já faz: o mesmo padrão em outro serviço, o pacote `@davinci/shared`, o gerador `pnpm novo:servico`. Repetir o padrão é melhor que inventar outro.
2. **Portar com leitura, não com cópia cega.** As regras do QSSMA vêm do DaVinciERP. Cada regra portada é lida, entendida e coberta por teste no serviço de destino. Se a regra do ERP tem um defeito conhecido (ver as limitações no documento de domínio), corrigimos ao portar e registramos.
3. **Mudança pequena e com propósito.** Um PR resolve uma coisa. Refatoração e funcionalidade vão em PRs separados.
4. **Teste junto com a regra.** Todo cálculo e toda transição de status tem teste unitário. Toda consulta ao banco relevante tem teste de integração (`*.int-spec.ts`).
5. **Erros com mensagem útil.** Erro de negócio usa `ErroDeNegocio` com texto que diz como corrigir. Erro inesperado é registrado, nunca engolido.
6. **Tipos de ponta a ponta.** Contratos entre serviços ficam em `@davinci/types`, validados com zod nos dois lados.
7. **Dependência nova se justifica no PR:** o que faz, por que a stack atual não resolve, tamanho e manutenção.
8. **IA como par, não como autor.** Peça ao assistente trechos pequenos, revise cada um, rode os testes. O autor do PR responde pelo código, não a ferramenta.

---

## 4. Antes de abrir o PR

- [ ] `pnpm turbo run lint typecheck test build` passa
- [ ] Sei explicar cada linha alterada
- [ ] Regras novas ou portadas têm teste
- [ ] Nenhum `any`, `@ts-ignore`, `console.log` ou código comentado novo
- [ ] Nenhuma dependência nova sem justificativa na descrição
- [ ] Tela nova passou no [checklist de interface](../04-design/interface.md#10-checklist-de-tela)
- [ ] Commit no padrão Conventional Commits, em português
- [ ] Documentação atualizada se a mudança altera como algo funciona
