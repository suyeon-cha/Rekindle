"use client";

import { useState } from "react";
import { AppCtx } from "@/lib/types";

interface Props { ctx: AppCtx; }

export default function MessageScreen({ ctx }: Props) {
  const card = ctx.currentCard;
  const [tone, setTone] = useState<"warm" | "casual" | "brief">("warm");
  const [msg, setMsg] = useState(card?.drafts.warm ?? "");
  const [sending, setSending] = useState(false);

  if (!card) return null;
  const c = card; // stable non-null reference for closures

  const confidencePct = Math.round(c.confidence * 100);

  async function handleSend() {
    setSending(true);
    try {
      await ctx.doMarkSent(c.id, c.personId, c.platform, msg);
      ctx.toast(`Opened ${c.platform} · added to Plans`);
      ctx.advancePipeline(c.id);
      setTimeout(() => ctx.showScreen("pipeline"), 700);
    } finally {
      setSending(false);
    }
  }

  function handleTone(t: "warm" | "casual" | "brief") {
    setTone(t);
    setMsg(c.drafts[t]);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(msg).catch(() => {});
    ctx.toast("Message copied");
  }

  return (
    <main className="screen active" aria-label="Review the invitation">
      <button className="back" onClick={() => ctx.back()}>‹ Back</button>

      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 6 }}>
        <span className="avatar" style={{ background: c.personColor }}>
          {c.personName[0]}
        </span>
        <div>
          <div className="eyebrow">Invite</div>
          <div className="h2">{c.personName}</div>
        </div>
      </div>

      <div className="infoline">
        <span className="pill go">📍 {c.event}</span>
        <span className="pill conf">{confidencePct}% match</span>
        <span className="pill timer">⏳ {c.timer}</span>
      </div>

      <div className="eyebrow" style={{ marginBottom: 6 }}>Tone</div>
      <div className="tonechips" role="group" aria-label="Message tone">
        {(["warm", "casual", "brief"] as const).map(t => (
          <button key={t} className="tc" aria-pressed={tone === t} onClick={() => handleTone(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <label className="eyebrow" style={{ display: "block", margin: "12px 0 6px" }}>Your message</label>
      <textarea
        className="editor"
        value={msg}
        onChange={e => setMsg(e.target.value)}
        aria-label="Editable invitation message"
      />

      <div className="meta-card">
        <div className="mrow"><span className="k">Why {c.personName}</span>{c.whyPerson}</div>
        {c.whyEvent && <div className="mrow"><span className="k">Why this</span>{c.whyEvent}</div>}
        {c.memory && <div className="mrow"><span className="k">From your memory</span>"{c.memory}"</div>}
        <div className="mrow"><span className="k">Data used</span>{c.dataUsed.join(" · ")}</div>
      </div>

      <div className="btn-row">
        <button className="btn btn-ghost" onClick={handleCopy}>Copy</button>
        <button className="btn btn-primary" onClick={handleSend} disabled={sending}>
          {sending ? "Sending…" : `Open in ${c.platform} →`}
        </button>
      </div>
      <p className="editnote" style={{ marginTop: 8 }}>
        Opens {c.platform} with the message ready. We never host the chat.
      </p>
    </main>
  );
}
