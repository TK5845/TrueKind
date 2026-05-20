"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_PROFILE_VIDEO_FILE_SIZE = exports.MAX_PROFILE_IMAGE_DATA_URL_LENGTH = exports.VOICE_PROFILE_BUCKET = exports.VIDEO_PRESENTATION_BUCKET = exports.PROFILE_IMAGE_BUCKET = void 0;
exports.cleanPersistedMediaUrl = cleanPersistedMediaUrl;
exports.validateMediaFile = validateMediaFile;
exports.getProfileVideoExtension = getProfileVideoExtension;
exports.getVoiceProfileExtension = getVoiceProfileExtension;
exports.getProfileVideoPath = getProfileVideoPath;
exports.getVoiceProfilePath = getVoiceProfilePath;
exports.possibleProfileVideoPaths = possibleProfileVideoPaths;
exports.possibleVoiceProfilePaths = possibleVoiceProfilePaths;
exports.getStorageErrorDetails = getStorageErrorDetails;
exports.PROFILE_IMAGE_BUCKET = "profile-images";
exports.VIDEO_PRESENTATION_BUCKET = "video-presentations";
exports.VOICE_PROFILE_BUCKET = "voice-profiles";
exports.MAX_PROFILE_IMAGE_DATA_URL_LENGTH = 700000;
exports.MAX_PROFILE_VIDEO_FILE_SIZE = 50 * 1024 * 1024;
const VIDEO_EXTENSIONS = ["mp4", "webm", "mov"];
const VOICE_EXTENSIONS = ["webm", "ogg", "mp3", "m4a"];
function cleanExtension(value) {
    var _a;
    const extension = (_a = value === null || value === void 0 ? void 0 : value.trim().toLowerCase()) !== null && _a !== void 0 ? _a : "";
    return /^[a-z0-9]+$/.test(extension) ? extension : "";
}
function cleanPersistedMediaUrl(value) {
    var _a;
    const trimmed = (_a = value === null || value === void 0 ? void 0 : value.trim()) !== null && _a !== void 0 ? _a : "";
    return trimmed && !trimmed.startsWith("blob:") ? trimmed : "";
}
function validateMediaFile(file, options) {
    var _a;
    const type = file.type || "";
    if (!type.startsWith(`${options.kind}/`)) {
        return options.invalidTypeMessage;
    }
    if (options.maxSizeBytes && file.size > options.maxSizeBytes) {
        return (_a = options.tooLargeMessage) !== null && _a !== void 0 ? _a : "Filen är för stor.";
    }
    return "";
}
function getProfileVideoExtension(file) {
    if (file.type === "video/mp4")
        return "mp4";
    if (file.type === "video/webm")
        return "webm";
    if (file.type === "video/quicktime")
        return "mov";
    return cleanExtension(file.name.split(".").pop()) || "mp4";
}
function getVoiceProfileExtension(blob) {
    if (blob.type === "audio/mp4")
        return "m4a";
    if (blob.type === "audio/mpeg")
        return "mp3";
    if (blob.type === "audio/ogg")
        return "ogg";
    return "webm";
}
function getProfileVideoPath(userId, file) {
    return `${userId}/video-presentation.${getProfileVideoExtension(file)}`;
}
function getVoiceProfilePath(userId, blob) {
    return `${userId}/voice-profile.${getVoiceProfileExtension(blob)}`;
}
function possibleProfileVideoPaths(userId) {
    return VIDEO_EXTENSIONS.map((extension) => `${userId}/video-presentation.${extension}`);
}
function possibleVoiceProfilePaths(userId) {
    return VOICE_EXTENSIONS.map((extension) => `${userId}/voice-profile.${extension}`);
}
function getStorageErrorDetails(error) {
    if (!error || typeof error !== "object")
        return String(error);
    const record = error;
    return JSON.stringify({
        name: record.name,
        message: record.message,
        status: record.status,
        statusCode: record.statusCode,
        error: record.error,
        code: record.code,
    }, null, 2);
}
