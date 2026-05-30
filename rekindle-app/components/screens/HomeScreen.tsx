"use client";

import { useState } from "react";
import {
  Bell,
  CalendarDays,
  Clock3,
  Plus,
  SendHorizontal,
  Sparkles,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import { AppCtx, UICard } from "@/lib/types";

interface Props { ctx: AppCtx; }

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date());

export default function HomeScreen({ ctx }: Props) {
  const [intent, setIntent] = useState("");
  const [notifDismissed, setNotifDismissed] = useState(false);

  function handleIntent() {
    const v = intent.trim().toLowerCase();
    if (!v) return;
    const lv = v.toLowerCase();
    if (lv.includes("event") || lv.includes("go to") || lv.includes("want to do")) {
      ctx.startSearch({ mode: "event_first", intent: intent.trim() });
    } else if (lv.includes("seattle") || lv.includes("visit") || lv.includes("city")) {
      ctx.startSearch({ mode: "visit_mode", city: "Seattle" });
    } else if (lv.includes("calendar") || lv.includes("tennis") || lv.includes("hiking")) {
      ctx.startSearch({ mode: "calendar_trigger", calendarEvent: { title: intent.trim(), date: new Date().toISOString().split("T")[0], time: "5:00 PM", city: "Seattle" } });
    } else {
      ctx.startSearch({ mode: "event_first", intent: intent.trim() });
    }
    setIntent("");
  }

  const noticedCards = ctx.noticedCards.slice(0, 2);

  return (
    <main className="screen active" aria-label="Today">
      <header className="home-hero">
        <div>
          <div className="eyebrow">{weekday} · Seattle</div>
          <h1 className="h1">Hi, Maya.</h1>
        </div>
        <button className="home-hero-action" onClick={ctx.showFeedback} aria-label="Give feedback">
          <Sparkles size={18} aria-hidden="true" />
        </button>
      </header>

      <section className="intent-card" aria-label="Find a reconnection">
        <div className="intent-copy">
          <span className="intent-kicker">What sounds good?</span>
          <p>Type a person, place, or plan and Rekindle will find a warm next step.</p>
        </div>
        <div className="intent-bar">
          <input
            className="intent-input"
            value={intent}
            onChange={e => setIntent(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleIntent()}
            placeholder="Coffee with Priya, a Seattle show..."
            aria-label="Intent"
          />
          <button className="intent-btn" onClick={handleIntent} aria-label="Search">
            <SendHorizontal size={19} aria-hidden="true" />
          </button>
        </div>
      </section>

      {!notifDismissed && (
        <div className="notif-nudge">
          <div className="nn-icon"><Bell size={18} aria-hidden="true" /></div>
          <div className="nn-text">
            <div className="nn-title">Timely nudges</div>
            <div className="nn-sub">Get a heads up when an event matches someone you know.</div>
          </div>
          <button className="nn-btn" onClick={() => { setNotifDismissed(true); ctx.toast("Notifications enabled"); }}>Enable</button>
          <button className="nn-close" onClick={() => setNotifDismissed(true)} aria-label="Dismiss">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="home-section-label">Start with</div>
      <div className="entry-row">
        <button className="entry-btn" onClick={() => ctx.startSearch({ mode: "person_first", personId: ctx.people[0]?.id })} aria-label="See someone specific">
          <span className="e-icon"><UserRound size={18} aria-hidden="true" /></span>
          <div className="e-title">See someone</div>
          <div className="e-sub">Pick a person first</div>
        </button>
        <button className="entry-btn" onClick={() => ctx.startSearch({ mode: "event_first", intent: "I want to go to something interesting" })} aria-label="Have a plan">
          <span className="e-icon"><Ticket size={18} aria-hidden="true" /></span>
          <div className="e-title">Have a plan</div>
          <div className="e-sub">Find who fits</div>
        </button>
        <button className="entry-btn entry-wide" onClick={() => ctx.showScreen("add")} aria-label="Add someone you've met">
          <span className="e-icon"><Plus size={18} aria-hidden="true" /></span>
          <div>
            <div className="e-title">Add someone new</div>
            <div className="e-sub">Capture a quick memory before it fades</div>
          </div>
        </button>
      </div>

      <div className="noticed-head">
        <span className="dot" />
        <span>Rekindle noticed</span>
      </div>

      {ctx.noticedLoading ? (
        <>
          <div className="skel-card skeleton" />
          <div className="skel-card skeleton" />
        </>
      ) : noticedCards.length === 0 ? (
        <div style={{ padding: "16px 0", color: "var(--ink-soft)", fontSize: 14 }}>
          No suggestions yet — try a mode above.
        </div>
      ) : (
        noticedCards.map(card => <NoticedCard key={card.id} card={card} ctx={ctx} />)
      )}

      {ctx.noticedCards.length > 2 && (
        <>
          <div className="sectiontitle more-suggestions">
            <h2 className="h2">More suggestions</h2>
            <button className="text-link" onClick={() => ctx.showScreen("pipeline")}>See all</button>
          </div>
          {ctx.noticedCards.slice(2).map(card => <NoticedCard key={card.id} card={card} ctx={ctx} />)}
        </>
      )}
    </main>
  );
}

function NoticedCard({ card, ctx }: { card: UICard; ctx: AppCtx }) {
  const ModeIcon = card.mode === "calendar_trigger" ? CalendarDays : card.mode === "visit_mode" ? Ticket : Sparkles;
  const modeLabel = card.mode === "calendar_trigger" ? "From your calendar" : card.mode === "visit_mode" ? "Visit Mode" : "Suggestion";

  return (
    <button className="ocard noticed-card" onClick={() => ctx.openMessage(card)}>
      <div className="top">
        <span className="avatar compact" style={{ background: card.personColor }}>
          {card.personName[0]}
        </span>
        <div className="ocard-person">
          <div className="ocard-name">{card.personName}</div>
          <div className="muted ocard-event">{card.event}</div>
        </div>
        <span className="pill timer"><Clock3 size={13} aria-hidden="true" /> {card.timer}</span>
      </div>
      <span className="pill warm mode-pill"><ModeIcon size={13} aria-hidden="true" /> {modeLabel}</span>
      <div className="draftlbl">Draft ready</div>
      <div className="msgquote"><span className="q">&ldquo;</span>{card.drafts.brief}<span className="q">&rdquo;</span></div>
    </button>
  );
}
