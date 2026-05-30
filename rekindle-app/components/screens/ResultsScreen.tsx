"use client";

import { useRef, useState, useEffect } from "react";
import { AppCtx, UICard } from "@/lib/types";

interface Props { ctx: AppCtx; }

export default function ResultsScreen({ ctx }: Props) {
  const [deck, setDeck] = useState<UICard[]>([]);
  const [history, setHistory] = useState<UICard[]>([]);
  const triggerFlick = useRef<((dir: 1 | -1) => void) | null>(null);

  useEffect(() => {
    setDeck(ctx.resultsCards.filter(c => c.status !== "dismissed"));
    setHistory([]);
  }, [ctx.resultsCards]);

  function handleFlick(card: UICard, dir: 1 | -1) {
    setHistory(prev => [...prev, card]);
    setDeck(prev => prev.filter(c => c.id !== card.id));
    ctx.addToPipeline(card);
    if (dir === 1) ctx.openMessage(card);
  }

  function handleUndo() {
    if (!history.length) { ctx.toast("Nothing to undo"); return; }
    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setDeck(prev => [...prev, last]);
    ctx.toast("Restored");
  }

  const MODE_LABELS: Record<string, string> = {
    person_first: "Get closer to someone",
    event_first: "Who to invite",
    calendar_trigger: "From your calendar",
    visit_mode: "People near you",
  };
  const modeLabel = (ctx.resultsMode ? MODE_LABELS[ctx.resultsMode] : null) ?? ctx.resultsTitle;

  return (
    <main className="screen active" aria-label="Suggested opportunities">
      <button className="back" onClick={() => ctx.back()}>‹ Back</button>
      <div className="eyebrow">{modeLabel}</div>
      <h2 className="h2" style={{ margin: "4px 0 4px" }}>{ctx.resultsTitle}</h2>

      {ctx.resultsLoading ? (
        <>
          <div className="thinking">
            <div className="thinking-dots"><span /><span /><span /></div>
            <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>Finding the right people…</span>
          </div>
          <div className="skel-card skeleton" />
          <div className="skel-card skeleton" style={{ opacity: 0.5 }} />
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 13, marginBottom: 4 }}>Swipe right to open · left to set aside · or use the buttons.</p>
          <div className="deckwrap">
            {deck.length === 0 ? (
              <div className="empty">
                <div className="big">✦</div>
                <div className="h2" style={{ margin: "10px 0 6px" }}>All caught up</div>
                <p className="muted">Add more people, or try another mode.</p>
                <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => ctx.showScreen("home")}>Back to Today</button>
              </div>
            ) : (
              deck.map((card, i) => (
                <SwipeCard
                  key={card.id}
                  card={card}
                  isTop={i === deck.length - 1}
                  stackIndex={deck.length - 1 - i}
                  onFlick={handleFlick}
                  registerFlick={i === deck.length - 1 ? (fn) => { triggerFlick.current = fn; } : undefined}
                />
              ))
            )}
          </div>

          {deck.length > 0 && (
            <div className="deckbtns">
              <button className="round sm undo-btn" onClick={handleUndo} aria-label="Undo">
                <svg viewBox="0 0 24 24" stroke="#9A7420"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-1" /></svg>
              </button>
              <button className="round lg later-btn" onClick={() => triggerFlick.current?.(-1)} aria-label="Set aside">
                <svg viewBox="0 0 24 24" stroke="#8C8273"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
              <button className="round lg meet-btn" onClick={() => triggerFlick.current?.(1)} aria-label="Open invite">
                <svg viewBox="0 0 24 24" stroke="#fff"><path d="M20 6 9 17l-5-5" /></svg>
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}

interface SwipeCardProps {
  card: UICard;
  isTop: boolean;
  stackIndex: number;
  onFlick: (card: UICard, dir: 1 | -1) => void;
  registerFlick?: (fn: (dir: 1 | -1) => void) => void;
}

function SwipeCard({ card, isTop, stackIndex, onFlick, registerFlick }: SwipeCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; dx: number } | null>(null);
  const [tone, setTone] = useState<"warm" | "casual" | "brief">("warm");
  const scale = 1 - stackIndex * 0.04;
  const ty = stackIndex * 10;

  function flick(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    el.style.transition = "transform .35s ease";
    el.style.transform = `translateX(${dir * 600}px) rotate(${dir * 28}deg)`;
    const stamp = el.querySelector<HTMLElement>(dir > 0 ? ".stamp.meet" : ".stamp.later");
    if (stamp) stamp.style.opacity = "1";
    setTimeout(() => onFlick(card, dir), 340);
  }

  useEffect(() => {
    registerFlick?.(flick);
  });

  const baseTransform = `scale(${scale}) translateY(${ty}px)`;

  return (
    <div
      ref={ref}
      className="swipe"
      style={{ zIndex: 10 - stackIndex, transform: baseTransform }}
      onPointerDown={isTop ? e => {
        if ((e.target as Element).closest(".no-drag")) return;
        drag.current = { startX: e.clientX, dx: 0 };
        e.currentTarget.setPointerCapture(e.pointerId);
        e.currentTarget.style.transition = "none";
      } : undefined}
      onPointerMove={isTop ? e => {
        if (!drag.current) return;
        const dx = e.clientX - drag.current.startX;
        drag.current.dx = dx;
        e.currentTarget.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
        const meet = e.currentTarget.querySelector<HTMLElement>(".stamp.meet");
        const later = e.currentTarget.querySelector<HTMLElement>(".stamp.later");
        if (meet) meet.style.opacity = String(Math.max(0, dx / 120));
        if (later) later.style.opacity = String(Math.max(0, -dx / 120));
      } : undefined}
      onPointerUp={isTop ? e => {
        if (!drag.current) return;
        const dx = drag.current.dx;
        drag.current = null;
        if (Math.abs(dx) > 110) {
          flick(dx > 0 ? 1 : -1);
        } else {
          e.currentTarget.style.transition = "transform .25s ease";
          e.currentTarget.style.transform = baseTransform;
          e.currentTarget.querySelectorAll<HTMLElement>(".stamp").forEach(s => (s.style.opacity = "0"));
        }
      } : undefined}
    >
      <div className="stamp meet" aria-hidden="true">OPEN</div>
      <div className="stamp later" aria-hidden="true">LATER</div>
      <div className="hd">
        <span className="avatar" style={{ background: card.personColor, width: 42, height: 42, fontSize: 17 }}>
          {card.personName[0]}
        </span>
        <div>
          <div className="nm">{card.personName}</div>
          <div className="sb">{card.event}</div>
        </div>
        <span className="pill timer no-drag" style={{ marginLeft: "auto" }}>⏳ {card.timer}</span>
      </div>
      <div className="draftlbl">✦ Here&apos;s what you could send</div>
      <div className="draft">{card.drafts[tone]}</div>
      <div className="tonechips no-drag" role="group" aria-label="Tone">
        {(["warm", "casual", "brief"] as const).map(t => (
          <button key={t} className="tc" aria-pressed={tone === t} onClick={e => { e.stopPropagation(); setTone(t); }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="context-line">
        💡 <span><b>Why this:</b> {card.whyPerson}</span>
      </div>
    </div>
  );
}
