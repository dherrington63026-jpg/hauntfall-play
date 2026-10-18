import { loadSave, newSave, writeSave, makeItem } from './data.js';
import { loadArt } from './art.js';
import { Run } from './game.js';
import { UI } from './ui.js';

const $ = (s) => document.querySelector(s), cv = $('#cv');
const S = loadSave() || newSave();
let run = null, last = 0;
function start() {
  UI.stopAfkTimer(); UI.hideAll(); if (run) run.destroy();
  run = new Run(S, cv, UI, { afk: S.opts.afk }); UI.showHud();
  window.__run = run;
}
function pause() { if (!run || run.over) return; run.paused = true; $('#pause').classList.add('on'); }
$('#pause').addEventListener('click', (e) => {
  const b = e.target.closest('[data-pa]'); if (!b) return; $('#pause').classList.remove('on');
  if (b.dataset.pa === 'resume') { if (run) run.paused = false; } else if (run) { run.destroy(); run = null; UI.hideAll(); UI.camp(); }
});
UI.init(S, { start, pause, run: () => run, makeDrop: () => makeItem(S, 1 + S.maxDistrict * 2, Math.random() < 0.25 ? 2 : Math.random() < 0.6 ? 1 : 0) });
function frame(t) {
  requestAnimationFrame(frame); const dt = Math.min(0.05, (t - last) / 1000 || 0.016); last = t;
  if (run) { if (run.over) { run = null; } else { run.update(dt); run.draw(); } }
  else { const x = cv.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#06080b'; x.fillRect(0, 0, cv.width, cv.height); }
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
