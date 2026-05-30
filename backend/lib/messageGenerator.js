/**
 * Message generation.
 * Uses OpenAI if OPENAI_API_KEY is set, otherwise falls back to a template.
 */

const OpenAI = require("openai");

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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

  if (openai) {
    try {
      const prompt = `
You are writing a short, warm, casual reconnection message from Maya to ${person.name}.

Context about ${person.name}: "${memorySnippet}"
Suggested plan: ${eventTitle}${eventDate}${eventCity}
Mode: ${mode}

Requirements:
- Warm, casual, specific, low-pressure
- Under 75 words
- No corporate tone
- Reference the memory naturally (don't make it feel like a CRM)
- End with a soft invite, not a demand

Return ONLY the message text, no quotes, no JSON.
`.trim();

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.8,
      });

      return response.choices[0].message.content.trim();
    } catch (err) {
      console.error("OpenAI error, falling back to template:", err.message);
    }
  }

  // Fallback template messages by mode
  return generateTemplateMessage({ person, memory, event, activity, mode });
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

module.exports = { generateMessage };
