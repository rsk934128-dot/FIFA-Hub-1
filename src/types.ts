export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  date: string;
  imageSeed: string;
  source: string;
  engine?: "gemini" | "fallback" | "grounded";
  sources?: { title: string; url: string }[];
}

export interface MatchStats {
  possession: [number, number]; // [TeamA, TeamB]
  shots: [number, number];
  shotsOnTarget: [number, number];
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'card_yellow' | 'card_red' | 'substitution' | 'chance' | 'kickoff' | 'fulltime' | 'halftime';
  team: 'A' | 'B' | 'none';
  player: string;
  description: string;
}

export interface SimulationResult {
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  stats: MatchStats;
  events: MatchEvent[];
  highlights?: string[];
  manOfTheMatch?: {
    name: string;
    team: string;
    rating: number;
    highlight: string;
  };
  engine?: "gemini" | "fallback";
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0 to 1
}

export interface Player {
  name: string;
  number: number;
  position: 'GK' | 'DEF' | 'MID' | 'FWD';
  role: string;
  heatmap?: HeatmapPoint[];
}

export interface ScoutingReport {
  country: string;
  formation: string;
  styleOfPlay: string;
  strengths: string[];
  weaknesses: string[];
  tacticalRating: number; // 1-100
  defenseRating: number;
  attackRating: number;
  midfieldRating: number;
  keyPlayers: Player[];
  lineup: { name: string; position: string; x: number; y: number }[]; // coordinates for pitch visualizer (0-100)
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  engine?: "gemini" | "fallback";
}

export interface GroupTeam {
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number; // Goals For
  ga: number; // Goals Against
  gd: number; // Goal Difference
  points: number;
  logoUrl?: string;
}

export interface TournamentGroup {
  letter: string;
  teams: GroupTeam[];
}

export interface BracketMatch {
  id: string;
  stage: 'R16' | 'QF' | 'SF' | 'F';
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  winner?: string;
  simulated: boolean;
}

export type Atmosphere = "night" | "day" | "lights";

export interface AppSettings {
  atmosphere: Atmosphere;
  soundEnabled: boolean;
}

export interface PlayerComparison {
  playerA: {
    name: string;
    metrics: { label: string; value: number }[];
    summary: string;
  };
  playerB: {
    name: string;
    metrics: { label: string; value: number }[];
    summary: string;
  };
  tacticalVerdict: string;
  engine?: "gemini" | "fallback";
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface LiveChannel {
  id: string;
  name: string;
  status: "LIVE" | "UPCOMING" | "OFFLINE";
  match: string;
  viewerCount: string;
  thumbnail: string;
  videoUrl?: string;
}

export interface CDNNode {
  id: string;
  region: string;
  load: number;
  latency: string;
}

export interface TickerItem {
  id: string;
  text: string;
  type: "BREAKING" | "TRANSFER" | "RUMOR";
}

export interface TonTransaction {
  id: string;
  utime: number;
  amount: string;
  type: 'in' | 'out';
  success: boolean;
  lt: string;
}

export interface TonWallet {
  address: string;
  mnemonic: string[];
  publicKey: string;
  version: string;
  createdAt: string;
  history?: TonTransaction[];
}
