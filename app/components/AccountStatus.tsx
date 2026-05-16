"use client";

import { useEffect, useState } from "react";
import { createClient } from "../../utils/supabase/client";
import { getCurrentUserProfile } from "../lib/profile-db";
import {
  PROFILE_STORAGE_KEY,
  PROFILE_UPDATED_EVENT,
  hasProfileContent,
  normalizeProfile,
  readStoredProfileUi,
  writeStoredProfile,
} from "../lib/profile-model";

type BadgeProfile = {
  name: string;
  image: string;
};

function readLocalProfile(): BadgeProfile | null {
  const profile = readStoredProfileUi();
  if (!profile) return null;

  return {
    name: profile.name || "",
    image: profile.image || "",
  };
}

function profileFromLocal(): BadgeProfile {
  const local = readLocalProfile();
  return {
    name: local?.name?.trim() || "",
    image: local?.image?.trim() || "",
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

export default function AccountStatus() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [profile, setProfile] = useState<BadgeProfile>({
    name: "",
    image: "",
  });

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    function applyProfile(next: BadgeProfile) {
      if (!mounted) return;
      setProfile(next);
    }

    async function hydrate() {
      await Promise.resolve();

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        const loggedIn = Boolean(session);
        setHasSession(loggedIn);

        if (!loggedIn) {
          setProfile({ name: "", image: "" });
          setIsLoading(false);
          return;
        }

        const localProfile = profileFromLocal();
        applyProfile({
          name:
            localProfile.name ||
            (typeof session?.user?.user_metadata?.first_name === "string"
              ? session.user.user_metadata.first_name.trim()
              : ""),
          image: localProfile.image,
        });
        setIsLoading(false);

        const result = await withTimeout(getCurrentUserProfile(), 2500);
        if (!mounted || !result || !(result.profile || result.user)) return;

        const dbProfile = normalizeProfile(result.profile, result.user);

        applyProfile({
          name: dbProfile.name || localProfile.name,
          image: dbProfile.profile_image_url || localProfile.image,
        });

        if (hasProfileContent(dbProfile)) {
          writeStoredProfile(dbProfile);
        }
      } catch {
        if (!mounted) return;
        setHasSession(false);
        setProfile({ name: "", image: "" });
        setIsLoading(false);
      }
    }

    void hydrate();

    function onStorage(event: StorageEvent) {
      if (event.key !== PROFILE_STORAGE_KEY || !mounted) return;
      applyProfile(profileFromLocal());
    }

    function onProfileUpdated() {
      if (!mounted) return;
      applyProfile(profileFromLocal());
    }

    window.addEventListener("storage", onStorage);
    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      const loggedIn = Boolean(session);
      setHasSession(loggedIn);
      setIsLoading(false);

      if (!loggedIn) {
        setProfile({ name: "", image: "" });
        return;
      }

      applyProfile(profileFromLocal());
      void hydrate();
    });

    return () => {
      mounted = false;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );
      subscription.unsubscribe();
    };
  }, []);

  if (isLoading || !hasSession) return null;

  const label = profile.name ? `Inloggad som ${profile.name}` : "Inloggad";

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        minHeight: 46,
        boxSizing: "border-box",
        borderRadius: 16,
        background: "white",
        border: "1px solid rgba(208,198,191,0.95)",
        color: "#111",
        fontSize: 14,
        fontWeight: 600,
        maxWidth: "100%",
      }}
    >
      {profile.image ? (
        <img
          src={profile.image}
          alt="Profilbild"
          style={{
            width: 26,
            height: 26,
            borderRadius: "50%",
            objectFit: "cover",
            display: "block",
            border: "1px solid rgba(208,198,191,0.95)",
          }}
        />
      ) : (
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#111",
            display: "inline-block",
          }}
        />
      )}

      <span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    </div>
  );
}
