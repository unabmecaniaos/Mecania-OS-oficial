import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "https://mecaniaos.cl"),
  title: {
    default: "MecaniaOS | Gestión para talleres y aseguradoras",
    template: "%s | MecaniaOS",
  },
  description:
    "MecaniaOS centraliza la operación de talleres mecánicos y liquidadores: órdenes, inventario, aseguradoras, finanzas y equipos en un solo lugar.",
  keywords: [
    "software para talleres mecánicos",
    "gestión de talleres",
    "liquidadores de seguros",
    "inventario automotriz",
    "órdenes de trabajo",
    "MecaniaOS",
  ],
  authors: [{ name: "MecaniaOS" }],
  creator: "MecaniaOS",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "MecaniaOS | Tu taller, bajo control",
    description:
      "Una plataforma para conectar talleres, aseguradoras, finanzas e inventario.",
    type: "website",
    locale: "es_CL",
    siteName: "MecaniaOS",
  },
  twitter: {
    card: "summary_large_image",
    title: "MecaniaOS | Tu taller, bajo control",
    description:
      "Gestión moderna para talleres mecánicos y liquidadores de aseguradoras.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${manrope.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
