import Image from "next/image";

/** Telas de acesso: a logo, o formulário e o que o sistema cobre. Sem frase de efeito. */
export default function LayoutDeAcesso({ children }: LayoutProps<"/">) {
  return (
    <main
      id="conteudo"
      className="flex flex-1 flex-col items-center px-4 py-12 sm:justify-center"
    >
      <div className="w-full max-w-[22rem]">
        <Image
          className="h-auto w-[200px]"
          src="/brand/logo.svg"
          alt="DaVinci Qualidade e Certificações"
          width={573}
          height={215}
          priority
        />
        <div className="mt-10">{children}</div>
        <p className="mt-12 border-t border-borda pt-4 text-sm text-texto-3">
          Qualidade, saúde, segurança e meio ambiente · ISO 9001, 14001 e 45001
        </p>
      </div>
    </main>
  );
}
