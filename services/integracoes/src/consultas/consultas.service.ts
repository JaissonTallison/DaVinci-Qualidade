import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DATABASE, type Database } from '@davinci/database';
import { ErroDeNegocio } from '@davinci/shared';
import {
  cnpjValido,
  type ConsultaCep,
  type ConsultaCnpj,
} from '@davinci/types';
import * as schema from '../db/schema.js';
import { consultasCache } from '../db/schema.js';
import {
  FONTES_CEP,
  FONTES_CNPJ,
  NaoEncontrado,
  type Buscar,
} from './fontes.js';

/** Quem faz as requisições HTTP (nos testes, um falso). */
export const BUSCAR = Symbol('BUSCAR');

const DIA = 86_400_000;
/** Por quanto tempo uma consulta vale sem perguntar de novo à fonte. */
export const VALIDADE = {
  cnpj: 7 * DIA,
  cep: 90 * DIA,
  naoEncontrado: DIA,
} as const;

type Tipo = 'cnpj' | 'cep';

/** Campo de texto da mensagem (qualquer outra coisa vira vazio). */
const textoDe = (dados: unknown, campo: string): string => {
  const v = (dados as Record<string, unknown> | null)?.[campo];
  return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
};
type Fonte<T> = {
  nome: string;
  consultar(
    chave: string,
    buscar: Buscar,
  ): Promise<Omit<T, 'fonte' | 'consultadoEm'>>;
};

const FORA_DO_AR = {
  cnpj: 'Não foi possível consultar a Receita agora. Preencha à mão ou tente de novo em instantes.',
  cep: 'Não foi possível consultar o CEP agora. Preencha o endereço à mão ou tente de novo em instantes.',
};
const NAO_ENCONTRADO = {
  cnpj: 'CNPJ não encontrado na base da Receita.',
  cep: 'CEP não encontrado. Confira os números ou preencha o endereço à mão.',
};

@Injectable()
export class ConsultasService {
  private readonly logger = new Logger('Consultas');

  constructor(
    @Inject(DATABASE) private readonly db: Database<typeof schema>,
    @Inject(BUSCAR) private readonly buscar: Buscar,
  ) {}

  async cnpj(dados: unknown): Promise<ConsultaCnpj> {
    const bruto = textoDe(dados, 'cnpj')
      .toUpperCase()
      .replace(/[^0-9A-Z]/g, '');
    if (!cnpjValido(bruto))
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Informe um CNPJ válido para consultar.',
        [{ campo: 'cnpj', mensagem: 'CNPJ inválido.' }],
      );
    if (/[A-Z]/.test(bruto)) {
      throw new ErroDeNegocio(
        'REGRA_DE_NEGOCIO',
        'A consulta pública ainda não cobre o CNPJ alfanumérico. Preencha os dados à mão.',
      );
    }
    const r = await this.consultar<ConsultaCnpj>('cnpj', bruto, FONTES_CNPJ);
    // A Receita grava cidade e rua sem acento ("SAO PAULO"): o CEP traz a grafia correta
    if (r.endereco) {
      const cep = await this.consultar<ConsultaCep>(
        'cep',
        r.endereco.cep,
        FONTES_CEP,
      ).catch(() => null);
      if (cep) {
        r.endereco = {
          ...r.endereco,
          logradouro: cep.logradouro || r.endereco.logradouro,
          bairro: cep.bairro || r.endereco.bairro,
          cidade: cep.cidade || r.endereco.cidade,
          uf: cep.uf || r.endereco.uf,
          codigoMunicipio: r.endereco.codigoMunicipio ?? cep.codigoMunicipio,
        };
      }
    }
    return r;
  }

  async cep(dados: unknown): Promise<ConsultaCep> {
    const cep = textoDe(dados, 'cep').replace(/\D/g, '');
    if (!/^\d{8}$/.test(cep))
      throw new ErroDeNegocio(
        'DADOS_INVALIDOS',
        'Informe um CEP com 8 dígitos.',
        [{ campo: 'cep', mensagem: 'Informe um CEP com 8 dígitos.' }],
      );
    return this.consultar<ConsultaCep>('cep', cep, FONTES_CEP);
  }

  // ---------------------------------------------------------------------------

  /** Cache válido → devolve. Senão: fonte principal, depois a reserva. Tudo fora do ar → cache antigo, se houver. */
  private async consultar<T extends { fonte: string; consultadoEm: string }>(
    tipo: Tipo,
    chave: string,
    fontes: Fonte<T>[],
  ): Promise<T> {
    const [guardado] = await this.db
      .select()
      .from(consultasCache)
      .where(
        and(eq(consultasCache.tipo, tipo), eq(consultasCache.chave, chave)),
      );
    const idade = guardado
      ? Date.now() - guardado.consultadoEm.getTime()
      : Infinity;
    if (
      guardado &&
      idade < (guardado.dados ? VALIDADE[tipo] : VALIDADE.naoEncontrado)
    )
      return this.doCache<T>(tipo, guardado);

    for (const fonte of fontes) {
      try {
        const resultado = await fonte.consultar(chave, this.buscar);
        const completo = {
          ...resultado,
          fonte: fonte.nome,
          consultadoEm: new Date().toISOString(),
        } as T;
        await this.guardar(tipo, chave, completo, fonte.nome);
        return completo;
      } catch (erro) {
        if (erro instanceof NaoEncontrado) {
          await this.guardar(tipo, chave, null, fonte.nome);
          throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO[tipo]);
        }
        this.logger.warn(
          `Fonte ${fonte.nome} falhou para ${tipo} ${chave}: ${(erro as Error).message}. Tentando a próxima.`,
        );
      }
    }
    if (guardado?.dados) {
      this.logger.warn(
        `Todas as fontes de ${tipo} fora do ar: devolvendo a consulta guardada de ${guardado.consultadoEm.toISOString()}.`,
      );
      return this.doCache<T>(tipo, guardado);
    }
    throw new ErroDeNegocio('SERVICO_INDISPONIVEL', FORA_DO_AR[tipo]);
  }

  private doCache<T>(
    tipo: Tipo,
    guardado: typeof consultasCache.$inferSelect,
  ): T {
    if (!guardado.dados)
      throw new ErroDeNegocio('NAO_ENCONTRADO', NAO_ENCONTRADO[tipo]);
    return {
      ...(guardado.dados as T),
      fonte: guardado.fonte,
      consultadoEm: guardado.consultadoEm.toISOString(),
    };
  }

  private async guardar(
    tipo: Tipo,
    chave: string,
    dados: unknown,
    fonte: string,
  ) {
    const consultadoEm = new Date();
    await this.db
      .insert(consultasCache)
      .values({ tipo, chave, dados, fonte, consultadoEm })
      .onConflictDoUpdate({
        target: [consultasCache.tipo, consultasCache.chave],
        set: { dados, fonte, consultadoEm },
      });
  }
}
