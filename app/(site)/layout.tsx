import { AppHeader } from "@/components/AppHeader";
import { Footer } from "@/components/Footer";

/** Chrome for the public site. The OBS overlay deliberately lives outside it. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
