import { readJsonFile, writeJsonFile } from "./json-store";

export interface Subscriber {
  name: string;
  email: string;
  createdAt: string;
}

const FILE = "subscribers.json";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function addSubscriber(name: string, email: string): { ok: true } | { ok: false; message: string } {
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedName.length < 2) return { ok: false, message: "נא למלא שם מלא." };
  if (!EMAIL.test(trimmedEmail)) return { ok: false, message: "נא למלא כתובת מייל תקינה." };

  const list = readJsonFile<Subscriber[]>(FILE, []);
  if (list.some((item) => item.email === trimmedEmail)) {
    return { ok: false, message: "כתובת המייל כבר רשומה לקלאב." };
  }

  list.push({ name: trimmedName, email: trimmedEmail, createdAt: new Date().toISOString() });
  writeJsonFile(FILE, list);
  return { ok: true };
}
