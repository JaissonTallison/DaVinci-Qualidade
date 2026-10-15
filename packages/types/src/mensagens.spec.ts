import { CODIGOS_ERRO, ehContexto, ehErroPadrao } from './mensagens.js';
import { uuidv7 } from './uuid.js';

describe('contratos de mensagem', () => {
  it('reconhece um contexto válido (usuário pode ser nulo até o login existir)', () => {
    expect(
      ehContexto({
        empresaId: uuidv7(),
        usuarioId: null,
        rastreioId: uuidv7(),
      }),
    ).toBe(true);
  });

  it('recusa contexto sem empresa ou com ids inválidos', () => {
    expect(ehContexto({ usuarioId: null, rastreioId: uuidv7() })).toBe(false);
    expect(
      ehContexto({ empresaId: 'abc', usuarioId: null, rastreioId: uuidv7() }),
    ).toBe(false);
    expect(ehContexto(null)).toBe(false);
  });

  it('reconhece erro padrão e recusa códigos desconhecidos', () => {
    expect(
      ehErroPadrao({
        codigo: 'CONFLITO',
        mensagem: 'Este CNPJ já está cadastrado.',
      }),
    ).toBe(true);
    expect(ehErroPadrao({ codigo: 'QUALQUER', mensagem: 'x' })).toBe(false);
    expect(ehErroPadrao(new Error('x'))).toBe(false);
  });

  it('mapeia cada código para o status HTTP combinado', () => {
    expect(CODIGOS_ERRO).toEqual({
      DADOS_INVALIDOS: 400,
      NAO_AUTENTICADO: 401,
      SEM_PERMISSAO: 403,
      NAO_ENCONTRADO: 404,
      CONFLITO: 409,
      REGRA_DE_NEGOCIO: 422,
      INTERNO: 500,
      SERVICO_INDISPONIVEL: 503,
    });
  });
});
