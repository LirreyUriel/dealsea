import { readJsonFile, writeJsonFile } from "./json-store";

export interface Subscriber {
  userId: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

const FILE = "subscribers.json";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_ID = /^[\w-]{8,128}$/;

export function addSubscriber(input: {
  name?: string;
  email?: string;
  userId?: string;
}): { ok: true; entry: Subscriber } | { ok: false; message: string } {
  const trimmedName = (input.name ?? "").trim();
  const trimmedEmail = (input.email ?? "").trim().toLowerCase();
  const userId = (input.userId ?? "").trim();
  if (!USER_ID.test(userId)) return { ok: false, message: "חסר מזהה משתמש." };
  if (trimmedName.length < 2) return { ok: false, message: "נא למלא שם מלא." };
  if (!EMAIL.test(trimmedEmail)) return { ok: false, message: "נא למלא כתובת מייל תקינה." };

  const list = readJsonFile<Subscriber[]>(FILE, []);
  if (list.some((item) => item.email === trimmedEmail)) {
    return { ok: false, message: "כתובת המייל כבר רשומה לקלאב." };
  }

  const entry: Subscriber = {
    userId,
    name: trimmedName,
    email: trimmedEmail,
    message: `${userId}, ${trimmedName}, ${trimmedEmail}`,
    createdAt: new Date().toISOString(),
  };
  list.push(entry);
  writeJsonFile(FILE, list);
  return { ok: true, entry };
}
