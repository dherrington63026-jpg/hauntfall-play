// Account rank: every run earns Rank XP. Every rank gives a reward, every 5th a rare item, every 10th a big bundle.
// Heroes unlock at certain ranks (see HEROES in heroes.js). State: S.rank = {lv, xp}
import { give } from './quests.js';

export const rankNeed = (L) => Math.round(45 + 32 * L + 1.4 * L * L);
export function ensureRank(S) { if (!S.rank) S.rank = { lv: 1, xp: 0 }; return S.rank; }

export function rankRewards(S, L) {
  const m = 1 + 0.12 * L;
  if (L % 10 === 0) return [{ type: 'item', rar: 4 }, { type: 'gem', tier: Math.min(8, 2 + Math.floor(L / 10)), n: 3 }, { type: 'echo', n: 20 + L }];
  if (L % 5 === 0) return [{ type: 'item', rar: 3 }, { type: 'echo', n: 10 + Math.floor(L / 2) }];
  const cyc = L % 5;      // 1..4
  if (cyc === 1) return [{ type: 'gold', n: Math.round(150 * m) }];
  if (cyc === 2) return [{ type: 'scrap', n: Math.round(30 * m) }];
  if (cyc === 3) return [{ type: 'gem', tier: Math.min(8, 1 + Math.floor(L / 8)), n: 1 }];
  return [{ type: 'echo', n: Math.round(6 + L * 0.8) }];
}
// add XP; returns [{lv, rewards}] for every rank gained (rewards are already given)
export function gainRank(S, xp) {
  ensureRank(S); const R = S.rank, out = []; R.xp += Math.max(0, Math.round(xp));
  while (R.xp >= rankNeed(R.lv)) { R.xp -= rankNeed(R.lv); R.lv++; const rw = rankRewards(S, R.lv); for (const r of rw) give(S, r); out.push({ lv: R.lv, rewards: rw }); }
  return out;
}
export const runXp = (r) => Math.floor((r.kills || 0) / 6) + (r.won ? 25 : 0) + (r.bossKills || 0) * 15 + Math.floor((r.t || 0) / 20);
