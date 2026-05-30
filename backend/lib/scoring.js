/**
 * Scoring logic for person-event pair matching.
 * Based on the scoring spec in the tech plan.
 */

/**
 * Score a person against the user's intent/topics.
 * @param {Object} person
 * @param {Object} memory - extracted memory for this person
 * @param {string[]} intentTopics - topics extracted from user intent
 * @param {string} targetCity - city context (visit mode / calendar)
 * @returns {number}
 */
function scorePersonForIntent(person, memory, intentTopics = [], targetCity = null) {
  let score = 0;

  const personInterests = [
    ...(person.interests || []),
    ...(memory?.extracted?.topics || []),
  ].map((t) => t.toLowerCase());

  const futureReasons = (memory?.extracted?.possible_future_reasons || []).map((r) =>
    r.toLowerCase()
  );

  // interest_match: +40
  const hasInterestMatch = intentTopics.some((t) =>
    personInterests.includes(t.toLowerCase())
  );
  if (hasInterestMatch) score += 40;

  // future_reconnect_reason_match: +25
  const hasFutureMatch = intentTopics.some((t) =>
    futureReasons.some((r) => r.includes(t.toLowerCase()))
  );
  if (hasFutureMatch) score += 25;

  // priority_high: +20
  if (person.priority === "high") score += 20;

  // where_met_context: +5
  if (person.where_met) score += 5;

  // city_match: +10
  if (targetCity && person.location?.toLowerCase() === targetCity.toLowerCase()) {
    score += 10;
  }

  return score;
}

/**
 * Score an event against a person's interests and memory.
 * @param {Object} event
 * @param {Object} person
 * @param {Object} memory
 * @param {string} targetCity
 * @returns {number}
 */
function scoreEventForPerson(event, person, memory, targetCity = null) {
  let score = 0;

  const personInterests = [
    ...(person.interests || []),
    ...(memory?.extracted?.topics || []),
  ].map((t) => t.toLowerCase());

  const futureReasons = (memory?.extracted?.possible_future_reasons || []).map((r) =>
    r.toLowerCase()
  );

  const eventTopics = (event.topics || []).map((t) => t.toLowerCase());
  const eventVibe = (event.vibe_tags || []).map((v) => v.toLowerCase());
  const personVibe = (person.vibe_preferences || []).map((v) => v.toLowerCase());

  // event_topic_matches_person_interest: +40
  const topicMatch = eventTopics.some((t) => personInterests.includes(t));
  if (topicMatch) score += 40;

  // event_topic_matches_future_reason: +25
  const futureMatch = eventTopics.some((t) =>
    futureReasons.some((r) => r.includes(t))
  );
  if (futureMatch) score += 25;

  // vibe_match: +20
  const vibeMatch = eventVibe.some((v) => personVibe.includes(v));
  if (vibeMatch) score += 20;

  // event_city_match: +15
  if (targetCity && event.city?.toLowerCase() === targetCity.toLowerCase()) {
    score += 15;
  } else if (event.city?.toLowerCase() === person.location?.toLowerCase()) {
    score += 15;
  }

  // near_term_event: +10 (within 14 days)
  if (event.date) {
    const eventDate = new Date(event.date);
    const now = new Date();
    const diffDays = (eventDate - now) / (1000 * 60 * 60 * 24);
    if (diffDays >= 0 && diffDays <= 14) score += 10;
  }

  // confidence_penalty_if_unclear: -20
  if (event.confidence && event.confidence < 0.7) score -= 20;

  return score;
}

/**
 * Extract topics from a natural language intent string.
 * Simple keyword extraction — no LLM needed for MVP.
 */
const TOPIC_KEYWORDS = [
  "tennis", "ai", "artificial intelligence", "machine learning",
  "hackathon", "startup", "startups", "founders", "education",
  "edtech", "kids", "design", "product", "community", "art",
  "music", "food", "fitness", "sports", "tech", "networking",
  "builders", "market", "creative",
];

function extractTopicsFromIntent(intent = "") {
  const lower = intent.toLowerCase();
  return TOPIC_KEYWORDS.filter((kw) => lower.includes(kw));
}

module.exports = { scorePersonForIntent, scoreEventForPerson, extractTopicsFromIntent };
