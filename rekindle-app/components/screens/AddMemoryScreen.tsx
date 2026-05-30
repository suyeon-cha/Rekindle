"use client";

import { useState } from "react";
import { addMemory } from "@/lib/api";
import { AppCtx } from "@/lib/types";

interface Props { ctx: AppCtx; }

interface Extracted { name: string; where: string; interests: string[]; project: string; city: string; goal: string; }

export default function AddMemoryScreen({ ctx }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [error, setError] = useState("");

  function simulateVoice() {
    setNote("Robert from CascadiaJS. Loves tennis, into AI and hackathons, building an AI map tool. Lives in Seattle. Want to stay in touch.");
    ctx.toast("Transcribed your note");
  }

  async function handleExtract() {
    if (!note.trim()) { ctx.toast("Add a note first"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await addMemory({ user_id: "user_maya", raw_note: note });
      const p = data.person;
      setExtracted({
        name: p.name,
        where: p.where_met ?? "",
        interests: p.interests ?? [],
        project: p.projects?.[0] ?? "",
        city: p.location ?? "",
        goal: p.relationship_goal ?? "",
      });
      ctx.addPerson(p);
    } catch (e: any) {
      setError(e.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    ctx.toast(`Saved ${extracted?.name} ✓`);
    setNote("");
    setExtracted(null);
    ctx.showScreen("people");
  }

  return (
    <main className="screen active" aria-label="Add a person to memory">
      <button className="back" onClick={() => ctx.back()}>‹ Back</button>
      <div className="eyebrow">New memory</div>
      <h1 className="h1" style={{ margin: "6px 0 4px" }}>Who did you meet?</h1>
      <p className="muted" style={{ fontSize: 14, marginBottom: 6 }}>Say or type it however it comes out — rekindle will tidy it up.</p>

      <button className="mic" onClick={simulateVoice}>
        <svg viewBox="0 0 24 24" style={{ width: 19, height: 19, stroke: "var(--accent-d)", fill: "none", strokeWidth: 2 }}>
          <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
        </svg>
        Hold to talk (demo)
      </button>

      <label className="eyebrow" style={{ display: "block", marginBottom: 6 }}>Or type a note</label>
      <textarea
        className="memo"
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="e.g. Robert from CascadiaJS. Loves tennis, into AI, building an AI map tool. Want to stay in touch."
      />

      {error && <p style={{ color: "var(--accent)", fontSize: 13, marginTop: 8 }}>{error}</p>}

      {!extracted && (
        <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleExtract} disabled={loading}>
          {loading ? (
            <div className="thinking-dots"><span /><span /><span /></div>
          ) : "Let rekindle structure it ✦"}
        </button>
      )}

      {loading && !extracted && (
        <div className="thinking" style={{ marginTop: 14 }}>
          <div className="thinking-dots"><span /><span /><span /></div>
          <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>rekindle is structuring your note…</span>
        </div>
      )}

      {extracted && (
        <div>
          <div className="eyebrow" style={{ margin: "18px 0 6px" }}>Review before saving</div>
          <div className="preview">
            <div className="pfield"><div className="lbl">Name</div><div className="val">{extracted.name}</div></div>
            {extracted.where && <div className="pfield"><div className="lbl">Where you met</div><div className="val">{extracted.where}</div></div>}
            {extracted.interests.length > 0 && <div className="pfield"><div className="lbl">Interests</div><div className="val">{extracted.interests.join(" · ")}</div></div>}
            {extracted.project && <div className="pfield"><div className="lbl">Project</div><div className="val">{extracted.project}</div></div>}
            {extracted.city && <div className="pfield"><div className="lbl">City</div><div className="val">{extracted.city}</div></div>}
            {extracted.goal && <div className="pfield"><div className="lbl">Goal</div><div className="val">{extracted.goal}</div></div>}
          </div>
          <p className="editnote">Tap any field to edit before saving. (demo: editing is mocked)</p>
          <button className="btn btn-go" style={{ marginTop: 12 }} onClick={handleSave}>Save to my people</button>
        </div>
      )}
    </main>
  );
}
