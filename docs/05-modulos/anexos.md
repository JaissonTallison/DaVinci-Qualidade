# Anexos e evidências

> **Status:** em uso · **Serviço:** `plataforma` · **Atualizado em:** 15/10/2026

Arquivos ligados a um registro de outro módulo: o laudo da NC, a foto da inspeção, o certificado de calibração, a CAT assinada. O serviço `plataforma` é o dono dos arquivos (decisão Q11); o registro (NC, acidente...) continua no serviço dele.

## 1. Regras

| Regra                                                                                                                   | Por quê                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Tipos aceitos: PDF, JPG, PNG, WEBP, DOCX e XLSX, até 10 MB                                                              | Documento e foto. Executável e compactado ficam de fora |
| O conteúdo precisa bater com o tipo (assinatura nos primeiros bytes)                                                    | Um executável renomeado para `.pdf` é recusado          |
| A permissão é a do módulo dono do registro: ver anexo de NC exige `qualidade.ver`; anexar e remover, `qualidade.editar` | Quem vê o registro vê a evidência                       |
| Até 30 anexos por registro                                                                                              | Evidência, não arquivo morto                            |
| Remover tira da lista e do download, mas o arquivo fica guardado                                                        | Evidência não se apaga de verdade                       |
| Download sai com o nome original, como anexo (`nosniff`)                                                                | O navegador não executa o arquivo                       |

## 2. Onde aparece

Na página de detalhe de: não conformidade, plano de ação, inspeção, instrumento (calibração), auditoria e acidente. Para ligar outro registro, inclua o tipo em `REGISTROS_COM_ANEXO` (`packages/types/src/anexos.ts`) e ponha `<Anexos>` na página.

## 3. Caminho do arquivo

Navegador → Server Action do web (limite 11 MB) → gateway `POST /anexos` (confere a permissão) → fila `davinci.plataforma` → Postgres (`bytea`). O download passa pela rota `/anexos/[id]` do web, que leva o token do cookie ao gateway.

## 4. Ainda não feito

- [ ] Miniatura das fotos na lista
- [ ] Mover os arquivos para armazenamento de objetos quando o volume justificar (a interface do serviço não muda)
