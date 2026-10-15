import { SetMetadata } from '@nestjs/common';
import type {
  Permissao as CodigoPermissao,
  Recurso as CodigoRecurso,
} from '@davinci/types';

export const ROTA_PUBLICA = 'davinci:publica';
export const PERMISSAO_EXIGIDA = 'davinci:permissao';
export const LIBERADA_COM_PENDENCIA = 'davinci:pendencia';
export const RECURSO_EXIGIDO = 'davinci:recurso';

/** A122: a rota só existe com o recurso ligado na empresa (desligado = sem permissão, com a explicação). */
export const Recurso = (recurso: CodigoRecurso) =>
  SetMetadata(RECURSO_EXIGIDO, recurso);

/** Rota acessível sem login (por padrão, toda rota exige login). */
export const Publica = () => SetMetadata(ROTA_PUBLICA, true);

/**
 * Rota que funciona mesmo com PENDÊNCIA de acesso: senha inicial a trocar ou 2FA a ativar
 * (trocar senha, "eu", configurar o 2FA).
 */
export const LiberadaComPendencia = () =>
  SetMetadata(LIBERADA_COM_PENDENCIA, true);

/** Exige a permissão no perfil do usuário na empresa atual (com várias: basta UMA delas). */
export const Permissao = (
  ...permissoes: [CodigoPermissao, ...CodigoPermissao[]]
) => SetMetadata(PERMISSAO_EXIGIDA, permissoes);

/** Basta estar logado (anula uma @Permissao da classe para esta rota). */
export const SoLogin = () => SetMetadata(PERMISSAO_EXIGIDA, []);
