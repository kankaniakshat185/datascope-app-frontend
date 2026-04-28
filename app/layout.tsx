import type { Metadata } from "next";
import { Geist_Mono, Archivo_Black, Oswald } from "next/font/google";
import "./globals.css";

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-archivo-black",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DataScope",
  description: "Debug your ML datasets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${oswald.variable} ${geistMono.variable} ${archivoBlack.variable} h-full antialiased font-sans`}
    >
      <body className="min-h-full flex flex-col bg-neutral-500 text-white">{children}</body>
    </html>
  );
}
