// Loads the painted art; anything missing gets a simple stand-in so the game always runs.
const IMG = {}, SCALED = {}, FLASH = new WeakMap();
const NAMES = ['hero_f_1', 'hero_f_2', 'hero_m_1', 'hero_m_2', 'en_ghost_1', 'en_ghost_2', 'en_ghoul_1', 'en_ghoul_2', 'en_crow_1', 'en_crow_2', 'en_child_1', 'en_child_2', 'en_brute_1', 'en_brute_2', 'boss_gravekeeper_1', 'boss_gravekeeper_2',
  'prop_tomb1', 'prop_tomb2', 'prop_tomb3', 'prop_tree', 'prop_lamp', 'prop_car', 'prop_fence', 'prop_pumpkin', 'prop_bush',
  'cr_elec_f', 'cr_elec_m', 'cr_plumb_f', 'cr_plumb_m', 'cr_cook_f', 'cr_cook_m', 'cr_mech_f', 'cr_mech_m', 'cr_med_f', 'cr_med_m', 'cr_weap_f', 'cr_weap_m', 'cr_trade_f', 'cr_trade_m', 'cr_scout_f', 'cr_scout_m', 'cr_faith_f', 'cr_faith_m',
  'en_spitter_1', 'en_spitter_2', 'en_hound_1', 'en_hound_2', 'en_drowned_1', 'en_drowned_2', 'en_crawler_1', 'en_crawler_2', 'en_cultist_1', 'en_cultist_2', 'en_wraithlord_1', 'en_wraithlord_2', 'boss_houndmaster_1', 'boss_houndmaster_2', 'boss_bride_1', 'boss_bride_2', 'boss_surgeon_1', 'boss_surgeon_2', 'boss_boneking_1', 'boss_boneking_2', 'boss_priest_1', 'boss_priest_2',
  'icon_knife', 'icon_machete', 'icon_axe', 'icon_bat', 'icon_crowbar', 'icon_pistol', 'icon_revolver', 'icon_smg', 'icon_shotgun', 'icon_rifle', 'icon_jacket', 'icon_vest', 'icon_helmet', 'icon_boots', 'icon_charm', 'icon_relic', 'icon_flashlight', 'icon_medkit', 'icon_ammo', 'icon_gloves'];
export const TEX = {};
function load(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); }
export async function loadArt(onProgress) {
  let done = 0; const total = NAMES.length + 2;
  await Promise.all([...NAMES.map(async (n) => { IMG[n] = await load(`art/${n}.png`); onProgress && onProgress(++done / total); }),
    ...['tex_ground', 'tex_road'].map(async (n) => { TEX[n] = await load(`art/${n}.jpg`); onProgress && onProgress(++done / total); })]);
}
function hue(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; }
function standIn(name, h) {
  const w = Math.round(h * (name.startsWith('icon_') || name.startsWith('prop_') ? 1 : 0.6)), c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const col = `hsl(${hue(name)} 35% ${name.startsWith('en_ghost') || name.startsWith('en_child') ? 78 : 42}%)`;
  x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.6)'; x.lineWidth = 2;
  if (name.startsWith('icon_')) { x.beginPath(); x.roundRect(4, 4, w - 8, h - 8, 10); x.fill(); x.stroke(); x.fillStyle = '#111'; x.font = `700 ${h * 0.4}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(name.slice(5, 7).toUpperCase(), w / 2, h / 2); }
  else if (name.startsWith('prop_')) { x.fillRect(w * 0.3, h * 0.2, w * 0.4, h * 0.7); x.strokeRect(w * 0.3, h * 0.2, w * 0.4, h * 0.7); }
  else { x.beginPath(); x.ellipse(w / 2, h * 0.3, w * 0.3, h * 0.2, 0, 0, 7); x.fill(); x.beginPath(); x.roundRect(w * 0.2, h * 0.45, w * 0.6, h * 0.5, 8); x.fill(); x.stroke(); x.fillStyle = '#c33'; x.fillRect(w * 0.36, h * 0.27, 5, 5); x.fillRect(w * 0.58, h * 0.27, 5, 5); }
  return c;
}
// a copy of the picture scaled to height h (cached), so thousands of draws stay cheap
export function spr(name, h) {
  h = Math.round(h); const key = name + '@' + h; if (SCALED[key]) return SCALED[key];
  const src = IMG[name] || IMG[name + '_1'];
  let c;
  if (!src) c = standIn(name, h);
  else { c = document.createElement('canvas'); c.height = h; c.width = Math.max(1, Math.round(src.width * h / src.height)); const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(src, 0, 0, c.width, c.height); }
  return (SCALED[key] = c);
}
export function sprite(name, variant, h) { const n = IMG[`${name}_${variant}`] ? `${name}_${variant}` : (IMG[name + '_1'] ? name + '_1' : name); return spr(n, h); }
// white silhouette for hit flashes
export function flashOf(c) { let f = FLASH.get(c); if (f) return f; f = document.createElement('canvas'); f.width = c.width; f.height = c.height; const x = f.getContext('2d'); x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, f.width, f.height); FLASH.set(c, f); return f; }
export const hasArt = (n) => !!IMG[n] || !!IMG[n + '_1'];
export const iconUrl = (n) => (IMG['icon_' + n] ? IMG['icon_' + n].src : '');

// ---- pre-made sprites so the per-frame drawing never builds gradients or paths ----
const mkc = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const GLOWS = {};
export function glow(col, size = 64) { const k = col + size; if (GLOWS[k]) return GLOWS[k]; const c = mkc(size, size), x = c.getContext('2d'), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2); g.addColorStop(0, col); g.addColorStop(0.35, col + '99'); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, size, size); return (GLOWS[k] = c); }
export const SHADOW = (() => { const c = mkc(64, 24), x = c.getContext('2d'), g = x.createRadialGradient(32, 12, 2, 32, 12, 30); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.save(); x.scale(1, 0.4); x.fillStyle = g; x.fillRect(0, 0, 64, 60); x.restore(); return c; })();
const FLIP = new WeakMap();
export function flipped(c) { let f = FLIP.get(c); if (f) return f; f = mkc(c.width, c.height); const x = f.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); FLIP.set(c, f); return f; }
const diamond = (col) => { const c = mkc(14, 14), x = c.getContext('2d'); x.fillStyle = col; x.strokeStyle = 'rgba(0,0,0,.6)'; x.beginPath(); x.moveTo(7, 1); x.lineTo(12, 7); x.lineTo(7, 13); x.lineTo(2, 7); x.closePath(); x.fill(); x.stroke(); x.fillStyle = 'rgba(255,255,255,.55)'; x.fillRect(5, 4, 2, 2); return c; };
export const GEM = { g: diamond('#7dff9a'), b: diamond('#6bd0ff'), p: diamond('#ff6bd6') };
export const GOLD = (() => { const c = mkc(12, 12), x = c.getContext('2d'); x.fillStyle = '#ffd24a'; x.strokeStyle = '#7a5a00'; x.beginPath(); x.arc(6, 6, 5, 0, 7); x.fill(); x.stroke(); x.fillStyle = '#fff3b0'; x.fillRect(4, 3, 2, 2); return c; })();
export const KNIFE = (() => { const c = mkc(40, 12), x = c.getContext('2d'); x.fillStyle = 'rgba(160,200,255,.5)'; x.fillRect(0, 5, 18, 2); x.fillStyle = '#e8f2ff'; x.beginPath(); x.moveTo(36, 6); x.lineTo(16, 2); x.lineTo(19, 6); x.lineTo(16, 10); x.fill(); return c; })();
export const AXE = (() => { const c = mkc(34, 34), x = c.getContext('2d'); x.translate(17, 17); x.fillStyle = '#8a5a30'; x.fillRect(-14, -2, 20, 4); x.fillStyle = '#d7dde6'; x.beginPath(); x.arc(0, 0, 14, -1.1, 1.1); x.lineTo(2, 0); x.fill(); return c; })();
export const HOLE = (() => { const c = mkc(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 6, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
export const CONE = (() => { const c = mkc(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(0, 128, 8, 0, 128, 256); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.beginPath(); x.moveTo(0, 128); x.arc(0, 128, 256, -0.42, 0.42); x.closePath(); x.fill(); return c; })();

const blob = (r, g, b, n) => { const c = mkc(64, 64), x = c.getContext('2d'); for (let i = 0; i < n; i++) { const px = 32 + (Math.random() - 0.5) * 36, py = 32 + (Math.random() - 0.5) * 36, rr = 3 + Math.random() * 10, gr = x.createRadialGradient(px, py, 0, px, py, rr); gr.addColorStop(0, `rgba(${r},${g},${b},.75)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = gr; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill(); } return c; };
export const SPLAT = { r: [blob(80, 12, 14, 9), blob(70, 10, 12, 7), blob(90, 16, 18, 8)], g: [blob(60, 140, 120, 8), blob(50, 120, 110, 7), blob(70, 150, 130, 9)] };
export const LEAF = [0, 1, 2].map((i) => { const c = mkc(12, 8), x = c.getContext('2d'); x.fillStyle = ['#5a3a22', '#4a3018', '#6a4a26'][i]; x.beginPath(); x.ellipse(6, 4, 5, 2.5, 0.4 * i, 0, 7); x.fill(); return c; });
export const FOG = (() => { const c = mkc(256, 256), x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, 'rgba(170,190,215,.55)'); g.addColorStop(1, 'rgba(170,190,215,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256); return c; })();
export const FLARE = (() => { const c = mkc(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,245,200,1)'); g.addColorStop(0.25, 'rgba(255,200,90,.8)'); g.addColorStop(1, 'rgba(255,140,40,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return c; })();

// ---- pre-baked animation frames: the flat painting is bent a little differently in each frame (done once at load) ----
const FR = {};
function bake(src, kind, n) {
  const w = src.width, h = src.height, pad = Math.round(h * 0.06), out = [];
  for (let f = 0; f < n; f++) {
    const ph = f / n * Math.PI * 2, c = mkc(w + pad * 2, h + pad * 2), x = c.getContext('2d');
    if (kind === 'ghost') { // cloth sway: the hem swings, the body stretches a little
      for (let y = 0; y < h; y++) { const k = y / h, dx = Math.sin(ph + y / 11) * 5 * Math.pow(k, 1.3) + Math.sin(ph * 2 + y / 23) * 1.5 * k; x.drawImage(src, 0, y, w, 1, pad + dx, pad + y * (1 + Math.sin(ph) * 0.015), w, 1.2); }
    } else if (kind === 'flap') { // wings beat: stretch up/down and shear
      const sy = 1 + Math.sin(ph) * 0.12; for (let xx = 0; xx < w; xx += 2) { const k = Math.abs(xx - w / 2) / (w / 2), dy = -Math.sin(ph) * 7 * k; x.drawImage(src, xx, 0, 2, h, pad + xx, pad + dy + h * (1 - sy) * 0.5, 2, h * sy); }
    } else { // walk / idle: torso sways, hips shift, feet alternate lifting
      const idle = kind === 'idle', amp = idle ? 0.35 : 1, bob = Math.abs(Math.sin(ph / 2 * (idle ? 1 : 2))) * (idle ? 1.5 : 3.5) * -1;
      for (let y = 0; y < h; y++) {
        const k = y / h, lower = Math.max(0, (k - 0.62) / 0.38), dx = Math.sin(ph) * 2.2 * amp * (1 - k) + Math.sin(ph) * 3 * amp * lower;
        if (lower > 0 && !idle) { // legs: left half and right half lift in turn
          const half = w / 2; x.drawImage(src, 0, y, half, 1, pad + dx, pad + y + bob + Math.sin(ph) * 3.2 * lower, half, 1.2); x.drawImage(src, half, y, w - half, 1, pad + half + dx, pad + y + bob - Math.sin(ph) * 3.2 * lower, w - half, 1.2);
        } else x.drawImage(src, 0, y, w, 1, pad + dx, pad + y + bob, w, 1.2);
      }
    }
    out.push(c);
  }
  return out;
}
// frames for a picture at height h; kind = ghost | flap | walk | idle
export function frames(name, variant, h, kind) {
  const base = sprite(name, variant, h), key = `${name}|${variant}|${h}|${kind}`; if (FR[key]) return FR[key];
  const n = kind === 'walk' ? 8 : kind === 'idle' ? 6 : 8;
  return (FR[key] = bake(base, kind, n));
}
export const FRAME_PAD = (h) => Math.round(h * 0.06);

export const PUDDLE = (() => { const c = mkc(96, 40), x = c.getContext('2d'); const g = x.createRadialGradient(48, 20, 2, 48, 20, 46); g.addColorStop(0, 'rgba(40,60,90,.75)'); g.addColorStop(0.7, 'rgba(25,38,60,.55)'); g.addColorStop(1, 'rgba(25,38,60,0)'); x.save(); x.scale(1, 0.42); x.fillStyle = g; x.fillRect(0, 0, 96, 96); x.restore(); x.fillStyle = 'rgba(190,210,240,.35)'; x.beginPath(); x.ellipse(40, 16, 14, 2.2, 0, 0, 7); x.fill(); return c; })();
export const TUFT = [0, 1, 2].map((i) => { const c = mkc(22, 20), x = c.getContext('2d'); x.strokeStyle = ['#2b3a22', '#33432a', '#25301c'][i]; x.lineWidth = 1.6; for (let k = 0; k < 7; k++) { x.beginPath(); x.moveTo(11 + (k - 3) * 1.5, 19); x.quadraticCurveTo(11 + (k - 3) * 3, 9, 11 + (k - 3) * 4.5 + (i - 1) * 3, 2 + (k % 3) * 2); x.stroke(); } return c; });
export const PATCH = ['#1a2a18', '#2a1a2e', '#101c28'].map((col) => glow(col, 128));
