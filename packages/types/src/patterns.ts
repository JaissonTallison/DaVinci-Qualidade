import type { ServiceLayer, ServiceName } from './services.js';

/**
 * Padrões de mensagem (request-reply via RabbitMQ).
 *
 * Convenção:
 *   - Comandos/consultas: `<dominio>.<acao>`      → @MessagePattern / client.send()
 *   - Eventos de domínio: `<dominio>.<fato-no-passado>` → @EventPattern / client.emit()
 *     ex.: `compras.pedido-aprovado`, `financeiro.titulo-pago`
 */
export const PATTERNS = {
  health: {
    ping: 'health.ping',
  },
  /** Identidade: login, sessão e senha. */
  identidade: {
    autenticar: 'identidade.autenticar',
    renovar: 'identidade.renovar',
    encerrar: 'identidade.encerrar',
    trocarEmpresa: 'identidade.trocar-empresa',
    trocarSenha: 'identidade.trocar-senha',
    eu: 'identidade.eu',
    salvarTema: 'identidade.salvar-tema',
    obterPreferencia: 'identidade.obter-preferencia',
    salvarPreferencia: 'identidade.salvar-preferencia',
    autenticar2fa: 'identidade.autenticar-2fa',
    seguranca: 'identidade.seguranca',
    iniciar2fa: 'identidade.iniciar-2fa',
    confirmar2fa: 'identidade.confirmar-2fa',
    desativar2fa: 'identidade.desativar-2fa',
    novosCodigos: 'identidade.novos-codigos',
    encerrarSessao: 'identidade.encerrar-sessao',
    encerrarOutras: 'identidade.encerrar-outras',
    esquecerNavegadores: 'identidade.esquecer-navegadores',
    recuperarSenha: 'identidade.recuperar-senha',
    redefinirSenha: 'identidade.redefinir-senha',
    revogacoesRecentes: 'identidade.revogacoes-recentes',
  },
  /** Identidade: usuários da empresa (administração de acesso). */
  usuarios: {
    listar: 'usuarios.listar',
    obter: 'usuarios.obter',
    criar: 'usuarios.criar',
    alterarPerfil: 'usuarios.alterar-perfil',
    removerAcesso: 'usuarios.remover-acesso',
    devolverAcesso: 'usuarios.devolver-acesso',
    redefinirSenha: 'usuarios.redefinir-senha',
    desativar2fa: 'usuarios.desativar-2fa',
  },
  /** Identidade: perfis de acesso da empresa. */
  perfis: {
    listar: 'perfis.listar',
    obter: 'perfis.obter',
    criar: 'perfis.criar',
    atualizar: 'perfis.atualizar',
    inativar: 'perfis.inativar',
    reativar: 'perfis.reativar',
    exige2fa: 'perfis.exige-2fa',
  },
  /** Identidade: dados da empresa (grupo), estabelecimentos (matriz e filiais) e logo. */
  /** I4: chaves de API por empresa (o gateway confere a cada chamada, com cache curto). */
  chavesApi: {
    listar: 'chaves-api.listar',
    criar: 'chaves-api.criar',
    revogar: 'chaves-api.revogar',
    validar: 'chaves-api.validar',
  },
  empresa: {
    obter: 'empresa.obter',
    atualizar: 'empresa.atualizar',
    obterLogo: 'empresa.obter-logo',
    salvarLogo: 'empresa.salvar-logo',
    removerLogo: 'empresa.remover-logo',
    criarEstabelecimento: 'empresa.criar-estabelecimento',
    atualizarEstabelecimento: 'empresa.atualizar-estabelecimento',
    inativarEstabelecimento: 'empresa.inativar-estabelecimento',
    reativarEstabelecimento: 'empresa.reativar-estabelecimento',
    /** A122: recursos ligados; ligar soma (modelo de segmento) sem desligar nada. */
    recursos: 'empresa.recursos',
    salvarRecursos: 'empresa.salvar-recursos',
    ligarRecursos: 'empresa.ligar-recursos',
  },
  /** Codex: parceiros de negócio (clientes e fornecedores). */
  parceiros: {
    listar: 'parceiros.listar',
    obter: 'parceiros.obter',
    criar: 'parceiros.criar',
    atualizar: 'parceiros.atualizar',
    inativar: 'parceiros.inativar',
    reativar: 'parceiros.reativar',
    /** PDV (R6): o cliente "Consumidor final" da empresa (criado na primeira venda). */
    consumidorFinal: 'parceiros.consumidor-final',
    /** I3/I4: acha pelo CPF/CNPJ ou cria (mínimo: tipo, documento, nome, papel). */
    garantir: 'parceiros.garantir',
    importar: 'parceiros.importar',
  },
  /** Integrações: consultas a fontes públicas (Receita, Correios), com cache. */
  consultas: {
    cnpj: 'consultas.cnpj',
    cep: 'consultas.cep',
  },
  /** Plataforma: notificações (e-mail). `enviarEmail` é um EVENTO (fire-and-forget). */
  notificacoes: {
    enviarEmail: 'notificacoes.enviar-email',
  },
  /** Qualidade: não conformidades (docs/05-modulos/nao-conformidades.md). */
  naoConformidades: {
    listar: 'nao-conformidades.listar',
    resumo: 'nao-conformidades.resumo',
    obter: 'nao-conformidades.obter',
    criar: 'nao-conformidades.criar',
    atualizar: 'nao-conformidades.atualizar',
    registrarTratamento: 'nao-conformidades.registrar-tratamento',
    enviarParaVerificacao: 'nao-conformidades.enviar-para-verificacao',
    verificarEficacia: 'nao-conformidades.verificar-eficacia',
    cancelar: 'nao-conformidades.cancelar',
  },
  /** Qualidade: planos de ação (docs/05-modulos/planos-de-acao.md). */
  planosDeAcao: {
    listar: 'planos-de-acao.listar',
    resumo: 'planos-de-acao.resumo',
    obter: 'planos-de-acao.obter',
    criar: 'planos-de-acao.criar',
    atualizar: 'planos-de-acao.atualizar',
    incluirTarefa: 'planos-de-acao.incluir-tarefa',
    concluirTarefa: 'planos-de-acao.concluir-tarefa',
    reabrirTarefa: 'planos-de-acao.reabrir-tarefa',
    cancelarTarefa: 'planos-de-acao.cancelar-tarefa',
    verificarEficacia: 'planos-de-acao.verificar-eficacia',
    cancelar: 'planos-de-acao.cancelar',
  },
  /** Qualidade: inspeções e modelos de inspeção (docs/05-modulos/inspecoes.md). */
  inspecoes: {
    listar: 'inspecoes.listar',
    resumo: 'inspecoes.resumo',
    obter: 'inspecoes.obter',
    criar: 'inspecoes.criar',
    responder: 'inspecoes.responder',
    concluir: 'inspecoes.concluir',
    cancelar: 'inspecoes.cancelar',
  },
  modelosDeInspecao: {
    listar: 'modelos-de-inspecao.listar',
    obter: 'modelos-de-inspecao.obter',
    criar: 'modelos-de-inspecao.criar',
    atualizar: 'modelos-de-inspecao.atualizar',
    inativar: 'modelos-de-inspecao.inativar',
    reativar: 'modelos-de-inspecao.reativar',
  },
  /** Qualidade: instrumentos e calibrações (docs/05-modulos/calibracao.md). */
  calibracao: {
    listar: 'calibracao.listar',
    resumo: 'calibracao.resumo',
    obter: 'calibracao.obter',
    criar: 'calibracao.criar',
    atualizar: 'calibracao.atualizar',
    mudarUso: 'calibracao.mudar-uso',
    registrar: 'calibracao.registrar',
    anular: 'calibracao.anular',
  },
  /** Auditorias e constatações (docs/05-modulos/auditorias.md). */
  auditorias: {
    listar: 'auditorias.listar',
    resumo: 'auditorias.resumo',
    obter: 'auditorias.obter',
    criar: 'auditorias.criar',
    atualizar: 'auditorias.atualizar',
    iniciar: 'auditorias.iniciar',
    registrarConstatacao: 'auditorias.registrar-constatacao',
    alterarConstatacao: 'auditorias.alterar-constatacao',
    formalizarNc: 'auditorias.formalizar-nc',
    concluir: 'auditorias.concluir',
    cancelar: 'auditorias.cancelar',
  },
  /** Codex: tabelas oficiais de referência (CNAE, setores, bancos). */
  referencias: {
    cnaes: 'referencias.cnaes',
    setores: 'referencias.setores',
    bancos: 'referencias.bancos',
  },
} as const;

export interface HealthPong {
  service: ServiceName;
  status: 'ok';
  /** Estado do banco PRÓPRIO do serviço (SELECT 1). */
  database: 'ok' | 'indisponivel';
  timestamp: string;
}

/** Item de GET /health/services (gateway → web). */
export interface StatusServico {
  service: ServiceName;
  layer: ServiceLayer;
  status: 'ok' | 'indisponivel';
  /** Banco próprio do serviço; ausente quando o serviço não respondeu. */
  database?: 'ok' | 'indisponivel';
  detail?: string;
}
