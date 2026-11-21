import type { Metadata } from "next";
import { AdminLiveView } from "./_components/AdminLiveView";

export const metadata: Metadata = {
  title: "Admin — Ao Vivo | MataMata.live",
  robots: { index: false, follow: false },
};

export default function AdminLivePage() {
  return <AdminLiveView />;
}
