// A single Hauntfall run: movement, auto-weapons, swarm, loot, level-ups, boss. Drawn on a canvas, HUD lives in the DOM (ui.js).
import { rnd, rint, pick, clamp, ENEMIES, WEAPONS, UPGRADES, RARITIES, heroStats, makeItem } from './data.js';
import { spr, sprite, flashOf, flipped, glow, SHADOW, GEM, GOLD, KNIFE, AXE, HOLE, CONE, SPLAT, LEAF, FOG, FLARE, PUDDLE, TUFT, PATCH, frames, FRAME_PAD, TEX } from './art.js';
const WEAPON_LEN = { knife: 14, machete: 26, axe: 22, bat: 28, crowbar: 26, pistol: 16, revolver: 18, smg: 24, shotgun: 32, rifle: 38 };
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
    this.S = S; this.cv = canvas; this.x = canvas.getContext('2d'); this.ui = ui; this.afk = !!opts.afk; this.sound = S.opts.sound !== false;
    this.hs = heroStats(S); this.district = S.district;
    this.t = 0; this.over = false; this.paused = false; this.shake = 0; this.kills = 0; this.gold = 0; this.xp = 0; this.level = 1; this.xpNeed = this.needFor(1);
    this.hero = { x: 0, y: 0, hp: this.hs.hp, face: 1, inv: 0, flash: 0, vx: 0, vy: 0, aim: 0, bob: 0 };
    this.maxHp = this.hs.hp; this.dmgMul = 1; this.rateMul = 1; this.extraN = 0; this.extraPierce = 0; this.speedMul = 1; this.magnetMul = 1; this.regen = this.hs.regen; this.crit = this.hs.crit; this.luckMul = 1;
    this.salt = 0; this.beam = 0; this.fire = 0; this.picked = {};
    this.decals = []; this.fogT = 0; this.punch = 0; this.enemies = []; this.bullets = []; this.gems = []; this.loot = []; this.fx = []; this.texts = []; this.ebul = []; this.zones = []; this.drops = [];
    this.cool = 0; this.spawnAcc = 0; this.nextElite = 90; this.bossOut = false; this.boss = null; this.won = false; this.lootItems = []; this.waveTick = 0;
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
    for (const d of this.decals) d.t += dt; if (this.decals.length && this.decals[0].t > this.decals[0].life) this.decals.shift();
    if (this.regen > 0) h.hp = Math.min(this.maxHp, h.hp + this.regen * dt);
    // director
    this.direct(dt);
    this.buildGrid();
    this.updateEnemies(dt);
    this.updateWeapons(dt);
    this.updateBullets(dt);
    this.updatePassives(dt);
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
    if (t >= RUN_LEN && !this.bossOut) { this.spawnBoss(); }
    if (!this.bossOut) {
      const rate = (0.8 + t / 48) * (1 + 0.4 * (this.district - 1)); this.spawnAcc += rate * dt;
      const cap = 70 + Math.min(120, t * 0.45);
      while (this.spawnAcc >= 1 && this.enemies.length < cap) { this.spawnAcc -= 1; this.spawnOne(); }
      if (this.spawnAcc > 3) this.spawnAcc = 3;
      if (t >= this.nextElite && this.nextElite < RUN_LEN) { this.spawnOne('brute'); this.nextElite += 90; this.ui.toast('A Butcher is hunting you!'); sfx('boom', this.sound); this.shake = 0.5; }
    }
  }
  spawnPos() { const a = rnd(0, TAU), R = Math.hypot(this.sw, this.sh) / 2 / this.scale + 70; return [this.hero.x + Math.cos(a) * R, this.hero.y + Math.sin(a) * R]; }
  spawnOne(type) {
    const t = this.t;
    if (!type) { const r = Math.random(); type = t < 40 ? (r < 0.65 ? 'ghost' : 'child') : t < 90 ? (r < 0.4 ? 'ghost' : r < 0.65 ? 'ghoul' : 'child') : (r < 0.3 ? 'ghoul' : r < 0.5 ? 'ghost' : r < 0.7 ? 'crow' : r < 0.85 ? 'child' : 'ghoul'); }
    const def = ENEMIES[type], [x, y] = this.spawnPos(), sc = (1 + t / 150) * Math.pow(1.95, this.district - 1);
    this.enemies.push({ def, x, y, hp: def.hp * sc, maxHp: def.hp * sc, dmg: def.dmg * (1 + t / 260) * Math.pow(1.4, this.district - 1), r: def.r, vx: 0, vy: 0, flash: 0, ph: rnd(0, TAU), v: rint(1, 2), dash: rnd(1, 3), age: 0, face: 1, cd: rnd(2, 4) });
    return this.enemies[this.enemies.length - 1];
  }
  spawnBoss() {
    this.bossOut = true; for (const e of this.enemies) if (!e.def.boss) e.hp = Math.min(e.hp, 1);
    const def = ENEMIES.gravekeeper, sc = Math.pow(2.1, this.district - 1), a = rnd(0, TAU), R = 460;
    const b = { def, x: this.hero.x + Math.cos(a) * R, y: this.hero.y + Math.sin(a) * R, hp: def.hp * sc, maxHp: def.hp * sc, dmg: def.dmg * Math.pow(1.4, this.district - 1), r: def.r, vx: 0, vy: 0, flash: 0, ph: 0, v: 1, dash: 0, age: 0, face: 1, cd: 3, cd2: 5, slam: 0 };
    this.enemies.push(b); this.boss = b; this.ui.toast('THE GRAVEKEEPER RISES'); this.ui.bossBar(true); this.shake = 1; sfx('boom', this.sound);
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
      if (fxk === 'ghost') { const w = Math.sin(e.age * 2.2 + e.ph) * 0.7; mx = dx - dy * w; my = dy + dx * w; }
      else if (fxk === 'swoop') { e.dash -= dt; if (e.dash < 0) { e.dash = rnd(1.6, 2.8); e.dashT = 0.45; } if (e.dashT > 0) { e.dashT -= dt; sp *= 2.4; } else sp *= 0.55; const w = Math.sin(e.age * 5 + e.ph) * 0.6; mx = dx - dy * w; my = dy + dx * w; }
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
    if (e.cd2 <= 0) { e.cd2 = 6.5; if (d < 260) { e.slam = 0.9; this.zones.push({ x: e.x, y: e.y, r: 150, t: 0.9, tele: true, col: '#ff3b3b' }); } else { for (let i = 0; i < 5; i++) { const a = rnd(0, TAU), ne = this.spawnOne('ghoul'); ne.x = e.x + Math.cos(a) * 80; ne.y = e.y + Math.sin(a) * 80; } this.ui.toast('The dead answer his call'); } }
  }
  ring(x, y, r, dmg) { const h = this.hero; if (Math.hypot(h.x - x, h.y - y) < r + 10) this.hurt(dmg, null); }
  hurt(dmg, from) {
    const h = this.hero; if (h.inv > 0 || this.over) return;
    const taken = dmg * (100 / (100 + this.hs.armor)); h.hp -= taken; h.inv = 0.55; h.flash = 0.2; this.shake = Math.max(this.shake, 0.25); sfx('hurt', this.sound);
    this.text(h.x, h.y - 40, '-' + Math.round(taken), '#ff6a6a', 1); if (this.ui.hurt) this.ui.hurt();
  }
  kill(e) {
    this.kills++; const d = e.def, luck = this.luck();
    this.puff(e.x, e.y, d.fx === 'ghost' ? '#cfe4ff' : '#8a5a5a', d.boss ? 40 : d.elite ? 18 : 6); sfx('kill', this.sound);
    if (this.q < 2) { const gh = d.fx === 'ghost'; if (gh) this.fx.push({ k: 'gf', x: e.x, y: e.y - 16, s: sprite(d.sprite, e.v, d.size), face: e.face, t: 0, life: 0.7 }); else if (this.decals.length < 70) this.decals.push({ x: e.x, y: e.y, t: 0, life: 9, s: pick(SPLAT.r), sc: d.boss ? 3 : d.elite ? 1.8 : 1 }); if (gh && this.decals.length < 70) this.decals.push({ x: e.x, y: e.y, t: 0, life: 6, s: pick(SPLAT.g), sc: 1 }); }
    const xp = d.xp; this.gems.push({ x: e.x + rnd(-6, 6), y: e.y + rnd(-6, 6), v: xp, t: 0 });
    if (Math.random() < 0.22 * luck) this.loot.push({ kind: 'gold', x: e.x + rnd(-14, 14), y: e.y + rnd(-14, 14), v: rint(1, 3) * (1 + this.district), t: 0 });
    if (d.boss) { this.won = true; for (let i = 0; i < 4; i++) this.dropItem(e.x + rnd(-40, 40), e.y + rnd(-40, 40), true, true); this.ui.bossBar(false); this.shake = 1; setTimeout(() => this.end(true), 2200); this.slowmo = 1; }
    else if (d.elite) { for (let i = 0; i < 2; i++) this.dropItem(e.x + rnd(-24, 24), e.y + rnd(-24, 24), true); }
    else if (Math.random() < 0.012 * luck) this.dropItem(e.x, e.y, false);
  }
  dropItem(x, y, good, boss) {
    const t = this.t, r = Math.random(), luck = this.luck();
    // rarity: grows with time and district; elites/bosses roll better
    let w = [60, 28, 9, 2.5, 0.45, 0.05].map((v, i) => v * (i >= 2 ? (1 + t / 200 + 0.18 * (this.district - 1)) * luck : 1));
    if (good) w = [0, 25, 40, 24, 9, 2].map((v, i) => v * (i >= 3 ? luck : 1)); if (boss) w = [0, 0, 24, 40, 28, 8].map((v, i) => v * (i >= 4 ? luck : 1));
    let s = r * w.reduce((a, b) => a + b), rar = 0; while (rar < 5 && s > w[rar]) { s -= w[rar]; rar++; }
    const it = makeItem(this.S, 1 + Math.floor(this.district * 1.2 + t / 150) + (boss ? 2 : 0), rar);
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
    this.cool = W.rate / (this.hs.ratePct * this.rateMul); h.fire = W.shape === 'bullet' ? 0.07 : 0.14; h.recoil = W.shape === 'bullet' ? 5 : 0; if (W.shape === 'bullet' && this.q < 2) this.fx.push({ k: 'p', x: h.x, y: h.y - 40, vx: -Math.sin(h.aim) * 80 + rnd(-20, 20), vy: Math.cos(h.aim) * 80 + rnd(-60, -20), t: 0, life: 0.5, col: '#e8c860', r: 1.5 });
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
      const D = this.dmgOf(); this.bullets.push({ x: mx - sa * lat, y: my + ca * lat, vx: Math.cos(a) * W.speed, vy: Math.sin(a) * W.speed, a, life: W.life, dmg: D.v, crit: D.crit, pierce, hit: new Set(), shape: W.shape, r: W.shape === 'axe' ? 18 : 7, spin: 0 });
    }
    sfx('shoot', this.sound);
  }
  hitEnemy(e, dmg, crit, kb, nx, ny) {
    e.hp -= dmg; e.flash = 0.09; if (this.q < 2 && this.fx.length < 260) { const ghost = e.def.fx === 'ghost'; for (let i = 0; i < (crit ? 5 : 2); i++) { const a = Math.atan2(ny || 0, nx || 1) + rnd(-0.9, 0.9), sp = rnd(120, 260); this.fx.push({ k: 's', x: e.x, y: e.y - e.def.size * 0.45, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t: 0, life: rnd(0.12, 0.25), col: ghost ? '#bfe4ff' : crit ? '#ffe08a' : '#ffb27a' }); } } if (kb) { e.vx += nx * kb * 4; e.vy += ny * kb * 4; }
    this.text(e.x + rnd(-8, 8), e.y - e.def.size * 0.5, Math.round(dmg), crit ? '#ffd84a' : '#ffffff', crit ? 1.5 : 1); sfx('hit', this.sound && Math.random() < 0.3);
    if (e.def.boss) this.ui.bossHp(e.hp / e.maxHp);
  }
  updateBullets(dt) {
    const keep = [];
    for (const b of this.bullets) {
      b.life -= dt; b.x += b.vx * dt; b.y += b.vy * dt; b.spin += dt * 18; if (b.life <= 0) continue;
      let dead = false;
      this.near(b.x, b.y, b.r + 40, (e) => { if (dead || e.hp <= 0 || b.hit.has(e)) return; if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + b.r) { b.hit.add(e); const d = Math.hypot(b.vx, b.vy) || 1; this.hitEnemy(e, b.dmg, b.crit, 40, b.vx / d, b.vy / d); if (b.hit.size > b.pierce) dead = true; } });
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
    for (const l of this.loot) { l.t += dt; const dx = h.x - l.x, dy = h.y - l.y, d = Math.hypot(dx, dy); if (d < mag * 1.2 || l.pull) { l.pull = true; const s = 380 + l.t * 160; l.x += dx / d * s * dt; l.y += dy / d * s * dt; } if (d < 18) { this.collect(l); continue; } nl.push(l); }
    this.loot = nl;
  }
  collect(l) {
    if (l.kind === 'gold') { this.gold += l.v; sfx('coin', this.sound && Math.random() < 0.5); }
    else { this.lootItems.push(l.item); sfx('loot', this.sound); this.ui.lootToast(l.item); }
  }
  addXp(v) { this.xp += v; while (this.xp >= this.xpNeed) { this.xp -= this.xpNeed; this.level++; this.xpNeed = this.needFor(this.level); this.levelUp(); } }
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
      for (let i = 0; i < n; i++) { const q = r(), x = cx * C + r() * C, y = cy * C + r() * C; const t = q < 0.34 ? 'prop_tomb1' : q < 0.5 ? 'prop_tomb2' : q < 0.6 ? 'prop_tomb3' : q < 0.78 ? 'prop_tree' : q < 0.84 ? 'prop_lamp' : q < 0.88 ? 'prop_car' : q < 0.93 ? 'prop_fence' : q < 0.96 ? 'prop_pumpkin' : 'prop_bush'; list.push({ t, x, y, f: r() < 0.5 ? 1 : -1 }); }
    }
    const road = r() < 0.16 ? { h: r() < 0.5, o: Math.floor(r() * 300) } : null, leaves = []; for (let i = 0; i < 9; i++) leaves.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3) });
    const patches = [], puddles = [], tufts = []; for (let i = 0; i < 2; i++) patches.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3), s: 220 + r() * 220 }); if (r() < 0.45) puddles.push({ x: cx * C + 60 + r() * (C - 120), y: cy * C + 60 + r() * (C - 120), s: 70 + r() * 60 }); for (let i = 0; i < 12; i++) tufts.push({ x: cx * C + r() * C, y: cy * C + r() * C, v: Math.floor(r() * 3) });
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
    const tex = TEX.tex_ground;
    if (tex) { if (!this.pat) { this.pat = x.createPattern(tex, 'repeat'); this.pat.setTransform(new DOMMatrix().scale(0.5)); } x.fillStyle = this.pat; } else x.fillStyle = '#1b2220';
    x.fillRect(x0, y0, x1 - x0, y1 - y0);
    // ground dressing: roads, fallen leaves, blood and ectoplasm stains
    for (let cx = Math.floor(x0 / 520) - 1; cx <= Math.floor(x1 / 520) + 1; cx++) for (let cy = Math.floor(y0 / 520) - 1; cy <= Math.floor(y1 / 520) + 1; cy++) {
      this.props_at(cx, cy); const ci = this.cinfo.get(cx + ',' + cy); if (!ci) continue;
      if (q < 2) { x.globalAlpha = 0.5; for (const pa of ci.patches) x.drawImage(PATCH[pa.v], pa.x - pa.s / 2, pa.y - pa.s / 2, pa.s, pa.s); x.globalAlpha = 1; }
      if (ci.road && TEX.tex_road) { if (!this.rpat) { this.rpat = x.createPattern(TEX.tex_road, 'repeat'); this.rpat.setTransform(new DOMMatrix().scale(0.5)); } x.fillStyle = this.rpat; const r = ci.road; if (r.h) { x.fillRect(cx * 520, cy * 520 + r.o, 520, 150); x.fillStyle = 'rgba(210,200,150,.35)'; for (let k = 0; k < 520; k += 70) x.fillRect(cx * 520 + k, cy * 520 + r.o + 73, 38, 4); } else { x.fillRect(cx * 520 + r.o, cy * 520, 150, 520); x.fillStyle = 'rgba(210,200,150,.35)'; for (let k = 0; k < 520; k += 70) x.fillRect(cx * 520 + r.o + 73, cy * 520 + k, 4, 38); } }
      if (this.q < 2) { for (const lf of ci.leaves) x.drawImage(LEAF[lf.v], lf.x, lf.y); for (const tf of ci.tufts) x.drawImage(TUFT[tf.v], tf.x, tf.y); x.globalAlpha = 0.8; for (const pd of ci.puddles) x.drawImage(PUDDLE, pd.x - pd.s / 2, pd.y - pd.s * 0.2, pd.s, pd.s * 0.42); x.globalAlpha = 1; }
    }
    for (const d of this.decals) { const a = Math.min(1, (d.life - d.t) / 2) * 0.75; if (d.x < x0 || d.x > x1 || d.y < y0 || d.y > y1) continue; x.globalAlpha = a; const w = 44 * d.sc; x.drawImage(d.s, d.x - w / 2, d.y - w * 0.3, w, w * 0.6); } x.globalAlpha = 1;
    // things standing on the ground, drawn back to front (list is reused every frame)
    const list = this.dl || (this.dl = []); list.length = 0; const C = 520;
    for (let cx = Math.floor(x0 / C) - 1; cx <= Math.floor(x1 / C) + 1; cx++) for (let cy = Math.floor(y0 / C) - 1; cy <= Math.floor(y1 / C) + 1; cy++) for (const p of this.props_at(cx, cy)) if (p.x > x0 - 100 && p.x < x1 + 100 && p.y > y0 - 120 && p.y < y1 + 200) list.push(p);
    for (const e of this.enemies) if (e.x > x0 - 80 && e.x < x1 + 80 && e.y > y0 - 80 && e.y < y1 + 80) list.push(e);
    list.push(h); list.sort((a, b) => a.y - b.y);
    // gems and loot first (pre-made sprites, no gradients)
    for (const g of this.gems) { const s = g.v >= 5 ? GEM.p : g.v >= 2 ? GEM.b : GEM.g; if (g.x > x0 && g.x < x1 && g.y > y0 && g.y < y1) x.drawImage(s, g.x - 7, g.y - 7); }
    for (const l of this.loot) {
      if (l.x < x0 || l.x > x1 || l.y < y0 || l.y > y1) continue;
      if (l.kind === 'gold') x.drawImage(GOLD, l.x - 6, l.y - 6);
      else { const c = RARITIES[l.item.rar].color; x.globalCompositeOperation = 'lighter'; x.drawImage(glow(c, 96), l.x - 40, l.y - 40, 80, 80); x.fillStyle = c; x.globalAlpha = 0.5; x.fillRect(l.x - 2, l.y - 70, 4, 70); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.fillStyle = c; x.fillRect(l.x - 7, l.y - 7, 14, 14); x.strokeStyle = '#000'; x.lineWidth = 1; x.strokeRect(l.x - 7, l.y - 7, 14, 14); }
    }
    for (const z of this.zones) {
      if (z.tele) { x.fillStyle = `rgba(255,50,50,${0.12 + 0.2 * (1 - z.t / 0.9)})`; x.strokeStyle = '#ff4a4a'; x.lineWidth = 3; x.beginPath(); x.arc(z.x, z.y, z.r, 0, TAU); x.fill(); x.stroke(); }
      else { x.globalCompositeOperation = 'lighter'; const r = z.r * (0.95 + Math.sin(this.t * 14) * 0.05); x.drawImage(glow('#ff8a2a', 128), z.x - r * 1.2, z.y - r * 1.2, r * 2.4, r * 2.4); x.globalCompositeOperation = 'source-over'; }
    }
    for (let i = 0; i < list.length; i++) { const o = list[i]; if (o === h) this.drawHero(x); else if (o.def) this.drawEnemy(x, o); else this.drawProp(x, o); }
    // bullets and effects (additive)
    x.globalCompositeOperation = 'lighter';
    for (const b of this.bullets) {
      if (b.shape === 'bullet') { x.strokeStyle = b.crit ? '#ffd84a' : '#ffe9a0'; x.lineWidth = 3; x.beginPath(); x.moveTo(b.x, b.y); x.lineTo(b.x - Math.cos(b.a) * 26, b.y - Math.sin(b.a) * 26); x.stroke(); }
      else if (b.shape === 'knife') { const c = Math.cos(b.a), s = Math.sin(b.a); x.setTransform(dpr * S * c, dpr * S * s, -dpr * S * s, dpr * S * c, dpr * (W / 2 - camx * S + ox) + dpr * S * (b.x * 1), dpr * (H / 2 - camy * S + oy) + dpr * S * b.y); x.drawImage(KNIFE, -22, -6); x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy)); }
      else if (b.shape === 'axe') { const c = Math.cos(b.spin), s = Math.sin(b.spin); x.setTransform(dpr * S * c, dpr * S * s, -dpr * S * s, dpr * S * c, dpr * (W / 2 - camx * S + ox) + dpr * S * b.x, dpr * (H / 2 - camy * S + oy) + dpr * S * b.y); x.drawImage(AXE, -16, -16); x.setTransform(dpr * S, 0, 0, dpr * S, dpr * (W / 2 - camx * S + ox), dpr * (H / 2 - camy * S + oy)); }
    }
    for (const b of this.ebul) x.drawImage(glow('#5dff7a', 64), b.x - 15, b.y - 15, 30, 30);
    if (this.salt > 0) { const n = 1 + this.salt, R = 78 + this.salt * 6, gs = glow('#c8e6ff', 64); for (let i = 0; i < n; i++) { const a = this.saltAng + i * TAU / n, px = h.x + Math.cos(a) * R, py = h.y + Math.sin(a) * R; x.drawImage(gs, px - 20, py - 20, 40, 40); x.fillStyle = '#fff'; x.fillRect(px - 5, py - 5, 10, 10); } }
    for (const f of this.fx) {
      if (f.k === 'slash') { const k = f.t / f.life; x.strokeStyle = `rgba(255,255,255,${1 - k})`; x.lineWidth = 10 * (1 - k) + 2; x.beginPath(); x.arc(f.x, f.y - 10, f.r * (0.7 + 0.3 * k), f.a - f.arc / 2, f.a + f.arc / 2); x.stroke(); }
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
  drawProp(x, p) {
    const s0 = spr(p.t, PROP_H[p.t] || 74), s = p.f < 0 ? flipped(s0) : s0;
    x.drawImage(SHADOW, p.x - s.width * 0.4, p.y - 8, s.width * 0.8, 16); x.drawImage(s, p.x - s.width / 2, p.y - s.height);
  }
  drawEnemy(x, e) {
    const d = e.def, ghost = d.fx === 'ghost', bob = Math.sin(e.age * (ghost ? 3 : 7) + e.ph) * (ghost ? 6 : 2.5), lift = ghost ? 16 : d.fx === 'swoop' ? 26 : 0;
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
    const len = WEAPON_LEN[K] || 16, gun = Wp.shape === 'bullet';
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
