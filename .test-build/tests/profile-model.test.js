"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const profile_model_1 = require("../app/lib/profile-model");
(0, node_test_1.describe)("profile normalization", () => {
    (0, node_test_1.it)("normalizes old and new profile field names into canonical fields", () => {
        const profile = (0, profile_model_1.normalizeProfile)({
            firstName: "  Anna  ",
            age: "34",
            city: " Malmö ",
            lookingFor: "Djupare kontakt",
            interestsText: "musik, samtal,  närvaro ",
            bio: "Hej",
            contactIntent: "Kärlek",
            activityInterest: "Konsert",
            favoriteSong: "Låt",
            favoriteMovie: "Film",
            favoriteBook: "Bok",
            personalThought: "En tanke",
            image: "https://cdn.test/image.jpg",
            voiceUrl: "https://cdn.test/voice.webm",
            videoPresentation: "https://cdn.test/video.mp4",
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-02T00:00:00.000Z",
        }, {
            id: "user-1",
            user_metadata: {
                first_name: "Metadata namn",
            },
        });
        strict_1.default.deepEqual(profile, {
            id: "user-1",
            name: "Anna",
            age: "34",
            city: "Malmö",
            bio: "Hej",
            contact_intent: "Kärlek",
            activity_interest: "Konsert",
            interests: ["musik", "samtal", "närvaro"],
            favorite_song: "Låt",
            favorite_movie: "Film",
            favorite_book: "Bok",
            personal_thought: "En tanke",
            profile_image_url: "https://cdn.test/image.jpg",
            voice_profile_url: "https://cdn.test/voice.webm",
            created_at: "2026-01-01T00:00:00.000Z",
            updated_at: "2026-01-02T00:00:00.000Z",
            looking_for: "Djupare kontakt",
            video_url: "https://cdn.test/video.mp4",
        });
    });
    (0, node_test_1.it)("maps canonical profile into storage, UI, and DB-compatible shapes", () => {
        const canonical = (0, profile_model_1.normalizeProfile)({
            id: "user-1",
            name: "Anna",
            age: "34",
            city: "Malmö",
            looking_for: "Djupare kontakt",
            interests: ["musik", "samtal"],
            bio: "Hej",
            contact_intent: "Kärlek",
            activity_interest: "Konsert",
            favorite_song: "Låt",
            favorite_film: "Film",
            favorite_book: "Bok",
            prompt: "En tanke",
            image_url: "https://cdn.test/image.jpg",
            voice_url: "https://cdn.test/voice.webm",
            video_url: "https://cdn.test/video.mp4",
        });
        strict_1.default.equal((0, profile_model_1.hasProfileContent)(canonical), true);
        const storage = (0, profile_model_1.profileToStorage)(canonical);
        strict_1.default.equal(storage.lookingFor, "Djupare kontakt");
        strict_1.default.equal(storage.favoriteMovie, "Film");
        strict_1.default.equal(storage.favoriteFilm, "Film");
        strict_1.default.equal(storage.image, "https://cdn.test/image.jpg");
        strict_1.default.equal(storage.voiceUrl, "https://cdn.test/voice.webm");
        strict_1.default.equal(storage.videoPresentation, "https://cdn.test/video.mp4");
        strict_1.default.deepEqual((0, profile_model_1.profileToUiFields)(canonical), {
            name: "Anna",
            age: "34",
            city: "Malmö",
            lookingFor: "Djupare kontakt",
            interests: ["musik", "samtal"],
            bio: "Hej",
            prompt: "En tanke",
            image: "https://cdn.test/image.jpg",
            contactIntent: "Kärlek",
            activityInterest: "Konsert",
            favoriteSong: "Låt",
            favoriteFilm: "Film",
            favoriteBook: "Bok",
            videoPresentation: "https://cdn.test/video.mp4",
            voiceUrl: "https://cdn.test/voice.webm",
        });
        strict_1.default.deepEqual((0, profile_model_1.canonicalProfileToDbInput)(canonical), {
            first_name: "Anna",
            name: "Anna",
            age: "34",
            city: "Malmö",
            looking_for: "Djupare kontakt",
            contact_intent: "Kärlek",
            activity_interest: "Konsert",
            interests: ["musik", "samtal"],
            bio: "Hej",
            prompt: "En tanke",
            favorite_song: "Låt",
            favorite_film: "Film",
            favorite_book: "Bok",
            image_url: "https://cdn.test/image.jpg",
            voice_url: "https://cdn.test/voice.webm",
            video_url: "https://cdn.test/video.mp4",
        });
    });
    (0, node_test_1.it)("cleans profile interest lists from arrays and comma-separated text", () => {
        strict_1.default.deepEqual((0, profile_model_1.textToProfileList)([" musik ", "", "samtal", 42]), [
            "musik",
            "samtal",
        ]);
        strict_1.default.deepEqual((0, profile_model_1.textToProfileList)("musik, , samtal"), ["musik", "samtal"]);
    });
});
