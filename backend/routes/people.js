const express = require("express");
const router = express.Router();
const { getPeople, getPersonById, getMemoriesByPersonId } = require("../lib/dataStore");

// GET /people — list all people
router.get("/", (req, res) => {
  const people = getPeople();
  res.json({ people });
});

// GET /people/:id — get a single person with their memories
router.get("/:id", (req, res) => {
  const person = getPersonById(req.params.id);
  if (!person) return res.status(404).json({ error: "Person not found" });

  const memories = getMemoriesByPersonId(req.params.id);
  res.json({ person, memories });
});

module.exports = router;
