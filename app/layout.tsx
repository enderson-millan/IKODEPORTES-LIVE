import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "MataMata.live",
  description: "Copa 2026 Pick'em — acompanhe e palpite no mata-mata da Copa do Mundo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col">
        <Providers>
          <div className="flex flex-1 flex-col">
            {children}
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
