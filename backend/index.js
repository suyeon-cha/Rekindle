require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/health", require("./routes/health"));
app.use("/people", require("./routes/people"));
app.use("/events", require("./routes/events"));
app.use("/add-memory", require("./routes/memory"));
app.use("/generate-opportunities", require("./routes/opportunities"));
app.use("/", require("./routes/actions")); // /mark-sent and /update-status

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`\n🔥 rekindle API running on http://localhost:${PORT}`);
  console.log(`   GET  /health`);
  console.log(`   GET  /people`);
  console.log(`   GET  /events`);
  console.log(`   POST /add-memory`);
  console.log(`   POST /generate-opportunities`);
  console.log(`   POST /mark-sent`);
  console.log(`   POST /update-status\n`);
});

module.exports = app;
