import { NORMAS, TEMAS_DO_ANEXO_A } from '@davinci/types';
import { BIBLIOTECA_DE_EVIDENCIAS } from '../conteudo/evidencias/index.js';
import { casaClausula, compararClausulas } from './evidencias.service.js';

describe('Biblioteca de evidências', () => {
  it('conteúdo: códigos únicos, campos preenchidos e todas as normas cobertas', () => {
    expect(new Set(BIBLIOTECA_DE_EVIDENCIAS.map((e) => e.codigo)).size).toBe(
      BIBLIOTECA_DE_EVIDENCIAS.length,
    );
    expect(BIBLIOTECA_DE_EVIDENCIAS.length).toBeGreaterThanOrEqual(540);
    for (const e of BIBLIOTECA_DE_EVIDENCIAS) {
      expect(e.titulo.length).toBeGreaterThan(3);
      expect(e.oQuePedir.length).toBeGreaterThan(10);
      expect(e.exemplo.length).toBeGreaterThan(5);
    }
    for (const n of Object.keys(NORMAS))
      expect(BIBLIOTECA_DE_EVIDENCIAS.some((e) => e.norma === n)).toBe(true);
  });

  it('Anexo A da 27001: os 93 controles, cada um no seu tema', () => {
    const anexo = BIBLIOTECA_DE_EVIDENCIAS.filter((e) => e.controle);
    expect(anexo).toHaveLength(93);
    const porTema = Object.fromEntries(
      Object.keys(TEMAS_DO_ANEXO_A).map((t) => [
        t,
        anexo.filter((e) => e.tema === t).length,
      ]),
    );
    expect(porTema).toEqual({
      organizacional: 37,
      pessoas: 8,
      fisico: 14,
      tecnologico: 34,
    });
  });

  it('cláusulas: ordem natural e filtro por capítulo, cláusula e Anexo A', () => {
    expect(
      ['10.2', '4.10', '4.9', 'A.5.10', 'A.5.9', '8.4.1'].sort(
        compararClausulas,
      ),
    ).toEqual(['4.9', '4.10', '8.4.1', '10.2', 'A.5.9', 'A.5.10']);
    expect(casaClausula('8.4.1', '8')).toBe(true);
    expect(casaClausula('8.4.1', '8.4')).toBe(true);
    expect(casaClausula('8.41', '8.4')).toBe(false);
    expect(casaClausula('A.8.13', 'A')).toBe(true);
    expect(casaClausula('8.13', 'A')).toBe(false);
  });
});
