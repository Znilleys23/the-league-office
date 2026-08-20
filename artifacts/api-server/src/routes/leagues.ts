import { Router, type IRouter } from "express";
import {
  AdvanceCompetitionBody,
  AdvanceCompetitionParams,
  AdvanceCompetitionResponse,
  ConnectFplLeagueBody,
  CreateCompetitionParams,
  CreateCompetitionResponse,
  CreateCompetitionBody,
  CreateLeagueBody,
  GetCompetitionOverviewResponse,
  GetCompetitionOverviewParams,
  GetCompetitionParams,
  GetCompetitionResponse,
  GetHeadToHeadScheduleResponse,
  GetHeadToHeadStandingsResponse,
  GetLeagueDashboardResponse,
  GetLeagueStandingsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const league = {
  id: "north-london",
  name: "North London '26",
  season: "2026/27",
  managerCount: 12,
  currentGameweek: 8,
  updatedAt: "Updated 6 minutes ago",
  fplLeagueId: "145920",
};

const standings = [
  ["1", "James Maddison", "Maddison's XI", 74, 612, 3, 2],
  ["2", "Sophie Chen", "Saka Potatoes", 69, 598, 1, -1],
  ["3", "Ben Carter", "Carter's Cruisers", 67, 586, 4, 1],
  ["4", "Maya Patel", "Ctrl Alt De Ligt", 61, 579, 2, -2],
  ["5", "Oliver Grant", "The xG Files", 63, 571, 5, 0],
  ["6", "Ava Williams", "Ava FC", 58, 558, 7, 1],
].map(([rank, manager, teamName, gameweekPoints, totalPoints, previousRank, movement]) => ({
  rank: Number(rank), manager: String(manager), teamName: String(teamName),
  gameweekPoints: Number(gameweekPoints), totalPoints: Number(totalPoints),
  previousRank: Number(previousRank), movement: Number(movement),
  initials: String(manager).split(" ").map((part) => part[0]).join(""),
}));

const h2h = [
  ["1", "James Maddison", 6, 1, 1, 612, 556, 56, 19, "W4"],
  ["2", "Sophie Chen", 5, 2, 1, 598, 574, 24, 16, "W2"],
  ["3", "Ben Carter", 5, 3, 0, 586, 579, 7, 15, "L1"],
  ["4", "Maya Patel", 4, 3, 1, 579, 570, 9, 13, "W1"],
  ["5", "Oliver Grant", 3, 4, 1, 571, 588, -17, 10, "L2"],
  ["6", "Ava Williams", 2, 5, 1, 558, 602, -44, 7, "W1"],
].map(([rank, manager, wins, losses, draws, pointsFor, pointsAgainst, pointDifference, leaguePoints, streak]) => ({
  rank: Number(rank), manager: String(manager), wins: Number(wins), losses: Number(losses),
  draws: Number(draws), pointsFor: Number(pointsFor), pointsAgainst: Number(pointsAgainst),
  pointDifference: Number(pointDifference), leaguePoints: Number(leaguePoints), streak: String(streak),
  initials: String(manager).split(" ").map((part) => part[0]).join(""),
}));

const schedule = [
  { id: "m1", home: "James Maddison", away: "Sophie Chen", homeScore: 74, awayScore: 69, status: "Final", featured: true },
  { id: "m2", home: "Ben Carter", away: "Maya Patel", homeScore: 67, awayScore: 61, status: "Final", featured: false },
  { id: "m3", home: "Oliver Grant", away: "Ava Williams", homeScore: 63, awayScore: 58, status: "Final", featured: false },
];

const activity = [
  { id: "a1", title: "James Maddison moved into 1st", detail: "A 74-point gameweek puts Maddison's XI at the summit.", time: "12 min ago", kind: "rise" },
  { id: "a2", title: "Head-to-head result", detail: "James Maddison defeated Sophie Chen 74–69.", time: "38 min ago", kind: "match" },
  { id: "a3", title: "Sophie Chen recorded 69 points", detail: "Saka Potatoes stays within striking distance.", time: "1 hr ago", kind: "score" },
];

type CupEntrant = {
  id: string;
  manager: string;
  teamName: string;
  seed: number;
  initials: string;
};

type CupTie = {
  id: string;
  home: CupEntrant | null;
  away: CupEntrant | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  winnerId: string | null;
  gameweek: number | null;
};

type CupRound = {
  id: string;
  label: string;
  ties: CupTie[];
};

type CupCompetition = {
  ownerLeagueId: string;
  id: string;
  name: string;
  type: string;
  status: string;
  entrantCount: number;
  currentRound: string;
  bracketSize: number;
  startGameweek: number;
  currentGameweek: number;
  rounds: CupRound[];
};

const cupEntrants: CupEntrant[] = [
  { id: "james-maddison", manager: "James Maddison", teamName: "Maddison's XI", seed: 1, initials: "JM" },
  { id: "sophie-chen", manager: "Sophie Chen", teamName: "Saka Potatoes", seed: 2, initials: "SC" },
  { id: "ben-carter", manager: "Ben Carter", teamName: "Carter's Cruisers", seed: 3, initials: "BC" },
  { id: "maya-patel", manager: "Maya Patel", teamName: "Ctrl Alt De Ligt", seed: 4, initials: "MP" },
  { id: "oliver-grant", manager: "Oliver Grant", teamName: "The xG Files", seed: 5, initials: "OG" },
  { id: "ava-williams", manager: "Ava Williams", teamName: "Ava FC", seed: 6, initials: "AW" },
  { id: "noah-brooks", manager: "Noah Brooks", teamName: "Noah Way Out", seed: 7, initials: "NB" },
  { id: "ella-foster", manager: "Ella Foster", teamName: "Foster's Flares", seed: 8, initials: "EF" },
];

const cupStore = new Map<string, CupCompetition>();

function getCupStoreKey(leagueId: string, competitionId: string) {
  return `${leagueId}:${competitionId}`;
}

function getSeededPairs(entrants: CupEntrant[]) {
  const sorted = [...entrants].sort((a, b) => a.seed - b.seed);
  if (sorted.length === 4) return [[sorted[0], sorted[3]], [sorted[1], sorted[2]]];
  return [[sorted[0], sorted[7]], [sorted[3], sorted[4]], [sorted[1], sorted[6]], [sorted[2], sorted[5]]];
}

function refreshCupStatus(cup: CupCompetition) {
  const nextRound = cup.rounds.find((round) => round.ties.some((tie) => tie.status !== "Final"));
  cup.currentRound = nextRound?.label ?? "Champion crowned";
  cup.status = nextRound ? "Live" : "Complete";
}

function moveWinnerForward(cup: CupCompetition, roundIndex: number, tieIndex: number) {
  const tie = cup.rounds[roundIndex]?.ties[tieIndex];
  const winner = tie?.winnerId
    ? [tie.home, tie.away].find((entrant) => entrant?.id === tie.winnerId) ?? null
    : null;
  const nextRound = cup.rounds[roundIndex + 1];
  if (!winner || !nextRound) return;

  const nextTie = nextRound.ties[Math.floor(tieIndex / 2)];
  if (!nextTie) return;
  if (tieIndex % 2 === 0) nextTie.home = winner;
  else nextTie.away = winner;
  if (nextTie.home && nextTie.away) {
    nextTie.status = "Upcoming";
    nextTie.gameweek = cup.startGameweek + roundIndex + 1;
  } else {
    nextTie.status = "Awaiting winner";
  }
}

function createCup(ownerLeagueId: string, id: string, name: string, entrants: CupEntrant[], seededProgress = false): CupCompetition {
  const bracketSize = entrants.length;
  const pairs = getSeededPairs(entrants);
  const firstRoundLabel = bracketSize === 4 ? "Semi-finals" : "Quarter-finals";
  const startGameweek = league.currentGameweek + 1;
  const firstRound: CupRound = {
    id: `${id}-round-1`,
    label: firstRoundLabel,
    ties: pairs.map(([home, away], index) => ({
      id: `${id}-r1-${index + 1}`,
      home,
      away,
      homeScore: null,
      awayScore: null,
      status: "Upcoming",
      winnerId: null,
      gameweek: startGameweek,
    })),
  };
  const laterRounds: CupRound[] = [];
  let priorTieCount = firstRound.ties.length;
  let roundNumber = 2;
  while (priorTieCount > 1) {
    const tieCount = priorTieCount / 2;
    laterRounds.push({
      id: `${id}-round-${roundNumber}`,
      label: tieCount === 1 ? "Final" : "Semi-finals",
      ties: Array.from({ length: tieCount }, (_, index) => ({
        id: `${id}-r${roundNumber}-${index + 1}`,
        home: null,
        away: null,
        homeScore: null,
        awayScore: null,
        status: "Awaiting winner",
        winnerId: null,
        gameweek: null,
      })),
    });
    priorTieCount = tieCount;
    roundNumber += 1;
  }

  const cup: CupCompetition = {
    ownerLeagueId,
    id,
    name,
    type: "knockout",
    status: "Live",
    entrantCount: entrants.length,
    currentRound: firstRoundLabel,
    bracketSize,
    startGameweek,
    currentGameweek: league.currentGameweek,
    rounds: [firstRound, ...laterRounds],
  };

  if (seededProgress) {
    const openingScores = [[74, 61], [67, 63], [69, 52], [66, 58]];
    cup.rounds[0].ties.forEach((tie, index) => {
      tie.homeScore = openingScores[index][0];
      tie.awayScore = openingScores[index][1];
      tie.status = "Final";
      tie.winnerId = tie.home?.id ?? null;
      moveWinnerForward(cup, 0, index);
    });
    const firstSemi = cup.rounds[1]?.ties[0];
    if (firstSemi?.home && firstSemi.away) {
      firstSemi.homeScore = 72;
      firstSemi.awayScore = 65;
      firstSemi.status = "Final";
      firstSemi.winnerId = firstSemi.home.id;
      moveWinnerForward(cup, 1, 0);
    }
    cup.currentGameweek = cup.startGameweek + 1;
    refreshCupStatus(cup);
  }

  return cup;
}

const seededCup = createCup("demo", "north-london-cup", "North London Knockout", cupEntrants, true);
cupStore.set(getCupStoreKey(seededCup.ownerLeagueId, seededCup.id), seededCup);

router.get("/leagues/:leagueId/dashboard", (_req, res) => {
  res.json(GetLeagueDashboardResponse.parse({
    league, topScorer: standings[0], activity,
    powerRanking: standings.slice(0, 5).map((entry, index) => ({
      rank: index + 1, manager: entry.manager, movement: entry.movement, score: entry.totalPoints,
    })),
  }));
});

router.get("/leagues/:leagueId/standings", (_req, res) => {
  res.json(GetLeagueStandingsResponse.parse(standings));
});

router.get("/leagues/:leagueId/head-to-head", (_req, res) => {
  res.json(GetHeadToHeadStandingsResponse.parse(h2h));
});

router.get("/leagues/:leagueId/schedule", (_req, res) => {
  res.json(GetHeadToHeadScheduleResponse.parse(schedule));
});

router.get("/leagues/:leagueId/competitions", (req, res) => {
  const params = GetCompetitionOverviewParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const competitions = Array.from(cupStore.values())
    .filter((cup) => cup.ownerLeagueId === params.data.leagueId)
    .map((cup) => ({
    id: cup.id,
    name: cup.name,
    type: cup.type,
    status: cup.status,
    entrantCount: cup.entrantCount,
    currentRound: cup.currentRound,
    }));
  res.json(GetCompetitionOverviewResponse.parse({ competitions, availableEntrants: cupEntrants }));
});

router.post("/leagues", (req, res) => {
  const input = CreateLeagueBody.parse(req.body);
  res.status(201).json({ ...league, id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: input.name, season: input.season, managerCount: 1, fplLeagueId: null });
});

router.post("/leagues/connect", (req, res) => {
  const input = ConnectFplLeagueBody.parse(req.body);
  res.json({ ...league, name: input.name, season: input.season, fplLeagueId: input.fplLeagueId });
});

router.post("/leagues/:leagueId/competitions", (req, res) => {
  const params = CreateCompetitionParams.safeParse(req.params);
  const input = CreateCompetitionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const selectedEntrants = [...new Set(input.data.entrantIds)]
    .map((entrantId) => cupEntrants.find((entrant) => entrant.id === entrantId))
    .filter((entrant): entrant is CupEntrant => Boolean(entrant));
  if ((input.data.bracketSize !== 4 && input.data.bracketSize !== 8) || selectedEntrants.length !== input.data.bracketSize) {
    res.status(400).json({ error: "Choose exactly 4 or 8 valid entrants to match the bracket size." });
    return;
  }
  const id = `cup-${Date.now()}`;
  const cup = createCup(params.data.leagueId, id, input.data.name, selectedEntrants);
  cupStore.set(getCupStoreKey(params.data.leagueId, id), cup);
  res.status(201).json(CreateCompetitionResponse.parse(cup));
});

router.get("/leagues/:leagueId/competitions/:competitionId", (req, res) => {
  const params = GetCompetitionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const cup = cupStore.get(getCupStoreKey(params.data.leagueId, params.data.competitionId));
  if (!cup) {
    res.status(404).json({ error: "Competition not found" });
    return;
  }
  res.json(GetCompetitionResponse.parse(cup));
});

router.post("/leagues/:leagueId/competitions/:competitionId/advance", (req, res) => {
  const params = AdvanceCompetitionParams.safeParse(req.params);
  const input = AdvanceCompetitionBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!input.success) {
    res.status(400).json({ error: input.error.message });
    return;
  }
  const cup = cupStore.get(getCupStoreKey(params.data.leagueId, params.data.competitionId));
  if (!cup) {
    res.status(404).json({ error: "Competition not found" });
    return;
  }

  const roundIndex = cup.rounds.findIndex((round) => round.ties.some((tie) => tie.id === input.data.tieId));
  const tieIndex = roundIndex >= 0 ? cup.rounds[roundIndex].ties.findIndex((tie) => tie.id === input.data.tieId) : -1;
  const tie = roundIndex >= 0 && tieIndex >= 0 ? cup.rounds[roundIndex].ties[tieIndex] : null;
  const activeRoundIndex = cup.rounds.findIndex((round) => round.ties.some((candidate) => candidate.status !== "Final"));
  if (roundIndex !== activeRoundIndex || !tie || !tie.home || !tie.away || tie.status !== "Upcoming") {
    res.status(400).json({ error: "That tie cannot be resolved yet." });
    return;
  }
  if (tie.gameweek && tie.gameweek > cup.currentGameweek) {
    if (!input.data.simulate) {
      res.status(400).json({ error: `This tie is scheduled for gameweek ${tie.gameweek}.` });
      return;
    }
    cup.currentGameweek = tie.gameweek;
  }

  tie.homeScore = 62 + (8 - tie.home.seed);
  tie.awayScore = 58 + (8 - tie.away.seed);
  tie.status = "Final";
  tie.winnerId = tie.homeScore >= tie.awayScore ? tie.home.id : tie.away.id;
  moveWinnerForward(cup, roundIndex, tieIndex);
  refreshCupStatus(cup);
  res.json(AdvanceCompetitionResponse.parse(cup));
});

export default router;