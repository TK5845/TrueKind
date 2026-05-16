"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

export default function AuthButtons() {
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function hydrate() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;
      setHasSession(Boolean(session));
      setIsLoading(false);
    }

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || hasSession) return null;

  return (
    <>
      <a
        href="/login"
        style={{
          display: "inline-block",
          padding: "10px 16px",
          minHeight: 46,
          boxSizing: "border-box",
          borderRadius: 16,
          border: "1px solid rgba(208,198,191,0.95)",
          background: "white",
          color: "#111",
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        Logga in
      </a>

      <a
        href="/register"
        style={{
          display: "inline-block",
          padding: "10px 16px",
          minHeight: 46,
          boxSizing: "border-box",
          borderRadius: 16,
          border: "1px solid #111",
          background: "#111",
          color: "white",
          textDecoration: "none",
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        Skapa konto
      </a>
    </>
  );
}
