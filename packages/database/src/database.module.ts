import {
  Global,
  Inject,
  Logger,
  Module,
  type DynamicModule,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { createDatabase, type DatabaseHandle } from './connection.js';

/** Token de injeção: `@Inject(DATABASE) private readonly db: Database<typeof schema>`. */
export const DATABASE = Symbol('DATABASE');
const HANDLE = Symbol('DATABASE_HANDLE');

export interface DatabaseModuleOptions<
  TSchema extends Record<string, unknown>,
> {
  url: string;
  schema: TSchema;
  maxConnections?: number;
}

@Global()
@Module({})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(
    @Inject(HANDLE)
    private readonly handle: DatabaseHandle<Record<string, unknown>>,
  ) {}

  static forRoot<TSchema extends Record<string, unknown>>(
    options: DatabaseModuleOptions<TSchema>,
  ): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        {
          provide: HANDLE,
          useFactory: () => {
            const logger = new Logger('Database');
            return createDatabase({
              ...options,
              onConnectionError: (error) =>
                logger.warn(
                  `Conexão com o banco perdida (${error.message}). Reconectará quando o banco voltar.`,
                ),
            });
          },
        },
        {
          provide: DATABASE,
          useFactory: (h: DatabaseHandle<TSchema>) => h.db,
          inject: [HANDLE],
        },
      ],
      exports: [DATABASE],
    };
  }

  async onApplicationShutdown(): Promise<void> {
    await this.handle.close();
  }
}
