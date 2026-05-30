# Rekindle

A relationship reconnection app that suggests opportunities to reach out to the people you want to stay close with — matched to real-world events based on shared interests.

## What it does

Rekindle surfaces timely, contextual reasons to reconnect. Instead of just reminding you to "reach out to Robert," it finds a relevant event — a tennis tournament, a hackathon, a jazz night — and generates a natural, personalized message you can actually send.

It works in four modes:

- **Person First** — pick someone you want to get closer to; Rekindle finds the best event to invite them to
- **Event First** — describe what you want to do; Rekindle finds who from your network fits best
- **Calendar Trigger** — when you add something to your calendar (e.g. "Tennis Saturday"), Rekindle asks: who should you invite?
- **Visit Mode** — going to a city? Rekindle shows who's there and what you could do together

AI (Claude) generates the reconnection messages and explains why each match makes sense.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Express.js (Node) |
| AI | Anthropic Claude (`claude-haiku-4-5`) |
| Storage | JSON flat files (no database) |

## Project structure

```
Rekindle/
├── rekindle-app/         # Next.js frontend (port 3000)
│   ├── app/              # App router entry + global styles
│   ├── components/       # Screen components (Home, People, Results, Message, etc.)
│   └── lib/              # API client, types, adapters
└── backend/              # Express API (port 3001)
    ├── routes/           # opportunities, people, events, memory, actions
    ├── lib/              # scoring.js, messageGenerator.js, dataStore.js
    └── data/             # people.json, public_events.json, memories.json
```

## Running locally

You need two terminals — one for the backend, one for the frontend.

### 1. Backend

```bash
cd backend
npm install
```

Copy the env file and add your Anthropic API key:

```bash
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
```

Start the server:

```bash
npm start        # production
npm run dev      # with auto-reload (nodemon)
```

Backend runs on **http://localhost:3001**.

> Without an API key, the app still works — message generation falls back to templates.

### 2. Frontend

```bash
cd rekindle-app
npm install
npm run dev
```

Frontend runs on **http://localhost:3000**.

## Seed data

The app ships with 6 seed contacts (Robert, Dana, Marcus, Priya, James, Sofia) and 11 Seattle events in `backend/data/`. No setup needed — it works out of the box.

## Key API endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/generate-opportunities` | Core matching — accepts `mode` + context, returns scored cards |
| `GET` | `/people` | All contacts |
| `GET` | `/events` | All public events |
| `POST` | `/memory` | Add a note about a person |
| `POST` | `/actions/mark-sent` | Record that a message was sent |

## How matching works

Each person-event pair is scored by `backend/lib/scoring.js`:

- **`scoreEventForPerson`** — matches event topics to person interests + memory notes
- **`scorePersonForIntent`** — matches a user's stated intent to a person's profile

In `event_first` mode, a person must score ≥ 40 on intent (not just the event) to appear as a result. Confidence is `score / max_possible`, capped at 0.95.

Topic extraction (what "going to a hackathon" actually means as topics) is done via a Claude call that explicitly blocks financial/professional terms to prevent false matches.
