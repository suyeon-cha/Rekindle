"use client";

import { useState } from "react";

interface Props { onDone: () => void; }

const SLIDES = [
  {
    art: { from: "#f3d8c8", to: "#ecd9c6" },
    eyebrow: "1 · Remember",
    h2: "Met someone good? Just tell rekindle.",
    p: "Drop a quick voice or text note — who they are, what they're into. rekindle remembers the details you'd otherwise forget.",
  },
  {
    art: { from: "#ecd9c6", to: "#d6e6df" },
    eyebrow: "2 · Two ways in",
    h2: "Know the plan? Or know the person?",
    p: `Either works. "I'm going to an AI event — who should I bring?" or "I want to see Robert — what could we do?" rekindle handles both directions.`,
  },
  {
    art: { from: "#f3d8c8", to: "#d6e6df" },
    eyebrow: "3 · Get the invite, written for you",
    h2: "rekindle drafts the message.",
    p: "It explains the match, writes a warm invite, and you send it from the app you already use. No new chat to manage.",
  },
];

export default function OnboardingScreen({ onDone }: Props) {
  const [idx, setIdx] = useState(0);

  function next() {
    if (idx < SLIDES.length - 1) setIdx(idx + 1);
    else onDone();
  }

  const slide = SLIDES[idx];

  return (
    <div className="ob" role="dialog" aria-label="Welcome to rekindle" aria-modal="true">
      <button
        style={{ position: "absolute", top: 60, right: 24, background: "none", border: "none", color: "var(--ink-soft)", fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 44, padding: "0 6px" }}
        onClick={onDone}
      >
        Skip
      </button>

      {idx > 0 && (
        <button
          style={{ position: "absolute", top: 60, left: 24, background: "none", border: "none", color: "var(--ink-soft)", fontWeight: 700, fontSize: 14, cursor: "pointer", minHeight: 44, padding: "0 6px" }}
          onClick={() => setIdx(idx - 1)}
        >
          ‹ Back
        </button>
      )}

      <div className="ob-art" style={{ background: `linear-gradient(150deg, ${slide.art.from}, ${slide.art.to})` }}>
        <span style={{ fontSize: 64 }}>{idx === 0 ? "🧠" : idx === 1 ? "🎟️" : "✉️"}</span>
      </div>

      <div className="eyebrow">{slide.eyebrow}</div>
      <h2 style={{ fontFamily: "var(--display)", fontSize: 28, fontWeight: 600, lineHeight: 1.1, margin: "8px 0 10px" }}>{slide.h2}</h2>
      <p style={{ color: "var(--ink-soft)", fontSize: 15.5, lineHeight: 1.5 }}>{slide.p}</p>

      <div className="ob-dots" aria-hidden="true">
        {SLIDES.map((_, i) => <span key={i} className={i === idx ? "on" : ""} />)}
      </div>

      <div className="ob-nav">
        {idx > 0 && <button className="btn btn-ghost" onClick={() => setIdx(idx - 1)}>← Back</button>}
        <button className="btn btn-primary" onClick={next} style={{ flex: 1 }}>
          {idx === SLIDES.length - 1 ? "Get started" : "Next"}
        </button>
      </div>
    </div>
  );
}
