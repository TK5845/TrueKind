"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "../../utils/supabase/client";

type RequireAccountProps = {
  children: ReactNode;
};

export default function RequireAccount({ children }: RequireAccountProps) {
  const [checked, setChecked] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function check() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        setHasSession(Boolean(session));
      } catch {
        if (!mounted) return;
        setHasSession(false);
      } finally {
        if (mounted) setChecked(true);
      }
    }

    void check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setChecked(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!checked) {
    return <>{children}</>;
  }

  if (!hasSession) {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
    return null;
  }

  return <>{children}</>;
}