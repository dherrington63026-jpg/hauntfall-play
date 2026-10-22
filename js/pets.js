// Companions that follow you into every run, fight beside you and level up with use. Unlocked by Rank.
export const PETS = [
  { id: 'hound', name: 'Wraith Hound', rank: 3, size: 58, desc: 'Lunges at the nearest enemy and bites hard.' },
  { id: 'raven', name: 'Grave Raven', rank: 8, size: 46, desc: 'Pecks two enemies at once from the air.' },
  { id: 'wisp', name: 'Lantern Wisp', rank: 12, size: 52, desc: 'Heals you over time and lights the dark around you.' },
  { id: 'cat', name: 'Midnight', rank: 18, size: 42, desc: 'More crit chance and loot luck, and swipes at anything close.' },
];
export const petOf = (id) => PETS.find((p) => p.id === id) || null;
export const petLv = (S, id) => (S.pets && S.pets[id] ? S.pets[id].lv : 1);
export const petNeed = (lv) => 30 * lv;
// returns the new level if the pet leveled up, else 0
export function petXp(S, id, xp) {
  S.pets = S.pets || {}; const p = (S.pets[id] = S.pets[id] || { xp: 0, lv: 1 }); let up = 0; p.xp += Math.max(0, Math.round(xp));
  while (p.lv < 10 && p.xp >= petNeed(p.lv)) { p.xp -= petNeed(p.lv); p.lv++; up = p.lv; }
  if (p.lv >= 10) p.xp = 0; return up;
}
