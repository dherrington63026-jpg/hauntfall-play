// Hauntfall screens and HUD (plain DOM over the canvas).
import { districtName, districtOf, ENEMIES, RARITIES, SLOTS, SLOT_NAME, STAT_LABEL, PCT, WEAPONS, ROOMS, ROOM_ORDER, SKILLS, SKILL_KEYS, SKILL_BOOST, COLS, heroStats, itemStat, itemScore, upCost, salvageValue, autoEquip, writeSave, tickBase, startUpgrade, startBuild, openSlots, newRoomCost, upgradeCost, upgradeSecs, topFloor, slotKey, parseKey, staffSlots, staffOf, survivorById, assign, recruit, beds, capacity, flows, jobOf, makeItem, tickHaunt, resolveHaunt, defense, hauntStrength, cleanse, cleanseCost } from './data.js';
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
UI.banner = (title, sub) => { const b = $('#banner'); if (!b) return; b.innerHTML = `<small>${sub || ''}</small><b>${title}</b>`; b.classList.remove('on'); void b.offsetWidth; b.classList.add('on'); };
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
  const t = Math.max(0, Math.floor(r.bossOut ? r.t - r.runLen : r.runLen - r.t)); $('#timer').textContent = r.bossOut ? 'BOSS' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('#gold').textContent = r.gold; $('#kills').textContent = r.kills; document.body.classList.toggle('low', r.hero.hp < r.maxHp * 0.3);
};
UI.toast = (msg) => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); };
UI.lootToast = (it) => { const d = document.createElement('div'); d.className = 'toast loot'; d.style.setProperty('--r', RARITIES[it.rar].color); d.innerHTML = `${icon(it)}<span>${it.name}</span>`; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2600); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); };
UI.bossBar = (on, name) => { $('#bossbar').classList.toggle('on', on); if (on) { $('#bossFill').style.width = '100%'; if (name) $('#bossbar b').textContent = name; } };
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

UI.camp = () => { tab = 'camp'; sel = null; sheet = null; const d = tickBase(S); const ev = tickHaunt(S); if (ev) sheet = { kind: 'hauntreport', rep: ev }; save(); if (d) { const r = S.base.rooms[d]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; } renderCamp(); };
function top() {
  const hs = heroStats(S);
  return `<div class="top"><h1>HAUNTFALL</h1><div class="tabs"><button data-act="tab" data-t="camp" class="${tab === 'camp' ? 'on' : ''}">Church</button><button data-act="tab" data-t="gear" class="${tab === 'gear' ? 'on' : ''}">Gear</button></div><div class="stat"><span class="gold">${S.gold.toLocaleString()} gold</span><span class="scrap">${Math.floor(S.scrap || 0).toLocaleString()} scrap</span><span>Might ${hs.power}</span></div></div>`;
}
const fmtDur = (sec) => { sec = Math.max(0, Math.ceil(sec)); const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), x = sec % 60; return h ? `${h}h ${String(m).padStart(2, '0')}m` : m ? `${m}m ${String(x).padStart(2, '0')}s` : `${x}s`; };
let sheet = null; // { kind: 'room'|'build'|'door'|'crew'|'staff'|'assign', key?, id? }
const portrait = (sv, cls = '') => `<img class="pt ${cls}" src="art/sv_${sv.main}_${sv.g}_${sv.v}.jpg" alt="" onerror="this.style.visibility='hidden'">`;
const ROLE = { weap: 'Shoots enemies', med: 'Heals you now and then', mech: 'Builds turrets', elec: 'Zaps enemies with lightning', plumb: 'Floods the ground to slow enemies', scout: 'Spots loot from afar', cook: 'Hot meals: steady health regen', trade: 'Finds extra gold', faith: 'Blessings: you take less damage' };
const squadOf = () => (S.squad || []).map((id) => survivorById(S, id)).filter(Boolean);
const rate1 = (v) => (v >= 0 ? '+' : '') + (Math.abs(v) < 10 ? v.toFixed(1) : Math.round(v)) + '/h';
function resBar() {
  const F = flows(S), cap = capacity(S), r = S.base.res, pop = S.base.survivors.length, bd = beds(S);
  return `<div class="resbar"><div class="rc ${F.demand > F.supply ? 'bad' : ''}" data-r="pow">&#9889; <b>${Math.round(F.supply)}</b>/${Math.round(F.demand)}<small>power</small></div>
    <div class="rc ${r.water <= 0 ? 'bad' : ''}" data-r="water">&#128167; <b>${Math.floor(r.water)}</b><small>${rate1(F.rate.water)}</small></div>
    <div class="rc ${r.food <= 0 ? 'bad' : ''}" data-r="food">&#127830; <b>${Math.floor(r.food)}</b><small>${rate1(F.rate.food)}</small></div>
    <button class="rc crew" data-act="crew">&#128101; <b>${pop}</b>/${bd}<small>survivors</small></button></div>${F.demand > F.supply ? '<p class="warn">Not enough electricity: rooms are running slow. Build or upgrade a Generator.</p>' : ''}`;
}
function hauntBanner() {
  const H = S.base.haunt && S.base.haunt.active; if (!H) return '';
  const def = defense(S), left = (H.end - Date.now()) / 1000;
  return `<div class="haunt"><h3>&#128123; GHOSTS ARE BESIEGING THE CHURCH</h3><p>Their strength <b>${H.strength}</b> against your defense <b>${def}</b>. ${def >= H.strength * 1.1 ? 'You should hold.' : def >= H.strength * 0.8 ? 'It will be close.' : 'You are outmatched. Fight them yourself, or build the Armory.'} They break through in <b data-hleft>${fmtDur(left)}</b>.</p>
    <div class="btns"><button class="go" data-act="defend">Fight them off yourself<small>about 2 minutes, bigger rewards</small></button><button data-act="hold">Hold the line<small>let your defenses decide</small></button></div></div>`;
}
function outlineSvg(F, H, ROOF) {
  const bodyH = F * 100, glow = [];
  for (let f = 0; f < F; f++) for (const x of [14, 474]) glow.push(`<rect x="${x}" y="${ROOF + (F - 1 - f) * 100 + 30}" width="12" height="28" rx="6" fill="#ffcf6a" opacity="${f % 2 ? 0.25 : 0.4}"/>`);
  return `<svg class="outline" viewBox="0 0 500 ${H}" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a212b"/><stop offset="1" stop-color="#0c1016"/></linearGradient></defs>
    <path d="M0 ${ROOF} L250 6 L500 ${ROOF} L500 ${ROOF + bodyH} L0 ${ROOF + bodyH} Z" fill="url(#wall)" stroke="#4a586a" stroke-width="3" stroke-linejoin="round"/>
    <path d="M250 6 L250 -20 M238 -8 L262 -8" stroke="#8a97a6" stroke-width="3" fill="none" transform="translate(0,26)"/>
    ${Array.from({ length: F }, (_, i) => `<path d="M0 ${ROOF + (i + 1) * 100} L500 ${ROOF + (i + 1) * 100}" stroke="#4a586a" stroke-width="2" opacity="0.7"/>`).join('')}
    <path d="M0 ${ROOF + bodyH} L500 ${ROOF + bodyH} L500 ${H} L0 ${H} Z" fill="#06080b" stroke="#2c343e"/>
    <g stroke="#3a4655" stroke-width="2" fill="none">${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 25 + 6} ${H} L${i * 25 + 6} ${H - 26} L${i * 25 + 12} ${H - 34} L${i * 25 + 18} ${H - 26} L${i * 25 + 18} ${H}"/>`).join('')}</g>${glow.join('')}</svg>`;
}
function cellStatus(k) { const f = flows(S).rooms[k]; return f ? (f.eff < 0.5 ? 'bad' : f.eff < 0.98 ? 'warn' : '') : ''; }
function cellHtml(sl, open, F, ROOF, H, FL) {
  const r = S.base.rooms[sl.key], top = (ROOF + (F - 1 - sl.f) * 100) / H * 100, pos = `left:${sl.c * 20}%;top:${top}%;width:20%;height:${100 / H * 100}%`;
  if (r && r.lvl === 0) { const R = ROOMS[r.type]; return `<div class="cell scaffold" style="${pos}"><span>${R.name}</span><b data-build="${sl.key}">${fmtDur((S.base.build.end - Date.now()) / 1000)}</b></div>`; }
  if (r) { const R = ROOMS[r.type], up = S.base.build && S.base.build.key === sl.key && S.base.build.kind === 'up', staff = R.skill ? staffOf(S, sl.key).length : 0, slots = R.skill ? staffSlots(r.lvl) : 0;
    return `<button class="cell room ${cellStatus(sl.key)} ${r.haunted ? 'haunted' : ''}" data-act="open" data-key="${sl.key}" style="${pos};background-image:url(art/room_${R.art}.jpg)"><b class="lv">${r.lvl}</b>${r.haunted ? '<i class="ghost">&#128123;</i>' : ''}${slots ? `<i class="crewdot">${'&#9679;'.repeat(staff)}${'&#9675;'.repeat(slots - staff)}</i>` : ''}<span class="nm">${R.name}</span>${up ? '<em data-up="' + sl.key + '">' + fmtDur((S.base.build.end - Date.now()) / 1000) + '</em>' : ''}</button>`; }
  if (open.includes(sl.key)) { const b = (f, c) => { const x = S.base.rooms[slotKey(f, c)]; return x && x.lvl > 0; }, L = b(sl.f, sl.c - 1), Rr = b(sl.f, sl.c + 1), D = sl.f > 0 && b(sl.f - 1, sl.c), arrow = D ? '&#9650;' : L && !Rr ? '&#9654;' : Rr && !L ? '&#9664;' : '';
    return `<button class="cell slot" data-act="slot" data-key="${sl.key}" style="${pos}"><span>${arrow}</span><b>+</b></button>`; }
  return `<div class="cell empty" style="${pos}"></div>`;
}
const need = (R, L) => { const bits = []; const p = R.pow(L); if (p < 0) bits.push(`&#9889; ${-p} power`); if (R.use) for (const [k, f] of Object.entries(R.use)) bits.push(`${k === 'water' ? '&#128167;' : '&#128297;'} ${f(L)} ${k}/h`); return bits.join(' · '); };
const makes = (R, L) => { const bits = []; const p = R.pow(L); if (p > 0) bits.push(`&#9889; +${Math.round(p)} power`); if (R.make) for (const [k, f] of Object.entries(R.make)) bits.push(`${{ water: '&#128167;', food: '&#127830;', scrap: '&#128297;', gold: '&#129689;' }[k]} +${Math.round(f(L))} ${k}/h`); return bits.join(' · '); };
function skillBars(sv, only) { return SKILL_KEYS.filter((k) => (only ? only.includes(k) : sv.skills[k] >= 3)).sort((a, b) => sv.skills[b] - sv.skills[a]).slice(0, 4).map((k) => `<span class="sk ${sv.skills[k] >= 7 ? 'hi' : ''}"><i style="width:${sv.skills[k] * 10}%"></i><em>${SKILLS[k]} ${sv.skills[k]}</em></span>`).join(''); }
function svRow(sv, extra = '') { return `<div class="svrow">${portrait(sv)}<div class="svi"><h4>${sv.name} <small>${jobOf(sv)}</small></h4><div class="sks">${skillBars(sv)}</div><p class="dim">${sv.room && S.base.rooms[sv.room] ? 'Working: ' + ROOMS[S.base.rooms[sv.room].type].name : 'Idle'}</p></div>${extra}</div>`; }
function sheetHtml() {
  if (!sheet) return '';
  if (sheet.kind === 'hauntreport') { const p = sheet.rep; return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>${p.won ? 'THE CHURCH HELD' : 'THE CHURCH WAS OVERRUN'}</h3><button data-act="closesheet">Close</button></div><p>${p.won ? `The ghosts (strength ${p.strength}) were driven back${p.byHand ? ' by your own hand' : ''}.` : `The ghosts (strength ${p.strength}) broke through.`}</p>${p.won ? `<p class="bonus">+${p.gold} gold, +${p.scrap} scrap${p.survivor ? ', and a survivor is knocking at the door!' : ''}</p>` : `<p class="warn">${p.haunted.length ? p.haunted.join(' and ') + (p.haunted.length > 1 ? ' are' : ' is') + ' haunted (output down 60% until cleansed). ' : ''}A quarter of the water and food spoiled.</p>`}</div></div>`; }
  const wrap = (inner) => `<div class="sheetbg" data-act="closesheet"><div class="sheet">${inner}</div></div>`;
  if (sheet.kind === 'build') {
    const c = newRoomCost(S), busy = !!S.base.build, poor = S.gold < c.gold || (S.scrap || 0) < c.scrap;
    const rows = ROOM_ORDER.map((t) => { const R = ROOMS[t]; return `<div class="opt"><img src="art/room_${R.art}.jpg" alt=""><div><h4>${R.name}</h4><p>${R.desc}</p><p class="bonus">${makes(R, 1) || (R.bonus ? R.bonus(1, 1) : '')}</p><p class="dim">${need(R, 1) ? 'Needs ' + need(R, 1) : 'Needs nothing'}</p></div><button class="${!busy && !poor ? 'go' : ''}" data-act="build" data-type="${t}" ${busy || poor ? 'disabled' : ''}>Build</button></div>`; }).join('');
    return wrap(`<div class="shead"><h3>Build a room</h3><button data-act="closesheet">Close</button></div><p class="cost">Cost: <b class="gold">${c.gold.toLocaleString()} gold</b> · <b class="scrap">${c.scrap} scrap</b> · ${fmtDur(c.secs)}${busy ? ' · <b style="color:#ff9a7a">builders busy</b>' : poor ? ' · <b style="color:#ff9a7a">not enough yet</b>' : ''}</p><div class="opts">${rows}</div>`);
  }
  if (sheet.kind === 'door') {
    const bd = beds(S), pop = S.base.survivors.length, rows = S.base.door.map((sv, i) => svRow(sv, `<div class="svbtn"><button class="${pop < bd ? 'go' : ''}" data-act="letin" data-i="${i}" ${pop < bd ? '' : 'disabled'}>Let in</button><button data-act="turnaway" data-i="${i}">Turn away</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>At the front door</h3><button data-act="closesheet">Close</button></div><p>${rows ? 'Survivors knock at the door, asking to stay. Each one has skills. Put them in the matching room to boost it.' : 'Nobody is at the door right now. Survivors show up every so often (a Bell Tower helps them find you).'}</p><p class="cost">Beds: <b>${pop}/${bd}</b>${pop >= bd ? ' · <b style="color:#ff9a7a">full, build a Bedroom</b>' : ''}</p><div class="svlist">${rows}</div>`);
  }
  if (sheet.kind === 'squad') {
    const inSq = (sv) => (S.squad || []).includes(sv.id), full = squadOf().length >= 2;
    const rows = S.base.survivors.map((sv) => svRow(sv, `<div class="svbtn"><span class="role">${ROLE[sv.main]}</span><button class="${inSq(sv) ? 'on' : full ? '' : 'go'}" data-act="squadtoggle" data-id="${sv.id}" ${!inSq(sv) && full ? 'disabled' : ''}>${inSq(sv) ? 'Bringing' : 'Bring'}</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>Who comes with you?</h3><button data-act="closesheet">Done</button></div><p class="dim">Up to 2 survivors fight beside you in the graveyard. Their job decides how: a nurse heals you, a mechanic builds turrets. They leave their room while they are out.</p><div class="svlist">${rows || '<p class="dim">No survivors yet. They knock at the front door.</p>'}</div>`);
  }
  if (sheet.kind === 'crew') {
    const rows = S.base.survivors.map((sv) => svRow(sv, `<div class="svbtn"><button data-act="assignpick" data-id="${sv.id}">${sv.room ? 'Move' : 'Assign'}</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>Survivors <em>${S.base.survivors.length}/${beds(S)} beds</em></h3><button data-act="closesheet">Close</button></div><p class="dim">Each survivor eats and drinks 0.8 a day-hour. Skill points boost the room they work in by ${SKILL_BOOST * 100}% each.</p><div class="svlist">${rows || '<p class="dim">No survivors yet. They arrive at the front door.</p>'}</div>`);
  }
  if (sheet.kind === 'assign') { // pick a room for one survivor
    const sv = survivorById(S, sheet.id), rows = Object.entries(S.base.rooms).filter(([, r]) => r.lvl > 0 && ROOMS[r.type].skill).map(([k, r]) => { const R = ROOMS[r.type], v = sv.skills[R.skill], free = staffSlots(r.lvl) - staffOf(S, k).length; return `<div class="opt"><img src="art/room_${R.art}.jpg" alt=""><div><h4>${R.name} <small>Lv ${r.lvl}</small></h4><p>${SKILLS[R.skill]} ${v} &rarr; <b class="bonus">+${Math.round(v * SKILL_BOOST * 100)}%</b> output</p><p class="dim">${free > 0 || sv.room === k ? 'Open spots: ' + Math.max(free, 0) : 'Full'}</p></div><button ${sv.room === k ? 'disabled' : free > 0 ? 'class="go"' : 'disabled'} data-act="assignto" data-key="${k}" data-id="${sv.id}">${sv.room === k ? 'Here' : 'Send'}</button></div>`; }).join('');
    return wrap(`<div class="shead"><h3>${sv.name}</h3><button data-act="crew">Back</button></div><div class="svlist">${svRow(sv)}</div>${sv.room ? `<button data-act="assignto" data-id="${sv.id}" data-key="">Stop working</button>` : ''}<div class="opts">${rows || '<p class="dim">No room needs staff yet.</p>'}</div>`);
  }
  if (sheet.kind === 'staff') { // pick a survivor for one room
    const key = sheet.key, r = S.base.rooms[key], R = ROOMS[r.type], rows = S.base.survivors.filter((sv) => sv.room !== key).sort((a, b) => b.skills[R.skill] - a.skills[R.skill]).map((sv) => svRow(sv, `<div class="svbtn"><b class="bonus">+${Math.round(sv.skills[R.skill] * SKILL_BOOST * 100)}%</b><button class="go" data-act="assignto" data-id="${sv.id}" data-key="${key}">Assign</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>Staff the ${R.name}</h3><button data-act="open" data-key="${key}">Back</button></div><p class="dim">Best ${SKILLS[R.skill]} skill first.</p><div class="svlist">${rows || '<p class="dim">No other survivors.</p>'}</div>`);
  }
  const r = S.base.rooms[sheet.key]; if (!r) return ''; const R = ROOMS[r.type], l = r.lvl, F = flows(S), fo = F.rooms[sheet.key] || { eff: 1, boost: 0 };
  const building = S.base.build && S.base.build.key === sheet.key && S.base.build.kind === 'up', busy = !!S.base.build, c = upgradeCost(l), can = S.gold >= c.gold && (S.scrap || 0) >= c.scrap;
  const staff = R.skill ? staffOf(S, sheet.key) : [], slots = R.skill ? staffSlots(l) : 0;
  const mult = fo.eff * (1 + Math.min(1, fo.boost));
  return wrap(`<div class="sart" style="background-image:linear-gradient(transparent 30%, #0e1218), url(art/room_${R.art}.jpg)"></div><div class="shead"><h3>${R.name} <em>Lv ${l}</em></h3><button data-act="closesheet">Close</button></div>
    <p>${R.desc}</p>${makes(R, l) ? `<p class="bonus">Makes: ${makes(R, l)}${fo.boost ? ` <b>(+${Math.round(fo.boost * 100)}% from staff)</b>` : ''}</p>` : ''}${R.bonus ? `<p class="bonus">Bonus: ${R.bonus(l, mult)}</p>` : ''}${need(R, l) ? `<p class="dim">Uses: ${need(R, l)}</p>` : ''}
    ${r.haunted ? `<div class="hauntbox"><b>&#128123; HAUNTED</b> output is down 60%. <button data-act="cleanse" data-key="${sheet.key}" ${(S.scrap || 0) >= cleanseCost(S, sheet.key).scrap ? 'class="go"' : 'disabled'}>Cleanse (${cleanseCost(S, sheet.key).scrap} scrap)</button></div>` : ''}
    ${fo.eff < 0.98 && !r.haunted ? `<p class="warn">Running at ${Math.round(fo.eff * 100)}%: ${F.demand > F.supply ? 'not enough electricity. ' : ''}${F.rate.water < 0 && S.base.res.water <= 0 ? 'out of water. ' : ''}${S.base.res.food <= 0 ? 'people are hungry.' : ''}</p>` : ''}
    ${R.skill ? `<div class="crewbox"><h4>Staff <small>${staff.length}/${slots} spots · skill: ${SKILLS[R.skill]}</small></h4>${staff.map((sv) => `<div class="svmini">${portrait(sv)}<span>${sv.name}<small>${SKILLS[R.skill]} ${sv.skills[R.skill]} &rarr; +${Math.round(sv.skills[R.skill] * SKILL_BOOST * 100)}%</small></span><button data-act="assignto" data-id="${sv.id}" data-key="">Remove</button></div>`).join('')}${staff.length < slots ? `<button data-act="staffpick" data-key="${sheet.key}">+ Assign a survivor</button>` : ''}</div>` : ''}
    ${building ? `<div class="build"><span>Upgrading... <b data-build="${sheet.key}">${fmtDur((S.base.build.end - Date.now()) / 1000)}</b></span><div class="bar"><i data-buildbar="${sheet.key}" style="width:${Math.min(100, (1 - (S.base.build.end - Date.now()) / 1000 / upgradeSecs(l)) * 100)}%"></i></div></div>`
      : `<button class="upg ${can && !busy ? 'go' : ''}" data-act="room" data-key="${sheet.key}" ${can && !busy ? '' : 'disabled'}>Upgrade to level ${l + 1}<small>${c.gold.toLocaleString()} gold · ${c.scrap} scrap · ${fmtDur(upgradeSecs(l))}${busy ? ' · builders busy' : !can ? ' · not enough yet' : ''}</small></button>`}`);
}
function renderCamp() {
  const hs = heroStats(S), open = openSlots(S), keep = $('#screen').scrollTop, tf = topFloor(S), F = tf + 2, ROOF = 70, H = ROOF + F * 100 + 60, waiting = S.base.door.length;
  screen(`${top()}<div class="body church">
    <div class="banner" style="background-image:linear-gradient(rgba(5,7,10,.2), rgba(5,7,10,.88)), url(art/bg_church.jpg)"><div class="bleft"><img src="art/hero_${S.hero}_1.png" onerror="this.style.display='none'" alt=""></div>
      <div class="bright"><h2>Hauntfall Church</h2><p>${WEAPONS[hs.weaponKind].name} · ${hs.hp} health · might ${hs.power} · best ${S.best} kills · ${S.wins} boss kills</p>
      <label class="chk"><input type="checkbox" id="afkChk" ${S.opts.afk ? 'checked' : ''}> AFK combat: explore, fight and loot by itself, then start the next run</label>
      <button class="big" data-act="run">Enter ${districtName(S.district)} <small>district ${S.district} · boss: ${ENEMIES[districtOf(S.district).boss].name}</small></button>
      <div class="squadrow"><span>Crew ${squadOf().length}/2</span>${squadOf().map((sv) => `<span class="chipx">${portrait(sv)}<em>${sv.name.split(' ')[0]}</em></span>`).join('')}<button data-act="squadpick">${squadOf().length ? 'Change' : '+ Bring survivors'}</button></div>
      ${S.maxDistrict > 1 ? `<div class="stepper"><button data-act="dstep" data-s="-1" ${S.district <= 1 ? 'disabled' : ''}>&#9664;</button><span>District ${S.district} of ${S.maxDistrict}</span><button data-act="dstep" data-s="1" ${S.district >= S.maxDistrict ? 'disabled' : ''}>&#9654;</button></div>` : ''}</div></div>
    ${resBar()}${hauntBanner()}
    <div class="chart" style="aspect-ratio:500/${H}">${outlineSvg(F, H, ROOF)}${Array.from({ length: F }, (_, f) => Array.from({ length: COLS }, (_, c) => cellHtml({ key: slotKey(f, c), f, c }, open, F, ROOF, H))).flat().join('')}
      <button class="door ${waiting ? 'knock' : ''}" data-act="door" style="top:${(ROOF + F * 100 + 6) / H * 100}%"><span class="dr">&#128682;</span>${waiting ? `<b class="bdg">${waiting}</b>` : ''}<small>${waiting ? 'Someone is at the door!' : 'Front door'}</small></button></div>
    <p class="hint">Tap a room to upgrade it and staff it. Tap a <b>+</b> to build a new room beside or above. The church can grow forever.</p></div>${sheetHtml()}${msg ? `<div class="msg">${msg}</div>` : ''}`);
  $('#screen').scrollTop = keep;
  const c = $('#afkChk'); if (c) c.onchange = () => { S.opts.afk = c.checked; save(); };
  flashMsg(); clearInterval(UI.baseT); UI.baseT = setInterval(refreshBase, 1000);
}
let lastSig = '';
function baseSig() { return S.base.door.length + '|' + S.base.survivors.length + '|' + (S.base.build ? 1 : 0) + '|' + (S.base.haunt && S.base.haunt.active ? 1 : 0); }
function refreshBase() {
  if (tab !== 'camp' || !$('#screen').classList.contains('on') || !$('.chart')) { clearInterval(UI.baseT); return; }
  const before = baseSig(), done = tickBase(S), hev = tickHaunt(S); if (hev) { sheet = { kind: 'hauntreport', rep: hev }; save(); renderCamp(); return; } if (done) { save(); const r = S.base.rooms[done]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; renderCamp(); return; }
  if (baseSig() !== before) { save(); renderCamp(); return; }
  const hl = $('[data-hleft]'); if (hl && S.base.haunt && S.base.haunt.active) hl.textContent = fmtDur((S.base.haunt.active.end - Date.now()) / 1000);
  const F = flows(S), r = S.base.res, rb = $('.resbar'); if (rb) { const set = (sel, html, bad) => { const el = rb.querySelector(sel); if (el) { el.innerHTML = html; el.classList.toggle('bad', !!bad); } }; set('[data-r="pow"]', `&#9889; <b>${Math.round(F.supply)}</b>/${Math.round(F.demand)}<small>power</small>`, F.demand > F.supply); set('[data-r="water"]', `&#128167; <b>${Math.floor(r.water)}</b><small>${rate1(F.rate.water)}</small>`, r.water <= 0); set('[data-r="food"]', `&#127830; <b>${Math.floor(r.food)}</b><small>${rate1(F.rate.food)}</small>`, r.food <= 0); }
  const top2 = $('.top .stat'); if (top2) { const g = top2.querySelector('.gold'), sc = top2.querySelector('.scrap'); if (g) g.textContent = `${Math.floor(S.gold).toLocaleString()} gold`; if (sc) sc.textContent = `${Math.floor(S.scrap || 0).toLocaleString()} scrap`; }
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
  if (act === 'dstep') { S.district = Math.max(1, Math.min(S.maxDistrict, S.district + +d.s)); save(); renderCamp(); return; }
  if (act === 'district') { S.district = +d.d; save(); renderCamp(); return; }
  if (act === 'defend') { if (S.base.haunt && S.base.haunt.active) cb.startHaunt(); return; }
  if (act === 'hold') { const H = S.base.haunt && S.base.haunt.active; if (!H) return; const win = defense(S) * (0.85 + Math.random() * 0.3) >= H.strength; sheet = { kind: 'hauntreport', rep: resolveHaunt(S, win, false) }; save(); renderCamp(); return; }
  if (act === 'cleanse') { const r = cleanse(S, d.key); msg = r === 'ok' ? 'The room is cleansed.' : 'Not enough scrap.'; if (r === 'ok') save(); renderCamp(); return; }
  if (act === 'squadpick') { sheet = { kind: 'squad' }; renderCamp(); return; }
  if (act === 'squadtoggle') { S.squad = S.squad || []; const id = +d.id, i = S.squad.indexOf(id); if (i >= 0) S.squad.splice(i, 1); else if (S.squad.length < 2) { S.squad.push(id); const sv = survivorById(S, id); if (sv) sv.room = null; } save(); renderCamp(); return; }
  if (act === 'open') { sheet = { kind: 'room', key: d.key }; renderCamp(); return; }
  if (act === 'slot') { sheet = { kind: 'build', key: d.key }; renderCamp(); return; }
  if (act === 'door') { sheet = { kind: 'door' }; renderCamp(); return; }
  if (act === 'crew') { sheet = { kind: 'crew' }; renderCamp(); return; }
  if (act === 'assignpick') { sheet = { kind: 'assign', id: +d.id }; renderCamp(); return; }
  if (act === 'staffpick') { sheet = { kind: 'staff', key: d.key }; renderCamp(); return; }
  if (act === 'closesheet') { sheet = null; renderCamp(); return; }
  if (act === 'assignto') { const r = assign(S, +d.id, d.key || null); if (r === 'full') msg = 'That room is already fully staffed.'; else save(); if (sheet && sheet.kind === 'assign') sheet = { kind: 'crew' }; else if (sheet && sheet.kind === 'staff') sheet = { kind: 'room', key: sheet.key }; renderCamp(); return; }
  if (act === 'letin') { const r = recruit(S, +d.i); msg = r === 'ok' ? 'Welcome to the church!' : r === 'nobeds' ? 'No free beds. Build a Bedroom.' : 'Nobody there.'; save(); if (!S.base.door.length) sheet = null; renderCamp(); return; }
  if (act === 'turnaway') { S.base.door.splice(+d.i, 1); save(); if (!S.base.door.length) sheet = null; renderCamp(); return; }
  if (act === 'room') { const r = startUpgrade(S, d.key); if (r === 'ok') { save(); msg = `${ROOMS[S.base.rooms[d.key].type].name} upgrade started.`; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
  if (act === 'build') { const r = startBuild(S, sheet.key, d.type); if (r === 'ok') { save(); msg = `Building the ${ROOMS[d.type].name}...`; sheet = null; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
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
function hauntDone(r) {
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar); S.gold += r.gold; S.scrap = (S.scrap || 0) + r.scrap;
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  const rep = resolveHaunt(S, won, true); save(); r.destroy(); UI.stopAfkTimer();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? 'THE CHURCH HOLDS' : 'THE CHURCH FALLS'}</h1><p class="sub">${won ? 'You drove the ghosts back from the doors.' : 'The ghosts broke through while you fought.'}</p>
    <div class="stats"><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${r.gold + (won ? rep.gold : 0)}</b></div><div><small>Scrap</small><b>${r.scrap + (won ? rep.scrap : 0)}</b></div><div><small>Gear</small><b>${items.length}</b></div><div><small>Result</small><b>${won ? 'Held' : 'Lost'}</b></div></div>
    ${won ? `<p class="sub">Church reward: +${rep.gold} gold, +${rep.scrap} scrap${rep.survivor ? ' · a survivor is at the door!' : ''}</p>` : `<p class="sub">${rep.haunted.length ? rep.haunted.join(' and ') + ' haunted. ' : ''}Some food and water spoiled.</p>`}
    <div class="bag small">${items.map((it) => cardHtml(it)).join('')}</div><div class="btns"><button class="go big" data-act="camp">Back to the church</button></div></div>`);
  $('#hud').classList.remove('on');
}
UI.done = (r) => {
  if (r.mode === 'haunt') return hauntDone(r);
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar), earned = r.gold + (won ? 120 * S.district : Math.floor(r.t / 10));
  S.gold += earned; S.scrap = (S.scrap || 0) + r.scrap; S.runs++; S.best = Math.max(S.best, r.kills); if (won) { S.wins++; if (S.district === S.maxDistrict) { S.maxDistrict++; } }
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  if (S.opts.afk) autoEquip(S);
  S.lastSeen = Date.now(); save();
  if (r.retreated) S.opts.afk = false; save(); const afk = !!S.opts.afk; r.destroy();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? (r.boss ? r.boss.def.name.toUpperCase() + ' FALLS' : 'VICTORY') : r.retreated ? 'YOU GOT OUT' : 'YOU DIED'}</h1><p class="sub">${won ? 'The district is quiet. For now. A new district opens.' : r.retreated ? 'You slipped away with what you found.' : 'The dead take another one...'}</p>
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
