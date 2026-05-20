export const PROFILE_IMAGE_BUCKET = "profile-images";
export const VIDEO_PRESENTATION_BUCKET = "video-presentations";
export const VOICE_PROFILE_BUCKET = "voice-profiles";

export const MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 700_000;
export const MAX_PROFILE_VIDEO_FILE_SIZE = 50 * 1024 * 1024;

const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"] as const;
const VOICE_EXTENSIONS = ["webm", "ogg", "mp3", "m4a"] as const;

type MediaKind = "video" | "audio" | "image";

function cleanExtension(value: string | undefined) {
  const extension = value?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]+$/.test(extension) ? extension : "";
}

export function cleanPersistedMediaUrl(value: string | null | undefined) {
  const trimmed = value?.trim() ?? "";
  return trimmed && !trimmed.startsWith("blob:") ? trimmed : "";
}

export function validateMediaFile(
  file: File | Blob,
  options: {
    kind: MediaKind;
    maxSizeBytes?: number;
    invalidTypeMessage: string;
    tooLargeMessage?: string;
  }
) {
  const type = file.type || "";

  if (!type.startsWith(`${options.kind}/`)) {
    return options.invalidTypeMessage;
  }

  if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
    return options.tooLargeMessage ?? "Filen är för stor.";
  }

  return "";
}

export function getProfileVideoExtension(file: File) {
  if (file.type === "video/mp4") return "mp4";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/quicktime") return "mov";

  return cleanExtension(file.name.split(".").pop()) || "mp4";
}

export function getVoiceProfileExtension(blob: Blob) {
  if (blob.type === "audio/mp4") return "m4a";
  if (blob.type === "audio/mpeg") return "mp3";
  if (blob.type === "audio/ogg") return "ogg";
  return "webm";
}

export function getProfileVideoPath(userId: string, file: File) {
  return `${userId}/video-presentation.${getProfileVideoExtension(file)}`;
}

export function getVoiceProfilePath(userId: string, blob: Blob) {
  return `${userId}/voice-profile.${getVoiceProfileExtension(blob)}`;
}

export function possibleProfileVideoPaths(userId: string) {
  return VIDEO_EXTENSIONS.map(
    (extension) => `${userId}/video-presentation.${extension}`
  );
}

export function possibleVoiceProfilePaths(userId: string) {
  return VOICE_EXTENSIONS.map(
    (extension) => `${userId}/voice-profile.${extension}`
  );
}

export function getStorageErrorDetails(error: unknown) {
  if (!error || typeof error !== "object") return String(error);

  const record = error as Record<string, unknown>;
  return JSON.stringify(
    {
      name: record.name,
      message: record.message,
      status: record.status,
      statusCode: record.statusCode,
      error: record.error,
      code: record.code,
    },
    null,
    2
  );
}
