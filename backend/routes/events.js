const express = require("express");
const router = express.Router();
const { getPublicEvents } = require("../lib/dataStore");

// GET /events — optional filters: topic, city, event_type
router.get("/", async (req, res) => {
  try {
    let events = await getPublicEvents();
    const { topic, city, event_type } = req.query;

    if (topic) {
      const t = topic.toLowerCase();
      events = events.filter((e) => e.topics?.some((et) => et.toLowerCase().includes(t)));
    }
    if (city) {
      events = events.filter((e) => e.city?.toLowerCase() === city.toLowerCase());
    }
    if (event_type) {
      events = events.filter((e) => e.event_type === event_type);
    }

    res.json({ events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
