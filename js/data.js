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
  katana:   { name: 'Katana', icon: 'katana', dmg: 1.3, rate: 0.34, n: 1, melee: true, arc: 1.5, reach: 112, range: 120, shape: 'slash', tier: 1, knock: 50 },
  sledge:   { name: 'Sledgehammer', icon: 'sledgehammer', dmg: 6.0, rate: 1.5, n: 1, melee: true, arc: 2.7, reach: 118, range: 128, shape: 'slash', tier: 1, knock: 300 },
  crossbow: { name: 'Crossbow', icon: 'crossbow', dmg: 5.2, rate: 1.15, n: 1, spread: 0.01, speed: 950, life: 0.9, pierce: 4, range: 520, shape: 'knife', tier: 2 },
  nailgun:  { name: 'Nail Gun', icon: 'nailgun', dmg: 0.7, rate: 0.16, n: 1, spread: 0.07, speed: 900, life: 0.6, pierce: 2, range: 380, shape: 'bullet', tier: 2 },
  chainsaw: { name: 'Chainsaw', icon: 'chainsaw', dmg: 0.55, rate: 0.12, n: 1, melee: true, arc: 1.3, reach: 78, range: 90, shape: 'slash', tier: 3, knock: 20, perk: 'bleed' },
  flame:    { name: 'Flamethrower', icon: 'flamethrower', dmg: 0.38, rate: 0.07, n: 1, spread: 0.22, speed: 420, life: 0.42, pierce: 99, range: 210, shape: 'flame', tier: 3, perk: 'burn' },
  grenade:  { name: 'Grenade Launcher', icon: 'grenade', dmg: 2.6, rate: 1.3, n: 1, spread: 0.03, speed: 520, life: 0.9, pierce: 0, range: 480, shape: 'grenade', tier: 4, boom: 90 },
  sniper:   { name: 'Sniper Rifle', icon: 'sniper', dmg: 9.5, rate: 1.7, n: 1, spread: 0, speed: 1700, life: 0.7, pierce: 9, range: 820, shape: 'bullet', tier: 4 },
  minigun:  { name: 'Minigun', icon: 'minigun', dmg: 0.42, rate: 0.045, n: 1, spread: 0.2, speed: 900, life: 0.6, pierce: 1, range: 430, shape: 'bullet', tier: 5 },
  rifle:    { name: 'Rifle', icon: 'rifle', dmg: 3.4, rate: 0.6, n: 1, spread: 0.01, speed: 1200, life: 0.7, pierce: 5, range: 620, shape: 'bullet', tier: 4 },
};
const WEAPON_BY_TIER = [['knife'], ['machete', 'axe', 'bat', 'crowbar', 'katana', 'sledge'], ['pistol', 'revolver', 'crossbow', 'nailgun'], ['smg', 'shotgun', 'chainsaw', 'flame'], ['rifle', 'grenade', 'sniper'], ['minigun']];
// weapon perks: blue and better weapons roll them (blue 1, gold 2, red 3)
export const PERKS = {
  bleed: { name: 'Bleeding', desc: 'Hits make enemies bleed for 30% of the hit every second' },
  burn: { name: 'Ignite', desc: 'Hits set enemies on fire' },
  frost: { name: 'Frostbite', desc: 'Hits slow enemies by 40%' },
  chain: { name: 'Chain Lightning', desc: 'Some hits arc to 2 nearby enemies' },
  explosive: { name: 'Explosive', desc: 'Some hits explode and hurt everything close' },
  vamp: { name: 'Vampiric', desc: 'Kills heal you for 2% of your health' },
  keen: { name: 'Keen Edge', desc: '+12% critical hit chance' },
  quick: { name: 'Quickdraw', desc: '+15% fire rate' },
  heavy: { name: 'Heavy Hitter', desc: '+20% damage' },
  exec: { name: 'Executioner', desc: '+50% damage to enemies under 30% health' },
  pierce: { name: 'Piercing', desc: 'Shots and swings go through 2 more enemies' },
};
const PERK_KEYS = Object.keys(PERKS);
export function rollPerks(rar, intrinsic) { const n = rar >= 5 ? 3 : rar >= 4 ? 2 : rar >= 2 ? 1 : 0, pool = PERK_KEYS.filter((k) => k !== intrinsic), out = []; for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
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

// ---------- gear sets: wear 2, 4 or 6 pieces of the same set for bonuses ----------
export const SETS = [
  { name: 'Gravedigger', color: '#c9a66b', tiers: { 2: { desc: '+10% damage', stats: { dmg: 0.1 } }, 4: { desc: '+60 health', stats: { hp: 60 } }, 6: { desc: 'Shots pierce +1 more enemy, +20% crit damage', stats: { pierce: 1, critdmg: 0.2 } } } },
  { name: 'Nightwatch', color: '#6ab0ff', tiers: { 2: { desc: '+6% crit chance', stats: { crit: 0.06 } }, 4: { desc: '+15% fire rate', stats: { rate: 0.15 } }, 6: { desc: '+1 extra projectile', sp: { extraN: 1 } } } },
  { name: 'Lamplighter', color: '#ffcf6a', tiers: { 2: { desc: '+15% loot luck, +25% pickup range', stats: { luck: 0.15, magnet: 0.25 } }, 4: { desc: '+1.0 regen/s', stats: { regen: 1 } }, 6: { desc: 'Start every run with Molotov level 2', sp: { fire: 2 } } } },
  { name: 'Plague Doctor', color: '#7dff9a', tiers: { 2: { desc: '+0.8 regen/s', stats: { regen: 0.8 } }, 4: { desc: '+12 armor', stats: { armor: 12 } }, 6: { desc: 'Start every run with Salt Circle level 2', sp: { salt: 2 } } } },
  { name: 'Revenant', color: '#ff6a5a', tiers: { 2: { desc: '+8 armor, +40 health', stats: { armor: 8, hp: 40 } }, 4: { desc: '+15% damage', stats: { dmg: 0.15 } }, 6: { desc: 'Start every run with Flashlight Beam level 2', sp: { beam: 2 } } } },
  { name: "Saint's Vigil", color: '#e8e0ff', tiers: { 2: { desc: '+10% XP', sp: { xp: 0.1 } }, 4: { desc: '+30% crit damage', stats: { critdmg: 0.3 } }, 6: { desc: 'Take 15% less damage', sp: { taken: 0.85 } } } },
];
export function setCounts(S) { const c = {}; for (const slot of SLOTS) { const it = S.gear[slot]; if (it && it.set != null) c[it.set] = (c[it.set] || 0) + 1; } return c; }
export function setBonus(S) {
  const out = { stats: {}, sp: { extraN: 0, salt: 0, beam: 0, fire: 0, taken: 1, xp: 0 }, active: [] };
  for (const [id, n] of Object.entries(setCounts(S))) for (const tier of [2, 4, 6]) if (n >= tier) { const t = SETS[id].tiers[tier]; out.active.push({ set: +id, tier, desc: t.desc }); for (const k in (t.stats || {})) out.stats[k] = (out.stats[k] || 0) + t.stats[k]; for (const k in (t.sp || {})) { if (k === 'taken') out.sp.taken *= t.sp[k]; else if (k === 'salt' || k === 'beam' || k === 'fire') out.sp[k] = Math.max(out.sp[k], t.sp[k]); else out.sp[k] += t.sp[k]; } }
  return out;
}
// ---------- gems and sockets ----------
export const GEMS = {
  ruby: { name: 'Ruby', color: '#ff4a5a', stat: 'dmg', per: 0.04, label: 'damage' },
  onyx: { name: 'Onyx', color: '#9aa4b2', stat: 'armor', per: 4, label: 'armor' },
  emerald: { name: 'Emerald', color: '#4adf7a', stat: 'hp', per: 14, label: 'health' },
  sapphire: { name: 'Sapphire', color: '#4a9aff', stat: 'rate', per: 0.03, label: 'fire rate' },
  topaz: { name: 'Topaz', color: '#ffc94a', stat: 'crit', per: 0.012, label: 'crit chance' },
  opal: { name: 'Opal', color: '#e0d0ff', stat: 'luck', per: 0.03, stat2: 'magnet', per2: 0.04, label: 'loot luck and pickup' },
};
export const GEM_KEYS = Object.keys(GEMS);
export const GEM_TIER = ['', 'Chipped', 'Flawed', 'Normal', 'Flawless', 'Perfect', 'Radiant', 'Brilliant', 'Royal'];
export const GEM_MAX = 8;
export const gemMult = (tier) => Math.pow(tier, 1.3);
export const gemName = (g) => `${GEM_TIER[g.tier]} ${GEMS[g.type].name}`;
export const gemText = (g) => { const G = GEMS[g.type], m = gemMult(g.tier), f = (k, v) => (['dmg', 'rate', 'crit', 'luck', 'magnet'].includes(k) ? '+' + (v * m * 100).toFixed(1) + '%' : '+' + Math.round(v * m)); return `${f(G.stat, G.per)} ${G.label.split(' and ')[0]}${G.stat2 ? ', ' + f(G.stat2, G.per2) + ' pickup' : ''}`; };
export function makeGem(S, tier, type) { return { id: S.nextId++, type: type || pick(GEM_KEYS), tier: clamp(tier, 1, GEM_MAX) }; }
export const socketCount = (it) => (it.rar >= 2 ? it.rar - 1 : 0);
export function socketGem(S, it, idx, gemId) { const g = S.gems.find((x) => x.id === gemId); if (!g || idx >= (it.sockets || 0) || (it.gems && it.gems[idx])) return 'bad'; it.gems = it.gems || []; it.gems[idx] = g; S.gems.splice(S.gems.indexOf(g), 1); return 'ok'; }
export function unsocketGem(S, it, idx) { const g = it.gems && it.gems[idx]; if (!g) return 'bad'; S.gems.push(g); it.gems[idx] = null; return 'ok'; }
export function releaseGems(S, it) { for (const g of (it.gems || [])) if (g) S.gems.push(g); it.gems = []; }
export const fuseCost = (tier) => 80 * tier;
export function fuseGems(S, type, tier) {
  const have = S.gems.filter((g) => g.type === type && g.tier === tier); if (have.length < 3 || tier >= GEM_MAX) return 'bad'; if (S.gold < fuseCost(tier)) return 'poor';
  S.gold -= fuseCost(tier); for (let i = 0; i < 3; i++) S.gems.splice(S.gems.indexOf(have[i]), 1); S.gems.push(makeGem(S, tier + 1, type)); return 'ok';
}
// ---------- forge: turn junk into better gear ----------
export const transmuteCost = (rar) => ({ scrap: 12 * (rar + 1) * (rar + 1) });
export const loose = (S, rar) => S.bag.filter((it) => it.rar === rar);
export function transmute(S, rar) {
  const pool = loose(S, rar).sort((a, b) => itemScore(a) - itemScore(b)); if (rar > 4 || pool.length < 3) return { r: 'bad' }; const c = transmuteCost(rar); if ((S.scrap || 0) < c.scrap) return { r: 'poor' };
  S.scrap -= c.scrap; const eat = pool.slice(0, 3), il = Math.max(...eat.map((x) => x.ilvl)); for (const it of eat) { releaseGems(S, it); S.bag.splice(S.bag.indexOf(it), 1); }
  const out = makeItem(S, il, rar + 1, null, undefined, 0.5); S.bag.push(out); return { r: 'ok', item: out };
}
export const reattuneCost = (it) => ({ scrap: 40 * it.rar });
export function reattune(S, it, setId) { if (it.rar < 2) return 'bad'; const c = reattuneCost(it); if ((S.scrap || 0) < c.scrap) return 'poor'; S.scrap -= c.scrap; it.set = setId; it.name = `${SETS[setId].name} ${it.base || SLOT_NAME[it.slot]}`; return 'ok'; }
export const dismantleValue = (it) => Math.round(2 + it.ilvl * 0.5 + it.rar * 3 + (it.up || 0) * 2);
export function dismantle(S, it) { const n = dismantleValue(it); releaseGems(S, it); S.bag.splice(S.bag.indexOf(it), 1); S.scrap = (S.scrap || 0) + n; return n; }
export const maxUp = (it) => 10 + 10 * (it.asc || 0);
export const ascendCost = (it, S) => { const u = upCost(it, S); return { gold: u * 6, scrap: 30 * ((it.asc || 0) + 1) }; };
export function ascend(S, it) { if (it.up < maxUp(it)) return 'bad'; const c = ascendCost(it, S); if (S.gold < c.gold || (S.scrap || 0) < c.scrap) return 'poor'; S.gold -= c.gold; S.scrap -= c.scrap; it.asc = (it.asc || 0) + 1; return 'ok'; }
export const reforgeCost = (it) => ({ scrap: Math.round((8 + it.ilvl * 2) * (1 + it.rar)) });
export function reforge(S, it) {
  const c = reforgeCost(it); if ((S.scrap || 0) < c.scrap) return 'poor'; const keys = Object.keys(it.stats).filter((k) => k !== PRIMARY[it.slot][0]); if (!keys.length) return 'bad'; S.scrap -= c.scrap;
  for (const k of keys) delete it.stats[k]; const used = new Set([PRIMARY[it.slot][0]]);
  for (let i = 0; i < keys.length; i++) { const opts = SLOT_AFFIXES[it.slot].filter((k) => !used.has(k)); if (!opts.length) break; const k = pick(opts); used.add(k); it.stats[k] = rollAffix(it.slot, k, it.ilvl); }
  return 'ok';
}
export function makeItem(S, ilvl, rar, slot, kind, setChance = 0.4) {
  slot = slot || pick(SLOTS);
  const R = RARITIES[rar]; let wk = null;
  if (slot === 'weapon') { const tier = clamp(Math.floor((ilvl - 1) / 4) + (Math.random() < 0.25 ? 1 : 0), 0, 5); wk = kind || pick(WEAPON_BY_TIER[Math.min(tier, WEAPON_BY_TIER.length - 1)]); }
  const it = { id: S.nextId++, slot, rar, ilvl, up: 0, kind: wk, stats: {} };
  const [pk, pv] = PRIMARY[slot];
  it.stats[pk] = slot === 'weapon' ? 1 : pv * (1 + ilvl * 0.12);
  const used = new Set([pk]);
  for (let i = 0; i < R.affixes; i++) {
    const opts = SLOT_AFFIXES[slot].filter((k) => !used.has(k)); if (!opts.length) break; const k = pick(opts); used.add(k);
    it.stats[k] = rollAffix(slot, k, ilvl);
  }
  const base = slot === 'weapon' ? WEAPONS[wk].name : pick(NAMES[slot]); it.base = base; it.sockets = rar >= 2 ? rar - 1 : 0; it.gems = []; if (slot === 'weapon') it.perks = rollPerks(rar, WEAPONS[wk].perk);
  if (rar >= 2 && Math.random() < setChance) { it.set = Math.floor(Math.random() * SETS.length); it.name = `${SETS[it.set].name} ${base}`; } else it.name = `${pick(PREFIX)} ${base}`;
  it.icon = slot === 'weapon' ? WEAPONS[wk].icon : pick(SLOT_ICON[slot]);
  return it;
}
export const itemMult = (it) => RARITIES[it.rar].mult * (1 + 0.1 * it.up) * (1 + 0.25 * (it.asc || 0));
export const itemStat = (it, k) => (it.stats[k] || 0) * (k === 'dmg' && it.slot === 'weapon' ? 1 : 1) * itemMult(it);
export const upCost = (it, S) => Math.round((20 + it.ilvl * 8) * (1 + it.up * 0.9) * Math.pow(1.08, Math.max(0, it.up - 10)) * (1 + it.rar * 0.6) * (1 - (S ? baseBonus(S).disc : 0)));
export const salvageValue = (it) => Math.round((6 + it.ilvl * 4) * (1 + it.rar * 1.3) * (1 + 0.5 * it.up) * (1 + (it.asc || 0)));
export function itemScore(it) { if (!it) return 0; let s = 0; const setMul = it.set != null ? 1.12 : 1; for (const k in it.stats) { const v = itemStat(it, k); s += k === 'dmg' && it.slot === 'weapon' ? v * 40 * (WEAPONS[it.kind].dmg / WEAPONS[it.kind].rate) : k === 'hp' ? v * 0.5 : k === 'armor' ? v * 2 : PCT.has(k) ? v * 100 : v * 10; } return s * setMul; }

// ---------- hero stats from gear ----------
export function heroStats(S) {
  const t = { dmg: 0, power: 0, rate: 0, hp: 0, armor: 0, speed: 0, crit: 0.05, critdmg: 0, pierce: 0, magnet: 0, luck: 0, regen: 0 };
  let weapon = null; const B = baseBonus(S); t.dmg += B.dmg; t.rate += B.rate || 0; t.speed += B.speed || 0; t.hp += B.hp; t.regen += B.regen; t.luck += B.luck; t.magnet += B.magnet; t.crit += B.crit;
  for (const slot of SLOTS) { const it = S.gear[slot]; if (!it) continue; if (slot === 'weapon') weapon = it; for (const k in it.stats) if (!(slot === 'weapon' && k === 'dmg')) t[k] += itemStat(it, k); }
  for (const slot of SLOTS) { const it = S.gear[slot]; if (!it || !it.gems) continue; for (const g of it.gems) { if (!g) continue; const G = GEMS[g.type], m = gemMult(g.tier); t[G.stat] = (t[G.stat] || 0) + G.per * m; if (G.stat2) t[G.stat2] = (t[G.stat2] || 0) + G.per2 * m; } }
  const SB = setBonus(S); for (const k in SB.stats) t[k] = (t[k] || 0) + SB.stats[k];
  const base = weapon ? weapon : { kind: 'knife', ilvl: 1, rar: 0, up: 0, stats: { dmg: 1 } };
  const W = WEAPONS[base.kind], wdmg = 11 * W.dmg * (1 + 0.12 * (base.ilvl - 1)) * itemMult(base);
  const perks = [...(base.perks || [])]; if (W.perk && !perks.includes(W.perk)) perks.push(W.perk);
  if (perks.includes('keen')) t.crit += 0.12; if (perks.includes('quick')) t.rate += 0.15; if (perks.includes('heavy')) t.dmg += 0.2; if (perks.includes('pierce')) t.pierce += 2;
  return { hp: 120 + t.hp, armor: t.armor, speed: 135 * (1 + t.speed), crit: t.crit, magnet: 70 * (1 + t.magnet), luck: t.luck, regen: t.regen, dmgPct: 1 + t.dmg + t.power, critDmg: 2.2 + t.critdmg, setSp: SB.sp, pierceBonus: Math.floor(t.pierce + 0.01), ratePct: 1 + t.rate, weaponKind: base.kind, perks, weaponDmg: wdmg, power: Math.round(wdmg * (1 + t.dmg) / W.rate * 0.5 + (120 + t.hp) * 0.2 + t.armor * 2) };
}

// ---------- enemies ----------
// size = drawn height in px; r = hit radius; dmg = contact damage; fx = behaviour tag
export const ENEMIES = {
  ghost: { name: 'Wraith', sprite: 'en_ghost', hp: 22, speed: 62, dmg: 9, r: 15, size: 92, eye: '#cfe8ff', xp: 2, fx: 'ghost' },
  ghoul: { name: 'Ghoul', sprite: 'en_ghoul', hp: 38, speed: 74, dmg: 12, r: 16, size: 88, eye: '#ffd040', xp: 4, fx: 'walk' },
  crow: { name: 'Crow', sprite: 'en_crow', hp: 12, speed: 150, dmg: 7, r: 12, size: 62, eye: '#ff3a3a', xp: 2, fx: 'swoop' },
  child: { name: 'Screamer', sprite: 'en_child', hp: 16, speed: 118, dmg: 8, r: 11, size: 66, eye: '#ff3a3a', xp: 2, fx: 'ghost' },
  brute: { name: 'Butcher', sprite: 'en_brute', hp: 520, speed: 50, dmg: 26, r: 30, size: 150, eye: '#ff3a3a', xp: 30, fx: 'walk', elite: true },
  spitter: { name: 'Plague Spitter', sprite: 'en_spitter', hp: 30, speed: 60, dmg: 8, r: 15, size: 92, xp: 3, fx: 'shooter', shot: { n: 1, spd: 150, dmg: 0.8, cd: 2.4 }, eye: '#7dff6a' },
  hound: { name: 'Ghost Hound', sprite: 'en_hound', hp: 26, speed: 105, dmg: 10, r: 15, size: 62, xp: 2, fx: 'dash', eye: '#ff3a3a' },
  drowned: { name: 'Drowned', sprite: 'en_drowned', hp: 120, speed: 44, dmg: 16, r: 18, size: 100, xp: 6, fx: 'walk', eye: '#9ad0ff' },
  crawler: { name: 'Crawler', sprite: 'en_crawler', hp: 20, speed: 125, dmg: 7, r: 13, size: 60, xp: 2, fx: 'walk', eye: '#ff3a3a' },
  cultist: { name: 'Cultist', sprite: 'en_cultist', hp: 44, speed: 56, dmg: 9, r: 15, size: 94, xp: 4, fx: 'shooter', shot: { n: 3, spd: 170, spread: 0.35, dmg: 0.6, cd: 3 }, eye: '#c27dff' },
  wraithlord: { name: 'Wraith Lord', sprite: 'en_wraithlord', hp: 700, speed: 48, dmg: 24, r: 30, size: 160, xp: 40, fx: 'shooter', hover: true, elite: true, shot: { n: 8, ring: true, spd: 150, dmg: 0.5, cd: 3.6 }, eye: '#9ad0ff' },
  houndmaster: { name: 'The Hound Master', sprite: 'boss_houndmaster', hp: 3300, speed: 58, dmg: 32, r: 44, size: 215, xp: 150, fx: 'boss', boss: true, summon: 'hound', eye: '#ff3a3a' },
  bride: { name: 'The Drowned Bride', sprite: 'boss_bride', hp: 3500, speed: 44, dmg: 32, r: 40, size: 225, xp: 150, fx: 'boss', boss: true, summon: 'drowned', eye: '#9ad0ff' },
  surgeon: { name: 'The Surgeon', sprite: 'boss_surgeon', hp: 3600, speed: 50, dmg: 36, r: 40, size: 225, xp: 150, fx: 'boss', boss: true, summon: 'crawler', eye: '#ff3a3a' },
  boneking: { name: 'The Bone King', sprite: 'boss_boneking', hp: 4200, speed: 42, dmg: 40, r: 46, size: 235, xp: 150, fx: 'boss', boss: true, summon: 'ghoul', eye: '#ffa040' },
  hollowpriest: { name: 'The Hollow Priest', sprite: 'boss_priest', hp: 4600, speed: 40, dmg: 40, r: 44, size: 235, xp: 200, fx: 'boss', boss: true, summon: 'cultist', eye: '#c27dff' },
  revenant: { name: 'The Revenant', sprite: 'en_brute', hp: 1500, speed: 52, dmg: 28, r: 34, size: 175, xp: 80, fx: 'boss', boss: true, eye: '#ff3a3a' },
  gravekeeper: { name: 'The Gravekeeper', sprite: 'boss_gravekeeper', hp: 3800, speed: 42, dmg: 34, r: 42, size: 225, eye: '#6dff6d', xp: 150, fx: 'boss', boss: true },
};

// ---------- districts: each has its own look, monsters and boss; past the sixth they repeat, ever tougher ----------
export const DISTRICTS = [
  { name: 'Graveyard Gate', ground: 'tex_ground', tint: null, boss: 'gravekeeper', elite: 'brute', road: 0.16, puddle: 0.45, tree: 0.18, mix: [['ghost', 40, 0], ['child', 25, 0], ['ghoul', 25, 40], ['crow', 20, 90]] },
  { name: 'Ashen Streets', ground: 'tex_ash', tint: '#6a5a4a', boss: 'houndmaster', elite: 'brute', road: 0.55, puddle: 0.35, tree: 0.06, mix: [['ghoul', 30, 0], ['hound', 30, 15], ['spitter', 20, 50], ['crow', 15, 30], ['ghost', 10, 0]] },
  { name: 'Drowned Chapel', ground: 'tex_flag', tint: '#4d7088', boss: 'bride', elite: 'wraithlord', road: 0.1, puddle: 0.95, tree: 0.12, mix: [['drowned', 30, 0], ['ghost', 30, 0], ['child', 20, 10], ['spitter', 12, 60], ['crow', 10, 40]] },
  { name: 'Hollow Hospital', ground: 'tex_tile', tint: '#5d7a66', boss: 'surgeon', elite: 'brute', road: 0.3, puddle: 0.4, tree: 0.05, mix: [['crawler', 35, 0], ['ghoul', 25, 0], ['spitter', 20, 40], ['child', 10, 0], ['hound', 12, 70]] },
  { name: 'Bone Orchard', ground: 'tex_bone', tint: '#7a6a44', boss: 'boneking', elite: 'brute', road: 0.05, puddle: 0.2, tree: 0.5, mix: [['ghoul', 35, 0], ['hound', 25, 10], ['crawler', 20, 30], ['drowned', 15, 60], ['spitter', 15, 50]] },
  { name: 'Black Cathedral', ground: 'tex_marble', tint: '#5a3d78', boss: 'hollowpriest', elite: 'wraithlord', road: 0.12, puddle: 0.5, tree: 0.1, mix: [['cultist', 30, 0], ['ghost', 25, 0], ['crawler', 15, 20], ['hound', 15, 40], ['drowned', 15, 70]] },
];
DISTRICTS.push(
  { name: 'Rotting Docks', ground: 'tex_docks', tint: '#4a6a6a', boss: 'bride', elite: 'wraithlord', road: 0.3, puddle: 0.85, tree: 0.03, mix: [['drowned', 35, 0], ['crow', 20, 0], ['ghoul', 25, 10], ['spitter', 15, 40], ['crawler', 12, 60]] },
  { name: 'Burned Orphanage', ground: 'tex_scorch', tint: '#8a4a30', boss: 'gravekeeper', elite: 'brute', road: 0.2, puddle: 0.1, tree: 0.08, mix: [['child', 40, 0], ['ghost', 25, 0], ['crawler', 20, 20], ['cultist', 15, 50], ['hound', 12, 60]] },
  { name: 'Sunken Subway', ground: 'tex_concrete', tint: '#3d4a5a', boss: 'surgeon', elite: 'brute', road: 0.7, puddle: 0.7, tree: 0.0, mix: [['crawler', 35, 0], ['hound', 25, 0], ['ghoul', 25, 10], ['drowned', 15, 40], ['spitter', 15, 30]] },
  { name: 'Plague Market', ground: 'tex_cobble', tint: '#6a7a3a', boss: 'houndmaster', elite: 'wraithlord', road: 0.5, puddle: 0.3, tree: 0.04, mix: [['ghoul', 30, 0], ['spitter', 25, 0], ['crow', 20, 10], ['cultist', 20, 30], ['brute', 5, 90]] },
  { name: 'Iron Asylum', ground: 'tex_asylum', tint: '#7a7a86', boss: 'boneking', elite: 'brute', road: 0.25, puddle: 0.2, tree: 0.02, mix: [['cultist', 30, 0], ['crawler', 25, 0], ['ghost', 20, 0], ['hound', 18, 30], ['spitter', 15, 40]] },
  { name: 'Crimson Throne', ground: 'tex_carpet', tint: '#8a2a40', boss: 'hollowpriest', elite: 'wraithlord', road: 0.15, puddle: 0.5, tree: 0.1, mix: [['cultist', 30, 0], ['ghoul', 25, 0], ['hound', 20, 10], ['drowned', 15, 30], ['brute', 8, 60], ['ghost', 15, 0]] },
);
export const districtOf = (d) => DISTRICTS[(d - 1) % DISTRICTS.length];
export const districtName = (d) => d > DISTRICTS.length ? `${districtOf(d).name} ${['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'][Math.min(9, Math.floor((d - 1) / DISTRICTS.length))]}` : districtOf(d).name;
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

// ---------- the haunted church (base v3) ----------
// An endless cutaway: 5 columns wide, as many floors as you like. Rooms are realistic: generators make electricity, pumps/kitchens/workshops use it.
// Water and food are stocks that survivors drink and eat. Survivors arrive at the front door, have skills, and staff rooms to boost them.
export const SKILLS = { elec: 'Electricity', plumb: 'Plumbing', cook: 'Cooking', mech: 'Mechanics', med: 'Medicine', weap: 'Weapons', trade: 'Trading', scout: 'Scouting', faith: 'Faith' };
export const SKILL_KEYS = Object.keys(SKILLS);
export const SKILL_BOOST = 0.05; // each skill point adds 5% to the room it is assigned to
// per level L: pow = electricity (+ makes, - uses), water/food/scrap/gold per hour (+ makes, - uses)
export const ROOMS = {
  gen: { name: 'Generator Room', art: 'gen', skill: 'elec', desc: 'A diesel generator that powers the whole church.', pow: (L) => 18 * Math.pow(L, 1.12), make: {} },
  water: { name: 'Water Room', art: 'water', skill: 'plumb', desc: 'Pumps and filters clean the water.', pow: (L) => -6 * L, make: { water: (L) => 40 * Math.pow(L, 1.1) } },
  kitchen: { name: 'Kitchen', art: 'kitchen', skill: 'cook', desc: 'Cooks meals. Needs electricity and water.', pow: (L) => -4 * L, use: { water: (L) => 4 * L }, make: { food: (L) => 30 * Math.pow(L, 1.1) } },
  workshop: { name: 'Workshop', art: 'workshop', skill: 'mech', desc: 'Turns junk into scrap, and cuts gear upgrade costs.', pow: (L) => -8 * L, make: { scrap: (L) => 7 * Math.pow(L, 1.1) }, bonus: (L, m) => `Gear upgrades -${Math.min(50, Math.round(L * 3 * m))}%` },
  market: { name: 'Trading Post', art: 'market', skill: 'trade', desc: 'Barters with passing travellers for gold.', pow: (L) => -3 * L, make: { gold: (L) => 30 * Math.pow(L, 1.15) } },
  infirmary: { name: 'Infirmary', art: 'infirmary', skill: 'med', desc: 'Keeps you patched up. Needs electricity and water.', pow: (L) => -5 * L, use: { water: (L) => 2 * L }, bonus: (L, m) => `+${(L * 0.3 * m).toFixed(1)} regen/s, +${Math.round(L * 8 * m)} health` },
  armory: { name: 'Armory', art: 'armory', skill: 'weap', desc: 'Maintains weapons. Uses a little scrap.', pow: (L) => -4 * L, use: { scrap: (L) => 1 * L }, bonus: (L, m) => `+${Math.round(L * 4 * m)}% damage` },
  bedroom: { name: 'Bedroom', art: 'bedroom', skill: null, desc: 'Beds for survivors, and rested people learn faster.', pow: (L) => -2 * L, bonus: (L) => `Sleeps ${L * 2} more survivors, +${L * 6}% XP` },
  watch: { name: 'Bell Tower', art: 'tower', skill: 'scout', desc: 'A lookout. Spots loot, and survivors find you sooner.', pow: (L) => -2 * L, bonus: (L, m) => `+${Math.round(L * 4 * m)}% loot luck, +${Math.round(L * 5 * m)}% pickup range, survivors arrive faster` },
  store: { name: 'Storeroom', art: 'store', skill: null, desc: 'Shelves and a cold cellar: stocks hold much more.', pow: (L) => -1 * L, bonus: (L) => `+${L * 250} storage` },
  range: { name: 'Shooting Range', art: 'range', skill: 'weap', desc: 'Target practice. Everyone shoots faster. Uses a little scrap.', pow: (L) => -3 * L, use: { scrap: (L) => 0.5 * L }, bonus: (L, m) => `+${(L * 1.2 * m).toFixed(1)}% fire rate` },
  lab: { name: 'Research Lab', art: 'lab', skill: 'elec', desc: 'Notes and experiments on the dead. You level up faster.', pow: (L) => -7 * L, bonus: (L, m) => `+${(L * 3 * m).toFixed(1)}% XP` },
  garden: { name: 'Greenhouse', art: 'garden', skill: 'cook', desc: 'Grows food under glass. Needs electricity and water.', pow: (L) => -3 * L, use: { water: (L) => 3 * L }, make: { food: (L) => 22 * Math.pow(L, 1.1) } },
  garage: { name: 'Garage', art: 'garage', skill: 'mech', desc: 'A rebuilt truck and bikes. You move faster. Uses a little scrap.', pow: (L) => -4 * L, use: { scrap: (L) => 0.5 * L }, bonus: (L, m) => `+${(L * 1 * m).toFixed(1)}% move speed` },
  vault: { name: 'Vault', art: 'vault', skill: 'trade', desc: 'A locked cellar for loot. Runs bring in more gold.', pow: (L) => -1 * L, bonus: (L, m) => `+${Math.round(L * 4 * m)}% gold from runs` },
  chapel: { name: 'Prayer Hall', art: 'chapel', skill: 'faith', desc: 'Faith makes everyone steadier in the dark.', pow: (L) => -2 * L, bonus: (L, m) => `+${(L * 1.5 * m).toFixed(1)}% crit chance` },
};
export const ROOM_ORDER = Object.keys(ROOMS);
export const COLS = 5;
export const slotKey = (f, c) => `f${f}c${c}`;
export const parseKey = (k) => { const m = /^f(\d+)c(\d+)$/.exec(k); return m ? { f: +m[1], c: +m[2] } : null; };
export const staffSlots = (L) => 1 + Math.floor(L / 4);
export const roomsOfType = (S, type) => Object.entries(S.base.rooms).filter(([, r]) => r.type === type && r.lvl > 0);
export const topFloor = (S) => Object.keys(S.base.rooms).reduce((m, k) => Math.max(m, parseKey(k).f), 0);
export function openSlots(S) {
  const built = (f, c) => { const r = S.base.rooms[slotKey(f, c)]; return r && r.lvl > 0; }, out = [], F = topFloor(S) + 1;
  for (let f = 0; f <= F; f++) for (let c = 0; c < COLS; c++) { const k = slotKey(f, c); if (S.base.rooms[k]) continue; if (built(f, c - 1) || built(f, c + 1) || (f > 0 && built(f - 1, c))) out.push(k); }
  return out;
}
export const newRoomCost = (S) => { const n = Object.keys(S.base.rooms).length; return { gold: Math.round(90 * Math.pow(1.38, n - 1)), scrap: Math.round(6 * Math.pow(1.3, n - 1)), secs: Math.min(43200, Math.round(30 * Math.pow(1.45, n - 1))) }; };
export const upgradeCost = (lvl) => ({ gold: Math.round(50 * Math.pow(1.6, lvl)), scrap: Math.round(4 * Math.pow(1.5, lvl)) });
export const upgradeSecs = (lvl) => Math.min(43200, Math.round(20 * Math.pow(1.5, lvl)));

// ----- builders: how many rooms can be built or upgraded at the same time (more will be a purchase later; all 5 are free for now) -----
export const BUILDERS_MAX = 5;
export const builderCount = (S) => Math.min(BUILDERS_MAX, S.base.builders == null ? BUILDERS_MAX : S.base.builders);
export const buildOf = (S, key) => S.base.builds.find((b) => b.key === key) || null;
// ----- survivors -----
const FIRST = { f: ['Mara', 'Jess', 'Ivy', 'Nora', 'Tess', 'Lena', 'Rosa', 'June', 'Cora', 'Hana', 'Beth', 'Maya', 'Dana', 'Vera', 'Elsa', 'Gwen'], m: ['Jack', 'Sam', 'Eli', 'Owen', 'Ray', 'Hank', 'Leo', 'Cole', 'Abe', 'Finn', 'Gus', 'Nate', 'Otis', 'Walt', 'Ned', 'Moe'] };
const LAST = ['Reyes', 'Cole', 'Marsh', 'Boone', 'Hale', 'Quinn', 'Voss', 'Pike', 'Frost', 'Wren', 'Doyle', 'Stone', 'Cruz', 'Park', 'Lund', 'Ash'];
const JOB_OF = { elec: 'Electrician', plumb: 'Plumber', cook: 'Cook', mech: 'Mechanic', med: 'Nurse', weap: 'Hunter', trade: 'Shopkeeper', scout: 'Scavenger', faith: 'Priest' };
export const jobOf = (sv) => JOB_OF[sv.main];
export function makeSurvivor(S) {
  const g = Math.random() < 0.5 ? 'f' : 'm', main = pick(SKILL_KEYS), skills = {};
  for (const k of SKILL_KEYS) skills[k] = rint(0, 2);
  skills[main] = Math.min(10, 4 + rint(0, 3) + (Math.random() < 0.3 ? rint(1, 3) : 0));
  const second = pick(SKILL_KEYS.filter((k) => k !== main)); skills[second] = rint(3, 6);
  const id = S.nextId++;
  return { id, name: `${pick(FIRST[g])} ${pick(LAST)}`, g, main, v: rint(1, 2), skills, room: null, born: Date.now() };
}
export const survivorById = (S, id) => S.base.survivors.find((x) => x.id === id);
export const beds = (S) => 2 + roomsOfType(S, 'bedroom').reduce((n, [, r]) => n + r.lvl * 2, 0);
export const staffOf = (S, key) => S.base.survivors.filter((x) => x.room === key);
export function assign(S, svId, key) { const sv = survivorById(S, svId); if (!sv) return 'bad'; if (!key) { sv.room = null; return 'ok'; } const r = S.base.rooms[key]; if (!r || r.lvl < 1 || !ROOMS[r.type].skill) return 'bad'; if (sv.room !== key && staffOf(S, key).length >= staffSlots(r.lvl)) return 'full'; sv.room = key; return 'ok'; }
export function recruit(S, idx) {
  if (S.base.survivors.length >= beds(S)) return 'nobeds'; const sv = S.base.door[idx]; if (!sv) return 'bad'; S.base.door.splice(idx, 1); S.base.survivors.push(sv);
  // put them to work where their best skill matters most
  let best = null, bs = 0; for (const [k, r] of Object.entries(S.base.rooms)) { if (r.lvl < 1 || !ROOMS[r.type].skill || staffOf(S, k).length >= staffSlots(r.lvl)) continue; const v = sv.skills[ROOMS[r.type].skill]; if (v > bs) { bs = v; best = k; } }
  if (best && bs >= 3) sv.room = best; return 'ok';
}
export const arrivalMins = (S) => 45 / (1 + 0.18 * roomsOfType(S, 'watch').reduce((n, [, r]) => n + r.lvl, 0));

// ----- the simulation: power is a flow, water/food/scrap/gold are stocks -----
export function capacity(S) { return 300 + roomsOfType(S, 'store').reduce((n, [, r]) => n + r.lvl * 250, 0); }
export function flows(S) {
  const rooms = S.base.rooms, res = S.base.res, pop = S.base.survivors.length, out = { rooms: {}, supply: 0, demand: 0, rate: { water: -0.8 * pop, food: -0.8 * pop, scrap: 0, gold: 0 }, powerEff: 1, hungry: false, thirsty: false };
  const boost = (k, R) => { if (!R.skill) return 0; let b = 0; for (const sv of staffOf(S, k)) b += sv.skills[R.skill] * SKILL_BOOST; return Math.min(2, b); };
  for (const [k, r] of Object.entries(rooms)) { if (r.lvl < 1) continue; const R = ROOMS[r.type], b = boost(k, R), p = R.pow(r.lvl); out.rooms[k] = { boost: b, eff: 1 }; if (p > 0) out.supply += p * (1 + b) * (r.haunted ? 0.4 : 1); else out.demand += -p; }
  out.powerEff = out.demand > 0 ? Math.min(1, out.supply / out.demand) : 1;
  out.thirsty = res.water <= 0 && pop > 0; out.hungry = res.food <= 0 && pop > 0;
  const morale = (out.thirsty ? 0.7 : 1) * (out.hungry ? 0.7 : 1);
  for (const [k, r] of Object.entries(rooms)) {
    if (r.lvl < 1) continue; const R = ROOMS[r.type], o = out.rooms[k]; let eff = R.pow(r.lvl) > 0 ? 1 : out.powerEff;
    if (r.haunted) eff *= 0.4;
    if (R.use) for (const [res2, f] of Object.entries(R.use)) if (res2 !== 'scrap' && res[res2] <= 0) eff *= 0.3; else if (res2 === 'scrap' && S.scrap <= 0) eff *= 0.3;
    eff *= morale; o.eff = eff;
    if (R.make) for (const [res2, f] of Object.entries(R.make)) out.rate[res2] += f(r.lvl) * (1 + o.boost) * eff;
    if (R.use) for (const [res2, f] of Object.entries(R.use)) out.rate[res2] -= f(r.lvl) * eff;
  }
  return out;
}
// ----- haunted nights: ghosts besiege the church every few hours -----
export const hauntStrength = (S) => { const rs = Object.values(S.base.rooms).filter((r) => r.lvl > 0); return Math.round(60 + 10 * rs.length + 4 * rs.reduce((n, r) => n + r.lvl, 0) + 8 * Math.max(0, S.maxDistrict - 1)); };
export function defense(S) {
  const F = flows(S); let d = 0;
  for (const [k, r] of Object.entries(S.base.rooms)) { if (r.lvl < 1) continue; const m = roomMult(S, k, F); if (r.type === 'armory') d += r.lvl * 10 * m; else if (r.type === 'watch') d += r.lvl * 6 * m; else if (r.type === 'chapel') d += r.lvl * 5 * m; }
  for (const sv of S.base.survivors) { const guard = sv.room && ['armory', 'watch', 'chapel'].includes(S.base.rooms[sv.room] && S.base.rooms[sv.room].type); d += sv.skills.weap * (guard ? 5 : 2); }
  return Math.round(d + heroStats(S).power * 0.4);
}
export const cleanseCost = (S, key) => ({ scrap: 6 + 3 * S.base.rooms[key].lvl });
export function cleanse(S, key) { const r = S.base.rooms[key]; if (!r || !r.haunted) return 'bad'; const c = cleanseCost(S, key); if ((S.scrap || 0) < c.scrap) return 'poor'; S.scrap -= c.scrap; delete r.haunted; return 'ok'; }
// outcome: win = the church held. Returns what happened, for the message.
export function resolveHaunt(S, won, byHand) {
  const B = S.base, H = B.haunt, st = H.active ? H.active.strength : hauntStrength(S), rep = { won, strength: st, byHand, gold: 0, scrap: 0, haunted: [], lost: 0, survivor: false };
  if (won) { rep.gold = Math.round(st * 2.2 * (byHand ? 1.5 : 1)); rep.scrap = Math.round(st / 7 * (byHand ? 1.5 : 1)); S.gold += rep.gold; S.scrap = (S.scrap || 0) + rep.scrap; if (Math.random() < (byHand ? 0.6 : 0.35) && B.door.length < 3) { B.door.push(makeSurvivor(S)); rep.survivor = true; } }
  else {
    const pool = Object.entries(B.rooms).filter(([, r]) => r.lvl > 0 && !r.haunted); for (let i = 0; i < (byHand ? 1 : 2) && pool.length; i++) { const j = Math.floor(Math.random() * pool.length), [k, r] = pool.splice(j, 1)[0]; r.haunted = true; rep.haunted.push(ROOMS[r.type].name); }
    rep.lost = 25; B.res.water *= 0.75; B.res.food *= 0.75;
  }
  H.active = null; H.next = Date.now() + (5 + Math.random() * 4) * 3600000; return rep;
}
export function tickHaunt(S, now = Date.now()) {
  const B = S.base; if (!B.haunt) B.haunt = { next: now + 45 * 60000, active: null };
  const H = B.haunt, free = !B.survivors.length && Object.keys(B.rooms).length < 2; // brand-new churches get a quiet start
  if (!H.active && now >= H.next && !free) H.active = { strength: hauntStrength(S), start: now, end: now + 3 * 3600000 };
  if (H.active && now >= H.active.end) { const win = defense(S) * (0.85 + Math.random() * 0.3) >= H.active.strength; return resolveHaunt(S, win, false); }
  return null;
}
export const roomMult = (S, key, f) => { const o = (f || flows(S)).rooms[key]; return o ? o.eff * (1 + Math.min(1, o.boost)) : 0; };
export function baseBonus(S) {
  const F = flows(S), sum = (type, fn) => roomsOfType(S, type).reduce((n, [k, r]) => n + fn(r.lvl) * roomMult(S, k, F), 0);
  const lv = (type) => roomsOfType(S, type).reduce((n, [, r]) => n + r.lvl, 0);
  return { dmg: sum('armory', (L) => L * 0.04), hp: sum('infirmary', (L) => L * 8), regen: sum('infirmary', (L) => L * 0.3), luck: sum('watch', (L) => L * 0.04), magnet: sum('watch', (L) => L * 0.05), crit: sum('chapel', (L) => L * 0.015), xp: lv('bedroom') * 0.06 + sum('lab', (L) => L * 0.03), rate: sum('range', (L) => L * 0.012), speed: sum('garage', (L) => L * 0.01), gold: sum('vault', (L) => L * 0.04), disc: Math.min(0.5, sum('workshop', (L) => L * 0.03)) };
}
const STEP = 300; // seconds per simulation step
export function tickBase(S, now = Date.now()) {
  const B = S.base; let done = null;
  // finish builds
  for (const b of B.builds.slice()) if (now >= b.end) { const r = B.rooms[b.key]; if (b.kind === 'new') { r.lvl = 1; delete r.building; } else r.lvl++; done = b.key; B.builds.splice(B.builds.indexOf(b), 1); }
  // simulate resources
  let dt = Math.min(8 * 3600, (now - B.last) / 1000); B.last = now;
  while (dt > 0.5) {
    const st = Math.min(STEP, dt), F = flows(S), cap = capacity(S);
    for (const k of ['water', 'food']) B.res[k] = Math.max(0, Math.min(cap, B.res[k] + F.rate[k] * st / 3600));
    S.scrap = Math.max(0, Math.min(cap * 4, (S.scrap || 0) + F.rate.scrap * st / 3600)); S.gold += F.rate.gold * st / 3600;
    dt -= st;
  }
  // arrivals at the front door
  while (now >= B.nextArrival && B.door.length < 3) { B.door.push(makeSurvivor(S)); B.nextArrival += arrivalMins(S) * 60000 * (0.7 + Math.random() * 0.6); }
  if (B.door.length >= 3) B.nextArrival = Math.max(B.nextArrival, now);
  return done;
}
export function startBuild(S, key, type) {
  if (S.base.builds.length >= builderCount(S)) return 'busy'; if (S.base.rooms[key] || !ROOMS[type]) return 'bad'; const c = newRoomCost(S);
  if (S.gold < c.gold || (S.scrap || 0) < c.scrap) return 'poor'; S.gold -= c.gold; S.scrap -= c.scrap;
  S.base.rooms[key] = { type, lvl: 0, building: true }; S.base.builds.push({ key, kind: 'new', end: Date.now() + c.secs * 1000 }); return 'ok';
}
export function startUpgrade(S, key) {
  const r = S.base.rooms[key]; if (S.base.builds.length >= builderCount(S) || !r || buildOf(S, key)) return 'busy'; const c = upgradeCost(r.lvl);
  if (S.gold < c.gold || (S.scrap || 0) < c.scrap) return 'poor'; S.gold -= c.gold; S.scrap -= c.scrap; S.base.builds.push({ key, kind: 'up', end: Date.now() + upgradeSecs(r.lvl) * 1000 }); return 'ok';
}
const OLD_MAP = { watch: 'watch', gen: 'gen', workshop: 'workshop', kitchen: 'kitchen', bedroom: 'bedroom', armory: 'armory', infirmary: 'infirmary', store: 'store', chapel: 'chapel' };
function fixBase(S) {
  if (!S.gems) S.gems = []; if (!S.squad) S.squad = [];
  const had = !!S.base; if (typeof S.scrap !== 'number') S.scrap = 0;
  if (S.base && S.base.v === 3 && !S.base.builds) { S.base.builds = S.base.build ? [S.base.build] : []; delete S.base.build; }
  if (!S.base || S.base.v !== 3) {
    const old = S.base && S.base.v === 2 ? S.base.rooms : {}, rooms = {};
    for (const k of Object.keys(old)) { const o = old[k]; if (o.lvl > 0 && OLD_MAP[o.type]) rooms[k] = { type: OLD_MAP[o.type], lvl: o.lvl }; }
    if (!Object.keys(rooms).length) rooms.f0c2 = { type: 'gen', lvl: 1 };
    // a new church always has a power source and a pump so the chain makes sense
    S.base = { v: 3, haunt: null, rooms, builds: [], res: { water: 120, food: 120 }, last: Date.now(), survivors: [], door: [], nextArrival: Date.now() + 45000 };
    if (!had) S.scrap += 30;
  }
  return S;
}
// ---------- save ----------
const KEY = 'hauntfall_v1';
export function newSave() {
  const S = { v: 1, nextId: 1, gems: [], squad: [], scrap: 0, base: null, gold: 0, bag: [], gear: {}, best: 0, runs: 0, wins: 0, district: 1, maxDistrict: 1, lastSeen: Date.now(), hero: 'f', opts: { afk: false, sound: true } };
  S.gear.weapon = makeItem(S, 1, 0, 'weapon', 'knife'); S.gear.weapon.name = 'Rusty Kitchen Knife';
  return fixBase(S);
}
// older items may carry bonuses their slot should not have: swap them for allowed ones of similar strength
function fixItem(it) {
  if (it && it.slot === 'weapon' && it.perks === undefined && WEAPONS[it.kind]) it.perks = rollPerks(it.rar, WEAPONS[it.kind].perk);
  if (it && it.sockets === undefined) { it.sockets = it.rar >= 2 ? it.rar - 1 : 0; it.gems = []; }
  if (!it || !it.stats) return; const ok = SLOT_AFFIXES[it.slot]; if (!ok) return; const primary = PRIMARY[it.slot][0];
  for (const k of Object.keys(it.stats)) {
    if (k === primary || ok.includes(k)) continue;
    delete it.stats[k]; const opts = ok.filter((n) => !(n in it.stats) && n !== primary); if (opts.length) { const n = pick(opts); it.stats[n] = rollAffix(it.slot, n, it.ilvl); }
  }
}
export function loadSave() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) { (s.bag || []).forEach(fixItem); Object.values(s.gear || {}).forEach(fixItem); return fixBase(s); } } catch (e) { } return null; }
export function writeSave(S) { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
export const IDLE_CAP_MIN = 480;
export function idlePreview(S) { const mins = Math.min(IDLE_CAP_MIN, (Date.now() - S.lastSeen) / 60000); const rate = 4 + 3 * S.maxDistrict + S.best * 0.4; return { mins, gold: Math.floor(mins * rate), gear: Math.min(6, Math.floor(mins / 45)) }; }
export function autoEquip(S) { let n = 0; for (const slot of SLOTS) { let best = S.gear[slot], bs = itemScore(best); for (const it of S.bag) if (it.slot === slot) { const sc = itemScore(it); if (sc > bs + 0.01) { best = it; bs = sc; } } if (best !== S.gear[slot]) { S.bag.splice(S.bag.indexOf(best), 1); if (S.gear[slot]) S.bag.push(S.gear[slot]); S.gear[slot] = best; n++; } } return n; }
