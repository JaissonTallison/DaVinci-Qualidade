// Gera a migração com as tabelas oficiais de referência do Codex:
//   - CNAE 2.3 (subclasses) e seções, do IBGE: https://servicodados.ibge.gov.br/api/v2/cnae/subclasses
//   - Bancos com código COMPE, do Banco Central (via BrasilAPI): https://brasilapi.com.br/api/banks/v1
// Uso: node scripts/gerar-referencias.mjs drizzle/<arquivo>.sql
// Rode de novo quando o IBGE publicar uma versão nova da CNAE (gera uma migração nova com upsert).
import { writeFileSync } from 'node:fs';

const destino = process.argv[2];
if (!destino)
  throw new Error(
    'Informe o arquivo de destino: node scripts/gerar-referencias.mjs drizzle/0005_referencias.sql',
  );

async function baixar(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!r.ok) throw new Error(`${url} respondeu ${r.status}`);
  return r.json();
}

/** "COMÉRCIO VAREJISTA DE …" → "Comércio varejista de …" */
const frase = (t) => {
  const s = t.replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR');
  return s.charAt(0).toLocaleUpperCase('pt-BR') + s.slice(1);
};
const q = (v) =>
  v === null || v === undefined
    ? 'NULL'
    : `'${String(v).replaceAll("'", "''")}'`;

const [subclasses, bancos] = await Promise.all([
  baixar('https://servicodados.ibge.gov.br/api/v2/cnae/subclasses'),
  baixar('https://brasilapi.com.br/api/banks/v1'),
]);

const setores = new Map();
const cnaes = subclasses.map((s) => {
  const secao = s.classe.grupo.divisao.secao;
  setores.set(secao.id, frase(secao.descricao));
  const palavras = [
    ...new Set(
      (s.atividades ?? []).map((a) => a.toLocaleLowerCase('pt-BR').trim()),
    ),
  ].join(' | ');
  return {
    codigo: s.id,
    descricao: frase(s.descricao),
    setor: secao.id,
    palavras,
  };
});
const comCodigo = bancos
  .filter((b) => Number.isInteger(b.code))
  .map((b) => ({
    codigo: String(b.code).padStart(3, '0'),
    ispb: b.ispb ?? null,
    nome: (b.fullName || b.name).trim(),
    nomeCurto: (b.name || b.fullName).trim(),
  }))
  .filter((b, i, todos) => todos.findIndex((o) => o.codigo === b.codigo) === i);

const linhas = [
  `-- Tabelas oficiais de referência. GERADO por scripts/gerar-referencias.mjs em ${new Date().toISOString().slice(0, 10)}: não edite à mão.`,
  `-- ${setores.size} setores (seções CNAE), ${cnaes.length} atividades CNAE 2.3 (IBGE), ${comCodigo.length} bancos (COMPE).`,
  'INSERT INTO "setores" ("id", "nome") VALUES',
  [...setores]
    .sort()
    .map(([id, nome]) => `  (${q(id)}, ${q(nome)})`)
    .join(',\n') +
    '\nON CONFLICT ("id") DO UPDATE SET "nome" = EXCLUDED."nome";',
  '--> statement-breakpoint',
  'INSERT INTO "cnaes" ("codigo", "descricao", "setor", "palavras") VALUES',
  cnaes
    .map(
      (c) =>
        `  (${q(c.codigo)}, ${q(c.descricao)}, ${q(c.setor)}, ${q(c.palavras)})`,
    )
    .join(',\n') +
    '\nON CONFLICT ("codigo") DO UPDATE SET "descricao" = EXCLUDED."descricao", "setor" = EXCLUDED."setor", "palavras" = EXCLUDED."palavras";',
  '--> statement-breakpoint',
  'INSERT INTO "bancos" ("codigo", "ispb", "nome", "nome_curto") VALUES',
  comCodigo
    .map(
      (b) =>
        `  (${q(b.codigo)}, ${q(b.ispb)}, ${q(b.nome)}, ${q(b.nomeCurto)})`,
    )
    .join(',\n') +
    '\nON CONFLICT ("codigo") DO UPDATE SET "ispb" = EXCLUDED."ispb", "nome" = EXCLUDED."nome", "nome_curto" = EXCLUDED."nome_curto";',
  '',
];
writeFileSync(destino, linhas.join('\n'));
console.log(
  `${destino}: ${setores.size} setores, ${cnaes.length} CNAEs, ${comCodigo.length} bancos`,
);
