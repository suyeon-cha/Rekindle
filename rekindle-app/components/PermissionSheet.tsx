"use client";

interface Props {
  onAllow: () => void;
  onDeny: () => void;
}

export default function PermissionSheet({ onAllow, onDeny }: Props) {
  return (
    <div className="perm-sheet" role="dialog" aria-modal="true" aria-label="Location permission">
      <div className="perm-inner">
        <div className="perm-icon">📍</div>
        <h3>Events near you</h3>
        <p>rekindle uses your location to surface events happening nearby — so suggestions feel relevant, not random.</p>
        <button className="btn btn-primary" onClick={onAllow} style={{ marginBottom: 10 }}>
          Allow location access
        </button>
        <button className="btn btn-ghost" onClick={onDeny}>Not now</button>
      </div>
    </div>
  );
}
