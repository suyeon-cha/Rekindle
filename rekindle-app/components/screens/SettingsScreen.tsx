"use client";

import { useState } from "react";
import { AppCtx } from "@/lib/types";

interface Props { ctx: AppCtx; }

export default function SettingsScreen({ ctx }: Props) {
  const [notifMatch, setNotifMatch] = useState(true);
  const [notifNudge, setNotifNudge] = useState(true);
  const [notifReminder, setNotifReminder] = useState(false);

  return (
    <main className="screen active" aria-label="Settings">
      <button className="back" onClick={() => ctx.back()}>‹ Back</button>
      <div className="eyebrow">Preferences</div>
      <h1 className="h1" style={{ margin: "6px 0 18px" }}>Settings</h1>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Notifications</div>
      <div className="settings-section">
        {[
          { label: "Event matches", sub: "When rekindle finds a new match", val: notifMatch, set: setNotifMatch },
          { label: "Reconnect nudges", sub: "When you haven't reached out in a while", val: notifNudge, set: setNotifNudge },
          { label: "Event reminders", sub: "Day-before reminder for plans you've set", val: notifReminder, set: setNotifReminder },
        ].map(({ label, sub, val, set }) => (
          <div key={label} className="settings-row" onClick={() => { set(p => !p); ctx.toast(`${label}: ${!val ? "on" : "off"}`); }}>
            <div><div className="s-label">{label}</div><div className="s-sub">{sub}</div></div>
            <span className={`toggle${val ? " on" : ""}`} role="switch" aria-checked={val} tabIndex={0} aria-label={label} />
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Privacy</div>
      <div className="settings-section">
        {[
          { label: "Privacy policy", action: () => ctx.toast("Opening privacy policy…") },
          { label: "Export my data", action: () => ctx.toast("Preparing your data export…") },
          { label: "Delete my data", action: () => ctx.toast("Opening data deletion request…") },
        ].map(({ label, action }) => (
          <div key={label} className="settings-row" onClick={action}>
            <div className="s-label">{label}</div><span className="s-arrow">›</span>
          </div>
        ))}
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>People</div>
      <div className="settings-section">
        <div className="settings-row" onClick={() => ctx.toast("Hidden people: none")}>
          <div className="s-label">Hidden people</div><span className="s-arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => ctx.toast("Blocked: none")}>
          <div className="s-label">Blocked</div><span className="s-arrow">›</span>
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Support</div>
      <div className="settings-section">
        <div className="settings-row" onClick={ctx.showFeedback}>
          <div className="s-label">Send feedback</div><span className="s-arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => ctx.toast("Opening help centre…")}>
          <div className="s-label">Help centre</div><span className="s-arrow">›</span>
        </div>
        <div className="settings-row" onClick={() => ctx.toast("rekindle v0.1 · Cascadia AI Hackathon 2026")}>
          <div className="s-label">About rekindle</div><span className="s-arrow">›</span>
        </div>
      </div>

      <div className="eyebrow" style={{ marginBottom: 8 }}>Account</div>
      <div className="danger-zone">
        <div className="settings-row" onClick={() => ctx.toast("Signing out…")}>
          <div className="s-label" style={{ color: "#c0392b" }}>Sign out</div><span className="s-arrow" style={{ color: "#c0392b" }}>›</span>
        </div>
        <div className="settings-row" onClick={() => { if (confirm("Delete your account? This removes all your memories and cannot be undone.")) ctx.toast("Account deletion requested."); }}>
          <div className="s-label" style={{ color: "#c0392b" }}>Delete account</div><span className="s-arrow" style={{ color: "#c0392b" }}>›</span>
        </div>
      </div>

      <div className="you-ver">rekindle v0.1 · Cascadia AI Hackathon 2026</div>
    </main>
  );
}
