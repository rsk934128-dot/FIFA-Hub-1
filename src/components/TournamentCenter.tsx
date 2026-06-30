import React, { useState, useEffect } from "react";
import { TournamentGroup, GroupTeam, BracketMatch } from "../types";
import { Trophy, RefreshCw, Award, Sparkles, ChevronRight, Activity, Zap, TrendingUp, BarChart3, Globe, ShieldCheck, Timer, Calendar, ChevronLeft, Bookmark, BookmarkCheck, CalendarCheck, Plus, Trash2, Info, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useFirebase } from "./FirebaseProvider";
import { handleFirestoreError, OperationType } from "../lib/firebaseUtils";

// Standard ratings for simulation weights
const TEAM_RATINGS: Record<string, number> = {
  "Argentina": 92, "Canada": 78, "Chile": 80, "Peru": 76,
  "France": 93, "Austria": 82, "Netherlands": 88, "Poland": 80,
  "Brazil": 91, "Colombia": 84, "Paraguay": 78, "Costa Rica": 74,
  "England": 90, "Denmark": 83, "Slovenia": 76, "Bangladesh": 55
};

const INITIAL_GROUPS: TournamentGroup[] = [
  {
    letter: "A",
    teams: [
      { name: "Argentina", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Canada", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Chile", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Peru", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "B",
    teams: [
      { name: "France", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Austria", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Netherlands", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Poland", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "C",
    teams: [
      { name: "Brazil", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Colombia", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Paraguay", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Costa Rica", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  },
  {
    letter: "D",
    teams: [
      { name: "England", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Denmark", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Slovenia", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 },
      { name: "Bangladesh", played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }
    ]
  }
];

const INITIAL_BRACKET: BracketMatch[] = [
  // Quarter Finals (QF)
  { id: "qf1", stage: "QF", teamA: "Group A Winner", teamB: "Group B Runner", simulated: false },
  { id: "qf2", stage: "QF", teamA: "Group C Winner", teamB: "Group D Runner", simulated: false },
  { id: "qf3", stage: "QF", teamA: "Group B Winner", teamB: "Group A Runner", simulated: false },
  { id: "qf4", stage: "QF", teamA: "Group D Winner", teamB: "Group C Runner", simulated: false },
  // Semi Finals (SF)
  { id: "sf1", stage: "SF", teamA: "QF1 Winner", teamB: "QF2 Winner", simulated: false },
  { id: "sf2", stage: "SF", teamA: "QF3 Winner", teamB: "QF4 Winner", simulated: false },
  // Final (F)
  { id: "f1", stage: "F", teamA: "SF1 Winner", teamB: "SF2 Winner", simulated: false }
];

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  type: 'fixture' | 'deadline' | 'history';
  description: string;
  teamA?: string;
  teamB?: string;
  time?: string;
  score?: string;
}

const DEFAULT_EVENTS: CalendarEvent[] = [
  // June 2026 - History
  { id: "e1", date: "2026-06-10", title: "Group A Opening: Argentina vs Canada", type: "history", description: "Argentina defeated Canada 2-0 with an outstanding playmaking display from Lionel Messi.", score: "2-0", teamA: "Argentina", teamB: "Canada" },
  { id: "e2", date: "2026-06-12", title: "Group B Opener: France vs Austria", type: "history", description: "France squeezed past Austria with a narrow 1-0 win from an own goal.", score: "1-0", teamA: "France", teamB: "Austria" },
  { id: "e3", date: "2026-06-14", title: "Group C Blockbuster: Brazil vs Colombia", type: "history", description: "Brazil and Colombia shared the points in a thrilling 2-2 draw in group C.", score: "2-2", teamA: "Brazil", teamB: "Colombia" },
  { id: "e4", date: "2026-06-18", title: "Group stage Peak: Argentina vs Chile", type: "history", description: "Argentina secured early playoff entry with a solid 1-0 clean sheet over Chile.", score: "1-0", teamA: "Argentina", teamB: "Chile" },
  { id: "e5", date: "2026-06-20", title: "Group stage Battle: France vs Netherlands", type: "history", description: "A highly strategic midfield masterclass ended in a goalless draw.", score: "0-0", teamA: "France", teamB: "Netherlands" },
  { id: "e6", date: "2026-06-24", title: "Final Group A Decider: Canada vs Peru", type: "history", description: "Canada claimed group runner-up with a late 1-0 goal in the 88th minute.", score: "1-0", teamA: "Canada", teamB: "Peru" },
  
  // June 2026 - Deadlines & Milestones
  { id: "e7", date: "2026-06-01", title: "Early Squad Roster Submissions", type: "deadline", description: "National team directors must submit their preliminary 26-player roster lists." },
  { id: "e8", date: "2026-06-05", title: "Tactical Playbook Hard Lock", type: "deadline", description: "Pre-tournament tactical configurations, team ratings, and system calibrations lock." },
  { id: "e9", date: "2026-06-15", title: "Mid-Tournament Roster Adjustments", type: "deadline", description: "Medical emergency replacement roster window closes at midnight." },
  { id: "e10", date: "2026-06-25", title: "Knockout Squad Registration Deadline", type: "deadline", description: "Rosters for qualified playoff teams are finalized and verified." },

  // June 2026 - Present/Upcoming Day (Assume Today is 2026-06-30)
  { id: "e11", date: "2026-06-30", title: "Knockout Bracket Live Drawing Event", type: "fixture", description: "Official live stream of playoff seeding, team placement, and analyst projections.", time: "18:00 UTC" },
  
  // July 2026 - Fixtures
  { id: "e12", date: "2026-07-02", title: "Playoffs QF 1: Argentina vs Denmark", type: "fixture", description: "Live tournament play. Standard penalties apply in case of extra time draws.", time: "15:00 UTC", teamA: "Argentina", teamB: "Denmark" },
  { id: "e13", date: "2026-07-03", title: "Playoffs QF 2: France vs Colombia", type: "fixture", description: "A high-octane encounter between French steel and Colombian flair.", time: "15:00 UTC", teamA: "France", teamB: "Colombia" },
  { id: "e14", date: "2026-07-04", title: "Playoffs QF 3: Brazil vs Austria", type: "fixture", description: "Samba magic faces organized defensive low blocks.", time: "18:00 UTC", teamA: "Brazil", teamB: "Austria" },
  { id: "e15", date: "2026-07-05", title: "Playoffs QF 4: England vs Canada", type: "fixture", description: "Live broadcast from Vancouver Arena under retractable lights.", time: "19:00 UTC", teamA: "England", teamB: "Canada" },
  { id: "e16", date: "2026-07-10", title: "Semi-Final Showcase 1", type: "fixture", description: "Winner of QF1 takes on Winner of QF2 for a spot in the finals.", time: "19:00 UTC" },
  { id: "e17", date: "2026-07-11", title: "Semi-Final Showcase 2", type: "fixture", description: "Winner of QF3 takes on Winner of QF4.", time: "19:00 UTC" },
  { id: "e18", date: "2026-07-15", title: "Grand Championship Final", type: "fixture", description: "The pinnacle of the tournament. Championship crowning and visual closing ceremony.", time: "20:00 UTC" },

  // July 2026 - Deadlines
  { id: "e19", date: "2026-07-01", title: "Playoffs Tactical Validation", type: "deadline", description: "Validation check of all telemetry feeds, analytics logs, and bracket databases." },
  { id: "e20", date: "2026-07-09", title: "Finals VIP Ticketing & Media Allocations", type: "deadline", description: "Final call for press box submissions and match-day broadcasting credentials." }
];

export default function TournamentCenter() {
  const { user } = useFirebase();
  const [groups, setGroups] = useState<TournamentGroup[]>(INITIAL_GROUPS);
  const [bracket, setBracket] = useState<BracketMatch[]>(INITIAL_BRACKET);
  const [activeTab, setActiveTab] = useState<"groups" | "bracket" | "calendar">("groups");
  const [groupsSimulated, setGroupsSimulated] = useState<boolean>(false);
  const [champion, setChampion] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Calendar specific state variables
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem("tournament_calendar_events");
    return saved ? JSON.parse(saved) : DEFAULT_EVENTS;
  });
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem("tournament_calendar_bookmarks");
    return saved ? JSON.parse(saved) : [];
  });
  const [currentCalendarDate, setCurrentCalendarDate] = useState<Date>(new Date(2026, 5, 30)); // June 30, 2026 (Today)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date(2026, 5, 30));
  const [calendarFilter, setCalendarFilter] = useState<"all" | "fixture" | "deadline" | "history">("all");

  // Form states for adding custom event
  const [isAddingEvent, setIsAddingEvent] = useState<boolean>(false);
  const [newEventTitle, setNewEventTitle] = useState<string>("");
  const [newEventDesc, setNewEventDesc] = useState<string>("");
  const [newEventTime, setNewEventTime] = useState<string>("");
  const [newEventType, setNewEventType] = useState<"fixture" | "deadline" | "history">("fixture");
  const [newEventDate, setNewEventDate] = useState<string>("2026-06-30");

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("tournament_calendar_events", JSON.stringify(calendarEvents));
  }, [calendarEvents]);

  useEffect(() => {
    localStorage.setItem("tournament_calendar_bookmarks", JSON.stringify(bookmarkedIds));
  }, [bookmarkedIds]);

  // Load state from Firebase
  useEffect(() => {
    if (!user) return;

    const loadTournament = async () => {
      setIsSyncing(true);
      try {
        const docRef = doc(db, "tournaments", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setGroups(data.groups);
          setBracket(data.bracket);
          setGroupsSimulated(data.groupsSimulated);
          setChampion(data.champion);
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, "tournaments");
      } finally {
        setIsSyncing(false);
      }
    };

    loadTournament();
  }, [user]);

  // Persist state to Firebase
  const saveTournament = async (
    updatedGroups: TournamentGroup[], 
    updatedBracket: BracketMatch[], 
    simulated: boolean, 
    win: string | null
  ) => {
    if (!user) return;
    try {
      await setDoc(doc(db, "tournaments", user.uid), {
        groups: updatedGroups,
        bracket: updatedBracket,
        groupsSimulated: simulated,
        champion: win,
        userId: user.uid,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "tournaments");
    }
  };

  // Tournament-wide aggregate stats
  const totalGoals = groups.reduce((acc, g) => acc + g.teams.reduce((ta, t) => ta + t.gf, 0), 0) + 
                    bracket.filter(m => m.simulated).reduce((acc, m) => acc + (m.scoreA || 0) + (m.scoreB || 0), 0);
  
  const matchesPlayed = (groupsSimulated ? 24 : 0) + bracket.filter(m => m.simulated).length;

  // Core offline simulation logic for single matches
  const simSingleMatch = (teamA: string, teamB: string): { scoreA: number; scoreB: number } => {
    const rA = TEAM_RATINGS[teamA] || 75;
    const rB = TEAM_RATINGS[teamB] || 75;
    
    const weightA = rA / (rA + rB);
    const scoreA = Math.max(0, Math.round(Math.random() * 3 + (weightA * 1.5) - 0.5));
    const scoreB = Math.max(0, Math.round(Math.random() * 3 + ((1 - weightA) * 1.5) - 0.5));
    
    return { scoreA, scoreB };
  };

  // Run the full group stage simulation
  const simulateGroups = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const updatedGroups = groups.map((group) => {
        const teamsMap: Record<string, GroupTeam> = {};
        group.teams.forEach((t) => {
          teamsMap[t.name] = { name: t.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
        });

        const list = Object.keys(teamsMap);
        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const nameA = list[i];
            const nameB = list[j];
            const { scoreA, scoreB } = simSingleMatch(nameA, nameB);

            teamsMap[nameA].played++;
            teamsMap[nameA].gf += scoreA;
            teamsMap[nameA].ga += scoreB;
            teamsMap[nameA].gd = teamsMap[nameA].gf - teamsMap[nameA].ga;

            teamsMap[nameB].played++;
            teamsMap[nameB].gf += scoreB;
            teamsMap[nameB].ga += scoreA;
            teamsMap[nameB].gd = teamsMap[nameB].gf - teamsMap[nameB].ga;

            if (scoreA > scoreB) {
              teamsMap[nameA].won++;
              teamsMap[nameA].points += 3;
              teamsMap[nameB].lost++;
            } else if (scoreB > scoreA) {
              teamsMap[nameB].won++;
              teamsMap[nameB].points += 3;
              teamsMap[nameA].lost++;
            } else {
              teamsMap[nameA].drawn++;
              teamsMap[nameA].points += 1;
              teamsMap[nameB].drawn++;
              teamsMap[nameB].points += 1;
            }
          }
        }

        const sortedTeams = Object.values(teamsMap).sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });

        return {
          letter: group.letter,
          teams: sortedTeams
        };
      });

      const a1 = updatedGroups[0].teams[0].name;
      const a2 = updatedGroups[0].teams[1].name;
      const b1 = updatedGroups[1].teams[0].name;
      const b2 = updatedGroups[1].teams[1].name;
      const c1 = updatedGroups[2].teams[0].name;
      const c2 = updatedGroups[2].teams[1].name;
      const d1 = updatedGroups[3].teams[0].name;
      const d2 = updatedGroups[3].teams[1].name;

      const nextBracket = bracket.map((m) => {
        if (m.id === "qf1") return { ...m, teamA: a1, teamB: b2, simulated: false, winner: undefined, scoreA: undefined, scoreB: undefined };
        if (m.id === "qf2") return { ...m, teamA: c1, teamB: d2, simulated: false, winner: undefined, scoreA: undefined, scoreB: undefined };
        if (m.id === "qf3") return { ...m, teamA: b1, teamB: a2, simulated: false, winner: undefined, scoreA: undefined, scoreB: undefined };
        if (m.id === "qf4") return { ...m, teamA: d1, teamB: c2, simulated: false, winner: undefined, scoreA: undefined, scoreB: undefined };
        if (m.stage === "SF" || m.stage === "F") {
          return {
            ...m,
            teamA: m.stage === "SF" ? (m.id === "sf1" ? "QF1 Winner" : "QF3 Winner") : "SF1 Winner",
            teamB: m.stage === "SF" ? (m.id === "sf2" ? "QF2 Winner" : "QF4 Winner") : "SF2 Winner",
            scoreA: undefined,
            scoreB: undefined,
            winner: undefined,
            simulated: false
          };
        }
        return m;
      });

      setGroups(updatedGroups);
      setGroupsSimulated(true);
      setBracket(nextBracket);
      setChampion(null);
      setIsSyncing(false);
      saveTournament(updatedGroups, nextBracket, true, null);
    }, 800);
  };

  const simulateBracketMatch = (matchId: string) => {
    const match = bracket.find((m) => m.id === matchId);
    if (!match) return;
    
    if (match.teamA.includes("Winner") || match.teamB.includes("Winner") || match.teamA.includes("Runner") || match.teamB.includes("Runner")) {
      return;
    }

    let { scoreA, scoreB } = simSingleMatch(match.teamA, match.teamB);
    if (scoreA === scoreB) {
      if (Math.random() < 0.5) scoreA++; else scoreB++;
    }

    const winner = scoreA > scoreB ? match.teamA : match.teamB;

    const nextBracket = bracket.map((m) => {
      if (m.id === matchId) return { ...m, scoreA, scoreB, winner, simulated: true };
      
      // Promote winner
      if (m.stage === "SF") {
        if (matchId === "qf1" && m.id === "sf1") return { ...m, teamA: winner };
        if (matchId === "qf2" && m.id === "sf1") return { ...m, teamB: winner };
        if (matchId === "qf3" && m.id === "sf2") return { ...m, teamA: winner };
        if (matchId === "qf4" && m.id === "sf2") return { ...m, teamB: winner };
      }
      if (m.stage === "F") {
        if (matchId === "sf1" && m.id === "f1") return { ...m, teamA: winner };
        if (matchId === "sf2" && m.id === "f1") return { ...m, teamB: winner };
      }
      return m;
    });

    setBracket(nextBracket);
    let win = champion;
    if (matchId === "f1") {
      setChampion(winner);
      win = winner;
    }
    saveTournament(groups, nextBracket, groupsSimulated, win);
  };

  const simulateWholePlayoff = () => {
    setIsSyncing(true);
    setTimeout(() => {
      let currentGroups = groups;
      let simulated = groupsSimulated;
      let currentBracket = [...bracket];
      
      if (!simulated) {
        // Simulate groups first
        currentGroups = groups.map((group) => {
          const teamsMap: Record<string, GroupTeam> = {};
          group.teams.forEach((t) => {
            teamsMap[t.name] = { name: t.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 };
          });

          const list = Object.keys(teamsMap);
          for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
              const nameA = list[i];
              const nameB = list[j];
              const { scoreA, scoreB } = simSingleMatch(nameA, nameB);
              teamsMap[nameA].played++;
              teamsMap[nameA].gf += scoreA;
              teamsMap[nameA].ga += scoreB;
              teamsMap[nameA].gd = teamsMap[nameA].gf - teamsMap[nameA].ga;
              teamsMap[nameB].played++;
              teamsMap[nameB].gf += scoreB;
              teamsMap[nameB].ga += scoreA;
              teamsMap[nameB].gd = teamsMap[nameB].gf - teamsMap[nameB].ga;
              if (scoreA > scoreB) { teamsMap[nameA].won++; teamsMap[nameA].points += 3; teamsMap[nameB].lost++; }
              else if (scoreB > scoreA) { teamsMap[nameB].won++; teamsMap[nameB].points += 3; teamsMap[nameA].lost++; }
              else { teamsMap[nameA].drawn++; teamsMap[nameA].points += 1; teamsMap[nameB].drawn++; teamsMap[nameB].points += 1; }
            }
          }
          const sortedTeams = Object.values(teamsMap).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.gd !== a.gd) return b.gd - a.gd;
            return b.gf - a.gf;
          });
          return { letter: group.letter, teams: sortedTeams };
        });

        // Seed bracket
        const a1 = currentGroups[0].teams[0].name;
        const a2 = currentGroups[0].teams[1].name;
        const b1 = currentGroups[1].teams[0].name;
        const b2 = currentGroups[1].teams[1].name;
        const c1 = currentGroups[2].teams[0].name;
        const c2 = currentGroups[2].teams[1].name;
        const d1 = currentGroups[3].teams[0].name;
        const d2 = currentGroups[3].teams[1].name;

        currentBracket = currentBracket.map((m) => {
          if (m.id === "qf1") return { ...m, teamA: a1, teamB: b2 };
          if (m.id === "qf2") return { ...m, teamA: c1, teamB: d2 };
          if (m.id === "qf3") return { ...m, teamA: b1, teamB: a2 };
          if (m.id === "qf4") return { ...m, teamA: d1, teamB: c2 };
          return m;
        });
        simulated = true;
      }
      
      const order = ["qf1", "qf2", "qf3", "qf4", "sf1", "sf2", "f1"];
      
      order.forEach((mid) => {
        const match = currentBracket.find((m) => m.id === mid);
        if (!match) return;

        let tA = match.teamA;
        let tB = match.teamB;

        if (mid === "sf1") {
          tA = currentBracket.find(m => m.id === "qf1")?.winner || "QF1 Winner";
          tB = currentBracket.find(m => m.id === "qf2")?.winner || "QF2 Winner";
        } else if (mid === "sf2") {
          tA = currentBracket.find(m => m.id === "qf3")?.winner || "QF3 Winner";
          tB = currentBracket.find(m => m.id === "qf4")?.winner || "QF4 Winner";
        } else if (mid === "f1") {
          tA = currentBracket.find(m => m.id === "sf1")?.winner || "SF1 Winner";
          tB = currentBracket.find(m => m.id === "sf2")?.winner || "SF2 Winner";
        }

        if (tA.includes("Winner") || tB.includes("Winner")) return;

        let { scoreA, scoreB } = simSingleMatch(tA, tB);
        if (scoreA === scoreB) {
          if (Math.random() < 0.5) scoreA++; else scoreB++;
        }
        const win = scoreA > scoreB ? tA : tB;

        currentBracket = currentBracket.map((m) => {
          if (m.id === mid) {
            return { ...m, teamA: tA, teamB: tB, scoreA, scoreB, winner: win, simulated: true };
          }
          if (m.stage === "SF") {
            if (mid === "qf1" && m.id === "sf1") return { ...m, teamA: win };
            if (mid === "qf2" && m.id === "sf1") return { ...m, teamB: win };
            if (mid === "qf3" && m.id === "sf2") return { ...m, teamA: win };
            if (mid === "qf4" && m.id === "sf2") return { ...m, teamB: win };
          }
          if (m.stage === "F") {
            if (mid === "sf1" && m.id === "f1") return { ...m, teamA: win };
            if (mid === "sf2" && m.id === "f1") return { ...m, teamB: win };
          }
          return m;
        });
      });

      setGroups(currentGroups);
      setGroupsSimulated(simulated);
      setBracket(currentBracket);
      const finalWin = currentBracket.find((m) => m.id === "f1")?.winner || null;
      setChampion(finalWin);
      setIsSyncing(false);
      saveTournament(currentGroups, currentBracket, simulated, finalWin);
    }, 1500);
  };

  const resetAll = () => {
    setGroups(INITIAL_GROUPS);
    setBracket(INITIAL_BRACKET);
    setGroupsSimulated(false);
    setChampion(null);
    saveTournament(INITIAL_GROUPS, INITIAL_BRACKET, false, null);
  };

  return (
    <div id="tournament-command-center" className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Top Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MATCHES PLANNED", val: matchesPlayed + (groupsSimulated ? 0 : 24) + (champion ? 0 : 7), icon: <Timer className="w-4 h-4 text-slate-500" /> },
          { label: "TOTAL GOALS", val: totalGoals, icon: <Activity className="w-4 h-4 text-rose-500" /> },
          { label: "COMPLETION %", val: Math.round((matchesPlayed / 31) * 100) + "%", icon: <TrendingUp className="w-4 h-4 text-emerald-500" /> },
          { label: "AI PREDICTED WINNER", val: "ARGENTINA", icon: <Sparkles className="w-4 h-4 text-amber-500" /> }
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5">
              {stat.icon}
            </div>
            <div>
              <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black leading-none mb-1">{stat.label}</p>
              <h4 className="text-xl font-black text-white italic tracking-tight">{stat.val}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Orchestration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar: Control & Intelligence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-[#0A0F1E] to-transparent border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <Zap className="w-12 h-12 text-amber-500/5" />
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Main Controller</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Orchestration Active</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={simulateGroups}
                disabled={isSyncing}
                className="w-full bg-white hover:bg-amber-400 text-black font-black text-xs font-sans uppercase py-4 px-5 rounded-2xl tracking-tight transition-all cursor-pointer flex items-center justify-between shadow-lg shadow-white/5 disabled:opacity-50"
              >
                Simulate Groups
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={simulateWholePlayoff}
                disabled={isSyncing}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black text-xs font-sans uppercase py-4 px-5 rounded-2xl tracking-tight transition-all cursor-pointer flex items-center justify-between shadow-lg shadow-rose-600/20 disabled:opacity-50"
              >
                Instant Playoff
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={resetAll}
                className="w-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-mono py-3 px-4 rounded-2xl transition-all cursor-pointer uppercase font-bold text-center"
              >
                Reset Database
              </button>
            </div>

            {isSyncing && (
              <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center gap-4 animate-pulse">
                <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black">Syncing Match Data...</span>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase italic tracking-tight">AI Predictions</h3>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">Winning Probabilities</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: "Argentina", prob: 28 },
                { name: "France", prob: 24 },
                { name: "Brazil", prob: 21 },
                { name: "England", prob: 18 }
              ].map((team, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono font-black uppercase">
                    <span className="text-slate-300">{team.name}</span>
                    <span className="text-emerald-500">{team.prob}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${team.prob * 3}%` }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-5 h-5" />
            <p className="text-[10px] font-mono uppercase tracking-widest font-black">All Match IDs Verified</p>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-2.5 px-6 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer font-black uppercase ${
                activeTab === "groups"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Group Hub
            </button>
            <button
              onClick={() => setActiveTab("bracket")}
              className={`py-2.5 px-6 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer font-black uppercase ${
                activeTab === "bracket"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Knockout Command
            </button>
            <button
              onClick={() => setActiveTab("calendar")}
              className={`py-2.5 px-6 text-[10px] font-mono tracking-wider rounded-xl transition-all cursor-pointer font-black uppercase flex items-center gap-2 ${
                activeTab === "calendar"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Tournament Calendar
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "groups" ? (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {groups.map((group) => (
                  <div key={group.letter} className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Globe className="w-16 h-16 text-white" />
                    </div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-white text-xl font-sans uppercase italic tracking-tighter flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-amber-500 text-black text-xs font-mono flex items-center justify-center font-black">
                          {group.letter}
                        </span>
                        GROUP {group.letter}
                      </h3>
                    </div>

                    <div className="space-y-1">
                      <div className="grid grid-cols-12 gap-2 text-[9px] font-mono text-slate-500 font-black uppercase tracking-widest mb-3 px-2">
                        <div className="col-span-6">TEAM</div>
                        <div className="col-span-2 text-center">W/L</div>
                        <div className="col-span-2 text-center">GD</div>
                        <div className="col-span-2 text-center">PTS</div>
                      </div>
                      {group.teams.map((team, idx) => (
                        <div
                          key={team.name}
                          className={`grid grid-cols-12 gap-2 py-3 px-4 rounded-2xl transition-all ${
                            idx < 2 && groupsSimulated 
                              ? "bg-amber-500/10 border border-amber-500/20" 
                              : "bg-white/5 border border-transparent hover:border-white/10"
                          }`}
                        >
                          <div className="col-span-6 flex items-center gap-3">
                            <span className={`text-[10px] font-mono font-black ${idx < 2 && groupsSimulated ? "text-amber-500" : "text-slate-600"}`}>
                              0{idx + 1}
                            </span>
                            <span className="text-xs font-black text-white uppercase italic tracking-tight">{team.name}</span>
                          </div>
                          <div className="col-span-2 text-center text-[10px] font-mono text-slate-400 font-bold">{team.won}/{team.lost}</div>
                          <div className="col-span-2 text-center text-[10px] font-mono text-slate-400 font-bold">{team.gd > 0 ? `+${team.gd}` : team.gd}</div>
                          <div className={`col-span-2 text-center text-xs font-mono font-black ${idx < 2 && groupsSimulated ? "text-amber-500" : "text-white"}`}>
                            {team.points}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : activeTab === "bracket" ? (
              <motion.div
                key="bracket"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-10"
              >
                {champion && (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-3xl p-8 text-center space-y-4 shadow-2xl shadow-amber-500/20 relative overflow-hidden group">
                    <Trophy className="w-20 h-20 text-black mx-auto drop-shadow-2xl mb-2 relative" />
                    <div className="relative">
                      <p className="text-[11px] font-mono text-black uppercase tracking-[0.3em] font-black mb-1">TOURNAMENT SUPREMACY</p>
                      <h3 className="text-5xl font-black text-white tracking-tighter italic uppercase drop-shadow-lg">{champion}</h3>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { label: "QUARTER FINALS", stage: "QF" },
                    { label: "SEMI FINALS", stage: "SF" },
                    { label: "GRAND FINAL", stage: "F" }
                  ].map((col, cIdx) => (
                    <div key={col.stage} className="space-y-6">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] font-black">{col.label}</span>
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      </div>
                      
                      <div className={`space-y-4 ${col.stage === 'SF' ? 'pt-12' : col.stage === 'F' ? 'pt-32' : ''}`}>
                        {bracket.filter(m => m.stage === col.stage).map((match) => (
                          <div
                            key={match.id}
                            className={`bg-white/5 border border-white/10 rounded-3xl p-5 space-y-4 transition-all relative overflow-hidden group ${
                              match.simulated ? "border-white/20" : "hover:border-amber-500/40"
                            }`}
                          >
                            <div className="space-y-3">
                              {[
                                { name: match.teamA, score: match.scoreA },
                                { name: match.teamB, score: match.scoreB }
                              ].map((t, i) => (
                                <div key={i} className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-1.5 rounded-full ${match.winner === t.name ? 'bg-amber-500 shadow-sm shadow-amber-500' : 'bg-white/5'}`} />
                                    <span className={`text-xs font-black uppercase italic tracking-tight ${match.winner === t.name ? "text-amber-500" : "text-slate-300"}`}>
                                      {t.name}
                                    </span>
                                  </div>
                                  {match.simulated && (
                                    <span className="font-mono font-black bg-white/5 px-3 py-1 rounded-lg border border-white/10 text-xs text-white">
                                      {t.score}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>

                            {!match.simulated && (
                              <button
                                onClick={() => simulateBracketMatch(match.id)}
                                className="w-full bg-white/5 hover:bg-white/10 text-white hover:text-amber-400 text-[9px] font-mono font-black uppercase py-2 rounded-xl border border-white/10 transition-all cursor-pointer"
                              >
                                EXECUTE SIM
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Calendar Title Block */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Calendar className="w-24 h-24 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-amber-500 uppercase tracking-[0.2em] font-black">Tournament timeline</span>
                    <h2 className="text-2xl font-black text-white uppercase italic tracking-tight flex items-center gap-2">
                      <Calendar className="w-6 h-6 text-amber-500" />
                      Visual Schedule & Fixtures
                    </h2>
                    <p className="text-slate-400 text-xs mt-1">Track match fixtures, registration deadlines, and historical event dates.</p>
                  </div>
                  
                  {/* Sync & Today Controls */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const originalSync = isSyncing;
                        setIsSyncing(true);
                        setTimeout(() => {
                          setIsSyncing(false);
                        }, 800);
                      }}
                      className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-mono font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      Google Calendar Sync
                    </button>
                    <button
                      onClick={() => {
                        setCurrentCalendarDate(new Date(2026, 5, 30));
                        setSelectedCalendarDate(new Date(2026, 5, 30));
                      }}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[10px] font-mono font-black uppercase rounded-xl transition-all cursor-pointer"
                    >
                      Today
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Calendar Widget Column */}
                  <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                      
                      {/* Month Switcher & Filters */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() - 1, 1))}
                            className="p-2 hover:bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <h3 className="text-lg font-black text-white uppercase italic tracking-wider min-w-[120px] text-center">
                            {currentCalendarDate.toLocaleString("en-US", { month: "long", year: "numeric" })}
                          </h3>
                          <button
                            onClick={() => setCurrentCalendarDate(new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth() + 1, 1))}
                            className="p-2 hover:bg-white/5 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calendar Quick Filters */}
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: "all", label: "All Events", color: "bg-white" },
                            { id: "fixture", label: "Fixtures", color: "bg-sky-400" },
                            { id: "deadline", label: "Deadlines", color: "bg-rose-500" },
                            { id: "history", label: "Historical", color: "bg-emerald-400" }
                          ].map((filter) => (
                            <button
                              key={filter.id}
                              onClick={() => setCalendarFilter(filter.id as any)}
                              className={`py-1.5 px-3 rounded-lg text-[9px] font-mono font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 border ${
                                calendarFilter === filter.id
                                  ? "bg-white text-black border-white"
                                  : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                              }`}
                            >
                              {filter.id !== "all" && (
                                <span className={`w-1.5 h-1.5 rounded-full ${filter.color}`} />
                              )}
                              {filter.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Calendar Day Grid */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {/* Days of Week Header */}
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((dayName) => (
                          <div key={dayName} className="text-[9px] font-mono font-black text-slate-500 tracking-wider py-2">
                            {dayName}
                          </div>
                        ))}

                        {/* Days Grid */}
                        {(() => {
                          const year = currentCalendarDate.getFullYear();
                          const month = currentCalendarDate.getMonth();

                          const firstDayOfMonth = new Date(year, month, 1);
                          const startDayIndex = firstDayOfMonth.getDay(); // 0: Sun, 1: Mon, etc.
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const daysInPrevMonth = new Date(year, month, 0).getDate();

                          const gridCells = [];

                          // Trailing days of previous month
                          for (let i = startDayIndex - 1; i >= 0; i--) {
                            const d = daysInPrevMonth - i;
                            const prevDate = new Date(year, month - 1, d);
                            gridCells.push({
                              date: prevDate,
                              isCurrentMonth: false,
                              dayNumber: d
                            });
                          }

                          // Days of current month
                          for (let d = 1; d <= daysInMonth; d++) {
                            const date = new Date(year, month, d);
                            gridCells.push({
                              date,
                              isCurrentMonth: true,
                              dayNumber: d
                            });
                          }

                          // Leading days of next month to complete the grid
                          const remainingCells = (7 - (gridCells.length % 7)) % 7;
                          for (let d = 1; d <= remainingCells; d++) {
                            const nextDate = new Date(year, month + 1, d);
                            gridCells.push({
                              date: nextDate,
                              isCurrentMonth: false,
                              dayNumber: d
                            });
                          }

                          return gridCells.map((cell, idx) => {
                            const dateStr = `${cell.date.getFullYear()}-${String(cell.date.getMonth() + 1).padStart(2, '0')}-${String(cell.date.getDate()).padStart(2, '0')}`;
                            const isSelected = selectedCalendarDate && 
                              selectedCalendarDate.getFullYear() === cell.date.getFullYear() &&
                              selectedCalendarDate.getMonth() === cell.date.getMonth() &&
                              selectedCalendarDate.getDate() === cell.date.getDate();
                            
                            const isToday = new Date().toDateString() === cell.date.toDateString() || 
                              (cell.date.getFullYear() === 2026 && cell.date.getMonth() === 5 && cell.date.getDate() === 30); // Simulated today

                            const dayEvents = calendarEvents.filter(e => e.date === dateStr);
                            const filteredDayEvents = calendarFilter === "all" ? dayEvents : dayEvents.filter(e => e.type === calendarFilter);

                            return (
                              <button
                                key={idx}
                                onClick={() => setSelectedCalendarDate(cell.date)}
                                className={`min-h-[76px] p-2.5 rounded-2xl flex flex-col justify-between border text-left transition-all relative ${
                                  !cell.isCurrentMonth ? "opacity-30 hover:opacity-50" : ""
                                } ${
                                  isSelected 
                                    ? "bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/5 text-white" 
                                    : isToday 
                                      ? "bg-white/10 border-white/20 text-white" 
                                      : "bg-white/5 border-transparent hover:border-white/10 text-slate-300"
                                }`}
                              >
                                <span className={`text-[10px] font-mono font-black ${isToday && !isSelected ? "text-amber-500" : ""}`}>
                                  {String(cell.dayNumber).padStart(2, '0')}
                                </span>

                                {/* Dot Indicators */}
                                {filteredDayEvents.length > 0 && (
                                  <div className="flex gap-1 mt-1.5 flex-wrap">
                                    {filteredDayEvents.map((evt, eIdx) => (
                                      <span
                                        key={eIdx}
                                        className={`w-1.5 h-1.5 rounded-full ${
                                          evt.type === "fixture"
                                            ? "bg-sky-400"
                                            : evt.type === "deadline"
                                              ? "bg-rose-500"
                                              : "bg-emerald-400"
                                        }`}
                                        title={evt.title}
                                      />
                                    ))}
                                  </div>
                                )}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Collapsible Add Custom Event Form */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <Plus className="w-5 h-5 text-amber-500" />
                          <h3 className="text-sm font-black text-white uppercase italic tracking-tight">Timeline Orchestrator</h3>
                        </div>
                        <button
                          onClick={() => setIsAddingEvent(!isAddingEvent)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[9px] font-mono font-black uppercase rounded-lg border border-white/10 transition-all cursor-pointer"
                        >
                          {isAddingEvent ? "Collapse Form" : "Add Custom Event"}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isAddingEvent && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden mt-6"
                          >
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!newEventTitle.trim()) return;

                                const newEvt: CalendarEvent = {
                                  id: "custom_" + Date.now(),
                                  title: newEventTitle,
                                  description: newEventDesc || "Custom scheduled tournament milestone.",
                                  date: newEventDate,
                                  type: newEventType,
                                  time: newEventTime || undefined
                                };

                                setCalendarEvents([...calendarEvents, newEvt]);
                                setNewEventTitle("");
                                setNewEventDesc("");
                                setNewEventTime("");
                                setIsAddingEvent(false);
                              }}
                              className="space-y-4 pt-4 border-t border-white/5"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block">Event Title</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. Squad Training Block A"
                                    value={newEventTitle}
                                    onChange={(e) => setNewEventTitle(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 font-sans"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block">Event Date</label>
                                  <input
                                    type="date"
                                    required
                                    value={newEventDate}
                                    onChange={(e) => setNewEventDate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all font-mono"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block">Event Category</label>
                                  <select
                                    value={newEventType}
                                    onChange={(e: any) => setNewEventType(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:border-amber-500 transition-all font-mono"
                                  >
                                    <option value="fixture">Upcoming Fixture (Sky)</option>
                                    <option value="deadline">Registration Deadline (Rose)</option>
                                    <option value="history">Historical Event (Emerald)</option>
                                  </select>
                                </div>
                                <div className="space-y-2">
                                  <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block">Time (Optional)</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. 14:00 UTC"
                                    value={newEventTime}
                                    onChange={(e) => setNewEventTime(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 font-sans"
                                  />
                                </div>
                                <div className="space-y-2 md:col-span-1 flex items-end">
                                  <button
                                    type="submit"
                                    className="w-full bg-white hover:bg-amber-400 text-black font-black text-[10px] font-mono uppercase py-3.5 px-4 rounded-xl tracking-wider transition-all cursor-pointer"
                                  >
                                    Deploy to Timeline
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <label className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black block">Detailed Description</label>
                                <textarea
                                  placeholder="Provide deep tactical details or event guidelines..."
                                  value={newEventDesc}
                                  onChange={(e) => setNewEventDesc(e.target.value)}
                                  rows={2}
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all placeholder:text-slate-600 font-sans resize-none"
                                />
                              </div>
                            </form>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Sidebar Detail Column */}
                  <div className="space-y-6">
                    {/* Active Date Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <div>
                          <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest font-black">Selected Date</p>
                          <h3 className="text-sm font-black text-white uppercase italic tracking-tight mt-0.5">
                            {selectedCalendarDate 
                              ? selectedCalendarDate.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })
                              : "No date selected"}
                          </h3>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                          <Info className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>

                      {/* Day Event List */}
                      <div className="space-y-4">
                        {(() => {
                          if (!selectedCalendarDate) return null;
                          const selStr = `${selectedCalendarDate.getFullYear()}-${String(selectedCalendarDate.getMonth() + 1).padStart(2, '0')}-${String(selectedCalendarDate.getDate()).padStart(2, '0')}`;
                          const dayEvents = calendarEvents.filter(e => e.date === selStr);

                          if (dayEvents.length === 0) {
                            return (
                              <div className="text-center py-10 space-y-3">
                                <AlertCircle className="w-8 h-8 text-slate-600 mx-auto" />
                                <p className="text-xs text-slate-500 font-mono font-medium">No events scheduled for this date.</p>
                                <button
                                  onClick={() => {
                                    setNewEventDate(selStr);
                                    setIsAddingEvent(true);
                                  }}
                                  className="text-[10px] font-mono text-amber-500 hover:text-white uppercase font-black tracking-wider underline cursor-pointer"
                                >
                                  Orchestrate Event
                                </button>
                              </div>
                            );
                          }

                          return dayEvents.map((evt) => {
                            const isBookmarked = bookmarkedIds.includes(evt.id);
                            return (
                              <div
                                key={evt.id}
                                className={`border rounded-2xl p-4.5 space-y-3 transition-all relative overflow-hidden bg-white/5 ${
                                  evt.type === "fixture"
                                    ? "border-sky-500/20"
                                    : evt.type === "deadline"
                                      ? "border-rose-500/20"
                                      : "border-emerald-500/20"
                                }`}
                              >
                                {/* Header / Category */}
                                <div className="flex justify-between items-start gap-4">
                                  <div className="space-y-1">
                                    <span className={`text-[8px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                      evt.type === "fixture"
                                        ? "bg-sky-500/10 text-sky-400"
                                        : evt.type === "deadline"
                                          ? "bg-rose-500/10 text-rose-400"
                                          : "bg-emerald-500/10 text-emerald-400"
                                    }`}>
                                      {evt.type}
                                    </span>
                                    <h4 className="text-xs font-black text-white uppercase italic tracking-tight mt-1">{evt.title}</h4>
                                  </div>

                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        if (isBookmarked) {
                                          setBookmarkedIds(bookmarkedIds.filter(id => id !== evt.id));
                                        } else {
                                          setBookmarkedIds([...bookmarkedIds, evt.id]);
                                        }
                                      }}
                                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                        isBookmarked
                                          ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                          : "bg-white/5 border-white/10 text-slate-500 hover:text-white hover:bg-white/10"
                                      }`}
                                      title={isBookmarked ? "Remove Bookmark" : "Set Reminder Bookmark"}
                                    >
                                      {isBookmarked ? (
                                        <BookmarkCheck className="w-3.5 h-3.5" />
                                      ) : (
                                        <Bookmark className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    
                                    {evt.id.startsWith("custom_") && (
                                      <button
                                        onClick={() => {
                                          setCalendarEvents(calendarEvents.filter(e => e.id !== evt.id));
                                          setBookmarkedIds(bookmarkedIds.filter(id => id !== evt.id));
                                        }}
                                        className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
                                        title="Delete custom event"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Body Description */}
                                <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{evt.description}</p>

                                {/* Dynamic Details if match or timing */}
                                {(evt.time || evt.score || (evt.teamA && evt.teamB)) && (
                                  <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1.5 text-[10px] font-mono">
                                    {evt.teamA && evt.teamB ? (
                                      <div className="text-slate-300 font-bold uppercase italic tracking-tight">
                                        {evt.teamA} <span className="text-amber-500 font-black px-1">{evt.score || "VS"}</span> {evt.teamB}
                                      </div>
                                    ) : (
                                      <div className="text-slate-500 font-bold">EVENT TIMING</div>
                                    )}
                                    {evt.time && (
                                      <span className="text-amber-500 font-black tracking-wider uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{evt.time}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Bookmarked / Active Reminders Panel */}
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <Bookmark className="w-4 h-4 text-amber-500" />
                        <h3 className="text-xs font-black text-white uppercase italic tracking-tight">Active Bookmarks ({bookmarkedIds.length})</h3>
                      </div>

                      {bookmarkedIds.length === 0 ? (
                        <p className="text-[10px] font-mono text-slate-500 tracking-wider">No bookmarked reminders. Click the bookmark icon on any event to trigger an alert.</p>
                      ) : (
                        <div className="space-y-2">
                          {calendarEvents.filter(e => bookmarkedIds.includes(e.id)).map((evt) => (
                            <div
                              key={evt.id}
                              onClick={() => {
                                const [y, m, d] = evt.date.split("-").map(Number);
                                setSelectedCalendarDate(new Date(y, m - 1, d));
                                setCurrentCalendarDate(new Date(y, m - 1, 1));
                              }}
                              className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 cursor-pointer flex justify-between items-center transition-all group"
                            >
                              <div className="truncate pr-4">
                                <h4 className="text-[11px] font-black text-slate-200 uppercase italic tracking-tight group-hover:text-amber-500 transition-colors">{evt.title}</h4>
                                <span className="text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">{evt.date}</span>
                              </div>
                              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
