"use client";

import { useState } from "react";

interface Props { onDone: () => void; }

export default function AuthOverlay({ onDone }: Props) {
  const [view, setView] = useState<"signin" | "create">("signin");

  return (
    <div className="auth-overlay" role="dialog" aria-label="Sign in to rekindle" aria-modal="true">
      <div style={{ textAlign: "center", marginBottom: 32, marginTop: 20 }}>
        <div className="auth-logo">rekindle</div>
        <div className="auth-tagline">Turn people you meet into real plans.</div>
      </div>

      {view === "signin" ? (
        <>
          <input className="auth-input" type="email" placeholder="Email" aria-label="Email address" />
          <input className="auth-input" type="password" placeholder="Password" aria-label="Password" />
          <button className="btn btn-primary" onClick={onDone} style={{ marginBottom: 10 }}>Sign in</button>
          <div className="auth-divider">or</div>
          <div className="auth-social">
            <button onClick={onDone} aria-label="Continue with Apple">🍎 Apple</button>
            <button onClick={onDone} aria-label="Continue with Google">🔵 Google</button>
          </div>
          <div className="auth-footer">
            No account? <a onClick={() => setView("create")}>Create one</a>
            {" · "}
            <a onClick={onDone}>Demo mode</a>
          </div>
        </>
      ) : (
        <>
          <input className="auth-input" type="text" placeholder="Your name" aria-label="Your name" />
          <input className="auth-input" type="email" placeholder="Email" aria-label="Email address" />
          <input className="auth-input" type="password" placeholder="Password (8+ chars)" aria-label="Password" />
          <button className="btn btn-primary" onClick={onDone} style={{ marginBottom: 10 }}>Create account</button>
          <div className="auth-footer">
            <a onClick={() => setView("signin")}>← Back to sign in</a>
          </div>
        </>
      )}

      <p style={{ fontSize: 11, color: "var(--ink-soft)", textAlign: "center", marginTop: "auto", lineHeight: 1.5 }}>
        By continuing you agree to our{" "}
        <a href="#" style={{ color: "var(--accent)" }}>Privacy Policy</a>{" "}and{" "}
        <a href="#" style={{ color: "var(--accent)" }}>Terms</a>.
      </p>
    </div>
  );
}
