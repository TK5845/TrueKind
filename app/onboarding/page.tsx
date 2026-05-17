"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import {
  PROFILE_STORAGE_KEY,
  PROFILE_UPDATED_EVENT,
  readStoredProfileUi,
  type ProfileUiFields,
} from "../lib/profile-model";

type AuthState = "unknown" | "signed-in" | "signed-out";

type Step = {
  title: string;
  text: string;
  href: string;
  cta: string;
  done: boolean;
  optional?: boolean;
};

const secondaryLinkStyle = {
  display: "inline-block",
  padding: "13px 16px",
  borderRadius: 14,
  border: "1px solid rgba(208,198,191,0.95)",
  textDecoration: "none",
  color: "#111",
  background: "white",
  fontWeight: 600,
};

function pillStyle(dark = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    width: "fit-content" as const,
    padding: "9px 13px",
    borderRadius: 999,
    border: dark ? "1px solid #111" : "1px solid rgba(231,223,218,0.95)",
    background: dark ? "#111" : "rgba(255,255,255,0.86)",
    color: dark ? "white" : "#3e3733",
    fontSize: 14,
    fontWeight: 700,
  };
}

function hasBasicProfile(profile: ProfileUiFields | null) {
  return Boolean(profile?.name && profile?.city && profile?.bio);
}

function getProfileSummary(profile: ProfileUiFields | null) {
  if (!profile?.name && !profile?.city) return "Ingen profil sparad än.";

  const identity = [profile.name, profile.age].filter(Boolean).join(", ");
  const place = profile.city ? ` · ${profile.city}` : "";
  return `${identity || "Profil påbörjad"}${place}`;
}

export default function OnboardingPage() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [profile, setProfile] = useState<ProfileUiFields | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    function hydrateProfile() {
      if (!mounted) return;
      setProfile(readStoredProfileUi());
    }

    hydrateProfile();

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setAuthState(data.session ? "signed-in" : "signed-out");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session ? "signed-in" : "signed-out");
      hydrateProfile();
    });

    function onProfileUpdated() {
      hydrateProfile();
    }

    function onStorage(event: StorageEvent) {
      if (event.key === PROFILE_STORAGE_KEY) hydrateProfile();
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );
    };
  }, []);

  const steps = useMemo<Step[]>(() => {
    const isSignedIn = authState === "signed-in";
    const profileReady = hasBasicProfile(profile);
    const hasImage = Boolean(profile?.image);
    const hasVoice = Boolean(profile?.voiceUrl);

    return [
      {
        title: "1. Skapa konto eller logga in",
        text: isSignedIn
          ? "Du är inloggad och kan fortsätta bygga din profil."
          : "Börja med ett konto så profil, röst och meddelanden kan kopplas till dig.",
        href: isSignedIn ? "/profile" : "/register",
        cta: isSignedIn ? "Fortsätt till profil" : "Skapa konto",
        done: isSignedIn,
      },
      {
        title: "2. Fyll i profilen",
        text: "Namn, stad, bio och några personliga signaler gör Discover mer levande.",
        href: "/profile",
        cta: profileReady ? "Granska profil" : "Fyll i profil",
        done: profileReady,
      },
      {
        title: "3. Lägg till profilbild",
        text: "Bilden är viktig för igenkänning, men du kan börja utan den.",
        href: "/profile",
        cta: hasImage ? "Hantera bild" : "Lägg till bild",
        done: hasImage,
        optional: true,
      },
      {
        title: "4. Spela in röstprofil",
        text: "Rösten ger mer närvaro och kan sparas till ditt konto.",
        href: "/voice",
        cta: hasVoice ? "Hantera röstprofil" : "Spela in röst",
        done: hasVoice,
        optional: true,
      },
      {
        title: "5. Gå till Discover",
        text: "När profilen känns okej kan du börja utforska matchningar.",
        href: "/discover",
        cta: "Öppna Discover",
        done: profileReady,
      },
      {
        title: "6. Fortsätt till matchningar och samtal",
        text: "När du gillar någon i Discover sparas personen i matchlistan och kan öppnas som samtal.",
        href: "/matches",
        cta: "Se matchlista",
        done: false,
        optional: true,
      },
    ];
  }, [authState, profile]);

  const completedCount = steps.filter((step) => step.done).length;
  const primaryNextStep = steps.find((step) => !step.done && !step.optional);
  const accountText =
    authState === "signed-in"
      ? "Inloggad"
      : authState === "signed-out"
      ? "Inte inloggad"
      : "Kontostatus hämtas";

  return (
    <main style={{ display: "grid", gap: 28 }}>
      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,242,238,0.97))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 22px 46px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 16,
        }}
      >
        <div style={pillStyle(true)}>Onboarding</div>

        <div style={{ display: "grid", gap: 10 }}>
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Kom igång med TrueKind
          </h1>

          <p
            style={{
              color: "#6d625d",
              fontSize: 20,
              lineHeight: 1.8,
              margin: 0,
              maxWidth: 860,
            }}
          >
            Följ en lugn start: konto, profil, bild, röst och sedan vidare till
            Discover, matchningar och samtal.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={pillStyle()}>{accountText}</span>
          <span style={pillStyle()}>{getProfileSummary(profile)}</span>
          <span style={pillStyle()}>
            {completedCount} av {steps.length} steg klara
          </span>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={primaryNextStep?.href ?? "/discover"}
            style={{
              display: "inline-block",
              padding: "15px 20px",
              background: "#111",
              color: "white",
              borderRadius: 14,
              textDecoration: "none",
              fontWeight: 800,
              boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
            }}
          >
            {primaryNextStep?.cta ?? "Öppna Discover"}
          </Link>

          {authState === "signed-in" ? (
            <Link href="/profile" style={secondaryLinkStyle}>
              Till profil
            </Link>
          ) : (
            <Link href="/login" style={secondaryLinkStyle}>
              Logga in
            </Link>
          )}
        </div>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {steps.map((step) => (
          <article
            key={step.title}
            style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 24,
              padding: 20,
              border: step.done
                ? "1px solid rgba(17,17,17,0.16)"
                : "1px solid rgba(231,223,218,0.95)",
              boxShadow: step.done
                ? "0 14px 30px rgba(0,0,0,0.07)"
                : "0 10px 24px rgba(0,0,0,0.04)",
              display: "grid",
              gap: 12,
              alignContent: "space-between",
            }}
          >
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={pillStyle(step.done)}>
                  {step.done ? "Klart" : step.optional ? "Valfritt" : "Nästa"}
                </span>
              </div>

              <h2
                style={{
                  margin: 0,
                  color: "#181513",
                  fontSize: 24,
                  lineHeight: 1.15,
                }}
              >
                {step.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  color: "#5f5752",
                  fontSize: 16,
                  lineHeight: 1.75,
                }}
              >
                {step.text}
              </p>
            </div>

            <Link href={step.href} style={secondaryLinkStyle}>
              {step.cta}
            </Link>
          </article>
        ))}
      </section>

      <section
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
          borderRadius: 30,
          padding: 24,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 18px 38px rgba(0,0,0,0.06)",
          display: "grid",
          gap: 14,
        }}
      >
        <div style={pillStyle(true)}>Efter starten</div>

        <p
          style={{
            margin: 0,
            color: "#5f5752",
            fontSize: 17,
            lineHeight: 1.8,
            maxWidth: 900,
          }}
        >
          Den här starten sparar inget vid sidan av din profil. Den leder dig
          bara vidare till sidorna där profil, bild, röst och samtal redan
          hanteras.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/discover" style={secondaryLinkStyle}>
            Discover
          </Link>
          <Link href="/matches" style={secondaryLinkStyle}>
            Matchlista
          </Link>
          <Link href="/messages" style={secondaryLinkStyle}>
            Meddelanden
          </Link>
        </div>
      </section>
    </main>
  );
}
