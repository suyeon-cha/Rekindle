"use client";

import { useState } from "react";
import { AppCtx } from "@/lib/types";
import { getPersonColor } from "@/lib/adapters";

interface Props { ctx: AppCtx; }

export default function PeopleScreen({ ctx }: Props) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const allInterests = [...new Set(ctx.people.flatMap(p => p.interests))].slice(0, 8);

  const filtered = ctx.people.filter(p => {
    const q = query.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q) || p.interests.join(" ").toLowerCase().includes(q);
    const matchF = !activeFilter || p.interests.includes(activeFilter);
    return matchQ && matchF;
  });

  return (
    <main className="screen active" aria-label="People you've logged">
      <div className="eyebrow">Your people</div>
      <h1 className="h1" style={{ margin: "6px 0 14px" }}>Memory</h1>

      <input
        className="search"
        type="search"
        placeholder="Search by name or interest…"
        value={query}
        onChange={e => setQuery(e.target.value)}
        aria-label="Search your people"
      />

      <div className="filter-chips" role="group" aria-label="Filter by interest">
        {allInterests.map(i => (
          <button
            key={i}
            className={`fchip${activeFilter === i ? " on" : ""}`}
            aria-pressed={activeFilter === i}
            onClick={() => setActiveFilter(prev => prev === i ? null : i)}
          >
            {i}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 18px" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <p className="muted">No matches. Try another name or interest.</p>
        </div>
      ) : (
        filtered.map(p => (
          <div
            key={p.id}
            className="prow"
            role="button"
            tabIndex={0}
            aria-label={`View ${p.name}`}
            onClick={() => ctx.openPersonDetail(p.id)}
            onKeyDown={e => e.key === "Enter" && ctx.openPersonDetail(p.id)}
          >
            <span className="avatar" style={{ background: getPersonColor(p.name) }}>{p.name[0]}</span>
            <div className="meta">
              <div className="nm">{p.name}</div>
              <div className="sb">Met at {p.where_met} · {p.interests.slice(0, 2).join(", ")}</div>
            </div>
            <span className="pill">{p.relationship_goal ?? "stay in touch"}</span>
          </div>
        ))
      )}
    </main>
  );
}
