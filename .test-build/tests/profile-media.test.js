"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const profile_media_1 = require("../app/lib/profile-media");
function fileLike(input) {
    return input;
}
function blobLike(input) {
    return input;
}
(0, node_test_1.describe)("profile media helpers", () => {
    (0, node_test_1.it)("keeps persisted URLs but drops temporary blob URLs", () => {
        strict_1.default.equal((0, profile_media_1.cleanPersistedMediaUrl)(" https://cdn.test/video.mp4 "), "https://cdn.test/video.mp4");
        strict_1.default.equal((0, profile_media_1.cleanPersistedMediaUrl)("blob:http://local-preview"), "");
        strict_1.default.equal((0, profile_media_1.cleanPersistedMediaUrl)(""), "");
    });
    (0, node_test_1.it)("validates media type and size with caller-provided Swedish messages", () => {
        strict_1.default.equal((0, profile_media_1.validateMediaFile)(fileLike({ name: "clip.mp4", type: "video/mp4", size: 10 }), {
            kind: "video",
            maxSizeBytes: profile_media_1.MAX_PROFILE_VIDEO_FILE_SIZE,
            invalidTypeMessage: "Välj en giltig videofil.",
            tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
        }), "");
        strict_1.default.equal((0, profile_media_1.validateMediaFile)(fileLike({ name: "clip.txt", type: "text/plain", size: 10 }), {
            kind: "video",
            invalidTypeMessage: "Välj en giltig videofil.",
        }), "Välj en giltig videofil.");
        strict_1.default.equal((0, profile_media_1.validateMediaFile)(fileLike({
            name: "large.mp4",
            type: "video/mp4",
            size: profile_media_1.MAX_PROFILE_VIDEO_FILE_SIZE + 1,
        }), {
            kind: "video",
            maxSizeBytes: profile_media_1.MAX_PROFILE_VIDEO_FILE_SIZE,
            invalidTypeMessage: "Välj en giltig videofil.",
            tooLargeMessage: "Videon är för stor. Välj en fil under 50 MB.",
        }), "Videon är för stor. Välj en fil under 50 MB.");
    });
    (0, node_test_1.it)("builds stable storage paths and cleanup path lists", () => {
        strict_1.default.equal((0, profile_media_1.getProfileVideoPath)("user-1", fileLike({ name: "intro.webm", type: "video/webm" })), "user-1/video-presentation.webm");
        strict_1.default.equal((0, profile_media_1.getProfileVideoExtension)(fileLike({ name: "intro.MOV", type: "" })), "mov");
        strict_1.default.equal((0, profile_media_1.getVoiceProfilePath)("user-1", blobLike({ type: "audio/mpeg" })), "user-1/voice-profile.mp3");
        strict_1.default.deepEqual((0, profile_media_1.possibleProfileVideoPaths)("user-1"), [
            "user-1/video-presentation.mp4",
            "user-1/video-presentation.webm",
            "user-1/video-presentation.mov",
        ]);
        strict_1.default.deepEqual((0, profile_media_1.possibleVoiceProfilePaths)("user-1"), [
            "user-1/voice-profile.webm",
            "user-1/voice-profile.ogg",
            "user-1/voice-profile.mp3",
            "user-1/voice-profile.m4a",
        ]);
    });
});
