"use client";

import { useState } from "react";
import { addMemory } from "@/lib/api";
import { X, Loader2, CheckCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onAdded: (person: any) => void;
}

export default function AddMemoryModal({ onClose, onAdded }: Props) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await addMemory({ user_id: "user_maya", raw_note: note });
      setResult(data);
      onAdded(data.person);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#1a1a22] border border-white/10 rounded-2xl shadow-2xl animate-slide-up">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/8">
          <div>
            <h2 className="font-semibold text-white">Add a memory</h2>
            <p className="text-xs text-white/40 mt-0.5">Jot down who you met and what you remember</p>
          </div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
            <X size={18} />
          </button>
        </div>

        {result ? (
          /* Success state */
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-emerald-400" size={22} />
              <p className="text-white font-medium">Memory saved for {result.person.name}</p>
            </div>
            <div className="bg-white/5 border border-white/8 rounded-xl p-4 space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wide">Extracted</p>
              <p className="text-sm text-white/80">{result.person.summary}</p>
              {result.person.interests?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {result.person.interests.map((i: string) => (
                    <span key={i} className="text-xs bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded-full">
                      {i}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Robert from CascadiaJS. Loves tennis, into AI, building an AI map tool. Want to stay in touch."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-white/25 resize-none focus:outline-none focus:border-violet-500/50 transition-colors"
              autoFocus
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 text-sm text-white/50 hover:text-white/80 py-2.5 rounded-xl border border-white/10 hover:border-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !note.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : null}
                {loading ? "Saving…" : "Save memory"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
