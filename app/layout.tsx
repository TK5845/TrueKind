import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";
import ResetDemoButton from "./components/ResetDemoButton";
import AccountStatus from "./components/AccountStatus";
import AuthButtons from "./components/AuthButtons";
import LogoutButton from "./components/LogoutButton";
import MatchBadge from "./components/MatchBadge";
import MessageBadge from "./components/MessageBadge";

export const metadata = {
  title: "TrueKind",
  description: "För människor som söker något äkta.",
};

const navLinks = [
  { href: "/", label: "Start" },
  { href: "/onboarding", label: "Kom igång" },
  { href: "/discover", label: "Discover" },
  { href: "/matches", label: "Matchlista" },
  { href: "/messages", label: "Meddelanden" },
  { href: "/profile", label: "Profil" },
  { href: "/voice", label: "Röstprofil" },
];

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="sv">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "rgb(248,245,242)",
          color: "rgb(17,17,17)",
        }}
      >
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: "rgba(248,245,242,0.92)",
            backdropFilter: "blur(10px)",
            borderBottom: "1px solid rgb(231,223,218)",
          }}
        >
          <div
            className="tk-app-header-inner"
            style={{
              maxWidth: 1240,
              margin: "0 auto",
              padding: "20px 28px 18px",
              display: "grid",
              gap: 16,
            }}
          >
            <div
              className="tk-app-top-row"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <Link
                className="tk-app-brand"
                href="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderRadius: 24,
                  background: "#111",
                  color: "white",
                  textDecoration: "none",
                  fontWeight: 800,
                  fontSize: 18,
                  letterSpacing: 0,
                }}
              >
                TrueKind
              </Link>

              <div
                className="tk-app-actions"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <MatchBadge />
                <MessageBadge />
                <ResetDemoButton />
                <AccountStatus />
                <LogoutButton />
                <AuthButtons />
              </div>
            </div>

            <nav
              className="tk-app-nav"
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  style={{
                    textDecoration: "none",
                    color: "#343434",
                    padding: "10px 14px",
                    borderRadius: 14,
                    fontSize: 15,
                    background: "transparent",
                    border: "1px solid rgb(231,223,218)",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div
          className="tk-app-main"
          style={{
            maxWidth: 1240,
            margin: "0 auto",
            padding: "34px 28px 70px",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
