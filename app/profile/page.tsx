"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import RequireAccount from "../components/RequireAccount";
import {
  getCurrentUserProfile,
  upsertCurrentUserProfile,
} from "../lib/profile-db";
import {
  PROFILE_UPDATED_EVENT,
  canonicalProfileToDbInput,
  normalizeProfile,
  patchStoredProfile,
  profileToStorage,
  readStoredProfile,
  writeStoredProfile,
} from "../lib/profile-model";
import {
  MAX_PROFILE_IMAGE_DATA_URL_LENGTH,
  MAX_PROFILE_VIDEO_FILE_SIZE,
  PROFILE_IMAGE_BUCKET,
  VIDEO_PRESENTATION_BUCKET,
  cleanPersistedMediaUrl,
  getProfileVideoPath,
  getStorageErrorDetails,
  possibleProfileVideoPaths,
  validateMediaFile,
} from "../lib/profile-media";
import { createClient } from "../../utils/supabase/client";

type ProfileDraft = {
  name: string;
  age: string;
  city: string;
  lookingFor: string;
  interestsText: string;
  bio: string;
  prompt: string;
  image: string;
  contactIntent: string;
  activityInterest: string;
  favoriteSong: string;
  favoriteFilm: string;
  favoriteBook: string;
  videoPresentation: string;
  voiceUrl: string;
};

type DbProfile = {
  name?: string | null;
  first_name?: string | null;
  age?: string | null;
  city?: string | null;
  looking_for?: string | null;
  interests?: unknown;
  bio?: string | null;
  prompt?: string | null;
  image_url?: string | null;
  contact_intent?: string | null;
  activity_interest?: string | null;
  favorite_song?: string | null;
  favorite_film?: string | null;
  favorite_book?: string | null;
  video_url?: string | null;
  voice_url?: string | null;
};

type DbUser = {
  user_metadata?: {
    first_name?: unknown;
  };
};

function emptyDraft(): ProfileDraft {
  return {
    name: "",
    age: "",
    city: "",
    lookingFor: "",
    interestsText: "",
    bio: "",
    prompt: "",
    image: "",
    contactIntent: "",
    activityInterest: "",
    favoriteSong: "",
    favoriteFilm: "",
    favoriteBook: "",
    videoPresentation: "",
    voiceUrl: "",
  };
}

function listToText(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string").join(", ")
    : "";
}

function textToList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function profileToDraft(profileInput: unknown): ProfileDraft {
  const profile = normalizeProfile(profileInput);

  return {
    ...emptyDraft(),
    name: profile.name,
    age: profile.age,
    city: profile.city,
    lookingFor: profile.looking_for,
    interestsText: listToText(profile.interests),
    bio: profile.bio,
    prompt: profile.personal_thought,
    image: profile.profile_image_url,
    contactIntent: profile.contact_intent,
    activityInterest: profile.activity_interest,
    favoriteSong: profile.favorite_song,
    favoriteFilm: profile.favorite_movie,
    favoriteBook: profile.favorite_book,
    videoPresentation: profile.video_url,
    voiceUrl: profile.voice_profile_url,
  };
}

function dbProfileToDraft(input: {
  profile: DbProfile | null;
  user: DbUser | null;
}): ProfileDraft {
  return profileToDraft(normalizeProfile(input.profile, input.user));
}

function draftToStoredProfile(draft: ProfileDraft) {
  return profileToStorage({
    name: draft.name,
    age: draft.age,
    city: draft.city,
    looking_for: draft.lookingFor,
    interests: textToList(draft.interestsText),
    bio: draft.bio,
    personal_thought: draft.prompt,
    profile_image_url: draft.image,
    contact_intent: draft.contactIntent,
    activity_interest: draft.activityInterest,
    favorite_song: draft.favoriteSong,
    favorite_movie: draft.favoriteFilm,
    favorite_book: draft.favoriteBook,
    video_url: cleanPersistedMediaUrl(draft.videoPresentation),
    voice_profile_url: draft.voiceUrl,
  });
}

function loadLocalProfile(): ProfileDraft | null {
  const profile = readStoredProfile();
  return profile ? profileToDraft(profile) : null;
}

function saveLocalProfile(draft: ProfileDraft) {
  writeStoredProfile(draftToStoredProfile(draft));
}

function getLocalVideoUrl() {
  return cleanPersistedMediaUrl(readStoredProfile()?.video_url ?? "");
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => window.setTimeout(() => resolve(null), ms)),
  ]);
}

function readImageAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Kunde inte läsa bilden."));
      }
    };
    reader.onerror = () => reject(new Error("Kunde inte läsa bilden."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Kunde inte ladda bilden."));
    img.src = src;
  });
}

async function compressImage(file: File): Promise<string> {
  const dataUrl = await readImageAsDataUrl(file);
  const image = await loadImage(dataUrl);

  const maxWidth = 500;
  const maxHeight = 650;
  let targetWidth = image.width;
  let targetHeight = image.height;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kunde inte bearbeta bilden.");

  ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

  let quality = 0.72;
  let output = canvas.toDataURL("image/jpeg", quality);

  while (output.length > MAX_PROFILE_IMAGE_DATA_URL_LENGTH && quality > 0.4) {
    quality -= 0.08;
    output = canvas.toDataURL("image/jpeg", quality);
  }

  if (output.length > MAX_PROFILE_IMAGE_DATA_URL_LENGTH) {
    throw new Error("Bilden är fortfarande för stor efter komprimering.");
  }

  return output;
}

function dataUrlToBlob(dataUrl: string) {
  const [meta, data] = dataUrl.split(",");
  const mime = meta.match(/data:(.*);base64/)?.[1] || "image/jpeg";
  const binary = window.atob(data);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

async function uploadProfileImage(imageValue: string) {
  if (!imageValue.startsWith("data:")) {
    return { imageUrl: imageValue, warning: "" };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      imageUrl: imageValue,
      warning:
        "Profilen sparades, men bilden kan inte kopplas till kontot förrän du är inloggad.",
    };
  }

  const blob = dataUrlToBlob(imageValue);
  const filePath = `${user.id}/profile-image.jpg`;

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(filePath, blob, {
      upsert: true,
      contentType: blob.type || "image/jpeg",
    });

  if (uploadError) {
    return {
      imageUrl: imageValue,
      warning:
        "Profilen sparades, men bilden kunde inte laddas upp till kontot just nu.",
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(PROFILE_IMAGE_BUCKET).getPublicUrl(filePath);

  if (!publicUrl) {
    return {
      imageUrl: imageValue,
      warning:
        "Profilen sparades, men bilden fick ingen delbar länk ännu.",
    };
  }

  return { imageUrl: publicUrl, warning: "" };
}

async function uploadProfileVideo(
  videoValue: string,
  pendingVideoFile: File | null
) {
  if (!pendingVideoFile) {
    return { videoUrl: videoValue, error: "" };
  }

  const validationMessage = validateMediaFile(pendingVideoFile, {
    kind: "video",
    maxSizeBytes: MAX_PROFILE_VIDEO_FILE_SIZE,
    invalidTypeMessage: "Välj en giltig videofil.",
    tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
  });

  if (validationMessage) {
    return { videoUrl: videoValue, error: validationMessage };
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      videoUrl: videoValue,
      error:
        "Du måste vara inloggad för att spara videopresentationen.",
    };
  }

  const filePath = getProfileVideoPath(user.id, pendingVideoFile);
  const bucket = supabase.storage.from(VIDEO_PRESENTATION_BUCKET);

  let { error: uploadError } = await bucket.upload(
    filePath,
    pendingVideoFile,
    {
      upsert: false,
      contentType: pendingVideoFile.type || "video/mp4",
    }
  );

  if (uploadError) {
    await bucket.remove([filePath]);
    uploadError = (
      await bucket.upload(filePath, pendingVideoFile, {
        upsert: false,
        contentType: pendingVideoFile.type || "video/mp4",
      })
    ).error;
  }

  if (uploadError) {
    console.info(
      `[TrueKind video] Storage upload failed\nbucket=${VIDEO_PRESENTATION_BUCKET}\npath=${filePath}\ncontentType=${pendingVideoFile.type || "video/mp4"}\nsize=${pendingVideoFile.size}\nerror=${getStorageErrorDetails(uploadError)}`
    );
    return {
      videoUrl: videoValue,
      error:
        "Videon kunde inte laddas upp till kontot just nu.",
    };
  }

  const {
    data: { publicUrl },
  } = bucket.getPublicUrl(filePath);

  if (!publicUrl || publicUrl.startsWith("blob:")) {
    console.info("[TrueKind video] Storage public URL missing", {
      bucket: VIDEO_PRESENTATION_BUCKET,
      filePath,
      publicUrl,
    });
    return {
      videoUrl: videoValue,
      error:
        "Videon fick ingen sparad länk. Försök igen.",
    };
  }

  const oldPaths = possibleProfileVideoPaths(user.id).filter(
    (path) => path !== filePath
  );
  if (oldPaths.length) {
    void supabase.storage.from(VIDEO_PRESENTATION_BUCKET).remove(oldPaths);
  }

  return { videoUrl: publicUrl, error: "" };
}

function pillStyle() {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    width: "fit-content" as const,
    padding: "10px 14px",
    borderRadius: 999,
    border: "1px solid rgba(231,223,218,0.95)",
    background: "rgba(255,255,255,0.8)",
    color: "#3e3733",
    fontSize: 14,
    fontWeight: 600,
  };
}

function sectionCardStyle() {
  return {
    background: "rgba(255,255,255,0.82)",
    borderRadius: 24,
    padding: 22,
    border: "1px solid rgba(231,223,218,0.95)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
    display: "grid",
    gap: 14,
  };
}

function inputStyle() {
  return {
    padding: 15,
    borderRadius: 14,
    border: "1px solid rgba(208,198,191,0.95)",
    fontSize: 17,
    background: "rgba(255,255,255,0.92)",
    width: "100%",
  };
}

function textareaStyle(minHeight = 140) {
  return {
    padding: 16,
    borderRadius: 18,
    border: "1px solid rgba(208,198,191,0.95)",
    fontSize: 17,
    minHeight,
    resize: "vertical" as const,
    background: "rgba(255,255,255,0.92)",
    lineHeight: 1.8,
    width: "100%",
  };
}

function ProfileContent() {
  const [draft, setDraft] = useState<ProfileDraft>(() => emptyDraft());
  const [status, setStatus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [persistedVideoUrl, setPersistedVideoUrl] = useState("");
  const [pendingVideoFile, setPendingVideoFile] = useState<File | null>(null);
  const [pendingVideoPreviewUrl, setPendingVideoPreviewUrl] = useState("");
  const hasUserEditedRef = useRef(false);
  const pendingVideoPreviewUrlRef = useRef("");

  useEffect(() => {
    pendingVideoPreviewUrlRef.current = pendingVideoPreviewUrl;
  }, [pendingVideoPreviewUrl]);

  useEffect(() => {
    let mounted = true;

    async function hydrateProfile() {
      await Promise.resolve();

      const localDraft = loadLocalProfile();
      const localVideoUrl = getLocalVideoUrl();
      if (!mounted) return;

      if (localDraft) {
        setDraft(localDraft);
      }
      if (localVideoUrl) {
        setPersistedVideoUrl(localVideoUrl);
      }

      const result = await withTimeout(getCurrentUserProfile(), 2500);
      if (!mounted || !result || !(result.profile || result.user)) return;

      const supabaseDraft = dbProfileToDraft({
        profile: result.profile,
        user: result.user,
      });
      const dbVideoUrl = normalizeProfile(
        result.profile,
        result.user
      ).video_url;
      const nextDraft = {
        ...supabaseDraft,
        videoPresentation:
          dbVideoUrl || localVideoUrl || supabaseDraft.videoPresentation || "",
      };

      if (hasUserEditedRef.current) return;

      setDraft(nextDraft);
      setPersistedVideoUrl(nextDraft.videoPresentation);
      saveLocalProfile(nextDraft);
      if (dbVideoUrl) {
        patchStoredProfile({
          video_url: dbVideoUrl,
        });
      }
    }

    void hydrateProfile();

    function onProfileUpdated() {
      if (!mounted || hasUserEditedRef.current) return;
      const localDraft = loadLocalProfile() ?? emptyDraft();
      setDraft(localDraft);
      setPersistedVideoUrl(cleanPersistedMediaUrl(localDraft.videoPresentation));
    }

    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      onProfileUpdated as EventListener
    );

    return () => {
      mounted = false;
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        onProfileUpdated as EventListener
      );

      if (pendingVideoPreviewUrlRef.current) {
        URL.revokeObjectURL(pendingVideoPreviewUrlRef.current);
      }
    };
  }, []);

  function updateField<K extends keyof ProfileDraft>(
    key: K,
    value: ProfileDraft[K]
  ) {
    hasUserEditedRef.current = true;
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateMediaFile(file, {
      kind: "image",
      invalidTypeMessage: "Välj en giltig bildfil.",
    });

    if (validationMessage) {
      setStatus(validationMessage);
      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Bearbetar bild...");
      const compressed = await compressImage(file);

      hasUserEditedRef.current = true;
      setDraft((prev) => ({
        ...prev,
        image: compressed,
      }));

      setStatus("Bilden är klar. Spara profilen när du är nöjd.");
    } catch {
      setStatus("Bilden kunde inte bearbetas just nu.");
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function handleRemoveImage() {
    hasUserEditedRef.current = true;
    setDraft((prev) => ({
      ...prev,
      image: "",
    }));
    setStatus("Bilden är borttagen i utkastet. Spara profilen för att behålla ändringen.");
  }

  function clearPendingVideo() {
    if (pendingVideoPreviewUrlRef.current) {
      URL.revokeObjectURL(pendingVideoPreviewUrlRef.current);
      pendingVideoPreviewUrlRef.current = "";
    }

    setPendingVideoFile(null);
    setPendingVideoPreviewUrl("");
  }

  function handleVideoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateMediaFile(file, {
      kind: "video",
      maxSizeBytes: MAX_PROFILE_VIDEO_FILE_SIZE,
      invalidTypeMessage: "Välj en giltig videofil.",
      tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
    });

    if (validationMessage) {
      setStatus(validationMessage);
      event.target.value = "";
      return;
    }

    clearPendingVideo();
    const previewUrl = URL.createObjectURL(file);
    pendingVideoPreviewUrlRef.current = previewUrl;
    setPendingVideoFile(file);
    setPendingVideoPreviewUrl(previewUrl);
    setStatus("Videon är vald. Spara videon när du är nöjd.");
    event.target.value = "";
  }

  async function handleSaveVideo() {
    if (!pendingVideoFile || isUploading) {
      setStatus("Det finns ingen ny video att spara.");
      return;
    }

    setIsUploading(true);
    setStatus("Sparar videopresentation...");

    try {
      const videoResult = await uploadProfileVideo("", pendingVideoFile);

      if (videoResult.error) {
        setStatus(videoResult.error);
        return;
      }

      const videoUrl = cleanPersistedMediaUrl(videoResult.videoUrl);
      if (!videoUrl) {
        setStatus("Videon fick ingen sparad länk. Försök igen.");
        return;
      }

      const saveResult = await upsertCurrentUserProfile({
        video_url: videoUrl,
      });

      if (saveResult.error) {
        console.error("[TrueKind video] profiles.video_url upsert failed", {
          videoUrl,
          error: saveResult.error,
        });
        setStatus("Videon laddades upp, men kunde inte kopplas till profilen.");
        return;
      }

      const verifyResult = await getCurrentUserProfile();
      const verifiedVideoUrl = normalizeProfile(
        verifyResult.profile,
        verifyResult.user
      ).video_url;

      if (verifyResult.error || verifiedVideoUrl !== videoUrl) {
        console.error("[TrueKind video] profiles.video_url readback failed", {
          expectedVideoUrl: videoUrl,
          actualVideoUrl: verifiedVideoUrl,
          profile: verifyResult.profile,
          error: verifyResult.error,
        });
        setStatus(
          "Videon laddades upp, men kunde inte läsas tillbaka från profilen."
        );
        return;
      }

      console.info("[TrueKind video] profiles.video_url saved", {
        videoUrl: verifiedVideoUrl,
      });

      setPersistedVideoUrl(videoUrl);
      setDraft((prev) => ({
        ...prev,
        videoPresentation: videoUrl,
      }));
      patchStoredProfile({
        video_url: videoUrl,
      });
      clearPendingVideo();
      setStatus("Videopresentationen är sparad.");
    } catch {
      setStatus("Videopresentationen kunde inte sparas just nu.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleRemoveVideo() {
    setIsUploading(true);
    setStatus("Tar bort videopresentation...");

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const removeResult = await supabase.storage
          .from(VIDEO_PRESENTATION_BUCKET)
          .remove(possibleProfileVideoPaths(user.id));
        const saveResult = await upsertCurrentUserProfile({
          video_url: null,
        });

        if (saveResult.error) {
          setStatus("Videon kunde inte kopplas bort från profilen just nu.");
          return;
        }

        if (removeResult.error) {
          console.info("[TrueKind video] Storage cleanup failed", {
            bucket: VIDEO_PRESENTATION_BUCKET,
            error: getStorageErrorDetails(removeResult.error),
          });
          setStatus(
            "Videon är borttagen från profilen, men lagringen kunde inte städas helt just nu."
          );
        } else {
          setStatus("Videopresentationen är borttagen.");
        }
      }

      clearPendingVideo();
      setPersistedVideoUrl("");
      setDraft((prev) => ({
        ...prev,
        videoPresentation: "",
      }));
      patchStoredProfile({
        video_url: "",
      });
      if (!user) {
        setStatus("Videopresentationen är borttagen lokalt.");
      }
    } catch {
      setStatus("Videopresentationen kunde inte tas bort helt just nu.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSave() {
    if (isSaving || isUploading) return;

    setIsSaving(true);
    setStatus("Sparar profil...");

    try {
      const imageResult = await uploadProfileImage(draft.image.trim());

      const nextDraft = {
        ...draft,
        image: imageResult.imageUrl,
        name: draft.name.trim(),
        age: draft.age.trim(),
        city: draft.city.trim(),
        lookingFor: draft.lookingFor.trim(),
        interestsText: textToList(draft.interestsText).join(", "),
        bio: draft.bio.trim(),
        prompt: draft.prompt.trim(),
        favoriteSong: draft.favoriteSong.trim(),
        favoriteFilm: draft.favoriteFilm.trim(),
        favoriteBook: draft.favoriteBook.trim(),
        videoPresentation: persistedVideoUrl,
      };

      const result = await upsertCurrentUserProfile(
        canonicalProfileToDbInput(draftToStoredProfile(nextDraft))
      );

      if (result.error) {
        setStatus("Profilen kunde inte sparas till kontot just nu.");
        return;
      }

      setDraft(nextDraft);
      saveLocalProfile(nextDraft);
      patchStoredProfile({
        video_url: persistedVideoUrl,
      });
      hasUserEditedRef.current = false;
      setStatus(imageResult.warning || "Profilen är sparad.");
    } catch {
      setStatus("Profilen kunde inte sparas just nu.");
    } finally {
      setIsSaving(false);
    }
  }

  const interestList = textToList(draft.interestsText);
  const activeVideoUrl = pendingVideoPreviewUrl || persistedVideoUrl;

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
          gap: 18,
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
          Min profil
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <h1
            style={{
              fontSize: 54,
              lineHeight: 1.02,
              margin: 0,
              color: "#181513",
            }}
          >
            Det här är du i TrueKind
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
            Justera din profil så att den känns varm, tydlig och personlig.
          </p>
        </div>

        <div className="tk-action-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {draft.city ? <span style={pillStyle()}>📍 {draft.city}</span> : null}
          {draft.contactIntent ? (
            <span style={pillStyle()}>💌 {draft.contactIntent}</span>
          ) : null}
          {draft.activityInterest ? (
            <span style={pillStyle()}>✨ {draft.activityInterest}</span>
          ) : null}
          {draft.lookingFor ? (
            <span style={pillStyle()}>💫 {draft.lookingFor}</span>
          ) : null}
          {draft.voiceUrl ? (
            <span style={pillStyle()}>🎙️ Röstprofil sparad</span>
          ) : null}
          {draft.videoPresentation ? (
            <span style={pillStyle()}>Videopresentation sparad</span>
          ) : null}
        </div>
      </section>

      <section
        className="tk-panel-card"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.99), rgba(249,244,240,0.98))",
          borderRadius: 34,
          padding: 30,
          border: "1px solid rgba(231,223,218,0.95)",
          boxShadow: "0 24px 50px rgba(0,0,0,0.07)",
          display: "grid",
          gap: 24,
        }}
      >
        {status ? (
          <div
            style={{
              background: "rgba(255,255,255,0.9)",
              borderRadius: 16,
              padding: 16,
              border: "1px solid rgba(231,223,218,0.95)",
              color: "#333",
              boxShadow: "0 10px 24px rgba(0,0,0,0.04)",
            }}
          >
            {status}
          </div>
        ) : null}

        <div
          className="tk-responsive-two-column"
          style={{
            display: "grid",
            gridTemplateColumns: "340px minmax(0, 1fr)",
            gap: 28,
            alignItems: "start",
          }}
        >
          <div style={{ display: "grid", gap: 18 }}>
            <div
              style={{
                width: "100%",
                aspectRatio: "4 / 5",
                borderRadius: 30,
                overflow: "hidden",
                background: "linear-gradient(180deg, #efe7e2, #e8ddd6)",
                border: "1px solid rgba(231,223,218,0.95)",
                display: "grid",
                placeItems: "center",
                boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
              }}
            >
              {draft.image ? (
                <img
                  src={draft.image}
                  alt="Profilbild"
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
                    color: "#6e645e",
                    padding: 26,
                    lineHeight: 1.7,
                    fontSize: 16,
                  }}
                >
                  Ingen profilbild ännu
                </div>
              )}
            </div>

            <div style={sectionCardStyle()}>
              <div
                className="tk-profile-form-grid"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Bild
              </div>

              <label
                style={{
                  display: "inline-block",
                  padding: "15px 18px",
                  background: "#111",
                  color: "white",
                  borderRadius: 14,
                  cursor: "pointer",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              >
                {isUploading ? "Bearbetar bild..." : "Ladda upp bild"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
              </label>

              <button
                onClick={handleRemoveImage}
                disabled={isSaving || isUploading}
                style={{
                  padding: "15px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(208,198,191,0.95)",
                  background: "white",
                  color: "#111",
                  cursor: isSaving || isUploading ? "default" : "pointer",
                  opacity: isSaving || isUploading ? 0.65 : 1,
                }}
              >
                Ta bort bild
              </button>
            </div>

            <div style={sectionCardStyle()}>
              <div
                className="tk-profile-favorites-grid"
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Förhandsvisning
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 800,
                    color: "#181513",
                  }}
                >
                  {draft.name || "Ditt namn"}
                  {draft.age ? `, ${draft.age}` : ""}
                </div>

                <div style={{ color: "#6d625d", fontSize: 16 }}>
                  {draft.city || "Din stad"}
                </div>

                {interestList.length ? (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {interestList.slice(0, 6).map((item) => (
                      <span key={item} style={pillStyle()}>
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Röstprofil
              </div>

              <div style={{ color: "#3e3733", lineHeight: 1.7 }}>
                {draft.voiceUrl
                  ? "Din röstprofil är sparad och kopplad till ditt konto."
                  : "Du har ännu inte lagt till någon röstprofil."}
              </div>

              {draft.voiceUrl ? (
                <audio controls src={draft.voiceUrl} style={{ width: "100%" }} />
              ) : null}

              <Link
                href="/voice"
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(208,198,191,0.95)",
                  textDecoration: "none",
                  color: "#111",
                  background: "white",
                  fontWeight: 600,
                }}
              >
                {draft.voiceUrl ? "Hantera röstprofil" : "Lägg till röstprofil"}
              </Link>
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#6d625d",
                  }}
                >
                  Videopresentation
                </span>
                <span style={pillStyle()}>
                  {pendingVideoFile
                    ? "Vald - inte sparad"
                    : persistedVideoUrl
                      ? "Sparad i profil"
                      : "Ingen video"}
                </span>
              </div>

              <div style={{ color: "#3e3733", lineHeight: 1.7 }}>
                {activeVideoUrl
                  ? pendingVideoFile
                    ? "Ny video är vald. Spara den här innan du lämnar sidan."
                    : "Din videopresentation är sparad och kopplad till din profil."
                  : "Du har ännu inte lagt till någon videopresentation."}
              </div>

              {activeVideoUrl ? (
                <video
                  controls
                  src={activeVideoUrl}
                  style={{
                    width: "100%",
                    borderRadius: 18,
                    border: "1px solid rgba(231,223,218,0.95)",
                    background: "#111",
                  }}
                />
              ) : null}

              <label
                style={{
                  display: "inline-block",
                  width: "fit-content",
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid #111",
                  textDecoration: "none",
                  color: "white",
                  background: "#111",
                  fontWeight: 700,
                  cursor: isSaving || isUploading ? "default" : "pointer",
                  opacity: isSaving || isUploading ? 0.65 : 1,
                }}
              >
                {pendingVideoFile
                  ? "Byt vald video"
                  : persistedVideoUrl
                    ? "Byt video"
                    : "Ladda upp video"}
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  disabled={isSaving || isUploading}
                  style={{ display: "none" }}
                />
              </label>

              <button
                onClick={handleSaveVideo}
                disabled={!pendingVideoFile || isUploading || isSaving}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(208,198,191,0.95)",
                  background: "white",
                  color: "#111",
                  cursor:
                    !pendingVideoFile || isUploading || isSaving
                      ? "default"
                      : "pointer",
                  opacity: !pendingVideoFile || isUploading || isSaving ? 0.55 : 1,
                }}
              >
                {isUploading && pendingVideoFile ? "Sparar video..." : "Spara video"}
              </button>

              <button
                onClick={handleRemoveVideo}
                disabled={isSaving || isUploading || !activeVideoUrl}
                style={{
                  padding: "14px 18px",
                  borderRadius: 14,
                  border: "1px solid rgba(208,198,191,0.95)",
                  background: "white",
                  color: "#111",
                  cursor:
                    isSaving || isUploading || !activeVideoUrl
                      ? "default"
                      : "pointer",
                  opacity: isSaving || isUploading || !activeVideoUrl ? 0.55 : 1,
                }}
              >
                Ta bort video
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Grunduppgifter
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
                }}
              >
                <input
                  type="text"
                  placeholder="Ditt namn"
                  value={draft.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  style={inputStyle()}
                />

                <input
                  type="text"
                  placeholder="Din ålder"
                  value={draft.age}
                  onChange={(e) => updateField("age", e.target.value)}
                  style={inputStyle()}
                />

                <input
                  type="text"
                  placeholder="Din stad"
                  value={draft.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  style={inputStyle()}
                />

                <select
                  value={draft.lookingFor}
                  onChange={(e) => updateField("lookingFor", e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">Vilken typ av relation söker du?</option>
                  <option value="Långvarig relation">Långvarig relation</option>
                  <option value="Någon att lära känna">Någon att lära känna</option>
                  <option value="Djupare kontakt">Djupare kontakt</option>
                  <option value="Vet inte ännu">Vet inte ännu</option>
                </select>

                <select
                  value={draft.contactIntent}
                  onChange={(e) => updateField("contactIntent", e.target.value)}
                  style={inputStyle()}
                >
                  <option value="">Vad vill du helst hitta här?</option>
                  <option value="Kärlek">Kärlek</option>
                  <option value="Vänskap">Vänskap</option>
                  <option value="Aktivitet">Sällskap till aktivitet</option>
                  <option value="Virtuell kaffe">Virtuell kaffe</option>
                </select>

                <select
                  value={draft.activityInterest}
                  onChange={(e) =>
                    updateField("activityInterest", e.target.value)
                  }
                  style={inputStyle()}
                >
                  <option value="">Vilken aktivitet lockar mest?</option>
                  <option value="Fotbollsmatch">Fotbollsmatch</option>
                  <option value="Konsert">Konsert</option>
                  <option value="Träning">Träning</option>
                  <option value="Bokprat">Bokprat</option>
                  <option value="Virtuell kaffe">Virtuell kaffe</option>
                </select>
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Intressen & favoriter
              </div>

              <input
                type="text"
                placeholder="Intressen, separera med kommatecken"
                value={draft.interestsText}
                onChange={(e) => updateField("interestsText", e.target.value)}
                style={inputStyle()}
              />

              <div
                style={{
                  display: "grid",
                  gap: 14,
                  gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr)",
                }}
              >
                <input
                  type="text"
                  placeholder="Favoritlåt"
                  value={draft.favoriteSong}
                  onChange={(e) => updateField("favoriteSong", e.target.value)}
                  style={inputStyle()}
                />

                <input
                  type="text"
                  placeholder="Favoritfilm"
                  value={draft.favoriteFilm}
                  onChange={(e) => updateField("favoriteFilm", e.target.value)}
                  style={inputStyle()}
                />

                <input
                  type="text"
                  placeholder="Favoritbok"
                  value={draft.favoriteBook}
                  onChange={(e) => updateField("favoriteBook", e.target.value)}
                  style={inputStyle()}
                />
              </div>

              {interestList.length ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {interestList.map((item) => (
                    <span key={item} style={pillStyle()}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>

            <div style={sectionCardStyle()}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#6d625d",
                }}
              >
                Din berättelse
              </div>

              <textarea
                placeholder="Berätta kort om dig själv"
                value={draft.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                style={textareaStyle(150)}
              />

              <textarea
                placeholder="En personlig tanke"
                value={draft.prompt}
                onChange={(e) => updateField("prompt", e.target.value)}
                style={textareaStyle(140)}
              />
            </div>

            <div
              className="tk-action-row"
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={handleSave}
                disabled={isSaving || isUploading}
                style={{
                  padding: "15px 20px",
                  background: "#111",
                  color: "white",
                  border: "none",
                  borderRadius: 14,
                  fontSize: 16,
                  cursor: isSaving || isUploading ? "default" : "pointer",
                  fontWeight: 700,
                  opacity: isSaving || isUploading ? 0.7 : 1,
                  boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
                }}
              >
                {isSaving ? "Sparar..." : "Spara profil"}
              </button>

              <Link
                href="/voice"
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
                Till röstprofil
              </Link>

              <Link
                href="/discover"
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
                Till discover
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function ProfilePage() {
  return (
    <RequireAccount>
      <ProfileContent />
    </RequireAccount>
  );
}
