// Loads the painted art; anything missing gets a simple stand-in so the game always runs.
const IMG = {}, SCALED = {}, FLASH = new WeakMap();
const NAMES = ['hero_f_1', 'hero_f_2', 'hero_m_1', 'hero_m_2', 'en_ghost_1', 'en_ghost_2', 'en_ghoul_1', 'en_ghoul_2', 'en_crow_1', 'en_crow_2', 'en_child_1', 'en_child_2', 'en_brute_1', 'en_brute_2', 'boss_gravekeeper_1', 'boss_gravekeeper_2',
  'prop_tomb1', 'prop_tomb2', 'prop_tomb3', 'prop_tree', 'prop_lamp', 'prop_car', 'prop_fence', 'prop_pumpkin', 'prop_bush',
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
