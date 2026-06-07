"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../utils/supabase/client";
import { getCurrentUserProfile } from "../lib/profile-db";
import {
  PROFILE_STORAGE_KEY,
  PROFILE_UPDATED_EVENT,
  type ProfileUiFields,
  normalizeProfile,
  profileToUiFields,
  readStoredProfileUi,
  writeStoredProfile,
} from "../lib/profile-model";
import {
  type ConversationView,
} from "../lib/message-model";
import {
  getDefaultConversationViews,
  loadConversationSource,
} from "../lib/message-preview-model";
import {
  DEMO_MATCHES,
  buildDiscoverCardContext,
  buildMatchInsights,
  buildDiscoverCandidateViews,
  type CanonicalMatch,
} from "../lib/match-model";
import {
  MATCH_STATE_UPDATED_EVENT,
  loadStoredMatchSource,
  readStoredLikedMatchIds,
  saveLikedMatch,
  updateLikedMatchStatus,
} from "../lib/match-db";
import {
  type CandidateSource,
  loadStoredDiscoverCandidates,
} from "../lib/discover-candidate-db";

type LocalProfile = ProfileUiFields;

type DbProfile = {
  name?: string | null;
  first_name?: string | null;
  age?: string | null;
  city?: string | null;
  looking_for?: string | null;
  interests?: unknown;
  bio?: string | null;
  prompt?: string | null;
  image_url?: string | null;
  contact_intent?: string | null;
  activity_interest?: string | null;
  favorite_song?: string | null;
  favorite_film?: string | null;
  favorite_book?: string | null;
  video_url?: string | null;
};

type DbUser = {
  user_metadata?: {
    first_name?: unknown;
  };
};

type AuthState = "unknown" | "signed-in" | "signed-out";
type DiscoverSource = CandidateSource | "pending";

const emptyProfile: LocalProfile = {
  interests: [],
};

function readLocalProfile(): LocalProfile | null {
  return readStoredProfileUi();
}

function saveLocalProfile(profile: LocalProfile) {
  writeStoredProfile(profile);
}

function safeList(value?: string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function isPlayableVideoReference(value?: string) {
  return Boolean(value && /^(https?:|blob:)/i.test(value.trim()));
}

function hasProfileContent(profile: LocalProfile | null) {
  if (!profile) return false;
  return Boolean(
    profile.name ||
      profile.age ||
      profile.city ||
      profile.bio ||
      profile.prompt ||
      profile.image ||
      profile.lookingFor ||
      profile.contactIntent ||
      profile.activityInterest ||
      profile.favoriteSong ||
      profile.favoriteFilm ||
      profile.favoriteBook ||
      profile.videoPresentation ||
      safeList(profile.interests).length
  );
}

function mapDbProfileToLocalProfile(input: {
  profile: DbProfile | null;
  user: DbUser | null;
}): LocalProfile {
  return profileToUiFields(normalizeProfile(input.profile, input.user));
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

function pillStyle(dark = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content" as const,
    padding: "10px 14px",
    borderRadius: 999,
    border: dark ? "1px solid #111" : "1px solid rgba(231,223,218,0.95)",
    background: dark ? "#111" : "rgba(255,255,255,0.86)",
    color: dark ? "white" : "#3e3733",
    fontSize: 14,
    fontWeight: 600,
  };
}

function actionLinkStyle(dark = false) {
  return {
    display: "inline-block",
    width: "fit-content" as const,
    padding: "12px 14px",
    background: dark ? "#111" : "white",
    color: dark ? "white" : "#111",
    borderRadius: 12,
    border: dark ? "1px solid #111" : "1px solid rgba(208,198,191,0.95)",
    textDecoration: "none",
    fontWeight: 700,
  };
}

function emptyStateStyle() {
  return {
    background: "rgba(255,255,255,0.84)",
    borderRadius: 24,
    padding: 20,
    border: "1px solid rgba(231,223,218,0.95)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    display: "grid",
    gap: 12,
  };
}

function imagePlaceholderStyle() {
  return {
    width: "100%",
    height: "100%",
    display: "grid",
    placeItems: "center",
    padding: 20,
    textAlign: "center" as const,
    color: "#6d625d",
    fontSize: 15,
    lineHeight: 1.6,
  };
}

function hasDiscoverReadyProfile(profile: LocalProfile) {
  return Boolean(
    profile.name &&
      profile.city &&
      (profile.bio || profile.lookingFor || safeList(profile.interests).length)
  );
}

export default function DiscoverPage() {
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [profile, setProfile] = useState<LocalProfile>(emptyProfile);
  const [conversationViews, setConversationViews] = useState<
    ConversationView[]
  >(() => getDefaultConversationViews([]));
  const [candidateSource, setCandidateSource] =
    useState<DiscoverSource>("pending");
  const [candidateMatches, setCandidateMatches] = useState<CanonicalMatch[]>([]);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [likedMatchIds, setLikedMatchIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);
  const [lastLikedMatchId, setLastLikedMatchId] = useState<string | null>(null);
  const [likeStatus, setLikeStatus] = useState("");

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function hydrateFromSupabase() {
      await Promise.resolve();

      const localProfile = readLocalProfile();
      if (!mounted) return;

      if (localProfile) {
        setProfile(localProfile);
      }

      const sessionResult = await withTimeout(supabase.auth.getSession(), 2000);
      if (!mounted) return;

      const session = sessionResult?.data.session ?? null;
      setAuthState(session ? "signed-in" : "signed-out");
      setActiveUserId(session?.user.id ?? null);

      if (session) {
        setLikedMatchIds(readStoredLikedMatchIds(session.user.id));

        const candidateResult = await withTimeout(
          loadStoredDiscoverCandidates(supabase, session.user.id),
          2500
        );
        const hasBackendCandidateSource =
          candidateResult?.source === "backend";
        const hasDemoCandidateFallback = candidateResult?.source === "demo";
        const nextCandidateMatches = hasBackendCandidateSource
          ? candidateResult.candidates
          : hasDemoCandidateFallback
            ? DEMO_MATCHES
            : [];
        const messageResult = await withTimeout(
          loadConversationSource(supabase, session.user.id, nextCandidateMatches),
          2500
        );
        const matchResult = await withTimeout(
          loadStoredMatchSource(supabase, session.user.id),
          2500
        );

        if (!mounted) return;

        if (messageResult) {
          setConversationViews(messageResult.conversations);
        }

        setCandidateMatches(nextCandidateMatches);
        setCandidateSource(
          hasBackendCandidateSource
            ? "backend"
            : hasDemoCandidateFallback
              ? "demo"
              : "pending"
        );
        setLikedMatchIds(
          new Set([
            ...readStoredLikedMatchIds(session.user.id),
            ...((matchResult?.matches ?? []).map((match) => match.match_id)),
          ])
        );
      }

      if (!session || hasProfileContent(localProfile)) return;

      const result = await withTimeout(getCurrentUserProfile(), 2500);
      if (!mounted || !result || !(result.profile || result.user)) return;

      const mapped = mapDbProfileToLocalProfile({
        profile: result.profile,
        user: result.user,
      });

      setProfile(mapped);
      saveLocalProfile(mapped);
    }

    void hydrateFromSupabase();

    function onStorage(event: StorageEvent) {
      if (event.key !== PROFILE_STORAGE_KEY || !mounted) return;
      setProfile(readLocalProfile() ?? emptyProfile);
    }

    function onProfileUpdated() {
      if (!mounted) return;
      setProfile(readLocalProfile() ?? emptyProfile);
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setAuthState(session ? "signed-in" : "signed-out");
      setActiveUserId(session?.user.id ?? null);
      if (!session) {
        setProfile(emptyProfile);
        setCandidateMatches([]);
        setCandidateSource("pending");
        setLikedMatchIds(new Set());
        setLastLikedMatchId(null);
        setLikeStatus("");
      }
    });

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );
      subscription.unsubscribe();
    };
  }, []);

  async function handleLike(candidate: CanonicalMatch) {
    if (pendingLikeId) return;

    if (!activeUserId) {
      setLikeStatus("Logga in för att gilla en profil.");
      return;
    }

    if (likedMatchIds.has(candidate.match_id)) {
      setPendingLikeId(candidate.match_id);
      setLikeStatus("");

      try {
        const supabase = createClient();
        const result = await updateLikedMatchStatus(
          supabase,
          activeUserId,
          candidate,
          "hidden"
        );

        if (!result.ok) {
          setLikeStatus("Kunde inte ändra gillningen just nu.");
          return;
        }

        setLikedMatchIds((current) => {
          const next = new Set(current);
          next.delete(candidate.match_id);
          return next;
        });
        setLastLikedMatchId(null);
        setLikeStatus(`${candidate.name} är borttagen från matchlistan.`);
        window.dispatchEvent(new Event(MATCH_STATE_UPDATED_EVENT));
      } catch {
        setLikeStatus("Kunde inte ändra gillningen just nu.");
      } finally {
        setPendingLikeId(null);
      }
      return;
    }

    setPendingLikeId(candidate.match_id);
    setLikeStatus("");

    try {
      const supabase = createClient();
      const result = await saveLikedMatch(supabase, activeUserId, candidate);

      if (!result.ok) {
        setLikeStatus("Kunde inte spara gillningen just nu.");
        return;
      }

      setLikedMatchIds((current) => {
        const next = new Set(current);
        next.add(candidate.match_id);
        return next;
      });
      setLastLikedMatchId(candidate.match_id);
      setLikeStatus(`${candidate.name} är sparad i matchlistan.`);
      window.dispatchEvent(new Event(MATCH_STATE_UPDATED_EVENT));
    } catch {
      setLikeStatus("Kunde inte spara gillningen just nu.");
    } finally {
      setPendingLikeId(null);
    }
  }

  if (authState === "signed-out") {
    return (
      <main className="tk-page-main" style={{ display: "grid", gap: 28 }}>
        <section
          className="tk-hero-card"
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
          <div style={pillStyle(true)}>Discover</div>

          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Logga in för att se profiler
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
            Du är utloggad. Logga in igen för att se din discover-vy.
          </p>

          <div className="tk-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              href="/login"
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
              Logga in
            </Link>

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
        </section>
      </main>
    );
  }

  const interests = safeList(profile.interests);
  const discoverCandidates = buildDiscoverCandidateViews(
    profile,
    conversationViews,
    candidateMatches,
    candidateSource === "backend" ? "backend" : "demo"
  );
  const lastLikedMatch = lastLikedMatchId
    ? discoverCandidates.find((candidate) => candidate.match_id === lastLikedMatchId)
    : null;
  const lastLikedInsight = lastLikedMatch
    ? buildMatchInsights(lastLikedMatch)[0] ?? null
    : null;
  const profileReady = hasDiscoverReadyProfile(profile);

  return (
    <main className="tk-page-main" style={{ display: "grid", gap: 28 }}>
      <section
        className="tk-hero-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,242,238,0.97))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 22px 46px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 18,
        }}
      >
        <div style={pillStyle(true)}>Din profil just nu</div>

        <div style={{ display: "grid", gap: 10 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 54,
              lineHeight: 1.02,
              color: "#181513",
            }}
          >
            {profile.name || "Ditt namn"}
            {profile.age ? `, ${profile.age}` : ""}
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6d625d",
              fontSize: 20,
              lineHeight: 1.7,
              maxWidth: 760,
            }}
          >
            {profile.bio ||
              "Din profil blir mer levande här när du fyller i bio, intressen och det du söker."}
          </p>
        </div>

        <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {profile.city ? <span style={pillStyle()}>📍 {profile.city}</span> : null}
          {profile.contactIntent ? (
            <span style={pillStyle()}>💌 {profile.contactIntent}</span>
          ) : null}
          {profile.activityInterest ? (
            <span style={pillStyle()}>✨ {profile.activityInterest}</span>
          ) : null}
          {profile.lookingFor ? (
            <span style={pillStyle()}>💫 {profile.lookingFor}</span>
          ) : null}
        </div>

        {!profileReady ? (
          <div style={emptyStateStyle()}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#6d625d",
              }}
            >
              Profilen behöver lite mer innan Discover känns rätt
            </div>
            <p
              style={{
                margin: 0,
                color: "#5f5752",
                fontSize: 16,
                lineHeight: 1.7,
                maxWidth: 760,
              }}
            >
              Lägg gärna till namn, stad, bio och några intressen. Du kan titta
              runt redan nu, men förslagen blir tydligare när profilen speglar
              dig lite mer.
            </p>
            <Link href="/profile" style={actionLinkStyle(true)}>
              Fyll i profil
            </Link>
          </div>
        ) : null}
      </section>

      <section
        className="tk-panel-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 22px 46px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 18,
        }}
      >
        <div style={pillStyle(true)}>Discover</div>

        <div style={{ display: "grid", gap: 8 }}>
          <h2
            style={{
              margin: 0,
              fontSize: 38,
              lineHeight: 1.08,
              color: "#181513",
            }}
          >
            Förslag att utforska
          </h2>

          <p
            style={{
              margin: 0,
              color: "#6d625d",
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 760,
            }}
          >
            Några profiler som kan passa din ton just nu.
          </p>
        </div>

        {likeStatus ? (
          <div
            style={{
              ...emptyStateStyle(),
              padding: 16,
              borderRadius: 18,
              color: "#3e3733",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            <div>{likeStatus}</div>
            {lastLikedMatchId ? (
              <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link
                  href={`/matches?match=${lastLikedMatchId}`}
                  style={actionLinkStyle(true)}
                >
                  Visa i matchlistan
                </Link>
                <Link
                  href={`/messages?match=${lastLikedMatchId}`}
                  style={actionLinkStyle()}
                >
                  Öppna samtal
                </Link>
              </div>
            ) : null}
            {lastLikedInsight ? (
              <div
                style={{
                  background: "rgba(248,245,242,0.86)",
                  borderRadius: 16,
                  border: "1px solid rgba(231,223,218,0.95)",
                  padding: 14,
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ color: "#6d625d", fontSize: 13, fontWeight: 700 }}>
                  {lastLikedInsight.label}
                </div>
                <div style={{ color: "#2f2a27", fontSize: 15, lineHeight: 1.6 }}>
                  {lastLikedInsight.text}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 16,
          }}
        >
          {discoverCandidates.length ? (
            discoverCandidates.map((candidate) => {
              const isLiked = likedMatchIds.has(candidate.match_id);
              const cardContext = buildDiscoverCardContext(profile, candidate);

              return (
            <article
              key={candidate.match_id}
              style={{
                background: "rgba(255,255,255,0.86)",
                borderRadius: 24,
                border: "1px solid rgba(231,223,218,0.95)",
                boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
                overflow: "hidden",
                display: "grid",
              }}
            >
              <div
                style={{
                  aspectRatio: "4 / 3",
                  background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
                  overflow: "hidden",
                }}
              >
                {candidate.image ? (
                  <img
                    src={candidate.image}
                    alt={candidate.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={imagePlaceholderStyle()}>
                    Ingen profilbild ännu
                  </div>
                )}
              </div>

              <div style={{ padding: 18, display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 24,
                      lineHeight: 1.12,
                      color: "#181513",
                    }}
                  >
                    {candidate.name}, {candidate.age}
                  </h3>

                  <div style={{ color: "#7b706a", fontSize: 14 }}>
                    {candidate.city}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={pillStyle()}>{candidate.relevance_label}</span>
                  <span style={pillStyle()}>{candidate.chemistry_label}</span>
                </div>

                <div
                  style={{
                    background: "rgba(248,245,242,0.86)",
                    borderRadius: 16,
                    border: "1px solid rgba(231,223,218,0.95)",
                    padding: "12px 14px",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      color: "#6d625d",
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Varför den här?
                  </div>
                  <div
                    style={{
                      color: "#2f2a27",
                      fontSize: 15,
                      lineHeight: 1.5,
                    }}
                  >
                    {cardContext}
                  </div>
                </div>

                <p
                  style={{
                    margin: 0,
                    color: "#3e3733",
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {candidate.bio}
                </p>

                {candidate.has_latest_message ? (
                  <div
                    style={{
                      background: "rgba(248,245,242,0.86)",
                      borderRadius: 18,
                      border: "1px solid rgba(231,223,218,0.95)",
                      padding: 14,
                      display: "grid",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        color: "#6d625d",
                        fontSize: 13,
                        fontWeight: 700,
                      }}
                    >
                      Senaste signalen
                    </div>

                    <div
                      style={{
                        color: "#2f2a27",
                        fontSize: 15,
                        lineHeight: 1.6,
                      }}
                    >
                      {candidate.latest_message_text}
                    </div>
                  </div>
                ) : null}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={pillStyle()}>💫 {candidate.looking_for}</span>
                  <span style={pillStyle()}>✨ {candidate.activity_label}</span>
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {candidate.interests.map((item) => (
                    <span key={item} style={pillStyle()}>
                      {item}
                    </span>
                  ))}
                </div>

                <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => void handleLike(candidate)}
                    disabled={pendingLikeId === candidate.match_id}
                    style={{
                      display: "inline-block",
                      padding: "12px 14px",
                      background: isLiked
                        ? "rgba(255,255,255,0.92)"
                        : "#111",
                      color: isLiked
                        ? "#111"
                        : "white",
                      borderRadius: 12,
                      border: isLiked
                        ? "1px solid rgba(208,198,191,0.95)"
                        : "1px solid #111",
                      textDecoration: "none",
                      fontWeight: 700,
                      cursor:
                        pendingLikeId === candidate.match_id
                          ? "default"
                          : "pointer",
                      opacity: pendingLikeId === candidate.match_id ? 0.7 : 1,
                    }}
                  >
                    {isLiked
                      ? pendingLikeId === candidate.match_id
                        ? "Ändrar..."
                        : "Ångra gilla"
                      : pendingLikeId === candidate.match_id
                        ? "Sparar..."
                        : "Gilla"}
                  </button>

                  {isLiked ? (
                    <>
                      <Link
                        href={`/matches?match=${candidate.match_id}`}
                        style={{
                          display: "inline-block",
                          padding: "12px 14px",
                          background: "#111",
                          color: "white",
                          borderRadius: 12,
                          textDecoration: "none",
                          fontWeight: 700,
                        }}
                      >
                        Visa matchning
                      </Link>

                      <Link
                        href={`/messages?match=${candidate.match_id}`}
                        style={{
                          display: "inline-block",
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: "1px solid rgba(208,198,191,0.95)",
                          textDecoration: "none",
                          color: "#111",
                          background: "white",
                        }}
                      >
                        Öppna samtal
                      </Link>
                    </>
                  ) : (
                    <span
                      style={{
                        ...pillStyle(),
                        alignSelf: "center",
                      }}
                    >
                      Gilla för att lägga till i matchlistan
                    </span>
                  )}
                </div>
              </div>
            </article>
              );
            })
          ) : (
            <div style={{ ...emptyStateStyle(), gridColumn: "1 / -1" }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Inga förslag att visa just nu
              </div>
              <p
                style={{
                  margin: 0,
                  color: "#5f5752",
                  fontSize: 16,
                  lineHeight: 1.7,
                }}
              >
                Inget är fel. Fyll i profilen eller kom tillbaka när fler
                matchningar finns att utforska.
              </p>
              <Link href="/profile" style={actionLinkStyle(true)}>
                Uppdatera profil
              </Link>
            </div>
          )}
        </div>
      </section>

      <section
        className="tk-panel-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "340px minmax(0, 1fr)",
            gap: 28,
            alignItems: "start",
          }}
          className="tk-responsive-two-column"
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 5",
                borderRadius: 30,
                overflow: "hidden",
                background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
                border: "1px solid rgba(231,223,218,0.95)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
                color: "#666",
              }}
            >
              {profile.image ? (
                <img
                  src={profile.image}
                  alt="Profilbild"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    display: "grid",
                    gap: 12,
                    justifyItems: "center",
                  }}
                >
                  <div>Ingen profilbild ännu</div>
                  <div
                    style={{
                      color: "#6d625d",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    Lägg till en bild när du vill att profilen ska kännas mer
                    personlig.
                  </div>
                  <Link href="/profile" style={actionLinkStyle()}>
                    Lägg till bild
                  </Link>
                </div>
              )}
            </div>

            {profile.favoriteSong || profile.favoriteFilm || profile.favoriteBook ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.84)",
                  borderRadius: 24,
                  padding: 20,
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Favoriter
                </div>

                {profile.favoriteSong ? <div>🎵 {profile.favoriteSong}</div> : null}
                {profile.favoriteFilm ? <div>🎬 {profile.favoriteFilm}</div> : null}
                {profile.favoriteBook ? <div>📘 {profile.favoriteBook}</div> : null}
              </div>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: 18 }}>
            {interests.length ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.84)",
                  borderRadius: 24,
                  padding: 20,
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
                  display: "grid",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Intressen
                </div>

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {interests.map((item) => (
                    <span key={item} style={pillStyle()}>
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {profile.prompt ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.84)",
                  borderRadius: 24,
                  padding: 22,
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Personlig tanke
                </div>

                <div
                  style={{
                    color: "#2f2a27",
                    lineHeight: 1.8,
                    fontSize: 17,
                  }}
                >
                  {profile.prompt}
                </div>
              </div>
            ) : null}

            {profile.videoPresentation ? (
              <div
                style={{
                  background: "rgba(255,255,255,0.84)",
                  borderRadius: 24,
                  padding: 22,
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Videopresentation
                </div>

                {isPlayableVideoReference(profile.videoPresentation) ? (
                  <video
                    controls
                    src={profile.videoPresentation}
                    style={{
                      width: "100%",
                      maxHeight: 320,
                      borderRadius: 18,
                      background: "#111",
                      display: "block",
                    }}
                  >
                    Din webbläsare kan inte spela upp videon.
                  </video>
                ) : (
                  <div
                    style={{
                      color: "#2f2a27",
                      lineHeight: 1.8,
                      fontSize: 17,
                    }}
                  >
                    {profile.videoPresentation}
                  </div>
                )}
              </div>
            ) : null}

            {!profile.voiceUrl ? (
              <div style={emptyStateStyle()}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Ingen röstprofil ännu
                </div>

                <div
                  style={{
                    color: "#2f2a27",
                    lineHeight: 1.8,
                    fontSize: 16,
                  }}
                >
                  En kort röstprofil är valfri, men kan göra kontakten varmare
                  och mer levande.
                </div>

                <Link href="/voice" style={actionLinkStyle()}>
                  Spela in röstprofil
                </Link>
              </div>
            ) : null}

            <div className="tk-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/profile"
                style={{
                  display: "inline-block",
                  padding: "15px 20px",
                  background: "#111",
                  color: "white",
                  borderRadius: 14,
                  textDecoration: "none",
                  fontWeight: 700,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                }}
              >
                Redigera profil
              </Link>

              <Link
                href="/voice"
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
                {profile.voiceUrl ? "Till röstprofil" : "Lägg till röstprofil"}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
