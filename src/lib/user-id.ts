const STORAGE_KEY = "dealsea-user-id";

function createUserId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** First-party anonymous id, created once and persisted in localStorage. */
export function getOrCreateUserId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY)?.trim();
    if (existing) return existing;
    const userId = createUserId();
    window.localStorage.setItem(STORAGE_KEY, userId);
    return userId;
  } catch {
    return createUserId();
  }
}
