"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { APP_STORAGE_EVENT, safeRead } from "./lib/storage";

type AccountData = {
  firstName: string;
  email: string;
};

const ACCOUNT_STORAGE_KEY = "truekindAccount";

export default function Home() {
  const [account, setAccount] = useState<AccountData | null>(null);

  function hydrate() {
    const storedAccount = safeRead<AccountData | null>(ACCOUNT_STORAGE_KEY, null);
    setAccount(storedAccount);
  }

  useEffect(() => {
    let mounted = true;

    function hydrateIfMounted() {
      if (mounted) {
        hydrate();
      }
    }

    Promise.resolve().then(hydrateIfMounted);

    const onFocus = () => hydrateIfMounted();
    const onStorageUpdate = () => hydrateIfMounted();

    window.addEventListener("focus", onFocus);
    window.addEventListener(APP_STORAGE_EVENT, onStorageUpdate);

    return () => {
      mounted = false;
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(APP_STORAGE_EVENT, onStorageUpdate);
    };
  }, []);

  const hasAccount = Boolean(account);
  const displayName = account?.firstName || "";

  return (
    <main style={{ display: "grid", gap: 26 }}>
      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,242,238,0.98))",
          borderRadius: 36,
          padding: "56px 46px",
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 26px 56px rgba(0,0,0,0.07)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(214,189,179,0.14), transparent 30%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            maxWidth: 860,
            display: "grid",
            gap: 22,
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "fit-content",
              background: "#111",
              color: "white",
              padding: "8px 16px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            TrueKind
          </div>

          <h1
            style={{
              fontSize: 76,
              lineHeight: 0.96,
              margin: 0,
              color: "#181513",
              letterSpacing: -1.4,
              maxWidth: 820,
            }}
          >
            En varm plats för kärlek, glädje och mänsklig kontakt
          </h1>

          <p
            style={{
              fontSize: 22,
              color: "#5f5752",
              lineHeight: 1.9,
              margin: 0,
              maxWidth: 760,
            }}
          >
            TrueKind är till för människor som vill känna mer värme, mer positiv
            energi och mindre ensamhet. Här kan kontakt få börja mjukt — som
            kärlek, vänskap eller bara ett meningsfullt samtal.
          </p>

          {hasAccount ? (
            <div
              style={{
                display: "inline-block",
                width: "fit-content",
                padding: "10px 14px",
                borderRadius: 14,
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(231,223,218,0.95)",
                color: "#333",
                fontSize: 15,
              }}
            >
              {displayName
                ? `${displayName} är redo att fortsätta`
                : "Konto sparat"}
            </div>
          ) : null}

          <div
            style={{
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              marginTop: 6,
            }}
          >
            {hasAccount ? (
              <>
                <Link
                  href="/discover"
                  style={{
                    display: "inline-block",
                    padding: "16px 24px",
                    background: "#111",
                    color: "white",
                    borderRadius: 16,
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 12px 24px rgba(17,17,17,0.18)",
                  }}
                >
                  Fortsätt till discover
                </Link>

                <Link
                  href="/profile"
                  style={{
                    display: "inline-block",
                    padding: "16px 24px",
                    background: "white",
                    color: "#111",
                    borderRadius: 16,
                    textDecoration: "none",
                    fontSize: 16,
                    border: "1px solid rgba(208,198,191,0.95)",
                  }}
                >
                  Min profil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  style={{
                    display: "inline-block",
                    padding: "16px 24px",
                    background: "#111",
                    color: "white",
                    borderRadius: 16,
                    textDecoration: "none",
                    fontSize: 16,
                    fontWeight: 700,
                    boxShadow: "0 12px 24px rgba(17,17,17,0.18)",
                  }}
                >
                  Skapa konto
                </Link>

                <Link
                  href="/login"
                  style={{
                    display: "inline-block",
                    padding: "16px 24px",
                    background: "white",
                    color: "#111",
                    borderRadius: 16,
                    textDecoration: "none",
                    fontSize: 16,
                    border: "1px solid rgba(208,198,191,0.95)",
                  }}
                >
                  Logga in
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 22,
        }}
      >
        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,246,243,0.98))",
            borderRadius: 28,
            padding: 28,
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 16px 34px rgba(0,0,0,0.06)",
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              display: "inline-block",
              width: "fit-content",
              fontSize: 13,
              color: "#111",
              background: "#f3ece7",
              padding: "6px 12px",
              borderRadius: 999,
            }}
          >
            Vad TrueKind är
          </div>

          <div
            style={{
              fontSize: 30,
              lineHeight: 1.15,
              fontWeight: 800,
              color: "#181513",
            }}
          >
            En app med värme, livsglädje och mänsklig ton
          </div>

          <div
            style={{
              color: "#5f5752",
              fontSize: 16,
              lineHeight: 1.85,
            }}
          >
            TrueKind ska inte kännas som ännu ett socialt flöde. Här är fokus på
            kontakt, närvaro och människor som faktiskt vill mötas på riktigt.
          </div>
        </div>

        <div
          style={{
            background:
              "linear-gradient(180deg, rgba(17,17,17,0.98), rgba(34,31,29,0.98))",
            borderRadius: 28,
            padding: 28,
            color: "white",
            boxShadow: "0 20px 38px rgba(17,17,17,0.18)",
            display: "grid",
            gap: 12,
          }}
        >
          <div
            style={{
              fontSize: 13,
              opacity: 0.8,
            }}
          >
            Vad du kan hitta här
          </div>

          <div
            style={{
              fontSize: 30,
              lineHeight: 1.15,
              fontWeight: 800,
            }}
          >
            Kärlek, vänskap eller bara ett fint möte
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: 16,
              lineHeight: 1.85,
            }}
          >
            Du ska kunna söka partner, gemenskap eller sällskap till något
            enkelt och mänskligt — utan att upplevelsen blir rörig.
          </div>
        </div>
      </section>
    </main>
  );
}
