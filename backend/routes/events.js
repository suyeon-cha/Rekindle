const express = require("express");
const router = express.Router();
const { getPublicEvents } = require("../lib/dataStore");

// GET /events — list public events with optional filters
// Query params: topic, city, event_type
router.get("/", (req, res) => {
  let events = getPublicEvents();

  const { topic, city, event_type } = req.query;

  if (topic) {
    const t = topic.toLowerCase();
    events = events.filter((e) =>
      e.topics?.some((et) => et.toLowerCase().includes(t))
    );
  }

  if (city) {
    const c = city.toLowerCase();
    events = events.filter((e) => e.city?.toLowerCase() === c);
  }

  if (event_type) {
    events = events.filter((e) => e.event_type === event_type);
  }

  res.json({ events });
});

module.exports = router;
