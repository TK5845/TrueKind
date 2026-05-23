"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../../utils/supabase/client";
import {
  runBackendReadinessChecks,
  type BackendReadinessReport,
  type ReadinessStatus,
} from "../../lib/backend-readiness";

function statusLabel(status: ReadinessStatus) {
  if (status === "pass") return "Klar";
  if (status === "warn") return "Se över";
  if (status === "skip") return "Hoppad över";
  return "Fel";
}

function statusStyle(status: ReadinessStatus) {
  const palette = {
    pass: { background: "#e7f4ea", color: "#1f5a2f", border: "#b8dfc2" },
    warn: { background: "#fff5dc", color: "#725000", border: "#ead08d" },
    fail: { background: "#fde8e8", color: "#7f1d1d", border: "#efb4b4" },
    skip: { background: "#f1f1f1", color: "#555", border: "#d8d8d8" },
  }[status];

  return {
    display: "inline-flex",
    width: "fit-content" as const,
    padding: "7px 10px",
    borderRadius: 999,
    background: palette.background,
    color: palette.color,
    border: `1px solid ${palette.border}`,
    fontSize: 13,
    fontWeight: 800,
  };
}

function cardStyle() {
  return {
    background: "rgba(255,255,255,0.92)",
    borderRadius: 24,
    padding: 22,
    border: "1px solid rgba(231,223,218,0.95)",
    boxShadow: "0 12px 28px rgba(0,0,0,0.05)",
    display: "grid",
    gap: 12,
  };
}

export default function InternalReadinessPage() {
  const [report, setReport] = useState<BackendReadinessReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function runChecks() {
    setIsLoading(true);
    const nextReport = await runBackendReadinessChecks(createClient());
    setReport(nextReport);
    setIsLoading(false);
  }

  useEffect(() => {
    let mounted = true;

    async function loadInitialReport() {
      const nextReport = await runBackendReadinessChecks(createClient());
      if (!mounted) return;
      setReport(nextReport);
      setIsLoading(false);
    }

    void loadInitialReport();

    return () => {
      mounted = false;
    };
  }, []);

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
        <div
          style={{
            display: "inline-flex",
            width: "fit-content",
            background: "#111",
            color: "white",
            padding: "8px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Intern readiness
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 48,
            lineHeight: 1.05,
            color: "#181513",
          }}
        >
          Backendkontroll för TrueKind
        </h1>

        <p
          style={{
            margin: 0,
            color: "#6d625d",
            fontSize: 18,
            lineHeight: 1.75,
            maxWidth: 860,
          }}
        >
          Den här sidan är för intern testning. Den är inte länkad från
          produktflödet och ändrar ingen backenddata.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => void runChecks()}
            disabled={isLoading}
            style={{
              padding: "13px 16px",
              borderRadius: 14,
              border: "1px solid #111",
              background: "#111",
              color: "white",
              cursor: isLoading ? "default" : "pointer",
              fontWeight: 800,
              opacity: isLoading ? 0.65 : 1,
            }}
          >
            {isLoading ? "Kontrollerar..." : "Kör kontroll igen"}
          </button>

          <Link
            href="/login"
            style={{
              display: "inline-block",
              padding: "13px 16px",
              borderRadius: 14,
              border: "1px solid rgba(208,198,191,0.95)",
              background: "white",
              color: "#111",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Till login
          </Link>
        </div>
      </section>

      {report ? (
        <>
          <section style={cardStyle()}>
            <span style={statusStyle(report.overallStatus)}>
              {statusLabel(report.overallStatus)}
            </span>
            <h2 style={{ margin: 0, color: "#181513", fontSize: 28 }}>
              {report.summary}
            </h2>
            <p style={{ margin: 0, color: "#6d625d", lineHeight: 1.7 }}>
              Senast kontrollerad:{" "}
              {new Date(report.checkedAt).toLocaleString("sv-SE")}
            </p>
          </section>

          <section
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            {report.checks.map((check) => (
              <article key={check.id} style={cardStyle()}>
                <span style={statusStyle(check.status)}>
                  {statusLabel(check.status)}
                </span>
                <h2
                  style={{
                    margin: 0,
                    color: "#181513",
                    fontSize: 22,
                    lineHeight: 1.2,
                  }}
                >
                  {check.title}
                </h2>
                <p
                  style={{
                    margin: 0,
                    color: "#5f5752",
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {check.detail}
                </p>
              </article>
            ))}
          </section>
        </>
      ) : (
        <section style={cardStyle()}>
          <span style={statusStyle("skip")}>Kontrollerar</span>
          <h2 style={{ margin: 0, color: "#181513", fontSize: 28 }}>
            Hämtar backendstatus...
          </h2>
        </section>
      )}
    </main>
  );
}
