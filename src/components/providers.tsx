"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/lib/app-context";
import { AuthProvider } from "@/components/AuthProvider";

// Agrupa todos os providers client-side para o RootLayout.
// Ordem de aninhamento: QueryClientProvider → ThemeProvider → AppProvider → AuthProvider
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" forcedTheme="dark" defaultTheme="dark" enableSystem={false}>
        <AppProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
