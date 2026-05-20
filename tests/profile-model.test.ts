import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canonicalProfileToDbInput,
  hasProfileContent,
  normalizeProfile,
  profileToStorage,
  profileToUiFields,
  textToProfileList,
} from "../app/lib/profile-model";

describe("profile normalization", () => {
  it("normalizes old and new profile field names into canonical fields", () => {
    const profile = normalizeProfile(
      {
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
      },
      {
        id: "user-1",
        user_metadata: {
          first_name: "Metadata namn",
        },
      }
    );

    assert.deepEqual(profile, {
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

  it("maps canonical profile into storage, UI, and DB-compatible shapes", () => {
    const canonical = normalizeProfile({
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

    assert.equal(hasProfileContent(canonical), true);

    const storage = profileToStorage(canonical);
    assert.equal(storage.lookingFor, "Djupare kontakt");
    assert.equal(storage.favoriteMovie, "Film");
    assert.equal(storage.favoriteFilm, "Film");
    assert.equal(storage.image, "https://cdn.test/image.jpg");
    assert.equal(storage.voiceUrl, "https://cdn.test/voice.webm");
    assert.equal(storage.videoPresentation, "https://cdn.test/video.mp4");

    assert.deepEqual(profileToUiFields(canonical), {
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

    assert.deepEqual(canonicalProfileToDbInput(canonical), {
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

  it("cleans profile interest lists from arrays and comma-separated text", () => {
    assert.deepEqual(textToProfileList([" musik ", "", "samtal", 42]), [
      "musik",
      "samtal",
    ]);
    assert.deepEqual(textToProfileList("musik, , samtal"), ["musik", "samtal"]);
  });
});
