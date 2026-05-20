"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_UPDATED_EVENT = exports.LEGACY_PROFILE_STORAGE_KEY = exports.PROFILE_STORAGE_KEY = void 0;
exports.textToProfileList = textToProfileList;
exports.emptyCanonicalProfile = emptyCanonicalProfile;
exports.normalizeProfile = normalizeProfile;
exports.hasProfileContent = hasProfileContent;
exports.profileToStorage = profileToStorage;
exports.profileToUiFields = profileToUiFields;
exports.readStoredProfile = readStoredProfile;
exports.readStoredProfileUi = readStoredProfileUi;
exports.writeStoredProfile = writeStoredProfile;
exports.patchStoredProfile = patchStoredProfile;
exports.canonicalProfileToDbInput = canonicalProfileToDbInput;
exports.PROFILE_STORAGE_KEY = "truekind_profile_local";
exports.LEGACY_PROFILE_STORAGE_KEY = "truekindProfile";
exports.PROFILE_UPDATED_EVENT = "truekind-profile-updated";
function asRecord(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}
function cleanString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim()) {
            return value.trim();
        }
    }
    return "";
}
function textToProfileList(value) {
    if (Array.isArray(value)) {
        return value
            .filter((item) => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    if (typeof value === "string") {
        return value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
    }
    return [];
}
function emptyCanonicalProfile() {
    return {
        id: "",
        name: "",
        age: "",
        city: "",
        bio: "",
        contact_intent: "",
        activity_interest: "",
        interests: [],
        favorite_song: "",
        favorite_movie: "",
        favorite_book: "",
        personal_thought: "",
        profile_image_url: "",
        voice_profile_url: "",
        created_at: "",
        updated_at: "",
        looking_for: "",
        video_url: "",
    };
}
function normalizeProfile(input, userInput) {
    var _a;
    const source = asRecord(input);
    const user = asRecord(userInput);
    const metadata = asRecord(user.user_metadata);
    return {
        id: cleanString(source.id, user.id),
        name: cleanString(source.name, source.first_name, source.firstName, metadata.first_name),
        age: cleanString(source.age),
        city: cleanString(source.city),
        bio: cleanString(source.bio),
        contact_intent: cleanString(source.contact_intent, source.contactIntent),
        activity_interest: cleanString(source.activity_interest, source.activityInterest),
        interests: textToProfileList((_a = source.interests) !== null && _a !== void 0 ? _a : source.interestsText),
        favorite_song: cleanString(source.favorite_song, source.favoriteSong),
        favorite_movie: cleanString(source.favorite_movie, source.favorite_film, source.favoriteMovie, source.favoriteFilm),
        favorite_book: cleanString(source.favorite_book, source.favoriteBook),
        personal_thought: cleanString(source.personal_thought, source.personalThought, source.prompt),
        profile_image_url: cleanString(source.profile_image_url, source.profileImageUrl, source.image_url, source.image),
        voice_profile_url: cleanString(source.voice_profile_url, source.voiceProfileUrl, source.voice_url, source.voiceUrl),
        created_at: cleanString(source.created_at, source.createdAt),
        updated_at: cleanString(source.updated_at, source.updatedAt),
        looking_for: cleanString(source.looking_for, source.lookingFor),
        video_url: cleanString(source.video_url, source.videoUrl, source.videoPresentation),
    };
}
function hasProfileContent(profile) {
    if (!profile)
        return false;
    return Boolean(profile.name ||
        profile.age ||
        profile.city ||
        profile.bio ||
        profile.contact_intent ||
        profile.activity_interest ||
        profile.favorite_song ||
        profile.favorite_movie ||
        profile.favorite_book ||
        profile.personal_thought ||
        profile.profile_image_url ||
        profile.voice_profile_url ||
        profile.looking_for ||
        profile.video_url ||
        profile.interests.length);
}
function profileToStorage(profileInput) {
    const profile = normalizeProfile(profileInput);
    return Object.assign(Object.assign({}, profile), { lookingFor: profile.looking_for, contactIntent: profile.contact_intent, activityInterest: profile.activity_interest, favoriteSong: profile.favorite_song, favoriteMovie: profile.favorite_movie, favoriteFilm: profile.favorite_movie, favoriteBook: profile.favorite_book, personalThought: profile.personal_thought, prompt: profile.personal_thought, profileImageUrl: profile.profile_image_url, image_url: profile.profile_image_url, image: profile.profile_image_url, voiceProfileUrl: profile.voice_profile_url, voice_url: profile.voice_profile_url, voiceUrl: profile.voice_profile_url, videoUrl: profile.video_url, videoPresentation: profile.video_url });
}
function profileToUiFields(profileInput) {
    const profile = normalizeProfile(profileInput);
    return {
        name: profile.name,
        age: profile.age,
        city: profile.city,
        lookingFor: profile.looking_for,
        interests: profile.interests,
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
function readJsonStorage(key) {
    if (typeof window === "undefined")
        return null;
    try {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    }
    catch (_a) {
        return null;
    }
}
function readStoredProfile() {
    const current = readJsonStorage(exports.PROFILE_STORAGE_KEY);
    if (current)
        return normalizeProfile(current);
    const legacy = readJsonStorage(exports.LEGACY_PROFILE_STORAGE_KEY);
    return legacy ? normalizeProfile(legacy) : null;
}
function readStoredProfileUi() {
    const profile = readStoredProfile();
    return profile ? profileToUiFields(profile) : null;
}
function writeStoredProfile(profileInput) {
    if (typeof window === "undefined")
        return normalizeProfile(profileInput);
    const normalized = normalizeProfile(profileInput);
    const payload = profileToStorage(normalized);
    try {
        window.localStorage.setItem(exports.PROFILE_STORAGE_KEY, JSON.stringify(payload));
        window.dispatchEvent(new CustomEvent(exports.PROFILE_UPDATED_EVENT, {
            detail: payload,
        }));
    }
    catch (_a) {
        // localStorage can be unavailable in restricted browser contexts.
    }
    return normalized;
}
function patchStoredProfile(patch) {
    var _a;
    const current = profileToStorage((_a = readStoredProfile()) !== null && _a !== void 0 ? _a : emptyCanonicalProfile());
    const patchRecord = asRecord(patch);
    const expandedPatch = Object.assign({}, patchRecord);
    if ("profile_image_url" in patchRecord) {
        expandedPatch.profileImageUrl = patchRecord.profile_image_url;
        expandedPatch.image_url = patchRecord.profile_image_url;
        expandedPatch.image = patchRecord.profile_image_url;
    }
    if ("voice_profile_url" in patchRecord) {
        expandedPatch.voiceProfileUrl = patchRecord.voice_profile_url;
        expandedPatch.voice_url = patchRecord.voice_profile_url;
        expandedPatch.voiceUrl = patchRecord.voice_profile_url;
    }
    if ("video_url" in patchRecord) {
        expandedPatch.videoUrl = patchRecord.video_url;
        expandedPatch.videoPresentation = patchRecord.video_url;
    }
    if ("favorite_movie" in patchRecord) {
        expandedPatch.favoriteMovie = patchRecord.favorite_movie;
        expandedPatch.favorite_film = patchRecord.favorite_movie;
        expandedPatch.favoriteFilm = patchRecord.favorite_movie;
    }
    if ("personal_thought" in patchRecord) {
        expandedPatch.personalThought = patchRecord.personal_thought;
        expandedPatch.prompt = patchRecord.personal_thought;
    }
    return writeStoredProfile(Object.assign(Object.assign({}, current), expandedPatch));
}
function canonicalProfileToDbInput(profileInput) {
    const profile = normalizeProfile(profileInput);
    return {
        first_name: profile.name || null,
        name: profile.name || null,
        age: profile.age || null,
        city: profile.city || null,
        looking_for: profile.looking_for || null,
        contact_intent: profile.contact_intent || null,
        activity_interest: profile.activity_interest || null,
        interests: profile.interests,
        bio: profile.bio || null,
        prompt: profile.personal_thought || null,
        favorite_song: profile.favorite_song || null,
        favorite_film: profile.favorite_movie || null,
        favorite_book: profile.favorite_book || null,
        image_url: profile.profile_image_url || null,
        voice_url: profile.voice_profile_url || null,
        video_url: profile.video_url || null,
    };
}
