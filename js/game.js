// A single Hauntfall run: movement, auto-weapons, swarm, loot, level-ups, boss. Drawn on a canvas, HUD lives in the DOM (ui.js).
import { rnd, rint, pick, clamp, districtOf, makeGem, GEMS, ENEMIES, WEAPONS, UPGRADES, RARITIES, heroStats, makeItem, baseBonus } from './data.js';
import { spr, sprite, flashOf, flipped, glow, SHADOW, GEM, GOLD, KNIFE, AXE, HOLE, CONE, SPLAT, LEAF, FOG, FLARE, gemSprite, PUDDLE, TUFT, PATCH, frames, FRAME_PAD, TEX } from './art.js';
const isGun = (s) => s === 'bullet' || s === 'flame' || s === 'grenade';
const WEAPON_LEN = { katana: 30, sledge: 30, crossbow: 26, nailgun: 18, chainsaw: 26, flame: 30, grenade: 34, sniper: 44, minigun: 34, knife: 14, machete: 26, axe: 22, bat: 28, crowbar: 26, pistol: 16, revolver: 18, smg: 24, shotgun: 32, rifle: 38 };
const PROP_H = { prop_tree: 230, prop_car: 130, prop_lamp: 150, prop_tomb3: 100, prop_fence: 70, prop_bush: 60, prop_pumpkin: 40, prop_tomb1: 74, prop_tomb2: 74 };

const RUN_LEN = 300;               // seconds until the boss
const CELL = 90;                   // collision grid
const TAU = Math.PI * 2;
let AC = null;
export function sfx(kind, on = true) {
  if (!on) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const P = { shoot: [520, 220, 0.06, 'square', 0.025], slash: [300, 80, 0.12, 'sawtooth', 0.04], hit: [200, 70, 0.07, 'sawtooth', 0.05], kill: [140, 40, 0.14, 'triangle', 0.05], gem: [900, 1500, 0.07, 'sine', 0.035],
      loot: [500, 1000, 0.2, 'triangle', 0.07], hurt: [110, 50, 0.16, 'square', 0.09], level: [440, 900, 0.5, 'triangle', 0.1], boom: [90, 28, 0.5, 'sawtooth', 0.12], coin: [1200, 1700, 0.06, 'square', 0.03] }[kind];
    if (!P) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
    o.type = P[3]; o.frequency.setValueAtTime(P[0], t); o.frequency.exponentialRampToValueAtTime(Math.max(20, P[1]), t + P[2]); g.gain.setValueAtTime(P[4], t); g.gain.exponentialRampToValueAtTime(0.001, t + P[2]);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + P[2] + 0.02);
  } catch (e) { }
}

export class Run {
  constructor(S, canvas, ui, opts = {}) {
    this.theme = districtOf(S.district); this.mode = opts.mode || 'run'; this.runLen = this.mode === 'haunt' ? 100 : RUN_LEN * (S.opts.speed == null ? 0.75 : S.opts.speed); this.hauntScale = this.mode === 'haunt' ? 1 + (opts.strength || 100) / 220 : 1;
    this.S = S; this.cv = canvas; this.x = canvas.getContext('2d'); this.ui = ui; this.afk = !!opts.afk; this.sound = S.opts.sound !== false;
    this.hs = heroStats(S); this.perkSet = new Set(this.hs.perks || []); this.wRate = WEAPONS[this.hs.weaponKind].rate; this.district = S.district;
    this.scrap = 0; this.xpMul = 1 + baseBonus(S).xp; this.t = 0; this.over = false; this.paused = false; this.shake = 0; this.kills = 0; this.gold = 0; this.xp = 0; this.level = 1; this.xpNeed = this.needFor(1);
    this.hero = { x: 0, y: 0, hp: this.hs.hp, face: 1, inv: 0, flash: 0, vx: 0, vy: 0, aim: 0, bob: 0 };
    this.maxHp = this.hs.hp; this.dmgMul = 1; this.rateMul = 1; this.extraN = 0; this.extraPierce = 0; this.speedMul = 1; this.magnetMul = 1; this.regen = this.hs.regen; this.crit = this.hs.crit; this.luckMul = 1;
    this.salt = 0; this.beam = 0; this.fire = 0; this.picked = {}; this.goldMul = 1 + (baseBonus(S).gold || 0); this.dmgTaken = 1; this.turrets = [];
    { const sp = this.hs.setSp; if (sp) { this.extraN += sp.extraN; this.salt = Math.max(this.salt, sp.salt); this.beam = Math.max(this.beam, sp.beam); this.fire = Math.max(this.fire, sp.fire); this.xpMul += sp.xp; } this.setTaken = sp ? sp.taken : 1; }
    // survivors who came along: each fights in their own way, scaled by their main skill
    this.crew = (S.squad || []).map((id) => S.base.survivors.find((x) => x.id === id)).filter(Boolean).slice(0, 2).map((sv, i) => ({ sv, role: sv.main, sk: sv.skills[sv.main], x: i ? 34 : -34, y: 10 + i * 8, cd: rnd(1, 3), cd2: 6, face: 1, bob: rnd(0, 6), moving: false, age: 0 }));
    for (const c of this.crew) { if (c.role === 'scout') { this.magnetMul *= 1 + 0.03 * c.sk; this.luckMul *= 1 + 0.02 * c.sk; } else if (c.role === 'cook') this.regen += 0.25 * c.sk; else if (c.role === 'trade') this.goldMul *= 1 + 0.04 * c.sk; else if (c.role === 'faith') this.dmgTaken *= Math.max(0.7, 1 - 0.03 * c.sk); }
    this.decals = []; this.corpses = []; this.hitstop = 0; this.fogT = 0; this.punch = 0; this.enemies = []; this.bullets = []; this.gems = []; this.loot = []; this.fx = []; this.texts = []; this.ebul = []; this.zones = []; this.drops = [];
    this.cool = 0; this.spawnAcc = 0; this.nextEvent = 40; this.bloodUntil = 0; this.nextElite = 28; this.nextWave = 30; this.wave = 0; this.bossOut = false; this.boss = null; this.won = false; this.lootItems = []; this.lootGems = []; this.waveTick = 0;
    this.input = { x: 0, y: 0 }; this.keys = {}; this.joy = null; this.sw = 0; this.sh = 0; this.scale = 1; this.cam = { x: 0, y: 0 };
    this.light = document.createElement('canvas'); this.lx = this.light.getContext('2d');
    this.q = 0; this.props = new Map(); this.saltAng = 0; this.beamT = 0; this.fireT = 2; this.tickMap = new WeakMap();
    this.bind(); this.resize();
  }
  needFor(l) { return Math.round(4 + l * 3 + l * l * 0.5); }
  luck() { return (1 + this.hs.luck) * this.luckMul; }
  // ---------- input ----------
  bind() {
    this.kd = (e) => { this.keys[e.code] = true; if (e.code === 'KeyF') this.ui.toggleAfk(); };
    this.ku = (e) => { this.keys[e.code] = false; };
    this.pd = (e) => { if (this.paused || e.target.closest('button')) return; if (!this.joy) { this.joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, dx: 0, dy: 0 }; this.ui.joyShow(e.clientX, e.clientY); this.cv.setPointerCapture(e.pointerId); } };
    this.pm = (e) => { const j = this.joy; if (!j || e.pointerId !== j.id) return; const dx = e.clientX - j.ox, dy = e.clientY - j.oy, L = Math.hypot(dx, dy), m = Math.min(L, 46); j.dx = L ? dx / L * m / 46 : 0; j.dy = L ? dy / L * m / 46 : 0; this.ui.joyMove(j.dx, j.dy); };
    this.pu = (e) => { if (this.joy && e.pointerId === this.joy.id) { this.joy = null; this.ui.joyHide(); } };
    addEventListener('keydown', this.kd); addEventListener('keyup', this.ku); this.cv.addEventListener('pointerdown', this.pd); this.cv.addEventListener('pointermove', this.pm); this.cv.addEventListener('pointerup', this.pu); this.cv.addEventListener('pointercancel', this.pu);
    this.rs = () => this.resize(); addEventListener('resize', this.rs);
  }
  destroy() { removeEventListener('keydown', this.kd); removeEventListener('keyup', this.ku); removeEventListener('resize', this.rs); this.cv.removeEventListener('pointerdown', this.pd); this.cv.removeEventListener('pointermove', this.pm); this.cv.removeEventListener('pointerup', this.pu); this.cv.removeEventListener('pointercancel', this.pu); }
  resize() {
    const coarse = matchMedia('(pointer: coarse)').matches, cap = this.q >= 2 ? 0.8 : this.q >= 1 ? 1 : (coarse ? 1.25 : 1.75), dpr = Math.min(devicePixelRatio || 1, cap), W = innerWidth, H = innerHeight;
    this.cv.width = Math.round(W * dpr); this.cv.height = Math.round(H * dpr); this.cv.style.width = W + 'px'; this.cv.style.height = H + 'px';
    this.dpr = dpr; this.sw = W; this.sh = H; this.scale = Math.min(W, H) / 560; // portrait and landscape both show about 640 px across the short side
    const lk = this.q >= 1 ? 0.25 : 0.33; this.light.width = Math.max(2, Math.round(W * lk)); this.light.height = Math.max(2, Math.round(H * lk)); this.pat = null;
  }
  setQuality(q) { if (q === this.q) return; this.q = q; this.resize(); }
  // ---------- main update ----------
  update(dt) {
    if (this.paused || this.over) return;
    if (this.hitstop > 0) { this.hitstop -= dt; dt *= 0.12; }
    this.t += dt; this.frame = (this.frame || 0) + 1; const h = this.hero;
    // movement
    let ix = 0, iy = 0;
    if (this.keys.KeyA || this.keys.ArrowLeft) ix -= 1; if (this.keys.KeyD || this.keys.ArrowRight) ix += 1; if (this.keys.KeyW || this.keys.ArrowUp) iy -= 1; if (this.keys.KeyS || this.keys.ArrowDown) iy += 1;
    if (this.joy) { ix = this.joy.dx; iy = this.joy.dy; }
    const manual = Math.hypot(ix, iy) > 0.12;
    if (this.afk && !manual) { const a = this.afkSteer(); ix = a.x; iy = a.y; }
    const L = Math.hypot(ix, iy); if (L > 1) { ix /= L; iy /= L; }
    const sp = this.hs.speed * this.speedMul; h.x += ix * sp * dt; h.y += iy * sp * dt; h.moving = L > 0.1; if (h.moving && this.q < 2 && (this.frame % 7) === 0 && this.fx.length < 260) this.fx.push({ k: 'p', x: h.x + rnd(-6, 6), y: h.y - 2, vx: rnd(-14, 14), vy: rnd(-16, -4), t: 0, life: 0.45, col: '#4a4a44', r: 3 }); if (Math.abs(ix) > 0.1) h.face = ix > 0 ? 1 : -1; h.bob += dt * (L > 0.1 ? 12 : 3);
    h.inv = Math.max(0, h.inv - dt); h.flash = Math.max(0, h.flash - dt); h.fire = Math.max(0, (h.fire || 0) - dt); h.recoil = (h.recoil || 0) * Math.pow(0.001, dt); this.punch = Math.max(0, this.punch - dt * 2.2); this.fogT += dt;
    for (const c of this.corpses) c.t += dt; if (this.corpses.length && this.corpses[0].t > this.corpses[0].life) this.corpses.shift();
    for (const d of this.decals) d.t += dt; if (this.decals.length && this.decals[0].t > this.decals[0].life) this.decals.shift();
    if (this.regen > 0) h.hp = Math.min(this.maxHp, h.hp + this.regen * dt);
    // director
    this.direct(dt);
    this.buildGrid();
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updatePassives(dt); this.updateCrew(dt);
    this.updatePickups(dt);
    this.updateFx(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.5);
    this.cam.x += (h.x - this.cam.x) * Math.min(1, dt * 9); this.cam.y += (h.y - this.cam.y) * Math.min(1, dt * 9);
    if (h.hp <= 0) this.end(false);
    this.ui.hud(this);
  }
  // ---------- AFK brain ----------
  afkSteer() {
    const h = this.hero; let fx = 0, fy = 0, near = 0;
    for (const e of this.enemies) { const dx = h.x - e.x, dy = h.y - e.y, d2 = dx * dx + dy * dy, R = 200 + e.r; if (d2 < R * R && d2 > 1) { const d = Math.sqrt(d2), w = (1 - d / R) * (e.def.elite || e.def.boss ? 2.4 : 1); fx += dx / d * w; fy += dy / d * w; near++; } }
    for (const b of this.ebul) { const dx = h.x - b.x, dy = h.y - b.y, d = Math.hypot(dx, dy); if (d < 110 && d > 1) { fx += dx / d * 1.5; fy += dy / d * 1.5; } }
    // want: loot first, then gems; the boss time: stay out in the open
    let t = null, bd = 520 * 520; for (const l of this.loot) { const d2 = (l.x - h.x) ** 2 + (l.y - h.y) ** 2; if (d2 < bd) { bd = d2; t = l; } }
    if (!t) for (const g of this.gems) { const d2 = (g.x - h.x) ** 2 + (g.y - h.y) ** 2; if (d2 < bd) { bd = d2; t = g; } }
    let tx = 0, ty = 0; if (t) { const d = Math.hypot(t.x - h.x, t.y - h.y) || 1; tx = (t.x - h.x) / d; ty = (t.y - h.y) / d; }
    const wander = near ? 0 : 1; // with nothing near, circle slowly so new enemies come to us
    const ang = this.t * 0.4; tx += Math.cos(ang) * 0.4 * wander; ty += Math.sin(ang) * 0.4 * wander;
    // a little tangent push to avoid being cornered
    const px = -fy * 0.35, py = fx * 0.35;
    return { x: fx * 1.7 + px + tx * (near > 6 ? 0.4 : 1), y: fy * 1.7 + py + ty * (near > 6 ? 0.4 : 1) };
  }
  // ---------- spawning ----------
  direct(dt) {
    const t = this.t, dm = 1 + 0.16 * (this.district - 1);
    if (t >= this.runLen && !this.bossOut) { this.spawnBoss(); }
    if (!this.bossOut) {
      const rate = (1.2 + t / 36) * (1 + 0.5 * (this.district - 1)) * (t < this.bloodUntil ? 2.2 : 1); this.spawnAcc += rate * dt;
      const cap = 90 + Math.min(150, t * 0.55);
      while (this.spawnAcc >= 1 && this.enemies.length < cap) { this.spawnAcc -= 1; this.spawnOne(); }
      if (this.spawnAcc > 3) this.spawnAcc = 3;
      if (t >= this.nextElite && this.nextElite < this.runLen - 10) { const n = 1 + Math.floor(t / 110) + Math.floor((this.district - 1) / 3); for (let i = 0; i < n; i++) this.spawnOne(Math.random() < 0.25 ? (this.theme.elite === 'brute' ? 'wraithlord' : 'brute') : this.theme.elite); this.nextElite += 32; this.ui.toast(n > 1 ? `${n} elites are hunting you!` : `${ENEMIES[this.theme.elite].name} is hunting you!`); sfx('boom', this.sound); this.shake = 0.5; }
      if (t >= this.nextEvent && this.nextEvent < this.runLen - 12) { this.nextEvent += rnd(34, 46); this.event(pick(['crate', 'crate', 'blood', 'hunter'])); }
      if (t >= this.nextWave && this.nextWave < this.runLen - 8) { this.wave++; this.nextWave += 38; const n = 16 + this.wave * 5 + (this.district - 1) * 4, a0 = rnd(0, TAU); for (let i = 0; i < n; i++) { const e = this.spawnOne(); const a = a0 + (i / n) * TAU, R = Math.hypot(this.sw, this.sh) / 2 / this.scale + 60; e.x = this.hero.x + Math.cos(a) * R; e.y = this.hero.y + Math.sin(a) * R; } if (this.ui.banner) this.ui.banner(`Wave ${this.wave}`, 'They surround you'); sfx('boom', this.sound); this.shake = 0.4; }
    }
  }
  event(kind) {
    const h = this.hero, t = this.t;
    if (kind === 'crate') { const a = rnd(0, TAU), R = rnd(260, 380); this.loot.push({ kind: 'crate', x: h.x + Math.cos(a) * R, y: h.y + Math.sin(a) * R, t: 0, stay: true }); this.ui.toast('A supply crate dropped nearby!'); if (this.ui.banner) this.ui.banner('Supply crate', 'Grab it before the dead do'); sfx('boom', this.sound); }
    else if (kind === 'blood') { this.bloodUntil = t + 14; if (this.ui.banner) this.ui.banner('Blood Moon', 'The dead swarm for 14 seconds'); sfx('boom', this.sound); this.shake = 0.5; }
    else { const e = this.spawnOne(Math.random() < 0.5 ? 'brute' : 'wraithlord'); e.hp *= 3.5; e.maxHp = e.hp; e.dmg *= 1.15; e.mini = true; if (this.ui.banner) this.ui.banner('Hunter', 'Kill it for a big reward'); this.ui.toast('A hunter stalks you!'); sfx('boom', this.sound); this.shake = 0.6; }
  }
  spawnPos() { const a = rnd(0, TAU), R = Math.hypot(this.sw, this.sh) / 2 / this.scale + 70; return [this.hero.x + Math.cos(a) * R, this.hero.y + Math.sin(a) * R]; }
  spawnOne(type) {
    const t = this.t;
    if (!type) { const tab = this.theme.mix.filter((m) => t >= m[2]); let tot = 0; for (const m of tab) tot += m[1]; let r = Math.random() * tot; type = tab[0][0]; for (const m of tab) { if (r < m[1]) { type = m[0]; break; } r -= m[1]; } }
    const def = ENEMIES[type], [x, y] = this.spawnPos(), sc = (1 + t / 100) * Math.pow(2.15, this.district - 1) * this.hauntScale;
    this.enemies.push({ def, x, y, hp: def.hp * sc, maxHp: def.hp * sc, dmg: def.dmg * (1 + t / 190) * Math.pow(1.5, this.district - 1) * 1.2, r: def.r, vx: 0, vy: 0, flash: 0, ph: rnd(0, TAU), v: rint(1, 2), dash: rnd(1, 3), age: 0, face: 1, cd: rnd(2, 4) });
    return this.enemies[this.enemies.length - 1];
  }
  spawnBoss() {
    this.bossOut = true; for (const e of this.enemies) if (!e.def.boss) e.hp = Math.min(e.hp, 1);
    const def = this.mode === 'haunt' ? ENEMIES.revenant : ENEMIES[this.theme.boss], sc = Math.pow(2.4, this.district - 1) * (this.mode === 'haunt' ? this.hauntScale : 1), a = rnd(0, TAU), R = 460;
    const b = { def, x: this.hero.x + Math.cos(a) * R, y: this.hero.y + Math.sin(a) * R, hp: def.hp * sc, maxHp: def.hp * sc, dmg: def.dmg * Math.pow(1.4, this.district - 1), r: def.r, vx: 0, vy: 0, flash: 0, ph: 0, v: 1, dash: 0, age: 0, face: 1, cd: 3, cd2: 5, slam: 0 };
    this.enemies.push(b); this.boss = b; this.ui.toast(this.mode === 'haunt' ? 'THE REVENANT COMES FOR THE CHURCH' : `${def.name.toUpperCase()} RISES`); this.ui.bossBar(true, def.name.toUpperCase()); if (this.ui.banner) this.ui.banner(def.name, this.mode === 'haunt' ? 'The church is under attack' : 'A boss approaches'); this.punch = 1.2; this.shake = 1; sfx('boom', this.sound);
  }
  // ---------- enemies ----------
  buildGrid() { const g = this.grid || (this.grid = new Map()); if (g.size > 500) g.clear(); else for (const a of g.values()) a.length = 0; for (const e of this.enemies) { const k = Math.floor(e.x / CELL) * 100003 + Math.floor(e.y / CELL); let a = g.get(k); if (!a) g.set(k, (a = [])); a.push(e); } }
  near(x, y, rad, fn) { const g = this.grid, r = Math.ceil(rad / CELL) + 1, cx = Math.floor(x / CELL), cy = Math.floor(y / CELL); for (let i = cx - r; i <= cx + r; i++) for (let j = cy - r; j <= cy + r; j++) { const a = g.get(i * 100003 + j); if (a) for (const e of a) fn(e); } }
  updateEnemies(dt) {
    const h = this.hero, out = [];
    for (const e of this.enemies) {
      if (e.hp <= 0) { this.kill(e); continue; }
      e.age += dt; e.flash = Math.max(0, e.flash - dt);
      let dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      let sp = e.def.speed, mx = dx, my = dy; const fxk = e.def.fx;
      if (e.bleedT > 0) { e.bleedT -= dt; e.hp -= e.bleedD * dt; } if (e.burnT > 0) { e.burnT -= dt; e.hp -= e.burnD * dt; if (this.q < 2 && Math.random() < dt * 7 && this.fx.length < 260) this.fx.push({ k: 's', x: e.x + rnd(-8, 8), y: e.y - e.def.size * 0.4, vx: rnd(-20, 20), vy: rnd(-90, -40), t: 0, life: 0.35, col: '#ff8a30' }); } if (e.slowT > 0) { e.slowT -= dt; sp *= 0.6; }
      for (let zi = 0; zi < this.zones.length; zi++) { const z = this.zones[zi]; if (z.slow && (e.x - z.x) ** 2 + (e.y - z.y) ** 2 < z.r * z.r) { sp *= 0.5; break; } }
      if (fxk === 'ghost') { const w = Math.sin(e.age * 2.2 + e.ph) * 0.7; mx = dx - dy * w; my = dy + dx * w; }
      else if (fxk === 'swoop') { e.dash -= dt; if (e.dash < 0) { e.dash = rnd(1.6, 2.8); e.dashT = 0.45; } if (e.dashT > 0) { e.dashT -= dt; sp *= 2.4; } else sp *= 0.55; const w = Math.sin(e.age * 5 + e.ph) * 0.6; mx = dx - dy * w; my = dy + dx * w; }
      else if (fxk === 'dash') { e.dash -= dt; if (e.dash < 0) { e.dash = rnd(1.8, 3); e.dashT = 0.4; } if (e.dashT > 0) { e.dashT -= dt; sp *= 3.2; } else sp *= 0.6; }
      else if (fxk === 'shooter') {
        const sh = e.def.shot; e.cd -= dt;
        if (d > 300) { /* close in */ } else if (d < 210) { mx = -dx; my = -dy; sp *= 0.8; } else { sp = 0; }
        if (e.cd <= 0 && d < 520) { e.cd = sh.cd * rnd(0.85, 1.2); const base = Math.atan2(h.y - e.y, h.x - e.x); for (let i = 0; i < sh.n; i++) { const a = sh.ring ? base + i * TAU / sh.n : base + (sh.n === 1 ? 0 : (i - (sh.n - 1) / 2) * (sh.spread || 0.3)); this.ebul.push({ x: e.x, y: e.y - e.def.size * 0.4, vx: Math.cos(a) * sh.spd, vy: Math.sin(a) * sh.spd, life: 4, dmg: e.dmg * sh.dmg, r: 8 }); } sfx('shoot', this.sound && Math.random() < 0.3); }
      }
      else if (fxk === 'boss') this.bossAi(e, dt, dx, dy, d);
      if (fxk === 'boss' && e.slam > 0) sp = 0;
      // push apart from crowd neighbours
      let sx = 0, sy = 0; if (!e.def.boss && ((this.frame + e.v) & 1) === 0) { const gx = Math.floor(e.x / CELL), gy = Math.floor(e.y / CELL); for (let i = gx - 1; i <= gx + 1; i++) for (let j = gy - 1; j <= gy + 1; j++) { const cell = this.grid.get(i * 100003 + j); if (!cell) continue; for (let n = 0; n < cell.length; n++) { const o = cell[n]; if (o === e) continue; const ox = e.x - o.x, oy = e.y - o.y, m = (e.r + o.r) * 0.85; if (ox * ox + oy * oy < m * m) { const od = Math.hypot(ox, oy) || 0.01; sx += ox / od * (m - od); sy += oy / od * (m - od); } } } }
      const ml = Math.hypot(mx, my) || 1;
      e.x += (mx / ml * sp + e.vx) * dt + sx * 4 * dt; e.y += (my / ml * sp + e.vy) * dt + sy * 4 * dt;
      e.vx *= Math.pow(0.02, dt); e.vy *= Math.pow(0.02, dt); if (Math.abs(dx) > 0.2) e.face = dx > 0 ? 1 : -1;
      // contact damage
      if (d < e.r + 12 && h.inv <= 0) this.hurt(e.dmg, e);
      if (d > 1400) { e.x = h.x - dx * 600; e.y = h.y - dy * 600; } // lost ones come back
      out.push(e);
    }
    this.enemies = out;
  }
  bossAi(e, dt, dx, dy, d) {
    e.cd -= dt; e.cd2 -= dt; if (e.slam > 0) { e.slam -= dt; if (e.slam <= 0) { this.ring(e.x, e.y, 150, e.dmg * 1.6); this.shake = 0.8; this.puff(e.x, e.y, '#7dff9a', 30); sfx('boom', this.sound); } }
    if (e.cd <= 0) { e.cd = 3.2; const n = 10, off = rnd(0, TAU); for (let i = 0; i < n; i++) { const a = off + i * TAU / n; this.ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, life: 4, dmg: e.dmg * 0.55, r: 9 }); } sfx('shoot', this.sound); }
    if (e.cd2 <= 0) { e.cd2 = 6.5; if (d < 260) { e.slam = 0.9; this.zones.push({ x: e.x, y: e.y, r: 150, t: 0.9, tele: true, col: '#ff3b3b' }); } else { for (let i = 0; i < 5; i++) { const a = rnd(0, TAU), ne = this.spawnOne(e.def.summon || 'ghoul'); ne.x = e.x + Math.cos(a) * 80; ne.y = e.y + Math.sin(a) * 80; } this.ui.toast('The dead answer his call'); } }
  }
  ring(x, y, r, dmg) { const h = this.hero; if (Math.hypot(h.x - x, h.y - y) < r + 10) this.hurt(dmg, null); }
  hurt(dmg, from) {
    const h = this.hero; if (h.inv > 0 || this.over) return;
    const taken = dmg * (100 / (100 + this.hs.armor)) * this.dmgTaken * (this.setTaken || 1); h.hp -= taken; h.inv = 0.55; h.flash = 0.2; this.shake = Math.max(this.shake, 0.25); sfx('hurt', this.sound);
    this.text(h.x, h.y - 40, '-' + Math.round(taken), '#ff6a6a', 1); if (this.ui.hurt) this.ui.hurt();
  }
  kill(e) {
    this.kills++; if (this.perkSet.has('vamp')) this.hero.hp = Math.min(this.maxHp, this.hero.hp + this.maxHp * 0.02); const d = e.def, luck = this.luck(); this.scrap += d.boss ? 25 : d.elite ? 5 : (Math.random() < 0.06 ? 1 : 0);
    this.puff(e.x, e.y, d.fx === 'ghost' ? '#cfe4ff' : '#8a5a5a', d.boss ? 40 : d.elite ? 18 : 6); sfx('kill', this.sound);
    if (this.q < 2 && d.fx !== 'ghost' && !d.hover && this.corpses.length < 30) this.corpses.push({ x: e.x, y: e.y, s: sprite(d.sprite, e.v, d.size), face: e.face, t: 0, life: d.boss ? 2.4 : 1.1, dir: Math.random() < 0.5 ? 1 : -1 });
    if (this.q < 2) { const gh = d.fx === 'ghost'; if (gh) this.fx.push({ k: 'gf', x: e.x, y: e.y - 16, s: sprite(d.sprite, e.v, d.size), face: e.face, t: 0, life: 0.7 }); else if (this.decals.length < 70) this.decals.push({ x: e.x, y: e.y, t: 0, life: 9, s: pick(SPLAT.r), sc: d.boss ? 3 : d.elite ? 1.8 : 1 }); if (gh && this.decals.length < 70) this.decals.push({ x: e.x, y: e.y, t: 0, life: 6, s: pick(SPLAT.g), sc: 1 }); }
    const xp = d.xp; this.gems.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: xp, t: 0 });
    if (Math.random() < 0.1 * luck) this.loot.push({ kind: 'gold', x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14), v: Math.round(rint(1, 2) * (1 + this.district) * this.goldMul), t: 0 });
    if (d.boss) { for (let i = 0; i < 1; i++) this.dropGem(e.x + rnd(-30, 30), e.y + rnd(-30, 30), true); this.won = true; this.hitstop = 0.35; for (let i = 0; i < 4; i++) this.dropItem(e.x + rnd(-40, 40), e.y + rnd(-40, 40), true, true); this.ui.bossBar(false); this.shake = 1; setTimeout(() => this.end(true), 2200); this.slowmo = 1; }
    else if (e.mini) { for (let i = 0; i < 1; i++) this.dropGem(e.x + rnd(-20, 20), e.y + rnd(-20, 20)); for (let i = 0; i < 3; i++) this.dropItem(e.x + rnd(-24, 24), e.y + rnd(-24, 24), true); }
    else if (d.elite) { if (Math.random() < 0.12 * luck) this.dropGem(e.x + rnd(-20, 20), e.y + rnd(-20, 20)); for (let i = 0; i < 2; i++) this.dropItem(e.x + rnd(-24, 24), e.y + rnd(-24, 24), true); }
    else { if (Math.random() < 0.012 * luck) this.dropItem(e.x, e.y, false); if (Math.random() < 0.0015 * luck) this.dropGem(e.x, e.y); }
  }
  dropGem(x, y, bossTier) { const tier = 1 + Math.floor((this.district - 1) / 2) + (bossTier ? 1 : 0) + (Math.random() < 0.25 ? 1 : 0); this.loot.push({ kind: 'gem', gem: makeGem(this.S, tier), x, y, t: 0 }); }
  dropItem(x, y, good, boss) {
    const t = this.t, r = Math.random(), luck = this.luck();
    // rarity: grows with time and district; elites/bosses roll better
    let w = [60, 28, 9, 2.5, 0.45, 0.05].map((v, i) => v * (i >= 2 ? (1 + t / 200 + 0.18 * (this.district - 1)) * luck : 1));
    if (good) w = [0, 25, 40, 24, 9, 2].map((v, i) => v * (i >= 3 ? luck : 1)); if (boss) w = [0, 0, 24, 40, 28, 8].map((v, i) => v * (i >= 4 ? luck : 1));
    let s = r * w.reduce((a, b) => a + b), rar = 0; while (rar < 5 && s > w[rar]) { s -= w[rar]; rar++; }
    const it = makeItem(this.S, 1 + Math.floor(this.district * 1.2 + t / 150) + (boss ? 2 : 0), rar, undefined, undefined, boss ? 0.7 : good ? 0.5 : 0.4);
    this.loot.push({ kind: 'item', item: it, x, y, t: 0 });
  }
  // ---------- weapons ----------
  nearest(maxD) { const h = this.hero; let best = null, bd = maxD * maxD; for (const e of this.enemies) { const d2 = (e.x - h.x) ** 2 + (e.y - h.y) ** 2; if (d2 < bd) { bd = d2; best = e; } } return best; }
  dmgOf(mul = 1) { const crit = Math.random() < this.crit; return { v: this.hs.weaponDmg * this.hs.dmgPct * this.dmgMul * mul * (crit ? this.hs.critDmg : 1), crit }; }
  updateWeapons(dt) {
    const W = WEAPONS[this.hs.weaponKind], h = this.hero;
    this.cool -= dt;
    const tgt = this.nearest(W.range + 60); if (tgt) h.aim = Math.atan2(tgt.y - h.y, tgt.x - h.x);
    if (this.cool > 0 || !tgt) return;
    this.cool = W.rate / (this.hs.ratePct * this.rateMul); h.fire = isGun(W.shape) ? 0.07 : 0.14; h.recoil = isGun(W.shape) ? 5 : 0; if (isGun(W.shape) && this.q < 2 && W.shape !== 'flame') this.fx.push({ k: 'p', x: h.x, y: h.y - 40, vx: -Math.sin(h.aim) * 80 + rnd(-20, 20), vy: Math.cos(h.aim) * 80 + rnd(-60, -20), t: 0, life: 0.5, col: '#e8c860', r: 1.5 });
    const n = W.n + this.extraN, pierce = W.pierce ? W.pierce + this.extraPierce + this.hs.pierceBonus : 0;
    if (W.melee) {
      const arc = W.arc, reach = W.reach * (1 + 0.08 * this.extraN);
      this.fx.push({ k: 'slash', x: h.x, y: h.y, a: h.aim, arc, r: reach, t: 0, life: 0.18 }); sfx('slash', this.sound);
      for (const e of this.enemies) { const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy); if (d > reach + e.r) continue; let da = Math.abs(Math.atan2(dy, dx) - h.aim); if (da > Math.PI) da = TAU - da; if (da < arc / 2 || d < 28) { const D = this.dmgOf(); this.hitEnemy(e, D.v, D.crit, (W.knock || 70) * (e.def.boss ? 0.1 : 1), dx / (d || 1), dy / (d || 1)); } }
      return;
    }
    // shots leave the gun side by side (parallel lines with a tiny fan); only a shotgun sprays in a cone
    const cone = W.spread >= 0.4, ca = Math.cos(h.aim), sa = Math.sin(h.aim), len = WEAPON_LEN[this.hs.weaponKind] || 16;
    const mx = h.x + ca * 8 + h.face * 6 + ca * len, my = h.y - 44 + sa * 5 + sa * len, gap = W.shape === 'knife' ? 11 : W.shape === 'axe' ? 16 : 9;
    for (let i = 0; i < n; i++) {
      const o = i - (n - 1) / 2;
      const a = cone ? h.aim + o * (W.spread / Math.max(1, n - 1) * 2) + rnd(-0.04, 0.04) : h.aim + o * 0.025 + (n === 1 ? rnd(-W.spread, W.spread) : rnd(-W.spread * 0.15, W.spread * 0.15));
      const lat = cone ? 0 : o * gap;
      const D = this.dmgOf(); this.bullets.push({ x: mx - sa * lat, y: my + ca * lat, vx: Math.cos(a) * W.speed, vy: Math.sin(a) * W.speed, a, life: W.life, dmg: D.v, crit: D.crit, pierce, hit: new Set(), shape: W.shape, r: W.shape === 'axe' ? 18 : W.shape === 'flame' ? 16 : W.shape === 'grenade' ? 9 : 7, spin: 0, boom: W.boom || 0 });
    }
    sfx('shoot', this.sound);
  }
  perkHit(e, dmg) {
    const P = this.perkSet, sc = Math.min(1, this.wRate / 0.5) * 0.8 + 0.2; this._pk = true;
    if (P.has('bleed')) { e.bleedT = 3; e.bleedD = Math.max(e.bleedD || 0, dmg * 0.3); }
    if (P.has('burn')) { e.burnT = 2.5; e.burnD = Math.max(e.burnD || 0, dmg * 0.35); }
    if (P.has('frost')) e.slowT = 2;
    if (P.has('chain') && Math.random() < 0.25 * sc) { let n = 0; for (const o of this.enemies) { if (o === e || o.hp <= 0) continue; if (Math.hypot(o.x - e.x, o.y - e.y) < 150) { this.hitEnemy(o, dmg * 0.6, false, 0, 0, 0); for (let i = 0; i < 4 && this.fx.length < 260; i++) this.fx.push({ k: 's', x: o.x, y: o.y - 30, vx: rnd(-120, 120), vy: rnd(-120, 120), t: 0, life: 0.2, col: '#9ad8ff' }); if (++n >= 2) break; } } }
    if (P.has('explosive') && Math.random() < 0.2 * sc) this.boom(e.x, e.y, 80, dmg * 0.7, false, e);
    this._pk = false;
  }
  boom(x, y, r, dmg, crit, skip) {
    this._pk = true; for (const o of this.enemies) { if (o === skip || o.hp <= 0) continue; const d = Math.hypot(o.x - x, o.y - y); if (d < r + o.r) this.hitEnemy(o, dmg * (1 - Math.min(0.4, d / r * 0.4)), crit, 140, (o.x - x) / (d || 1), (o.y - y) / (d || 1)); }
    this._pk = false; this.shake = Math.max(this.shake, 0.25); sfx('boom', this.sound);
    for (let i = 0; i < 16 && this.fx.length < 260; i++) { const a = rnd(0, TAU), sp = rnd(80, 300); this.fx.push({ k: 's', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rnd(0.2, 0.45), col: Math.random() < 0.5 ? '#ffb040' : '#ff6a20' }); }
  }
  hitEnemy(e, dmg, crit, kb, nx, ny) {
    if (!this._pk && this.perkSet.size && this.perkSet.has('exec') && e.hp < e.maxHp * 0.3) dmg *= 1.5;
    e.hp -= dmg; if (!this._pk && this.perkSet.size) this.perkHit(e, dmg); e.flash = 0.09; if (this.q < 2 && this.fx.length < 260) { const ghost = e.def.fx === 'ghost'; for (let i = 0; i < (crit ? 5 : 2); i++) { const a = Math.atan2(ny || 0, nx || 1) + rnd(-0.9, 0.9), sp = rnd(120, 260); this.fx.push({ k: 's', x: e.x, y: e.y - e.def.size * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rnd(0.12, 0.25), col: ghost ? '#bfe4ff' : crit ? '#ffe08a' : '#ffb27a' }); } } if (kb) { e.vx += nx * kb * 4; e.vy += ny * kb * 4; }
    this.text(e.x + rnd(-8, 8), e.y - e.def.size * 0.5, Math.round(dmg), crit ? '#ffd84a' : '#ffffff', crit ? 1.5 : 1); sfx('hit', this.sound && Math.random() < 0.3);
    if (e.def.boss) this.ui.bossHp(e.hp / e.maxHp);
  }
  updateBullets(dt) {
    const keep = [];
    for (const b of this.bullets) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * 18; if (b.life <= 0) { if (b.boom) this.boom(b.x, b.y, b.boom, b.dmg, b.crit); continue; }
      let dead = false;
      this.near(b.x, b.y, b.r + 40, (e) => { if (dead || e.hp <= 0 || b.hit.has(e)) return; if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) { b.hit.add(e); const d = Math.hypot(b.vx, b.vy) || 1; this.hitEnemy(e, b.dmg, b.crit, 40, b.vx / d, b.vy / d); if (b.boom) { this.boom(b.x, b.y, b.boom, b.dmg, b.crit, e); dead = true; } else if (b.hit.size > b.pierce) dead = true; } });
      if (!dead) keep.push(b);
    }
    this.bullets = keep;
    // enemy bullets
    const h = this.hero, ek = [];
    for (const b of this.ebul) { b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.life <= 0) continue; if (Math.hypot(b.x - h.x, b.y - h.y) < b.r + 10) { this.hurt(b.dmg, null); continue; } ek.push(b); }
    this.ebul = ek;
  }
  updatePassives(dt) {
    const h = this.hero;
    if (this.salt > 0) {
      this.saltAng += dt * 2.6; const n = 1 + this.salt, R = 78 + this.salt * 6;
      for (let i = 0; i < n; i++) { const a = this.saltAng + i * TAU / n, sx = h.x + Math.cos(a) * R, sy = h.y + Math.sin(a) * R; this.near(sx, sy, 30, (e) => { if (e.hp <= 0 || Math.hypot(e.x - sx, e.y - sy) > e.r + 14) return; const last = this.tickMap.get(e) || 0; if (this.t - last > 0.35) { this.tickMap.set(e, this.t); this.hitEnemy(e, this.hs.weaponDmg * 0.55 * this.dmgMul * (e.def.fx === 'ghost' ? 2 : 1), false, 30, (e.x - h.x) / R, (e.y - h.y) / R); } }); }
    }
    if (this.beam > 0) {
      this.beamT -= dt; if (this.beamT <= 0) { this.beamT = 0.28; const len = 170 + this.beam * 30, half = 0.32 + this.beam * 0.03;
        for (const e of this.enemies) { const dx = e.x - h.x, dy = e.y - h.y, d = Math.hypot(dx, dy); if (d > len) continue; let da = Math.abs(Math.atan2(dy, dx) - h.aim); if (da > Math.PI) da = TAU - da; if (da < half) this.hitEnemy(e, this.hs.weaponDmg * 0.5 * this.dmgMul * (e.def.fx === 'ghost' ? 2.2 : 1), false, 0, 0, 0); } }
    }
    if (this.fire > 0) {
      this.fireT -= dt; if (this.fireT <= 0) { this.fireT = 3.4 / (1 + 0.25 * this.fire); const t = this.nearest(360) || { x: h.x + rnd(-80, 80), y: h.y + rnd(-80, 80) }; this.zones.push({ x: t.x, y: t.y, r: 62 + this.fire * 6, t: 2.8 + this.fire * 0.3, fire: true, tick: 0 }); sfx('slash', this.sound); }
    }
    for (const z of this.zones) { z.t -= dt; if (z.fire) { z.tick -= dt; if (z.tick <= 0) { z.tick = 0.3; this.near(z.x, z.y, z.r, (e) => { if (e.hp > 0 && Math.hypot(e.x - z.x, e.y - z.y) < z.r + e.r) this.hitEnemy(e, this.hs.weaponDmg * 0.45 * this.dmgMul, false, 0, 0, 0); }); } } }
    this.zones = this.zones.filter((z) => z.t > 0);
  }
  // ---------- pickups ----------
  updatePickups(dt) {
    const h = this.hero, mag = this.hs.magnet * this.magnetMul, ng = [];
    for (const g of this.gems) { g.t += dt; const dx = h.x - g.x, dy = h.y - g.y, d = Math.hypot(dx, dy); if (d < mag || g.pull) { g.pull = true; const s = 420 + g.t * 200; g.x += dx / d * s * dt; g.y += dy / d * s * dt; } if (d < 16) { this.addXp(g.v); sfx('gem', this.sound && Math.random() < 0.4); continue; } ng.push(g); }
    while (ng.length > 220) { const g = ng.shift(); this.addXp(g.v); }
    this.gems = ng;
    const nl = [];
    for (const l of this.loot) { l.t += dt; const dx = h.x - l.x, dy = h.y - l.y, d = Math.hypot(dx, dy); if (!l.stay && (d < mag * 1.2 || l.pull)) { l.pull = true; const s = 380 + l.t * 160; l.x += dx / d * s * dt; l.y += dy / d * s * dt; } if (d < (l.stay ? 30 : 18)) { this.collect(l); continue; } nl.push(l); }
    this.loot = nl;
  }
  collect(l) {
    if (l.kind === 'crate') { const n = 3 + Math.floor(this.district / 3); for (let i = 0; i < n; i++) this.dropItem(l.x + rnd(-26, 26), l.y + rnd(-26, 26), true); for (let i = 0; i < 4; i++) this.loot.push({ kind: 'gold', x: l.x + rnd(-30, 30), y: l.y + rnd(-30, 30), v: Math.round(rint(2, 5) * (1 + this.district) * this.goldMul), t: 0 }); if (Math.random() < 0.3) this.dropGem(l.x, l.y); this.ui.toast('Supply crate opened!'); sfx('loot', this.sound); return; }
    if (l.kind === 'gem') { this.lootGems.push(l.gem); sfx('loot', this.sound); this.ui.toast(`${['', 'Chipped', 'Flawed', 'Normal', 'Flawless', 'Perfect', 'Radiant', 'Brilliant', 'Royal'][l.gem.tier]} ${GEMS[l.gem.type].name}`); return; }
    if (l.kind === 'gold') { this.gold += l.v; sfx('coin', this.sound && Math.random() < 0.5); }
    else { this.lootItems.push(l.item); sfx('loot', this.sound); this.ui.lootToast(l.item); }
  }
  addXp(v) { this.xp += v * this.xpMul; while (this.xp >= this.xpNeed) { this.xp -= this.xpNeed; this.level++; this.xpNeed = this.needFor(this.level); this.levelUp(); } }
  levelUp() {
    sfx('level', this.sound); this.punch = 0.6;
    const pool = UPGRADES.filter((u) => (this.picked[u.id] || 0) < u.max), shuffled = pool.sort(() => Math.random() - 0.5);
    const choices = []; for (const u of shuffled) { if (choices.length >= 3) break; if (u.weapon && choices.some((c) => c.weapon) && Math.random() < 0.6) continue; choices.push(u); } for (const u of shuffled) { if (choices.length >= 3) break; if (!choices.includes(u)) choices.push(u); }
    if (this.afk) { const u = choices.find((c) => ['dmg', 'rate', 'multi', 'salt', 'beam', 'fire', 'hp'].includes(c.id)) || choices[0]; this.pickUpgrade(u); return; }
    this.paused = true; this.ui.levelUp(choices, (u) => { this.pickUpgrade(u); this.paused = false; });
  }
  pickUpgrade(u) { this.picked[u.id] = (this.picked[u.id] || 0) + 1; u.apply(this); this.ui.toast(`${u.name}${this.picked[u.id] > 1 ? ' ' + this.picked[u.id] : ''}`); }
  // ---------- effects ----------
  puff(x, y, col, n) { for (let i = 0; i < n; i++) { const a = rnd(0, TAU), s = rnd(30, 150); this.fx.push({ k: 'p', x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: 0, life: rnd(0.3, 0.7), col, r: rnd(2, 5) }); } if (this.fx.length > (this.q >= 1 ? 160 : 320)) this.fx.splice(0, 80); }
  text(x, y, s, col, size) { if (this.q >= 3) return; this.texts.push({ x, y, s, col, size, t: 0 }); if (this.texts.length > 16) this.texts.shift(); }
  updateFx(dt) {
    for (const f of this.fx) { f.t += dt; if (f.k === 'p') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94; } else if (f.k === 's') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 300 * dt; } } this.fx = this.fx.filter((f) => f.t < f.life);
    for (const t of this.texts) { t.t += dt; t.y -= 38 * dt; } this.texts = this.texts.filter((t) => t.t < 0.8);
  }
  retreat() { if (this.over) return; this.retreated = true; this.paused = false; this.end(false); }
  end(won) {
    if (this.over) return; this.over = true; this.won = won;
    // everything still on the floor goes in the bag
    for (const l of this.loot) this.collect(l); this.loot = []; this.ui.done(this);
  }
  // ---------- drawing ----------
  props_at(cx, cy) {
    const key = cx + ',' + cy; if (this.props.has(key)) return this.props.get(key);
    let s = (cx * 73856093) ^ (cy * 19349663); const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296), list = [], C = 520;
    if (Math.abs(cx) + Math.abs(cy) > 0) {
      const n = 3 + Math.floor(r() * 5);
      for (let i = 0; i < n; i++) { const q0 = r(), x = cx * C + r() * C, y = cy * C + r() * C, q = q0 < this.theme.tree ? 0.7 : q0 < this.theme.tree + (this.theme.road > 0.4 ? 0.3 : 0) ? 0.86 : r(); const t = q < 0.34 ? 'prop_tomb1' : q < 0.5 ? 'prop_tomb2' : q < 0.6 ? 'prop_tomb3' : q < 0.78 ? 'prop_tree' : q < 0.84 ? 'prop_lamp' : q < 0.88 ? 'prop_car' : q < 0.93 ? 'prop_fence' : q < 0.96 ? 'prop_pumpkin' : 'prop_bush'; list.push({ t, x, y, f: r() < 0.5 ? 1 : -1 }); }
    }
    const road = r() < this.theme.road ? { h: r() < 0.5, o: Math.floor(r() * 300) } : null, leaves = []; for (let i = 0; i < 9; i++) leaves.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3) });
    const patches = [], puddles = [], tufts = []; for (let i = 0; i < 2; i++) patches.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3), s: 220 + r() * 220 }); if (r() < this.theme.puddle) puddles.push({ x: cx * C + 60 + r() * (C - 120), y: cy * C + 60 + r() * (C - 120), s: 70 + r() * 60 }); for (let i = 0; i < 12; i++) tufts.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3) });
    (this.cinfo || (this.cinfo = new Map())).set(key, { road, leaves, patches, puddles, tufts }); if (this.cinfo.size > 200) this.cinfo.delete(this.cinfo.keys().next().value);
    this.props.set(key, list); if (this.props.size > 160) this.props.delete(this.props.keys().next().value); return list;
  }
  draw() {
    const x = this.x, dpr = this.dpr, W = this.sw, H = this.sh, S = this.scale * (1 + 0.04 * Math.sin(Math.min(1, this.punch / 0.6) * Math.PI)), h = this.hero, q = this.q || 0;
    const sh = this.shake > 0 ? this.shake * 10 : 0, ox = sh ? rnd(-sh, sh) : 0, oy = sh ? rnd(-sh, sh) : 0;
    const camx = this.cam.x, camy = this.cam.y;
    x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy));
    const vw = W / S, vh = H / S, x0 = camx - vw / 2 - 60, x1 = camx + vw / 2 + 60, y0 = camy - vh / 2 - 60, y1 = camy + vh / 2 + 60;
    // ground
    const tex = TEX[this.theme.ground] || TEX.tex_ground, gtex = !!(this.theme.ground && TEX[this.theme.ground]);
    if (tex) { if (!this.pat) { this.pat = x.createPattern(tex, 'repeat'); this.pat.setTransform(new DOMMatrix().scale(0.5)); } x.fillStyle = this.pat; } else x.fillStyle = '#1b2220';
    x.fillRect(x0, y0, x1 - x0, y1 - y0);
    if (this.theme.tint && !gtex) { x.globalCompositeOperation = 'multiply'; x.fillStyle = this.theme.tint; x.fillRect(x0, y0, x1 - x0, y1 - y0); x.globalCompositeOperation = 'source-over'; }
    // ground dressing: roads, fallen leaves, blood and ectoplasm stains
    for (let cx = Math.floor(x0 / 520) - 1; cx <= Math.floor(x1 / 520) + 1; cx++) for (let cy = Math.floor(y0 / 520) - 1; cy <= Math.floor(y1 / 520) + 1; cy++) {
      this.props_at(cx, cy); const ci = this.cinfo.get(cx + ',' + cy); if (!ci) continue;
      if (q < 2) { x.globalAlpha = 0.5; for (const pa of ci.patches) x.drawImage(PATCH[pa.v], pa.x - pa.s / 2, pa.y - pa.s / 2, pa.s, pa.s); x.globalAlpha = 1; }
      if (ci.road && TEX.tex_road) { if (!this.rpat) { this.rpat = x.createPattern(TEX.tex_road, 'repeat'); this.rpat.setTransform(new DOMMatrix().scale(0.5)); } x.fillStyle = this.rpat; const r = ci.road; if (r.h) { x.fillRect(cx * 520, cy * 520 + r.o, 520, 150); x.fillStyle = 'rgba(210,200,150,.35)'; for (let k = 0; k < 520; k += 70) x.fillRect(cx * 520 + k, cy * 520 + r.o + 73, 38, 4); } else { x.fillRect(cx * 520 + r.o, cy * 520, 150, 520); x.fillStyle = 'rgba(210,200,150,.35)'; for (let k = 0; k < 520; k += 70) x.fillRect(cx * 520 + r.o + 73, cy * 520 + k, 4, 38); } }
      if (this.q < 2) { for (const lf of ci.leaves) x.drawImage(LEAF[lf.v], lf.x, lf.y); for (const tf of ci.tufts) x.drawImage(TUFT[tf.v], tf.x, tf.y); x.globalAlpha = 0.8; for (const pd of ci.puddles) x.drawImage(PUDDLE, pd.x - pd.s / 2, pd.y - pd.s * 0.2, pd.s, pd.s * 0.42); x.globalAlpha = 1; }
    }
    for (const d of this.decals) { const a = Math.min(1, (d.life - d.t) / 2) * 0.75; if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue; x.globalAlpha = a; const w = 44 * d.sc; x.drawImage(d.s, d.x - w / 2, d.y - w * 0.3, w, w * 0.6); } x.globalAlpha = 1;
    for (const c of this.corpses) { if (c.x < x0 || c.x > x1 || c.y < y0 || c.y > y1) continue; const k = c.t / c.life, ease = Math.min(1, k * 4), s0 = c.face < 0 ? flipped(c.s) : c.s; x.save(); x.translate(c.x, c.y); x.rotate(c.dir * 1.45 * ease); x.globalAlpha = k > 0.55 ? 1 - (k - 0.55) / 0.45 : 1; x.drawImage(s0, -s0.width / 2, -s0.height * (1 - 0.35 * ease)); x.restore(); } x.globalAlpha = 1;
    // things standing on the ground, drawn back to front (list is reused every frame)
    const list = this.dl || (this.dl = []); list.length = 0; const C = 520;
    for (let cx = Math.floor(x0 / C) - 1; cx <= Math.floor(x1 / C) + 1; cx++) for (let cy = Math.floor(y0 / C) - 1; cy <= Math.floor(y1 / C) + 1; cy++) for (const p of this.props_at(cx, cy)) if (p.x > x0 - 100 && p.x < x1 + 100 && p.y > y0 - 120 && p.y < y1 + 200) list.push(p);
    for (const e of this.enemies) if (e.x > x0 - 80 && e.x < x1 + 80 && e.y > y0 - 80 && e.y < y1 + 80) list.push(e);
    list.push(h); for (const c of this.crew) list.push(c); for (const t of this.turrets) list.push(t); list.sort((a, b) => a.y - b.y);
    // gems and loot first (pre-made sprites, no gradients)
    for (const g of this.gems) { const s = g.v >= 5 ? GEM.p : g.v >= 2 ? GEM.b : GEM.g; if (g.x > x0 && g.x < x1 && g.y > y0 && g.y < y1) x.drawImage(s, g.x - 7, g.y - 7); }
    for (const l of this.loot) {
      if (l.x < x0 || l.x > x1 || l.y < y0 || l.y > y1) continue;
      if (l.kind === 'crate') { x.globalCompositeOperation = 'lighter'; x.drawImage(glow('#ffd24a', 128), l.x - 56, l.y - 56, 112, 112); x.globalAlpha = 0.5; x.fillStyle = '#ffd24a'; x.fillRect(l.x - 3, l.y - 110, 6, 110); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.fillStyle = '#5a3d1f'; x.fillRect(l.x - 13, l.y - 20, 26, 20); x.strokeStyle = '#c99a3a'; x.lineWidth = 2; x.strokeRect(l.x - 13, l.y - 20, 26, 20); x.fillStyle = '#c99a3a'; x.fillRect(l.x - 13, l.y - 12, 26, 3); }
      else if (l.kind === 'gold') x.drawImage(GOLD, l.x - 6, l.y - 6);
      else if (l.kind === 'gem') { const c = GEMS[l.gem.type].color; x.globalCompositeOperation = 'lighter'; x.drawImage(glow(c, 64), l.x - 24, l.y - 24, 48, 48); x.globalCompositeOperation = 'source-over'; x.drawImage(gemSprite(c), l.x - 9, l.y - 9 - Math.sin(this.t * 4 + l.x) * 2); }
      else { const c = RARITIES[l.item.rar].color; x.globalCompositeOperation = 'lighter'; x.drawImage(glow(c, 96), l.x - 40, l.y - 40, 80, 80); x.fillStyle = c; x.globalAlpha = 0.5; x.fillRect(l.x - 2, l.y - 70, 4, 70); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.fillStyle = c; x.fillRect(l.x - 7, l.y - 7, 14, 14); x.strokeStyle = '#000'; x.lineWidth = 1; x.strokeRect(l.x - 7, l.y - 7, 14, 14); }
    }
    for (const z of this.zones) {
      if (z.tele) { x.fillStyle = `rgba(255,50,50,${0.12 + 0.2 * (1 - z.t / 0.9)})`; x.strokeStyle = '#ff4a4a'; x.lineWidth = 3; x.beginPath(); x.arc(z.x, z.y, z.r, 0, TAU); x.fill(); x.stroke(); }
      else if (z.slow) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.55; x.drawImage(glow('#3a9aff', 128), z.x - z.r, z.y - z.r, z.r * 2, z.r * 2); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      else { x.globalCompositeOperation = 'lighter'; const r = z.r * (0.95 + Math.sin(this.t * 14) * 0.05); x.drawImage(glow('#ff8a2a', 128), z.x - r * 1.2, z.y - r * 1.2, r * 2.4, r * 2.4); x.globalCompositeOperation = 'source-over'; }
    }
    for (let i = 0; i < list.length; i++) { const o = list[i]; if (o === h) this.drawHero(x); else if (o.def) this.drawEnemy(x, o); else if (o.sv) this.drawCrew(x, o); else if (o.turret) this.drawTurret(x, o); else this.drawProp(x, o); }
    // bullets and effects (additive)
    x.globalCompositeOperation = 'lighter';
    for (const b of this.bullets) {
      if (b.shape === 'flame') { const k = 1 - Math.max(0, b.life) / 0.42; x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.55 * (1 - k * 0.6); x.fillStyle = k < 0.4 ? '#ffd060' : '#ff6a20'; x.beginPath(); x.arc(b.x, b.y, 7 + k * 15, 0, TAU); x.fill(); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
      else if (b.shape === 'grenade') { x.fillStyle = '#2a3238'; x.beginPath(); x.arc(b.x, b.y, 5, 0, TAU); x.fill(); x.fillStyle = '#ff7a30'; x.fillRect(b.x - 1, b.y - 1, 2, 2); }
      else if (b.shape === 'bullet') { x.strokeStyle = b.crit ? '#ffd84a' : '#ffe9a0'; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x - Math.cos(b.a) * 26, b.y - Math.sin(b.a) * 26); x.stroke(); }
      else if (b.shape === 'knife') { const c = Math.cos(b.a), s = Math.sin(b.a); x.setTransform(dpr * S * c, dpr * S * s, -dpr * S * s, dpr * S * c, dpr * (W / 2 - camx * S + ox) + dpr * S * (b.x * 1), dpr * (H / 2 - camy * S + oy) + dpr * S * b.y); x.drawImage(KNIFE, -22, -6); x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy)); }
      else if (b.shape === 'axe') { const c = Math.cos(b.spin), s = Math.sin(b.spin); x.setTransform(dpr * S * c, dpr * S * s, -dpr * S * s, dpr * S * c, dpr * (W / 2 - camx * S + ox) + dpr * S * b.x, dpr * (H / 2 - camy * S + oy) + dpr * S * b.y); x.drawImage(AXE, -16, -16); x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy)); }
    }
    for (const b of this.ebul) x.drawImage(glow('#5dff7a', 64), b.x - 15, b.y - 15, 30, 30);
    if (this.salt > 0) { const n = 1 + this.salt, R = 78 + this.salt * 6, gs = glow('#c8e6ff', 64); for (let i = 0; i < n; i++) { const a = this.saltAng + i * TAU / n, px = h.x + Math.cos(a) * R, py = h.y + Math.sin(a) * R; x.drawImage(gs, px - 20, py - 20, 40, 40); x.fillStyle = '#fff'; x.fillRect(px - 5, py - 5, 10, 10); } }
    for (const f of this.fx) {
      if (f.k === 'slash') { const k = f.t / f.life; x.strokeStyle = `rgba(255,255,255,${1 - k})`; x.lineWidth = 10 * (1 - k) + 2; x.beginPath(); x.arc(f.x, f.y - 10, f.r * (0.7 + 0.3 * k), f.a - f.arc / 2, f.a + f.arc / 2); x.stroke(); }
      else if (f.k === 'bolt') { x.globalAlpha = 1 - f.t / f.life; x.strokeStyle = '#bfe8ff'; x.lineWidth = 3; x.beginPath(); x.moveTo(f.x, f.y); const mx = (f.x + f.x2) / 2 + rnd(-10, 10), my = (f.y + f.y2) / 2 + rnd(-10, 10); x.lineTo(mx, my); x.lineTo(f.x2, f.y2); x.stroke(); }
      else if (f.k === 's') { x.globalAlpha = 1 - f.t / f.life; x.strokeStyle = f.col; x.lineWidth = 2; x.beginPath(); x.moveTo(f.x, f.y); x.lineTo(f.x - f.vx * 0.04, f.y - f.vy * 0.04); x.stroke(); }
      else if (f.k === 'p') { x.globalAlpha = 1 - f.t / f.life; x.fillStyle = f.col; x.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); }
      else if (f.k === 'gf') { const k = f.t / f.life, s0 = f.face < 0 ? flipped(f.s) : f.s; x.globalAlpha = (1 - k) * 0.7; x.drawImage(s0, f.x - s0.width / 2, f.y - s0.height - k * 40); }
    }
    x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
    this.drawDark(x, W, H, S, camx, camy, ox, oy, q);
    // damage numbers (cheap: one dark copy under one coloured copy)
    if (q < 3) {
      x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy)); x.textAlign = 'center';
      for (const t of this.texts) { x.globalAlpha = 1 - (t.t / 0.8) ** 2; x.font = `800 ${Math.round(15 * t.size)}px Inter, sans-serif`; x.fillStyle = '#000'; x.fillText(t.s, t.x + 1.5, t.y + 1.5); x.fillStyle = t.col; x.fillText(t.s, t.x, t.y); } x.globalAlpha = 1;
    }
  }
  updateCrew(dt) {
    const h = this.hero, W = this.hs.weaponDmg * this.dmgMul;
    this.crew.forEach((c, i) => {
      c.age += dt; c.bob += dt * 9;
      // follow the hero, a little behind and to the side
      const tx = h.x - (i ? 72 : 40) * (h.face || 1), ty = h.y + 4 + i * 12, dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy); c.moving = d > 6;
      if (d > 5) { const sp = Math.min(d * 5, 200); c.x += dx / d * sp * dt; c.y += dy / d * sp * dt; } if (d > 600) { c.x = tx; c.y = ty; }
      const tgt = (() => { let b = null, bd = 380 * 380; for (const e of this.enemies) { const q = (e.x - c.x) ** 2 + (e.y - c.y) ** 2; if (q < bd) { bd = q; b = e; } } return b; })();
      if (tgt) c.face = tgt.x >= c.x ? 1 : -1; else if (Math.abs(dx) > 4) c.face = dx > 0 ? 1 : -1;
      c.cd -= dt;
      const r = c.role, k = c.sk;
      if (r === 'weap' && c.cd <= 0 && tgt) { c.cd = Math.max(0.35, 1.1 - 0.07 * k); const a = Math.atan2(tgt.y - c.y, tgt.x - c.x); this.bullets.push({ x: c.x + Math.cos(a) * 14, y: c.y - 40 + Math.sin(a) * 6, vx: Math.cos(a) * 760, vy: Math.sin(a) * 760, a, life: 0.7, dmg: W * 0.5 * (0.7 + 0.12 * k), crit: false, pierce: 1, hit: new Set(), shape: 'bullet', r: 7, spin: 0 }); sfx('shoot', this.sound && Math.random() < 0.3); }
      else if (r === 'med' && c.cd <= 0) { c.cd = Math.max(4, 9 - 0.5 * k); if (h.hp < this.maxHp) { const v = Math.round(this.maxHp * (0.04 + 0.01 * k)); h.hp = Math.min(this.maxHp, h.hp + v); this.text(h.x, h.y - 60, '+' + v, '#7dff9a', 1.2); this.puff(h.x, h.y - 30, '#7dff9a', 10); } }
      else if (r === 'mech' && c.cd <= 0) { c.cd = Math.max(7, 14 - 0.6 * k); this.turrets.push({ turret: true, x: c.x + c.face * 24, y: c.y, life: 8 + 0.3 * k, cd: 0, k, aim: 0, y0: c.y }); this.puff(c.x + c.face * 24, c.y, '#ffd36a', 8); }
      else if (r === 'elec' && c.cd <= 0 && this.enemies.length) { c.cd = Math.max(2.2, 5 - 0.3 * k); const near = this.enemies.filter((e) => (e.x - h.x) ** 2 + (e.y - h.y) ** 2 < 280 * 280).sort((p, q) => (p.x - h.x) ** 2 + (p.y - h.y) ** 2 - (q.x - h.x) ** 2 - (q.y - h.y) ** 2).slice(0, 2 + Math.floor(k / 3)); let px = c.x, py = c.y - 40; for (const e of near) { this.hitEnemy(e, W * 0.8 * (1 + 0.1 * k), false, 0, 0, 0); this.fx.push({ k: 'bolt', x: px, y: py, x2: e.x, y2: e.y - e.def.size * 0.4, t: 0, life: 0.18 }); px = e.x; py = e.y - e.def.size * 0.4; } }
      else if (r === 'plumb' && c.cd <= 0 && tgt) { c.cd = Math.max(5, 10 - 0.5 * k); this.zones.push({ x: tgt.x, y: tgt.y, r: 90 + 4 * k, t: 4 + 0.2 * k, slow: true, tick: 0 }); }
    });
    for (const t of this.turrets) { t.life -= dt; t.cd -= dt; if (t.cd <= 0) { let b = null, bd = 340 * 340; for (const e of this.enemies) { const q = (e.x - t.x) ** 2 + (e.y - t.y) ** 2; if (q < bd) { bd = q; b = e; } } if (b) { t.cd = 0.45; t.aim = Math.atan2(b.y - t.y, b.x - t.x); this.bullets.push({ x: t.x + Math.cos(t.aim) * 12, y: t.y - 20, vx: Math.cos(t.aim) * 800, vy: Math.sin(t.aim) * 800, a: t.aim, life: 0.5, dmg: W * 0.35 * (1 + 0.1 * t.k), crit: false, pierce: 1, hit: new Set(), shape: 'bullet', r: 7, spin: 0 }); } } }
    this.turrets = this.turrets.filter((t) => t.life > 0);
  }
  drawCrew(x, c) {
    const job = c.sv.main, key = `cr_${job}_${c.sv.g}`, fr = frames(key, 1, 92, c.moving ? 'walk' : 'idle'), s0 = fr[Math.floor(c.bob * (c.moving ? 0.9 : 0.35)) % fr.length], s = c.face < 0 ? flipped(s0) : s0;
    x.drawImage(SHADOW, c.x - 18, c.y - 7, 36, 14); x.drawImage(s, c.x - s.width / 2, c.y - s.height + FRAME_PAD(92));
  }
  drawTurret(x, t) {
    x.drawImage(SHADOW, t.x - 14, t.y - 5, 28, 10); x.fillStyle = '#2a3038'; x.fillRect(t.x - 9, t.y - 16, 18, 14); x.fillStyle = '#9aa7b5'; x.fillRect(t.x - 6, t.y - 20, 12, 5);
    x.strokeStyle = '#d8e0ea'; x.lineWidth = 3; x.beginPath(); x.moveTo(t.x, t.y - 18); x.lineTo(t.x + Math.cos(t.aim) * 16, t.y - 18 + Math.sin(t.aim) * 16); x.stroke();
  }
  drawProp(x, p) {
    const s0 = spr(p.t, PROP_H[p.t] || 74), s = p.f < 0 ? flipped(s0) : s0;
    x.drawImage(SHADOW, p.x - s.width * 0.4, p.y - 8, s.width * 0.8, 16); x.drawImage(s, p.x - s.width / 2, p.y - s.height);
  }
  drawEnemy(x, e) {
    const d = e.def, ghost = d.fx === 'ghost' || d.hover, bob = Math.sin(e.age * (ghost ? 3 : 7) + e.ph) * (ghost ? 6 : 2.5), lift = ghost ? 16 : d.fx === 'swoop' ? 26 : 0;
    const kind = ghost ? 'ghost' : d.fx === 'swoop' ? 'flap' : 'walk', fr = frames(d.sprite, e.v, d.size, kind), s0 = fr[Math.floor(e.age * (ghost ? 5 : kind === 'flap' ? 14 : 9 * (d.speed / 70) + 4)) % fr.length], s = e.face < 0 ? flipped(s0) : s0, yy = e.y - lift - (ghost ? bob : 0) + FRAME_PAD(d.size), jx = e.slam > 0 ? rnd(-2, 2) : 0;
    x.drawImage(SHADOW, e.x - d.r * 1.2, e.y - d.r * 0.45, d.r * 2.4, d.r * 0.9);
    if (ghost) x.globalAlpha = 0.88;
    x.drawImage(s, e.x - s.width / 2 + jx, yy - s.height);
    if (e.flash > 0) { x.globalAlpha = 0.85; x.drawImage(flashOf(s), e.x - s.width / 2 + jx, yy - s.height); }
    x.globalAlpha = 1;
    if (this.q < 2 && d.eye) { x.globalCompositeOperation = 'lighter'; x.drawImage(glow(d.eye, 32), e.x - 11 + (e.face < 0 ? 2 : -2), yy - s.height * 0.86 - 5, 22, 14); x.globalCompositeOperation = 'source-over'; }
    if (e.hp < e.maxHp && !d.boss && e.hp > 0) { const w = d.r * 2, by = yy - s.height - 6; x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(e.x - w / 2, by, w, 4); x.fillStyle = d.elite ? '#ff9a3a' : '#e04a4a'; x.fillRect(e.x - w / 2, by, w * Math.max(0, e.hp / e.maxHp), 4); }
  }
  drawHero(x) {
    const h = this.hero, moving = h.moving, fr = frames('hero_' + this.S.hero, 1, 100, moving ? 'walk' : 'idle'), s0 = fr[Math.floor(h.bob * (moving ? 0.9 : 0.35)) % fr.length], s = h.face < 0 ? flipped(s0) : s0, bob = 0 + FRAME_PAD(100) * 0;
    x.drawImage(SHADOW, h.x - 20, h.y - 7, 40, 14);
    if (h.inv > 0 && Math.floor(this.t * 20) % 2) x.globalAlpha = 0.5;
    x.drawImage(s, h.x - s.width / 2, h.y - s.height + FRAME_PAD(100) - bob);
    if (h.flash > 0) { x.globalAlpha = 0.6; x.drawImage(flashOf(s), h.x - s.width / 2, h.y - s.height + FRAME_PAD(100) - bob); }
    x.globalAlpha = 1;
    // the weapon in hand: aims at the target, kicks back when it fires, muzzle flash on guns
    const K = this.hs.weaponKind, Wp = WEAPONS[K], a = h.aim, ca = Math.cos(a), sa = Math.sin(a), hx = h.x + ca * 8 + h.face * 6, hy = h.y - 44 - bob + sa * 5, rc = h.recoil || 0;
    const len = WEAPON_LEN[K] || 16, gun = isGun(Wp.shape);
    const ex = hx + ca * (len - rc), ey = hy + sa * (len - rc);
    x.lineCap = 'round'; x.strokeStyle = gun ? '#14181c' : '#cfd8e2'; x.lineWidth = gun ? (K === 'shotgun' || K === 'rifle' ? 5 : 4) : 3.2; x.beginPath(); x.moveTo(hx - ca * rc, hy - sa * rc); x.lineTo(ex, ey); x.stroke();
    x.strokeStyle = gun ? '#6a7480' : '#ffffff'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(hx - ca * rc, hy - sa * rc - 1); x.lineTo(ex, ey - 1); x.stroke();
    if (gun && h.fire > 0) { const k = h.fire / 0.07; x.globalCompositeOperation = 'lighter'; x.globalAlpha = k; x.drawImage(FLARE, ex - 22, ey - 22, 44, 44); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  }
  drawDark(x, W, H, S, camx, camy, ox, oy, q) {
    // night: dark layer with soft holes for the flashlight, lamps and fires (all pre-made glow sprites)
    if (q >= 2) { x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0); x.fillStyle = 'rgba(3,5,10,0.55)'; x.fillRect(0, 0, W, H); return; }
    const l = this.lx, lw = this.light.width, lh = this.light.height, k = lw / W;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1; l.fillStyle = 'rgba(3,5,10,0.66)'; l.fillRect(0, 0, lw, lh);
    l.globalCompositeOperation = 'destination-out';
    const sx = (wx) => (W / 2 + (wx - camx) * S) * k, sy = (wy) => (H / 2 + (wy - camy) * S) * k;
    const hole = (wx, wy, r, a) => { const rr = r * S * k; l.globalAlpha = a; l.drawImage(HOLE, sx(wx) - rr, sy(wy) - rr, rr * 2, rr * 2); };
    const h = this.hero; hole(h.x, h.y - 20, 340, 0.96);
    { const rr = 420 * S * k; l.save(); l.translate(sx(h.x), sy(h.y - 20)); l.rotate(h.aim); l.globalAlpha = 0.85; l.drawImage(CONE, 0, -rr * 0.5, rr, rr); l.restore(); }
    for (const z of this.zones) if (z.fire) hole(z.x, z.y, z.r * 2.4, 0.9);
    for (const b of this.ebul) hole(b.x, b.y, 70, 0.7);
    if (q < 1) {
      const C = 520; for (let cx = Math.floor((camx - W / 2 / S) / C) - 1; cx <= Math.floor((camx + W / 2 / S) / C) + 1; cx++) for (let cy = Math.floor((camy - H / 2 / S) / C) - 1; cy <= Math.floor((camy + H / 2 / S) / C) + 1; cy++) for (const p of this.props_at(cx, cy)) if (p.t === 'prop_lamp' || p.t === 'prop_pumpkin') hole(p.x, p.y - (p.t === 'prop_lamp' ? 120 : 14), p.t === 'prop_lamp' ? 210 : 90, p.t === 'prop_lamp' ? 0.85 : 0.6);
    }
    for (const e of this.enemies) if (e.def.boss) hole(e.x, e.y - 60, 280, 0.8);
    l.globalAlpha = 1; x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(this.light, 0, 0, this.cv.width, this.cv.height);
    if (q < 1) { x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'soft-light'; const gg = x.createRadialGradient(this.cv.width / 2, this.cv.height / 2, 0, this.cv.width / 2, this.cv.height / 2, Math.hypot(this.cv.width, this.cv.height) / 2); gg.addColorStop(0, 'rgba(255,196,120,0.30)'); gg.addColorStop(1, 'rgba(40,90,150,0.55)'); x.fillStyle = gg; x.fillRect(0, 0, this.cv.width, this.cv.height); x.globalCompositeOperation = 'source-over'; }
    if (q < 1) { x.globalCompositeOperation = 'lighter'; x.globalAlpha = 0.10; const T = this.fogT; for (let i = 0; i < 4; i++) { const fx = ((i * 0.31 + T * 0.012 * (1 + i * 0.3)) % 1.3 - 0.15) * this.cv.width, fy = (0.2 + i * 0.22 + Math.sin(T * 0.2 + i) * 0.05) * this.cv.height, sz = this.cv.width * 0.7; x.drawImage(FOG, fx - sz / 2, fy - sz / 2, sz, sz * 0.7); } x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; }
  }
}
