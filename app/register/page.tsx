"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatAuthError } from "../lib/auth-error";
import { createClient } from "../../utils/supabase/client";
import { getSupabaseConfigIssue } from "../../utils/supabase/env";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const configIssue = getSupabaseConfigIssue();

    if (configIssue) {
      setStatus(configIssue);
      setHasSession(false);
      setIsCheckingSession(false);
      return () => {
        mounted = false;
      };
    }

    const supabase = createClient();

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

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedName = firstName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      setStatus("Fyll i ditt namn.");
      return;
    }

    if (!trimmedEmail) {
      setStatus("Fyll i din e-post.");
      return;
    }

    if (password.length < 6) {
      setStatus("Lösenordet behöver vara minst 6 tecken.");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("Lösenorden matchar inte.");
      return;
    }

    setIsSubmitting(true);
    setStatus("");

    try {
      const configIssue = getSupabaseConfigIssue();

      if (configIssue) {
        setStatus(configIssue);
        return;
      }

      const supabase = createClient();

      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/login`
          : undefined;

      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: trimmedName,
          },
        },
      });

      if (error) {
        console.error("Register failed", error);
        setStatus(formatAuthError(error, "Kontot kunde inte skapas just nu."));
        return;
      }

      setStatus(
        "Kontot är skapat. Bekräfta din e-post innan du loggar in."
      );
      setFirstName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Register failed", error);
      setStatus(formatAuthError(error, "Kontot kunde inte skapas just nu."));
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
            Du har redan ett aktivt konto
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
            Fortsätt till Discover eller din profil i stället för att skapa ett nytt konto.
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
          Ny här?
        </div>

        <h1
          style={{
            fontSize: 54,
            lineHeight: 1.02,
            margin: 0,
            color: "#181513",
          }}
        >
          Skapa konto
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
          Skapa ditt TrueKind-konto och bekräfta din e-post.
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

        <form onSubmit={handleRegister} style={{ display: "grid", gap: 14 }}>
          <input
            type="text"
            placeholder="Förnamn"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(208,198,191,0.95)",
              fontSize: 17,
              background: "rgba(255,255,255,0.92)",
            }}
          />

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

          <input
            type="password"
            placeholder="Bekräfta lösenord"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isSubmitting ? "Skapar konto..." : "Skapa konto"}
            </button>

            <Link
              href="/login"
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
              Till inloggning
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
