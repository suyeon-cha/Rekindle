export interface Person {
  id: string;
  name: string;
  location?: string;
  where_met?: string;
  summary: string;
  interests: string[];
  projects?: string[];
  contact_methods: string[];
  priority: "low" | "medium" | "high";
  relationship_goal?: string;
  vibe_preferences?: string[];
  last_interaction?: string;
}

export interface Memory {
  memory_id: string;
  person_id: string;
  raw_note: string;
  extracted: {
    topics: string[];
    projects?: string[];
    relationship_context?: string;
    possible_future_reasons: string[];
    priority?: "low" | "medium" | "high";
    vibe_preferences?: string[];
    summary: string;
  };
  created_at: string;
}

export interface PublicEvent {
  event_id: string;
  title: string;
  city?: string;
  neighborhood?: string;
  date?: string | null;
  time?: string | null;
  source: string;
  source_url?: string;
  description?: string;
  topics: string[];
  event_type: string;
  vibe_tags: string[];
  confidence: number;
}

export interface OpportunityCard {
  card_id: string;
  mode: "event_first" | "person_first" | "calendar_trigger" | "visit_mode";
  person_id: string;
  person_name: string;
  user_intent: string;
  recommended_event?: {
    event_id?: string;
    title: string;
    city?: string;
    date?: string | null;
    time?: string | null;
    url?: string;
    source?: string;
    topics?: string[];
    event_type?: string;
    vibe_tags?: string[];
  } | null;
  recommended_activity?: string;
  why_this_person: string;
  why_this_event?: string;
  memory_used: string;
  suggested_message: string;
  confidence: number;
  data_used: string[];
  status: "suggested" | "sent" | "follow_up_needed" | "plan_set" | "reconnected" | "dismissed";
  created_at: string;
}

export type Mode = "person_first" | "event_first" | "calendar_trigger" | "visit_mode";
