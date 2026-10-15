"use client";

import { useEffect } from "react";

/**
 * Responsivo (decisão Q15): copia o nome de cada coluna (o <th> do cabeçalho) para as células (data-rotulo), para que no
 * celular a tabela vire cartões com "rótulo  valor" (CSS em globals.css). Marca a primeira coluna com texto como
 * título do cartão. Acompanha as tabelas que aparecem ou mudam depois (filtros, paginação, linhas novas).
 * Só mexe em tabela que o React já hidratou (senão os atributos novos não batem com o HTML do servidor e o React
 * acusa erro de hidratação); as que ainda chegam pelo streaming são tentadas de novo logo depois.
 */
const hidratada = (el: Element) =>
  Object.keys(el).some((k) => k.startsWith("__reactFiber$"));

export function RotulosDasTabelas() {
  useEffect(() => {
    const raiz = document.getElementById("conteudo");
    if (!raiz) return;
    let espera = 0;
    let tentativas = 0;
    const rotular = () => {
      let pendentes = false;
      for (const tabela of raiz.querySelectorAll<HTMLTableElement>(
        "table:not([data-tabela='fixa'], .sr-only)",
      )) {
        if (!hidratada(tabela)) {
          pendentes = true;
          continue;
        }
        const cabecalho = tabela.tHead?.rows[tabela.tHead.rows.length - 1];
        if (!cabecalho) continue;
        const nomes: string[] = [];
        for (const th of cabecalho.cells) {
          // Coluna só com caixa de seleção ou sem texto: sem rótulo
          const nome = th.querySelector("input")
            ? ""
            : (th.textContent ?? "").replace(/\s+/g, " ").trim();
          for (let i = 0; i < th.colSpan; i++) nomes.push(nome);
        }
        const titulo = nomes.findIndex((n) => n);
        for (const corpo of [
          ...tabela.tBodies,
          ...(tabela.tFoot ? [tabela.tFoot] : []),
        ]) {
          for (const linha of corpo.rows) {
            let col = 0;
            for (const celula of linha.cells) {
              const nome = celula.colSpan > 1 ? "" : (nomes[col] ?? "");
              if (celula.dataset.rotulo !== nome) celula.dataset.rotulo = nome;
              const ehTitulo =
                col === titulo &&
                celula.colSpan === 1 &&
                corpo !== tabela.tFoot;
              if (ehTitulo && !("titulo" in celula.dataset))
                celula.dataset.titulo = "";
              else if (!ehTitulo && "titulo" in celula.dataset)
                delete celula.dataset.titulo;
              col += celula.colSpan;
            }
          }
        }
      }
      clearTimeout(espera);
      if (pendentes && tentativas++ < 60)
        espera = window.setTimeout(rotular, 250);
    };
    rotular();
    let quadro = 0;
    const observador = new MutationObserver(() => {
      cancelAnimationFrame(quadro);
      tentativas = 0;
      quadro = requestAnimationFrame(rotular);
    });
    observador.observe(raiz, { childList: true, subtree: true });
    return () => {
      observador.disconnect();
      cancelAnimationFrame(quadro);
      clearTimeout(espera);
    };
  }, []);
  return null;
}
