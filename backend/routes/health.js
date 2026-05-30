const express = require("express");
const router = express.Router();
const { USE_BOX } = require("../lib/dataStore");

router.get("/", async (req, res) => {
  const response = {
    ok: true,
    service: "rekindle-api",
    timestamp: new Date().toISOString(),
    storage: USE_BOX ? "box" : "local",
  };

  // If Box is configured, do a quick ping
  if (USE_BOX) {
    try {
      const box = require("../lib/box");
      await box.ping();
      response.box = "connected";
    } catch (err) {
      response.box = `error: ${err.message}`;
    }
  }

  res.json(response);
});

module.exports = router;
