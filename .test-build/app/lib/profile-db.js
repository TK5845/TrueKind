"use strict";
"use client";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUserProfile = getCurrentUserProfile;
exports.upsertCurrentUserProfile = upsertCurrentUserProfile;
const client_1 = require("../../utils/supabase/client");
async function getCurrentUserProfile() {
    try {
        const supabase = (0, client_1.createClient)();
        const { data: { user }, error: userError, } = await supabase.auth.getUser();
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
            error: profileError !== null && profileError !== void 0 ? profileError : null,
        };
    }
    catch (error) {
        return {
            user: null,
            profile: null,
            error: error instanceof Error ? error : new Error("Unknown error"),
        };
    }
}
async function upsertCurrentUserProfile(input) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
    try {
        const supabase = (0, client_1.createClient)();
        const { data: { user }, error: userError, } = await supabase.auth.getUser();
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
        const firstNameInput = input.first_name !== undefined ? input.first_name : input.name;
        const promptInput = input.personal_thought !== undefined
            ? input.personal_thought
            : input.prompt;
        const favoriteMovieInput = input.favorite_movie !== undefined
            ? input.favorite_movie
            : input.favorite_film;
        const imageUrlInput = input.profile_image_url !== undefined
            ? input.profile_image_url
            : input.image_url;
        const voiceUrlInput = input.voice_profile_url !== undefined
            ? input.voice_profile_url
            : input.voice_url;
        const payload = {
            id: user.id,
            email: (_b = (_a = user.email) !== null && _a !== void 0 ? _a : existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.email) !== null && _b !== void 0 ? _b : null,
            first_name: firstNameInput !== undefined
                ? firstNameInput
                : (_c = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.first_name) !== null && _c !== void 0 ? _c : null,
            name: input.name !== undefined ? input.name : (_d = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.name) !== null && _d !== void 0 ? _d : null,
            age: input.age !== undefined ? input.age : (_e = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.age) !== null && _e !== void 0 ? _e : null,
            city: input.city !== undefined ? input.city : (_f = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.city) !== null && _f !== void 0 ? _f : null,
            looking_for: input.looking_for !== undefined
                ? input.looking_for
                : (_g = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.looking_for) !== null && _g !== void 0 ? _g : null,
            contact_intent: input.contact_intent !== undefined
                ? input.contact_intent
                : (_h = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.contact_intent) !== null && _h !== void 0 ? _h : null,
            activity_interest: input.activity_interest !== undefined
                ? input.activity_interest
                : (_j = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.activity_interest) !== null && _j !== void 0 ? _j : null,
            interests: input.interests !== undefined
                ? input.interests
                : (_k = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.interests) !== null && _k !== void 0 ? _k : [],
            bio: input.bio !== undefined ? input.bio : (_l = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.bio) !== null && _l !== void 0 ? _l : null,
            prompt: promptInput !== undefined ? promptInput : (_m = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.prompt) !== null && _m !== void 0 ? _m : null,
            favorite_song: input.favorite_song !== undefined
                ? input.favorite_song
                : (_o = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.favorite_song) !== null && _o !== void 0 ? _o : null,
            favorite_film: favoriteMovieInput !== undefined
                ? favoriteMovieInput
                : (_p = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.favorite_film) !== null && _p !== void 0 ? _p : null,
            favorite_book: input.favorite_book !== undefined
                ? input.favorite_book
                : (_q = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.favorite_book) !== null && _q !== void 0 ? _q : null,
            image_url: imageUrlInput !== undefined
                ? imageUrlInput
                : (_r = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.image_url) !== null && _r !== void 0 ? _r : null,
            voice_url: voiceUrlInput !== undefined
                ? voiceUrlInput
                : (_s = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.voice_url) !== null && _s !== void 0 ? _s : null,
            video_url: input.video_url !== undefined
                ? input.video_url
                : (_t = existingProfile === null || existingProfile === void 0 ? void 0 : existingProfile.video_url) !== null && _t !== void 0 ? _t : null,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
            .from("profiles")
            .upsert(payload, { onConflict: "id" });
        return { error: error !== null && error !== void 0 ? error : null };
    }
    catch (error) {
        return {
            error: error instanceof Error ? error : new Error("Unknown error"),
        };
    }
}
