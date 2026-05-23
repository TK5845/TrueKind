export type ContactIntent =
  | "Kärlek"
  | "Vänskap"
  | "Aktivitet"
  | "Virtuell kaffe"
  | "";

export type ActivityInterest =
  | "Fotbollsmatch"
  | "Konsert"
  | "Träning"
  | "Bokprat"
  | "Virtuell kaffe"
  | "";

export type ProfileData = {
  id?: string;
  name: string;
  age: string;
  city: string;
  lookingFor: string;
  looking_for?: string;
  interests: string[];
  bio: string;
  prompt: string;
  personal_thought?: string;
  image?: string;
  image_url?: string;
  profile_image_url?: string;

  contactIntent?: ContactIntent | string;
  contact_intent?: ContactIntent | string;
  activityInterest?: ActivityInterest | string;
  activity_interest?: ActivityInterest | string;
  favoriteSong?: string;
  favorite_song?: string;
  favoriteFilm?: string;
  favoriteMovie?: string;
  favorite_film?: string;
  favorite_movie?: string;
  favoriteBook?: string;
  favorite_book?: string;
  videoPresentation?: string;
  video_url?: string;
  voiceUrl?: string;
  voice_url?: string;
  voice_profile_url?: string;
  created_at?: string;
  updated_at?: string;
};

export type ChatMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  createdAt: string;
};
