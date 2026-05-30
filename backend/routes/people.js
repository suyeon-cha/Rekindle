const express = require("express");
const router = express.Router();
const { getPeople, getPersonById, getMemoriesByPersonId } = require("../lib/dataStore");

// GET /people
router.get("/", async (req, res) => {
  try {
    const people = await getPeople();
    res.json({ people });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /people/:id
router.get("/:id", async (req, res) => {
  try {
    const person = await getPersonById(req.params.id);
    if (!person) return res.status(404).json({ error: "Person not found" });
    const memories = await getMemoriesByPersonId(req.params.id);
    res.json({ person, memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
