"use client";

import { AppCtx } from "@/lib/types";
import { getPersonColor } from "@/lib/adapters";

interface Props { ctx: AppCtx; }

const STAGES: Array<[string, string]> = [
  ["suggested", "Suggested"],
  ["sent", "Sent"],
  ["plan_set", "Plan set"],
  ["reconnected", "Reconnected"],
];

export default function PipelineScreen({ ctx }: Props) {
  const entries = Object.values(ctx.pipeline);

  return (
    <main className="screen active" aria-label="Your plans">
      <div className="eyebrow">Outcomes, not chat</div>
      <h1 className="h1" style={{ margin: "6px 0 14px" }}>Plans</h1>

      {STAGES.map(([key, label]) => {
        const stageEntries = entries.filter(e => e.status === key);
        return (
          <div key={key} className="stage">
            <h3>{label} <span className="muted" style={{ fontSize: 13 }}>({stageEntries.length})</span></h3>
            {stageEntries.length === 0 ? (
              <p className="muted" style={{ fontSize: 13, padding: "2px 2px 6px" }}>—</p>
            ) : (
              stageEntries.map(({ card }) => (
                <div key={card.id} className="pcard">
                  <span className="avatar" style={{ background: getPersonColor(card.personName), width: 34, height: 34, fontSize: 14 }}>
                    {card.personName[0]}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{card.personName}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{card.event}</div>
                  </div>
                  <button
                    onClick={() => ctx.advancePipeline(card.id)}
                    style={{ background: "none", border: "1px solid var(--line)", borderRadius: 8, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", color: "var(--ink-soft)" }}
                  >
                    Update
                  </button>
                </div>
              ))
            )}
          </div>
        );
      })}

      {entries.length === 0 && (
        <div className="empty" style={{ paddingTop: 40 }}>
          <div className="big">📬</div>
          <div className="h2" style={{ margin: "10px 0 6px" }}>No plans yet</div>
          <p className="muted">Swipe right on a suggestion to start one.</p>
          <button className="btn btn-ghost" style={{ marginTop: 16 }} onClick={() => ctx.showScreen("home")}>Back to Today</button>
        </div>
      )}
    </main>
  );
}
