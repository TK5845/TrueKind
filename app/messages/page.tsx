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
  type MessageRow,
  appendMessageToConversationViews,
  formatUnreadCount,
  markConversationReadInViews,
} from "../lib/message-model";
import {
  getDefaultConversationViews,
  loadConversationSource,
  markConversationRead,
} from "../lib/message-preview-model";
import {
  buildConversationContinuationGuide,
  buildFirstMessageGuide,
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
};

type AuthState = "unknown" | "signed-in" | "signed-out";

function readLocalProfile(): LocalProfile | null {
  const profile = readStoredProfileUi();
  if (!profile) return null;

  return {
    name: profile.name,
    city: profile.city,
    image: profile.image,
  };
}

function getQueryMatchId(param: string | null): string | null {
  return normalizeMatchId(param);
}

function formatClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit",
  });
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
    padding: "11px 14px",
    background: dark ? "#111" : "white",
    color: dark ? "white" : "#111",
    borderRadius: 12,
    border: dark ? "1px solid #111" : "1px solid rgba(208,198,191,0.95)",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 700,
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

function ConversationImage({
  src,
  name,
  size,
}: {
  src: string;
  name: string;
  size: number;
}) {
  const sharedStyle = {
    width: size,
    height: size,
    borderRadius: "50%",
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
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
        color: "#6d625d",
        fontWeight: 800,
        fontSize: size <= 36 ? 13 : 16,
      }}
    >
      {getInitial(name)}
    </div>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const queryMatchId = getQueryMatchId(searchParams.get("match"));
  const sidebarRef = useRef<HTMLElement | null>(null);
  const appliedQueryMatchIdRef = useRef<string | null>(queryMatchId);
  const conversationButtonRefs = useRef<
    Record<string, HTMLAnchorElement | null>
  >({});

  const [myProfile, setMyProfile] = useState<LocalProfile | null>(null);
  const [candidateMatches, setCandidateMatches] =
    useState<CanonicalMatch[]>([]);
  const [conversations, setConversations] = useState<ConversationView[]>(() =>
    getDefaultConversationViews([])
  );
  const [authState, setAuthState] = useState<AuthState>("unknown");
  const [selectedId, setSelectedId] = useState<string | null>(queryMatchId);
  const [hasUserSelectedConversation, setHasUserSelectedConversation] =
    useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadMessagesForCurrentUser() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const activeUserId = user?.id ?? null;

    if (!activeUserId) {
      return {
        userId: null,
        candidateMatches: [],
        conversations: getDefaultConversationViews([]),
      };
    }

    const matchResult = await loadStoredMatchSource(
      supabase,
      activeUserId
    );
    const nextCandidateMatches = matchResult.matches;

    const conversationResult = await loadConversationSource(
      supabase,
      activeUserId,
      nextCandidateMatches
    );

    return {
      userId: activeUserId,
      candidateMatches: nextCandidateMatches,
      conversations: conversationResult.conversations,
    };
  }

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    Promise.resolve().then(() => {
      if (mounted) {
        setMyProfile(readLocalProfile());
      }
    });

    void loadMessagesForCurrentUser().then((next) => {
      if (mounted) {
        setAuthState(next.userId ? "signed-in" : "signed-out");
        setCandidateMatches(next.candidateMatches);
        setConversations(next.conversations);
      }
    });

    function onProfileUpdated() {
      setMyProfile(readLocalProfile());
    }

    function onMatchStateUpdated() {
      void loadMessagesForCurrentUser().then((next) => {
        if (mounted) {
          setAuthState(next.userId ? "signed-in" : "signed-out");
          setCandidateMatches(next.candidateMatches);
          setConversations(next.conversations);
        }
      });
    }

    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );
    window.addEventListener(MATCH_STATE_UPDATED_EVENT, onMatchStateUpdated);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const activeUserId = session?.user.id ?? null;

      if (mounted) {
        setAuthState(activeUserId ? "signed-in" : "signed-out");
      }

      if (!activeUserId) {
        if (mounted) {
          setCandidateMatches([]);
          setConversations(getDefaultConversationViews([]));
        }
        return;
      }

      void loadStoredMatchSource(supabase, activeUserId).then(
        (matchResult) => {
          const nextCandidateMatches = matchResult.matches;

          void loadConversationSource(
            supabase,
            activeUserId,
            nextCandidateMatches
          ).then((conversationResult) => {
            if (mounted) {
              setCandidateMatches(nextCandidateMatches);
              setConversations(conversationResult.conversations);
            }
          });
        });
    });

    return () => {
      mounted = false;
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );
      window.removeEventListener(MATCH_STATE_UPDATED_EVENT, onMatchStateUpdated);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (queryMatchId && appliedQueryMatchIdRef.current !== queryMatchId) {
      const hadAppliedQuery = appliedQueryMatchIdRef.current !== null;
      appliedQueryMatchIdRef.current = queryMatchId;

      if (hadAppliedQuery || !hasUserSelectedConversation) {
        setSelectedId(queryMatchId);
        setHasUserSelectedConversation(false);
        return;
      }
    }

    if (!queryMatchId && appliedQueryMatchIdRef.current) {
      appliedQueryMatchIdRef.current = null;
      setHasUserSelectedConversation(false);
    }

    if (!conversations[0]) return;

    if (!selectedId || (!queryMatchId && !hasUserSelectedConversation)) {
      setSelectedId(conversations[0].id);
      return;
    }

    if (!conversations.some((conversation) => conversation.id === selectedId)) {
      setSelectedId(conversations[0].id);
    }
  }, [queryMatchId, conversations, selectedId, hasUserSelectedConversation]);

  const latestConversationId = conversations[0]?.id ?? null;
  const conversationOrderKey = conversations
    .map((conversation) => conversation.id)
    .join("|");

  useEffect(() => {
    const sidebar = sidebarRef.current;
    if (!sidebar || !selectedId) return;

    if (
      !queryMatchId &&
      !hasUserSelectedConversation &&
      selectedId === latestConversationId
    ) {
      sidebar.scrollTo({ top: 0 });
      return;
    }

    const activeButton = conversationButtonRefs.current[selectedId];
    if (!activeButton) return;

    const padding = 10;
    const buttonTop = activeButton.offsetTop;
    const buttonBottom = buttonTop + activeButton.offsetHeight;
    const visibleTop = sidebar.scrollTop;
    const visibleBottom = visibleTop + sidebar.clientHeight;

    if (buttonTop < visibleTop) {
      sidebar.scrollTo({ top: Math.max(buttonTop - padding, 0) });
      return;
    }

    if (buttonBottom > visibleBottom) {
      sidebar.scrollTo({
        top: buttonBottom - sidebar.clientHeight + padding,
      });
    }
  }, [
    conversationOrderKey,
    hasUserSelectedConversation,
    latestConversationId,
    queryMatchId,
    selectedId,
  ]);

  const selectedConversation = useMemo(() => {
    if (!conversations.length) return null;
    return (
      conversations.find((conversation) => conversation.id === selectedId) ??
      conversations[0]
    );
  }, [conversations, selectedId]);
  const selectedCanonicalMatch = useMemo(() => {
    if (!selectedConversation) return null;
    return (
      candidateMatches.find(
        (match) => match.match_id === selectedConversation.id
      ) ?? null
    );
  }, [candidateMatches, selectedConversation]);
  const firstMessageGuide = useMemo(() => {
    if (!selectedConversation) return null;

    return buildFirstMessageGuide(
      selectedCanonicalMatch ?? {
        name: selectedConversation.name,
        chemistry_label: selectedConversation.chemistry,
      }
    );
  }, [selectedCanonicalMatch, selectedConversation]);
  const latestMessage =
    selectedConversation?.messages[selectedConversation.messages.length - 1] ??
    null;
  const continuationGuide = useMemo(() => {
    if (!selectedConversation || !latestMessage) return null;

    return buildConversationContinuationGuide({
      name: selectedConversation.name,
      chemistry_label:
        selectedCanonicalMatch?.chemistry_label ?? selectedConversation.chemistry,
      interests: selectedCanonicalMatch?.interests,
      activity_label: selectedCanonicalMatch?.activity_label,
      latest_message_text: latestMessage.message_text,
      latest_message_sender: latestMessage.sender,
      has_unread: selectedConversation.has_unread,
    });
  }, [latestMessage, selectedCanonicalMatch, selectedConversation]);
  const selectedConversationId = selectedConversation?.id ?? null;
  const selectedUnreadKey =
    selectedConversation?.unread_message_ids.join("|") ?? "";

  useEffect(() => {
    const activeConversationId = selectedConversationId;
    if (!activeConversationId || !selectedUnreadKey) return;

    const matchId: string = activeConversationId;
    const readAt = new Date().toISOString();

    setConversations((current) =>
      markConversationReadInViews(current, matchId, readAt)
    );
    window.dispatchEvent(new Event(MESSAGE_READ_STATE_UPDATED_EVENT));

    async function persistReadState() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const result = await markConversationRead(
        supabase,
        user?.id ?? null,
        matchId,
        readAt
      );

      if (result.ok) {
        window.dispatchEvent(new Event(MESSAGE_READ_STATE_UPDATED_EVENT));
      }
    }

    void persistReadState();
  }, [selectedConversationId, selectedUnreadKey]);

  async function handleSend() {
    const text = draftMessage.trim();
    if (!text || !selectedConversation || isSending) return;

    setIsSending(true);
    setSaveStatus("Sparar...");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSaveStatus("Logga in för att skicka.");
        return;
      }

      const activeConversationId = selectedConversation.id;
      const sentAt = new Date().toISOString();
      const savedMessage: MessageRow = {
        id: `local-${activeConversationId}-${sentAt}`,
        match_id: activeConversationId,
        sender: "me",
        message_text: text,
        sent_at: sentAt,
        read_at: sentAt,
        is_read: true,
      };
      let insertError = (
        await supabase.from("messages_demo").insert({
          user_id: user.id,
          match_id: activeConversationId,
          sender: "me",
          message_text: text,
          sent_at: sentAt,
          read_at: sentAt,
          is_read: true,
        })
      ).error;

      if (insertError) {
        insertError = (
          await supabase.from("messages_demo").insert({
            user_id: user.id,
            match_id: activeConversationId,
            sender: "me",
            message_text: text,
            sent_at: sentAt,
          })
        ).error;
      }

      if (insertError) {
        setSaveStatus("Meddelandet kunde inte skickas just nu.");
        return;
      }

      setDraftMessage("");
      setConversations((current) =>
        appendMessageToConversationViews(current, savedMessage, candidateMatches)
      );
      setSelectedId(activeConversationId);
      setHasUserSelectedConversation(true);
      window.dispatchEvent(new Event(MESSAGE_READ_STATE_UPDATED_EVENT));
      window.dispatchEvent(new Event(MATCH_STATE_UPDATED_EVENT));
      setSaveStatus("Skickat.");
      window.setTimeout(() => setSaveStatus(""), 1200);
    } catch {
      setSaveStatus("Meddelandet kunde inte skickas just nu.");
    } finally {
      setIsSending(false);
    }
  }

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
          <div style={pillStyle(true)}>Meddelanden</div>
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Logga in för att se meddelanden
          </h1>
          <p
            style={{
              color: "#6d625d",
              fontSize: 20,
              lineHeight: 1.8,
              margin: 0,
              maxWidth: 820,
            }}
          >
            Dina samtal hör till ditt konto. Logga in så laddas rätt
            konversationer och senaste signaler.
          </p>
          <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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

  if (!selectedConversation) {
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
          <div style={pillStyle(true)}>Meddelanden</div>
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Inga samtal ännu
          </h1>
          <p
            style={{
              color: "#6d625d",
              fontSize: 20,
              lineHeight: 1.8,
              margin: 0,
              maxWidth: 820,
            }}
          >
            Det är helt okej. När du har matchningar och börjar skriva kommer
            konversationerna att visas här.
          </p>
          <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/discover" style={actionLinkStyle(true)}>
              Gå till Discover
            </Link>
            <Link href="/profile" style={actionLinkStyle()}>
              Komplettera profil
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
        <div style={pillStyle(true)}>Meddelanden</div>
        <h1 style={{ fontSize: 54, lineHeight: 1.02, margin: 0, color: "#181513" }}>
          Samtal som känns
        </h1>
        <p style={{ color: "#6d625d", fontSize: 20, lineHeight: 1.8, margin: 0 }}>
          Här får du en lugn överblick över dina konversationer, med fokus på
          ton, närvaro och personkemi.
        </p>
      </section>

      <section
        className="tk-responsive-two-column"
        style={{
          display: "grid",
          gridTemplateColumns: "360px minmax(0, 1fr)",
          gap: 24,
          alignItems: "start",
        }}
      >
        <aside
          className="tk-conversation-sidebar tk-panel-card"
          ref={sidebarRef}
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
            borderRadius: 30,
            padding: 20,
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 20px 44px rgba(0,0,0,0.07)",
            display: "grid",
            gap: 14,
            alignSelf: "start",
            maxHeight: "calc(100vh - 140px)",
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: "#6d625d", padding: "4px 6px" }}>
            Dina konversationer
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            {conversations.length ? (
              conversations.map((conversation) => {
              const isActive = conversation.id === selectedConversation.id;

              return (
                <Link
                  key={conversation.id}
                  href={`/messages?match=${conversation.id}`}
                  ref={(element) => {
                    conversationButtonRefs.current[conversation.id] = element;
                  }}
                  onClick={() => {
                    appliedQueryMatchIdRef.current = conversation.id;
                    setHasUserSelectedConversation(true);
                    setSelectedId(conversation.id);
                  }}
                  style={{
                    textAlign: "left",
                    textDecoration: "none",
                    border: isActive
                      ? "1px solid rgba(17,17,17,0.16)"
                      : conversation.has_unread
                        ? "1px solid rgba(17,17,17,0.24)"
                      : "1px solid rgba(231,223,218,0.95)",
                    background: isActive
                      ? "rgba(255,255,255,0.96)"
                      : conversation.has_unread
                        ? "rgba(255,255,255,0.94)"
                        : "rgba(255,255,255,0.8)",
                    borderRadius: 22,
                    padding: 14,
                    cursor: "pointer",
                    display: "grid",
                    gap: 10,
                    boxShadow: isActive ? "0 10px 24px rgba(0,0,0,0.06)" : "none",
                  }}
                >
                  <div className="tk-conversation-card-grid" style={{ display: "grid", gridTemplateColumns: "52px minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
                    <ConversationImage src={conversation.image} name={conversation.name} size={52} />
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 700, color: "#181513", fontSize: 16 }}>
                        {conversation.name}, {conversation.age}
                      </div>
                      <div style={{ color: "#7b706a", fontSize: 13 }}>{conversation.city}</div>
                    </div>
                    <div style={{ color: "#7b706a", fontSize: 12, fontWeight: 600 }}>
                      {formatClock(conversation.latest_message_at)}
                    </div>
                  </div>

                  <div style={{ color: "#3e3733", fontSize: 14, lineHeight: 1.6, fontWeight: conversation.has_unread ? 700 : 400 }}>
                    {conversation.latest_message_text}
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {conversation.has_unread ? (
                      <>
                        <span style={pillStyle(true)}>Behöver svar</span>
                        <span style={pillStyle(true)}>
                          {formatUnreadCount(conversation.unread_count)}
                        </span>
                      </>
                    ) : null}
                    <span style={pillStyle()}>{conversation.chemistry}</span>
                  </div>
                </Link>
              );
              })
            ) : (
              <div style={emptyStateStyle()}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}
                >
                  Inga konversationer ännu
                </div>
                <div style={{ color: "#5f5752", fontSize: 15, lineHeight: 1.7 }}>
                  När du öppnar ett samtal från en matchning visas det här.
                </div>
                <Link href="/matches" style={actionLinkStyle()}>
                  Gå till matchlista
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
            gap: 18,
          }}
        >
          <div className="tk-message-detail-header" style={{ display: "grid", gridTemplateColumns: "68px minmax(0, 1fr) auto", gap: 14, alignItems: "center", paddingBottom: 14, borderBottom: "1px solid rgba(231,223,218,0.95)" }}>
            <ConversationImage src={selectedConversation.image} name={selectedConversation.name} size={68} />
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#181513" }}>
                {selectedConversation.name}, {selectedConversation.age}
              </div>
              <div style={{ color: "#6d625d", fontSize: 15 }}>{selectedConversation.city}</div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <span style={pillStyle()}>{selectedConversation.chemistry}</span>
              <Link
                href={`/matches?match=${selectedConversation.id}`}
                style={actionLinkStyle()}
              >
                Visa matchning
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gap: 12, minHeight: 380, alignContent: "start" }}>
            {selectedConversation.messages.length ? (
              selectedConversation.messages.map((message) => {
              const isMe = message.sender === "me";

              return (
                <div key={message.id} style={{ display: "grid", justifyContent: isMe ? "end" : "start" }}>
                  <div className="tk-message-bubble-row" style={{ display: "grid", gridTemplateColumns: isMe ? "minmax(0, 1fr) 36px" : "36px minmax(0, 1fr)", gap: 10, alignItems: "end", maxWidth: "78%" }}>
                    {!isMe ? <ConversationImage src={selectedConversation.image} name={selectedConversation.name} size={36} /> : null}
                    <div style={{ background: isMe ? "#111" : "rgba(255,255,255,0.92)", color: isMe ? "white" : "#2f2a27", border: isMe ? "1px solid #111" : "1px solid rgba(231,223,218,0.95)", borderRadius: 22, padding: "14px 16px", lineHeight: 1.7, boxShadow: "0 8px 18px rgba(0,0,0,0.05)" }}>
                      <div style={{ fontSize: 15 }}>{message.message_text}</div>
                      <div style={{ marginTop: 8, fontSize: 12, opacity: isMe ? 0.75 : 0.55, textAlign: "right" }}>
                        {formatClock(message.sent_at)}
                      </div>
                    </div>
                    {isMe ? myProfile?.image ? <img src={myProfile.image} alt={myProfile.name || "Min profil"} style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", display: "block", border: "1px solid rgba(231,223,218,0.95)" }} /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#111" }} /> : null}
                  </div>
                </div>
              );
              })
            ) : (
              <div style={emptyStateStyle()}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}
                >
                  Bra första öppning
                </div>
                <div style={{ color: "#5f5752", fontSize: 16, lineHeight: 1.7 }}>
                  {firstMessageGuide?.insight ??
                    "Det här samtalet är redo. Börja enkelt och personligt."}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {firstMessageGuide?.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraftMessage(suggestion)}
                      style={{
                        textAlign: "left",
                        border: "1px solid rgba(231,223,218,0.95)",
                        background: "rgba(248,245,242,0.82)",
                        borderRadius: 16,
                        padding: "12px 14px",
                        color: "#2f2a27",
                        fontSize: 15,
                        lineHeight: 1.6,
                        cursor: "pointer",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gap: 12, paddingTop: 12, borderTop: "1px solid rgba(231,223,218,0.95)" }}>
            {continuationGuide && selectedConversation.messages.length ? (
              <div style={emptyStateStyle()}>
                <div
                  style={{ fontSize: 15, fontWeight: 700, color: "#6d625d" }}
                >
                  Nästa svar
                </div>
                <div style={{ color: "#5f5752", fontSize: 15, lineHeight: 1.7 }}>
                  {continuationGuide.insight}
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {continuationGuide.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setDraftMessage(suggestion)}
                      style={{
                        textAlign: "left",
                        border: "1px solid rgba(231,223,218,0.95)",
                        background: "rgba(248,245,242,0.82)",
                        borderRadius: 16,
                        padding: "12px 14px",
                        color: "#2f2a27",
                        fontSize: 15,
                        lineHeight: 1.6,
                        cursor: "pointer",
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="tk-message-input-row" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                placeholder={`Skriv till ${selectedConversation.name}...`}
                value={draftMessage}
                onChange={(event) => setDraftMessage(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleSend();
                  }
                }}
                style={{ padding: 16, borderRadius: 16, border: "1px solid rgba(208,198,191,0.95)", fontSize: 16, background: "rgba(255,255,255,0.95)" }}
              />
              <button onClick={() => void handleSend()} disabled={isSending} style={{ padding: "15px 18px", borderRadius: 14, border: "none", background: "#111", color: "white", fontWeight: 700, cursor: isSending ? "default" : "pointer", opacity: isSending ? 0.6 : 1, boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}>
                {isSending ? "Sparar..." : "Skicka"}
              </button>
            </div>

            <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ color: "#6d625d", fontSize: 14 }}>
                Du skriver som <strong>{myProfile?.name || "du"}</strong>
                {!myProfile?.image ? " · ingen profilbild ännu" : ""}
                {saveStatus ? ` · ${saveStatus}` : ""}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Link href="/discover" style={{ display: "inline-block", padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(208,198,191,0.95)", textDecoration: "none", color: "#111", background: "white", fontSize: 14 }}>
                  Till discover
                </Link>
                <Link href="/matches" style={{ display: "inline-block", padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(208,198,191,0.95)", textDecoration: "none", color: "#111", background: "white", fontSize: 14 }}>
                  Till matchlista
                </Link>
                <Link href="/profile" style={{ display: "inline-block", padding: "11px 14px", borderRadius: 12, border: "1px solid rgba(208,198,191,0.95)", textDecoration: "none", color: "#111", background: "white", fontSize: 14 }}>
                  Till profil
                </Link>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  );
}
