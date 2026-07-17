import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PANTAS — Setiap Panen Pantas Dihargai",
  description:
    "Grading panen dengan AI, harga wajar, dan pembeli industri terdekat.",
};

export const viewport: Viewport = {
  themeColor: "#40916c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${inter.variable} ${jetbrains.variable} h-full`}>
      <body className="min-h-full font-sans antialiased">
        {/* Desktop gets a neutral backdrop; the app itself stays a 430px frame. */}
        <StoreProvider>
          <div className="min-h-dvh bg-neutral-200/60">
            <div className="app-frame flex min-h-dvh flex-col shadow-[0_0_60px_rgba(0,0,0,0.06)]">
              {children}
            </div>
          </div>
        </StoreProvider>
      </body>
    </html>
  );
}
