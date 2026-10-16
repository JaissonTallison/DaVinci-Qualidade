import type {
  IndicadoresSst,
  ModuloDoPainel,
  NcsDoMes,
  PainelDeVencimentos,
} from "@davinci/types";

/** Cor fixa de cada módulo nos gráficos (a cor segue o módulo, nunca a posição). */
export const COR_DO_MODULO: Record<ModuloDoPainel, string> = {
  qualidade: "var(--color-serie-1)",
  seguranca: "var(--color-serie-2)",
  funcionarios: "var(--color-serie-3)",
  sgi: "var(--color-serie-4)",
  servicos: "var(--color-serie-5)",
  ambiental: "var(--color-serie-6)",
  esg: "var(--color-serie-7)",
};

export interface ComponenteDaSaude {
  rotulo: string;
  /** 0 a 100. */
  valor: number;
  explicacao: string;
  href: string;
}

export interface Indicador {
  rotulo: string;
  valor: number | null;
  /** Texto curto embaixo do número, explicando. */
  explicacao: string;
  href: string;
  /** Número que pede ação quando maior que zero. */
  ruim?: boolean;
  sufixo?: string;
}

export interface Atencao {
  modulo: ModuloDoPainel;
  titulo: string;
  detalhe: string;
  href: string;
  vencido: boolean;
}

export interface Aba {
  chave: "geral" | "qualidade" | "seguranca" | "sgi" | "servicos";
  rotulo: string;
}

export interface DadosDoInicio {
  saudacao: string;
  data: string;
  empresa: string;
  atalhos: { rotulo: string; href: string }[];
  saude: { valor: number | null; componentes: ComponenteDaSaude[] };
  abas: Aba[];
  painel: PainelDeVencimentos | null;
  acoes: Atencao[];
  indicadores: Partial<Record<Aba["chave"], Indicador[]>>;
  ncsPorMes: NcsDoMes[] | null;
  sst: IndicadoresSst | null;
}
