// Daily and weekly quests plus the login streak. All state lives in S.q:
//   { daily: {day, list, bonus}, weekly: {week, list, bonus}, streak: {n, last} }
import { makeGem, makeItem, RARITIES } from './data.js';

const POOL = [
  { id: 'kills', key: 'kills', text: (n) => `Defeat ${n} undead`, d: [120, 300], w: 6 },
  { id: 'elites', key: 'elites', text: (n) => `Slay ${n} elites`, d: [4, 8], w: 5 },
  { id: 'bosses', key: 'bosses', text: (n) => (n === 1 ? 'Defeat a boss' : `Defeat ${n} bosses`), d: [1, 1], w: 5 },
  { id: 'crates', key: 'crates', text: (n) => `Open ${n} supply crates`, d: [2, 3], w: 5 },
  { id: 'gems', key: 'gems', text: (n) => `Collect ${n} gems`, d: [2, 4], w: 4 },
  { id: 'gold', key: 'gold', text: (n) => `Earn ${n} gold in runs`, d: [300, 700], w: 5, scale: true },
  { id: 'runs', key: 'runs', text: (n) => `Complete ${n} runs`, d: [2, 3], w: 4 },
  { id: 'minutes', key: 'minutes', text: (n) => `Survive ${n} minutes in total`, d: [8, 14], w: 4 },
  { id: 'upgrades', key: 'upgrades', text: (n) => `Upgrade your gear ${n} times`, d: [3, 6], w: 4 },
  { id: 'builds', key: 'builds', text: (n) => `Start ${n} room upgrades`, d: [1, 2], w: 4 },
  { id: 'recruits', key: 'recruits', text: (n) => `Welcome ${n} survivor${n > 1 ? 's' : ''} to the church`, d: [1, 1], w: 2, weeklyOnly: true },
  { id: 'haunts', key: 'haunts', text: (n) => `Survive ${n} haunted night${n > 1 ? 's' : ''}`, d: [1, 1], w: 2, weeklyOnly: true },
];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pad = (n) => String(n).padStart(2, '0');
export const dayKey = (t = Date.now()) => { const d = new Date(t); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const weekKey = (t = Date.now()) => { const d = new Date(t); const off = (d.getDay() + 6) % 7; d.setDate(d.getDate() - off); return dayKey(d.getTime()); };
const yesterday = (t = Date.now()) => dayKey(t - 24 * 3600 * 1000);
const scaleOf = (S) => 1 + 0.35 * (Math.max(1, S.maxDistrict || 1) - 1);

function rewardFor(S, big) {
  const m = scaleOf(S), kind = pick(['gold', 'gold', 'scrap', 'gem', 'item']), f = big ? 4 : 1;
  if (kind === 'gold') return { type: 'gold', n: Math.round(120 * m * f) };
  if (kind === 'scrap') return { type: 'scrap', n: Math.round(14 * m * f) };
  if (kind === 'gem') return { type: 'gem', tier: Math.min(8, 1 + Math.floor((S.maxDistrict - 1) / 3) + (big ? 1 : 0)), n: big ? 2 : 1 };
  return { type: 'item', rar: big ? 3 : 1 };
}
export function rewardText(r) {
  if (r.type === 'echo') return `${r.n} Echoes`;
  if (r.type === 'gold') return `${r.n.toLocaleString()} gold`;
  if (r.type === 'scrap') return `${r.n} scrap`;
  if (r.type === 'gem') return `${r.n} gem${r.n > 1 ? 's' : ''}`;
  return `a ${RARITIES[r.rar].name.toLowerCase()} item`;
}
function makeList(S, weekly) {
  const m = scaleOf(S), pool = POOL.filter((p) => weekly || !p.weeklyOnly), out = [];
  while (out.length < 3 && pool.length) {
    const p = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    let n = rint(p.d[0], p.d[1]); if (p.scale) n = Math.round(n * m / 50) * 50; if (weekly) n = Math.max(n, Math.round(n * p.w));
    if (weekly && (p.id === 'bosses' || p.id === 'recruits' || p.id === 'haunts')) n = Math.min(n, p.id === 'bosses' ? 4 : 3);
    out.push({ id: p.id, key: p.key, target: n, prog: 0, rew: rewardFor(S, weekly), claimed: false });
  }
  return out;
}
export function ensureQuests(S) {
  const now = Date.now(), day = dayKey(now), wk = weekKey(now);
  if (!S.q) S.q = { daily: null, weekly: null, streak: { n: 0, last: '' } };
  if (!S.q.streak) S.q.streak = { n: 0, last: '' };
  if (!S.q.daily || S.q.daily.day !== day) S.q.daily = { day, list: makeList(S, false), bonus: false };
  if (!S.q.weekly || S.q.weekly.week !== wk) S.q.weekly = { week: wk, list: makeList(S, true), bonus: false };
  return S.q;
}
export const questText = (q) => POOL.find((p) => p.id === q.id).text(q.target);
// add progress to every active quest of that kind; returns the texts of quests that just finished
export function track(S, key, n = 1) {
  if (!(n > 0)) return [];
  ensureQuests(S); const done = [];
  for (const list of [S.q.daily.list, S.q.weekly.list]) for (const q of list) {
    if (q.key !== key || q.prog >= q.target) continue;
    q.prog = Math.min(q.target, q.prog + n); if (q.prog >= q.target) done.push(questText(q));
  }
  return done;
}
export function give(S, r) {
  if (r.type === 'echo') S.echo = (S.echo || 0) + r.n; else if (r.type === 'gold') S.gold += r.n; else if (r.type === 'scrap') S.scrap = (S.scrap || 0) + r.n;
  else if (r.type === 'gem') for (let i = 0; i < r.n; i++) S.gems.push(makeGem(S, r.tier));
  else S.bag.push(makeItem(S, 1 + Math.floor((S.maxDistrict || 1) * 1.4), r.rar, undefined, undefined, 0.4));
}
export function claimQuest(S, scope, i) {
  ensureQuests(S); const q = (scope === 'weekly' ? S.q.weekly : S.q.daily).list[i];
  if (!q || q.claimed || q.prog < q.target) return null; q.claimed = true; give(S, q.rew); return q.rew;
}
// bonus for finishing all three quests of a list
const BONUS = (S, weekly) => (weekly ? { type: 'item', rar: 4 } : { type: 'gem', tier: Math.min(8, 1 + Math.floor((S.maxDistrict - 1) / 3)), n: 2 });
export function bonusReady(S, scope) { ensureQuests(S); const L = scope === 'weekly' ? S.q.weekly : S.q.daily; return !L.bonus && L.list.every((q) => q.claimed); }
export function claimBonus(S, scope) { if (!bonusReady(S, scope)) return null; const L = scope === 'weekly' ? S.q.weekly : S.q.daily, r = BONUS(S, scope === 'weekly'); L.bonus = true; give(S, r); return r; }
export const bonusFor = (S, scope) => BONUS(S, scope === 'weekly');

// ---- login streak: one reward per day, the 7-day ladder repeats ----
export function streakReward(S, dayIdx) {
  const m = scaleOf(S), t = Math.min(8, 1 + Math.floor((S.maxDistrict - 1) / 3));
  return [{ type: 'gold', n: Math.round(150 * m) }, { type: 'gold', n: Math.round(300 * m) }, { type: 'gem', tier: t, n: 1 }, { type: 'scrap', n: Math.round(30 * m) },
    { type: 'item', rar: 2 }, { type: 'gem', tier: t, n: 2 }, { type: 'item', rar: 3 }][dayIdx % 7];
}
export function streakState(S) {
  ensureQuests(S); const st = S.q.streak, today = dayKey();
  const claimedToday = st.last === today, alive = claimedToday || st.last === yesterday();
  const n = alive ? st.n : 0;                      // days claimed in a row so far
  return { claimedToday, n, next: claimedToday ? n : n, dayIdx: claimedToday ? (n - 1) % 7 : n % 7 };
}
export function claimStreak(S) {
  const s = streakState(S); if (s.claimedToday) return null;
  const r = streakReward(S, s.dayIdx); give(S, r); S.q.streak = { n: s.n + 1, last: dayKey() }; return r;
}
// anything waiting to be collected? (for the red dot on the tab)
export function claimable(S) {
  ensureQuests(S); if (!streakState(S).claimedToday) return true;
  for (const sc of ['daily', 'weekly']) { const L = S.q[sc]; if (L.list.some((q) => !q.claimed && q.prog >= q.target) || bonusReady(S, sc)) return true; }
  return false;
}
