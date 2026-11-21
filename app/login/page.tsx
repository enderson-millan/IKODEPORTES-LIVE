import type { Metadata } from "next";
import { LoginPage } from "@/components/LoginPage";

export const metadata: Metadata = {
  title: "Login — MataMata.live",
};

export default function LoginRoute() {
  return <LoginPage />;
}
