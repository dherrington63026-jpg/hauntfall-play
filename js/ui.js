// Hauntfall screens and HUD (plain DOM over the canvas).
import { RARITIES, SLOTS, SLOT_NAME, STAT_LABEL, PCT, WEAPONS, ROOMS, ROOM_ORDER, ROOM_MAX, SLOT_LIST, heroStats, itemStat, itemScore, upCost, salvageValue, autoEquip, writeSave, roomRate, roomBank, collectRoom, tickBase, startUpgrade, startBuild, openSlots, newRoomCost, roomOfType, upgradeCost, upgradeSecs, baseBonus, makeItem } from './data.js';
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
  $('#btnPause').onclick = () => cb.pause(); $('#btnLeave').onclick = () => cb.pause();
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-act]'); if (!b) return; if (b.classList.contains('sheetbg') && e.target !== b) return; handle(b.dataset.act, b.dataset); });
}
UI.hurt = () => { document.body.classList.add('hurt'); clearTimeout(UI.hurtT); UI.hurtT = setTimeout(() => document.body.classList.remove('hurt'), 160); };
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
  $('#gold').textContent = r.gold; $('#kills').textContent = r.kills; document.body.classList.toggle('low', r.hero.hp < r.maxHp * 0.3);
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
  o.querySelector('.cards').innerHTML = choices.map((u, i) => `<button class="up ${u.weapon ? 'wep' : ''}" data-i="${i}"><img src="art/skill_${u.id}.jpg" alt="" onerror="this.style.display='none'"><b>${u.name}${(UI.picked && UI.picked[u.id]) ? ' ' + (UI.picked[u.id] + 1) : ''}</b><span>${u.desc}</span>${u.weapon ? '<small>NEW WEAPON</small>' : ''}</button>`).join('');
  o.onclick = (e) => { const b = e.target.closest('.up'); if (!b) return; o.classList.remove('on'); o.onclick = null; pick(choices[+b.dataset.i]); };
};

// ---------- screens ----------
UI.hideAll = () => { document.body.classList.remove('low', 'hurt'); $('#screen').classList.remove('on'); $('#screen').innerHTML = ''; $('#hud').classList.remove('on'); $('#levelup').classList.remove('on'); $('#bossbar').classList.remove('on'); };
UI.showHud = () => { $('#hud').classList.add('on'); syncAfk(); };
const screen = (html, bg = 'camp') => { const s = $('#screen'); s.innerHTML = html; s.className = 'on bg-' + bg; s.scrollTop = 0; };
let tab = 'camp', sel = null, msg = '';

UI.camp = () => { tab = 'camp'; sel = null; sheet = null; const d = tickBase(S); if (d) { save(); const r = S.base.rooms[d]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; } renderCamp(); };
function top() {
  const hs = heroStats(S);
  return `<div class="top"><h1>HAUNTFALL</h1><div class="tabs"><button data-act="tab" data-t="camp" class="${tab === 'camp' ? 'on' : ''}">Church</button><button data-act="tab" data-t="gear" class="${tab === 'gear' ? 'on' : ''}">Gear</button></div><div class="stat"><span class="gold">${S.gold.toLocaleString()} gold</span><span class="scrap">${Math.floor(S.scrap || 0).toLocaleString()} scrap</span><span>Power ${hs.power}</span></div></div>`;
}
const fmtDur = (sec) => { sec = Math.max(0, Math.ceil(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(x).padStart(2, '0')}s` : `${x}s`; };
let sheet = null; // { kind: 'room' | 'build', key }
const OUTLINE = `<svg class="outline" viewBox="0 0 500 480" preserveAspectRatio="none" aria-hidden="true">
  <defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a212b"/><stop offset="1" stop-color="#0c1016"/></linearGradient></defs>
  <path d="M0 340 L100 240 L200 140 L250 22 L300 140 L400 240 L500 340 L500 440 L0 440 Z" fill="url(#wall)" stroke="#4a586a" stroke-width="3" stroke-linejoin="round"/>
  <path d="M250 22 L250 -2 M238 8 L262 8" stroke="#8a97a6" stroke-width="3" fill="none" transform="translate(0,4)"/>
  <path d="M200 140 L300 140 M100 240 L400 240 M0 340 L500 340" stroke="#4a586a" stroke-width="2" opacity="0.7"/>
  <path d="M0 440 L500 440 L500 480 L0 480 Z" fill="#06080b" stroke="#2c343e"/>
  <g stroke="#3a4655" stroke-width="2" fill="none">${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 25 + 6} 480 L${i * 25 + 6} 452 L${i * 25 + 12} 444 L${i * 25 + 18} 452 L${i * 25 + 18} 480"/>`).join('')}</g>
  <g fill="#ffcf6a" opacity="0.55"><rect x="40" y="355" width="16" height="30" rx="8" opacity="0.5"/><rect x="444" y="355" width="16" height="30" rx="8" opacity="0.5"/></g></svg>`;
const ROW_Y = [340, 240, 140];
function slotPos(sl) { return `left:${sl.c * 20}%;top:${ROW_Y[sl.f] / 480 * 100}%;width:20%;height:${100 / 480 * 100}%`; }
function arrowFor(sl) { const b = (f, c) => { const r = S.base.rooms[`f${f}c${c}`]; return r && r.lvl > 0; }; const L = b(sl.f, sl.c - 1), R = b(sl.f, sl.c + 1), D = sl.f > 0 && b(sl.f - 1, sl.c); return D ? '&#9650;' : L && !R ? '&#9654;' : R && !L ? '&#9664;' : ''; }
function cellHtml(sl, open) {
  const r = S.base.rooms[sl.key], pos = slotPos(sl);
  if (r && r.lvl === 0) { const R = ROOMS[r.type]; return `<div class="cell scaffold" style="${pos}"><span>${R.name}</span><b data-build="${sl.key}">${fmtDur((S.base.build.end - Date.now()) / 1000)}</b></div>`; }
  if (r) { const R = ROOMS[r.type], bank = R.prod ? roomBank(S, sl.key) : 0, up = S.base.build && S.base.build.key === sl.key && S.base.build.kind === 'up';
    return `<button class="cell room" data-act="open" data-key="${sl.key}" style="${pos};background-image:url(art/room_${R.art}.jpg)"><b class="lv">${r.lvl}</b>${bank > 0 ? '<i class="dot" data-dot="' + sl.key + '"></i>' : '<i class="dot off" data-dot="' + sl.key + '"></i>'}<span class="nm">${R.name}</span>${up ? '<em data-up="' + sl.key + '">' + fmtDur((S.base.build.end - Date.now()) / 1000) + '</em>' : ''}</button>`; }
  if (open.includes(sl.key)) return `<button class="cell slot" data-act="slot" data-key="${sl.key}" style="${pos}"><span>${arrowFor(sl)}</span><b>+</b></button>`;
  return `<div class="cell empty" style="${pos}"></div>`;
}
function sheetHtml() {
  if (!sheet) return '';
  if (sheet.kind === 'build') {
    const c = newRoomCost(S), busy = !!S.base.build, poor = S.gold < c.gold || (S.scrap || 0) < c.scrap;
    const rows = ROOM_ORDER.filter((t) => !roomOfType(S, t)).map((t) => { const R = ROOMS[t]; return `<div class="opt"><img src="art/room_${R.art}.jpg" alt=""><div><h4>${R.name}</h4><p>${R.desc}</p><p class="bonus">${R.prod ? `Makes ${R.rate} ${R.prod}/hour` : R.bonus(1)}</p></div><button class="${!busy && !poor ? 'go' : ''}" data-act="build" data-type="${t}" ${busy || poor ? 'disabled' : ''}>Build</button></div>`; }).join('');
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Build a room</h3><button data-act="closesheet">Close</button></div><p class="cost">Cost: <b class="gold">${c.gold.toLocaleString()} gold</b> · <b class="scrap">${c.scrap} scrap</b> · ${fmtDur(c.secs)}${busy ? ' · <b style="color:#ff9a7a">builders busy</b>' : poor ? ' · <b style="color:#ff9a7a">not enough yet</b>' : ''}</p><div class="opts">${rows || '<p class="dim">Every room type is built.</p>'}</div></div></div>`;
  }
  const r = S.base.rooms[sheet.key]; if (!r) return ''; const R = ROOMS[r.type], l = r.lvl, building = S.base.build && S.base.build.key === sheet.key && S.base.build.kind === 'up', busy = !!S.base.build, c = upgradeCost(l), can = S.gold >= c.gold && (S.scrap || 0) >= c.scrap;
  const bank = R.prod ? roomBank(S, sheet.key) : 0, rate = roomRate(S, sheet.key);
  const bonusNow = R.bonus ? R.bonus(l) : `${Math.round(rate)} ${R.prod}/hour`, bonusNext = l < ROOM_MAX ? (R.bonus ? R.bonus(l + 1) : `${Math.round(R.rate * Math.pow(l + 1, R.pow))} ${R.prod}/hour`) : '';
  return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="sart" style="background-image:linear-gradient(transparent 30%, #0e1218), url(art/room_${R.art}.jpg)"></div><div class="shead"><h3>${R.name} <em>Lv ${l}</em></h3><button data-act="closesheet">Close</button></div>
    <p>${R.desc}</p><p class="bonus">Now: ${bonusNow}</p>${bonusNext ? `<p class="dim">Next level: ${bonusNext}</p>` : ''}
    ${R.prod ? `<div class="bank"><span>Banked: <b data-bank="${sheet.key}">${bank} ${R.prod}</b> <small>(${Math.round(rate)}/hour)</small></span><button data-act="collect" data-key="${sheet.key}" ${bank > 0 ? '' : 'disabled'}>Collect</button></div>` : ''}
    ${building ? `<div class="build"><span>Upgrading... <b data-build="${sheet.key}">${fmtDur((S.base.build.end - Date.now()) / 1000)}</b></span><div class="bar"><i data-buildbar="${sheet.key}" style="width:${Math.min(100, (1 - (S.base.build.end - Date.now()) / 1000 / upgradeSecs(l)) * 100)}%"></i></div></div>`
      : l >= ROOM_MAX ? '<p class="dim">Max level</p>' : `<button class="upg ${can && !busy ? 'go' : ''}" data-act="room" data-key="${sheet.key}" ${can && !busy ? '' : 'disabled'}>Upgrade to level ${l + 1}<small>${c.gold.toLocaleString()} gold · ${c.scrap} scrap · ${fmtDur(upgradeSecs(l))}${busy ? ' · builders busy' : !can ? ' · not enough yet' : ''}</small></button>`}</div></div>`;
}
function renderCamp() {
  const hs = heroStats(S), open = openSlots(S), keep = $('#screen').scrollTop;
  screen(`${top()}<div class="body church">
    <div class="banner" style="background-image:linear-gradient(rgba(5,7,10,.2), rgba(5,7,10,.88)), url(art/bg_church.jpg)"><div class="bleft"><img src="art/hero_${S.hero}_1.png" onerror="this.style.display='none'" alt=""></div>
      <div class="bright"><h2>Hauntfall Church</h2><p>${WEAPONS[hs.weaponKind].name} · ${hs.hp} health · power ${hs.power} · best ${S.best} kills · ${S.wins} boss kills</p>
      <label class="chk"><input type="checkbox" id="afkChk" ${S.opts.afk ? 'checked' : ''}> AFK combat: explore, fight and loot by itself, then start the next run</label>
      <button class="big" data-act="run">Enter the graveyard <small>district ${S.district}</small></button>
      ${S.maxDistrict > 1 ? `<div class="row">${Array.from({ length: S.maxDistrict }, (_, i) => `<button data-act="district" data-d="${i + 1}" class="${S.district === i + 1 ? 'on' : ''}">District ${i + 1}</button>`).join('')}</div>` : ''}</div></div>
    <div class="chart">${OUTLINE}${SLOT_LIST.map((sl) => cellHtml(sl, open)).join('')}</div>
    <p class="hint">Tap a room to upgrade it. Tap a <b>+</b> to build a new room next to it or above it.</p></div>${sheetHtml()}${msg ? `<div class="msg">${msg}</div>` : ''}`);
  $('#screen').scrollTop = keep;
  const c = $('#afkChk'); if (c) c.onchange = () => { S.opts.afk = c.checked; save(); };
  flashMsg(); clearInterval(UI.baseT); UI.baseT = setInterval(refreshBase, 1000);
}
function refreshBase() {
  if (tab !== 'camp' || !$('#screen').classList.contains('on') || !$('.chart')) { clearInterval(UI.baseT); return; }
  const done = tickBase(S); if (done) { save(); const r = S.base.rooms[done]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; renderCamp(); return; }
  for (const k of Object.keys(S.base.rooms)) { const r = S.base.rooms[k], R = ROOMS[r.type]; if (!R.prod || !r.lvl) continue; const n = roomBank(S, k); const d = $(`[data-dot="${k}"]`); if (d) d.classList.toggle('off', n <= 0); const b = $(`[data-bank="${k}"]`); if (b) { b.textContent = `${n} ${R.prod}`; const btn = b.closest('.bank').querySelector('button'); if (btn) btn.disabled = n <= 0; } }
  const bd = S.base.build; if (bd) { const left = (bd.end - Date.now()) / 1000; for (const sel of [`[data-build="${bd.key}"]`, `[data-up="${bd.key}"]`]) { const t = $(sel); if (t) t.textContent = fmtDur(left); } const bar = $(`[data-buildbar="${bd.key}"]`); if (bar) bar.style.width = Math.min(100, (1 - left / upgradeSecs(S.base.rooms[bd.key].lvl)) * 100) + '%'; }
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
    <button data-act="upgrade" data-id="${it.id}" ${S.gold >= upCost(it, S) && it.up < 10 ? '' : 'disabled'}>Upgrade ${it.up < 10 ? upCost(it, S) + 'g' : '(max)'}</button>${isEq ? '' : `<button data-act="sell" data-id="${it.id}">Sell ${salvageValue(it)}g</button>`}</div>`;
}
function flashMsg() { if (!msg) return; const m = msg; setTimeout(() => { if (msg === m) { msg = ''; const el = $('.msg'); if (el) el.remove(); } }, 2600); }
const find = (id) => S.bag.find((x) => x.id === +id) || SLOTS.map((s) => S.gear[s]).find((x) => x && x.id === +id);
function handle(act, d) {
  if (!$('#screen').classList.contains('on') && act !== 'again') return;
  if (act === 'tab') { tab = d.t; sel = null; tab === 'camp' ? renderCamp() : renderGear(); return; }
  if (act === 'run') { cb.start(); return; }
  if (act === 'district') { S.district = +d.d; save(); renderCamp(); return; }
  if (act === 'open') { sheet = { kind: 'room', key: d.key }; renderCamp(); return; }
  if (act === 'slot') { sheet = { kind: 'build', key: d.key }; renderCamp(); return; }
  if (act === 'closesheet') { sheet = null; renderCamp(); return; }
  if (act === 'collect') { const n = collectRoom(S, d.key); if (n) { msg = `Collected ${n} ${ROOMS[S.base.rooms[d.key].type].prod}.`; save(); } renderCamp(); return; }
  if (act === 'room') { const r = startUpgrade(S, d.key); if (r === 'ok') { save(); msg = `${ROOMS[S.base.rooms[d.key].type].name} upgrade started.`; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
  if (act === 'build') { const r = startBuild(S, sheet.key, d.type); if (r === 'ok') { save(); msg = `Building the ${ROOMS[d.type].name}...`; sheet = null; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
  if (act === 'claim') { const i = idlePreview(S); S.gold += i.gold; for (let k = 0; k < i.gear; k++) S.bag.push(cb.makeDrop()); S.lastSeen = Date.now(); msg = `Collected ${i.gold} gold${i.gear ? ' and ' + i.gear + ' gear' : ''}.`; save(); renderCamp(); return; }
  if (act === 'again') { cb.start(); return; }
  if (act === 'camp') { UI.stopAfkTimer(); UI.camp(); return; }
  if (act === 'pick') { sel = find(d.id) || null; renderGear(); return; }
  if (act === 'equip') { const it = find(d.id); if (!it) return; const old = S.gear[it.slot]; S.bag.splice(S.bag.indexOf(it), 1); if (old) S.bag.push(old); S.gear[it.slot] = it; sel = it; save(); renderGear(); return; }
  if (act === 'unequip') { const it = find(d.id); if (!it) return; S.gear[it.slot] = null; S.bag.push(it); sel = it; save(); renderGear(); return; }
  if (act === 'upgrade') { const it = find(d.id); if (!it || S.gold < upCost(it, S) || it.up >= 10) return; S.gold -= upCost(it, S); it.up++; msg = `${it.name} is now +${it.up}.`; save(); renderGear(); return; }
  if (act === 'sell') { const it = find(d.id); if (!it) return; S.gold += salvageValue(it); S.bag.splice(S.bag.indexOf(it), 1); sel = null; save(); renderGear(); return; }
  if (act === 'sellr') { const r = +d.r; let g = 0, n = 0; S.bag = S.bag.filter((it) => { if (it.rar !== r) return true; const cur = S.gear[it.slot]; if (!cur || itemScore(it) > itemScore(cur)) return true; g += salvageValue(it); n++; return false; }); S.gold += g; msg = n ? `Sold ${n} for ${g} gold (kept upgrades).` : 'Nothing to sell.'; sel = null; save(); renderGear(); return; }
  if (act === 'auto') { const n = autoEquip(S); msg = n ? `Equipped ${n} better item${n > 1 ? 's' : ''}.` : 'You already wear the best.'; save(); renderGear(); return; }
}
document.addEventListener('click', (e) => { const b = e.target.closest('.itc[data-item]'); if (b && $('#screen').classList.contains('on') && tab === 'gear') { sel = find(b.dataset.item) || null; renderGear(); } });
UI.gearTab = () => { tab = 'gear'; renderGear(); };

// ---------- results ----------
UI.done = (r) => {
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar), earned = r.gold + (won ? 120 * S.district : Math.floor(r.t / 10));
  S.gold += earned; S.scrap = (S.scrap || 0) + r.scrap; S.runs++; S.best = Math.max(S.best, r.kills); if (won) { S.wins++; if (S.district === S.maxDistrict && S.maxDistrict < 6) { S.maxDistrict++; } }
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  if (S.opts.afk) autoEquip(S);
  S.lastSeen = Date.now(); save();
  if (r.retreated) S.opts.afk = false; save(); const afk = !!S.opts.afk; r.destroy();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? 'THE GRAVEKEEPER FALLS' : r.retreated ? 'YOU GOT OUT' : 'YOU DIED'}</h1><p class="sub">${won ? 'The graveyard is quiet. For now.' : r.retreated ? 'You slipped away with what you found.' : 'The dead take another one...'}</p>
    <div class="stats"><div><small>Time</small><b>${Math.floor(r.t / 60)}:${String(Math.floor(r.t % 60)).padStart(2, '0')}</b></div><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${earned}</b></div><div><small>Scrap</small><b>${r.scrap}</b></div><div><small>Gear</small><b>${items.length}</b></div></div>
    <div class="bag small">${items.map((it) => cardHtml(it)).join('') || '<p class="dim">No gear this time.</p>'}</div>
    <div class="btns"><button class="go big" data-act="again">Run again</button><button class="big2" data-act="camp">Camp &amp; gear</button></div>${afk ? '<p class="dim" id="afkCount">AFK is on: the next run starts in 6 seconds. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.</p>' : ''}</div>`);
  $('#hud').classList.remove('on');
  if (afk) { clearTimeout(UI.afkT); let n = 6; const tick = () => { const el = $('#afkCount'); if (!el) return; n--; if (n <= 0) { cb.start(); return; } el.innerHTML = `AFK is on: the next run starts in ${n} second${n > 1 ? 's' : ''}. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.`; UI.afkT = setTimeout(tick, 1000); }; UI.afkT = setTimeout(tick, 1000); }
};
UI.stopAfkTimer = () => clearTimeout(UI.afkT);
UI.heroPick = (done) => {
  screen(`<div class="pick"><h1>HAUNTFALL</h1><p class="sub">The town fell in the night. Who are you?</p><div class="two"><button data-act="hero" data-h="f"><img src="art/hero_f_1.png" alt=""><b>Her</b></button><button data-act="hero" data-h="m"><img src="art/hero_m_1.png" alt=""><b>Him</b></button></div></div>`, 'title');
  $('#screen').onclick = (e) => { const b = e.target.closest('[data-h]'); if (!b) return; S.hero = b.dataset.h; save(); $('#screen').onclick = null; done(); };
};
