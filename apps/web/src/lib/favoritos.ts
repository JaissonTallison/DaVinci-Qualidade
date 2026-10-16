"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Favoritos do menu (mesmo padrão da Finance): por usuário, neste navegador. A estrela da barra superior marca e
 * o menu lateral ouve o evento para atualizar na hora.
 */
const EVENTO = "davinci-favoritos";
const chave = (usuarioId: string) => `davinci.favoritos.${usuarioId}`;

function bruto(usuarioId: string | undefined): string {
  if (!usuarioId) return "[]";
  try {
    return localStorage.getItem(chave(usuarioId)) ?? "[]";
  } catch {
    return "[]";
  }
}

function interpretar(texto: string): string[] {
  try {
    const v: unknown = JSON.parse(texto);
    return Array.isArray(v)
      ? v.filter((x): x is string => typeof x === "string").slice(0, 20)
      : [];
  } catch {
    return [];
  }
}

export function lerFavoritos(usuarioId: string | undefined): string[] {
  return interpretar(bruto(usuarioId));
}

export function alternarFavorito(usuarioId: string, href: string) {
  const atuais = lerFavoritos(usuarioId);
  const novos = atuais.includes(href)
    ? atuais.filter((h) => h !== href)
    : [...atuais, href].slice(-20);
  try {
    localStorage.setItem(chave(usuarioId), JSON.stringify(novos));
  } catch {
    /* navegador sem armazenamento: vale só nesta tela */
  }
  window.dispatchEvent(new CustomEvent(EVENTO));
}

function assinar(aviso: () => void) {
  window.addEventListener(EVENTO, aviso);
  window.addEventListener("storage", aviso);
  return () => {
    window.removeEventListener(EVENTO, aviso);
    window.removeEventListener("storage", aviso);
  };
}

export function useFavoritos(usuarioId: string | undefined): string[] {
  const texto = useSyncExternalStore(
    assinar,
    () => bruto(usuarioId),
    () => "[]",
  );
  return useMemo(() => interpretar(texto), [texto]);
}
