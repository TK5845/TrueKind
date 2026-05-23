"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import {
  PROFILE_UPDATED_EVENT,
  readStoredProfileUi,
} from "../lib/profile-model";
import {
  MESSAGE_READ_STATE_UPDATED_EVENT,
  type ConversationView,
  formatUnreadCount,
} from "../lib/message-model";
import {
  getDefaultConversationViews,
  loadConversationSource,
} from "../lib/message-preview-model";
import {
  buildMatchInsights,
  buildMatchViewsFromSource,
  normalizeMatchId,
  type CanonicalMatch,
} from "../lib/match-model";
import {
  MATCH_STATE_UPDATED_EVENT,
  loadStoredMatchSource,
} from "../lib/match-db";

type LocalProfile = {
  name?: string;
  city?: string;
  image?: string;
  contactIntent?: string;
  activityInterest?: string;
};

type AuthState = "unknown" | "signed-in" | "signed-out";

function readLocalProfile(): LocalProfile | null {
  const profile = readStoredProfileUi();
  if (!profile) return null;

  return {
    name: profile.name,
    city: profile.city,
    image: profile.image,
    contactIntent: profile.contactIntent,
    activityInterest: profile.activityInterest,
  };
}

function getQueryMatchId(param: string | null): string | null {
  return normalizeMatchId(param);
}

function pillStyle(dark = false) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content" as const,
    padding: "9px 12px",
    borderRadius: 999,
    border: dark ? "1px solid #111" : "1px solid rgba(231,223,218,0.95)",
    background: dark ? "#111" : "rgba(255,255,255,0.84)",
    color: dark ? "white" : "#3e3733",
    fontSize: 13,
    fontWeight: 600,
  };
}

function actionLinkStyle(dark = false) {
  return {
    display: "inline-block",
    width: "fit-content" as const,
    padding: "13px 16px",
    background: dark ? "#111" : "white",
    color: dark ? "white" : "#111",
    borderRadius: 14,
    border: dark ? "1px solid #111" : "1px solid rgba(208,198,191,0.95)",
    textDecoration: "none",
    fontWeight: 700,
    boxShadow: dark ? "0 10px 20px rgba(0,0,0,0.12)" : "none",
  };
}

function emptyStateStyle() {
  return {
    background: "rgba(255,255,255,0.84)",
    borderRadius: 24,
    padding: 22,
    border: "1px solid rgba(231,223,218,0.95)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    display: "grid",
    gap: 12,
  };
}

function getInitial(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

function MatchImage({
  src,
  name,
  size,
  radius = "50%",
  shadow = "",
}: {
  src: string;
  name: string;
  size: number;
  radius?: string | number;
  shadow?: string;
}) {
  const sharedStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    display: "grid",
    placeItems: "center",
    boxShadow: shadow,
    border: "1px solid rgba(231,223,218,0.95)",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{
          ...sharedStyle,
          objectFit: "cover",
          display: "block",
        }}
      />
    );
  }

  return (
    <div
      aria-label={`${name} saknar profilbild`}
      style={{
        ...sharedStyle,
        background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
        color: "#6d625d",
        fontWeight: 800,
      }}
    >
      {getInitial(name)}
    </div>
  );
}

function MatchesContent() {
  const searchParams = useSearchParams();
  const queryMatchId = getQueryMatchId(searchParams.get("match"));
  const appliedQueryMatchIdRef = useRef<string | null>(queryMatchId);
  const [myProfile, setMyProfile] = useState<LocalProfile | null>(null);
  const [conversationViews, setConversationViews] = useState<ConversationView[]>(
    () => getDefaultConversationViews([])
  );
  const [candidateMatches, setCandidateMatches] =
    useState<CanonicalMatch[]>([]);
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [selectedId, setSelectedId] = useState<string | null>(queryMatchId);
  const [hasUserSelectedMatch, setHasUserSelectedMatch] = useState(false);
  const matches = useMemo(
    () => buildMatchViewsFromSource(candidateMatches, conversationViews),
    [candidateMatches, conversationViews]
  );

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (!mounted) return;

      if (queryMatchId && appliedQueryMatchIdRef.current !== queryMatchId) {
        appliedQueryMatchIdRef.current = queryMatchId;
        setSelectedId(queryMatchId);
        setHasUserSelectedMatch(false);
        return;
      }

      if (!queryMatchId && appliedQueryMatchIdRef.current) {
        appliedQueryMatchIdRef.current = null;
        setHasUserSelectedMatch(false);
      }

      if (!matches[0]) return;

      if (
        !selectedId ||
        (!queryMatchId && !hasUserSelectedMatch) ||
        !matches.some((match) => match.match_id === selectedId)
      ) {
        setSelectedId(matches[0].match_id);
      }
    });

    return () => {
      mounted = false;
    };
  }, [matches, queryMatchId, selectedId, hasUserSelectedMatch]);

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (mounted) {
        setMyProfile(readLocalProfile());
      }
    });

    function onProfileUpdated() {
      setMyProfile(readLocalProfile());
    }

    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function hydrateConversationPreviews(userId?: string | null) {
      let activeUserId = userId;

      if (typeof activeUserId === "undefined") {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        activeUserId = user?.id ?? null;
      }

      if (!activeUserId) {
        if (!mounted) return;
        setAuthState("signed-out");
        setCandidateMatches([]);
        setConversationViews(getDefaultConversationViews([]));
        return;
      }

      if (mounted) {
        setAuthState("signed-in");
      }

      const matchResult = await loadStoredMatchSource(supabase, activeUserId);
      const nextCandidateMatches = matchResult.matches;
      const conversationResult = await loadConversationSource(
        supabase,
        activeUserId,
        nextCandidateMatches
      );

      if (!mounted) return;
      setCandidateMatches(nextCandidateMatches);
      setConversationViews(conversationResult.conversations);
    }

    void hydrateConversationPreviews();

    function onReadStateUpdated() {
      void hydrateConversationPreviews();
    }

    function onMatchStateUpdated() {
      void hydrateConversationPreviews();
    }

    window.addEventListener(
      MESSAGE_READ_STATE_UPDATED_EVENT,
      onReadStateUpdated
    );
    window.addEventListener(MATCH_STATE_UPDATED_EVENT, onMatchStateUpdated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setAuthState(session ? "signed-in" : "signed-out");
      }
      void hydrateConversationPreviews(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      window.removeEventListener(
        MESSAGE_READ_STATE_UPDATED_EVENT,
        onReadStateUpdated
      );
      window.removeEventListener(MATCH_STATE_UPDATED_EVENT, onMatchStateUpdated);
      subscription.unsubscribe();
    };
  }, []);

  const selectedMatch =
    matches.find((item) => item.match_id === selectedId) ?? matches[0] ?? null;
  const selectedMatchInsights = selectedMatch
    ? buildMatchInsights(selectedMatch)
    : [];
  const hasProfileBasics = Boolean(myProfile?.name && myProfile?.city);

  if (authState === "signed-out") {
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
            gap: 14,
          }}
        >
          <div style={pillStyle(true)}>Matchlista</div>
          <h1 style={{ fontSize: 54, lineHeight: 1.02, margin: 0, color: "#181513" }}>
            Logga in för att se matchningar
          </h1>
          <p style={{ color: "#6d625d", fontSize: 20, lineHeight: 1.8, margin: 0, maxWidth: 820 }}>
            Matchlistan kopplas till ditt konto så att kontakter, samtal och
            senaste signaler inte blandas ihop mellan testkonton.
          </p>
          <div className="tk-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/login" style={actionLinkStyle(true)}>
              Logga in
            </Link>
            <Link href="/register" style={actionLinkStyle()}>
              Skapa konto
            </Link>
          </div>
        </section>
      </main>
    );
  }

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
          gap: 14,
        }}
      >
        <div style={pillStyle(true)}>Matchlista</div>
        <h1 style={{ fontSize: 54, lineHeight: 1.02, margin: 0, color: "#181513" }}>
          Dina matchningar
        </h1>
        <p style={{ color: "#6d625d", fontSize: 20, lineHeight: 1.8, margin: 0 }}>
          Här samlas människor där tonen känns ömsesidig.
        </p>
        <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {myProfile?.name ? <span style={pillStyle()}>Du som {myProfile.name}</span> : null}
          {myProfile?.city ? <span style={pillStyle()}>📍 {myProfile.city}</span> : null}
          {myProfile?.contactIntent ? <span style={pillStyle()}>💌 {myProfile.contactIntent}</span> : null}
          {myProfile?.activityInterest ? <span style={pillStyle()}>✨ {myProfile.activityInterest}</span> : null}
        </div>
        {!hasProfileBasics ? (
          <div style={emptyStateStyle()}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
              Profilen är inte riktigt klar
            </div>
            <div style={{ color: "#5f5752", fontSize: 16, lineHeight: 1.7 }}>
              Lägg till namn och stad så matchlistan känns mer personlig.
            </div>
            <Link href="/profile" style={actionLinkStyle()}>
              Komplettera profil
            </Link>
          </div>
        ) : null}
      </section>

      <section className="tk-responsive-two-column" style={{ display: "grid", gridTemplateColumns: "360px minmax(0, 1fr)", gap: 24, alignItems: "start" }}>
        <aside
          className="tk-panel-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
            borderRadius: 30,
            padding: 20,
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 20px 44px rgba(0,0,0,0.07)",
            display: "grid",
            gap: 14,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d", padding: "4px 6px" }}>
            Dina kontakter
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {matches.length ? (
              matches.map((match) => {
              const isActive = match.match_id === selectedMatch?.match_id;

              return (
                <button
                  key={match.match_id}
                  onClick={() => {
                    setSelectedId(match.match_id);
                    setHasUserSelectedMatch(true);
                  }}
                  style={{
                    textAlign: "left",
                    border: isActive
                      ? "1px solid rgba(17,17,17,0.16)"
                      : "1px solid rgba(231,223,218,0.95)",
                    background: isActive ? "rgba(255,255,255,0.97)" : "rgba(255,255,255,0.82)",
                    borderRadius: 22,
                    padding: 14,
                    cursor: "pointer",
                    display: "grid",
                    gap: 10,
                    boxShadow: isActive ? "0 10px 24px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <div className="tk-match-card-grid" style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
                    <MatchImage src={match.image} name={match.name} size={56} />
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800, color: "#181513", fontSize: 16 }}>
                        {match.name}, {match.age}
                      </div>
                      <div style={{ color: "#7b706a", fontSize: 13 }}>{match.city}</div>
                    </div>
                  </div>

                  <div style={{ color: "#3e3733", fontSize: 14, lineHeight: 1.6 }}>
                    {match.preview_text}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {match.has_unread ? (
                      <span style={pillStyle(true)}>
                        {formatUnreadCount(match.unread_count)}
                      </span>
                    ) : null}
                    <span style={pillStyle()}>{match.chemistry_label}</span>
                  </div>
                </button>
              );
              })
            ) : (
              <div style={emptyStateStyle()}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}
                >
                  Inga kontakter ännu
                </div>
                <div style={{ color: "#5f5752", fontSize: 15, lineHeight: 1.7 }}>
                  Gilla någon i Discover så dyker personen upp här med nästa
                  steg till samtal.
                </div>
                <Link href="/discover" style={actionLinkStyle()}>
                  Gå till Discover
                </Link>
              </div>
            )}
          </div>
        </aside>

        <section
          className="tk-panel-card"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
            borderRadius: 30,
            padding: 22,
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 20px 44px rgba(0,0,0,0.07)",
            display: "grid",
            gap: 20,
          }}
        >
          {selectedMatch ? (
            <>
          <div className="tk-match-detail-header" style={{ display: "grid", gridTemplateColumns: "110px minmax(0, 1fr)", gap: 18, alignItems: "center" }}>
            <MatchImage src={selectedMatch.image} name={selectedMatch.name} size={110} radius={26} shadow="0 16px 32px rgba(0,0,0,0.12)" />
            <div style={{ display: "grid", gap: 8 }}>
              <h2 style={{ margin: 0, fontSize: 38, lineHeight: 1.05, color: "#181513" }}>
                {selectedMatch.name}, {selectedMatch.age}
              </h2>
              <div style={{ color: "#6d625d", fontSize: 17 }}>{selectedMatch.city}</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {selectedMatch.has_unread ? (
                  <span style={pillStyle(true)}>
                    {formatUnreadCount(selectedMatch.unread_count)}
                  </span>
                ) : null}
                <span style={pillStyle()}>{selectedMatch.chemistry_label}</span>
                <span style={pillStyle()}>💫 {selectedMatch.looking_for}</span>
                <span style={pillStyle()}>✨ {selectedMatch.activity_label}</span>
              </div>
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.84)", borderRadius: 24, padding: 22, border: "1px solid rgba(231,223,218,0.95)", display: "grid", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
              Om känslan mellan er
            </div>
            <div style={{ color: "#2f2a27", fontSize: 18, lineHeight: 1.8 }}>
              {selectedMatch.about_text}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.84)", borderRadius: 24, padding: 22, border: "1px solid rgba(231,223,218,0.95)", display: "grid", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
              Mer om {selectedMatch.name}
            </div>
            <div style={{ display: "grid", gap: 12 }}>
              {selectedMatchInsights.map((insight) => (
                <div
                  key={insight.id}
                  style={{
                    background: "rgba(248,245,242,0.82)",
                    borderRadius: 18,
                    border: "1px solid rgba(231,223,218,0.95)",
                    padding: 16,
                    display: "grid",
                    gap: 6,
                  }}
                >
                  <div style={{ color: "#6d625d", fontSize: 13, fontWeight: 700 }}>
                    {insight.label}
                  </div>
                  <div style={{ color: "#2f2a27", fontSize: 16, lineHeight: 1.75 }}>
                    {insight.text}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "rgba(255,255,255,0.84)", borderRadius: 24, padding: 22, border: "1px solid rgba(231,223,218,0.95)", display: "grid", gap: 12 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
              Intressen ni kan mötas i
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {selectedMatch.interests.map((item) => (
                <span key={item} style={pillStyle()}>
                  {item}
                </span>
              ))}
            </div>
          </div>

          {selectedMatch.has_latest_message ? (
            <div style={{ background: "linear-gradient(135deg, #111, #1d1d1d)", color: "white", borderRadius: 28, padding: 24, display: "grid", gap: 12, boxShadow: "0 18px 34px rgba(0,0,0,0.16)" }}>
              <div style={{ fontSize: 15, fontWeight: 700, opacity: 0.8 }}>
                Senaste signalen
              </div>
              <div style={{ fontSize: 24, lineHeight: 1.5, fontWeight: 700 }}>
                “{selectedMatch.latest_message_text}”
              </div>
            </div>
          ) : (
            <div style={emptyStateStyle()}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
                Inget samtal ännu
              </div>
              <div style={{ color: "#5f5752", fontSize: 16, lineHeight: 1.7 }}>
                När ni börjar skriva visas senaste signalen här. Du kan öppna
                samtalet när det känns rätt.
              </div>
              <Link
                href={`/messages?match=${selectedMatch.conversation_id}`}
                style={actionLinkStyle()}
              >
                Öppna samtal
              </Link>
            </div>
          )}

          <div className="tk-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href={`/messages?match=${selectedMatch.conversation_id}`} style={{ display: "inline-block", padding: "15px 20px", background: "#111", color: "white", borderRadius: 14, textDecoration: "none", fontWeight: 700, boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}>
              Öppna samtal
            </Link>
            <Link href="/discover" style={{ display: "inline-block", padding: "15px 20px", borderRadius: 14, border: "1px solid rgba(208,198,191,0.95)", textDecoration: "none", color: "#111", background: "white" }}>
              Till discover
            </Link>
            <Link href="/profile" style={{ display: "inline-block", padding: "15px 20px", borderRadius: 14, border: "1px solid rgba(208,198,191,0.95)", textDecoration: "none", color: "#111", background: "white" }}>
              Till profil
            </Link>
          </div>
            </>
          ) : (
            <div style={emptyStateStyle()}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}>
                Ingen matchning vald
              </div>
              <div style={{ color: "#5f5752", fontSize: 17, lineHeight: 1.8 }}>
                Gilla en profil i Discover först. Då sparas matchningen här och
                du kan öppna samtalet direkt.
              </div>
              <Link href="/discover" style={actionLinkStyle(true)}>
                Gå till Discover
              </Link>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={null}>
      <MatchesContent />
    </Suspense>
  );
}

