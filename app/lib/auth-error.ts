function getErrorMessage(error: unknown) {
  if (!error || typeof error !== "object") return "";
  const message = "message" in error ? error.message : "";
  return typeof message === "string" ? message.trim() : "";
}

export function formatAuthError(error: unknown, fallback: string) {
  const message = getErrorMessage(error);

  if (!message) return fallback;

  if (/invalid login credentials/i.test(message)) {
    return "E-post eller lösenord stämmer inte.";
  }

  if (/email not confirmed/i.test(message)) {
    return "Bekräfta din e-post innan du loggar in.";
  }

  if (/user already registered|already registered|already exists/i.test(message)) {
    return "Det finns redan ett konto med den e-posten. Prova att logga in.";
  }

  if (/api key|jwt|invalid key/i.test(message)) {
    return `${fallback} Supabase-nyckeln verkar vara fel i .env.local. Teknisk info: ${message}`;
  }

  return `${fallback} Teknisk info: ${message}`;
}
