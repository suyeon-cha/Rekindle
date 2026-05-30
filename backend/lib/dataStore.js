/**
 * Simple file-based data store.
 * Reads/writes JSON files from the data/ directory.
 * In production this would be replaced by Box API calls.
 */

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../data");

function readJSON(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

// --- People ---
function getPeople() {
  return readJSON("people.json");
}

function getPersonById(id) {
  return getPeople().find((p) => p.id === id) || null;
}

function savePerson(person) {
  const people = getPeople();
  const idx = people.findIndex((p) => p.id === person.id);
  if (idx >= 0) {
    people[idx] = person;
  } else {
    people.push(person);
  }
  writeJSON("people.json", people);
  return person;
}

// --- Memories ---
function getMemories() {
  return readJSON("memories.json");
}

function getMemoriesByPersonId(personId) {
  return getMemories().filter((m) => m.person_id === personId);
}

function saveMemory(memory) {
  const memories = getMemories();
  memories.push(memory);
  writeJSON("memories.json", memories);
  return memory;
}

// --- Events ---
function getPublicEvents() {
  return readJSON("public_events.json");
}

function savePublicEvents(events) {
  writeJSON("public_events.json", events);
}

// --- Opportunity Cards ---
function getOpportunityCards() {
  return readJSON("opportunity_cards.json");
}

function saveOpportunityCard(card) {
  const cards = getOpportunityCards();
  const idx = cards.findIndex((c) => c.card_id === card.card_id);
  if (idx >= 0) {
    cards[idx] = card;
  } else {
    cards.push(card);
  }
  writeJSON("opportunity_cards.json", cards);
  return card;
}

function updateCardStatus(cardId, status) {
  const cards = getOpportunityCards();
  const idx = cards.findIndex((c) => c.card_id === cardId);
  if (idx >= 0) {
    cards[idx].status = status;
    writeJSON("opportunity_cards.json", cards);
    return cards[idx];
  }
  return null;
}

// --- Sent Messages ---
function getSentMessages() {
  return readJSON("sent_messages.json");
}

function saveSentMessage(msg) {
  const messages = getSentMessages();
  messages.push(msg);
  writeJSON("sent_messages.json", messages);
  return msg;
}

module.exports = {
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
