import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

/** Chrome for the public site. The OBS overlay deliberately lives outside it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      {/* min-h-0 lets full-height pages (the live dashboard) size to the space
          left by the chrome instead of hardcoding viewport arithmetic. */}
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <Footer />
    </div>
  );
}
