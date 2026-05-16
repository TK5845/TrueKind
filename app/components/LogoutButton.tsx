"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";

function clearMatchingStorage(prefixes: string[]) {
  try {
    const localKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (prefixes.some((prefix) => key.startsWith(prefix) || key.includes(prefix))) {
        localKeys.push(key);
      }
    }
    localKeys.forEach((key) => window.localStorage.removeItem(key));
  } catch {}

  try {
    const sessionKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (!key) continue;
      if (prefixes.some((prefix) => key.startsWith(prefix) || key.includes(prefix))) {
        sessionKeys.push(key);
      }
    }
    sessionKeys.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {}
}

function clearSupabaseCookies() {
  try {
    const cookies = document.cookie ? document.cookie.split(";") : [];
    for (const rawCookie of cookies) {
      const eqIndex = rawCookie.indexOf("=");
      const name = (eqIndex > -1 ? rawCookie.slice(0, eqIndex) : rawCookie).trim();

      if (
        name.startsWith("sb-") ||
        name.includes("supabase") ||
        name.includes("auth-token")
      ) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
      }
    }
  } catch {}
}

export default function LogoutButton() {
  const [hasSession, setHasSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    async function hydrate() {
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
        if (mounted) setIsLoading(false);
      }
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

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    const supabase = createClient();

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: "global" }),
        new Promise((resolve) => window.setTimeout(resolve, 3000)),
      ]);
    } catch {}

    clearMatchingStorage([
      "sb-",
      "supabase",
      "auth-token",
      "truekindProfile",
      "truekind_profile_local",
      "truekindAccount",
      "truekindLastMatch",
      "truekindSelectedMatch",
      "truekindChat_",
      "truekindUnread_",
      "truekindVoiceProfile",
      "truekindVoiceMessage",
    ]);

    clearSupabaseCookies();

    window.location.assign(`/login?logged_out=1&t=${Date.now()}`);
  }

  if (isLoading || !hasSession) return null;

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      style={{
        padding: "10px 16px",
        minHeight: 46,
        boxSizing: "border-box",
        borderRadius: 16,
        border: "1px solid rgba(208,198,191,0.95)",
        background: "white",
        color: "#111",
        fontSize: 14,
        cursor: isLoggingOut ? "default" : "pointer",
        opacity: isLoggingOut ? 0.7 : 1,
      }}
    >
      {isLoggingOut ? "Loggar ut..." : "Logga ut"}
    </button>
  );
}
