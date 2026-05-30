/**
 * Ingest endpoints — Apify (or any external scraper) POSTs scraped data here.
 * Writes flow through dataStore, so they land in Box when Box is configured
 * and fall back to local JSON otherwise.
 *
 * Auth: shared secret in the `x-ingest-token` header, compared against
 * INGEST_TOKEN in .env. If INGEST_TOKEN is unset the endpoint refuses all
 * writes — fail closed.
 */

const express = require("express");
const { randomUUID } = require("crypto");
const router = express.Router();
const {
  getPeople,
  savePerson,
  getPublicEvents,
  savePublicEvents,
  saveMemory,
} = require("../lib/dataStore");

// ── Auth middleware ───────────────────────────────────────────────────────────

router.use((req, res, next) => {
  const expected = process.env.INGEST_TOKEN;
  if (!expected) {
    return res.status(503).json({ error: "INGEST_TOKEN not configured on server" });
  }
  if (req.header("x-ingest-token") !== expected) {
    return res.status(401).json({ error: "Invalid or missing x-ingest-token" });
  }
  next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function isObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function asArray(body, key) {
  // Accept either { [key]: [...] } or a bare array
  if (Array.isArray(body)) return body;
  if (isObject(body) && Array.isArray(body[key])) return body[key];
  return null;
}

// ── POST /ingest/people ───────────────────────────────────────────────────────
// Upserts people by `id`. Generates an id if the row doesn't have one.
router.post("/people", async (req, res) => {
  const rows = asArray(req.body, "people");
  if (!rows) {
    return res.status(400).json({ error: "Body must be an array or { people: [...] }" });
  }

  const results = { upserted: 0, skipped: 0, ids: [] };
  for (const row of rows) {
    if (!isObject(row) || !row.name) {
      results.skipped++;
      continue;
    }
    const person = { id: row.id || `person_${randomUUID()}`, ...row };
    await savePerson(person);
    results.upserted++;
    results.ids.push(person.id);
  }

  res.json(results);
});

// ── POST /ingest/events ───────────────────────────────────────────────────────
// Two modes:
//   ?mode=replace  → overwrite public_events.json with the posted rows (default)
//   ?mode=append   → merge new rows in, dedup by event_id
router.post("/events", async (req, res) => {
  const rows = asArray(req.body, "events");
  if (!rows) {
    return res.status(400).json({ error: "Body must be an array or { events: [...] }" });
  }

  const cleaned = rows
    .filter((r) => isObject(r) && r.title)
    .map((r) => ({ event_id: r.event_id || `event_${randomUUID()}`, ...r }));

  const mode = (req.query.mode || "replace").toLowerCase();
  if (mode === "append") {
    const existing = await getPublicEvents();
    const byId = new Map(existing.map((e) => [e.event_id, e]));
    for (const e of cleaned) byId.set(e.event_id, e);
    const merged = Array.from(byId.values());
    await savePublicEvents(merged);
    return res.json({ mode, total: merged.length, added_or_updated: cleaned.length });
  }

  await savePublicEvents(cleaned);
  res.json({ mode: "replace", total: cleaned.length });
});

// ── POST /ingest/memories ─────────────────────────────────────────────────────
// Appends memories. Each row must include person_id; the person should already
// exist (we don't auto-create here — Apify shouldn't be inventing people).
router.post("/memories", async (req, res) => {
  const rows = asArray(req.body, "memories");
  if (!rows) {
    return res.status(400).json({ error: "Body must be an array or { memories: [...] }" });
  }

  const people = await getPeople();
  const validIds = new Set(people.map((p) => p.id));

  const results = { saved: 0, skipped: 0, unknown_person: [] };
  for (const row of rows) {
    if (!isObject(row) || !row.person_id || !row.raw_note) {
      results.skipped++;
      continue;
    }
    if (!validIds.has(row.person_id)) {
      results.unknown_person.push(row.person_id);
      results.skipped++;
      continue;
    }
    await saveMemory({ memory_id: row.memory_id || `mem_${randomUUID()}`, ...row });
    results.saved++;
  }

  res.json(results);
});

module.exports = router;
