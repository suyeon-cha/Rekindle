"use client";

import { useEffect, useState } from "react";
import { getPersonById } from "@/lib/api";
import { AppCtx, Person } from "@/lib/types";
import { getPersonColor } from "@/lib/adapters";

interface Props { ctx: AppCtx; }

export default function PersonDetailScreen({ ctx }: Props) {
  const [person, setPerson] = useState<Person | null>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ctx.detailPersonId) return;
    setLoading(true);
    getPersonById(ctx.detailPersonId)
      .then(({ person: p, memories: m }) => {
        setPerson(p);
        setMemories(m ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ctx.detailPersonId]);

  if (loading) {
    return (
      <main className="screen active">
        <button className="back" onClick={() => ctx.back()}>‹ Back</button>
        <div className="skel-card skeleton" />
        <div className="skel-card skeleton" style={{ opacity: 0.5 }} />
      </main>
    );
  }

  if (!person) return null;

  const color = getPersonColor(person.name);
  const memNote = memories[0]?.raw_note ?? "";
  const lastDate = person.last_interaction
    ? new Date(person.last_interaction).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Never";

  return (
    <main className="screen active" aria-label="Person detail">
      <button className="back" onClick={() => ctx.back()}>‹ Back</button>

      <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "10px 0 20px" }}>
        <span className="avatar" style={{ background: color, width: 56, height: 56, fontSize: 22 }}>{person.name[0]}</span>
        <div>
          <div className="h2">{person.name}</div>
          <div className="muted" style={{ fontSize: 13 }}>Met at {person.where_met} · {person.location}</div>
        </div>
      </div>

      <div className="int-chips" style={{ marginBottom: 14 }}>
        {person.interests.map(i => <span key={i} className="int-chip">{i}</span>)}
      </div>

      <div className="interaction-bar">
        <div className="ibar-item"><div className="ibar-n">{memories.length}</div><div className="ibar-l">memories</div></div>
        <div className="ibar-item"><div className="ibar-n">{person.priority === "high" ? "High" : person.priority === "medium" ? "Med" : "Low"}</div><div className="ibar-l">priority</div></div>
        <div className="ibar-item"><div className="ibar-n">{lastDate.split(" ")[0]}</div><div className="ibar-l">last contact</div></div>
      </div>

      {memNote && (
        <>
          <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Memory</div>
          <div style={{ background: "var(--paper-2)", border: "1px solid var(--line)", borderRadius: 14, padding: "12px 14px", fontSize: 14, lineHeight: 1.5, color: "var(--ink-soft)" }}>
            "{memNote}"
          </div>
        </>
      )}

      {person.projects && person.projects.length > 0 && (
        <>
          <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Projects</div>
          <div className="timeline">
            {person.projects.map((proj, i) => (
              <div key={i} className="tl-item">
                <div className="tl-dot" />
                <div className="tl-content"><div className="tl-text">{proj}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="eyebrow" style={{ margin: "16px 0 8px" }}>Goal</div>
      <p style={{ fontSize: 14, color: "var(--ink-soft)" }}>{person.relationship_goal ?? "Stay in touch"}</p>

      <button
        className="btn btn-primary"
        style={{ marginTop: 20 }}
        onClick={() => ctx.startSearch({ mode: "person_first", personId: person.id })}
      >
        ✦ Draft an invite for {person.name}
      </button>
      <button
        className="btn btn-ghost"
        style={{ marginTop: 10 }}
        onClick={() => ctx.toast(`${person.name} hidden from suggestions`)}
      >
        Hide from suggestions
      </button>
    </main>
  );
}
