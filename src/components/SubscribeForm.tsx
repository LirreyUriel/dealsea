"use client";

import { useState } from "react";

export function SubscribeForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setStatus("error");
        setMessage(payload.message ?? "ההרשמה נכשלה. נסו שוב.");
        return;
      }
      setStatus("ok");
      setName("");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("ההרשמה נכשלה. נסו שוב.");
    }
  }

  return (
    <section id="subscribe" className="scroll-mt-28 rounded-3xl border border-black/5 bg-white px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl">
          <h2 className="font-display text-2xl font-semibold text-ink">הצטרפו לדילסי קלאב</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            הצטרפו לקלאב שמעדכן אתכם על דילים חדשים בזמן אמת ברשתות המלונאות המובילות בישראל
          </p>
        </div>
        {status === "ok" ? (
          <p className="rounded-2xl bg-sand px-4 py-3 text-sm text-ink">נרשמתם בהצלחה. נעדכן אתכם בדילים הבאים.</p>
        ) : (
          <form onSubmit={(event) => void onSubmit(event)} className="grid w-full max-w-xl gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <label className="sr-only" htmlFor="subscribe-name">
              שם
            </label>
            <input
              id="subscribe-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              placeholder="שם"
              autoComplete="name"
              className="rounded-2xl border border-black/8 bg-sand px-4 py-3 text-ink outline-none ring-sea/20 transition focus:bg-white focus:ring-4"
            />
            <label className="sr-only" htmlFor="subscribe-email">
              מייל
            </label>
            <input
              id="subscribe-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="מייל"
              autoComplete="email"
              className="rounded-2xl border border-black/8 bg-sand px-4 py-3 text-ink outline-none ring-sea/20 transition focus:bg-white focus:ring-4"
            />
            <button
              type="submit"
              disabled={status === "saving"}
              className="rounded-2xl bg-sea px-5 py-3 text-sm font-semibold text-white transition hover:bg-sea-dark disabled:opacity-60"
            >
              {status === "saving" ? "שולח..." : "נתראה!"}
            </button>
            {message && <p className="text-sm text-alert sm:col-span-3">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
