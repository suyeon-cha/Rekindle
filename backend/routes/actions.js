const express = require("express");
const router = express.Router();
const { v4: uuidv4 } = require("uuid");
const { updateCardStatus, saveSentMessage } = require("../lib/dataStore");

// POST /mark-sent
router.post("/mark-sent", (req, res) => {
  const { user_id, card_id, person_id, sent_via, message } = req.body;

  if (!card_id) return res.status(400).json({ error: "card_id is required" });

  const updatedCard = updateCardStatus(card_id, "sent");

  const sentMessage = {
    sent_id: `sent_${uuidv4().slice(0, 8)}`,
    card_id,
    person_id,
    message: message || "",
    sent_via: sent_via || "Other",
    status: "sent",
    created_at: new Date().toISOString(),
  };

  saveSentMessage(sentMessage);

  res.json({ status: "success", new_card_status: "sent", sent_id: sentMessage.sent_id });
});

// POST /update-status
router.post("/update-status", (req, res) => {
  const { card_id, status } = req.body;

  const validStatuses = ["suggested", "sent", "follow_up_needed", "plan_set", "reconnected", "dismissed"];

  if (!card_id) return res.status(400).json({ error: "card_id is required" });
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` });
  }

  const updated = updateCardStatus(card_id, status);
  if (!updated) return res.status(404).json({ error: "Card not found" });

  res.json({ status: "success", card: updated });
});

module.exports = router;
