// Achievements and the collection book (monsters met, weapons found).
// State: S.st = running totals, S.ach = {id: true} claimed, S.dex = {seen:{sprite:kills}, weapons:{kind:true}}
import { ENEMIES, WEAPONS, SLOTS } from './data.js';
import { give } from './quests.js';

export function ensureBook(S) {
  if (!S.st) S.st = { kills: 0, elites: 0, bosses: 0, crates: 0, gems: 0, runs: 0, haunts: 0 };
  if (!S.ach) S.ach = {};
  if (!S.dex) S.dex = { seen: {}, weapons: {} };
  return S;
}
export function addStats(S, o) { ensureBook(S); for (const k in o) S.st[k] = (S.st[k] || 0) + (o[k] || 0); }
export function mergeKills(S, killed) { ensureBook(S); for (const k in killed || {}) S.dex.seen[k] = (S.dex.seen[k] || 0) + killed[k]; }
const owned = (S) => [...S.bag, ...SLOTS.map((s) => S.gear[s]).filter(Boolean)];
export function syncDex(S) { ensureBook(S); for (const it of owned(S)) if (it.slot === 'weapon' && it.kind) S.dex.weapons[it.kind] = true; }

const rooms = (S) => Object.values(S.base ? S.base.rooms : {}).filter((r) => r.lvl > 0);
const upMax = (S) => owned(S).reduce((n, it) => Math.max(n, (it.up || 0)), 0);
const ascMax = (S) => owned(S).reduce((n, it) => Math.max(n, (it.asc || 0)), 0);
const socketed = (S) => owned(S).reduce((n, it) => n + (it.gems || []).filter(Boolean).length, 0);
const seenCount = (S) => Object.keys(S.dex.seen).filter((k) => S.dex.seen[k] > 0).length;
const kindsOf = (S) => Object.keys(S.dex.weapons).length;
const G = (n) => ({ type: 'gold', n }), SC = (n) => ({ type: 'scrap', n }), GM = (t, n = 1) => ({ type: 'gem', tier: t, n }), IT = (r) => ({ type: 'item', rar: r });

export const ACH = [
  { id: 'k1', name: 'First Blood', desc: 'Defeat 100 undead', target: 100, cur: (S) => S.st.kills, rew: G(150) },
  { id: 'k2', name: 'Grave Digger', desc: 'Defeat 1,000 undead', target: 1000, cur: (S) => S.st.kills, rew: GM(1, 2) },
  { id: 'k3', name: 'Reaper', desc: 'Defeat 10,000 undead', target: 10000, cur: (S) => S.st.kills, rew: IT(3) },
  { id: 'k4', name: 'Extinction', desc: 'Defeat 100,000 undead', target: 100000, cur: (S) => S.st.kills, rew: IT(4) },
  { id: 'b1', name: 'Boss Slayer', desc: 'Defeat a boss', target: 1, cur: (S) => S.st.bosses, rew: G(200) },
  { id: 'b2', name: 'Boss Hunter', desc: 'Defeat 10 bosses', target: 10, cur: (S) => S.st.bosses, rew: GM(2, 2) },
  { id: 'b3', name: 'Boss Breaker', desc: 'Defeat 50 bosses', target: 50, cur: (S) => S.st.bosses, rew: IT(4) },
  { id: 'e1', name: 'Elite Trouble', desc: 'Slay 50 elites', target: 50, cur: (S) => S.st.elites, rew: SC(40) },
  { id: 'e2', name: 'Elite Menace', desc: 'Slay 500 elites', target: 500, cur: (S) => S.st.elites, rew: IT(3) },
  { id: 'c1', name: 'Scavenger', desc: 'Open 10 supply crates', target: 10, cur: (S) => S.st.crates, rew: G(150) },
  { id: 'c2', name: 'Hoarder', desc: 'Open 100 supply crates', target: 100, cur: (S) => S.st.crates, rew: IT(3) },
  { id: 'g1', name: 'Gem Finder', desc: 'Collect 25 gems', target: 25, cur: (S) => S.st.gems, rew: GM(2, 1) },
  { id: 'g2', name: 'Gem Hoarder', desc: 'Collect 250 gems', target: 250, cur: (S) => S.st.gems, rew: GM(4, 2) },
  { id: 'r1', name: 'Regular', desc: 'Complete 10 runs', target: 10, cur: (S) => S.st.runs, rew: G(150) },
  { id: 'r2', name: 'Survivor', desc: 'Complete 100 runs', target: 100, cur: (S) => S.st.runs, rew: IT(3) },
  { id: 'h1', name: 'Night Watch', desc: 'Hold the church through 3 haunted nights', target: 3, cur: (S) => S.st.haunts, rew: SC(40) },
  { id: 'h2', name: 'Keeper of the Light', desc: 'Hold the church through 25 haunted nights', target: 25, cur: (S) => S.st.haunts, rew: IT(4) },
  { id: 'd1', name: 'Down the Road', desc: 'Reach district 3', target: 3, cur: (S) => S.maxDistrict, rew: G(200) },
  { id: 'd2', name: 'Halfway There', desc: 'Reach district 6', target: 6, cur: (S) => S.maxDistrict, rew: GM(3, 2) },
  { id: 'd3', name: 'Deep Into the Town', desc: 'Reach district 12', target: 12, cur: (S) => S.maxDistrict, rew: IT(4) },
  { id: 'n1', name: 'Nightmare Begins', desc: 'Unlock Nightmare I', target: 1, cur: (S) => S.nm || 0, rew: G(300) },
  { id: 'n2', name: 'Nightmare Walker', desc: 'Unlock Nightmare V', target: 5, cur: (S) => S.nm || 0, rew: IT(4) },
  { id: 'n3', name: 'Nightmare Master', desc: 'Unlock Nightmare X', target: 10, cur: (S) => S.nm || 0, rew: IT(5) },
  { id: 'u1', name: 'Tinkerer', desc: 'Upgrade a piece of gear to +10', target: 10, cur: upMax, rew: SC(40) },
  { id: 'u2', name: 'Master Smith', desc: 'Upgrade a piece of gear to +25', target: 25, cur: upMax, rew: GM(3, 2) },
  { id: 'u3', name: 'Ascended', desc: 'Ascend a piece of gear', target: 1, cur: ascMax, rew: IT(4) },
  { id: 's1', name: 'Gem Setter', desc: 'Have 3 gems socketed in your gear', target: 3, cur: socketed, rew: GM(2, 2) },
  { id: 'w1', name: 'Armed', desc: 'Find 6 different weapons', target: 6, cur: kindsOf, rew: G(250) },
  { id: 'w2', name: 'Arsenal', desc: 'Find 12 different weapons', target: 12, cur: kindsOf, rew: IT(3) },
  { id: 'w3', name: 'Gun Nut', desc: 'Find every weapon', target: Object.keys(WEAPONS).length, cur: kindsOf, rew: IT(5) },
  { id: 'm1', name: 'Know Your Enemy', desc: 'Meet 10 kinds of monsters', target: 10, cur: seenCount, rew: G(200) },
  { id: 'm2', name: 'Monster Expert', desc: 'Meet 20 kinds of monsters', target: 20, cur: seenCount, rew: IT(3) },
  { id: 'm3', name: 'Bestiary Complete', desc: 'Meet every monster', target: dexMonsters().length, cur: seenCount, rew: IT(5) },
  { id: 'f1', name: 'Home Sweet Home', desc: 'Build 5 rooms in the church', target: 5, cur: (S) => rooms(S).length, rew: SC(40) },
  { id: 'f2', name: 'Fortress', desc: 'Build 15 rooms in the church', target: 15, cur: (S) => rooms(S).length, rew: IT(3) },
  { id: 'f3', name: 'Foundations', desc: 'Raise your rooms to 50 levels in total', target: 50, cur: (S) => rooms(S).reduce((n, r) => n + r.lvl, 0), rew: GM(3, 2) },
  { id: 'x1', name: 'Into the Dark', desc: 'Last 5 minutes in Endless Descent', target: 300, cur: (S) => (S.rec && S.rec.endless ? S.rec.endless.t : 0), rew: GM(2, 2) },
  { id: 'x2', name: 'No End In Sight', desc: 'Last 15 minutes in Endless Descent', target: 900, cur: (S) => (S.rec && S.rec.endless ? S.rec.endless.t : 0), rew: IT(4) },
  { id: 'x3', name: 'Rush Hour', desc: 'Beat 6 bosses in a Boss Rush', target: 6, cur: (S) => (S.rec && S.rec.rush ? S.rec.rush.best : 0), rew: GM(4, 2) },
  { id: 'x4', name: 'Boss Rush Champion', desc: 'Clear the whole Boss Rush', target: 1, cur: (S) => (S.rec && S.rec.rush ? S.rec.rush.done : 0), rew: IT(5) },
  { id: 'p1', name: 'Neighbours', desc: 'Have 5 survivors living in the church', target: 5, cur: (S) => (S.base ? S.base.survivors.length : 0), rew: SC(40) },
  { id: 'p2', name: 'A Real Community', desc: 'Have 15 survivors living in the church', target: 15, cur: (S) => (S.base ? S.base.survivors.length : 0), rew: IT(4) },
];
export function dexMonsters() { return Object.entries(ENEMIES).filter(([k]) => k !== 'revenant').map(([k, e]) => ({ key: k, ...e })).sort((a, b) => (a.boss ? 2 : a.elite ? 1 : 0) - (b.boss ? 2 : b.elite ? 1 : 0)); }
export const achCur = (S, a) => { ensureBook(S); syncDex(S); return Math.min(a.target, Math.floor(a.cur(S) || 0)); };
export const achDone = (S, a) => achCur(S, a) >= a.target;
export function claimAch(S, id) { const a = ACH.find((x) => x.id === id); ensureBook(S); if (!a || S.ach[id] || !achDone(S, a)) return null; S.ach[id] = true; give(S, a.rew); return a; }
export function achReady(S) { ensureBook(S); return ACH.some((a) => !S.ach[a.id] && achDone(S, a)); }
