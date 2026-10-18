// Hauntfall screens and HUD (plain DOM over the canvas).
import { RARITIES, SLOTS, SLOT_NAME, STAT_LABEL, PCT, WEAPONS, heroStats, itemStat, itemScore, upCost, salvageValue, idlePreview, autoEquip, writeSave, IDLE_CAP_MIN } from './data.js';
import { iconUrl } from './art.js';

const $ = (s) => document.querySelector(s);
export const UI = {};
let S = null, cb = {};
UI.init = (save, callbacks) => { S = save; cb = callbacks; bindStatic(); };
const save = () => writeSave(S);
const fmtStat = (k, v) => (PCT.has(k) ? '+' + Math.round(v * 100) + '%' : k === 'regen' ? '+' + v.toFixed(1) : '+' + Math.round(v));
const fmtTime = (m) => { m = Math.floor(m); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const icon = (it) => { const u = iconUrl(it.icon); return u ? `<img src="${u}" alt="">` : `<span class="noimg">${it.icon.slice(0, 2).toUpperCase()}</span>`; };
const cardHtml = (it, extra = '') => `<button class="itc r${it.rar}" data-item="${it.id}" style="--r:${RARITIES[it.rar].color}">${icon(it)}${it.up ? `<em>+${it.up}</em>` : ''}${extra}</button>`;

function bindStatic() {
  $('#btnAfk').onclick = () => UI.toggleAfk();
  $('#btnPause').onclick = () => cb.pause();
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; handle(b.dataset.act, b.dataset); });
}
UI.toggleAfk = () => { S.opts.afk = !S.opts.afk; save(); if (cb.run()) cb.run().afk = S.opts.afk; syncAfk(); };
function syncAfk() { const b = $('#btnAfk'); b.classList.toggle('on', !!S.opts.afk); b.textContent = S.opts.afk ? 'AFK ON' : 'AFK'; }
UI.syncAfk = syncAfk;

// ---------- HUD ----------
let lastHud = 0;
UI.hud = (r) => {
  const now = performance.now(); if (now - lastHud < 50) return; lastHud = now;
  $('#hpFill').style.width = Math.max(0, r.hero.hp / r.maxHp * 100) + '%'; $('#hpText').textContent = `${Math.ceil(Math.max(0, r.hero.hp))} / ${r.maxHp}`;
  $('#xpFill').style.width = (r.xp / r.xpNeed * 100) + '%'; $('#lvl').textContent = r.level;
  const t = Math.max(0, Math.floor(r.bossOut ? r.t - 300 : 300 - r.t)); $('#timer').textContent = r.bossOut ? 'BOSS' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('#gold').textContent = r.gold; $('#kills').textContent = r.kills;
};
UI.toast = (msg) => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); };
UI.lootToast = (it) => { const d = document.createElement('div'); d.className = 'toast loot'; d.style.setProperty('--r', RARITIES[it.rar].color); d.innerHTML = `${icon(it)}<span>${it.name}</span>`; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2600); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); };
UI.bossBar = (on) => { $('#bossbar').classList.toggle('on', on); if (on) $('#bossFill').style.width = '100%'; };
UI.bossHp = (f) => { $('#bossFill').style.width = Math.max(0, f * 100) + '%'; };
UI.joyShow = (x, y) => { const j = $('#joy'); j.style.left = x + 'px'; j.style.top = y + 'px'; j.classList.add('on'); $('#joy i').style.transform = ''; };
UI.joyMove = (dx, dy) => { $('#joy i').style.transform = `translate(${dx * 46}px, ${dy * 46}px)`; };
UI.joyHide = () => $('#joy').classList.remove('on');
UI.levelUp = (choices, pick) => {
  const o = $('#levelup'); o.classList.add('on');
  o.querySelector('.cards').innerHTML = choices.map((u, i) => `<button class="up ${u.weapon ? 'wep' : ''}" data-i="${i}"><b>${u.name}</b><span>${u.desc}</span>${u.weapon ? '<small>NEW WEAPON</small>' : ''}</button>`).join('');
  o.onclick = (e) => { const b = e.target.closest('.up'); if (!b) return; o.classList.remove('on'); o.onclick = null; pick(choices[+b.dataset.i]); };
};

// ---------- screens ----------
UI.hideAll = () => { $('#screen').classList.remove('on'); $('#screen').innerHTML = ''; $('#hud').classList.remove('on'); $('#levelup').classList.remove('on'); $('#bossbar').classList.remove('on'); };
UI.showHud = () => { $('#hud').classList.add('on'); syncAfk(); };
const screen = (html) => { const s = $('#screen'); s.innerHTML = html; s.classList.add('on'); s.scrollTop = 0; };
let tab = 'camp', sel = null, msg = '';

UI.camp = () => { tab = 'camp'; sel = null; S.lastSeen = S.lastSeen || Date.now(); renderCamp(); };
function top() {
  const hs = heroStats(S);
  return `<div class="top"><h1>HAUNTFALL</h1><div class="tabs"><button data-act="tab" data-t="camp" class="${tab === 'camp' ? 'on' : ''}">Camp</button><button data-act="tab" data-t="gear" class="${tab === 'gear' ? 'on' : ''}">Gear</button></div><div class="stat"><span class="gold">${S.gold.toLocaleString()} gold</span><span>Power ${hs.power}</span></div></div>`;
}
function renderCamp() {
  const idle = idlePreview(S), hs = heroStats(S), full = idle.mins >= IDLE_CAP_MIN;
  screen(`${top()}<div class="body camp">
    <div class="panel hero"><img src="art/hero_${S.hero}_1.png" onerror="this.style.display='none'" alt=""><div><h2>The Survivor</h2><p>${WEAPONS[hs.weaponKind].name} · ${hs.hp} health · ${Math.round(hs.speed)} speed</p><p class="dim">Best run: ${S.best} kills · ${S.wins} boss kills</p></div></div>
    <div class="panel"><h2>Graveyard Gate <small>district ${S.district}</small></h2><p>Survive 5 minutes. The Gravekeeper comes for you after that.</p>
      <label class="chk"><input type="checkbox" id="afkChk" ${S.opts.afk ? 'checked' : ''}> AFK combat: explore, fight and loot by itself, and start the next run automatically</label>
      <button class="big" data-act="run">Enter the graveyard</button>
      ${S.maxDistrict > 1 ? `<div class="row">${Array.from({ length: S.maxDistrict }, (_, i) => `<button data-act="district" data-d="${i + 1}" class="${S.district === i + 1 ? 'on' : ''}">District ${i + 1}</button>`).join('')}</div>` : ''}</div>
    <div class="panel"><h2>While you were away</h2><p>${fmtTime(idle.mins)} away${full ? ' (full)' : ''}. Your survivors scavenged <b>${idle.gold.toLocaleString()} gold</b>${idle.gear ? ` and <b>${idle.gear} piece${idle.gear > 1 ? 's' : ''} of gear</b>` : ''}.</p><button data-act="claim" ${idle.gold + idle.gear > 0 ? '' : 'disabled'}>Collect</button></div>
    </div>${msg ? `<div class="msg">${msg}</div>` : ''}`);
  const c = $('#afkChk'); if (c) c.onchange = () => { S.opts.afk = c.checked; save(); };
  flashMsg();
}
function renderGear() {
  const hs = heroStats(S), bag = S.bag.slice().sort((a, b) => b.rar - a.rar || itemScore(b) - itemScore(a));
  const eq = SLOTS.map((sl) => S.gear[sl] ? cardHtml(S.gear[sl], `<b class="sl">${SLOT_NAME[sl]}</b>`) : `<div class="itc empty"><b class="sl">${SLOT_NAME[sl]}</b></div>`).join('');
  const detail = sel ? detailHtml(sel) : `<p class="dim">Tap an item to see it. Your stats: damage x${hs.dmgPct.toFixed(2)} · fire rate x${hs.ratePct.toFixed(2)} · ${hs.hp} health · ${hs.armor} armor · ${Math.round(hs.crit * 100)}% crit · speed ${Math.round(hs.speed)}.</p>`;
  screen(`${top()}<div class="body gear"><div class="col"><div class="panel"><h2>Equipped</h2><div class="slots">${eq}</div></div><div class="panel detail">${detail}</div></div>
    <div class="col"><div class="panel"><div class="bagtop"><h2>Bag <small>${S.bag.length}</small></h2><div class="btns"><button data-act="auto">Auto equip</button><button data-act="sellr" data-r="0">Sell white</button><button data-act="sellr" data-r="1">Sell green</button><button data-act="sellr" data-r="2">Sell blue</button><button data-act="sellr" data-r="3">Sell purple</button></div></div>
    <div class="bag">${bag.map((it) => cardHtml(it)).join('') || '<p class="dim">Nothing yet. Loot drops during runs.</p>'}</div></div></div></div>${msg ? `<div class="msg">${msg}</div>` : ''}`);
  flashMsg();
}
function detailHtml(it) {
  const R = RARITIES[it.rar], cur = S.gear[it.slot], isEq = cur && cur.id === it.id, rows = Object.keys(it.stats).map((k) => { const v = k === 'dmg' && it.slot === 'weapon' ? `${WEAPONS[it.kind].name}` : fmtStat(k, itemStat(it, k)); return `<div class="row2"><span>${k === 'dmg' && it.slot === 'weapon' ? 'Weapon' : STAT_LABEL[k]}</span><b>${v}</b></div>`; }).join('');
  const diff = !isEq && cur ? itemScore(it) - itemScore(cur) : 0;
  return `<div class="dhead" style="--r:${R.color}">${icon(it)}<div><h3>${it.name}</h3><small>${R.name} ${SLOT_NAME[it.slot]} · level ${it.ilvl}${it.up ? ' · +' + it.up : ''}</small></div></div>${rows}
    ${!isEq && cur ? `<p class="cmp ${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? 'Better' : 'Worse'} than equipped</p>` : ''}
    <div class="btns">${isEq ? `<button data-act="unequip" data-id="${it.id}">Unequip</button>` : `<button class="go" data-act="equip" data-id="${it.id}">Equip</button>`}
    <button data-act="upgrade" data-id="${it.id}" ${S.gold >= upCost(it) && it.up < 10 ? '' : 'disabled'}>Upgrade ${it.up < 10 ? upCost(it) + 'g' : '(max)'}</button>${isEq ? '' : `<button data-act="sell" data-id="${it.id}">Sell ${salvageValue(it)}g</button>`}</div>`;
}
function flashMsg() { if (!msg) return; const m = msg; setTimeout(() => { if (msg === m) { msg = ''; const el = $('.msg'); if (el) el.remove(); } }, 2600); }
const find = (id) => S.bag.find((x) => x.id === +id) || SLOTS.map((s) => S.gear[s]).find((x) => x && x.id === +id);
function handle(act, d) {
  if (!$('#screen').classList.contains('on') && act !== 'again') return;
  if (act === 'tab') { tab = d.t; sel = null; tab === 'camp' ? renderCamp() : renderGear(); return; }
  if (act === 'run') { cb.start(); return; }
  if (act === 'district') { S.district = +d.d; save(); renderCamp(); return; }
  if (act === 'claim') { const i = idlePreview(S); S.gold += i.gold; for (let k = 0; k < i.gear; k++) S.bag.push(cb.makeDrop()); S.lastSeen = Date.now(); msg = `Collected ${i.gold} gold${i.gear ? ' and ' + i.gear + ' gear' : ''}.`; save(); renderCamp(); return; }
  if (act === 'again') { cb.start(); return; }
  if (act === 'camp') { UI.stopAfkTimer(); UI.camp(); return; }
  if (act === 'pick') { sel = find(d.id) || null; renderGear(); return; }
  if (act === 'equip') { const it = find(d.id); if (!it) return; const old = S.gear[it.slot]; S.bag.splice(S.bag.indexOf(it), 1); if (old) S.bag.push(old); S.gear[it.slot] = it; sel = it; save(); renderGear(); return; }
  if (act === 'unequip') { const it = find(d.id); if (!it) return; S.gear[it.slot] = null; S.bag.push(it); sel = it; save(); renderGear(); return; }
  if (act === 'upgrade') { const it = find(d.id); if (!it || S.gold < upCost(it) || it.up >= 10) return; S.gold -= upCost(it); it.up++; msg = `${it.name} is now +${it.up}.`; save(); renderGear(); return; }
  if (act === 'sell') { const it = find(d.id); if (!it) return; S.gold += salvageValue(it); S.bag.splice(S.bag.indexOf(it), 1); sel = null; save(); renderGear(); return; }
  if (act === 'sellr') { const r = +d.r; let g = 0, n = 0; S.bag = S.bag.filter((it) => { if (it.rar !== r) return true; const cur = S.gear[it.slot]; if (!cur || itemScore(it) > itemScore(cur)) return true; g += salvageValue(it); n++; return false; }); S.gold += g; msg = n ? `Sold ${n} for ${g} gold (kept upgrades).` : 'Nothing to sell.'; sel = null; save(); renderGear(); return; }
  if (act === 'auto') { const n = autoEquip(S); msg = n ? `Equipped ${n} better item${n > 1 ? 's' : ''}.` : 'You already wear the best.'; save(); renderGear(); return; }
}
document.addEventListener('click', (e) => { const b = e.target.closest('.itc[data-item]'); if (b && $('#screen').classList.contains('on') && tab === 'gear') { sel = find(b.dataset.item) || null; renderGear(); } });
UI.gearTab = () => { tab = 'gear'; renderGear(); };

// ---------- results ----------
UI.done = (r) => {
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar), earned = r.gold + (won ? 120 * S.district : Math.floor(r.t / 10));
  S.gold += earned; S.runs++; S.best = Math.max(S.best, r.kills); if (won) { S.wins++; if (S.district === S.maxDistrict && S.maxDistrict < 6) { S.maxDistrict++; } }
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  if (S.opts.afk) autoEquip(S);
  S.lastSeen = Date.now(); save();
  const afk = !!S.opts.afk; r.destroy();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? 'THE GRAVEKEEPER FALLS' : 'YOU DIED'}</h1><p class="sub">${won ? 'The graveyard is quiet. For now.' : 'The dead take another one...'}</p>
    <div class="stats"><div><small>Time</small><b>${Math.floor(r.t / 60)}:${String(Math.floor(r.t % 60)).padStart(2, '0')}</b></div><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${earned}</b></div><div><small>Gear</small><b>${items.length}</b></div></div>
    <div class="bag small">${items.map((it) => cardHtml(it)).join('') || '<p class="dim">No gear this time.</p>'}</div>
    <div class="btns"><button class="go big" data-act="again">Run again</button><button class="big2" data-act="camp">Camp &amp; gear</button></div>${afk ? '<p class="dim" id="afkCount">AFK is on: the next run starts in 6 seconds. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.</p>' : ''}</div>`);
  $('#hud').classList.remove('on');
  if (afk) { clearTimeout(UI.afkT); let n = 6; const tick = () => { const el = $('#afkCount'); if (!el) return; n--; if (n <= 0) { cb.start(); return; } el.innerHTML = `AFK is on: the next run starts in ${n} second${n > 1 ? 's' : ''}. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.`; UI.afkT = setTimeout(tick, 1000); }; UI.afkT = setTimeout(tick, 1000); }
};
UI.stopAfkTimer = () => clearTimeout(UI.afkT);
UI.heroPick = (done) => {
  screen(`<div class="pick"><h1>HAUNTFALL</h1><p class="sub">The town fell in the night. Who are you?</p><div class="two"><button data-act="hero" data-h="f"><img src="art/hero_f_1.png" alt=""><b>Her</b></button><button data-act="hero" data-h="m"><img src="art/hero_m_1.png" alt=""><b>Him</b></button></div></div>`);
  $('#screen').onclick = (e) => { const b = e.target.closest('[data-h]'); if (!b) return; S.hero = b.dataset.h; save(); $('#screen').onclick = null; done(); };
};
