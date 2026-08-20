import type { Metadata } from "next";
import { Public_Sans, Fraunces, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const bodyFont = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["opsz"],
});

const monoFont = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Piston — Devis",
  description: "Plateforme de devis pour le réseau de revendeurs ALDER.",
};

// Appliqué avant l'hydratation pour éviter un flash du mauvais thème au
// chargement. Ne fait rien si l'utilisateur n'a jamais choisi explicitement
// (reste sur "système", géré uniquement en CSS via prefers-color-scheme).
const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`${bodyFont.variable} ${displayFont.variable} ${monoFont.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
