"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";

const AUTH_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Sincroniza el usuario autenticado de Supabase con el AppContext.
 * Debe renderizarse dentro del AppProvider.
 *
 * La autenticación es opcional: sin `NEXT_PUBLIC_SUPABASE_*` el provider no
 * inicializa el cliente (crear el cliente sin configuración lanza y tumba
 * cualquier página, incluido el overlay).
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useApp();

  useEffect(() => {
    if (!AUTH_CONFIGURED) {
      setUser(null);
      return;
    }

    const supabase = getSupabaseBrowserClient();

    // Carga el usuario actual en la montura
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

    // Escucha cambios de auth (login, logout, refresh)
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
