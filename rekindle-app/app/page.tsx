"use client";

import { useEffect, useRef, useState } from "react";
import { generateOpportunities, getPeople, markSent } from "@/lib/api";
import { toUICard } from "@/lib/adapters";
import {
  AppCtx, Mode, OpportunityCard, Person, Screen, SearchParams, UICard,
} from "@/lib/types";

import AuthOverlay from "@/components/AuthOverlay";
import PermissionSheet from "@/components/PermissionSheet";
import FeedbackSheet from "@/components/FeedbackSheet";
import OnboardingScreen from "@/components/screens/OnboardingScreen";
import HomeScreen from "@/components/screens/HomeScreen";
import AddMemoryScreen from "@/components/screens/AddMemoryScreen";
import PeopleScreen from "@/components/screens/PeopleScreen";
import PersonDetailScreen from "@/components/screens/PersonDetailScreen";
import ResultsScreen from "@/components/screens/ResultsScreen";
import MessageScreen from "@/components/screens/MessageScreen";
import PipelineScreen from "@/components/screens/PipelineScreen";
import YouScreen from "@/components/screens/YouScreen";
import SettingsScreen from "@/components/screens/SettingsScreen";

// Screen → parent screen for back navigation
const BACK_MAP: Partial<Record<Screen, Screen>> = {
  add: "home",
  people: "home",
  personDetail: "people",
  results: "home",
  message: "results",
  pipeline: "home",
  you: "home",
  settings: "you",
};

const TODAY = new Date().toISOString().split("T")[0];

export default function Page() {
  const [authed, setAuthed] = useState<boolean | null>(true); // skip auth for demo
  const [obDone, setObDone] = useState<boolean | null>(true); // skip onboarding for demo
  const [permOpen, setPermOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [prevScreen, setPrevScreen] = useState<Screen>("home");
  const [people, setPeople] = useState<Person[]>([]);
  const [noticedCards, setNoticedCards] = useState<UICard[]>([]);
  const [noticedLoading, setNoticedLoading] = useState(true);
  const [resultsCards, setResultsCards] = useState<UICard[]>([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsTitle, setResultsTitle] = useState("Suggestions");
  const [resultsMode, setResultsMode] = useState<Mode | null>(null);
  const [currentCard, setCurrentCard] = useState<UICard | null>(null);
  const [pipeline, setPipeline] = useState<Record<string, { card: UICard; status: string }>>({});
  const [detailPersonId, setDetailPersonId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedPeople = useRef<Person[]>([]);

  // Check auth + onboarding on mount
  useEffect(() => {
    setAuthed(localStorage.getItem("rekindle_authed") === "1");
    setObDone(localStorage.getItem("rekindle_ob") === "1");
  }, []);

  // Fetch people + noticed cards on mount
  useEffect(() => {
    getPeople()
      .then(({ people: ps }) => {
        setPeople(ps);
        loadedPeople.current = ps;
        fetchNoticedCards(ps);
      })
      .catch(() => setNoticedLoading(false));
  }, []);

  async function fetchNoticedCards(ps: Person[]) {
    setNoticedLoading(true);
    try {
      const [calData, visitData] = await Promise.all([
        generateOpportunities({
          user_id: "user_maya",
          mode: "calendar_trigger",
          calendar_event: {
            title: "Tennis",
            date: TODAY,
            time: "5:00 PM",
            city: "Seattle",
            topics: ["tennis"],
          },
        }),
        generateOpportunities({
          user_id: "user_maya",
          mode: "visit_mode",
          city: "Seattle",
        }),
      ]);
      const raw: OpportunityCard[] = [
        ...(calData.cards ?? []).slice(0, 1),
        ...(visitData.cards ?? []).slice(0, 1),
      ];
      setNoticedCards(raw.map(c => toUICard(c, ps)));
    } catch {
      // silently fail — home still usable
    } finally {
      setNoticedLoading(false);
    }
  }

  function toast(msg: string) {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2200);
  }

  function showScreen(s: Screen) {
    setPrevScreen(screen);
    setScreen(s);
  }

  function back() {
    const target = BACK_MAP[screen] ?? "home";
    setScreen(target);
  }

  async function startSearch(params: SearchParams) {
    const { mode, intent, personId, city, calendarEvent } = params;
    setResultsMode(mode);
    setResultsCards([]);
    setResultsLoading(true);

    const titles: Record<Mode, string> = {
      person_first: "Get closer to someone",
      event_first: "Who to invite",
      calendar_trigger: "From your calendar",
      visit_mode: "People near you",
    };
    setResultsTitle(titles[mode]);
    showScreen("results");

    try {
      const payload: Parameters<typeof generateOpportunities>[0] = {
        user_id: "user_maya",
        mode,
      };
      if (intent) payload.intent = intent;
      if (personId) payload.person_id = personId;
      if (city) payload.city = city;
      if (calendarEvent) payload.calendar_event = calendarEvent;

      const { cards } = await generateOpportunities(payload);
      setResultsCards(cards.map(c => toUICard(c, loadedPeople.current)));
    } catch (e: any) {
      toast(e.message ?? "Something went wrong");
      setResultsCards([]);
    } finally {
      setResultsLoading(false);
    }
  }

  function openMessage(card: UICard) {
    setCurrentCard(card);
    showScreen("message");
  }

  async function doMarkSent(cardId: string, personId: string, platform: string, message: string) {
    await markSent({ user_id: "user_maya", card_id: cardId, person_id: personId, sent_via: platform, message });
  }

  function addToPipeline(card: UICard) {
    setPipeline(prev => ({
      ...prev,
      [card.id]: { card, status: prev[card.id]?.status ?? "suggested" },
    }));
  }

  function advancePipeline(id: string) {
    const order = ["suggested", "sent", "plan_set", "reconnected"];
    setPipeline(prev => {
      const cur = prev[id]?.status ?? "suggested";
      const next = order[order.indexOf(cur) + 1];
      if (!next) { toast("Already reconnected ✓"); return prev; }
      toast("Moved to " + next.replace("_", " "));
      return { ...prev, [id]: { ...prev[id], status: next } };
    });
  }

  function openPersonDetail(id: string) {
    setDetailPersonId(id);
    showScreen("personDetail");
  }

  function addPerson(p: Person) {
    setPeople(prev => {
      const exists = prev.find(x => x.id === p.id);
      if (exists) return prev;
      const next = [...prev, p];
      loadedPeople.current = next;
      return next;
    });
  }

  function doAuth() {
    localStorage.setItem("rekindle_authed", "1");
    setAuthed(true);
    if (localStorage.getItem("rekindle_ob") !== "1") setObDone(false);
  }

  function finishOnboarding() {
    localStorage.setItem("rekindle_ob", "1");
    setObDone(true);
    setPermOpen(true);
  }

  function showFeedback() {
    setFeedbackOpen(true);
  }

  function restartOnboarding() {
    setObDone(false);
  }

  const ctx: AppCtx = {
    showScreen,
    back,
    toast,
    people,
    addPerson,
    noticedCards,
    noticedLoading,
    resultsCards,
    resultsLoading,
    resultsTitle,
    resultsMode,
    startSearch,
    currentCard,
    openMessage,
    doMarkSent,
    pipeline,
    addToPipeline,
    advancePipeline,
    detailPersonId,
    openPersonDetail,
    showFeedback,
    restartOnboarding,
  };

  const navScreens: Screen[] = ["home", "people", "pipeline", "you"];
  const showFab = screen === "people";

  return (
    <div className="phone">
      <div className="notch" aria-hidden="true" />
      <div className="statusbar">
        <span>9:41</span>
        <span aria-hidden="true">rekindle ✦</span>
      </div>

      {/* Toast */}
      <div className={`toast${toastVisible ? " show" : ""}`} role="status">{toastMsg}</div>

      {/* Auth overlay — only render after mount (authed===null means not yet checked) */}
      {authed === false && <AuthOverlay onDone={doAuth} />}

      {/* Onboarding overlay */}
      {authed === true && obDone === false && <OnboardingScreen onDone={finishOnboarding} />}

      {/* Permission sheet */}
      {permOpen && (
        <PermissionSheet
          onAllow={() => { setPermOpen(false); toast("Location on — showing events near Seattle"); }}
          onDeny={() => setPermOpen(false)}
        />
      )}

      {/* Feedback sheet */}
      {feedbackOpen && (
        <FeedbackSheet
          onClose={() => setFeedbackOpen(false)}
          onSubmit={(r) => { setFeedbackOpen(false); toast(r >= 4 ? "Thanks for the love ✦" : "Thanks — we'll keep improving"); }}
        />
      )}

      {/* Screens */}
      {screen === "home" && <HomeScreen ctx={ctx} />}
      {screen === "add" && <AddMemoryScreen ctx={ctx} />}
      {screen === "people" && <PeopleScreen ctx={ctx} />}
      {screen === "personDetail" && <PersonDetailScreen ctx={ctx} />}
      {screen === "results" && <ResultsScreen ctx={ctx} />}
      {screen === "message" && <MessageScreen ctx={ctx} />}
      {screen === "pipeline" && <PipelineScreen ctx={ctx} />}
      {screen === "you" && <YouScreen ctx={ctx} />}
      {screen === "settings" && <SettingsScreen ctx={ctx} />}

      {/* FAB */}
      {showFab && (
        <button className="fab" onClick={() => showScreen("add")} aria-label="Add someone you've met">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          Add someone
        </button>
      )}

      {/* Bottom nav */}
      <nav className="nav" aria-label="Primary">
        <button
          className={navScreens[0] === screen ? "active" : ""}
          onClick={() => showScreen("home")}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>
          Today
        </button>
        <button
          className={screen === "people" || screen === "personDetail" ? "active" : ""}
          onClick={() => showScreen("people")}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" /><circle cx="17" cy="8" r="2.6" /><path d="M16 14c2.6.2 4.5 2.2 4.5 5" /></svg>
          People
        </button>
        <button
          className={screen === "pipeline" || screen === "results" ? "active" : ""}
          onClick={() => {
            if (resultsCards.length > 0 || resultsLoading) showScreen("results");
            else showScreen("pipeline");
          }}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 9h6M9 13h4" /></svg>
          Queue
        </button>
        <button
          className={screen === "you" || screen === "settings" ? "active" : ""}
          onClick={() => showScreen("you")}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
          You
        </button>
      </nav>
    </div>
  );
}
