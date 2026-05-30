import { OpportunityCard, Person, UICard } from "./types";

const PALETTE = [
  "#345D86", "#9A7420", "#2C5247", "#C24A22",
  "#5C3D7A", "#8C5A2E", "#2E6B82", "#7B4D87",
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

export function getPersonColor(name: string): string {
  return PALETTE[hashName(name) % PALETTE.length];
}

export function computeTimer(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "tomorrow";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatEvent(
  event?: { title: string; date?: string | null; time?: string | null } | null,
  activity?: string
): string {
  if (!event && !activity) return "something fun";
  if (!event) return activity!;
  const parts = [event.title];
  if (event.time) parts.push(event.time);
  return parts.join(" · ");
}

function casual(warm: string): string {
  const sentences = warm.match(/[^.!?]+[.!?]+/g) ?? [warm];
  const s = sentences.slice(0, 2).join(" ").trim();
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function brief(warm: string): string {
  const m = warm.match(/[^.!?]+[.!?]+/);
  return m ? m[0].trim() : warm;
}

export function toUICard(card: OpportunityCard, people: Person[]): UICard {
  const person = people.find((p) => p.id === card.person_id);
  const platform = person?.contact_methods?.[0] ?? "LinkedIn";
  const color = getPersonColor(card.person_name);
  const timer = computeTimer(card.recommended_event?.date);
  const event = formatEvent(card.recommended_event, card.recommended_activity ?? undefined);
  const warm = card.suggested_message;

  return {
    id: card.card_id,
    mode: card.mode,
    personId: card.person_id,
    personName: card.person_name,
    personColor: color,
    platform,
    timer,
    event,
    eventUrl: card.recommended_event?.url ?? undefined,
    whyPerson: card.why_this_person,
    whyEvent: card.why_this_event,
    memory: card.memory_used,
    dataUsed: card.data_used,
    confidence: card.confidence,
    drafts: { warm, casual: casual(warm), brief: brief(warm) },
    status: card.status,
  };
}
