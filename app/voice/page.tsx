"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import RequireAccount from "../components/RequireAccount";
import { createClient } from "../../utils/supabase/client";
import {
  getCurrentUserProfile,
  upsertCurrentUserProfile,
} from "../lib/profile-db";
import {
  normalizeProfile,
  patchStoredProfile,
  readStoredProfile,
} from "../lib/profile-model";

const VOICE_BUCKET = "voice-profiles";

function getLocalVoiceUrl() {
  const value = readStoredProfile()?.voice_profile_url ?? "";

  return value && !value.startsWith("blob:") ? value : "";
}

function getExtension(blob: Blob) {
  if (blob.type === "audio/mp4") return "m4a";
  if (blob.type === "audio/mpeg") return "mp3";
  if (blob.type === "audio/ogg") return "ogg";
  return "webm";
}

function possibleVoicePaths(userId: string) {
  return [
    `${userId}/voice-profile.webm`,
    `${userId}/voice-profile.ogg`,
    `${userId}/voice-profile.mp3`,
    `${userId}/voice-profile.m4a`,
  ];
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

function VoiceContent() {
  const [status, setStatus] = useState("");
  const [persistedVoiceUrl, setPersistedVoiceUrl] = useState("");
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const pendingPreviewUrlRef = useRef("");

  useEffect(() => {
    pendingPreviewUrlRef.current = pendingPreviewUrl;
  }, [pendingPreviewUrl]);

  useEffect(() => {
    let mounted = true;

    async function hydratePersistedVoice() {
      await Promise.resolve();

      const localVoiceUrl = getLocalVoiceUrl();
      if (!mounted) return;

      if (localVoiceUrl) {
        setPersistedVoiceUrl(localVoiceUrl);
      }

      const result = await withTimeout(getCurrentUserProfile(), 2500);
      if (!mounted || !result) return;

      const dbVoiceUrl = normalizeProfile(
        result.profile,
        result.user
      ).voice_profile_url;

      if (dbVoiceUrl && !dbVoiceUrl.startsWith("blob:")) {
        setPersistedVoiceUrl(dbVoiceUrl);
        patchStoredProfile({
          voice_profile_url: dbVoiceUrl,
        });
      } else if (!localVoiceUrl && result.user) {
        setPersistedVoiceUrl("");
      }
    }

    void hydratePersistedVoice();

    return () => {
      mounted = false;

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (pendingPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingPreviewUrlRef.current);
      }
    };
  }, []);

  function clearPendingRecording() {
    if (pendingPreviewUrlRef.current) {
      URL.revokeObjectURL(pendingPreviewUrlRef.current);
      pendingPreviewUrlRef.current = "";
    }

    setPendingBlob(null);
    setPendingPreviewUrl("");
  }

  async function startRecording() {
    try {
      setStatus("");
      clearPendingRecording();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const previewUrl = URL.createObjectURL(blob);

        if (pendingPreviewUrlRef.current) {
          URL.revokeObjectURL(pendingPreviewUrlRef.current);
        }

        pendingPreviewUrlRef.current = previewUrl;
        setPendingBlob(blob);
        setPendingPreviewUrl(previewUrl);
        setIsRecording(false);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        setStatus(
          "Inspelningen är klar. Lyssna och spara när du är nöjd."
        );
      };

      recorder.start();
      setIsRecording(true);
      setStatus("Spelar in...");
    } catch {
      setIsRecording(false);
      setStatus("Mikrofonen kunde inte startas. Kontrollera åtkomsten och försök igen.");
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    recorder.stop();
  }

  async function handleSaveRecording() {
    if (!pendingBlob) {
      setStatus("Det finns ingen ny inspelning att spara.");
      return;
    }

    setIsUploading(true);
    setStatus("Sparar röstprofil...");

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setStatus("Du måste vara inloggad för att spara röstprofilen.");
        return;
      }

      const extension = getExtension(pendingBlob);
      const filePath = `${user.id}/voice-profile.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(VOICE_BUCKET)
        .upload(filePath, pendingBlob, {
          upsert: true,
          contentType: pendingBlob.type || "audio/webm",
        });

      if (uploadError) {
        setStatus("Röstprofilen kunde inte sparas just nu.");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(VOICE_BUCKET).getPublicUrl(filePath);

      if (!publicUrl || publicUrl.startsWith("blob:")) {
        setStatus("Röstfilen sparades inte korrekt. Försök igen.");
        return;
      }

      const saveResult = await upsertCurrentUserProfile({
        voice_url: publicUrl,
      });

      if (saveResult.error) {
        setStatus("Röstfilen laddades upp, men kunde inte kopplas till profilen.");
        return;
      }

      setPersistedVoiceUrl(publicUrl);
      patchStoredProfile({
        voice_profile_url: publicUrl,
      });

      clearPendingRecording();
      setStatus("Röstprofilen är sparad.");

      const oldPaths = possibleVoicePaths(user.id).filter(
        (path) => path !== filePath
      );
      if (oldPaths.length) {
        void supabase.storage.from(VOICE_BUCKET).remove(oldPaths);
      }
    } catch {
      setStatus("Röstprofilen kunde inte sparas just nu.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemove() {
    setIsUploading(true);
    setStatus("Tar bort röstprofil...");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase.storage
          .from(VOICE_BUCKET)
          .remove(possibleVoicePaths(user.id));
        await upsertCurrentUserProfile({
          voice_url: null,
        });
      }

      clearPendingRecording();
      setPersistedVoiceUrl("");
      patchStoredProfile({
        voice_profile_url: "",
      });

      setStatus("Röstprofilen är borttagen.");
    } catch {
      setStatus("Röstprofilen kunde inte tas bort helt just nu.");
    } finally {
      setIsUploading(false);
    }
  }

  const activeAudioUrl = pendingPreviewUrl || persistedVoiceUrl;
  const hasPendingRecording = Boolean(pendingBlob);

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
          Röstprofil
        </div>

        <h1
          style={{
            fontSize: 54,
            lineHeight: 1.02,
            margin: 0,
            color: "#181513",
          }}
        >
          Låt din röst bära känslan
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
          Spela in en kort röstprofil så att andra kan känna din ton, energi och
          närvaro.
        </p>
      </section>

      <section
        className="tk-panel-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(249,244,240,0.98))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 22,
        }}
      >
        <div
          style={{
            borderRadius: 28,
            padding: 26,
            background: "linear-gradient(135deg, #111, #1e1e1e)",
            color: "white",
          }}
        >
          <div style={{ fontSize: 42, fontWeight: 800, marginBottom: 10 }}>
            Röst
          </div>
          <div style={{ fontSize: 18, opacity: 0.9 }}>
            Mer närvaro. Mer mänsklighet. Mindre brus.
          </div>
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.85)",
            borderRadius: 16,
            padding: 16,
            border: "1px solid rgba(231,223,218,0.95)",
            color: "#333",
            boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
          }}
        >
          <strong>Status:</strong>{" "}
          {status
            ? status
            : hasPendingRecording
              ? "Ny inspelning väntar på att sparas."
              : persistedVoiceUrl
                ? "Röstprofilen är sparad."
                : "Ingen röstprofil sparad ännu."}
        </div>

        {activeAudioUrl ? (
          <audio controls src={activeAudioUrl} style={{ width: "100%" }} />
        ) : null}

        <div className="tk-action-row" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isUploading}
              style={{
                padding: "15px 20px",
                background: "#111",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                cursor: isUploading ? "default" : "pointer",
                fontWeight: 700,
                opacity: isUploading ? 0.7 : 1,
              }}
            >
              Spela in röstmeddelande
            </button>
          ) : (
            <button
              onClick={stopRecording}
              style={{
                padding: "15px 20px",
                background: "#111",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Stoppa inspelning
            </button>
          )}

          <button
            onClick={handleSaveRecording}
            disabled={!pendingBlob || isUploading}
            style={{
              padding: "15px 20px",
              borderRadius: 14,
              border: "1px solid rgba(208,198,191,0.95)",
              background: "white",
              color: "#111",
              cursor: !pendingBlob || isUploading ? "default" : "pointer",
              opacity: !pendingBlob || isUploading ? 0.55 : 1,
            }}
          >
            {isUploading ? "Sparar..." : "Spara inspelning"}
          </button>

          <button
            onClick={handleRemove}
            disabled={isUploading || (!persistedVoiceUrl && !pendingBlob)}
            style={{
              padding: "15px 20px",
              borderRadius: 14,
              border: "1px solid rgba(208,198,191,0.95)",
              background: "white",
              color: "#111",
              cursor:
                isUploading || (!persistedVoiceUrl && !pendingBlob)
                  ? "default"
                  : "pointer",
              opacity: isUploading || (!persistedVoiceUrl && !pendingBlob) ? 0.55 : 1,
            }}
          >
            Ta bort röstprofil
          </button>

          <Link
            href="/profile"
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
            Till profil
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function VoicePage() {
  return (
    <RequireAccount>
      <VoiceContent />
    </RequireAccount>
  );
}
