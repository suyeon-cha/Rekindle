const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { savePerson, saveMemory, getPersonById, getMemoriesByPersonId } = require("../lib/dataStore");

// POST /add-memory
// Accepts a raw note and extracts structured memory.
// Uses OpenAI if available, otherwise uses simple keyword extraction.
router.post("/", async (req, res) => {
  const { user_id, raw_note, person_name } = req.body;

  if (!raw_note) {
    return res.status(400).json({ error: "raw_note is required" });
  }

  try {
    let extracted;

    if (process.env.OPENAI_API_KEY) {
      extracted = await extractWithAI(raw_note);
    } else {
      extracted = extractWithKeywords(raw_note, person_name);
    }

    // Build or update person record
    const personId = `person_${extracted.name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`;
    const existingPerson = getPersonById(personId);

    const person = existingPerson || {
      id: personId,
      name: extracted.name || person_name || "Unknown",
      location: extracted.location || null,
      where_met: extracted.where_met || null,
      summary: extracted.summary,
      interests: extracted.interests || [],
      projects: extracted.projects || [],
      contact_methods: [],
      priority: extracted.priority || "medium",
      relationship_goal: extracted.relationship_goal || null,
      vibe_preferences: extracted.vibe_preferences || [],
      last_interaction: new Date().toISOString().split("T")[0],
    };

    savePerson(person);

    const memory = {
      memory_id: `mem_${uuidv4().slice(0, 8)}`,
      person_id: person.id,
      raw_note,
      extracted: {
        topics: extracted.topics || [],
        projects: extracted.projects || [],
        relationship_context: extracted.where_met || null,
        possible_future_reasons: extracted.possible_future_reasons || [],
        priority: extracted.priority || "medium",
        vibe_preferences: extracted.vibe_preferences || [],
        summary: extracted.summary,
      },
      created_at: new Date().toISOString(),
    };

    saveMemory(memory);

    res.json({ person, memory_id: memory.memory_id });
  } catch (err) {
    console.error("add-memory error:", err);
    res.status(500).json({ error: "Failed to process memory", details: err.message });
  }
});

// --- AI extraction ---
async function extractWithAI(rawNote) {
  const OpenAI = require("openai");
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const prompt = `
Extract structured information from this relationship note. Return strict JSON only.

Note: "${rawNote}"

Return this exact JSON shape:
{
  "name": "string",
  "where_met": "string or null",
  "location": "string or null",
  "interests": ["array of strings"],
  "projects": ["array of strings or empty"],
  "possible_future_reasons": ["array of reconnect reasons"],
  "vibe_preferences": ["casual", "low-pressure", etc],
  "relationship_goal": "string or null",
  "priority": "low" | "medium" | "high",
  "summary": "one sentence summary"
}
`.trim();

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}

// --- Keyword fallback extraction ---
function extractWithKeywords(rawNote, personName) {
  const lower = rawNote.toLowerCase();

  const INTEREST_KEYWORDS = [
    "tennis", "ai", "machine learning", "hackathon", "startup",
    "education", "design", "product", "music", "art", "food",
    "fitness", "sports", "tech", "coding", "travel", "photography",
  ];

  const interests = INTEREST_KEYWORDS.filter((kw) => lower.includes(kw));

  // Extract name: look for capitalized words near the start
  const nameMatch = rawNote.match(/^([A-Z][a-z]+)/);
  const name = personName || (nameMatch ? nameMatch[1] : "Unknown");

  // Extract where_met
  const whereMet = extractWhereMet(rawNote);

  // Determine priority
  const priority = lower.includes("stay in touch") || lower.includes("really want")
    ? "high"
    : lower.includes("sometime") || lower.includes("maybe")
    ? "low"
    : "medium";

  return {
    name,
    where_met: whereMet,
    location: null,
    interests,
    projects: extractProjects(rawNote),
    possible_future_reasons: interests.map((i) => `${i} events`),
    vibe_preferences: ["casual", "low-pressure"],
    relationship_goal: null,
    priority,
    summary: rawNote.slice(0, 120),
  };
}

function extractWhereMet(note) {
  const patterns = [
    /(?:from|at|met at|met @)\s+([A-Z][A-Za-z\s]+?)(?:\.|,|$)/,
  ];
  for (const p of patterns) {
    const m = note.match(p);
    if (m) return m[1].trim();
  }
  return null;
}

function extractProjects(note) {
  const patterns = [
    /building (?:an? )?([^.]+)/i,
    /working on ([^.]+)/i,
    /created? ([^.]+)/i,
  ];
  for (const p of patterns) {
    const m = note.match(p);
    if (m) return [m[1].trim()];
  }
  return [];
}

module.exports = router;
