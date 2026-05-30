const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const {
  getPeople,
  getPersonById,
  getMemoriesByPersonId,
  getPublicEvents,
  saveOpportunityCard,
} = require("../lib/dataStore");
const {
  scorePersonForIntent,
  scoreEventForPerson,
  extractTopicsFromIntent,
} = require("../lib/scoring");
const { generateMessage } = require("../lib/messageGenerator");

// POST /generate-opportunities
// Supports modes: event_first | person_first | calendar_trigger | visit_mode
router.post("/", async (req, res) => {
  const { user_id, mode, intent, person_id, calendar_event, city, date_range } = req.body;

  if (!mode) return res.status(400).json({ error: "mode is required" });

  try {
    let cards = [];

    switch (mode) {
      case "person_first":
        cards = await handlePersonFirst({ person_id, intent, user_id });
        break;
      case "event_first":
        cards = await handleEventFirst({ intent, user_id });
        break;
      case "calendar_trigger":
        cards = await handleCalendarTrigger({ calendar_event, user_id });
        break;
      case "visit_mode":
        cards = await handleVisitMode({ city, date_range, user_id });
        break;
      default:
        return res.status(400).json({ error: `Unknown mode: ${mode}` });
    }

    // Persist cards
    for (const card of cards) {
      saveOpportunityCard(card);
    }

    res.json({ cards });
  } catch (err) {
    console.error("generate-opportunities error:", err);
    res.status(500).json({ error: "Failed to generate opportunities", details: err.message });
  }
});

// ─── Mode Handlers ────────────────────────────────────────────────────────────

async function handlePersonFirst({ person_id, intent, user_id }) {
  const person = getPersonById(person_id);
  if (!person) throw new Error(`Person not found: ${person_id}`);

  const memories = getMemoriesByPersonId(person_id);
  const memory = memories[0] || null;

  const events = getPublicEvents();

  // Score each event for this person
  const scoredEvents = events
    .map((event) => ({
      event,
      score: scoreEventForPerson(event, person, memory, person.location),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const cards = [];
  for (const { event, score } of scoredEvents) {
    const message = await generateMessage({
      person,
      memory,
      event,
      mode: "person_first",
    });

    cards.push(buildCard({
      mode: "person_first",
      person,
      memory,
      event,
      message,
      intent: intent || `I want to get closer to ${person.name}`,
      confidence: Math.min(score / 100, 0.99),
    }));
  }

  return cards;
}

async function handleEventFirst({ intent, user_id }) {
  const intentTopics = extractTopicsFromIntent(intent || "");
  const people = getPeople();
  const events = getPublicEvents();

  // Filter events matching intent topics
  const matchingEvents = events.filter((e) =>
    e.topics?.some((t) => intentTopics.includes(t.toLowerCase()))
  );

  const eventsToUse = matchingEvents.length > 0 ? matchingEvents : events.slice(0, 3);

  const cards = [];

  for (const event of eventsToUse.slice(0, 3)) {
    // Find best person for this event
    const scoredPeople = people
      .map((person) => {
        const memories = getMemoriesByPersonId(person.id);
        const memory = memories[0] || null;
        return {
          person,
          memory,
          score:
            scorePersonForIntent(person, memory, intentTopics) +
            scoreEventForPerson(event, person, memory),
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = scoredPeople[0];
    if (!best) continue;

    const message = await generateMessage({
      person: best.person,
      memory: best.memory,
      event,
      mode: "event_first",
    });

    cards.push(buildCard({
      mode: "event_first",
      person: best.person,
      memory: best.memory,
      event,
      message,
      intent: intent || "I want to go to an event",
      confidence: Math.min(best.score / 100, 0.99),
    }));
  }

  return cards;
}

async function handleCalendarTrigger({ calendar_event, user_id }) {
  if (!calendar_event) throw new Error("calendar_event is required for calendar_trigger mode");

  const topics = [
    ...(calendar_event.topics || []),
    ...extractTopicsFromIntent(calendar_event.title || ""),
  ];

  const people = getPeople();

  const scoredPeople = people
    .map((person) => {
      const memories = getMemoriesByPersonId(person.id);
      const memory = memories[0] || null;
      return {
        person,
        memory,
        score: scorePersonForIntent(person, memory, topics, calendar_event.city),
      };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  const cards = [];
  for (const { person, memory, score } of scoredPeople) {
    const message = await generateMessage({
      person,
      memory,
      activity: calendar_event.title,
      event: {
        title: calendar_event.title,
        date: calendar_event.date,
        time: calendar_event.time,
        city: calendar_event.city,
      },
      mode: "calendar_trigger",
    });

    cards.push(buildCard({
      mode: "calendar_trigger",
      person,
      memory,
      event: {
        title: calendar_event.title,
        date: calendar_event.date,
        time: calendar_event.time,
        city: calendar_event.city,
        source: "Google Calendar",
      },
      message,
      intent: `I'm already doing ${calendar_event.title}. Who should I invite?`,
      confidence: Math.min(score / 100, 0.99),
    }));
  }

  return cards;
}

async function handleVisitMode({ city, date_range, user_id }) {
  if (!city) throw new Error("city is required for visit_mode");

  const people = getPeople();
  const events = getPublicEvents();

  // People in that city
  const localPeople = people.filter(
    (p) => p.location?.toLowerCase() === city.toLowerCase()
  );

  // Events in that city
  const localEvents = events.filter(
    (e) => e.city?.toLowerCase() === city.toLowerCase()
  );

  const cards = [];

  for (const person of localPeople.slice(0, 3)) {
    const memories = getMemoriesByPersonId(person.id);
    const memory = memories[0] || null;

    // Best event for this person in the city
    const scoredEvents = localEvents
      .map((event) => ({
        event,
        score: scoreEventForPerson(event, person, memory, city),
      }))
      .sort((a, b) => b.score - a.score);

    const bestEvent = scoredEvents[0]?.event || null;

    const message = await generateMessage({
      person,
      memory,
      event: bestEvent || { title: "catch up", city },
      mode: "visit_mode",
    });

    cards.push(buildCard({
      mode: "visit_mode",
      person,
      memory,
      event: bestEvent,
      message,
      intent: `I'm going to ${city}. Who should I reconnect with?`,
      confidence: bestEvent ? Math.min(scoredEvents[0].score / 100, 0.99) : 0.7,
    }));
  }

  return cards;
}

// ─── Card Builder ─────────────────────────────────────────────────────────────

function buildCard({ mode, person, memory, event, message, intent, confidence }) {
  return {
    card_id: `card_${uuidv4().slice(0, 8)}`,
    mode,
    person_id: person.id,
    person_name: person.name,
    user_intent: intent,
    recommended_event: event
      ? {
          event_id: event.event_id || null,
          title: event.title,
          city: event.city || null,
          date: event.date || null,
          time: event.time || null,
          url: event.source_url || null,
          source: event.source || null,
          topics: event.topics || [],
          event_type: event.event_type || null,
          vibe_tags: event.vibe_tags || [],
        }
      : null,
    why_this_person: buildWhyPerson(person, memory),
    why_this_event: event ? buildWhyEvent(person, memory, event) : null,
    memory_used: memory?.raw_note || memory?.extracted?.summary || "",
    suggested_message: message,
    confidence: parseFloat(confidence.toFixed(2)),
    data_used: buildDataUsed(memory, event),
    status: "suggested",
    created_at: new Date().toISOString(),
  };
}

function buildWhyPerson(person, memory) {
  if (memory?.extracted?.relationship_context) {
    return `You met ${person.name} at ${memory.extracted.relationship_context} and marked them as someone you want to stay in touch with.`;
  }
  if (person.where_met) {
    return `You met ${person.name} at ${person.where_met} and want to reconnect.`;
  }
  return `${person.name} is someone you want to stay in touch with.`;
}

function buildWhyEvent(person, memory, event) {
  const personTopics = [
    ...(person.interests || []),
    ...(memory?.extracted?.topics || []),
  ].map((t) => t.toLowerCase());

  const matchingTopics = (event.topics || []).filter((t) =>
    personTopics.includes(t.toLowerCase())
  );

  if (matchingTopics.length > 0) {
    return `${person.name} is into ${matchingTopics.join(" and ")}, and this event is about exactly that.`;
  }
  return `This event matches ${person.name}'s interests and vibe.`;
}

function buildDataUsed(memory, event) {
  const sources = [];
  if (memory) sources.push("relationship memory");
  if (event?.source) sources.push(`public event (${event.source})`);
  sources.push("person interests");
  return sources;
}

module.exports = router;
