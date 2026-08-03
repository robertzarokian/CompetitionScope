import type { Metadata } from "next";
import { Besley, Karla, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const besley = Besley({
  variable: "--font-besley",
  subsets: ["latin"],
  display: "swap",
});

const karla = Karla({
  variable: "--font-karla",
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CompetitionScope — See Your Competition Clearly",
  description:
    "Point CompetitionScope at your competitors. Get an AI-powered deep dive on your closest rivals — their strategy, their edge, and exactly what to do about it.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${besley.variable} ${karla.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="paper-field" aria-hidden="true" />
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
