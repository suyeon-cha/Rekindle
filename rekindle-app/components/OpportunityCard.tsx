"use client";

import { useState } from "react";
import { OpportunityCard as CardType } from "@/lib/types";
import { markSent, updateStatus } from "@/lib/api";
import {
  Copy, Check, ExternalLink, X, Calendar, MapPin,
  User, Zap, ChevronDown, ChevronUp, Send
} from "lucide-react";
import clsx from "clsx";

interface Props {
  card: CardType;
  onStatusChange?: (cardId: string, status: string) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  Luma: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  Meetup: "bg-red-500/20 text-red-300 border-red-500/30",
  Eventbrite: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "Apify Demo": "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  "Google Calendar": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  Seed: "bg-gray-500/20 text-gray-300 border-gray-500/30",
};

const MODE_LABELS: Record<string, string> = {
  person_first: "👤 Person-first",
  event_first: "🎉 Event-first",
  calendar_trigger: "📅 Calendar",
  visit_mode: "✈️ Visit Mode",
};

export default function OpportunityCard({ card, onStatusChange }: Props) {
  const [copied, setCopied] = useState(false);
  const [showWhy, setShowWhy] = useState(false);
  const [sending, setSending] = useState(false);
  const [localStatus, setLocalStatus] = useState(card.status);

  const event = card.recommended_event;
  const sourceColor = event?.source ? SOURCE_COLORS[event.source] ?? SOURCE_COLORS.Seed : "";

  async function handleCopy() {
    await navigator.clipboard.writeText(card.suggested_message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleMarkSent(via: string) {
    setSending(true);
    try {
      await markSent({
        user_id: "user_maya",
        card_id: card.card_id,
        person_id: card.person_id,
        sent_via: via,
        message: card.suggested_message,
      });
      setLocalStatus("sent");
      onStatusChange?.(card.card_id, "sent");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function handleDismiss() {
    await updateStatus({ card_id: card.card_id, status: "dismissed" });
    setLocalStatus("dismissed");
    onStatusChange?.(card.card_id, "dismissed");
  }

  const confidencePct = Math.round(card.confidence * 100);
  const confidenceColor =
    confidencePct >= 85 ? "text-emerald-400" :
    confidencePct >= 65 ? "text-yellow-400" : "text-red-400";

  if (localStatus === "dismissed") return null;

  return (
    <div className="animate-slide-up bg-[#1a1a22] border border-white/8 rounded-2xl overflow-hidden shadow-xl">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs font-medium text-white/40 tracking-wide">
          {MODE_LABELS[card.mode]}
        </span>
        <div className="flex items-center gap-2">
          <span className={clsx("text-xs font-semibold", confidenceColor)}>
            {confidencePct}% match
          </span>
          {localStatus === "sent" && (
            <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Sent ✓
            </span>
          )}
          <button
            onClick={handleDismiss}
            className="text-white/30 hover:text-white/60 transition-colors"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ── Person ── */}
      <div className="px-4 pb-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {card.person_name[0]}
        </div>
        <div>
          <p className="font-semibold text-white">{card.person_name}</p>
          <p className="text-xs text-white/40 line-clamp-1">{card.why_this_person}</p>
        </div>
      </div>

      {/* ── Draft message — the hero ── */}
      <div className="mx-4 mb-3 bg-white/5 border border-white/10 rounded-xl p-4">
        <p className="text-sm text-white/90 leading-relaxed">{card.suggested_message}</p>
        <button
          onClick={handleCopy}
          className="mt-3 flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
          {copied ? "Copied!" : "Copy message"}
        </button>
      </div>

      {/* ── Event ── */}
      {event && (
        <div className="mx-4 mb-3 flex items-start gap-3 bg-white/3 border border-white/8 rounded-xl p-3">
          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Calendar size={15} className="text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-white leading-tight">{event.title}</p>
              {event.url && (
                <a href={event.url} target="_blank" rel="noopener noreferrer"
                  className="text-white/30 hover:text-white/60 flex-shrink-0">
                  <ExternalLink size={13} />
                </a>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {event.city && (
                <span className="flex items-center gap-1 text-xs text-white/40">
                  <MapPin size={11} /> {event.city}
                </span>
              )}
              {event.date && (
                <span className="text-xs text-white/40">
                  {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  {event.time && ` · ${event.time}`}
                </span>
              )}
            </div>
            {event.source && (
              <span className={clsx("inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full border", sourceColor)}>
                {event.source}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Why section (collapsible) ── */}
      <div className="mx-4 mb-3">
        <button
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <Zap size={12} />
          Why this match?
          {showWhy ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
        {showWhy && (
          <div className="mt-2 space-y-2 animate-fade-in">
            <div className="flex gap-2">
              <User size={13} className="text-white/30 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/50">{card.why_this_person}</p>
            </div>
            {card.why_this_event && (
              <div className="flex gap-2">
                <Calendar size={13} className="text-white/30 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">{card.why_this_event}</p>
              </div>
            )}
            {card.memory_used && (
              <div className="bg-white/3 rounded-lg p-2.5 border border-white/5">
                <p className="text-xs text-white/30 mb-1">Memory used</p>
                <p className="text-xs text-white/50 italic">"{card.memory_used}"</p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {card.data_used.map((d) => (
                <span key={d} className="text-xs bg-white/5 text-white/30 px-2 py-0.5 rounded-full">
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      {localStatus !== "sent" && (
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <button
            onClick={() => handleMarkSent("LinkedIn")}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={12} /> LinkedIn
          </button>
          <button
            onClick={() => handleMarkSent("Instagram")}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={12} /> Instagram
          </button>
          <button
            onClick={() => handleMarkSent("Messages")}
            disabled={sending}
            className="flex items-center gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Send size={12} /> iMessage
          </button>
        </div>
      )}
    </div>
  );
}
