"use client";

import { createClient } from "../../utils/supabase/client";

export type DbProfileInput = {
  first_name?: string | null;
  name?: string | null;
  age?: string | null;
  city?: string | null;
  looking_for?: string | null;
  contact_intent?: string | null;
  activity_interest?: string | null;
  interests?: string[] | null;
  bio?: string | null;
  prompt?: string | null;
  personal_thought?: string | null;
  favorite_song?: string | null;
  favorite_film?: string | null;
  favorite_movie?: string | null;
  favorite_book?: string | null;
  image_url?: string | null;
  profile_image_url?: string | null;
  voice_url?: string | null;
  voice_profile_url?: string | null;
  video_url?: string | null;
};

export async function getCurrentUserProfile() {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { user: null, profile: null, error: userError };
    }

    if (!user) {
      return { user: null, profile: null, error: null };
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user,
      profile,
      error: profileError ?? null,
    };
  } catch (error) {
    return {
      user: null,
      profile: null,
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}

export async function upsertCurrentUserProfile(input: DbProfileInput) {
  try {
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return { error: userError };
    }

    if (!user) {
      return { error: new Error("Ingen inloggad användare.") };
    }

    const { data: existingProfile, error: existingError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existingError) {
      return { error: existingError };
    }

    const firstNameInput =
      input.first_name !== undefined ? input.first_name : input.name;
    const promptInput =
      input.personal_thought !== undefined
        ? input.personal_thought
        : input.prompt;
    const favoriteMovieInput =
      input.favorite_movie !== undefined
        ? input.favorite_movie
        : input.favorite_film;
    const imageUrlInput =
      input.profile_image_url !== undefined
        ? input.profile_image_url
        : input.image_url;
    const voiceUrlInput =
      input.voice_profile_url !== undefined
        ? input.voice_profile_url
        : input.voice_url;

    const payload = {
      id: user.id,
      email: user.email ?? existingProfile?.email ?? null,
      first_name:
        firstNameInput !== undefined
          ? firstNameInput
          : existingProfile?.first_name ?? null,
      name: input.name !== undefined ? input.name : existingProfile?.name ?? null,
      age: input.age !== undefined ? input.age : existingProfile?.age ?? null,
      city: input.city !== undefined ? input.city : existingProfile?.city ?? null,
      looking_for:
        input.looking_for !== undefined
          ? input.looking_for
          : existingProfile?.looking_for ?? null,
      contact_intent:
        input.contact_intent !== undefined
          ? input.contact_intent
          : existingProfile?.contact_intent ?? null,
      activity_interest:
        input.activity_interest !== undefined
          ? input.activity_interest
          : existingProfile?.activity_interest ?? null,
      interests:
        input.interests !== undefined
          ? input.interests
          : existingProfile?.interests ?? [],
      bio: input.bio !== undefined ? input.bio : existingProfile?.bio ?? null,
      prompt:
        promptInput !== undefined ? promptInput : existingProfile?.prompt ?? null,
      favorite_song:
        input.favorite_song !== undefined
          ? input.favorite_song
          : existingProfile?.favorite_song ?? null,
      favorite_film:
        favoriteMovieInput !== undefined
          ? favoriteMovieInput
          : existingProfile?.favorite_film ?? null,
      favorite_book:
        input.favorite_book !== undefined
          ? input.favorite_book
          : existingProfile?.favorite_book ?? null,
      image_url:
        imageUrlInput !== undefined
          ? imageUrlInput
          : existingProfile?.image_url ?? null,
      voice_url:
        voiceUrlInput !== undefined
          ? voiceUrlInput
          : existingProfile?.voice_url ?? null,
      video_url:
        input.video_url !== undefined
          ? input.video_url
          : existingProfile?.video_url ?? null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(payload);

    return { error: error ?? null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error("Unknown error"),
    };
  }
}
