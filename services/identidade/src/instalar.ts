/**
 * Instalação do primeiro acesso: chaves de assinatura, empresa, perfis padrão e administrador.
 *
 *   pnpm identidade:instalar                       (desenvolvimento: valores padrão)
 *   pnpm identidade:instalar --cnpj 11.444.777/0001-61 --razao-social "Minha Empresa Ltda." \
 *        --admin-nome "Ana Souza" --admin-email ana@empresa.com.br
 *
 * Pode ser executado de novo: não duplica empresa, perfis nem usuário.
 */
import '@davinci/shared/load-env';
import { generateKeyPairSync, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { and, eq } from 'drizzle-orm';
import { createDatabase } from '@davinci/database';
import { requireEnv } from '@davinci/shared';
import {
  EMPRESA_DESENVOLVIMENTO_ID,
  PERFIS_PADRAO,
  cnpjValido,
  formatarDocumento,
  isUuid,
  normalizarDocumento,
} from '@davinci/types';
import { RECURSOS_BASICOS } from '@davinci/types';
import * as schema from './db/schema.js';
import {
  empresas,
  perfis,
  usuarios,
  vinculos,
  estabelecimentos,
} from './db/schema.js';
import { gerarSenhaProvisoria, protegerSenha } from './seguranca/senhas.js';

const { values: a } = parseArgs({
  // Ignora um "--" solto (alguns jeitos de chamar via pnpm o repassam)
  args: process.argv.slice(2).filter((arg, i) => !(i === 0 && arg === '--')),
  options: {
    'empresa-id': { type: 'string', default: EMPRESA_DESENVOLVIMENTO_ID },
    cnpj: { type: 'string', default: '11.444.777/0001-61' },
    'razao-social': {
      type: 'string',
      default: 'Empresa de Desenvolvimento Ltda.',
    },
    'nome-fantasia': { type: 'string', default: 'Empresa de desenvolvimento' },
    'admin-nome': { type: 'string', default: 'Administrador' },
    'admin-email': { type: 'string', default: 'admin@davinci.local' },
  },
});

const passo = (texto: string) => console.log(`  ✓ ${texto}`);

function garantirChaves(): void {
  const envIdentidade = '.env';
  const envGateway = '../../apps/api-gateway/.env';
  garantirChaveDeCriptografia(envIdentidade);
  const temChave =
    existsSync(envIdentidade) &&
    /^JWT_CHAVE_PRIVADA=.+/m.test(readFileSync(envIdentidade, 'utf8'));
  if (temChave) return passo('Chaves de assinatura já existem (mantidas)');
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const privada = Buffer.from(
    privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
  ).toString('base64');
  const publica = Buffer.from(
    publicKey.export({ type: 'spki', format: 'pem' }).toString(),
  ).toString('base64');
  appendFileSync(
    envIdentidade,
    `\n# Chave PRIVADA de assinatura dos tokens (gerada pela instalação; nunca compartilhe)\nJWT_CHAVE_PRIVADA=${privada}\n`,
  );
  appendFileSync(
    envGateway,
    `\n# Chave PÚBLICA para conferir os tokens (gerada pela instalação do Identidade)\nJWT_CHAVE_PUBLICA=${publica}\n`,
  );
  process.env.JWT_CHAVE_PRIVADA = privada;
  passo(
    'Par de chaves Ed25519 gerado (privada → identidade/.env · pública → api-gateway/.env)',
  );
}

/** Chave AES-256 para dados sensíveis no banco (segredo do 2FA). Perdê-la invalida os 2FA ativos. */
function garantirChaveDeCriptografia(envIdentidade: string): void {
  if (
    existsSync(envIdentidade) &&
    /^CRIPTOGRAFIA_CHAVE=.+/m.test(readFileSync(envIdentidade, 'utf8'))
  )
    return passo('Chave de criptografia já existe (mantida)');
  const chave = randomBytes(32).toString('base64');
  appendFileSync(
    envIdentidade,
    `\n# Chave de criptografia dos segredos do 2FA (gerada pela instalação; guarde com o backup; nunca compartilhe)\nCRIPTOGRAFIA_CHAVE=${chave}\n`,
  );
  process.env.CRIPTOGRAFIA_CHAVE = chave;
  passo('Chave de criptografia gerada (identidade/.env)');
}

async function main() {
  console.log('Instalação do DaVinci Qualidade · Identidade');
  const cnpj = normalizarDocumento(a.cnpj!);
  if (!cnpjValido(cnpj)) throw new Error(`CNPJ inválido: ${a.cnpj}`);
  if (!isUuid(a['empresa-id']))
    throw new Error('--empresa-id deve ser um UUID');
  const email = a['admin-email']!.trim().toLowerCase();

  garantirChaves();
  const { db, close } = createDatabase({
    url: requireEnv('DATABASE_URL'),
    schema,
  });
  try {
    await db.transaction(async (tx) => {
      let [empresa] = await tx
        .select()
        .from(empresas)
        .where(eq(empresas.cnpj, cnpj));
      if (empresa)
        passo(
          `Empresa já existe: ${empresa.razaoSocial} (${formatarDocumento(cnpj)})`,
        );
      else {
        [empresa] = await tx
          .insert(empresas)
          .values({
            id: a['empresa-id'],
            cnpj,
            razaoSocial: a['razao-social']!,
            nomeFantasia: a['nome-fantasia'] || null,
            recursos: RECURSOS_BASICOS,
          })
          .returning();
        passo(
          `Empresa criada: ${empresa!.razaoSocial} (${formatarDocumento(cnpj)})`,
        );
      }
      // Toda empresa tem a sua matriz (estabelecimento com o CNPJ principal)
      await tx
        .insert(estabelecimentos)
        .values({
          empresaId: empresa!.id,
          tipo: 'matriz',
          cnpj,
          nome: 'Matriz',
          razaoSocial: empresa!.razaoSocial,
          nomeFantasia: empresa!.nomeFantasia,
          indicadorIE: 'nao_contribuinte',
        })
        .onConflictDoNothing();

      const perfisDaEmpresa: Record<string, string> = {};
      for (const p of PERFIS_PADRAO) {
        let [existente] = await tx
          .select()
          .from(perfis)
          .where(
            and(eq(perfis.empresaId, empresa!.id), eq(perfis.nome, p.nome)),
          );
        existente ??= (
          await tx
            .insert(perfis)
            .values({
              empresaId: empresa!.id,
              nome: p.nome,
              descricao: p.descricao,
              permissoes: p.permissoes,
              protegido: p.nome === 'Administrador',
            })
            .returning()
        )[0];
        perfisDaEmpresa[p.nome] = existente!.id;
      }
      passo(`Perfis padrão: ${Object.keys(perfisDaEmpresa).join(', ')}`);

      const [jaExiste] = await tx
        .select()
        .from(usuarios)
        .where(eq(usuarios.email, email));
      if (jaExiste) {
        passo(`Administrador já existe: ${email} (senha mantida)`);
        await tx
          .insert(vinculos)
          .values({
            empresaId: empresa!.id,
            usuarioId: jaExiste.id,
            perfilId: perfisDaEmpresa.Administrador!,
          })
          .onConflictDoNothing();
        return;
      }
      const senhaInicial = gerarSenhaProvisoria();
      const [admin] = await tx
        .insert(usuarios)
        .values({
          nome: a['admin-nome']!,
          email,
          senhaHash: await protegerSenha(senhaInicial),
          deveTrocarSenha: true,
          ultimaEmpresaId: empresa!.id,
        })
        .returning();
      await tx.insert(vinculos).values({
        empresaId: empresa!.id,
        usuarioId: admin!.id,
        perfilId: perfisDaEmpresa.Administrador!,
      });
      passo(`Administrador criado: ${email}`);
      console.log(
        `\n  Senha inicial (exibida só agora; troca obrigatória no 1º acesso):\n\n      ${senhaInicial}\n`,
      );
    });
  } finally {
    await close();
  }
  console.log('Concluído.');
}

main().catch((e: unknown) => {
  console.error(`✗ ${(e as Error).message}`);
  process.exit(1);
});
