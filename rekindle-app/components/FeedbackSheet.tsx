"use client";

import { useState } from "react";

interface Props {
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

export default function FeedbackSheet({ onClose, onSubmit }: Props) {
  const [rating, setRating] = useState(0);

  return (
    <div className="perm-sheet" role="dialog" aria-modal="true" aria-label="Rate rekindle">
      <div className="perm-inner">
        <div className="perm-icon">⭐</div>
        <h3>Enjoying rekindle?</h3>
        <p>Your rating helps us improve and reach more people who want to stay connected.</p>
        <div className="feedback-stars" role="group" aria-label="Star rating">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              className={rating >= n ? "on" : ""}
              onClick={() => setRating(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              ⭐
            </button>
          ))}
        </div>
        <button className="btn btn-primary" onClick={() => onSubmit(rating)} style={{ marginBottom: 10 }}>
          Submit rating
        </button>
        <button className="btn btn-ghost" onClick={onClose}>Not now</button>
      </div>
    </div>
  );
}
