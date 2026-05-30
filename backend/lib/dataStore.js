/**
 * Data store — reads/writes via Box when credentials are present,
 * falls back to local JSON files otherwise.
 *
 * All functions are async-safe: callers can await them or use
 * the sync local fallback transparently.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");
const USE_BOX = !!(
  process.env.BOX_CLIENT_ID &&
  process.env.BOX_CLIENT_SECRET &&
  process.env.BOX_ENTERPRISE_ID
);

// Lazy-load box to avoid crashing when creds aren't set
let box = null;
function getBox() {
  if (!box) box = require("./box");
  return box;
}

// ── Local file helpers (fallback) ─────────────────────────────────────────────

function readLocalJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return [];
  }
}

function writeLocalJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// ── Unified read/write ────────────────────────────────────────────────────────

async function read(filename, defaultValue = []) {
  if (USE_BOX) {
    try {
      return await getBox().readJSON(filename, defaultValue);
    } catch (err) {
      console.warn(`[dataStore] Box read failed for ${filename}, using local:`, err.message);
      return readLocalJSON(filename);
    }
  }
  return readLocalJSON(filename);
}

async function write(filename, data) {
  // Always write locally as a cache/backup
  writeLocalJSON(filename, data);

  if (USE_BOX) {
    try {
      await getBox().writeJSON(filename, data);
    } catch (err) {
      console.warn(`[dataStore] Box write failed for ${filename}:`, err.message);
    }
  }
}

// ── People ────────────────────────────────────────────────────────────────────

async function getPeople() {
  return read("people.json", []);
}

async function getPersonById(id) {
  const people = await getPeople();
  return people.find((p) => p.id === id) || null;
}

async function savePerson(person) {
  const people = await getPeople();
  const idx = people.findIndex((p) => p.id === person.id);
  if (idx >= 0) people[idx] = person;
  else people.push(person);
  await write("people.json", people);
  return person;
}

// ── Memories ──────────────────────────────────────────────────────────────────

async function getMemories() {
  return read("memories.json", []);
}

async function getMemoriesByPersonId(personId) {
  const memories = await getMemories();
  return memories.filter((m) => m.person_id === personId);
}

async function saveMemory(memory) {
  const memories = await getMemories();
  memories.push(memory);
  await write("memories.json", memories);
  return memory;
}

// ── Public Events ─────────────────────────────────────────────────────────────

async function getPublicEvents() {
  return read("public_events.json", []);
}

async function savePublicEvents(events) {
  await write("public_events.json", events);
}

// ── Opportunity Cards ─────────────────────────────────────────────────────────

async function getOpportunityCards() {
  return read("opportunity_cards.json", []);
}

async function saveOpportunityCard(card) {
  const cards = await getOpportunityCards();
  const idx = cards.findIndex((c) => c.card_id === card.card_id);
  if (idx >= 0) cards[idx] = card;
  else cards.push(card);
  await write("opportunity_cards.json", cards);
  return card;
}

async function updateCardStatus(cardId, status) {
  const cards = await getOpportunityCards();
  const idx = cards.findIndex((c) => c.card_id === cardId);
  if (idx >= 0) {
    cards[idx].status = status;
    await write("opportunity_cards.json", cards);
    return cards[idx];
  }
  return null;
}

// ── Sent Messages ─────────────────────────────────────────────────────────────

async function getSentMessages() {
  return read("sent_messages.json", []);
}

async function saveSentMessage(msg) {
  const messages = await getSentMessages();
  messages.push(msg);
  await write("sent_messages.json", messages);
  return msg;
}

module.exports = {
  USE_BOX,
  getPeople,
  getPersonById,
  savePerson,
  getMemories,
  getMemoriesByPersonId,
  saveMemory,
  getPublicEvents,
  savePublicEvents,
  getOpportunityCards,
  saveOpportunityCard,
  updateCardStatus,
  getSentMessages,
  saveSentMessage,
};
