"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { loadStoredMatchSource } from "../lib/match-db";

export default function MatchBadge() {
  const [hasSession, setHasSession] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    async function hydrate(sessionUserId?: string | null) {
      let userId = sessionUserId;

      if (typeof userId === "undefined") {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;
        userId = session?.user.id ?? null;
        setHasSession(Boolean(session));
      } else {
        setHasSession(Boolean(userId));
      }

      if (!userId) {
        setCount(0);
        return;
      }

      const matchResult = await loadStoredMatchSource(supabase, userId);

      if (!mounted) return;
      setCount(matchResult.source === "demo" ? 0 : matchResult.matches.length);
    }

    void hydrate();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void hydrate(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (!hasSession) return null;

  return (
    <a
      href="/matches"
      aria-label={`${count} matcher`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        minHeight: 46,
        boxSizing: "border-box",
        borderRadius: 16,
        background: "#111",
        color: "white",
        textDecoration: "none",
        fontSize: 14,
        fontWeight: 700,
      }}
    >
      <span
        style={{
          minWidth: 26,
          height: 26,
          padding: "0 8px",
          borderRadius: 999,
          background: "white",
          color: "#111",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
        }}
      >
        {count}
      </span>
      <span>Matcher</span>
    </a>
  );
}
