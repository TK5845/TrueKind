"use client";

import { useEffect, useState } from "react";

const DEMO_TOOLS_KEY = "truekind_demo_tools";

function shouldShowDemoTools() {
  const params = new URLSearchParams(window.location.search);
  const requestedDemoTools = params.get("demoTools");

  if (requestedDemoTools === "1") {
    window.localStorage.setItem(DEMO_TOOLS_KEY, "1");
    return true;
  }

  if (requestedDemoTools === "0") {
    window.localStorage.removeItem(DEMO_TOOLS_KEY);
    return false;
  }

  return window.localStorage.getItem(DEMO_TOOLS_KEY) === "1";
}

export default function ResetDemoButton() {
  const [showDemoTools, setShowDemoTools] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setShowDemoTools(shouldShowDemoTools());
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function handleReset() {
    const confirmed = window.confirm(
      "Vill du nollställa lokal testdata på den här enheten? Sparad kontodata i TrueKind påverkas inte."
    );

    if (!confirmed) return;

    localStorage.removeItem("truekindProfile");
    localStorage.removeItem("truekind_profile_local");
    localStorage.removeItem("truekindLastMatch");
    localStorage.removeItem("truekindSelectedMatch");
    localStorage.removeItem("truekindVoiceProfile");

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;

      if (key.startsWith("truekindChat_") || key.startsWith("truekindUnread_")) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));

    window.location.href = "/";
  }

  if (!showDemoTools) return null;

  return (
    <button
      onClick={handleReset}
      style={{
        padding: "10px 16px",
        minHeight: 46,
        boxSizing: "border-box",
        borderRadius: 16,
        border: "1px solid rgba(208,198,191,0.95)",
        background: "white",
        color: "#111",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      Nollställ testdata
    </button>
  );
}
