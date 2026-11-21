"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";

/**
 * Sincroniza o usuário autenticado do Supabase com o AppContext.
 * Deve ser renderizado dentro do AppProvider.
 * Escuta onAuthStateChange para manter o estado sempre atualizado.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useApp();

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    // Carrega o usuário atual na montagem
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email ?? "",
          email: user.email ?? "",
          avatarUrl: user.user_metadata?.avatar_url ?? undefined,
        });
      } else {
        setUser(null);
      }
    });

    // Escuta mudanças de auth (login, logout, refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      if (user) {
        setUser({
          id: user.id,
          name: user.user_metadata?.full_name ?? user.email ?? "",
          email: user.email ?? "",
          avatarUrl: user.user_metadata?.avatar_url ?? undefined,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser]);

  return <>{children}</>;
}
