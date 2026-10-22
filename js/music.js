// Background music: three seamless loops that crossfade. Browsers only allow sound after a tap, so it starts on the first touch.
const TRACKS = { explore: 'audio/explore.mp3', boss: 'audio/boss.mp3', camp: 'audio/camp.mp3' };
const el = {};
let cur = null, want = null, on = true, unlocked = false, vol = 0.5, timer = null;

const get = (n) => { if (!el[n]) { const a = new Audio(TRACKS[n]); a.loop = true; a.preload = 'auto'; a.volume = 0; el[n] = a; } return el[n]; };
function tick() {
  let busy = false;
  for (const n in el) {
    const a = el[n], target = n === cur ? vol : 0, d = target - a.volume;
    if (Math.abs(d) > 0.01) { a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(d) * 0.03)); busy = true; } else { a.volume = target; if (target === 0 && !a.paused) a.pause(); }
  }
  if (!busy) { clearInterval(timer); timer = null; }
}
function fadeTo(n) {
  cur = n; if (n) { const a = get(n); if (a.paused) { const p = a.play(); if (p && p.catch) p.catch(() => {}); } }
  if (!timer) timer = setInterval(tick, 50);
}
const unlock = () => { if (unlocked) return; unlocked = true; if (on && want) fadeTo(want); };
export const Music = {
  init(S) { on = S.opts.music !== false; vol = S.opts.musicVol == null ? 0.5 : S.opts.musicVol; addEventListener('pointerdown', unlock, { once: false }); addEventListener('keydown', unlock);
    document.addEventListener('visibilitychange', () => { for (const n in el) { if (document.hidden) el[n].pause(); else if (n === cur && on) { const p = el[n].play(); if (p && p.catch) p.catch(() => {}); } } }); },
  play(n) { want = n; if (!on || !unlocked || cur === n) return; fadeTo(n); },
  setOn(v) { on = !!v; if (!on) fadeTo(null); else if (want) { cur = null; fadeTo(want); } },
  isOn: () => on,
};
