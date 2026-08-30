import { HERO_H1, HERO_SUBTITLE } from "@/lib/site";

const WORDS = [
  { text: "דילסי", tone: "brand" },
  { text: "סורק", tone: "plain" },
  { text: "בשבילכם", tone: "plain" },
  { text: "את", tone: "plain" },
  { text: "הרשת", tone: "plain" },
  { text: "בזמן אמת", tone: "live" },
] as const;

export function HeroHeading() {
  return (
    <section className="hero-block mx-auto max-w-4xl text-center">
      <h1 className="hero-title font-display text-[2.15rem] font-bold leading-[1.15] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
        <span className="sr-only">{HERO_H1}</span>
        <span aria-hidden className="hero-title-row">
          {WORDS.map((word, index) => (
            <span
              key={word.text}
              className={`hero-word hero-word-${word.tone}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              {word.tone === "live" && <span className="hero-live-dot" />}
              {word.text}
            </span>
          ))}
          <span className="hero-scan" />
        </span>
      </h1>
      <p className="hero-sub mx-auto mt-4 max-w-2xl text-base leading-7 text-ink-soft sm:text-lg">{HERO_SUBTITLE}</p>
    </section>
  );
}
