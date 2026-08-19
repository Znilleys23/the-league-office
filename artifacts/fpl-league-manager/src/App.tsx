import { useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, Show, SignIn, SignUp } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import {
  Activity as ActivityIcon,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Crosshair,
  Gauge,
  LayoutDashboard,
  Link2,
  Menu,
  Plus,
  RefreshCw,
  ShieldCheck,
  Swords,
  Trophy,
  Users,
  X,
  Zap,
} from 'lucide-react';
import {
  getGetHeadToHeadScheduleQueryKey,
  getGetHeadToHeadStandingsQueryKey,
  getGetLeagueDashboardQueryKey,
  getGetLeagueStandingsQueryKey,
  getHealthCheckQueryKey,
  useConnectFplLeague,
  useCreateCompetition,
  useCreateLeague,
  useGetHeadToHeadSchedule,
  useGetHeadToHeadStandings,
  useGetLeagueDashboard,
  useGetLeagueStandings,
  useHealthCheck,
} from '@workspace/api-client-react';
import type {
  Activity,
  Competition,
  HeadToHeadStanding,
  League,
  LeagueDashboard,
  Matchup,
  PowerRanking,
  Standing,
} from '@workspace/api-client-react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#bff04b',
    colorForeground: '#f5f5f4',
    colorMutedForeground: '#94a3b8',
    colorDanger: '#fb923c',
    colorBackground: '#111a2b',
    colorInput: '#0d1321',
    colorInputForeground: '#f5f5f4',
    colorNeutral: '#334155',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '12px',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'w-[440px] max-w-full overflow-hidden rounded-2xl bg-[#111a2b] border border-slate-700',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-stone-100',
    headerSubtitle: 'text-slate-400',
    formFieldLabel: 'text-slate-300',
    socialButtonsBlockButtonText: 'text-stone-100',
    footerActionLink: 'text-lime-300',
    footerActionText: 'text-slate-400',
    dividerText: 'text-slate-500',
    formButtonPrimary: 'bg-lime-300 text-slate-950 hover:bg-lime-200',
    formFieldInput: 'bg-[#0d1321] border-slate-700 text-stone-100',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-slate-700',
  },
};

const sampleLeague: League = {
  id: 'demo',
  name: 'The Tuesday Club',
  season: '2024/25',
  managerCount: 12,
  currentGameweek: 32,
  updatedAt: '2025-04-22T18:30:00.000Z',
  fplLeagueId: '458291',
};

const sampleTopScorer: Standing = {
  rank: 1,
  manager: 'Maya Rowe',
  teamName: 'Rowe and Order',
  gameweekPoints: 84,
  totalPoints: 2198,
  previousRank: 2,
  movement: 1,
  initials: 'MR',
};

const sampleActivity: Activity[] = [
  { id: 'act-1', title: 'Sam took the weekly lead', detail: '86 points · Gameweek 31', time: '18 min ago', kind: 'rise' },
  { id: 'act-2', title: 'Captaincy paid off for Maya', detail: 'Salah returned 24 points', time: '2 hrs ago', kind: 'spark' },
  { id: 'act-3', title: 'The North Stand joined', detail: 'A new manager entered the league', time: 'Yesterday', kind: 'join' },
  { id: 'act-4', title: 'Wildcard watch', detail: 'Four managers still have a Free Hit', time: 'Yesterday', kind: 'intel' },
];

const samplePowerRanking: PowerRanking[] = [
  { rank: 1, manager: 'Maya Rowe', movement: 2, score: 94 },
  { rank: 2, manager: 'Sam Osei', movement: -1, score: 91 },
  { rank: 3, manager: 'Leo Grant', movement: 1, score: 87 },
  { rank: 4, manager: 'Aisha Khan', movement: 0, score: 83 },
  { rank: 5, manager: 'Tom Baird', movement: -2, score: 76 },
];

const sampleDashboard: LeagueDashboard = {
  league: sampleLeague,
  topScorer: sampleTopScorer,
  activity: sampleActivity,
  powerRanking: samplePowerRanking,
};

const sampleStandings: Standing[] = [
  sampleTopScorer,
  { rank: 2, manager: 'Sam Osei', teamName: 'Osei Business', gameweekPoints: 86, totalPoints: 2186, previousRank: 1, movement: -1, initials: 'SO' },
  { rank: 3, manager: 'Leo Grant', teamName: 'Grant Theft Auto', gameweekPoints: 71, totalPoints: 2112, previousRank: 4, movement: 1, initials: 'LG' },
  { rank: 4, manager: 'Aisha Khan', teamName: 'Khan Artist', gameweekPoints: 65, totalPoints: 2088, previousRank: 3, movement: -1, initials: 'AK' },
  { rank: 5, manager: 'Tom Baird', teamName: 'Bairds of Prey', gameweekPoints: 59, totalPoints: 1974, previousRank: 5, movement: 0, initials: 'TB' },
  { rank: 6, manager: 'Nia Okafor', teamName: 'Okafor the Record', gameweekPoints: 63, totalPoints: 1931, previousRank: 7, movement: 1, initials: 'NO' },
  { rank: 7, manager: 'Jack Doyle', teamName: 'Doyle Rules', gameweekPoints: 48, totalPoints: 1887, previousRank: 6, movement: -1, initials: 'JD' },
];

const sampleH2H: HeadToHeadStanding[] = [
  { rank: 1, manager: 'Maya Rowe', wins: 9, losses: 2, draws: 1, pointsFor: 812, pointsAgainst: 706, pointDifference: 106, leaguePoints: 28, streak: 'WWWWD', initials: 'MR' },
  { rank: 2, manager: 'Sam Osei', wins: 8, losses: 3, draws: 1, pointsFor: 798, pointsAgainst: 728, pointDifference: 70, leaguePoints: 25, streak: 'LWWWW', initials: 'SO' },
  { rank: 3, manager: 'Leo Grant', wins: 7, losses: 4, draws: 1, pointsFor: 761, pointsAgainst: 742, pointDifference: 19, leaguePoints: 22, streak: 'DWLWW', initials: 'LG' },
  { rank: 4, manager: 'Aisha Khan', wins: 5, losses: 5, draws: 2, pointsFor: 734, pointsAgainst: 745, pointDifference: -11, leaguePoints: 17, streak: 'LWDWL', initials: 'AK' },
  { rank: 5, manager: 'Tom Baird', wins: 4, losses: 7, draws: 1, pointsFor: 698, pointsAgainst: 768, pointDifference: -70, leaguePoints: 13, streak: 'WLLLL', initials: 'TB' },
];

const sampleSchedule: Matchup[] = [
  { id: 'm-1', home: 'Maya Rowe', away: 'Tom Baird', homeScore: 84, awayScore: 59, status: 'Final', featured: true },
  { id: 'm-2', home: 'Sam Osei', away: 'Aisha Khan', homeScore: 86, awayScore: 65, status: 'Final' },
  { id: 'm-3', home: 'Leo Grant', away: 'Nia Okafor', homeScore: 71, awayScore: 63, status: 'Final' },
  { id: 'm-4', home: 'Jack Doyle', away: 'Priya Shah', homeScore: 48, awayScore: 52, status: 'Final' },
];

function initials(name: string, fallback = 'FC') {
  return name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || fallback;
}

function Avatar({ label, large = false }: { label?: string; large?: boolean }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full border border-lime-200/20 bg-lime-300/10 font-display font-bold text-lime-200 ${large ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-[11px]'}`} data-testid={`avatar-${label ?? 'manager'}`}>
      {label ?? 'FC'}
    </span>
  );
}

function Metric({ label, value, detail, icon: Icon, accent = 'lime' }: { label: string; value: string; detail: string; icon: typeof Users; accent?: 'lime' | 'coral' }) {
  return (
    <div className="panel animate-rise rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1" data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        <span className={`rounded-lg p-2 ${accent === 'coral' ? 'bg-orange-300/10 text-orange-300' : 'bg-lime-300/10 text-lime-300'}`}><Icon size={16} /></span>
      </div>
      <div className="mt-5 font-display text-3xl font-bold tracking-tight text-stone-100">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{detail}</div>
    </div>
  );
}

function PageTitle({ kicker, title, detail, action }: { kicker: string; title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="animate-rise">
        <div className="eyebrow mb-3">{kicker}</div>
        <h1 className="font-display text-4xl font-bold tracking-[-0.04em] text-stone-100 sm:text-5xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-xl bg-slate-700/40 ${className}`} />;
}

function EmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <div className="panel flex min-h-[280px] flex-col items-center justify-center rounded-2xl px-6 text-center">
      <div className="mb-4 rounded-2xl border border-lime-200/15 bg-lime-300/10 p-4 text-lime-300"><ShieldCheck size={24} /></div>
      <h3 className="font-display text-xl font-bold text-stone-100">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">{detail}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

function DataError({ onRetry, onConnect }: { onRetry: () => void; onConnect?: () => void }) {
  return (
    <div className="panel rounded-2xl border-orange-300/20 p-7">
      <div className="flex items-start gap-4">
        <div className="rounded-xl bg-orange-300/10 p-3 text-orange-300"><CircleHelp size={22} /></div>
        <div>
          <h3 className="font-display text-lg font-bold text-stone-100">The data feed is taking a breather</h3>
          <p className="mt-1 text-sm leading-6 text-slate-400">Try the connection again, or connect a different FPL mini-league to get the room moving.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-4 py-2 text-sm font-bold text-stone-200 transition-colors hover:border-lime-300/50 hover:text-lime-200" data-testid="button-retry-data"><RefreshCw size={15} /> Retry feed</button>
            {onConnect ? <Link href="/connect" className="inline-flex items-center gap-2 rounded-lg bg-lime-300 px-4 py-2 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5" data-testid="link-connect-from-error">Connect league <ChevronRight size={15} /></Link> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function NavItem({ href, label, icon: Icon, active, onClick }: { href: string; label: string; icon: typeof LayoutDashboard; active: boolean; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${active ? 'bg-lime-300 text-slate-950 shadow-[0_8px_25px_rgba(191,225,69,.13)]' : 'text-slate-400 hover:bg-slate-800/70 hover:text-stone-100'}`} data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}>
      <Icon size={17} strokeWidth={active ? 2.5 : 1.8} />
      <span>{label}</span>
      {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-slate-950" /> : null}
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: health } = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  const nav = [
    { href: '/', label: 'Overview', icon: LayoutDashboard },
    { href: '/standings', label: 'Standings', icon: BarChart3 },
    { href: '/head-to-head', label: 'Head-to-head', icon: Swords },
    { href: '/competitions', label: 'Competitions', icon: Trophy },
  ];
  return (
    <div className="min-h-[100dvh] bg-[#0d1321]">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-slate-800/80 bg-[#0a101d] px-4 py-5 transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-3" onClick={() => setMobileOpen(false)} data-testid="link-brand">
            <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-lime-300 text-slate-950"><Crosshair size={21} strokeWidth={2.5} /></span>
            <span><span className="block font-display text-[15px] font-bold tracking-tight text-stone-100">FPL<span className="text-lime-300">/</span>ROOM</span><span className="font-mono text-[9px] uppercase tracking-[.2em] text-slate-500">Private league hub</span></span>
          </Link>
          <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-slate-500 hover:text-stone-100 md:hidden" data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="mt-10 px-2"><div className="eyebrow mb-3 text-slate-600">Control room</div><nav className="space-y-1">{nav.map((item) => <NavItem key={item.href} {...item} active={location === item.href} onClick={() => setMobileOpen(false)} />)}</nav></div>
        <div className="mt-auto">
          <div className="mb-5 rounded-2xl border border-lime-300/10 bg-lime-300/[.04] p-4">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-lime-300"><span className="h-1.5 w-1.5 rounded-full bg-lime-300 animate-pulse-soft" /> System status</div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{health?.status === 'ok' ? 'FPL feed is live and listening.' : 'Ready for the next gameweek sync.'}</p>
          </div>
          <Link href="/connect" className="flex items-center gap-3 rounded-xl border border-slate-700/80 px-3 py-3 text-sm font-semibold text-slate-400 transition-colors hover:border-lime-300/40 hover:text-lime-200" onClick={() => setMobileOpen(false)} data-testid="link-connect-league"><Link2 size={17} /> Connect a league <ChevronRight className="ml-auto" size={15} /></Link>
        </div>
      </aside>
      {mobileOpen ? <button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/70 md:hidden" data-testid="button-dismiss-menu" /> : null}
      <div className="md:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between border-b border-slate-800/80 bg-[#0d1321]/85 px-4 backdrop-blur-xl sm:px-8">
          <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-slate-400 hover:text-stone-100 md:hidden" data-testid="button-open-menu"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex"><span className="font-mono uppercase tracking-[.14em]">Season</span><span className="text-stone-200">2024/25</span><span className="mx-2 h-3 w-px bg-slate-700" /><span className="font-mono uppercase tracking-[.14em]">Gameweek</span><span className="rounded-md bg-orange-300/10 px-2 py-1 font-mono text-orange-300">32</span></div>
          <div className="ml-auto flex items-center gap-3"><Link href="/connect" className="hidden items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-lime-300/50 hover:text-lime-200 sm:flex" data-testid="link-header-connect"><Plus size={14} /> New league</Link><Show when="signed-out"><Link href="/sign-in" className="rounded-lg bg-lime-300 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-lime-200" data-testid="link-sign-in">Sign in</Link></Show><Show when="signed-in"><div className="flex items-center gap-3 border-l border-slate-800 pl-3"><Avatar label="JR" /><div className="hidden text-right sm:block"><div className="text-xs font-bold text-stone-200">League admin</div><div className="font-mono text-[9px] uppercase tracking-[.12em] text-slate-500">Signed in</div></div></div></Show></div>
        </header>
        <main className="control-room-grid min-h-[calc(100dvh-72px)] px-4 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

function DashboardPage({ leagueId }: { leagueId: string }) {
  const query = useGetLeagueDashboard(leagueId, { query: { enabled: Boolean(leagueId), queryKey: getGetLeagueDashboardQueryKey(leagueId) } });
  if (query.isLoading) return <DashboardSkeleton />;
  const dashboard = query.data ?? sampleDashboard;
  const league = dashboard.league ?? sampleLeague;
  const isPreview = !query.data;
  return (
    <div className="mx-auto max-w-[1440px]">
      {isPreview ? <div className="mb-5 flex items-center gap-2 rounded-xl border border-orange-300/15 bg-orange-300/[.04] px-4 py-3 text-xs text-orange-200/80"><Zap size={14} className="text-orange-300" /> Preview room loaded. Connect your FPL mini-league to replace the sample matchday.</div> : null}
      <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="animate-rise"><div className="eyebrow mb-3">Gameweek {league.currentGameweek} <span className="mx-2 text-slate-700">/</span> Matchday control</div><h1 className="font-display text-5xl font-bold leading-[.95] tracking-[-0.06em] text-stone-100 sm:text-6xl">The table<br /><span className="text-lime-300">is moving.</span></h1><p className="mt-5 max-w-lg text-sm leading-6 text-slate-400">A sharp read on your league before the next deadline. Form, noise, and bragging rights — all in one room.</p></div>
        <div className="panel pitch-lines relative overflow-hidden rounded-2xl p-5 lg:w-[280px]"><div className="relative z-[1]"><div className="flex items-center justify-between"><span className="eyebrow text-orange-300">Next deadline</span><Clock3 size={16} className="text-orange-300" /></div><div className="mt-4 font-display text-3xl font-bold text-stone-100">Sat 11:00</div><div className="mt-1 text-xs text-slate-400">Gameweek {league.currentGameweek + 1} locks in <span className="font-mono text-lime-300">2d 14h</span></div><Link href="/standings" className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-lime-300 hover:text-lime-100" data-testid="link-view-table">View the table <ChevronRight size={14} /></Link></div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Metric label="Managers" value={String(league.managerCount)} detail="12 friends in the room" icon={Users} /><Metric label="League leader" value={`${dashboard.topScorer?.totalPoints ?? 0}`} detail={`${dashboard.topScorer?.manager ?? 'No leader'} total points`} icon={Award} /><Metric label="Last gameweek" value={`${dashboard.topScorer?.gameweekPoints ?? 0} pts`} detail={`Best return · GW ${league.currentGameweek - 1}`} icon={Gauge} accent="coral" /></div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="panel animate-rise stagger-1 overflow-hidden rounded-2xl">
          <div className="flex items-center justify-between border-b border-slate-700/60 px-5 py-5 sm:px-6"><div><div className="eyebrow">Current gameweek</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">The weekly signal</h2></div><Link href="/head-to-head" className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-lime-300" data-testid="link-view-matchups">Matchups <ChevronRight size={14} /></Link></div>
          <div className="grid gap-0 md:grid-cols-[1.1fr_.9fr]">
            <div className="relative overflow-hidden border-b border-slate-700/60 bg-lime-300/[.035] p-6 md:border-b-0 md:border-r"><div className="absolute -right-8 -top-8 h-40 w-40 rounded-full border border-lime-300/10" /><div className="eyebrow text-orange-300">Top scorer · GW {league.currentGameweek - 1}</div><div className="mt-8 flex items-center gap-4"><Avatar label={dashboard.topScorer?.initials ?? initials(dashboard.topScorer?.manager ?? '')} large /><div><div className="font-display text-xl font-bold text-stone-100">{dashboard.topScorer?.manager}</div><div className="text-xs text-slate-400">{dashboard.topScorer?.teamName}</div></div></div><div className="mt-8 flex items-end justify-between"><div><div className="font-display text-5xl font-bold tracking-[-.06em] text-lime-300">{dashboard.topScorer?.gameweekPoints}</div><div className="font-mono text-[10px] uppercase tracking-[.14em] text-slate-500">points this week</div></div><span className="rounded-full bg-lime-300/10 px-3 py-1 text-xs font-bold text-lime-200">+{dashboard.topScorer?.movement ?? 0} places</span></div></div>
            <div className="p-6"><div className="mb-5 flex items-center justify-between"><div className="eyebrow">Recent activity</div><ActivityIcon size={16} className="text-slate-500" /></div><div className="space-y-5">{(dashboard.activity ?? []).slice(0, 4).map((item, index) => <div className="relative flex gap-3" key={item.id} data-testid={`activity-item-${item.id}`}>{index < (dashboard.activity?.length ?? 0) - 1 ? <span className="absolute left-[5px] top-4 h-full w-px bg-slate-700" /> : null}<span className={`relative mt-1 h-2.5 w-2.5 rounded-full border-2 border-[#152037] ${item.kind === 'rise' ? 'bg-lime-300' : item.kind === 'spark' ? 'bg-orange-300' : 'bg-slate-500'}`} /><div><div className="text-xs font-bold text-stone-200">{item.title}</div><div className="mt-1 text-[11px] leading-4 text-slate-500">{item.detail}</div><div className="mt-1 font-mono text-[9px] uppercase tracking-[.12em] text-slate-600">{item.time}</div></div></div>)}</div></div>
          </div>
        </section>
        <section className="panel animate-rise stagger-2 rounded-2xl p-5 sm:p-6"><div className="flex items-start justify-between"><div><div className="eyebrow">The form table</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">Power rankings</h2></div><span className="rounded-lg bg-orange-300/10 p-2 text-orange-300"><BarChart3 size={17} /></span></div><p className="mt-2 text-xs leading-5 text-slate-500">A rolling read on who is actually playing well.</p><div className="mt-6 space-y-4">{(dashboard.powerRanking ?? []).map((entry) => <div key={entry.rank} className="group" data-testid={`power-ranking-${entry.rank}`}><div className="mb-2 flex items-center gap-3"><span className="w-4 font-mono text-[10px] text-slate-600">0{entry.rank}</span><Avatar label={initials(entry.manager)} /><span className="flex-1 text-xs font-bold text-stone-200">{entry.manager}</span><span className={`flex items-center gap-0.5 font-mono text-[10px] ${entry.movement > 0 ? 'text-lime-300' : entry.movement < 0 ? 'text-orange-300' : 'text-slate-500'}`}>{entry.movement > 0 ? <ArrowUpRight size={12} /> : entry.movement < 0 ? <ArrowDownRight size={12} /> : null}{entry.movement === 0 ? '—' : Math.abs(entry.movement)}</span><span className="w-7 text-right font-mono text-xs text-stone-300">{entry.score}</span></div><div className="ml-7 h-1 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-gradient-to-r from-lime-300/60 to-lime-300 transition-all duration-700" style={{ width: `${entry.score}%` }} /></div></div>)}</div><Link href="/standings" className="mt-7 flex items-center justify-between border-t border-slate-700/60 pt-4 text-xs font-bold text-slate-400 hover:text-lime-300" data-testid="link-open-standings">Full standings <ChevronRight size={14} /></Link></section>
      </div>
      <section className="mt-6 grid gap-4 md:grid-cols-3"><Link href="/competitions" className="panel-soft group flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-lime-300/40" data-testid="link-quick-competition"><span className="rounded-xl bg-orange-300/10 p-3 text-orange-300"><Trophy size={19} /></span><span className="flex-1"><span className="block text-sm font-bold text-stone-100">Start a competition</span><span className="mt-1 block text-xs text-slate-500">Make the run-in matter.</span></span><ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-lime-300" /></Link><Link href="/head-to-head" className="panel-soft group flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-lime-300/40" data-testid="link-quick-head-to-head"><span className="rounded-xl bg-lime-300/10 p-3 text-lime-300"><Swords size={19} /></span><span className="flex-1"><span className="block text-sm font-bold text-stone-100">Scout matchups</span><span className="mt-1 block text-xs text-slate-500">Find this week&apos;s edge.</span></span><ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-lime-300" /></Link><Link href="/connect" className="panel-soft group flex items-center gap-4 rounded-2xl p-5 transition-colors hover:border-lime-300/40" data-testid="link-quick-connect"><span className="rounded-xl bg-sky-300/10 p-3 text-sky-300"><Link2 size={19} /></span><span className="flex-1"><span className="block text-sm font-bold text-stone-100">Invite your league</span><span className="mt-1 block text-xs text-slate-500">Connect the live mini-league.</span></span><ChevronRight size={16} className="text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-lime-300" /></Link></section>
    </div>
  );
}

function DashboardSkeleton() {
  return <div className="mx-auto max-w-[1440px]"><div className="mb-8"><Skeleton className="h-3 w-36" /><Skeleton className="mt-4 h-20 w-[min(500px,85%)]" /><Skeleton className="mt-4 h-4 w-96 max-w-full" /></div><div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]"><Skeleton className="h-[390px]" /><Skeleton className="h-[390px]" /></div></div>;
}

function StandingsPage({ leagueId }: { leagueId: string }) {
  const query = useGetLeagueStandings(leagueId, { query: { enabled: Boolean(leagueId), queryKey: getGetLeagueStandingsQueryKey(leagueId) } });
  const [search, setSearch] = useState('');
  const standings = query.data ?? sampleStandings;
  const filtered = useMemo(() => standings.filter((row) => `${row.manager} ${row.teamName}`.toLowerCase().includes(search.toLowerCase())), [standings, search]);
  return <div className="mx-auto max-w-[1440px]"><PageTitle kicker="Classic table / 2024–25" title="Standings" detail="The one table nobody wants to refresh in front of their mates." action={<div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-400"><CalendarDays size={15} className="text-lime-300" /> Updated 18 min ago</div>} />{query.isLoading ? <Skeleton className="h-[500px]" /> : query.isError && !query.data ? <DataError onRetry={() => query.refetch()} /> : <section className="panel animate-rise stagger-1 overflow-hidden rounded-2xl"><div className="flex flex-col justify-between gap-4 border-b border-slate-700/60 p-5 sm:flex-row sm:items-center sm:px-6"><div><div className="eyebrow">12 managers · ranked by total points</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">The Tuesday Club</h2></div><label className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/30 px-3 py-2 text-xs text-slate-400"><span className="font-mono text-[10px] uppercase tracking-wider">Find</span><input value={search} onChange={(event) => setSearch(event.target.value)} className="w-28 bg-transparent text-stone-100 outline-none placeholder:text-slate-600" placeholder="manager" data-testid="input-search-standings" /></label></div><div className="mobile-scroll"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-950/20"><tr className="font-mono text-[10px] uppercase tracking-[.14em] text-slate-600"><th className="px-6 py-4">Rank</th><th className="px-3 py-4">Manager</th><th className="px-3 py-4 text-right">GW {sampleLeague.currentGameweek}</th><th className="px-3 py-4 text-right">Total</th><th className="px-6 py-4 text-right">Movement</th></tr></thead><tbody className="divide-y divide-slate-800/80">{filtered.map((row, index) => <tr key={`${row.manager}-${row.rank}`} className={`group transition-colors hover:bg-lime-300/[.035] ${index === 0 ? 'bg-lime-300/[.025]' : ''}`} data-testid={`standing-row-${row.rank}`}><td className="px-6 py-4"><span className={`font-display text-lg font-bold ${row.rank === 1 ? 'text-lime-300' : 'text-slate-500'}`}>{String(row.rank).padStart(2, '0')}</span></td><td className="px-3 py-4"><div className="flex items-center gap-3"><Avatar label={row.initials ?? initials(row.manager)} /><div><div className="text-sm font-bold text-stone-100">{row.manager}</div><div className="mt-0.5 text-xs text-slate-500">{row.teamName}</div></div></div></td><td className="px-3 py-4 text-right font-mono text-sm text-stone-200">{row.gameweekPoints}</td><td className="px-3 py-4 text-right font-display text-lg font-bold text-stone-100">{row.totalPoints}</td><td className="px-6 py-4 text-right"><span className={`inline-flex items-center gap-1 font-mono text-xs ${row.movement > 0 ? 'text-lime-300' : row.movement < 0 ? 'text-orange-300' : 'text-slate-600'}`}>{row.movement > 0 ? <ArrowUpRight size={14} /> : row.movement < 0 ? <ArrowDownRight size={14} /> : null}{row.movement === 0 ? '—' : `${Math.abs(row.movement)} place${Math.abs(row.movement) === 1 ? '' : 's'}`}</span></td></tr>)}</tbody></table></div>{filtered.length === 0 ? <div className="p-12 text-center text-sm text-slate-500">No manager matches that search.</div> : null}</section>}</div>;
}

function HeadToHeadPage({ leagueId }: { leagueId: string }) {
  const standingsQuery = useGetHeadToHeadStandings(leagueId, { query: { enabled: Boolean(leagueId), queryKey: getGetHeadToHeadStandingsQueryKey(leagueId) } });
  const scheduleQuery = useGetHeadToHeadSchedule(leagueId, { query: { enabled: Boolean(leagueId), queryKey: getGetHeadToHeadScheduleQueryKey(leagueId) } });
  const standings = standingsQuery.data ?? sampleH2H;
  const schedule = scheduleQuery.data ?? sampleSchedule;
  return <div className="mx-auto max-w-[1440px]"><PageTitle kicker="Head-to-head / week 32" title="Personal business." detail="Every fixture is a small argument. See the record, the run, and who has to answer for it." action={<Link href="/standings" className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-xs font-bold text-slate-300 hover:border-lime-300/50 hover:text-lime-200" data-testid="link-switch-standings">Traditional table <ChevronRight size={14} /></Link>} />{standingsQuery.isLoading || scheduleQuery.isLoading ? <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]"><Skeleton className="h-[520px]" /><Skeleton className="h-[520px]" /></div> : <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section className="panel animate-rise stagger-1 overflow-hidden rounded-2xl"><div className="border-b border-slate-700/60 p-5 sm:p-6"><div className="eyebrow">Season record</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">The head-to-head ladder</h2></div><div className="mobile-scroll"><table className="w-full min-w-[700px] text-left"><thead><tr className="border-b border-slate-800 font-mono text-[10px] uppercase tracking-[.14em] text-slate-600"><th className="px-6 py-4">#</th><th className="px-2 py-4">Manager</th><th className="px-2 py-4 text-center">W-D-L</th><th className="px-2 py-4 text-right">+/-</th><th className="px-2 py-4 text-right">LP</th><th className="px-6 py-4 text-right">Run</th></tr></thead><tbody className="divide-y divide-slate-800/80">{standings.map((row) => <tr key={row.manager} className="transition-colors hover:bg-lime-300/[.035]" data-testid={`head-to-head-row-${row.rank}`}><td className="px-6 py-5 font-display text-lg font-bold text-lime-300">{String(row.rank).padStart(2, '0')}</td><td className="px-2 py-5"><div className="flex items-center gap-3"><Avatar label={row.initials ?? initials(row.manager)} /><span className="text-sm font-bold text-stone-100">{row.manager}</span></div></td><td className="px-2 py-5 text-center font-mono text-xs text-slate-300">{row.wins}-{row.draws}-{row.losses}</td><td className={`px-2 py-5 text-right font-mono text-xs ${row.pointDifference >= 0 ? 'text-lime-300' : 'text-orange-300'}`}>{row.pointDifference > 0 ? '+' : ''}{row.pointDifference}</td><td className="px-2 py-5 text-right font-display text-lg font-bold text-stone-100">{row.leaguePoints}</td><td className="px-6 py-5 text-right font-mono text-[10px] tracking-[.15em]"><span className="text-lime-300">{row.streak.replaceAll('W', 'W')}</span></td></tr>)}</tbody></table></div></section><section className="panel animate-rise stagger-2 overflow-hidden rounded-2xl"><div className="flex items-center justify-between border-b border-slate-700/60 p-5 sm:p-6"><div><div className="eyebrow text-orange-300">Current gameweek</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">Fixtures</h2></div><span className="rounded-lg bg-orange-300/10 p-2 text-orange-300"><Swords size={17} /></span></div><div className="space-y-3 p-5 sm:p-6">{schedule.map((match) => <div key={match.id} className={`rounded-xl border p-4 transition-colors ${match.featured ? 'border-lime-300/30 bg-lime-300/[.06]' : 'border-slate-700/70 bg-slate-950/20'}`} data-testid={`matchup-card-${match.id}`}><div className="mb-3 flex items-center justify-between"><span className={`font-mono text-[9px] uppercase tracking-[.16em] ${match.featured ? 'text-lime-300' : 'text-slate-600'}`}>{match.featured ? 'Featured fixture' : match.status}</span><span className="text-[10px] text-slate-600">GW 32</span></div><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Avatar label={initials(match.home)} /><span className="truncate text-xs font-bold text-stone-200">{match.home}</span></div><span className="font-display text-lg font-bold text-stone-100">{match.homeScore}</span></div><div className="my-2 h-px bg-slate-700/60" /><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><Avatar label={initials(match.away)} /><span className="truncate text-xs font-bold text-stone-200">{match.away}</span></div><span className="font-display text-lg font-bold text-stone-100">{match.awayScore}</span></div></div>)}</div></section></div>}</div>;
}

function CompetitionsPage({ leagueId }: { leagueId: string }) {
  const createCompetition = useCreateCompetition();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [name, setName] = useState('');
  const [type, setType] = useState('knockout');
  const [message, setMessage] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    createCompetition.mutate({ leagueId, data: { name: name.trim(), type } }, {
      onSuccess: (competition) => {
        setCompetitions((current) => [competition, ...current]);
        setName('');
        setMessage(`${competition.name} is live in the room.`);
      },
      onError: () => setMessage('Could not start that competition. Try again.'),
    });
  };
  return <div className="mx-auto max-w-[1200px]"><PageTitle kicker="Side quests / season 24–25" title="Competitions" detail="Give the run-in a second scoreboard. Create a side quest, then make it everyone&apos;s problem." /><div className="grid gap-6 lg:grid-cols-[.78fr_1.22fr]"><section className="panel animate-rise stagger-1 rounded-2xl p-6 sm:p-8"><div className="mb-6 flex items-start justify-between"><div><div className="eyebrow text-orange-300">New competition</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">Add some stakes</h2></div><span className="rounded-xl bg-orange-300/10 p-3 text-orange-300"><Trophy size={20} /></span></div><form onSubmit={submit} className="space-y-5"><label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Competition name</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder="The run-in cup" className="w-full rounded-xl border border-slate-700 bg-slate-950/30 px-4 py-3 text-sm text-stone-100 outline-none transition-colors placeholder:text-slate-600 focus:border-lime-300/70" data-testid="input-competition-name" /></label><label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Format</span><select value={type} onChange={(event) => setType(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-[#111a2b] px-4 py-3 text-sm text-stone-100 outline-none focus:border-lime-300/70" data-testid="select-competition-type"><option value="knockout">Knockout cup</option><option value="classic">Classic points</option><option value="weekly">Weekly sprint</option></select></label><button type="submit" disabled={createCompetition.isPending || !name.trim()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-create-competition">{createCompetition.isPending ? 'Creating…' : <><Plus size={16} /> Create competition</>}</button>{message ? <p className={`text-center text-xs ${message.includes('Could not') ? 'text-orange-300' : 'text-lime-300'}`} data-testid="status-competition">{message}</p> : null}</form></section><section className="panel animate-rise stagger-2 rounded-2xl p-6 sm:p-8"><div className="flex items-center justify-between"><div><div className="eyebrow">In this league</div><h2 className="mt-1 font-display text-xl font-bold text-stone-100">Competition board</h2></div><span className="font-mono text-[10px] uppercase tracking-[.14em] text-slate-600">{competitions.length} active</span></div>{competitions.length === 0 ? <div className="flex min-h-[285px] flex-col items-center justify-center text-center"><div className="mb-4 rounded-2xl border border-slate-700 bg-slate-900/60 p-4 text-slate-500"><ClipboardList size={24} /></div><h3 className="font-display text-lg font-bold text-stone-200">No side quests yet</h3><p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">The league is still waiting for someone to make the first move.</p></div> : <div className="mt-6 space-y-3">{competitions.map((competition) => <div key={competition.id} className="flex items-center gap-4 rounded-xl border border-slate-700/70 bg-slate-950/20 p-4" data-testid={`competition-card-${competition.id}`}><span className="rounded-xl bg-lime-300/10 p-3 text-lime-300"><Trophy size={17} /></span><div className="flex-1"><div className="text-sm font-bold text-stone-100">{competition.name}</div><div className="mt-1 font-mono text-[10px] uppercase tracking-[.12em] text-slate-500">{competition.type} · {competition.status}</div></div><span className="rounded-full bg-lime-300/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-lime-300">Live</span></div>)}</div>}</section></div></div>;
}

function ConnectPage({ onConnected }: { onConnected: (league: League) => void }) {
  const connectLeague = useConnectFplLeague();
  const createLeague = useCreateLeague();
  const [mode, setMode] = useState<'connect' | 'create'>('connect');
  const [name, setName] = useState('');
  const [season, setSeason] = useState('2024/25');
  const [fplLeagueId, setFplLeagueId] = useState('');
  const [message, setMessage] = useState('');
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (mode === 'connect') {
      connectLeague.mutate({ data: { fplLeagueId: fplLeagueId.trim(), name: name.trim(), season } }, {
        onSuccess: (league) => { localStorage.setItem('fpl-league-id', league.id); onConnected(league); },
        onError: () => setMessage('We could not find that mini-league. Check the ID and try again.'),
      });
    } else {
      createLeague.mutate({ data: { name: name.trim(), season } }, {
        onSuccess: (league) => { localStorage.setItem('fpl-league-id', league.id); onConnected(league); },
        onError: () => setMessage('Could not create the league right now. Try again.'),
      });
    }
  };
  const pending = connectLeague.isPending || createLeague.isPending;
  return <div className="mx-auto max-w-[1100px]"><div className="grid items-center gap-10 lg:grid-cols-[.9fr_1.1fr] lg:gap-16"><div className="animate-rise"><div className="eyebrow mb-4">Open the room</div><h1 className="font-display text-5xl font-bold leading-[.95] tracking-[-.06em] text-stone-100 sm:text-6xl">Bring your<br /><span className="text-lime-300">league with you.</span></h1><p className="mt-6 max-w-md text-sm leading-7 text-slate-400">FPLROOM turns a private mini-league into a matchday control room. Connect the live table, then give your mates somewhere worth checking.</p><div className="mt-8 space-y-3"><div className="flex items-center gap-3 text-xs text-slate-400"><span className="rounded-lg bg-lime-300/10 p-2 text-lime-300"><BarChart3 size={15} /></span>Live standings and form signals</div><div className="flex items-center gap-3 text-xs text-slate-400"><span className="rounded-lg bg-orange-300/10 p-2 text-orange-300"><Swords size={15} /></span>Head-to-head fixtures every gameweek</div><div className="flex items-center gap-3 text-xs text-slate-400"><span className="rounded-lg bg-sky-300/10 p-2 text-sky-300"><Trophy size={15} /></span>Private competitions for the run-in</div></div></div><section className="panel animate-rise stagger-2 rounded-2xl p-6 sm:p-8"><div className="flex rounded-xl border border-slate-700 bg-slate-950/30 p-1"><button type="button" onClick={() => { setMode('connect'); setMessage(''); }} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${mode === 'connect' ? 'bg-slate-700 text-stone-100' : 'text-slate-500 hover:text-stone-200'}`} data-testid="button-mode-connect">Connect existing</button><button type="button" onClick={() => { setMode('create'); setMessage(''); }} className={`flex-1 rounded-lg px-3 py-2.5 text-xs font-bold transition-colors ${mode === 'create' ? 'bg-slate-700 text-stone-100' : 'text-slate-500 hover:text-stone-200'}`} data-testid="button-mode-create">Create new league</button></div><form onSubmit={submit} className="mt-8 space-y-5"><div><div className="eyebrow text-orange-300">{mode === 'connect' ? 'Connect a mini-league' : 'Create your private room'}</div><h2 className="mt-1 font-display text-2xl font-bold text-stone-100">{mode === 'connect' ? 'Plug in the live table.' : 'Name the competition.'}</h2></div><label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">League name</span><input required value={name} onChange={(event) => setName(event.target.value)} placeholder="The Tuesday Club" className="w-full rounded-xl border border-slate-700 bg-slate-950/30 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-600 focus:border-lime-300/70" data-testid="input-league-name" /></label>{mode === 'connect' ? <label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">FPL mini-league ID</span><input required value={fplLeagueId} onChange={(event) => setFplLeagueId(event.target.value)} placeholder="e.g. 458291" inputMode="numeric" className="w-full rounded-xl border border-slate-700 bg-slate-950/30 px-4 py-3 text-sm text-stone-100 outline-none placeholder:text-slate-600 focus:border-lime-300/70" data-testid="input-fpl-league-id" /><span className="mt-2 block text-[11px] leading-5 text-slate-500">Find it in the URL of your official FPL mini-league.</span></label> : null}<label className="block"><span className="mb-2 block text-xs font-bold text-slate-300">Season</span><select value={season} onChange={(event) => setSeason(event.target.value)} className="w-full rounded-xl border border-slate-700 bg-[#111a2b] px-4 py-3 text-sm text-stone-100 outline-none focus:border-lime-300/70" data-testid="select-league-season"><option value="2024/25">2024/25</option><option value="2025/26">2025/26</option></select></label><button type="submit" disabled={pending || !name.trim() || (mode === 'connect' && !fplLeagueId.trim())} className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3.5 text-sm font-bold text-slate-950 transition-all hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-submit-league">{pending ? 'Opening room…' : mode === 'connect' ? <><Link2 size={16} /> Connect mini-league</> : <><Plus size={16} /> Create private league</>}</button>{message ? <p className="text-center text-xs text-orange-300" data-testid="status-connect">{message}</p> : null}</form></section></div></div>;
}

function SignInPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1321] px-4"><SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} /></div>;
}

function SignUpPage() {
  return <div className="flex min-h-[100dvh] items-center justify-center bg-[#0d1321] px-4"><SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} /></div>;
}

function Router({ leagueId, onConnected }: { leagueId: string; onConnected: (league: League) => void }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/sign-in/*?" component={SignInPage} /><Route path="/sign-up/*?" component={SignUpPage} /><AppShell><Switch><Route path="/" component={() => <DashboardPage leagueId={leagueId} />} /><Route path="/standings" component={() => <StandingsPage leagueId={leagueId} />} /><Route path="/head-to-head" component={() => <HeadToHeadPage leagueId={leagueId} />} /><Route path="/competitions" component={() => <CompetitionsPage leagueId={leagueId} />} /><Route path="/connect" component={() => <ConnectPage onConnected={onConnected} />} /><Route component={NotFound} /></Switch></AppShell></Switch></ErrorBoundary>;
}

function App() {
  const [leagueId, setLeagueId] = useState(() => localStorage.getItem('fpl-league-id') ?? 'demo');
  return <WouterRouter base={basePath}><ClerkProvider publishableKey={clerkPubKey} proxyUrl={clerkProxyUrl} appearance={clerkAppearance} signInUrl={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`}><QueryClientProvider client={queryClient}><TooltipProvider><Router leagueId={leagueId} onConnected={(league) => setLeagueId(league.id)} /><Toaster /></TooltipProvider></QueryClientProvider></ClerkProvider></WouterRouter>;
}

export default App;