import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ClientsModule } from '@nestjs/microservices';
import { createObserveModule } from '@nestjs/observe';
import { rmqClientOptions } from '@davinci/shared';
import { SERVICE_NAMES } from '@davinci/types';
import { PerfisController } from './administracao/perfis.controller.js';
import { UsuariosController } from './administracao/usuarios.controller.js';
import { AuthController } from './auth/auth.controller.js';
import { ContaController } from './auth/conta.controller.js';
import { EmpresaController } from './empresa/empresa.controller.js';
import { GuardaDeAcesso } from './auth/guarda.js';
import { RevogacoesService } from './auth/revogacoes.service.js';
import { ContextoMiddleware } from './contexto.js';
import { FiltroDeErrosHttp } from './filtro-erros-http.js';
import { HealthController } from './health.controller.js';
import { NaoConformidadesController } from './qualidade/nao-conformidades.controller.js';
import { PlanosDeAcaoController } from './qualidade/planos-de-acao.controller.js';
import {
  InspecoesController,
  ModelosDeInspecaoController,
} from './qualidade/inspecoes.controller.js';
import { MensageriaService } from './mensageria.service.js';
import { ConsultasController } from './parceiros/consultas.controller.js';
import { ParceirosController } from './parceiros/parceiros.controller.js';
import { ReferenciasController } from './parceiros/referencias.controller.js';
import { CalibracaoController } from './qualidade/calibracao.controller.js';
import {
  AuditoriasController,
  PerguntasDeAuditoriaController,
  EvidenciasDeAuditoriaController,
  ModelosDeNcController,
  PromptsDeIaController,
  LogDoAuditorController,
  CriteriosDeAuditoriaController,
} from './auditorias/auditorias.controller.js';
import { AcidentesController } from './seguranca/acidentes.controller.js';
import { EpisController } from './seguranca/epis.controller.js';
import { RegistrosDeSegurancaController } from './seguranca/registros.controller.js';
import { TerceirosController } from './seguranca/terceiros.controller.js';
import {
  SgiController,
  RiscosEOportunidadesController,
  ObjetivosController,
  AnalisesCriticasController,
  MudancasController,
} from './sgi/sgi.controller.js';
import {
  PermissoesDeTrabalhoController,
  RiscosController,
} from './seguranca/pgr-e-pt.controller.js';
import { AnexosController } from './anexos/anexos.controller.js';
import { PaineisController } from './paineis/paineis.controller.js';
import {
  ServicosController,
  OrdensDeServicoController,
  NpsController,
  AvaliacoesDeFornecedoresController,
} from './servicos/servicos.controller.js';
import {
  AmbientalController,
  AspectosAmbientaisController,
  RequisitosLegaisController,
  LicencasController,
  ResiduosController,
  ProdutosQuimicosController,
  ConsumoAmbientalController,
  MonitoramentosController,
} from './ambiental/ambiental.controller.js';
import { EsgController } from './esg/esg.controller.js';
import {
  AsosController,
  TreinamentosController,
  VencimentosController,
} from './cadastros/exames-e-treinamentos.controller.js';
import {
  FuncionariosController,
  FuncoesController,
  SetoresDaEmpresaController,
} from './cadastros/funcionarios.controller.js';
import { CompetenciasController } from './cadastros/competencias.controller.js';
import { ListasController } from './cadastros/listas.controller.js';
import {
  DestinadoresController,
  EcoeficienciaController,
  ObrigacoesLegaisController,
  OcorrenciasAmbientaisController,
  ProgramasAmbientaisController,
} from './ambiental/gestao.controller.js';
import {
  BrigadaController,
  EquipamentosController,
  EsocialController,
  EsocialDoRiscoController,
  InvestigacaoDoAcidenteController,
  OrdensSstController,
  PlanoDeEmergenciaController,
  TurmasController,
} from './seguranca/sst-ampliada.controller.js';
import {
  CatalogoDeServicosController,
  ContratosController,
  ExecucaoDaOsController,
  PesquisasController,
  ReclamacoesController,
} from './servicos/gestao.controller.js';
import {
  FmeasController,
  PlanosDeControleController,
  PpapsController,
} from './qualidade/automotivo.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

/** Telemetria (https://observe.nestjs.com): só liga quando há chaves no .env. */
export const observeEnabled = Boolean(
  process.env.OBSERVE_APP_KEY && process.env.OBSERVE_APP_SECRET,
);

@Module({
  imports: [
    ...(observeEnabled
      ? [
          ObserveModule.forRoot({
            appKey: process.env.OBSERVE_APP_KEY!,
            appSecret: process.env.OBSERVE_APP_SECRET!,
            serviceId: 'api-gateway',
          }),
        ]
      : []),
    // Um cliente RabbitMQ por microsserviço; injete com @Inject(SERVICES.X).
    ClientsModule.register(SERVICE_NAMES.map(rmqClientOptions)),
  ],
  controllers: [
    HealthController,
    AuthController,
    ContaController,
    UsuariosController,
    PerfisController,
    EmpresaController,
    ParceirosController,
    ReferenciasController,
    ConsultasController,
    NaoConformidadesController,
    PlanosDeAcaoController,
    InspecoesController,
    ModelosDeInspecaoController,
    CalibracaoController,
    AuditoriasController,
    PerguntasDeAuditoriaController,
    EvidenciasDeAuditoriaController,
    ModelosDeNcController,
    PromptsDeIaController,
    LogDoAuditorController,
    CriteriosDeAuditoriaController,
    AcidentesController,
    EpisController,
    RegistrosDeSegurancaController,
    TerceirosController,
    SgiController,
    RiscosEOportunidadesController,
    ObjetivosController,
    AnalisesCriticasController,
    MudancasController,
    RiscosController,
    PermissoesDeTrabalhoController,
    AnexosController,
    PaineisController,
    ServicosController,
    AmbientalController,
    AspectosAmbientaisController,
    RequisitosLegaisController,
    LicencasController,
    ResiduosController,
    ProdutosQuimicosController,
    ConsumoAmbientalController,
    MonitoramentosController,
    EsgController,
    OrdensDeServicoController,
    NpsController,
    AvaliacoesDeFornecedoresController,
    AsosController,
    TreinamentosController,
    VencimentosController,
    FuncionariosController,
    SetoresDaEmpresaController,
    FuncoesController,
    CompetenciasController,
    ListasController,
    OcorrenciasAmbientaisController,
    ObrigacoesLegaisController,
    DestinadoresController,
    EcoeficienciaController,
    ProgramasAmbientaisController,
    InvestigacaoDoAcidenteController,
    EsocialDoRiscoController,
    EsocialController,
    EquipamentosController,
    BrigadaController,
    PlanoDeEmergenciaController,
    OrdensSstController,
    TurmasController,
    ExecucaoDaOsController,
    CatalogoDeServicosController,
    ContratosController,
    ReclamacoesController,
    PesquisasController,
    FmeasController,
    PlanosDeControleController,
    PpapsController,
  ],
  providers: [
    MensageriaService,
    RevogacoesService,
    // Todo erro HTTP sai como { erro: { codigo, mensagem, rastreioId } }
    { provide: APP_FILTER, useClass: FiltroDeErrosHttp },
    // Toda rota exige login (exceto @Publica); empresa e usuário vêm do token
    { provide: APP_GUARD, useClass: GuardaDeAcesso },
  ],
  exports: [MensageriaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // Toda requisição ganha um rastreio (empresa e usuário vêm do token, na guarda)
    consumer.apply(ContextoMiddleware).forRoutes('*');
  }
}
