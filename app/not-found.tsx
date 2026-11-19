import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-xl flex-col justify-center px-5 py-16">
      <Link href="/" className="text-lg font-semibold font-stretch-expanded">
        Igapó
      </Link>
      <h1 className="mt-10 text-4xl font-semibold tracking-tight font-stretch-expanded">
        Imóvel não encontrado
      </h1>
      <p className="mt-4 leading-relaxed text-muted-foreground">
        Nenhum imóvel usa esse código. Confira o link que você recebeu: o código
        tem letras e números, como{" "}
        <span className="font-medium text-foreground">MAO001</span>.
      </p>
      <Button asChild className="mt-8 self-start">
        <Link href="/">Ver todos os imóveis</Link>
      </Button>
    </main>
  );
}
