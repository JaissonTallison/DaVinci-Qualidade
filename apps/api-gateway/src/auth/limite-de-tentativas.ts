import {
  Injectable,
  SetMetadata,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CABECALHO_IP, lerRastreio } from '../contexto.js';
import { ErroDoServico } from '../mensageria.service.js';

/**
 * Limite de requisições por IP (ERR-06). Freio contra força bruta e enumeração nas rotas sensíveis sem
 * login (entrar, 2FA, recuperação de senha, link de pesquisa). É um backstop grosseiro: a trava por
 * conta (5 senhas erradas) é quem barra o ataque dirigido; aqui é o teto de rajada por IP.
 *
 * Janela fixa em memória. O gateway roda com 1 réplica, então o contador não precisa de store externo;
 * se um dia escalar para várias réplicas, trocar por um store compartilhado (ex.: Redis).
 */
export interface RegraDeLimite {
  /** Máximo de requisições na janela. */
  max: number;
  /** Tamanho da janela, em milissegundos. */
  janelaMs: number;
}

const CHAVE_LIMITE = 'davinci:limite-de-tentativas';

/** Marca uma rota (ou controller) com um limite por IP. Sem isto, a guarda deixa passar. */
export const Limite = (regra: RegraDeLimite) => SetMetadata(CHAVE_LIMITE, regra);

/** Presets. Generosos para não travar um escritório inteiro atrás de um IP (NAT). */
export const LIMITE_LOGIN: RegraDeLimite = { max: 40, janelaMs: 60_000 };
export const LIMITE_SENHA: RegraDeLimite = { max: 15, janelaMs: 60_000 };
export const LIMITE_PESQUISA: RegraDeLimite = { max: 40, janelaMs: 60_000 };

interface Janela {
  contador: number;
  expiraEm: number;
}

@Injectable()
export class GuardaDeLimite implements CanActivate {
  private readonly janelas = new Map<string, Janela>();
  private ultimaLimpeza = Date.now();

  constructor(private readonly reflector: Reflector) {}

  canActivate(contexto: ExecutionContext): boolean {
    const regra = this.reflector.getAllAndOverride<RegraDeLimite | undefined>(
      CHAVE_LIMITE,
      [contexto.getHandler(), contexto.getClass()],
    );
    if (!regra) return true;

    const req = contexto.switchToHttp().getRequest<Request>();
    const chave = `${contexto.getClass().name}.${contexto.getHandler().name}:${this.ip(req)}`;
    const agora = Date.now();
    this.limpar(agora);

    const janela = this.janelas.get(chave);
    if (!janela || janela.expiraEm <= agora) {
      this.janelas.set(chave, {
        contador: 1,
        expiraEm: agora + regra.janelaMs,
      });
      return true;
    }

    janela.contador += 1;
    if (janela.contador > regra.max) {
      const seg = Math.ceil((janela.expiraEm - agora) / 1000);
      const espera = seg > 60 ? `${Math.ceil(seg / 60)} min` : `${seg}s`;
      throw new ErroDoServico({
        codigo: 'EXCESSO_DE_TENTATIVAS',
        mensagem: `Muitas tentativas. Aguarde ${espera} e tente de novo.`,
        rastreioId: lerRastreio(req.headers),
      });
    }
    return true;
  }

  /** O IP real vem do web no cabeçalho x-davinci-ip; o socket é o servidor do web. */
  private ip(req: Request): string {
    const valor = req.headers[CABECALHO_IP];
    const bruto = (Array.isArray(valor) ? valor[0] : valor)
      ?.split(',')[0]
      ?.trim();
    return bruto || req.ip || 'desconhecido';
  }

  /** Faxina periódica das janelas vencidas, para a memória não crescer sem limite. */
  private limpar(agora: number): void {
    if (agora - this.ultimaLimpeza < 60_000) return;
    this.ultimaLimpeza = agora;
    for (const [chave, janela] of this.janelas)
      if (janela.expiraEm <= agora) this.janelas.delete(chave);
  }
}
