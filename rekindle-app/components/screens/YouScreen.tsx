"use client";

import { useState } from "react";
import { AppCtx } from "@/lib/types";

interface Props { ctx: AppCtx; }

const RECONNECTIONS = [0, 1, 2, 1, 4, 3, 5, 2, 3, 1, 2, 6];

function getWeekDates(): string[] {
  const today = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (11 - i) * 7);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });
}

function heatLevel(count: number): number {
  if (count >= 7) return 4;
  if (count >= 5) return 3;
  if (count >= 3) return 2;
  if (count >= 1) return 1;
  return 0;
}

export default function YouScreen({ ctx }: Props) {
  const [interests, setInterests] = useState(["AI", "tennis", "climbing", "design"]);
  const [locOn, setLocOn] = useState(true);
  const pipelineCount = Object.values(ctx.pipeline).filter(e => e.status === "reconnected").length;
  const sentCount = Object.values(ctx.pipeline).filter(e => ["sent", "plan_set", "reconnected"].includes(e.status)).length;
  const weekDates = getWeekDates();

  function addInterest() {
    const v = (prompt("Add an interest (e.g. running, photography)") ?? "").trim();
    if (v) { setInterests(prev => [...prev, v]); ctx.toast(`Added "${v}" to your interests`); }
  }

  return (
    <main className="screen active" aria-label="You">
      <div className="you-hero">
        <span className="avatar" style={{ background: "#23201A", width: 64, height: 64, fontSize: 26 }}>M</span>
        <div>
          <div className="h2">Maya Okafor</div>
          <div className="muted" style={{ fontSize: 13 }}>maya@example.com</div>
        </div>
        <button onClick={() => ctx.showScreen("settings")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "var(--ink-soft)", fontSize: 22 }} aria-label="Settings">⚙️</button>
      </div>

      <div className="stat-row" aria-label="Your rekindle stats">
        <div className="stat" onClick={() => ctx.showScreen("people")} role="button" tabIndex={0} aria-label={`${ctx.people.length} people logged`}>
          <span className="stat-n">{ctx.people.length}</span><span className="stat-l">logged</span>
        </div>
        <div className="stat" onClick={() => ctx.showScreen("pipeline")} role="button" tabIndex={0} aria-label={`${pipelineCount} met up`}>
          <span className="stat-n">{pipelineCount}</span><span className="stat-l">met up</span>
        </div>
        <div className="stat" onClick={() => ctx.showScreen("pipeline")} role="button" tabIndex={0} aria-label={`${sentCount} sent`}>
          <span className="stat-n">{sentCount}</span><span className="stat-l">sent</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="heatmap-wrap">
        <div className="heatmap-title">
          <span>Your reconnections</span>
          <span className="muted" style={{ fontSize: 12 }}>last 12 weeks</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14, lineHeight: 1.4 }}>
          Each square = 1 week. Darker color = more people you reached out to.
        </p>
        <div className="heatmap-weeks" aria-label="Weekly reconnection activity for the last 12 weeks">
          {RECONNECTIONS.map((count, i) => {
            const level = heatLevel(count);
            const label = count === 0 ? "No reconnections" : count === 1 ? "1 reconnection" : `${count} reconnections`;
            return (
              <div
                key={i}
                className={`hm-square${level > 0 ? ` l${level}` : ""}`}
                title={`Week of ${weekDates[i]}: ${label}`}
                role="img"
                aria-label={`Week of ${weekDates[i]}: ${label}`}
              />
            );
          })}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: "var(--ink-soft)" }}>
          <span>12 weeks ago</span>
          <span>Today</span>
        </div>
        <div className="heatmap-legend">
          <span style={{ fontSize: 11, color: "var(--ink-soft)", marginRight: 4 }}>Reconnections:</span>
          <div className="hm-square" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>0</span>
          <div className="hm-square l1" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>1-2</span>
          <div className="hm-square l2" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>3-4</span>
          <div className="hm-square l3" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>5-6</span>
          <div className="hm-square l4" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: 10, color: "var(--ink-soft)" }}>7+</span>
        </div>
        <div className="streak-row">
          <div className="streak-item"><div className="streak-n">3</div><div className="streak-l">week streak</div></div>
          <div className="streak-item"><div className="streak-n">7</div><div className="streak-l">this month</div></div>
          <div className="streak-item"><div className="streak-n">18</div><div className="streak-l">all time</div></div>
        </div>
      </div>

      {/* Interests */}
      <div className="eyebrow" style={{ marginBottom: 10 }}>
        Your interests <span className="muted" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· used to match events & people</span>
      </div>
      <div className="you-section" style={{ padding: "14px 16px" }}>
        <div className="int-chips">
          {interests.map((it, i) => (
            <span key={it} className="int-chip">
              {it}
              <button onClick={() => setInterests(prev => prev.filter((_, j) => j !== i))} aria-label={`Remove ${it}`}>×</button>
            </span>
          ))}
        </div>
        <button className="addint" onClick={addInterest}>＋ Add interest</button>
      </div>

      {/* Calendar */}
      <div className="eyebrow" style={{ marginBottom: 10 }}>Your calendar <span className="muted" style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>· your own plans</span></div>
      <div className="you-section">
        <div className="src-row" style={{ border: "none" }}>
          <div className="src-icon" style={{ background: "#4285f4" }}>G</div>
          <div className="meta"><div className="nm">Google Calendar</div><div className="sb">Your events, trips & free time</div></div>
          <span className="pill go">On</span>
        </div>
      </div>

      {/* Location */}
      <div className="eyebrow" style={{ marginBottom: 10 }}>Location</div>
      <div className="you-section">
        <div className="src-row" style={{ border: "none" }}>
          <div className="src-icon" style={{ background: "var(--go)" }}>📍</div>
          <div className="meta">
            <div className="nm">Share my location</div>
            <div className="sb">{locOn ? "On · showing events near Seattle" : "Off · events won't be filtered by distance"}</div>
          </div>
          <span
            className={`toggle${locOn ? " on" : ""}`}
            role="switch"
            aria-checked={locOn}
            tabIndex={0}
            aria-label="Share my location for nearby events"
            onClick={() => { setLocOn(p => !p); ctx.toast(locOn ? "Location off" : "Location on — nearby events prioritized"); }}
          />
        </div>
      </div>

      {/* Message channels */}
      <div className="eyebrow" style={{ marginBottom: 10 }}>Where messages go</div>
      <div className="you-section">
        <div className="src-row">
          <div className="src-icon" style={{ background: "#0a66c2", fontSize: 11 }}>in</div>
          <div className="meta"><div className="nm">LinkedIn</div><div className="sb">Login + send</div></div>
          <span className="pill go">On</span>
        </div>
        <div className="src-row">
          <div className="src-icon" style={{ background: "#c13584", fontSize: 11 }}>ig</div>
          <div className="meta"><div className="nm">Instagram</div><div className="sb">Login + send</div></div>
          <span className="pill go">On</span>
        </div>
        <div className="src-row">
          <div className="src-icon" style={{ background: "#34c759" }}>✉</div>
          <div className="meta"><div className="nm">Messages</div><div className="sb">SMS / iMessage</div></div>
          <span className="pill go">On</span>
        </div>
      </div>

      <button className="btn btn-go" style={{ marginBottom: 10 }} onClick={() => ctx.toast("Invite link copied — share it anywhere")}>🎁 Invite friends</button>
      <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={() => ctx.showScreen("settings")}>Settings</button>
      <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={ctx.showFeedback}>Rate rekindle</button>
      <button className="btn btn-ghost" style={{ marginBottom: 10 }} onClick={ctx.restartOnboarding}>Replay intro</button>
      <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.5, marginBottom: 14 }}>
        rekindle reads only what you log and your calendar. We discover public events via Apify. Messages go through apps you already use — no chat hosted here.
      </p>
      <div className="you-ver">rekindle v0.1 · Cascadia AI Hackathon 2026</div>
    </main>
  );
}
