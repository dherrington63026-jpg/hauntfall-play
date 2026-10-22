import { loadSave, newSave, writeSave, makeItem } from './data.js';
import { loadArt } from './art.js';
import { Run } from './game.js';
import { UI } from './ui.js';
import { Music } from './music.js';

const $ = (s) => document.querySelector(s), cv = $('#cv');
const S = loadSave() || newSave();
let run = null, last = 0;
function start(o = {}) {
  UI.stopAfkTimer(); UI.hideAll(); if (run) run.destroy();
  run = new Run(S, cv, UI, { afk: S.opts.afk, ...o }); UI.showHud(); Music.play(o.mode === 'haunt' || o.mode === 'rush' ? 'boss' : 'explore');
  window.__run = run;
}
const spd = () => (S.opts.speed == null ? 0.75 : S.opts.speed);
function syncAudio() { for (const b of document.querySelectorAll('#pause [data-mu]')) b.classList.toggle('on', b.dataset.mu === 'music' ? S.opts.music !== false : S.opts.sound !== false); }
function syncSpeed() { syncAudio(); for (const b of document.querySelectorAll('#pause [data-sp]')) b.classList.toggle('on', Math.abs(+b.dataset.sp - spd()) < 0.01); }
function pause() { if (!run || run.over) return; run.paused = true; syncSpeed(); $('#pause').classList.add('on'); }
$('#pause').addEventListener('click', (e) => {
  const mu = e.target.closest('[data-mu]'); if (mu) { if (mu.dataset.mu === 'music') { S.opts.music = S.opts.music === false; Music.setOn(S.opts.music !== false); } else { S.opts.sound = S.opts.sound === false; if (run) run.sound = S.opts.sound !== false; } writeSave(S); syncAudio(); return; }
  const sp = e.target.closest('[data-sp]'); if (sp) { S.opts.speed = +sp.dataset.sp; writeSave(S); syncSpeed(); return; }
  const b = e.target.closest('[data-pa]'); if (!b) return; $('#pause').classList.remove('on');
  if (b.dataset.pa === 'resume') { if (run) run.paused = false; } else if (run) { run.retreat(); }
});
Music.init(S);
UI.init(S, { start: () => start(), startMode: (m) => start({ mode: m, afk: false }), startHaunt: () => { const H = S.base.haunt && S.base.haunt.active; if (H) start({ mode: 'haunt', strength: H.strength }); }, pause, run: () => run, makeDrop: () => makeItem(S, 1 + S.maxDistrict * 2, Math.random() < 0.25 ? 2 : Math.random() < 0.6 ? 1 : 0) });
let ema = 16.7, slow = 0;
function frame(t) {
  requestAnimationFrame(frame); const raw = Math.min(250, (t - last) || 16.7); last = t;
  if (run) {
    if (run.over) { run = null; } else {
      // keep game speed right even on a slow phone: several small steps instead of one big one
      let rem = Math.min(0.1, raw / 1000) * spd(); while (rem > 0.0001) { const st = Math.min(rem, 0.034); run.update(st); rem -= st; if (run.over || run.paused) break; }
      if (!run.over) run.draw();
      // slow phone? quietly lower the graphics a notch instead of stuttering
      if (!run.paused) { ema += (raw - ema) * 0.05; if (ema > 26) slow += raw; else slow = Math.max(0, slow - raw); if (slow > 2000 && run.q < 3) { run.setQuality(run.q + 1); slow = 0; ema = 16.7; } }
    }
  } else { const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#06080b'; x.fillRect(0, 0, cv.width, cv.height); }
}
(async () => {
  cv.width = innerWidth; cv.height = innerHeight;
  await loadArt((f) => { $('#loadMsg').textContent = `Waking the dead... ${Math.round(f * 100)}%`; });
  $('#loading').classList.add('off');
  requestAnimationFrame(frame);
  const q = new URLSearchParams(location.search);
  if (q.get('run')) { S.hero = S.hero || 'f'; if (q.get('afk')) S.opts.afk = true; start(); }
  else if (S.runs === 0 && !S.heroPicked) UI.heroPick(() => { S.heroPicked = true; writeSave(S); UI.camp(); });
  else UI.camp();
})();
window.__S = S;
