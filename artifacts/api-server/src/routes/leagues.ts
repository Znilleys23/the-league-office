import { Router, type IRouter } from "express";
import {
  ConnectFplLeagueBody,
  CreateCompetitionBody,
  CreateLeagueBody,
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

router.post("/leagues", (req, res) => {
  const input = CreateLeagueBody.parse(req.body);
  res.status(201).json({ ...league, id: input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name: input.name, season: input.season, managerCount: 1, fplLeagueId: null });
});

router.post("/leagues/connect", (req, res) => {
  const input = ConnectFplLeagueBody.parse(req.body);
  res.json({ ...league, name: input.name, season: input.season, fplLeagueId: input.fplLeagueId });
});

router.post("/leagues/:leagueId/competitions", (req, res) => {
  const input = CreateCompetitionBody.parse(req.body);
  res.status(201).json({ id: `competition-${Date.now()}`, name: input.name, type: input.type, status: "Setup" });
});

export default router;