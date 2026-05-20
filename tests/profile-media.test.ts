import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_PROFILE_VIDEO_FILE_SIZE,
  cleanPersistedMediaUrl,
  getProfileVideoExtension,
  getProfileVideoPath,
  getVoiceProfilePath,
  possibleProfileVideoPaths,
  possibleVoiceProfilePaths,
  validateMediaFile,
} from "../app/lib/profile-media";

function fileLike(input: { name: string; type: string; size?: number }) {
  return input as File;
}

function blobLike(input: { type: string; size?: number }) {
  return input as Blob;
}

describe("profile media helpers", () => {
  it("keeps persisted URLs but drops temporary blob URLs", () => {
    assert.equal(cleanPersistedMediaUrl(" https://cdn.test/video.mp4 "), "https://cdn.test/video.mp4");
    assert.equal(cleanPersistedMediaUrl("blob:http://local-preview"), "");
    assert.equal(cleanPersistedMediaUrl(""), "");
  });

  it("validates media type and size with caller-provided Swedish messages", () => {
    assert.equal(
      validateMediaFile(fileLike({ name: "clip.mp4", type: "video/mp4", size: 10 }), {
        kind: "video",
        maxSizeBytes: MAX_PROFILE_VIDEO_FILE_SIZE,
        invalidTypeMessage: "Välj en giltig videofil.",
        tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
      }),
      ""
    );
    assert.equal(
      validateMediaFile(fileLike({ name: "clip.txt", type: "text/plain", size: 10 }), {
        kind: "video",
        invalidTypeMessage: "Välj en giltig videofil.",
      }),
      "Välj en giltig videofil."
    );
    assert.equal(
      validateMediaFile(
        fileLike({
          name: "large.mp4",
          type: "video/mp4",
          size: MAX_PROFILE_VIDEO_FILE_SIZE + 1,
        }),
        {
          kind: "video",
          maxSizeBytes: MAX_PROFILE_VIDEO_FILE_SIZE,
          invalidTypeMessage: "Välj en giltig videofil.",
          tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
        }
      ),
      "Videon är för stor. Välj en fil under 50 MB."
    );
  });

  it("builds stable storage paths and cleanup path lists", () => {
    assert.equal(
      getProfileVideoPath("user-1", fileLike({ name: "intro.webm", type: "video/webm" })),
      "user-1/video-presentation.webm"
    );
    assert.equal(
      getProfileVideoExtension(fileLike({ name: "intro.MOV", type: "" })),
      "mov"
    );
    assert.equal(
      getVoiceProfilePath("user-1", blobLike({ type: "audio/mpeg" })),
      "user-1/voice-profile.mp3"
    );
    assert.deepEqual(possibleProfileVideoPaths("user-1"), [
      "user-1/video-presentation.mp4",
      "user-1/video-presentation.webm",
      "user-1/video-presentation.mov",
    ]);
    assert.deepEqual(possibleVoiceProfilePaths("user-1"), [
      "user-1/voice-profile.webm",
      "user-1/voice-profile.ogg",
      "user-1/voice-profile.mp3",
      "user-1/voice-profile.m4a",
    ]);
  });
});
