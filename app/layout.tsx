import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import "./globals.css";

// One family, two widths: expanded for headings, normal for body text.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Igapó | Guia da estadia",
  description:
    "Guias de estadia para imóveis de temporada na Amazônia, com guia da região e assistente gerados por IA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <div className="flex-1">{children}</div>
        <footer className="bg-rio text-rio-foreground/70">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Igapó é uma marca fictícia. Os imóveis, anfitriões e telefones
              não existem.
            </p>
            <a
              href="https://github.com/hassanrodrigues/ai-guest-guide"
              className="text-rio-foreground underline underline-offset-4 hover:text-white"
            >
              Código no GitHub
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
