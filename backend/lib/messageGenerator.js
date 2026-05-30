/**
 * Message generation.
 * Uses Claude (Anthropic) if ANTHROPIC_API_KEY is set, otherwise falls back to a template.
 */

const Anthropic = require("@anthropic-ai/sdk");

let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });
}

/**
 * Generate a warm, casual, specific invite message.
 * Under 75 words, references memory naturally.
 */
async function generateMessage({ person, memory, event, activity, mode }) {
  const memorySnippet = memory?.raw_note || memory?.extracted?.summary || "";
  const eventTitle = event?.title || activity || "something fun";
  const eventDate = event?.date ? ` on ${event.date}` : "";
  const eventCity = event?.city ? ` in ${event.city}` : "";

  if (anthropic) {
    try {
      const prompt = `You are helping Maya reconnect with ${person.name}.

Context about ${person.name}: "${memorySnippet}"
Where they met: "${person.where_met || "unknown"}"
${person.interests?.length ? `Interests: ${person.interests.join(", ")}` : ""}
Suggested plan: ${eventTitle}${eventDate}${eventCity}
Mode: ${mode}

Return a JSON object with exactly these two fields:
{
  "message": "A warm, casual, specific, low-pressure reconnection message. Under 75 words. No corporate tone. Reference the memory naturally. End with a soft invite.",
  "why": "1-2 sentences explaining why NOW is a good moment to reach out to this specific person for this specific plan. Be concrete — mention what you know about them and what makes this a natural fit. Not generic. Sound like a thoughtful friend, not an algorithm."
}

Return ONLY valid JSON. No extra text.`;

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      });

      const raw = response.content[0].text.trim().replace(/^```json\n?|^```\n?|\n?```$/g, "");
      const parsed = JSON.parse(raw);
      return { message: parsed.message, why: parsed.why };
    } catch (err) {
      console.error("Claude API error, falling back to template:", err.message);
    }
  }

  // Fallback template messages by mode
  return { message: generateTemplateMessage({ person, memory, event, activity, mode }), why: null };
}

function generateTemplateMessage({ person, memory, event, activity, mode }) {
  const name = person.name;
  const whereMet = person.where_met ? `We met at ${person.where_met}` : "Hey";
  const memoryHook = getMemoryHook(memory);
  const eventTitle = event?.title || activity || "something";
  const eventDate = event?.date ? ` on ${formatDate(event.date)}` : "";

  const templates = {
    person_first: `Hey ${name}! ${whereMet} — ${memoryHook} I'm thinking of going to ${eventTitle}${eventDate} and thought of you. Want to come?`,
    event_first: `Hey ${name}! ${whereMet} — ${memoryHook} There's a ${eventTitle}${eventDate} that seems right up your alley. Want to check it out together?`,
    calendar_trigger: `Hey ${name}! ${whereMet} — I have ${eventTitle}${eventDate} and thought you might want to join. Let me know!`,
    visit_mode: `Hey ${name}! I'm going to be in ${event?.city || "your city"}${eventDate} — would love to catch up. ${memoryHook} Maybe we could check out ${eventTitle}?`,
  };

  return templates[mode] || templates.person_first;
}

function getMemoryHook(memory) {
  if (!memory) return "";
  const topics = memory.extracted?.topics || [];
  const projects = memory.extracted?.projects || [];

  if (projects.length > 0) {
    return `I've been thinking about your ${projects[0]} — would love to hear how it's going. `;
  }
  if (topics.length > 0) {
    return `I remembered you're into ${topics.slice(0, 2).join(" and ")}. `;
  }
  return "";
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

/**
 * Extract normalized topics from a natural-language intent string.
 * Uses Claude when available; falls back to keyword matching.
 */
async function extractTopicsFromIntent(intent = "") {
  if (!intent.trim()) return [];

  if (anthropic) {
    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: `Extract the social activity and hobby topics from this event search: "${intent}"

These topics will be used to match real-world social events (meetups, classes, concerts, markets, sports, etc.) and people's personal hobbies and interests.

Rules:
- Only include topics that map to a real-world activity or hobby someone would do in person
- Do NOT extract abstract, professional, or financial concepts (e.g. "finance", "investing", "markets" as in stock markets, "career", "interview")
- If the intent has no clear social activity or hobby, return an empty array []

Return a JSON array of short lowercase topic strings (e.g. ["cooking", "food", "jazz"]).
Return ONLY the JSON array, nothing else.`,
          },
        ],
      });

      const raw = response.content[0].text.trim().replace(/^```json\n?|^```\n?|\n?```$/g, "");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      console.error("Topic extraction error, using fallback:", err.message);
    }
  }

  // Fallback keyword list
  const TOPIC_KEYWORDS = [
    "tennis", "ai", "artificial intelligence", "machine learning",
    "hackathon", "startup", "startups", "founders", "education",
    "edtech", "kids", "design", "product", "community", "art",
    "music", "food", "cooking", "culinary", "fitness", "sports",
    "tech", "networking", "builders", "market", "creative",
    "books", "reading", "jazz", "running", "hiking", "cycling",
    "coffee", "pottery", "ceramics", "concerts", "vinyl", "manga",
    "photography", "yoga", "climbing", "dance", "film", "gaming",
  ];

  const lower = intent.toLowerCase();
  return TOPIC_KEYWORDS.filter((kw) => lower.includes(kw));
}

module.exports = { generateMessage, extractTopicsFromIntent };
