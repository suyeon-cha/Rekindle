import { OpportunityCard, Person, PublicEvent } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

// ── People ────────────────────────────────────────────────────────────────────
export async function getPeople(): Promise<{ people: Person[] }> {
  return request("/people");
}

export async function getPersonById(id: string): Promise<{ person: Person; memories: any[] }> {
  return request(`/people/${id}`);
}

// ── Events ────────────────────────────────────────────────────────────────────
export async function getEvents(params?: {
  topic?: string;
  city?: string;
  event_type?: string;
}): Promise<{ events: PublicEvent[] }> {
  const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return request(`/events${qs}`);
}

// ── Memory ────────────────────────────────────────────────────────────────────
export async function addMemory(payload: {
  user_id: string;
  raw_note: string;
  person_name?: string;
}): Promise<{ person: Person; memory_id: string }> {
  return request("/add-memory", { method: "POST", body: JSON.stringify(payload) });
}

// ── Opportunities ─────────────────────────────────────────────────────────────
export async function generateOpportunities(payload: {
  user_id: string;
  mode: string;
  intent?: string;
  person_id?: string;
  calendar_event?: object;
  city?: string;
  date_range?: { start: string; end: string };
}): Promise<{ cards: OpportunityCard[] }> {
  return request("/generate-opportunities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Actions ───────────────────────────────────────────────────────────────────
export async function markSent(payload: {
  user_id: string;
  card_id: string;
  person_id: string;
  sent_via: string;
  message: string;
}): Promise<{ status: string; new_card_status: string }> {
  return request("/mark-sent", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateStatus(payload: {
  card_id: string;
  status: string;
}): Promise<{ status: string }> {
  return request("/update-status", { method: "POST", body: JSON.stringify(payload) });
}
