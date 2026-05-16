"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { MESSAGE_READ_STATE_UPDATED_EVENT } from "../lib/message-model";
import { loadUnreadSummaryForUser } from "../lib/message-preview-model";

export default function MessageBadge() {
  const [hasSession, setHasSession] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        setUnreadCount(0);
        return;
      }

      const summary = await loadUnreadSummaryForUser(supabase, userId);

      if (!mounted) return;
      setUnreadCount(summary.total_unread_count);
    }

    void hydrate();

    function onReadStateUpdated() {
      void hydrate();
    }

    window.addEventListener(
      MESSAGE_READ_STATE_UPDATED_EVENT,
      onReadStateUpdated
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      void hydrate(session?.user.id ?? null);
    });

    return () => {
      mounted = false;
      window.removeEventListener(
        MESSAGE_READ_STATE_UPDATED_EVENT,
        onReadStateUpdated
      );
      subscription.unsubscribe();
    };
  }, []);

  if (!hasSession) return null;

  return (
    <a
      href="/messages"
      aria-label={
        unreadCount > 0
          ? `${unreadCount} olästa meddelanden`
          : "Meddelanden"
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
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
      {unreadCount > 0 ? (
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
          {unreadCount}
        </span>
      ) : null}
      <span>Meddelanden</span>
    </a>
  );
}
