"use client";

import { useState, useEffect } from "react";
import { generateOpportunities, getPeople } from "@/lib/api";
import { OpportunityCard as CardType, Person } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import AddMemoryModal from "@/components/AddMemoryModal";
import ModeSelector, { AppMode } from "@/components/ModeSelector";
import { Loader2, Plus, Flame, Search } from "lucide-react";

export default function Home() {
  const [mode, setMode] = useState<AppMode>("person_first");
  const [intent, setIntent] = useState("");
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [visitCity, setVisitCity] = useState("");
  const [calendarTitle, setCalendarTitle] = useState("");

  const [people, setPeople] = useState<Person[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showMemoryModal, setShowMemoryModal] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Load people on mount
  useEffect(() => {
    getPeople().then((d) => setPeople(d.people)).catch(console.error);
  }, []);

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setHasSearched(true);
    try {
      const payload: any = { user_id: "user_maya", mode };

      if (mode === "person_first") {
        if (!selectedPersonId) { setError("Pick a person first"); setLoading(false); return; }
        payload.person_id = selectedPersonId;
        payload.intent = `I want to get closer to ${people.find(p => p.id === selectedPersonId)?.name}`;
      } else if (mode === "event_first") {
        payload.intent = intent || "I want to go to an event";
      } else if (mode === "calendar_trigger") {
        payload.calendar_event = {
          title: calendarTitle || "Tennis",
          date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
          time: "5:00 PM",
          city: "Seattle",
          topics: [calendarTitle.toLowerCase() || "tennis"],
        };
      } else if (mode === "visit_mode") {
        payload.city = visitCity || "Seattle";
      }

      const data = await generateOpportunities(payload);
      setCards(data.cards);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(cardId: string, status: string) {
    setCards((prev) =>
      prev.map((c) => (c.card_id === cardId ? { ...c, status: status as any } : c))
    );
  }

  const visibleCards = cards.filter((c) => c.status !== "dismissed");

  return (
    <div className="min-h-screen bg-[#0f0f13]">
      {/* ── Nav ── */}
      <header className="sticky top-0 z-40 bg-[#0f0f13]/90 backdrop-blur border-b border-white/6">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame size={20} className="text-orange-400" />
            <span className="font-bold text-white tracking-tight">rekindle</span>
          </div>
          <button
            onClick={() => setShowMemoryModal(true)}
            className="flex items-center gap-1.5 text-xs bg-white/8 hover:bg-white/12 text-white/70 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 transition-all"
          >
            <Plus size={13} /> Add memory
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── Hero ── */}
        <div>
          <h1 className="text-2xl font-bold text-white leading-tight">
            Turn "let's hang out"<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              into a real plan.
            </span>
          </h1>
          <p className="text-sm text-white/40 mt-2">
            rekindle finds the moment and writes the message.
          </p>
        </div>

        {/* ── Mode selector ── */}
        <section>
          <p className="text-xs text-white/40 uppercase tracking-widest mb-3">What do you want to do?</p>
          <ModeSelector selected={mode} onChange={(m) => { setMode(m); setCards([]); setHasSearched(false); }} />
        </section>

        {/* ── Mode-specific inputs ── */}
        <section className="space-y-3">
          {mode === "person_first" && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Who do you want to see?</p>
              <div className="grid gap-2">
                {people.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPersonId(p.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      selectedPersonId === p.id
                        ? "bg-violet-600/20 border-violet-500/50"
                        : "bg-white/3 border-white/8 hover:bg-white/6"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {p.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{p.name}</p>
                      <p className="text-xs text-white/40">{p.where_met} · {p.interests.slice(0, 2).join(", ")}</p>
                    </div>
                    {p.priority === "high" && (
                      <span className="ml-auto text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full">
                        priority
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "event_first" && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">What kind of event?</p>
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder="e.g. I want to go to an AI event this week"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          )}

          {mode === "calendar_trigger" && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">What's on your calendar?</p>
              <input
                value={calendarTitle}
                onChange={(e) => setCalendarTitle(e.target.value)}
                placeholder="e.g. Tennis, Hiking, Hackathon…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          )}

          {mode === "visit_mode" && (
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-2">Which city are you visiting?</p>
              <input
                value={visitCity}
                onChange={(e) => setVisitCity(e.target.value)}
                placeholder="e.g. Seattle, New York, Lisbon…"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-violet-500/50 transition-colors"
              />
            </div>
          )}
        </section>

        {/* ── Generate button ── */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-violet-900/30"
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin" /> Finding opportunities…</>
          ) : (
            <><Search size={16} /> Find opportunities</>
          )}
        </button>

        {/* ── Error ── */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* ── Results ── */}
        {hasSearched && !loading && (
          <section>
            {visibleCards.length > 0 ? (
              <>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-3">
                  {visibleCards.length} opportunit{visibleCards.length === 1 ? "y" : "ies"} found
                </p>
                <div className="space-y-4">
                  {visibleCards.map((card) => (
                    <OpportunityCard
                      key={card.card_id}
                      card={card}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/30 text-sm">No opportunities found.</p>
                <p className="text-white/20 text-xs mt-1">Try a different mode or add more memories.</p>
              </div>
            )}
          </section>
        )}

        {/* ── Empty state ── */}
        {!hasSearched && (
          <div className="text-center py-8 text-white/20 text-sm">
            Pick a mode above and hit Find opportunities ↑
          </div>
        )}
      </main>

      {/* ── Add Memory Modal ── */}
      {showMemoryModal && (
        <AddMemoryModal
          onClose={() => setShowMemoryModal(false)}
          onAdded={(person) => {
            setPeople((prev) => {
              const exists = prev.find((p) => p.id === person.id);
              return exists ? prev : [...prev, person];
            });
            setShowMemoryModal(false);
          }}
        />
      )}
    </div>
  );
}
