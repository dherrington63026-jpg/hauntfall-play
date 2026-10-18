// Hauntfall data: gear, weapons, enemies, run upgrades, save game.
export const rnd = (a, b) => a + Math.random() * (b - a);
export const rint = (a, b) => Math.floor(rnd(a, b + 1));
export const pick = (a) => a[Math.floor(Math.random() * a.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- gear ----------
export const RARITIES = [
  { id: 0, name: 'White', color: '#cfd3d8', mult: 1.0, affixes: 0 },
  { id: 1, name: 'Green', color: '#5ed06a', mult: 1.25, affixes: 1 },
  { id: 2, name: 'Blue', color: '#4aa3ff', mult: 1.6, affixes: 2 },
  { id: 3, name: 'Purple', color: '#b36bff', mult: 2.1, affixes: 3 },
  { id: 4, name: 'Gold', color: '#ffc94a', mult: 2.8, affixes: 4 },
  { id: 5, name: 'Red', color: '#ff4a4a', mult: 3.8, affixes: 5 },
];
export const SLOTS = ['weapon', 'head', 'body', 'boots', 'charm', 'relic'];
export const SLOT_NAME = { weapon: 'Weapon', head: 'Head', body: 'Body', boots: 'Boots', charm: 'Charm', relic: 'Relic' };
// weapons: dmg = per-hit multiplier, rate = seconds between shots, n = projectiles, spread = radians, speed px/s, life s, pierce hits, range px
export const WEAPONS = {
  knife:    { name: 'Combat Knife', icon: 'knife', dmg: 1.0, rate: 0.55, n: 2, spread: 0.14, speed: 560, life: 0.8, pierce: 2, range: 340, shape: 'knife', tier: 0 },
  machete:  { name: 'Machete', icon: 'machete', dmg: 2.2, rate: 0.85, n: 1, melee: true, arc: 1.9, reach: 120, range: 130, shape: 'slash', tier: 1 },
  axe:      { name: 'Fire Axe', icon: 'axe', dmg: 3.0, rate: 1.1, n: 1, spread: 0, speed: 330, life: 1.3, pierce: 6, range: 300, shape: 'axe', tier: 1 },
  bat:      { name: 'Barbed Bat', icon: 'bat', dmg: 2.6, rate: 0.7, n: 1, melee: true, arc: 2.3, reach: 105, range: 115, shape: 'slash', tier: 1, knock: 140 },
  crowbar:  { name: 'Crowbar', icon: 'crowbar', dmg: 2.0, rate: 0.6, n: 1, melee: true, arc: 1.6, reach: 125, range: 135, shape: 'slash', tier: 1, knock: 90 },
  pistol:   { name: 'Pistol', icon: 'pistol', dmg: 1.5, rate: 0.42, n: 1, spread: 0.03, speed: 760, life: 0.8, pierce: 1, range: 420, shape: 'bullet', tier: 2 },
  revolver: { name: 'Revolver', icon: 'revolver', dmg: 4.2, rate: 0.95, n: 1, spread: 0.02, speed: 820, life: 0.8, pierce: 2, range: 460, shape: 'bullet', tier: 2 },
  smg:      { name: 'SMG', icon: 'smg', dmg: 0.75, rate: 0.1, n: 1, spread: 0.12, speed: 800, life: 0.7, pierce: 1, range: 400, shape: 'bullet', tier: 3 },
  shotgun:  { name: 'Shotgun', icon: 'shotgun', dmg: 0.95, rate: 0.95, n: 6, spread: 0.5, speed: 700, life: 0.34, pierce: 1, range: 280, shape: 'bullet', tier: 3 },
  rifle:    { name: 'Rifle', icon: 'rifle', dmg: 3.4, rate: 0.6, n: 1, spread: 0.01, speed: 1200, life: 0.7, pierce: 5, range: 620, shape: 'bullet', tier: 4 },
};
const WEAPON_BY_TIER = [['knife'], ['machete', 'axe', 'bat', 'crowbar'], ['pistol', 'revolver'], ['smg', 'shotgun'], ['rifle']];
const SLOT_ICON = { head: ['helmet'], body: ['jacket', 'vest'], boots: ['boots'], charm: ['charm'], relic: ['relic'], weapon: [] };
const NAMES = {
  head: ['Cracked Helmet', 'Hockey Mask', 'Rider Helm', 'Beanie', 'Hard Hat'], body: ['Rain Jacket', 'Leather Jacket', 'Tactical Vest', 'Hunter Coat', 'Riot Vest'],
  boots: ['Work Boots', 'Combat Boots', 'Sneakers', 'Hiking Boots'], charm: ['Rabbit Foot', 'Silver Cross', 'Lucky Coin', 'Saint Medal', 'Old Locket'], relic: ['Cursed Skull', 'Bone Idol', 'Black Candle', 'Grave Bell', 'Hollow Eye'],
};
const PREFIX = ['Worn', 'Salvaged', 'Reinforced', 'Haunted', 'Blessed', 'Bloodied', 'Grave-Touched', 'Nightwatch'];
// what each slot rolls as its base (primary) stat
const PRIMARY = { weapon: ['dmg', 1], head: ['armor', 6], body: ['hp', 28], boots: ['speed', 0.04], charm: ['crit', 0.03], relic: ['rate', 0.05] };
const AFFIX = { dmg: ['dmg', 0.06, 0.12], rate: ['rate', 0.04, 0.09], hp: ['hp', 12, 26], armor: ['armor', 3, 7], speed: ['speed', 0.02, 0.05], crit: ['crit', 0.02, 0.05], magnet: ['magnet', 0.1, 0.25], luck: ['luck', 0.05, 0.12], regen: ['regen', 0.3, 0.9], power: ['power', 0.07, 0.13], critdmg: ['critdmg', 0.1, 0.22], pierce: ['pierce', 1, 1] };
// each slot only rolls bonuses that make sense for it (weapons: damage, attack speed, crit, move speed)
export const SLOT_AFFIXES = { weapon: ['power', 'rate', 'crit', 'critdmg', 'pierce', 'speed'], head: ['armor', 'hp', 'regen', 'luck'], body: ['hp', 'armor', 'regen', 'speed'], boots: ['speed', 'armor', 'hp', 'magnet'], charm: ['crit', 'luck', 'magnet', 'dmg'], relic: ['dmg', 'rate', 'crit', 'regen'] };
const rollAffix = (slot, key, ilvl) => { const a = AFFIX[key]; return rnd(a[1], a[2]) * (1 + ilvl * 0.08); };
export const STAT_LABEL = { power: 'Weapon damage', critdmg: 'Crit damage', pierce: 'Pierce', dmg: 'Damage', rate: 'Fire rate', hp: 'Health', armor: 'Armor', speed: 'Move speed', crit: 'Crit chance', magnet: 'Pickup range', luck: 'Luck', regen: 'Regen/s' };
export const PCT = new Set(['dmg', 'power', 'rate', 'speed', 'crit', 'critdmg', 'magnet', 'luck']);

export function makeItem(S, ilvl, rar, slot, kind) {
  slot = slot || pick(SLOTS);
  const R = RARITIES[rar]; let wk = null;
  if (slot === 'weapon') { const tier = clamp(Math.floor((ilvl - 1) / 4) + (Math.random() < 0.25 ? 1 : 0), 0, 4); wk = kind || pick(WEAPON_BY_TIER[Math.min(tier, WEAPON_BY_TIER.length - 1)]); }
  const it = { id: S.nextId++, slot, rar, ilvl, up: 0, kind: wk, stats: {} };
  const [pk, pv] = PRIMARY[slot];
  it.stats[pk] = slot === 'weapon' ? 1 : pv * (1 + ilvl * 0.12);
  const used = new Set([pk]);
  for (let i = 0; i < R.affixes; i++) {
    const opts = SLOT_AFFIXES[slot].filter((k) => !used.has(k)); if (!opts.length) break; const k = pick(opts); used.add(k);
    it.stats[k] = rollAffix(slot, k, ilvl);
  }
  if (slot === 'weapon') it.name = `${pick(PREFIX)} ${WEAPONS[wk].name}`; else it.name = `${pick(PREFIX)} ${pick(NAMES[slot])}`;
  it.icon = slot === 'weapon' ? WEAPONS[wk].icon : pick(SLOT_ICON[slot]);
  return it;
}
export const itemMult = (it) => RARITIES[it.rar].mult * (1 + 0.1 * it.up);
export const itemStat = (it, k) => (it.stats[k] || 0) * (k === 'dmg' && it.slot === 'weapon' ? 1 : 1) * itemMult(it);
export const upCost = (it) => Math.round((20 + it.ilvl * 8) * (1 + it.up * 0.9) * (1 + it.rar * 0.6));
export const salvageValue = (it) => Math.round((6 + it.ilvl * 4) * (1 + it.rar * 1.3) * (1 + 0.5 * it.up));
export function itemScore(it) { if (!it) return 0; let s = 0; for (const k in it.stats) { const v = itemStat(it, k); s += k === 'dmg' && it.slot === 'weapon' ? v * 40 * (WEAPONS[it.kind].dmg / WEAPONS[it.kind].rate) : k === 'hp' ? v * 0.5 : k === 'armor' ? v * 2 : PCT.has(k) ? v * 100 : v * 10; } return s; }

// ---------- hero stats from gear ----------
export function heroStats(S) {
  const t = { dmg: 0, power: 0, rate: 0, hp: 0, armor: 0, speed: 0, crit: 0.05, critdmg: 0, pierce: 0, magnet: 0, luck: 0, regen: 0 };
  let weapon = null;
  for (const slot of SLOTS) { const it = S.gear[slot]; if (!it) continue; if (slot === 'weapon') weapon = it; for (const k in it.stats) if (!(slot === 'weapon' && k === 'dmg')) t[k] += itemStat(it, k); }
  const base = weapon ? weapon : { kind: 'knife', ilvl: 1, rar: 0, up: 0, stats: { dmg: 1 } };
  const W = WEAPONS[base.kind], wdmg = 11 * W.dmg * (1 + 0.12 * (base.ilvl - 1)) * itemMult(base);
  return { hp: 120 + t.hp, armor: t.armor, speed: 135 * (1 + t.speed), crit: t.crit, magnet: 70 * (1 + t.magnet), luck: t.luck, regen: t.regen, dmgPct: 1 + t.dmg + t.power, critDmg: 2.2 + t.critdmg, pierceBonus: Math.floor(t.pierce + 0.01), ratePct: 1 + t.rate, weaponKind: base.kind, weaponDmg: wdmg, power: Math.round(wdmg * (1 + t.dmg) / W.rate * 0.5 + (120 + t.hp) * 0.2 + t.armor * 2) };
}

// ---------- enemies ----------
// size = drawn height in px; r = hit radius; dmg = contact damage; fx = behaviour tag
export const ENEMIES = {
  ghost: { name: 'Wraith', sprite: 'en_ghost', hp: 22, speed: 62, dmg: 9, r: 15, size: 92, eye: '#cfe8ff', xp: 2, fx: 'ghost' },
  ghoul: { name: 'Ghoul', sprite: 'en_ghoul', hp: 38, speed: 74, dmg: 12, r: 16, size: 88, eye: '#ffd040', xp: 4, fx: 'walk' },
  crow: { name: 'Crow', sprite: 'en_crow', hp: 12, speed: 150, dmg: 7, r: 12, size: 62, eye: '#ff3a3a', xp: 2, fx: 'swoop' },
  child: { name: 'Screamer', sprite: 'en_child', hp: 16, speed: 118, dmg: 8, r: 11, size: 66, eye: '#ff3a3a', xp: 2, fx: 'ghost' },
  brute: { name: 'Butcher', sprite: 'en_brute', hp: 520, speed: 50, dmg: 26, r: 30, size: 150, eye: '#ff3a3a', xp: 30, fx: 'walk', elite: true },
  gravekeeper: { name: 'The Gravekeeper', sprite: 'boss_gravekeeper', hp: 3800, speed: 42, dmg: 34, r: 42, size: 225, eye: '#6dff6d', xp: 150, fx: 'boss', boss: true },
};

// ---------- in-run upgrades (picked on level up) ----------
export const UPGRADES = [
  { id: 'dmg', name: 'Sharpened', desc: '+20% damage', max: 8, apply: (R) => { R.dmgMul *= 1.2; } },
  { id: 'rate', name: 'Quick Hands', desc: '+15% fire rate', max: 8, apply: (R) => { R.rateMul *= 1.15; } },
  { id: 'multi', name: 'Extra Shot', desc: '+1 projectile', max: 4, apply: (R) => { R.extraN += 1; } },
  { id: 'pierce', name: 'Piercing', desc: 'Hits +1 more enemy', max: 4, apply: (R) => { R.extraPierce += 1; } },
  { id: 'hp', name: 'Thick Skin', desc: '+25 max health, heal 25', max: 6, apply: (R) => { R.maxHp += 25; R.hp += 25; } },
  { id: 'speed', name: 'Adrenaline', desc: '+10% move speed', max: 5, apply: (R) => { R.speedMul *= 1.1; } },
  { id: 'magnet', name: 'Scavenger', desc: '+35% pickup range', max: 5, apply: (R) => { R.magnetMul *= 1.35; } },
  { id: 'regen', name: 'Second Wind', desc: '+0.8 health per second', max: 5, apply: (R) => { R.regen += 0.8; } },
  { id: 'crit', name: 'Killer Instinct', desc: '+8% crit chance', max: 5, apply: (R) => { R.crit += 0.08; } },
  { id: 'luck', name: 'Lucky Find', desc: '+25% loot luck', max: 4, apply: (R) => { R.luckMul *= 1.25; } },
  { id: 'salt', name: 'Salt Circle', desc: 'Salt orbits you and burns ghosts', max: 5, weapon: true, apply: (R) => { R.salt += 1; } },
  { id: 'beam', name: 'Flashlight Beam', desc: 'A beam of light scorches what you face', max: 5, weapon: true, apply: (R) => { R.beam += 1; } },
  { id: 'fire', name: 'Molotov', desc: 'Throws fire into the swarm', max: 5, weapon: true, apply: (R) => { R.fire += 1; } },
];

// ---------- save ----------
const KEY = 'hauntfall_v1';
export function newSave() {
  const S = { v: 1, nextId: 1, gold: 0, bag: [], gear: {}, best: 0, runs: 0, wins: 0, district: 1, maxDistrict: 1, lastSeen: Date.now(), hero: 'f', opts: { afk: false, sound: true } };
  S.gear.weapon = makeItem(S, 1, 0, 'weapon', 'knife'); S.gear.weapon.name = 'Rusty Kitchen Knife';
  return S;
}
// older items may carry bonuses their slot should not have: swap them for allowed ones of similar strength
function fixItem(it) {
  if (!it || !it.stats) return; const ok = SLOT_AFFIXES[it.slot]; if (!ok) return; const primary = PRIMARY[it.slot][0];
  for (const k of Object.keys(it.stats)) {
    if (k === primary || ok.includes(k)) continue;
    delete it.stats[k]; const opts = ok.filter((n) => !(n in it.stats) && n !== primary); if (opts.length) { const n = pick(opts); it.stats[n] = rollAffix(it.slot, n, it.ilvl); }
  }
}
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) { (s.bag || []).forEach(fixItem); Object.values(s.gear || {}).forEach(fixItem); return s; } } catch (e) { } return null; }
export function writeSave(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
export const IDLE_CAP_MIN = 480;
export function idlePreview(S) { const mins = Math.min(IDLE_CAP_MIN, (Date.now() - S.lastSeen) / 60000); const rate = 4 + 3 * S.maxDistrict + S.best * 0.4; return { mins, gold: Math.floor(mins * rate), gear: Math.min(6, Math.floor(mins / 45)) }; }
export function autoEquip(S) { let n = 0; for (const slot of SLOTS) { let best = S.gear[slot], bs = itemScore(best); for (const it of S.bag) if (it.slot === slot) { const sc = itemScore(it); if (sc > bs + 0.01) { best = it; bs = sc; } } if (best !== S.gear[slot]) { S.bag.splice(S.bag.indexOf(best), 1); if (S.gear[slot]) S.bag.push(S.gear[slot]); S.gear[slot] = best; n++; } } return n; }
