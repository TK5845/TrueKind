"use client";

import { useEffect, useState } from "react";
import RequireAccount from "../components/RequireAccount";
import { STORAGE_KEYS, safeRead } from "../lib/storage";
import { readStoredProfile } from "../lib/profile-model";
import type { MatchData, ProfileData } from "../lib/types";

function emptyProfile(): ProfileData {
  return {
    name: "",
    age: "",
    city: "",
    lookingFor: "",
    interests: [],
    bio: "",
    prompt: "",
    image: "",
  };
}

function canonicalToProfileData(): ProfileData {
  const profile = readStoredProfile();
  if (!profile) return emptyProfile();

  return {
    name: profile.name,
    age: profile.age,
    city: profile.city,
    lookingFor: profile.looking_for,
    looking_for: profile.looking_for,
    interests: profile.interests,
    bio: profile.bio,
    prompt: profile.personal_thought,
    personal_thought: profile.personal_thought,
    image: profile.profile_image_url,
    image_url: profile.profile_image_url,
    profile_image_url: profile.profile_image_url,
    contactIntent: profile.contact_intent,
    contact_intent: profile.contact_intent,
    activityInterest: profile.activity_interest,
    activity_interest: profile.activity_interest,
    favoriteSong: profile.favorite_song,
    favorite_song: profile.favorite_song,
    favoriteFilm: profile.favorite_movie,
    favoriteMovie: profile.favorite_movie,
    favorite_film: profile.favorite_movie,
    favorite_movie: profile.favorite_movie,
    favoriteBook: profile.favorite_book,
    favorite_book: profile.favorite_book,
    videoPresentation: profile.video_url,
    video_url: profile.video_url,
    voiceUrl: profile.voice_profile_url,
    voice_url: profile.voice_profile_url,
    voice_profile_url: profile.voice_profile_url,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
  };
}

function MatchContent() {
  const [selectedMatch, setSelectedMatch] = useState<MatchData | null>(null);
  const [myProfile, setMyProfile] = useState<ProfileData>(emptyProfile());

  useEffect(() => {
    let mounted = true;

    Promise.resolve().then(() => {
      if (!mounted) return;

      const match = safeRead<MatchData | null>(STORAGE_KEYS.selectedMatch, null);

      setSelectedMatch(match);
      setMyProfile(canonicalToProfileData());
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main style={{ display: "grid", gap: 28 }}>
      <section
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
        <div
          style={{
            display: "inline-block",
            width: "fit-content",
            background: "#111",
            color: "white",
            padding: "7px 14px",
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          Match
        </div>

        <h1
          style={{
            fontSize: 54,
            lineHeight: 1.02,
            margin: 0,
            color: "#181513",
          }}
        >
          Det känns som en match
        </h1>

        <p
          style={{
            color: "#6d625d",
            fontSize: 20,
            lineHeight: 1.8,
            margin: 0,
            maxWidth: 880,
          }}
        >
          När intresset känns ömsesidigt blir nästa steg enklare, varmare och
          mer naturligt.
        </p>
      </section>

      {selectedMatch ? (
        <section
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(249,244,240,0.98))",
            borderRadius: 34,
            overflow: "hidden",
            border: "1px solid rgba(231,223,218,0.95)",
            boxShadow: "0 24px 50px rgba(0,0,0,0.07)",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              minHeight: 650,
            }}
          >
            <div
              style={{
                background: "rgba(250,246,243,0.96)",
                padding: 32,
                display: "grid",
                alignContent: "start",
                gap: 18,
                borderRight: "1px solid rgba(231,223,218,0.95)",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  background: "#f3ece7",
                  color: "#111",
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  border: "1px solid rgba(231,223,218,0.9)",
                }}
              >
                Din profil
              </div>

              <div
                style={{
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: 28,
                  overflow: "hidden",
                  background: "#eee6e0",
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {myProfile.image ? (
                  <img
                    src={myProfile.image}
                    alt="Din profilbild"
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
                      textAlign: "center",
                      color: "#666",
                      padding: 20,
                      lineHeight: 1.6,
                    }}
                  >
                    Ingen profilbild uppladdad ännu
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: 40,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  color: "#181513",
                }}
              >
                {myProfile.name || "Du"}
                {myProfile.age ? `, ${myProfile.age}` : ""}
              </div>

              <div style={{ color: "#6d625d", fontSize: 19 }}>
                {myProfile.city || "Din stad"}
              </div>

              {myProfile.lookingFor ? (
                <div
                  style={{
                    display: "inline-block",
                    width: "fit-content",
                    fontSize: 14,
                    color: "#111",
                    background: "rgba(255,255,255,0.85)",
                    padding: "7px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(231,223,218,0.95)",
                  }}
                >
                  Söker: {myProfile.lookingFor}
                </div>
              ) : null}
            </div>

            <div
              style={{
                background: "white",
                padding: 32,
                display: "grid",
                alignContent: "start",
                gap: 18,
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  background: "#111",
                  color: "white",
                  padding: "7px 12px",
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                Din match
              </div>

              <div
                style={{
                  width: "100%",
                  aspectRatio: "4 / 5",
                  borderRadius: 28,
                  overflow: "hidden",
                  backgroundImage: `url(${selectedMatch.matchedImage})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  border: "1px solid rgba(231,223,218,0.95)",
                  boxShadow: "0 16px 34px rgba(0,0,0,0.08)",
                }}
              />

              <div
                style={{
                  fontSize: 40,
                  lineHeight: 1.05,
                  fontWeight: 800,
                  color: "#181513",
                }}
              >
                {selectedMatch.matchedName}
              </div>

              <div style={{ color: "#6d625d", fontSize: 19 }}>
                {selectedMatch.matchedCity}
              </div>

              <div
                style={{
                  marginTop: 4,
                  padding: 18,
                  borderRadius: 18,
                  background: "rgba(255,255,255,0.82)",
                  border: "1px solid rgba(231,223,218,0.95)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    color: "#7a6d66",
                    marginBottom: 8,
                    fontWeight: 600,
                  }}
                >
                  Nästa steg
                </div>
                <div
                  style={{
                    color: "#222",
                    lineHeight: 1.8,
                    fontSize: 16,
                  }}
                >
                  Ni har matchat. Nu kan du ta första steget och öppna samtalet
                  på ett lugnt och personligt sätt.
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section
          style={{
            background: "white",
            borderRadius: 28,
            padding: 30,
            boxShadow: "0 16px 36px rgba(0,0,0,0.07)",
            border: "1px solid rgba(231,223,218,0.95)",
          }}
        >
          Ingen aktiv match hittades.
        </section>
      )}

      <section
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,246,243,0.98))",
          borderRadius: 28,
          padding: 24,
          boxShadow: "0 16px 36px rgba(0,0,0,0.07)",
          border: "1px solid rgba(231,223,218,0.95)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <a
            href="/messages"
            style={{
              display: "inline-block",
              padding: "15px 20px",
              background: "#111",
              color: "white",
              textDecoration: "none",
              borderRadius: 14,
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "0 12px 24px rgba(17,17,17,0.18)",
            }}
          >
            Öppna meddelanden
          </a>

          <a
            href="/matches"
            style={{
              display: "inline-block",
              padding: "15px 20px",
              background: "white",
              color: "#111",
              textDecoration: "none",
              borderRadius: 14,
              border: "1px solid rgba(208,198,191,0.95)",
              fontSize: 16,
              boxShadow: "0 8px 18px rgba(0,0,0,0.04)",
            }}
          >
            Se matchlista
          </a>

          <a
            href="/discover"
            style={{
              display: "inline-block",
              padding: "15px 20px",
              background: "white",
              color: "#111",
              textDecoration: "none",
              borderRadius: 14,
              border: "1px solid rgba(208,198,191,0.95)",
              fontSize: 16,
              boxShadow: "0 8px 18px rgba(0,0,0,0.04)",
            }}
          >
            Till discover
          </a>
        </div>
      </section>
    </main>
  );
}

export default function MatchPage() {
  return (
    <RequireAccount>
      <MatchContent />
    </RequireAccount>
  );
}
