import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.siteUrl),
  title: {
    default: `${BRAND.name} — ${BRAND.slogan}`,
    template: `%s · ${BRAND.name}`,
  },
  description:
    "Seguimiento en vivo de béisbol y softbol: marcador, bases, cuenta y relato jugada por jugada.",
  applicationName: BRAND.name,
  icons: { icon: BRAND.logo.src },
  openGraph: {
    title: `${BRAND.name} — ${BRAND.slogan}`,
    description: "Game tracker en tiempo real para béisbol y softbol.",
    siteName: BRAND.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: BRAND.colors.night,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
