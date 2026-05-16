"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("logged_out") === "1") {
        setStatus("Du är utloggad.");
      }
    }

    async function checkSession() {
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
        if (mounted) setIsCheckingSession(false);
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setHasSession(Boolean(session));
      setIsCheckingSession(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setStatus("E-post eller lösenord stämmer inte.");
        return;
      }

      setStatus("Du är inloggad. Vi öppnar Discover...");
      window.location.href = "/discover";
    } catch {
      setStatus("Det gick inte att logga in just nu.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasSession) {
    return (
      <main style={{ display: "grid", gap: 28 }}>
        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(248,242,238,0.97))",
            borderRadius: 34,
            padding: 30,
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 22px 46px rgba(0,0,0,0.07)",
            display: "grid",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "fit-content",
              background: "#111",
              color: "white",
              padding: "7px 14px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            Redan inloggad
          </div>

          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Du är redan inne i TrueKind
          </h1>

          <p
            style={{
              color: "#6d625d",
              fontSize: 20,
              lineHeight: 1.8,
              margin: 0,
              maxWidth: 900,
            }}
          >
            Fortsätt till Discover, din profil eller dina meddelanden.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/discover"
              style={{
                display: "inline-block",
                padding: "15px 20px",
                background: "#111",
                color: "white",
                borderRadius: 14,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              Till discover
            </Link>

            <Link
              href="/profile"
              style={{
                display: "inline-block",
                padding: "15px 20px",
                borderRadius: 14,
                border: "1px solid rgba(208,198,191,0.95)",
                textDecoration: "none",
                color: "#111",
                background: "white",
              }}
            >
              Till profil
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: 28 }}>
      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.97), rgba(248,242,238,0.97))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 22px 46px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 16,
        }}
      >
        <div
          style={{
            display: "inline-block",
            width: "fit-content",
            background: "#111",
            color: "white",
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Välkommen tillbaka
        </div>

        <h1
          style={{
            fontSize: 54,
            lineHeight: 1.02,
            margin: 0,
            color: "#181513",
          }}
        >
          Logga in
        </h1>

        <p
          style={{
            color: "#6d625d",
            fontSize: 20,
            lineHeight: 1.8,
            margin: 0,
            maxWidth: 900,
          }}
        >
          Logga in med ditt TrueKind-konto.
        </p>
      </section>

      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(249,244,240,0.98))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 18,
          maxWidth: 760,
        }}
      >
        {isCheckingSession ? (
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(231,223,218,0.95)",
              color: "#333",
              boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
            }}
          >
            Kontrollerar om du redan är inloggad...
          </div>
        ) : status ? (
          <div
            style={{
              background: "rgba(255,255,255,0.85)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(231,223,218,0.95)",
              color: "#333",
              boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
            }}
          >
            {status}
          </div>
        ) : null}

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(208,198,191,0.95)",
              fontSize: 17,
              background: "rgba(255,255,255,0.92)",
            }}
          />

          <input
            type="password"
            placeholder="Lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(208,198,191,0.95)",
              fontSize: 17,
              background: "rgba(255,255,255,0.92)",
            }}
          />

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "15px 20px",
                background: "#111",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                cursor: isSubmitting ? "default" : "pointer",
                fontWeight: 700,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Loggar in..." : "Logga in"}
            </button>

            <Link
              href="/register"
              style={{
                display: "inline-block",
                padding: "15px 20px",
                borderRadius: 14,
                border: "1px solid rgba(208,198,191,0.95)",
                textDecoration: "none",
                color: "#111",
                background: "white",
              }}
            >
              Skapa konto
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
