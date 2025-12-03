// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amigo Oculto",
  description: "Amigo oculto da família da Família Berger 😄",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-neutral-900 text-neutral-100 antialiased">
        <div className="min-h-screen flex items-center justify-center">
          {/* wrapper mobile-first */}
          <div className="w-full max-w-sm px-4 py-8">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
