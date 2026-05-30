"use client";

import clsx from "clsx";

export type AppMode = "person_first" | "event_first" | "calendar_trigger" | "visit_mode";

interface ModeOption {
  id: AppMode;
  emoji: string;
  label: string;
  description: string;
}

const MODES: ModeOption[] = [
  { id: "person_first",     emoji: "👤", label: "See someone",    description: "I want to reconnect with a specific person" },
  { id: "event_first",      emoji: "🎉", label: "Have an event",  description: "I want to go to something — who should I invite?" },
  { id: "calendar_trigger", emoji: "📅", label: "My calendar",    description: "I'm already doing something — who should join?" },
  { id: "visit_mode",       emoji: "✈️", label: "Visit Mode",     description: "I'm heading to a city — who's there?" },
];

interface Props {
  selected: AppMode;
  onChange: (mode: AppMode) => void;
}

export default function ModeSelector({ selected, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={clsx(
            "text-left p-3 rounded-xl border transition-all",
            selected === m.id
              ? "bg-violet-600/20 border-violet-500/50 text-white"
              : "bg-white/3 border-white/8 text-white/60 hover:bg-white/6 hover:border-white/15"
          )}
        >
          <span className="text-lg">{m.emoji}</span>
          <p className="text-sm font-medium mt-1">{m.label}</p>
          <p className="text-xs text-white/40 mt-0.5 leading-tight">{m.description}</p>
        </button>
      ))}
    </div>
  );
}
