import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AbreYa | Encuentra un cerrajero cerca de ti",
  description:
    "Encuentra cerrajeros disponibles cerca de ti y contacta directamente con el profesional que necesitas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}