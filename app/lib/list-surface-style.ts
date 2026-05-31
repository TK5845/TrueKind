export function pillStyle(dark = false) {
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

export function emptyStateStyle() {
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
