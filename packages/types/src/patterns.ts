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
    /** Sistema: quem recebe os avisos diários (todas as empresas). */
    destinatariosDeAvisos: 'usuarios.destinatarios-de-avisos',
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
  anexos: {
    listar: 'anexos.listar',
    anexar: 'anexos.anexar',
    obter: 'anexos.obter',
    conteudo: 'anexos.conteudo',
    remover: 'anexos.remover',
  },
  /** Cada serviço responde os próprios prazos (vencidos e próximos) para o painel. */
  prazos: {
    qualidade: 'qualidade.prazos',
    seguranca: 'seguranca.prazos',
    codex: 'codex.prazos',
    sgi: 'sgi.prazos',
    servicos: 'servicos.prazos',
    ambiental: 'ambiental.prazos',
    esg: 'esg.prazos',
  },
  /** Cada serviço pesquisa nos próprios registros para a pesquisa geral. */
  busca: {
    qualidade: 'qualidade.buscar',
    auditorias: 'auditorias.buscar',
    seguranca: 'seguranca.buscar',
    codex: 'codex.buscar',
    sgi: 'sgi.buscar',
    servicos: 'servicos.buscar',
    ambiental: 'ambiental.buscar',
    esg: 'esg.buscar',
  },
  paineis: {
    buscar: 'paineis.buscar',
    vencimentos: 'paineis.vencimentos',
    enviarAvisos: 'paineis.enviar-avisos',
  },
  notificacoes: {
    enviarEmail: 'notificacoes.enviar-email',
  },
  /** Qualidade: não conformidades (docs/05-modulos/nao-conformidades.md). */
  naoConformidades: {
    listar: 'nao-conformidades.listar',
    resumo: 'nao-conformidades.resumo',
    porMes: 'nao-conformidades.por-mes',
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
    obterKit: 'auditorias.kit.obter',
    marcarItemDoKit: 'auditorias.kit.marcar',
    listarPerguntas: 'auditorias.perguntas.listar',
    criarPerguntaPropria: 'auditorias.perguntas.criar',
    excluirPerguntaPropria: 'auditorias.perguntas.excluir',
    obterRoteiro: 'auditorias.roteiro.obter',
    selecionarPerguntas: 'auditorias.roteiro.selecionar',
    responderPergunta: 'auditorias.roteiro.responder',
    listarEvidencias: 'auditorias.evidencias.listar',
    criarEvidenciaPropria: 'auditorias.evidencias.criar',
    excluirEvidenciaPropria: 'auditorias.evidencias.excluir',
    listarModelosNc: 'auditorias.modelos-nc.listar',
    criarModeloNcProprio: 'auditorias.modelos-nc.criar',
    excluirModeloNcProprio: 'auditorias.modelos-nc.excluir',
    listarPrompts: 'auditorias.prompts.listar',
    salvarPlano: 'auditorias.plano.salvar',
    logDoAuditor: 'auditorias.log-do-auditor',
    listarCriterios: 'auditorias.criterios.listar',
    criarCriterio: 'auditorias.criterios.criar',
    excluirCriterio: 'auditorias.criterios.excluir',
  },
  /** Segurança: acidentes e indicadores de SST (docs/05-modulos/acidentes.md). */
  acidentes: {
    listar: 'acidentes.listar',
    resumo: 'acidentes.resumo',
    obter: 'acidentes.obter',
    criar: 'acidentes.criar',
    atualizar: 'acidentes.atualizar',
    registrarCat: 'acidentes.registrar-cat',
    iniciarInvestigacao: 'acidentes.iniciar-investigacao',
    concluirInvestigacao: 'acidentes.concluir-investigacao',
    cancelar: 'acidentes.cancelar',
    registrarHoras: 'acidentes.registrar-horas',
    indicadores: 'acidentes.indicadores',
  },
  /** Codex: funcionários, setores e funções da empresa (docs/05-modulos/funcionarios.md). */
  funcionarios: {
    listar: 'funcionarios.listar',
    obter: 'funcionarios.obter',
    criar: 'funcionarios.criar',
    atualizar: 'funcionarios.atualizar',
    desligar: 'funcionarios.desligar',
    readmitir: 'funcionarios.readmitir',
  },
  asos: {
    listar: 'asos.listar',
    registrar: 'asos.registrar',
    anular: 'asos.anular',
  },
  treinamentos: {
    listar: 'treinamentos.listar',
    criar: 'treinamentos.criar',
    atualizar: 'treinamentos.atualizar',
    mudarSituacao: 'treinamentos.mudar-situacao',
    realizados: 'treinamentos.realizados',
    registrarTurma: 'treinamentos.registrar-turma',
    anularRealizado: 'treinamentos.anular-realizado',
  },
  vencimentos: {
    listar: 'vencimentos.listar',
    resumo: 'vencimentos.resumo',
  },
  setoresEmpresa: {
    listar: 'setores-empresa.listar',
    criar: 'setores-empresa.criar',
    atualizar: 'setores-empresa.atualizar',
    mudarSituacao: 'setores-empresa.mudar-situacao',
  },
  funcoes: {
    listar: 'funcoes.listar',
    criar: 'funcoes.criar',
    atualizar: 'funcoes.atualizar',
    mudarSituacao: 'funcoes.mudar-situacao',
  },
  /** Segurança: catálogo de EPIs e entregas (docs/05-modulos/epis.md). */
  riscos: {
    listar: 'riscos.listar',
    obter: 'riscos.obter',
    criar: 'riscos.criar',
    atualizar: 'riscos.atualizar',
    mudarSituacao: 'riscos.mudar-situacao',
    resumo: 'riscos.resumo',
  },
  pts: {
    listar: 'pts.listar',
    obter: 'pts.obter',
    criar: 'pts.criar',
    liberar: 'pts.liberar',
    encerrar: 'pts.encerrar',
    cancelar: 'pts.cancelar',
    resumo: 'pts.resumo',
  },
  registrosSst: {
    listar: 'registros-sst.listar',
    obter: 'registros-sst.obter',
    criar: 'registros-sst.criar',
    anular: 'registros-sst.anular',
    resumo: 'registros-sst.resumo',
  },
  terceiros: {
    listar: 'terceiros.listar',
    obter: 'terceiros.obter',
    criar: 'terceiros.criar',
    atualizar: 'terceiros.atualizar',
    registrarDocumento: 'terceiros.registrar-documento',
    resumo: 'terceiros.resumo',
  },
  sgi: {
    resumo: 'sgi.resumo',
    listarRos: 'sgi.ros.listar',
    obterRo: 'sgi.ros.obter',
    criarRo: 'sgi.ros.criar',
    atualizarRo: 'sgi.ros.atualizar',
    encerrarRo: 'sgi.ros.encerrar',
    listarObjetivos: 'sgi.objetivos.listar',
    criarObjetivo: 'sgi.objetivos.criar',
    atualizarObjetivo: 'sgi.objetivos.atualizar',
    situacaoObjetivo: 'sgi.objetivos.situacao',
    registrarMedicao: 'sgi.objetivos.medicao',
    listarAnalises: 'sgi.analises.listar',
    obterAnalise: 'sgi.analises.obter',
    criarAnalise: 'sgi.analises.criar',
    listarMudancas: 'sgi.mudancas.listar',
    obterMudanca: 'sgi.mudancas.obter',
    criarMudanca: 'sgi.mudancas.criar',
    decidirMudanca: 'sgi.mudancas.decidir',
    implementarMudanca: 'sgi.mudancas.implementar',
  },
  servicos: {
    resumo: 'servicos.resumo',
    listarOs: 'servicos.os.listar',
    obterOs: 'servicos.os.obter',
    criarOs: 'servicos.os.criar',
    iniciarOs: 'servicos.os.iniciar',
    concluirOs: 'servicos.os.concluir',
    cancelarOs: 'servicos.os.cancelar',
    avaliarOs: 'servicos.os.avaliar',
    listarNps: 'servicos.nps.listar',
    registrarNps: 'servicos.nps.registrar',
    listarAvaliacoes: 'servicos.fornecedores.listar',
    avaliarFornecedor: 'servicos.fornecedores.avaliar',
  },
  ambiental: {
    resumo: 'ambiental.resumo',
    listarAspectos: 'ambiental.aspectos.listar',
    obterAspecto: 'ambiental.aspectos.obter',
    criarAspecto: 'ambiental.aspectos.criar',
    atualizarAspecto: 'ambiental.aspectos.atualizar',
    situacaoAspecto: 'ambiental.aspectos.situacao',
    listarRequisitos: 'ambiental.requisitos.listar',
    obterRequisito: 'ambiental.requisitos.obter',
    criarRequisito: 'ambiental.requisitos.criar',
    atualizarRequisito: 'ambiental.requisitos.atualizar',
    avaliarRequisito: 'ambiental.requisitos.avaliar',
    listarLicencas: 'ambiental.licencas.listar',
    obterLicenca: 'ambiental.licencas.obter',
    criarLicenca: 'ambiental.licencas.criar',
    renovacaoSolicitada: 'ambiental.licencas.renovacao',
    criarCondicionante: 'ambiental.licencas.condicionante',
    cumprirCondicionante: 'ambiental.licencas.cumprir-condicionante',
    listarResiduos: 'ambiental.residuos.listar',
    criarResiduo: 'ambiental.residuos.criar',
    atualizarResiduo: 'ambiental.residuos.atualizar',
    listarSaidas: 'ambiental.saidas.listar',
    registrarSaida: 'ambiental.saidas.registrar',
    registrarCdf: 'ambiental.saidas.cdf',
    listarProdutos: 'ambiental.produtos.listar',
    obterProduto: 'ambiental.produtos.obter',
    criarProduto: 'ambiental.produtos.criar',
    atualizarProduto: 'ambiental.produtos.atualizar',
    situacaoProduto: 'ambiental.produtos.situacao',
    listarConsumos: 'ambiental.consumo.listar',
    registrarConsumo: 'ambiental.consumo.registrar',
    inventarioGee: 'ambiental.gee.inventario',
    definirFator: 'ambiental.gee.fator',
    listarMonitoramentos: 'ambiental.monitoramentos.listar',
    obterMonitoramento: 'ambiental.monitoramentos.obter',
    criarMonitoramento: 'ambiental.monitoramentos.criar',
    atualizarMonitoramento: 'ambiental.monitoramentos.atualizar',
    situacaoMonitoramento: 'ambiental.monitoramentos.situacao',
    registrarResultado: 'ambiental.monitoramentos.resultado',
  },
  esg: {
    resumo: 'esg.resumo',
    listarTemas: 'esg.temas.listar',
    obterTema: 'esg.temas.obter',
    criarTema: 'esg.temas.criar',
    atualizarTema: 'esg.temas.atualizar',
    situacaoTema: 'esg.temas.situacao',
    importarCatalogo: 'esg.temas.importar-catalogo',
    registrarAndamento: 'esg.temas.andamento',
  },
  epis: {
    listar: 'epis.listar',
    obter: 'epis.obter',
    criar: 'epis.criar',
    atualizar: 'epis.atualizar',
    mudarSituacao: 'epis.mudar-situacao',
    resumo: 'epis.resumo',
    listarEntregas: 'epis.listar-entregas',
    registrarEntrega: 'epis.registrar-entrega',
    devolver: 'epis.devolver',
    anular: 'epis.anular',
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
