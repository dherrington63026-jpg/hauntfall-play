// Hauntfall screens and HUD (plain DOM over the canvas).
import { ensureBook, addStats, mergeKills, syncDex, ACH, achCur, achDone, claimAch, achReady, dexMonsters } from './book.js';
import { ensureQuests, track, claimable, questText, claimQuest, claimBonus, bonusReady, bonusFor, streakState, claimStreak, streakReward, rewardText } from './quests.js';
import { give, rewardText as rwText } from './quests.js';
import { ensureRank, gainRank, runXp, rankNeed, rankRewards } from './rank.js';
import { HEROES, heroOf } from './heroes.js';
import { PETS, petOf, petLv, petNeed, petXp } from './pets.js';
import { EVENT, EV_SHOP, EV_MILESTONES, eventActive, eventDaysLeft, evState } from './data.js';
import { readyStory, chooseStory, fill, ensureStories } from './stories.js';
import { TALENTS, TALENT_BRANCHES, talentLvl, talentCost, buyTalent, echoGain, MODS, MODS_MAX, NM_MAX, nmName, runOpts } from './data.js';
import { PERKS, GEMS, GEM_KEYS, GEM_TIER, GEM_MAX, gemName, gemText, fuseCost, fuseGems, socketGem, unsocketGem, releaseGems, transmute, transmuteCost, loose, reattune, reattuneCost, autoAssign, buildMul, rushCost, rushBuild, dismantle, dismantleValue, SETS, setCounts, setBonus, maxUp, ascend, ascendCost, reforge, reforgeCost, districtName, districtOf, ENEMIES, RARITIES, SLOTS, SLOT_NAME, STAT_LABEL, PCT, WEAPONS, ROOMS, ROOM_ORDER, SKILLS, SKILL_KEYS, SKILL_BOOST, COLS, heroStats, itemStat, itemScore, upCost, salvageValue, autoEquip, writeSave, tickBase, startUpgrade, startBuild, buildOf, builderCount, BUILDERS_MAX, openSlots, newRoomCost, upgradeCost, upgradeSecs, topFloor, slotKey, parseKey, staffSlots, staffOf, survivorById, assign, recruit, beds, capacity, flows, jobOf, makeItem, tickHaunt, resolveHaunt, defense, hauntStrength, cleanse, cleanseCost } from './data.js';
import { iconUrl, hasArt } from './art.js';
import { Music } from './music.js';

const $ = (s) => document.querySelector(s);
export const UI = {};
let S = null, cb = {};
UI.init = (save, callbacks) => { S = save; cb = callbacks; bindStatic(); };
const save = () => writeSave(S);
const fmtStat = (k, v) => (PCT.has(k) ? '+' + Math.round(v * 100) + '%' : k === 'regen' ? '+' + v.toFixed(1) : '+' + Math.round(v));
const fmtTime = (m) => { m = Math.floor(m); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const icon = (it) => { const u = iconUrl(it.icon); return u ? `<img src="${u}" alt="">` : `<span class="noimg">${it.icon.slice(0, 2).toUpperCase()}</span>`; };
const cardHtml = (it, extra = '') => `<button class="itc r${it.rar}" data-item="${it.id}" style="--r:${RARITIES[it.rar].color}">${icon(it)}${it.up ? `<em>+${it.up}${it.asc ? '&#9733;'.repeat(it.asc) : ''}</em>` : (it.asc ? `<em>${'&#9733;'.repeat(it.asc)}</em>` : '')}${it.set != null ? `<i class="setdot" style="background:${SETS[it.set].color}" title="${SETS[it.set].name}"></i>` : ''}${extra}</button>`;

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
  { const th = $('#threat'); if (th) th.textContent = r.mode === 'haunt' || r.mode === 'rush' ? '-' : r.press.toFixed(1); }
  { const uf = $('#ultFill'), df = $('#dashFill'); if (uf) { uf.style.height = Math.min(100, r.ult / r.ultMax * 100) + '%'; $('#btnUlt').classList.toggle('ready', r.ult >= r.ultMax); df.style.height = Math.min(100, (1 - r.dashCd / r.dashMax) * 100) + '%'; $('#btnDash').classList.toggle('ready', r.dashCd <= 0); } }
  const now = performance.now(); if (now - lastHud < 50) return; lastHud = now;
  $('#hpFill').style.width = Math.max(0, r.hero.hp / r.maxHp * 100) + '%'; $('#hpText').textContent = `${Math.ceil(Math.max(0, r.hero.hp))} / ${Math.round(r.maxHp)}`;
  $('#xpFill').style.width = (r.xp / r.xpNeed * 100) + '%'; $('#lvl').textContent = r.level;
  const t = Math.max(0, Math.floor(r.bossOut ? r.t - r.runLen : r.runLen - r.t)), el = Math.floor(r.t); $('#timer').textContent = r.mode === 'rush' ? `BOSS ${Math.min(r.rushIdx + 1, r.rushList.length)}/${r.rushList.length}` : r.mode === 'endless' ? `${Math.floor(el / 60)}:${String(el % 60).padStart(2, '0')}` : r.bossOut ? 'BOSS' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  $('#gold').textContent = r.gold; $('#kills').textContent = r.kills; document.body.classList.toggle('low', r.hero.hp < r.maxHp * 0.3);
};
UI.toast = (msg) => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = msg; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2200); while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove(); };
UI.lootToast = (it) => { const d = document.createElement('div'); d.className = 'toast loot'; d.style.setProperty('--r', RARITIES[it.rar].color); d.innerHTML = `${icon(it)}<span>${it.name}</span>`; $('#toasts').appendChild(d); setTimeout(() => d.remove(), 2600); while ($('#toasts').children.length > 4) $('#toasts').firstChild.remove(); };
UI.bossBar = (on, name) => { $('#bossbar').classList.toggle('on', on); if (on) { $('#bossFill').style.width = '100%'; if (name) $('#bossbar b').textContent = name; } };
UI.bossHp = (f) => { $('#bossFill').style.width = Math.max(0, f * 100) + '%'; };
UI.bindActs = (dash, ult) => { const b = (id, f) => { const el = $(id); if (el) el.onpointerdown = (e) => { e.preventDefault(); e.stopPropagation(); f(); }; }; b('#btnDash', dash); b('#btnUlt', ult); };
UI.flash = () => { const v = $('#vig'); v.classList.remove('burst'); void v.offsetWidth; v.classList.add('burst'); };
UI.combo = (n) => { const c = $('#combo'); if (!c) return; if (n < 5) { c.classList.remove('on'); return; } c.textContent = n + ' KILLS'; c.classList.add('on'); c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); c.style.setProperty('--s', Math.min(1.7, 1 + n / 150)); };
UI.contract = (txt) => { const c = $('#contract'); if (!c) return; c.textContent = txt; c.classList.toggle('on', !!txt); };
UI.hint = (txt) => { const c = $('#hint'); if (!c) return; c.textContent = txt; c.classList.remove('on'); void c.offsetWidth; c.classList.add('on'); clearTimeout(UI.hintT); UI.hintT = setTimeout(() => c.classList.remove('on'), 7000); };
UI.joyShow = (x, y) => { const j = $('#joy'); j.style.left = x + 'px'; j.style.top = y + 'px'; j.classList.add('on'); $('#joy i').style.transform = ''; };
UI.joyMove = (dx, dy) => { $('#joy i').style.transform = `translate(${dx * 46}px, ${dy * 46}px)`; };
UI.joyHide = () => $('#joy').classList.remove('on');
UI.levelUp = (choices, pick, title = 'LEVEL UP') => {
  const o = $('#levelup'); o.classList.add('on'); o.querySelector('h2').textContent = title;
  o.querySelector('.cards').innerHTML = choices.map((u, i) => `<button class="up ${u.weapon ? 'wep' : ''} ${u.evo ? 'evo' : ''}" data-i="${i}"><img src="art/skill_${u.id}.jpg" alt="" onerror="this.style.display='none'"><b>${u.name}${(UI.picked && UI.picked[u.id]) ? ' ' + (UI.picked[u.id] + 1) : ''}</b><span>${u.desc}</span>${u.evo ? '<small>EVOLUTION</small>' : u.weapon ? '<small>NEW WEAPON</small>' : ''}</button>`).join('');
  o.onclick = (e) => { const b = e.target.closest('.up'); if (!b) return; o.classList.remove('on'); o.onclick = null; pick(choices[+b.dataset.i]); };
};

// ---------- screens ----------
UI.hideAll = () => { document.body.classList.remove('low', 'hurt'); $('#screen').classList.remove('on'); $('#screen').innerHTML = ''; $('#hud').classList.remove('on'); $('#levelup').classList.remove('on'); $('#bossbar').classList.remove('on'); };
UI.showHud = () => { $('#hud').classList.add('on'); syncAfk(); };
const screen = (html, bg = 'camp', key = '') => { const s = $('#screen'), keep = key && s.dataset.k === key, y = s.scrollTop; s.innerHTML = html; s.className = 'on bg-' + bg; s.dataset.k = key; s.scrollTop = keep ? y : 0; };
let tab = 'camp', sel = null, msg = '';

UI.camp = () => { Music.play('camp'); tab = 'camp'; sel = null; sheet = null; const d = tickBase(S); const ev = tickHaunt(S); if (ev) sheet = { kind: 'hauntreport', rep: ev }; save(); if (d) { const r = S.base.rooms[d]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; } renderCamp(); };
function top() {
  const hs = heroStats(S);
  return `<div class="top"><h1>HAUNTFALL</h1><div class="tabs"><button data-act="tab" data-t="camp" class="${tab === 'camp' ? 'on' : ''}">Church</button><button data-act="tab" data-t="gear" class="${tab === 'gear' ? 'on' : ''}">Gear</button><button data-act="tab" data-t="quests" class="${tab === 'quests' ? 'on' : ''}">Quests${claimable(S) ? ' <i class="qdot"></i>' : ''}</button><button data-act="tab" data-t="book" class="${tab === 'book' ? 'on' : ''}">Book${achReady(S) ? ' <i class="qdot"></i>' : ''}</button></div><div class="stat"><span class="gold">${S.gold.toLocaleString()} gold</span><span class="scrap">${Math.floor(S.scrap || 0).toLocaleString()} scrap</span><span>Might ${hs.power}</span><span class="rk">Rank ${ensureRank(S).lv}</span></div></div>`;
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
    <button class="rc crew" data-act="crew">&#128101; <b>${pop}</b>/${bd}<small>survivors</small></button><button class="rc crew" data-act="builders">&#128296; <b>${S.base.builds.length}</b>/${builderCount(S)}<small>builders</small></button></div>${F.demand > F.supply ? '<p class="warn">Not enough electricity: rooms are running slow. Build or upgrade a Generator.</p>' : ''}`;
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
  if (r && r.lvl === 0) { const R = ROOMS[r.type]; return `<div class="cell scaffold" style="${pos}"><span>${R.name}</span><b data-build="${sl.key}">${fmtDur((buildOf(S, sl.key).end - Date.now()) / 1000)}</b></div>`; }
  if (r) { const R = ROOMS[r.type], bo = buildOf(S, sl.key), up = bo && bo.kind === 'up', staff = R.skill ? staffOf(S, sl.key).length : 0, slots = R.skill ? staffSlots(r.lvl) : 0;
    return `<button class="cell room ${cellStatus(sl.key)} ${r.haunted ? 'haunted' : ''}" data-act="open" data-key="${sl.key}" style="${pos};background-image:url(art/room_${R.art}.jpg)"><b class="lv">${r.lvl}</b>${r.haunted ? '<i class="ghost">&#128123;</i>' : ''}${slots ? `<i class="crewdot">${'&#9679;'.repeat(staff)}${'&#9675;'.repeat(slots - staff)}</i>` : ''}<span class="nm">${R.name}</span>${up ? '<em data-up="' + sl.key + '">' + fmtDur((bo.end - Date.now()) / 1000) + '</em>' : ''}</button>`; }
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
  if (sheet.kind === 'story') {
    if (sheet.res) { const r = sheet.res; return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>${r.title}</h3><button data-act="closesheet">Close</button></div><p class="story">${r.text}</p>${r.got.length ? `<p class="total">${r.got.join(' · ')}</p>` : ''}${r.last ? '<p class="dim">That is the end of their story, and they will always remember that you listened.</p>' : '<p class="dim">There will be more to hear in a few hours.</p>'}<div class="btns"><button class="go" data-act="closesheet">Back to the church</button></div></div></div>`; }
    const st = readyStory(S); if (!st) return '';
    return `<div class="sheetbg"><div class="sheet"><div class="shead"><h3>${st.arc.title} <small>part ${st.n + 1} of 3</small></h3><button data-act="closesheet">Later</button></div><p class="story">${fill(st.beat.text, st.sv)}</p><div class="svlist">${st.beat.ch.map((c, i) => `<button class="storych" data-act="storychoose" data-i="${i}">${fill(c.label, st.sv)}</button>`).join('')}</div></div></div>`;
  }
  if (sheet.kind === 'heroes') {
    const lv = ensureRank(S).lv;
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Choose your hero</h3><button data-act="closesheet">Close</button></div><p class="dim">New heroes unlock as your Rank grows. Each one starts every run with a small kit.</p><div class="svlist">${HEROES.filter((h) => hasArt('hero_' + h.id)).map((h) => { const ok = lv >= h.rank, on = S.hero === h.id; return `<div class="herorow ${ok ? '' : 'locked'} ${on ? 'on' : ''}"><img src="art/hero_${h.id}_1.png" alt=""><div><b>${h.name}</b> <small>${h.sub}</small><p>${h.desc}</p></div><button class="${ok && !on ? 'go' : ''}" data-act="pickhero" data-h="${h.id}" ${ok && !on ? '' : 'disabled'}>${on ? 'Chosen' : ok ? 'Choose' : 'Rank ' + h.rank}</button></div>`; }).join('')}</div><h4>Companion</h4><div class="svlist"><div class="herorow ${S.pet ? '' : 'on'}"><div></div><div><b>No companion</b><p>Go out alone.</p></div><button data-act="pickpet" data-p="" ${S.pet ? '' : 'disabled'}>${S.pet ? 'Choose' : 'Chosen'}</button></div>${PETS.filter((p) => hasArt('pet_' + p.id)).map((p) => { const ok = lv >= p.rank, on = S.pet === p.id, L = petLv(S, p.id), pr = (S.pets && S.pets[p.id]) || { xp: 0 }; return `<div class="herorow ${ok ? '' : 'locked'} ${on ? 'on' : ''}"><img src="art/pet_${p.id}.png" alt=""><div><b>${p.name}</b> <small>level ${L}${L < 10 ? ' · ' + pr.xp + '/' + petNeed(L) + ' XP' : ' · max'}</small><p>${p.desc}</p></div><button class="${ok && !on ? 'go' : ''}" data-act="pickpet" data-p="${p.id}" ${ok && !on ? '' : 'disabled'}>${on ? 'Chosen' : ok ? 'Choose' : 'Rank ' + p.rank}</button></div>`; }).join('')}</div></div></div>`;
  }
  if (sheet.kind === 'evshop') {
    const ev = evState(S);
    const ms = EV_MILESTONES.map((m) => { const got = !!ev.claimed[m.n], ok = ev.total >= m.n; return `<div class="qrow ${got ? 'done' : ''}"><div class="qinfo"><b>Collect ${m.n} pumpkins</b><div class="bar"><i style="width:${Math.min(100, ev.total / m.n * 100)}%"></i></div><small>${Math.min(ev.total, m.n)} / ${m.n} · reward: ${rwText(m.rew)}</small></div><button class="${ok && !got ? 'go' : ''}" data-act="evclaim" data-n="${m.n}" ${ok && !got ? '' : 'disabled'}>${got ? 'Done' : ok ? 'Claim' : 'Active'}</button></div>`; }).join('');
    const shop = EV_SHOP.map((it) => { const had = it.once && ev.bought[it.id], can = ev.p >= it.cost && !had; return `<div class="qrow ${had ? 'done' : ''}"><div class="qinfo"><b>${it.name}</b><small>${it.desc}</small></div><button class="${can ? 'go' : ''}" data-act="evbuy" data-id="${it.id}" ${can ? '' : 'disabled'}>${had ? 'Owned' : it.cost + ' pumpkins'}</button></div>`; }).join('');
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>${EVENT.name} <small>${eventDaysLeft()} day${eventDaysLeft() === 1 ? '' : 's'} left</small></h3><button data-act="closesheet">Close</button></div>
      <p class="dim">Pumpkins drop from monsters during the event, and the new Pumpkin Heads, Scarecrows and the Pumpkin King drop the most. Spend them here before the event ends.</p><p class="total">You have <b>${ev.p}</b> pumpkins · ${ev.total} collected in total</p>
      <h4>Rewards for collecting</h4>${ms}<h4>Pumpkin Patch</h4>${shop}</div></div>`;
  }
  if (sheet.kind === 'chal') {
    const rec = S.rec || {}, e = rec.endless || { t: 0, kills: 0, bosses: 0 }, ru = rec.rush || { best: 0, done: 0 }, mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
    const eo = (S.wins || 0) >= 1, ro = (S.wins || 0) >= 3;
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Challenges</h3><button data-act="closesheet">Close</button></div>
      <div class="chcard"><h4>Endless Descent</h4><p class="dim">No boss to end it. The dead keep coming, stronger every minute, with a boss every few minutes. Survive as long as you can.</p><p class="rec">Best: ${e.t ? `${mm(e.t)} · ${e.bosses} boss${e.bosses === 1 ? '' : 'es'}` : 'not played yet'}</p><button class="${eo ? 'go' : ''}" data-act="chal" data-m="endless" ${eo ? '' : 'disabled'}>${eo ? 'Start' : 'Beat a district boss to unlock'}</button></div>
      <div class="chcard"><h4>Boss Rush</h4><p class="dim">All twelve bosses, one after another, from the Gravekeeper to the Crimson Queen. A short breather and a free upgrade between each. Heals a little with every win.</p><p class="rec">Best: ${ru.best} / 12 bosses${ru.done ? ` · cleared ${ru.done}x` : ''}</p><button class="${ro ? 'go' : ''}" data-act="chal" data-m="rush" ${ro ? '' : 'disabled'}>${ro ? 'Start' : 'Beat 3 district bosses to unlock'}</button></div>
      <p class="dim">Your Run options (Nightmare and curses) apply to challenges too, for more rewards.</p></div></div>`;
  }
  if (sheet.kind === 'runopts') {
    const o = runOpts(S), un = S.nm || 0;
    const mods = Object.entries(MODS).map(([k, m]) => { const on = o.mods.includes(k), full = !on && o.mods.length >= MODS_MAX; return `<button class="modrow ${on ? 'on' : ''}" data-act="modtoggle" data-m="${k}" ${full ? 'disabled' : ''}><b>${m.name}</b><small>${m.desc}</small><em>+${Math.round(m.rew * 100)}%</em></button>`; }).join('');
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Run options</h3><button data-act="closesheet">Close</button></div>
      <p class="dim">Harder runs pay more gold, loot and XP. Beat a district boss on your highest Nightmare to unlock the next one.</p>
      <div class="nmrow"><button data-act="nmstep" data-s="-1" ${o.nm <= 0 ? 'disabled' : ''}>&#9664;</button><div><b>${nmName(o.nm)}</b><small>enemies +${o.nm * 35}% health, +${o.nm * 25}% damage · unlocked up to ${nmName(Math.min(NM_MAX, un))}</small></div><button data-act="nmstep" data-s="1" ${o.nm >= Math.min(NM_MAX, un) ? 'disabled' : ''}>&#9654;</button></div>
      <h4>Curses <small>pick up to ${MODS_MAX}</small></h4><div class="modlist">${mods}</div>
      <p class="total">Total reward: <b>+${Math.round((o.rew - 1) * 100)}%</b> gold, loot luck and XP</p></div></div>`;
  }
  if (sheet.kind === 'gempick') { const gems = S.gems.slice().sort((a, b) => b.tier - a.tier);
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Choose a gem</h3><button data-act="closesheet">Close</button></div><div class="svlist">${gems.map((g) => `<div class="gemrow">${gemChip(g)}<div><b>${gemName(g)}</b><small>${gemText(g)}</small></div><button class="go" data-act="socketdo" data-gem="${g.id}">Socket</button></div>`).join('') || '<p class="dim">You have no gems. Elites and bosses drop them.</p>'}</div></div></div>`; }
  if (sheet.kind === 'setpick') { const it = find(sheet.id); if (!it) return '';
    return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>Change set</h3><button data-act="closesheet">Close</button></div><p class="dim">Re-attune ${it.name} to another set. Cost: ${reattuneCost(it).scrap} scrap. Its other stats stay the same.</p><div class="svlist">${SETS.map((S0, i) => `<div class="gemrow"><span class="rtag" style="--r:${S0.color}">${S0.name}</span><div><small>${[2, 4, 6].map((t) => t + ': ' + S0.tiers[t].desc).join(' · ')}</small></div><button class="${it.set === i ? '' : 'go'}" data-act="setdo" data-set="${i}" ${it.set === i || (S.scrap || 0) < reattuneCost(it).scrap ? 'disabled' : ''}>${it.set === i ? 'Current' : 'Attune'}</button></div>`).join('')}</div></div></div>`; }
  if (sheet.kind === 'hauntreport') { const p = sheet.rep; return `<div class="sheetbg" data-act="closesheet"><div class="sheet"><div class="shead"><h3>${p.won ? 'THE CHURCH HELD' : 'THE CHURCH WAS OVERRUN'}</h3><button data-act="closesheet">Close</button></div><p>${p.won ? `The ghosts (strength ${p.strength}) were driven back${p.byHand ? ' by your own hand' : ''}.` : `The ghosts (strength ${p.strength}) broke through.`}</p>${p.won ? `<p class="bonus">+${p.gold} gold, +${p.scrap} scrap${p.survivor ? ', and a survivor is knocking at the door!' : ''}</p>` : `<p class="warn">${p.haunted.length ? p.haunted.join(' and ') + (p.haunted.length > 1 ? ' are' : ' is') + ' haunted (output down 60% until cleansed). ' : ''}A quarter of the water and food spoiled.</p>`}</div></div>`; }
  const wrap = (inner) => `<div class="sheetbg" data-act="closesheet"><div class="sheet">${inner}</div></div>`;
  if (sheet.kind === 'build') {
    const c = newRoomCost(S), busy = S.base.builds.length >= builderCount(S), poor = S.gold < c.gold || (S.scrap || 0) < c.scrap;
    const rows = ROOM_ORDER.map((t) => { const R = ROOMS[t]; return `<div class="opt"><img src="art/room_${R.art}.jpg" alt=""><div><h4>${R.name}</h4><p>${R.desc}</p><p class="bonus">${makes(R, 1) || (R.bonus ? R.bonus(1, 1) : '')}</p><p class="dim">${need(R, 1) ? 'Needs ' + need(R, 1) : 'Needs nothing'}</p></div><button class="${!busy && !poor ? 'go' : ''}" data-act="build" data-type="${t}" ${busy || poor ? 'disabled' : ''}>Build</button></div>`; }).join('');
    return wrap(`<div class="shead"><h3>Build a room</h3><button data-act="closesheet">Close</button></div><p class="cost">Cost: <b class="gold">${c.gold.toLocaleString()} gold</b> · <b class="scrap">${c.scrap} scrap</b> · ${fmtDur(Math.round(c.secs * buildMul(S)))}${busy ? ' · <b style="color:#ff9a7a">builders busy</b>' : poor ? ' · <b style="color:#ff9a7a">not enough yet</b>' : ''}</p><div class="opts">${rows}</div>`);
  }
  if (sheet.kind === 'door') {
    const bd = beds(S), pop = S.base.survivors.length, rows = S.base.door.map((sv, i) => svRow(sv, `<div class="svbtn"><button class="${pop < bd ? 'go' : ''}" data-act="letin" data-i="${i}" ${pop < bd ? '' : 'disabled'}>Let in</button><button data-act="turnaway" data-i="${i}">Turn away</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>At the front door</h3><button data-act="closesheet">Close</button></div><p>${rows ? 'Survivors knock at the door, asking to stay. Each one has skills. Put them in the matching room to boost it.' : 'Nobody is at the door right now. Survivors show up every so often (a Bell Tower helps them find you).'}</p><p class="cost">Beds: <b>${pop}/${bd}</b>${pop >= bd ? ' · <b style="color:#ff9a7a">full, build a Bedroom</b>' : ''}</p><div class="svlist">${rows}</div>`);
  }
  if (sheet.kind === 'builders') {
    const slots = Array.from({ length: BUILDERS_MAX }, (_, i) => { if (i >= builderCount(S)) return `<div class="bslot lock"><b>Builder ${i + 1}</b><span>Locked</span></div>`; const b = S.base.builds[i]; if (!b) return `<div class="bslot"><b>Builder ${i + 1}</b><span class="dim">Waiting for work</span></div>`; const r = S.base.rooms[b.key]; return `<div class="bslot busy"><b>Builder ${i + 1}</b><span>${b.kind === 'new' ? 'Building' : 'Upgrading'} the ${ROOMS[r.type].name}</span><em data-bld="${b.key}">${fmtDur((b.end - Date.now()) / 1000)}</em><button class="${S.gold >= rushCost(b) ? 'go' : ''}" data-act="rush" data-key="${b.key}" ${S.gold >= rushCost(b) ? '' : 'disabled'}>Finish now · ${rushCost(b).toLocaleString()} gold</button></div>`; }).join('');
    return wrap(`<div class="shead"><h3>Builders</h3><button data-act="closesheet">Close</button></div><p class="dim">Each builder works on one room at a time, so more builders means more rooms going up or getting upgraded at once.</p><div class="bslots">${slots}</div>`);
  }
  if (sheet.kind === 'squad') {
    const inSq = (sv) => (S.squad || []).includes(sv.id), full = squadOf().length >= 2;
    const rows = S.base.survivors.map((sv) => svRow(sv, `<div class="svbtn"><span class="role">${ROLE[sv.main]}</span><button class="${inSq(sv) ? 'on' : full ? '' : 'go'}" data-act="squadtoggle" data-id="${sv.id}" ${!inSq(sv) && full ? 'disabled' : ''}>${inSq(sv) ? 'Bringing' : 'Bring'}</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>Who comes with you?</h3><button data-act="closesheet">Done</button></div><p class="dim">Up to 2 survivors fight beside you in the graveyard. Their job decides how: a nurse heals you, a mechanic builds turrets. They leave their room while they are out.</p><div class="svlist">${rows || '<p class="dim">No survivors yet. They knock at the front door.</p>'}</div>`);
  }
  if (sheet.kind === 'crew') {
    const rows = S.base.survivors.map((sv) => svRow(sv, `<div class="svbtn"><button data-act="assignpick" data-id="${sv.id}">${sv.room ? 'Move' : 'Assign'}</button></div>`)).join('');
    return wrap(`<div class="shead"><h3>Survivors <em>${S.base.survivors.length}/${beds(S)} beds</em></h3><button data-act="closesheet">Close</button></div><div class="btns"><button class="go" data-act="autoassign">Auto-assign best for every post</button></div><p class="dim">Each survivor eats and drinks 0.8 a day-hour. Skill points boost the room they work in by ${SKILL_BOOST * 100}% each.</p><div class="svlist">${rows || '<p class="dim">No survivors yet. They arrive at the front door.</p>'}</div>`);
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
  const bo = buildOf(S, sheet.key), building = bo && bo.kind === 'up', busy = S.base.builds.length >= builderCount(S), c = upgradeCost(l), can = S.gold >= c.gold && (S.scrap || 0) >= c.scrap;
  const staff = R.skill ? staffOf(S, sheet.key) : [], slots = R.skill ? staffSlots(l) : 0;
  const mult = fo.eff * (1 + Math.min(1, fo.boost));
  return wrap(`<div class="sart" style="background-image:linear-gradient(transparent 30%, #0e1218), url(art/room_${R.art}.jpg)"></div><div class="shead"><h3>${R.name} <em>Lv ${l}</em></h3><button data-act="closesheet">Close</button></div>
    <p>${R.desc}</p>${makes(R, l) ? `<p class="bonus">Makes: ${makes(R, l)}${fo.boost ? ` <b>(+${Math.round(fo.boost * 100)}% from staff)</b>` : ''}</p>` : ''}${R.bonus ? `<p class="bonus">Bonus: ${R.bonus(l, mult)}</p>` : ''}${need(R, l) ? `<p class="dim">Uses: ${need(R, l)}</p>` : ''}
    ${r.haunted ? `<div class="hauntbox"><b>&#128123; HAUNTED</b> output is down 60%. <button data-act="cleanse" data-key="${sheet.key}" ${(S.scrap || 0) >= cleanseCost(S, sheet.key).scrap ? 'class="go"' : 'disabled'}>Cleanse (${cleanseCost(S, sheet.key).scrap} scrap)</button></div>` : ''}
    ${fo.eff < 0.98 && !r.haunted ? `<p class="warn">Running at ${Math.round(fo.eff * 100)}%: ${F.demand > F.supply ? 'not enough electricity. ' : ''}${F.rate.water < 0 && S.base.res.water <= 0 ? 'out of water. ' : ''}${S.base.res.food <= 0 ? 'people are hungry.' : ''}</p>` : ''}
    ${R.skill ? `<div class="crewbox"><h4>Staff <small>${staff.length}/${slots} spots · skill: ${SKILLS[R.skill]}</small></h4>${staff.map((sv) => `<div class="svmini">${portrait(sv)}<span>${sv.name}<small>${SKILLS[R.skill]} ${sv.skills[R.skill]} &rarr; +${Math.round(sv.skills[R.skill] * SKILL_BOOST * 100)}%</small></span><button data-act="assignto" data-id="${sv.id}" data-key="">Remove</button></div>`).join('')}${staff.length < slots ? `<button data-act="staffpick" data-key="${sheet.key}">+ Assign a survivor</button>` : ''}</div>` : ''}
    ${building ? `<div class="build"><span>Upgrading... <b data-build="${sheet.key}">${fmtDur((bo.end - Date.now()) / 1000)}</b></span><div class="bar"><i data-buildbar="${sheet.key}" style="width:${Math.min(100, (1 - (bo.end - Date.now()) / 1000 / upgradeSecs(l)) * 100)}%"></i></div></div>`
      : `<button class="upg ${can && !busy ? 'go' : ''}" data-act="room" data-key="${sheet.key}" ${can && !busy ? '' : 'disabled'}>Upgrade to level ${l + 1}<small>${c.gold.toLocaleString()} gold · ${c.scrap} scrap · ${fmtDur(Math.round(upgradeSecs(l) * buildMul(S)))}${busy ? ' · builders busy' : !can ? ' · not enough yet' : ''}</small></button>`}`);
}
function renderCamp() {
  const hs = heroStats(S), open = openSlots(S), keep = $('#screen').scrollTop, tf = topFloor(S), F = tf + 2, ROOF = 70, H = ROOF + F * 100 + 60, waiting = S.base.door.length;
  screen(`${top()}<div class="body church">
    ${(S.tut && S.tut.camp) ? '' : `<div class="tutcard"><b>Welcome to your church</b><p>1. Press <b>Enter</b> to go out and fight. Win a boss to open the next district.<br>2. Tap a <b>+</b> in the church to build rooms. Rooms make food, water, scrap and gold.<br>3. When someone knocks at the door, let them in. Survivors boost your rooms.<br>4. Under <b>Gear</b> you equip loot, add gems and spend Echoes on Talents.</p><button class="go" data-act="tutok">Got it</button></div>`}
    <div class="banner" style="background-image:linear-gradient(rgba(5,7,10,.2), rgba(5,7,10,.88)), url(art/bg_church.jpg)"><div class="bleft"><img src="art/hero_${S.hero}_1.png" onerror="this.style.display='none'" alt=""></div>
      <div class="bright"><h2>Hauntfall Church</h2><p>${WEAPONS[hs.weaponKind].name} · ${Math.round(hs.hp)} health · might ${hs.power} · best ${S.best} kills · ${S.wins} boss kills</p>
      <label class="chk"><input type="checkbox" id="afkChk" ${S.opts.afk ? 'checked' : ''}> AFK combat: explore, fight and loot by itself, then start the next run</label>
      <button class="big" data-act="run">Enter ${districtName(S.district)} <small>district ${S.district} · boss: ${ENEMIES[districtOf(S.district).boss].name}</small></button>
      ${eventActive() ? `<button class="evbanner" data-act="evshop">${EVENT.name} · ${eventDaysLeft()} day${eventDaysLeft() === 1 ? '' : 's'} left · ${evState(S).p} pumpkins<small>Pumpkin Patch: weapons, gear and rewards for the event</small></button>` : ''}
      ${(() => { const st = readyStory(S); return st ? `<button class="evt" data-act="story">&#9733; ${st.sv.name.split(' ')[0]} has something to tell you <small>${st.arc.title} · part ${st.n + 1} of 3</small></button>` : ''; })()}
      <button class="runopt" data-act="heroes">Hero: ${heroOf(S.hero).name}${heroOf(S.hero).kit ? ' (' + heroOf(S.hero).sub + ')' : ''} · change</button>
      <button class="runopt chbtn" data-act="chalsheet">Challenges: Endless Descent &amp; Boss Rush</button>
      <button class="runopt" data-act="runopts">${(() => { const o = runOpts(S); return o.nm || o.mods.length ? `Run options: ${nmName(o.nm)}${o.mods.length ? ' + ' + o.mods.length + ' curse' + (o.mods.length > 1 ? 's' : '') : ''} · +${Math.round((o.rew - 1) * 100)}% loot` : 'Run options: harder runs, better loot'; })()}</button>
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
function baseSig() { return S.base.door.length + '|' + S.base.survivors.length + '|' + S.base.builds.length + '|' + (S.base.haunt && S.base.haunt.active ? 1 : 0); }
function refreshBase() {
  if (tab !== 'camp' || !$('#screen').classList.contains('on') || !$('.chart')) { clearInterval(UI.baseT); return; }
  const before = baseSig(), done = tickBase(S), hev = tickHaunt(S); if (hev) { sheet = { kind: 'hauntreport', rep: hev }; save(); renderCamp(); return; } if (done) { save(); const r = S.base.rooms[done]; msg = `${ROOMS[r.type].name} ${r.lvl === 1 ? 'is ready' : 'is now level ' + r.lvl}!`; renderCamp(); return; }
  if (baseSig() !== before) { save(); renderCamp(); return; }
  const hl = $('[data-hleft]'); if (hl && S.base.haunt && S.base.haunt.active) hl.textContent = fmtDur((S.base.haunt.active.end - Date.now()) / 1000);
  const F = flows(S), r = S.base.res, rb = $('.resbar'); if (rb) { const set = (sel, html, bad) => { const el = rb.querySelector(sel); if (el) { el.innerHTML = html; el.classList.toggle('bad', !!bad); } }; set('[data-r="pow"]', `&#9889; <b>${Math.round(F.supply)}</b>/${Math.round(F.demand)}<small>power</small>`, F.demand > F.supply); set('[data-r="water"]', `&#128167; <b>${Math.floor(r.water)}</b><small>${rate1(F.rate.water)}</small>`, r.water <= 0); set('[data-r="food"]', `&#127830; <b>${Math.floor(r.food)}</b><small>${rate1(F.rate.food)}</small>`, r.food <= 0); }
  const top2 = $('.top .stat'); if (top2) { const g = top2.querySelector('.gold'), sc = top2.querySelector('.scrap'); if (g) g.textContent = `${Math.floor(S.gold).toLocaleString()} gold`; if (sc) sc.textContent = `${Math.floor(S.scrap || 0).toLocaleString()} scrap`; }
  for (const bd of S.base.builds) { const left = (bd.end - Date.now()) / 1000; for (const sel of [`[data-build="${bd.key}"]`, `[data-up="${bd.key}"]`, `[data-bld="${bd.key}"]`]) { const t = $(sel); if (t) t.textContent = fmtDur(left); } const bar = $(`[data-buildbar="${bd.key}"]`); if (bar) bar.style.width = Math.min(100, (1 - left / upgradeSecs(S.base.rooms[bd.key].lvl)) * 100) + '%'; }
}
let gtab = 'gear';
const gsub = () => `<div class="gsub">${[['gear', 'Gear'], ['gems', `Gems <small>${S.gems.length}</small>`], ['forge', 'Forge'], ['tal', `Talents${(S.echo || 0) >= 3 ? ' <i class="qdot"></i>' : ''}`]].map(([k, n]) => `<button data-act="gtab" data-g="${k}" class="${gtab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
const gemChip = (g) => `<span class="gem" style="--gc:${GEMS[g.type].color}" title="${gemName(g)}"><i></i><b>${g.tier}</b></span>`;
function renderGear() {
  if (gtab === 'tal') return renderTalents(); if (gtab === 'gems') return renderGems(); if (gtab === 'forge') return renderForge();
  const hs = heroStats(S), bag = S.bag.slice().sort((a, b) => b.rar - a.rar || itemScore(b) - itemScore(a));
  const eq = SLOTS.map((sl) => S.gear[sl] ? cardHtml(S.gear[sl], `<b class="sl">${SLOT_NAME[sl]}</b>`) : `<div class="itc empty"><b class="sl">${SLOT_NAME[sl]}</b></div>`).join('');
  const detail = sel ? detailHtml(sel) : `<p class="dim">Tap an item to see it. Your stats: damage x${hs.dmgPct.toFixed(2)} · fire rate x${hs.ratePct.toFixed(2)} · ${Math.round(hs.hp)} health · ${Math.round(hs.armor)} armor · ${Math.round(hs.crit * 100)}% crit · speed ${Math.round(hs.speed)}.</p>`;
  screen(`${top()}${gsub()}<div class="body gear"><div class="col"><div class="panel"><h2>Equipped</h2><div class="slots">${eq}</div>${setSummary()}</div><div class="panel detail">${detail}</div></div>
    <div class="col"><div class="panel"><div class="bagtop"><h2>Bag <small>${S.bag.length}</small></h2><div class="btns"><button data-act="auto">Auto equip</button></div><div class="btns"><span class="dim">Sell for gold:</span><button data-act="sellr" data-r="0">white</button><button data-act="sellr" data-r="1">green</button><button data-act="sellr" data-r="2">blue</button><button data-act="sellr" data-r="3">purple</button><button data-act="sellr" data-r="4">orange</button><button data-act="sellr" data-r="all">ALL</button></div><div class="btns"><span class="dim">Scrap for scrap:</span><button data-act="scrapr" data-r="0">white</button><button data-act="scrapr" data-r="1">green</button><button data-act="scrapr" data-r="2">blue</button><button data-act="scrapr" data-r="3">purple</button><button data-act="scrapr" data-r="4">orange</button><button data-act="scrapr" data-r="all">ALL</button></div></div>
    <div class="bag">${bag.map((it) => cardHtml(it)).join('') || '<p class="dim">Nothing yet. Loot drops during runs.</p>'}</div></div></div></div>${sheetHtml()}${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'g-gear');
  flashMsg();
}
function renderGems() {
  const groups = {}; for (const g of S.gems) { const k = g.type + '|' + g.tier; (groups[k] = groups[k] || []).push(g); }
  const rows = Object.entries(groups).sort((a, b) => a[0].split('|')[0].localeCompare(b[0].split('|')[0]) || b[1][0].tier - a[1][0].tier).map(([k, arr]) => { const g = arr[0], can = arr.length >= 3 && g.tier < GEM_MAX; return `<div class="gemrow">${gemChip(g)}<div><b>${gemName(g)}</b><small>${gemText(g)}</small></div><span class="cnt">x${arr.length}</span><button class="${can ? 'go' : ''}" data-act="fuse" data-type="${g.type}" data-tier="${g.tier}" ${can && S.gold >= fuseCost(g.tier) ? '' : 'disabled'}>${g.tier >= GEM_MAX ? 'Max' : `Fuse 3 &rarr; ${GEM_TIER[g.tier + 1]}<small>${fuseCost(g.tier)} gold</small>`}</button></div>`; }).join('');
  screen(`${top()}${gsub()}<div class="body gear"><div class="panel"><div class="bagtop"><h2>Gems</h2><div class="btns"><button class="go" data-act="fuseall">Fuse all</button></div></div><p class="dim">Gems drop from elites and bosses. Socket them into blue, purple, gold and red gear (blue has 1 socket, red has 4). Fuse 3 of the same gem into one better one.</p>${rows || '<p class="dim">No gems yet. Beat elites and bosses to find them.</p>'}</div></div>${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'g-gems');
  flashMsg();
}
function renderTalents() {
  const echo = S.echo || 0;
  const branches = TALENT_BRANCHES.map((b) => `<div class="tbranch" style="--bc:${b.color}"><h3>${b.name}</h3>${Object.entries(TALENTS).filter(([, t]) => t.br === b.id).map(([k, t]) => { const L = talentLvl(S, k), max = L >= t.max, c = max ? 0 : talentCost(k, L), can = !max && echo >= c; return `<div class="tnode ${L ? 'has' : ''}"><div class="tinfo"><b>${t.name} <em>${L}/${t.max}</em></b><small>${L ? t.desc(L) : t.per + ' per level'}</small><div class="bar"><i style="width:${L / t.max * 100}%"></i></div></div><button class="${can ? 'go' : ''}" data-act="talent" data-k="${k}" ${can ? '' : 'disabled'}>${max ? 'Max' : c + ' echoes'}</button></div>`; }).join('')}</div>`).join('');
  screen(`${top()}${gsub()}<div class="body gear"><div class="panel"><h2>Talents <small>${echo.toLocaleString()} Echoes to spend</small></h2><p class="dim">Echoes are the lingering power of the dead you cut down. Every run earns some: more kills, a boss win and a harder Nightmare earn more. Talents are permanent.</p></div><div class="tgrid">${branches}</div></div>${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'g-tal');
  flashMsg();
}
function renderForge() {
  const names = RARITIES.map((r) => r.name), rows = [0, 1, 2, 3, 4].map((r) => { const n = loose(S, r).length, c = transmuteCost(r); return `<div class="gemrow"><span class="rtag" style="--r:${RARITIES[r].color}">${names[r]}</span><div><b>3 ${names[r]} &rarr; 1 ${names[r + 1]}</b><small>You have ${n} in the bag · ${r >= 1 ? '50% chance of a set piece' : 'new random piece'}</small></div><button class="${n >= 3 && (S.scrap || 0) >= c.scrap ? 'go' : ''}" data-act="transmute" data-r="${r}" ${n >= 3 && (S.scrap || 0) >= c.scrap ? '' : 'disabled'}>Transmute<small>${c.scrap} scrap</small></button></div>`; }).join('');
  screen(`${top()}${gsub()}<div class="body gear"><div class="panel"><h2>The Forge</h2><p class="dim">Turn spare gear into something better. Transmute eats the three weakest items of a rarity from your bag (not the ones you wear).</p>${rows}</div>
    <div class="panel"><h2>Other tools</h2><p class="dim">On any item in the Gear tab you can also: <b>Ascend</b> a maxed item for endless levels, <b>Reforge</b> its bonuses, <b>Change set</b> on blue and better gear to chase the set you want, and <b>Dismantle</b> it into scrap.</p></div></div>${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'g-forge');
  flashMsg();
}
function setSummary() { const cnt = setCounts(S), ids = Object.keys(cnt).filter((id) => cnt[id] >= 2); if (!ids.length) return Object.keys(cnt).length ? '<p class="dim">Wear 2, 4 or 6 pieces of the same set for bonuses.</p>' : '<p class="dim">Set pieces (marked with a coloured dot) give bonuses when you wear several of the same set.</p>'; return ids.map((id) => `<div class="setbox" style="--sc:${SETS[id].color}"><b>${SETS[id].name}</b> <small>${cnt[id]}/6</small>${setBonus(S).active.filter((a) => a.set === +id).map((a) => `<p class="on">&#10003; ${a.tier}: ${a.desc}</p>`).join('')}</div>`).join(''); }
function detailHtml(it) {
  const R = RARITIES[it.rar], cur = S.gear[it.slot], isEq = cur && cur.id === it.id, rows = Object.keys(it.stats).map((k) => { const v = k === 'dmg' && it.slot === 'weapon' ? `${WEAPONS[it.kind].name}` : fmtStat(k, itemStat(it, k)); return `<div class="row2"><span>${k === 'dmg' && it.slot === 'weapon' ? 'Weapon' : STAT_LABEL[k]}</span><b>${v}</b></div>`; }).join('');
  const sk = it.sockets ? `<div class="sockets">${Array.from({ length: it.sockets }, (_, i) => it.gems && it.gems[i] ? `<button class="sock full" data-act="unsocket" data-id="${it.id}" data-i="${i}" title="Tap to remove">${gemChip(it.gems[i])}<small>${gemText(it.gems[i])}</small></button>` : `<button class="sock" data-act="socketpick" data-id="${it.id}" data-i="${i}">+<small>socket</small></button>`).join('')}</div>` : '';
  const diff = !isEq && cur ? itemScore(it) - itemScore(cur) : 0, atMax = it.up >= maxUp(it);
  const setBox = it.set != null ? (() => { const S0 = SETS[it.set], n = setCounts(S)[it.set] || 0; return `<div class="setbox" style="--sc:${S0.color}"><b>${S0.name} set</b> <small>${n}/6 worn</small>${[2, 4, 6].map((t) => `<p class="${n >= t ? 'on' : ''}">${n >= t ? '&#10003;' : '&#9675;'} ${t} pieces: ${S0.tiers[t].desc}</p>`).join('')}</div>`; })() : '';
  return `<div class="dhead" style="--r:${R.color}">${icon(it)}<div><h3>${it.name}</h3><small>${R.name} ${SLOT_NAME[it.slot]} · level ${it.ilvl}${it.up ? ' · +' + it.up : ''}${it.asc ? ' · ' + '&#9733;'.repeat(it.asc) : ''}</small></div></div>${rows}${perkBox(it)}${sk}${setBox}
    ${!isEq && cur ? `<p class="cmp ${diff >= 0 ? 'up' : 'down'}">${diff >= 0 ? 'Better' : 'Worse'} than equipped</p>` : ''}
    <div class="btns">${isEq ? `<button data-act="unequip" data-id="${it.id}">Unequip</button>` : `<button class="go" data-act="equip" data-id="${it.id}">Equip</button>`}
    ${atMax ? `<button class="go" data-act="ascend" data-id="${it.id}" ${S.gold >= ascendCost(it, S).gold && (S.scrap || 0) >= ascendCost(it, S).scrap ? '' : 'disabled'}>Ascend &#9733; ${ascendCost(it, S).gold.toLocaleString()}g + ${ascendCost(it, S).scrap} scrap</button>` : `<button data-act="upgrade" data-id="${it.id}" ${S.gold >= upCost(it, S) ? '' : 'disabled'}>Upgrade ${upCost(it, S)}g</button><button data-act="upmax" data-id="${it.id}" ${S.gold >= upCost(it, S) ? '' : 'disabled'}>Auto upgrade</button>`}
    ${it.rar >= 2 ? `<button data-act="setpick" data-id="${it.id}">Change set ${reattuneCost(it).scrap} scrap</button>` : ''}${isEq ? '' : `<button data-act="dismantle" data-id="${it.id}">Dismantle +${dismantleValue(it)} scrap</button>`}
    ${Object.keys(it.stats).length > 1 ? `<button data-act="reforge" data-id="${it.id}" ${(S.scrap || 0) >= reforgeCost(it).scrap ? '' : 'disabled'}>Reforge bonuses ${reforgeCost(it).scrap} scrap</button>` : ''}${isEq ? '' : `<button data-act="sell" data-id="${it.id}">Sell ${salvageValue(it)}g</button>`}</div>`;
}
function flashMsg() { if (!msg) return; const m = msg; setTimeout(() => { if (msg === m) { msg = ''; const el = $('.msg'); if (el) el.remove(); } }, 2600); }
const perkBox = (it) => { if (it.slot !== 'weapon') return ''; const ks = [...(it.perks || [])]; const W = WEAPONS[it.kind]; if (W && W.perk && !ks.includes(W.perk)) ks.unshift(W.perk); return ks.length ? `<div class="perks">${ks.map((k) => `<p><b>${PERKS[k].name}</b> <small>${PERKS[k].desc}</small></p>`).join('')}</div>` : ''; };
let btab = 'ach';
function rewardPop(title, sub, text) {
  const o = document.createElement('div'); o.className = 'rewardpop';
  o.innerHTML = `<div class="rp"><small>${title}</small>${sub ? `<h3>${sub}</h3>` : ''}<div class="rtxt">${text}</div><button class="go">Nice</button></div>`;
  o.onclick = () => o.remove(); document.body.appendChild(o); setTimeout(() => o.remove(), 6000);
}
const achToast = (before) => { for (const a of ACH) if (!before.has(a.id) && !S.ach[a.id] && achDone(S, a)) UI.toast('Achievement: ' + a.name); };
const achSet = () => { ensureBook(S); syncDex(S); return new Set(ACH.filter((a) => S.ach[a.id] || achDone(S, a)).map((a) => a.id)); };
const wDesc = (W) => { const kind = W.melee ? 'Melee' : W.shape === 'flame' ? 'Flame' : W.shape === 'grenade' ? 'Explosive' : W.shape === 'bullet' ? 'Gun' : 'Thrown'; return `${kind} · ${(1 / W.rate).toFixed(1)} attacks/sec · damage ${W.dmg}${W.n > 1 ? ' x' + W.n : ''}${W.perk ? ' · ' + PERKS[W.perk].name : ''}`; };
function renderBook() {
  ensureBook(S); syncDex(S);
  const sub = `<div class="gsub">${[['ach', 'Achievements'], ['mon', 'Monsters'], ['wep', 'Weapons']].map(([k, n]) => `<button data-act="btab" data-b="${k}" class="${btab === k ? 'on' : ''}">${n}</button>`).join('')}</div>`;
  let body = '';
  if (btab === 'ach') {
    const rows = ACH.slice().sort((a, b) => (S.ach[a.id] ? 1 : 0) - (S.ach[b.id] ? 1 : 0) || (achDone(S, b) ? 1 : 0) - (achDone(S, a) ? 1 : 0)).map((a) => { const c = achCur(S, a), ok = c >= a.target, got = !!S.ach[a.id]; return `<div class="qrow ${got ? 'done' : ''}"><div class="qinfo"><b>${a.name}</b><small>${a.desc} · reward: ${rewardText(a.rew)}</small><div class="bar"><i style="width:${c / a.target * 100}%"></i></div><small>${c.toLocaleString()} / ${a.target.toLocaleString()}</small></div><button class="${ok && !got ? 'go' : ''}" data-act="claima" data-id="${a.id}" ${ok && !got ? '' : 'disabled'}>${got ? 'Done' : ok ? 'Claim' : 'Locked'}</button></div>`; }).join('');
    body = `<div class="panel"><h2>Achievements <small>${Object.keys(S.ach).length} / ${ACH.length}</small></h2>${rows}</div>`;
  } else if (btab === 'mon') {
    const list = dexMonsters(), seen = list.filter((m) => (S.dex.seen[m.sprite] || 0) > 0).length;
    body = `<div class="panel"><h2>Monsters <small>${seen} / ${list.length} met</small></h2><div class="dexgrid">${list.map((m) => { const n = S.dex.seen[m.sprite] || 0; return `<div class="dexcard ${n ? '' : 'unseen'} ${m.boss ? 'boss' : m.elite ? 'elite' : ''}"><img src="art/${m.sprite}_1.png" alt=""><b>${n ? m.name : '???'}</b><small>${n ? (m.boss ? 'Boss · ' : m.elite ? 'Elite · ' : '') + n.toLocaleString() + ' defeated' : 'not met yet'}</small></div>`; }).join('')}</div></div>`;
  } else {
    const list = Object.entries(WEAPONS), have = list.filter(([k]) => S.dex.weapons[k]).length;
    body = `<div class="panel"><h2>Weapons <small>${have} / ${list.length} found</small></h2><div class="dexgrid wide">${list.map(([k, W]) => { const ok = !!S.dex.weapons[k]; return `<div class="dexcard ${ok ? '' : 'unseen'}"><img src="art/icon_${W.icon}.png" alt=""><b>${ok ? W.name : '???'}</b><small>${ok ? wDesc(W) : 'not found yet'}</small></div>`; }).join('')}</div></div>`;
  }
  screen(`${top()}${sub}<div class="body gear">${body}</div>${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'book-' + btab);
  flashMsg();
}
const qtoast = (arr) => arr.forEach((t) => UI.toast('Quest complete: ' + t));
function rankBlock(r, won) {
  const x = runXp({ kills: r.kills, won, bossKills: r.bossKills || 0, t: r.t }), lv = gainRank(S, x);
  let pet = ''; { const pd = petOf(S.pet); if (pd) { const g = Math.floor((r.kills || 0) / 8) + (won ? 10 : 0) + Math.floor((r.t || 0) / 30), up = petXp(S, pd.id, g); pet = `<p class="sub nm">${pd.name} +${g} XP${up ? ` · <b>level ${up}!</b>` : ''}</p>`; } }
  return pet + `<p class="sub nm">+${x} Rank XP${lv.length ? ` · <b>RANK ${lv[lv.length - 1].lv}!</b> ${lv.map((l) => l.rewards.map(rwText).join(', ')).join(' · ')}` : ''}</p>`;
}
function rankPanel() {
  const R = ensureRank(S), need = rankNeed(R.lv), next = Array.from({ length: 6 }, (_, i) => { const L = R.lv + 1 + i, rw = rankRewards(S, L), big = L % 5 === 0; return `<div class="sday ${big ? 'now' : ''}"><small>Rank ${L}</small><b>${rw.map(rwText).join(', ')}</b></div>`; }).join('');
  const unl = HEROES.filter((h) => h.rank > R.lv)[0];
  return `<div class="panel"><h2>Rank ${R.lv} <small>${R.xp} / ${need} XP</small></h2><div class="bar bigbar"><i style="width:${Math.min(100, R.xp / need * 100)}%"></i></div><p class="dim">Every run earns Rank XP. Each rank pays a reward, and every fifth rank pays a rare item.${unl ? ` Next hero: <b>${unl.name}</b> at rank ${unl.rank}.` : ''}</p><div class="ladder six">${next}</div></div>`;
}
function renderQuests() {
  ensureQuests(S);
  const st = streakState(S), ladder = Array.from({ length: 7 }, (_, i) => { const r = streakReward(S, i), got = st.claimedToday ? i <= st.dayIdx : i < st.dayIdx, now = !st.claimedToday && i === st.dayIdx; return `<div class="sday ${got ? 'got' : ''} ${now ? 'now' : ''}"><small>Day ${i + 1}</small><b>${rewardText(r)}</b></div>`; }).join('');
  const qrow = (q, sc, i) => { const ok = q.prog >= q.target; return `<div class="qrow ${q.claimed ? 'done' : ''}"><div class="qinfo"><b>${questText(q)}</b><div class="bar"><i style="width:${Math.min(100, q.prog / q.target * 100)}%"></i></div><small>${Math.min(q.prog, q.target).toLocaleString()} / ${q.target.toLocaleString()} · reward: ${rewardText(q.rew)}</small></div><button class="${ok && !q.claimed ? 'go' : ''}" data-act="claimq" data-s="${sc}" data-i="${i}" ${ok && !q.claimed ? '' : 'disabled'}>${q.claimed ? 'Done' : ok ? 'Claim' : 'Active'}</button></div>`; };
  const block = (sc, title, L, sub) => `<div class="panel"><h2>${title} <small>${sub}</small></h2>${L.list.map((q, i) => qrow(q, sc, i)).join('')}<div class="qrow bonus ${L.bonus ? 'done' : ''}"><div class="qinfo"><b>Finish all three</b><small>Bonus: ${rewardText(bonusFor(S, sc))}</small></div><button class="${bonusReady(S, sc) ? 'go' : ''}" data-act="claimb" data-s="${sc}" ${bonusReady(S, sc) ? '' : 'disabled'}>${L.bonus ? 'Done' : 'Claim'}</button></div></div>`;
  const left = (t) => { const s = Math.max(0, Math.floor((t - Date.now()) / 1000)); return fmtDur(s); };
  const dEnd = new Date(); dEnd.setHours(24, 0, 0, 0); const wEnd = new Date(S.q.weekly.week + 'T00:00:00'); wEnd.setDate(wEnd.getDate() + 7);
  screen(`${top()}<div class="body gear">${rankPanel()}<div class="panel"><h2>Daily reward <small>${st.n} day${st.n === 1 ? '' : 's'} in a row</small></h2><div class="ladder">${ladder}</div><div class="btns"><button class="${st.claimedToday ? '' : 'go big'}" data-act="claims" ${st.claimedToday ? 'disabled' : ''}>${st.claimedToday ? 'Come back tomorrow' : 'Claim today\'s reward'}</button></div><p class="dim">Miss a day and the streak starts over. The seven-day ladder repeats.</p></div>
    ${block('daily', 'Daily quests', S.q.daily, 'new ones in ' + left(dEnd.getTime()))}${block('weekly', 'Weekly quests', S.q.weekly, 'new ones in ' + left(wEnd.getTime()))}</div>${msg ? `<div class="msg">${msg}</div>` : ''}`, 'camp', 'quests');
  flashMsg();
}
const find = (id) => S.bag.find((x) => x.id === +id) || SLOTS.map((s) => S.gear[s]).find((x) => x && x.id === +id);
function handle(act, d) {
  if (!$('#screen').classList.contains('on') && act !== 'again') return;
  if (act === 'tab') { tab = d.t; sel = null; tab === 'camp' ? renderCamp() : tab === 'quests' ? renderQuests() : tab === 'book' ? renderBook() : renderGear(); return; }
  if (act === 'btab') { btab = d.b; renderBook(); return; }
  if (act === 'claima') { const a = claimAch(S, d.id); if (a) { rewardPop('Achievement', a.name || '', rewardText(a.rew)); save(); } renderBook(); return; }
  if (act === 'story') { if (readyStory(S)) { sheet = { kind: 'story' }; renderCamp(); } return; }
  if (act === 'storychoose') { const st = readyStory(S); if (!st) return; const r = chooseStory(S, st.sv.id, +d.i); if (!r) return; if (r.poor) { msg = 'You cannot afford that.'; renderCamp(); return; } save(); sheet = { kind: 'story', res: r }; renderCamp(); return; }
  if (act === 'tutok') { S.tut = S.tut || {}; S.tut.camp = true; save(); renderCamp(); return; }
  if (act === 'heroes') { sheet = { kind: 'heroes' }; renderCamp(); return; }
  if (act === 'pickpet') { const p = petOf(d.p); if (!d.p) { S.pet = null; save(); renderCamp(); return; } if (p && ensureRank(S).lv >= p.rank) { S.pet = p.id; save(); msg = `${p.name} will follow you.`; } renderCamp(); return; }
  if (act === 'pickhero') { const h = HEROES.find((x) => x.id === d.h); if (h && ensureRank(S).lv >= h.rank) { S.hero = h.id; save(); msg = `${h.name} is ready.`; } sheet = null; renderCamp(); return; }
  if (act === 'evshop') { sheet = { kind: 'evshop' }; renderCamp(); return; }
  if (act === 'evclaim') { const ev = evState(S), m = EV_MILESTONES.find((x) => x.n === +d.n); if (m && ev.total >= m.n && !ev.claimed[m.n]) { ev.claimed[m.n] = true; give(S, m.rew); msg = 'Reward: ' + rwText(m.rew); save(); } renderCamp(); return; }
  if (act === 'evbuy') { const ev = evState(S), it = EV_SHOP.find((x) => x.id === d.id); if (it && ev.p >= it.cost && !(it.once && ev.bought[it.id])) { ev.p -= it.cost; if (it.once) ev.bought[it.id] = true; if (it.id === 'cannon') { const w = makeItem(S, 1 + Math.floor((S.maxDistrict || 1) * 1.4), 4, 'weapon', 'pumpcannon'); w.name = "Hallows' Pumpkin Cannon"; w.perks = ['explosive', 'vamp']; S.bag.push(w); } else give(S, it.rew); msg = 'Bought: ' + it.name; save(); } renderCamp(); return; }
  if (act === 'chalsheet') { sheet = { kind: 'chal' }; renderCamp(); return; }
  if (act === 'chal') { sheet = null; cb.startMode(d.m); return; }
  if (act === 'runopts') { sheet = { kind: 'runopts' }; renderCamp(); return; }
  if (act === 'nmstep') { const o = runOpts(S); S.opts.nm = Math.max(0, Math.min(Math.min(NM_MAX, S.nm || 0), o.nm + +d.s)); save(); renderCamp(); return; }
  if (act === 'modtoggle') { const o = runOpts(S), L = o.mods.slice(); const i = L.indexOf(d.m); if (i >= 0) L.splice(i, 1); else if (L.length < MODS_MAX) L.push(d.m); S.opts.mods = L; save(); renderCamp(); return; }
  if (act === 'claimq') { const r = claimQuest(S, d.s, +d.i); if (r) { rewardPop('Quest complete', '', rewardText(r)); save(); } renderQuests(); return; }
  if (act === 'claimb') { const r = claimBonus(S, d.s); if (r) { rewardPop('Bonus reward', '', rewardText(r)); save(); } renderQuests(); return; }
  if (act === 'claims') { const r = claimStreak(S); if (r) { rewardPop('Daily reward', '', rewardText(r)); save(); } renderQuests(); return; }
  if (act === 'run') { cb.start(); return; }
  if (act === 'dstep') { S.district = Math.max(1, Math.min(S.maxDistrict, S.district + +d.s)); save(); renderCamp(); return; }
  if (act === 'district') { S.district = +d.d; save(); renderCamp(); return; }
  if (act === 'defend') { if (S.base.haunt && S.base.haunt.active) cb.startHaunt(); return; }
  if (act === 'hold') { const H = S.base.haunt && S.base.haunt.active; if (!H) return; const win = defense(S) * (0.85 + Math.random() * 0.3) >= H.strength; sheet = { kind: 'hauntreport', rep: resolveHaunt(S, win, false) }; save(); renderCamp(); return; }
  if (act === 'cleanse') { const r = cleanse(S, d.key); msg = r === 'ok' ? 'The room is cleansed.' : 'Not enough scrap.'; if (r === 'ok') save(); renderCamp(); return; }
  if (act === 'rush') { const r = rushBuild(S, d.key); if (r === 'ok') { tickBase(S); save(); msg = 'Finished!'; } else msg = 'Not enough gold.'; renderCamp(); return; }
  if (act === 'builders') { sheet = { kind: 'builders' }; renderCamp(); return; }
  if (act === 'squadpick') { sheet = { kind: 'squad' }; renderCamp(); return; }
  if (act === 'squadtoggle') { S.squad = S.squad || []; const id = +d.id, i = S.squad.indexOf(id); if (i >= 0) S.squad.splice(i, 1); else if (S.squad.length < 2) { S.squad.push(id); const sv = survivorById(S, id); if (sv) sv.room = null; } save(); renderCamp(); return; }
  if (act === 'open') { sheet = { kind: 'room', key: d.key }; renderCamp(); return; }
  if (act === 'slot') { sheet = { kind: 'build', key: d.key }; renderCamp(); return; }
  if (act === 'door') { sheet = { kind: 'door' }; renderCamp(); return; }
  if (act === 'crew') { sheet = { kind: 'crew' }; renderCamp(); return; }
  if (act === 'autoassign') { const n = autoAssign(S); save(); msg = n ? `Assigned ${n} survivor${n === 1 ? '' : 's'} to the posts where they work best.` : 'No free posts to staff.'; renderCamp(); return; }
  if (act === 'assignpick') { sheet = { kind: 'assign', id: +d.id }; renderCamp(); return; }
  if (act === 'staffpick') { sheet = { kind: 'staff', key: d.key }; renderCamp(); return; }
  if (act === 'closesheet') { sheet = null; if (tab === 'gear') renderGear(); else renderCamp(); return; }
  if (act === 'assignto') { const r = assign(S, +d.id, d.key || null); if (r === 'full') msg = 'That room is already fully staffed.'; else save(); if (sheet && sheet.kind === 'assign') sheet = { kind: 'crew' }; else if (sheet && sheet.kind === 'staff') sheet = { kind: 'room', key: sheet.key }; renderCamp(); return; }
  if (act === 'letin') { const r = recruit(S, +d.i); if (r === 'ok') qtoast(track(S, 'recruits', 1)); msg = r === 'ok' ? 'Welcome to the church!' : r === 'nobeds' ? 'No free beds. Build a Bedroom.' : 'Nobody there.'; save(); if (!S.base.door.length) sheet = null; renderCamp(); return; }
  if (act === 'turnaway') { S.base.door.splice(+d.i, 1); save(); if (!S.base.door.length) sheet = null; renderCamp(); return; }
  if (act === 'room') { const r = startUpgrade(S, d.key); if (r === 'ok') { qtoast(track(S, 'builds', 1)); save(); msg = `${ROOMS[S.base.rooms[d.key].type].name} upgrade started.`; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
  if (act === 'build') { const r = startBuild(S, sheet.key, d.type); if (r === 'ok') { qtoast(track(S, 'builds', 1)); save(); msg = `Building the ${ROOMS[d.type].name}...`; sheet = null; } else msg = r === 'busy' ? 'Your builders are busy.' : 'Not enough gold or scrap.'; renderCamp(); return; }
  if (act === 'again') { cb.start(); return; }
  if (act === 'camp') { UI.stopAfkTimer(); UI.camp(); return; }
  if (act === 'pick') { sel = find(d.id) || null; renderGear(); return; }
  if (act === 'equip') { const it = find(d.id); if (!it) return; const old = S.gear[it.slot]; S.bag.splice(S.bag.indexOf(it), 1); if (old) S.bag.push(old); S.gear[it.slot] = it; sel = it; save(); renderGear(); return; }
  if (act === 'unequip') { const it = find(d.id); if (!it) return; S.gear[it.slot] = null; S.bag.push(it); sel = it; save(); renderGear(); return; }
  if (act === 'ascend') { const it = find(d.id); if (it) { const r = ascend(S, it); msg = r === 'ok' ? `${it.name} ascended! Max level is now +${maxUp(it)}.` : 'Not enough gold or scrap.'; if (r === 'ok') save(); } renderGear(); return; }
  if (act === 'reforge') { const it = find(d.id); if (it) { const r = reforge(S, it); msg = r === 'ok' ? 'The bonuses were reforged.' : 'Not enough scrap.'; if (r === 'ok') save(); } renderGear(); return; }
  if (act === 'upmax') { const it = find(d.id); if (!it) return; const a = it.up; while (it.up < maxUp(it) && S.gold >= upCost(it, S)) { S.gold -= upCost(it, S); it.up++; } if (it.up > a) qtoast(track(S, 'upgrades', it.up - a)); msg = it.up > a ? `${it.name} went from +${a} to +${it.up}.` : ''; save(); renderGear(); return; }
  if (act === 'upgrade') { const it = find(d.id); if (!it || S.gold < upCost(it, S) || it.up >= maxUp(it)) return; S.gold -= upCost(it, S); it.up++; qtoast(track(S, 'upgrades', 1)); msg = `${it.name} is now +${it.up}.`; save(); renderGear(); return; }
  if (act === 'talent') { const r = buyTalent(S, d.k); msg = r === 'ok' ? `${TALENTS[d.k].name} is now level ${talentLvl(S, d.k)}.` : r === 'poor' ? 'Not enough Echoes.' : 'Already at max.'; if (r === 'ok') save(); renderGear(); return; }
  if (act === 'gtab') { gtab = d.g; sel = null; renderGear(); return; }
  if (act === 'socketpick') { sheet = { kind: 'gempick', id: +d.id, i: +d.i }; renderGear(); return; }
  if (act === 'socketdo') { const it = find(sheet.id); if (it) { socketGem(S, it, sheet.i, +d.gem); save(); } sheet = null; renderGear(); return; }
  if (act === 'unsocket') { const it = find(d.id); if (it) { unsocketGem(S, it, +d.i); save(); } renderGear(); return; }
  if (act === 'setpick') { sheet = { kind: 'setpick', id: +d.id }; renderGear(); return; }
  if (act === 'setdo') { const it = find(sheet.id); if (it) { const r = reattune(S, it, +d.set); msg = r === 'ok' ? `${it.name}` : 'Not enough scrap.'; if (r === 'ok') save(); } sheet = null; renderGear(); return; }
  if (act === 'dismantle') { const it = find(d.id); if (it) { const n = dismantle(S, it); msg = `Dismantled for ${n} scrap.`; sel = null; save(); } renderGear(); return; }
  if (act === 'fuseall') { let n = 0, go = true; while (go) { go = false; for (const g of S.gems.slice()) if (g.tier < GEM_MAX && S.gems.filter((x) => x.type === g.type && x.tier === g.tier).length >= 3 && fuseGems(S, g.type, g.tier) === 'ok') { n++; go = true; break; } } msg = n ? `Fused ${n} time${n > 1 ? 's' : ''}.` : 'Nothing to fuse (need 3 of a kind and gold).'; if (n) save(); renderGear(); return; }
  if (act === 'fuse') { const r = fuseGems(S, d.type, +d.tier); msg = r === 'ok' ? 'Fused into a better gem!' : 'Not enough gems or gold.'; if (r === 'ok') save(); renderGear(); return; }
  if (act === 'transmute') { const o = transmute(S, +d.r); if (o.r === 'ok') { msg = `Forged: ${o.item.name}`; save(); } else msg = 'Not enough items or scrap.'; renderGear(); return; }
  if (act === 'sell') { const it = find(d.id); if (!it) return; releaseGems(S, it); S.gold += salvageValue(it); S.bag.splice(S.bag.indexOf(it), 1); sel = null; save(); renderGear(); return; }
  if (act === 'scrapr') { const all = d.r === 'all', r = +d.r; let sc = 0, n = 0; for (const it of S.bag.slice()) { if (!all && it.rar !== r) continue; const cur = S.gear[it.slot]; if (!cur || itemScore(it) > itemScore(cur)) continue; sc += dismantle(S, it); n++; } msg = n ? `Scrapped ${n} for ${sc} scrap (kept upgrades).` : 'Nothing to scrap.'; sel = null; save(); renderGear(); return; }
  if (act === 'sellr') { const all = d.r === 'all', r = +d.r; let g = 0, n = 0; S.bag = S.bag.filter((it) => { if (!all && it.rar !== r) return true; const cur = S.gear[it.slot]; if (!cur || itemScore(it) > itemScore(cur)) return true; releaseGems(S, it); g += salvageValue(it); n++; return false; }); S.gold += g; msg = n ? `Sold ${n} for ${g} gold (kept upgrades).` : 'Nothing to sell.'; sel = null; save(); renderGear(); return; }
  if (act === 'auto') { const n = autoEquip(S); msg = n ? `Equipped ${n} better item${n > 1 ? 's' : ''}.` : 'You already wear the best.'; save(); renderGear(); return; }
}
document.addEventListener('click', (e) => { const b = e.target.closest('.itc[data-item]'); if (b && $('#screen').classList.contains('on') && tab === 'gear') { sel = find(b.dataset.item) || null; renderGear(); } });
UI.gearTab = () => { tab = 'gear'; renderGear(); };

// ---------- results ----------
function challengeDone(r) {
  S.rec = S.rec || {}; S.rec.endless = S.rec.endless || { t: 0, kills: 0, bosses: 0 }; S.rec.rush = S.rec.rush || { best: 0, done: 0 };
  const rush = r.mode === 'rush', won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar); let gold, echoes, newBest = false;
  if (rush) { gold = r.gold + r.bossKills * 100; echoes = r.bossKills * 8 + (won ? 40 : 0); if (r.bossKills > S.rec.rush.best) { S.rec.rush.best = r.bossKills; newBest = true; } if (won) { S.rec.rush.done++; give(S, { type: 'item', rar: 4 }); give(S, { type: 'item', rar: 4 }); give(S, { type: 'gem', tier: 4, n: 3 }); } }
  else { gold = r.gold + Math.floor(r.t * 1.2); echoes = Math.floor(r.t / 20) + r.bossKills * 6; if (r.t > S.rec.endless.t) { S.rec.endless = { t: Math.floor(r.t), kills: r.kills, bosses: r.bossKills }; newBest = true; } }
  echoes = Math.round(echoes * (1 + 0.05 * talentLvl(S, 'echo')));
  S.gold += gold; S.echo = (S.echo || 0) + echoes; S.scrap = (S.scrap || 0) + r.scrap; S.runs++;
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  S.gems.push(...(r.lootGems || []));
  const ab = achSet(); addStats(S, { kills: r.kills, elites: r.eliteKills || 0, bosses: r.bossKills || 0, crates: r.crates || 0, gems: (r.lootGems || []).length, runs: 1 }); mergeKills(S, r.killed); syncDex(S); achToast(ab);
  qtoast([...track(S, 'kills', r.kills), ...track(S, 'elites', r.eliteKills || 0), ...track(S, 'crates', r.crates || 0), ...track(S, 'gems', (r.lootGems || []).length), ...track(S, 'runs', 1), ...track(S, 'bosses', r.bossKills || 0), ...track(S, 'minutes', Math.floor(r.t / 60))]);
  S.lastSeen = Date.now(); save(); r.destroy(); UI.stopAfkTimer();
  const mm = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${rush ? (won ? 'BOSS RUSH CLEARED' : 'THE RUSH ENDS') : 'YOU FELL'}</h1><p class="sub">${rush ? `You beat ${r.bossKills} of ${r.rushList.length} bosses.` : `You lasted ${mm(r.t)} and beat ${r.bossKills} boss${r.bossKills === 1 ? '' : 'es'}.`}${newBest ? ' <b>New personal best!</b>' : ''}</p>${rankBlock(r, won)}
    <div class="stats"><div><small>Time</small><b>${mm(r.t)}</b></div><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${gold}</b></div><div><small>Echoes</small><b>${echoes}</b></div><div><small>Gear</small><b>${items.length}</b></div></div>
    <div class="bag small">${items.map((it) => cardHtml(it)).join('')}</div>${r.lootGems && r.lootGems.length ? `<div class="gemline">${r.lootGems.map(gemChip).join('')}</div>` : ''}
    <div class="btns"><button class="go big" data-act="chal" data-m="${r.mode}">Try again</button><button class="big" data-act="camp">Back to the church</button></div></div>`, 'camp');
  $('#screen').onclick = null;
}
function hauntDone(r) {
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar); S.gold += r.gold; S.scrap = (S.scrap || 0) + r.scrap;
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  S.gems.push(...(r.lootGems || []));
  if (won) qtoast(track(S, 'haunts', 1)); { const ab = achSet(); addStats(S, { kills: r.kills, haunts: won ? 1 : 0 }); mergeKills(S, r.killed); syncDex(S); achToast(ab); }
  if (won) S.echo = (S.echo || 0) + 3;
  const rk = rankBlock({ kills: r.kills, bossKills: 0, t: r.t }, won);
  const rep = resolveHaunt(S, won, true); save(); r.destroy(); UI.stopAfkTimer();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? 'THE CHURCH HOLDS' : 'THE CHURCH FALLS'}</h1><p class="sub">${won ? 'You drove the ghosts back from the doors.' : 'The ghosts broke through while you fought.'}</p>${rk}
    <div class="stats"><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${r.gold + (won ? rep.gold : 0)}</b></div><div><small>Scrap</small><b>${r.scrap + (won ? rep.scrap : 0)}</b></div><div><small>Gear</small><b>${items.length}</b></div><div><small>Result</small><b>${won ? 'Held' : 'Lost'}</b></div></div>
    ${won ? `<p class="sub">Church reward: +${rep.gold} gold, +${rep.scrap} scrap${rep.survivor ? ' · a survivor is at the door!' : ''}</p>` : `<p class="sub">${rep.haunted.length ? rep.haunted.join(' and ') + ' haunted. ' : ''}Some food and water spoiled.</p>`}
    <div class="bag small">${items.map((it) => cardHtml(it)).join('')}</div>${r.lootGems && r.lootGems.length ? `<div class="gemline">${r.lootGems.map(gemChip).join('')}</div>` : ''}<div class="btns"><button class="go big" data-act="camp">Back to the church</button></div></div>`);
  $('#hud').classList.remove('on');
}
UI.done = (r) => {
  Music.play('camp');
  if (r.mode === 'haunt') return hauntDone(r);
  if (r.mode === 'endless' || r.mode === 'rush') return challengeDone(r);
  const won = r.won, items = r.lootItems.slice().sort((a, b) => b.rar - a.rar), earned = r.gold + (won ? 120 * S.district : Math.floor(r.t / 10));
  let nmMsg = ''; if (won && r.nm > 0 && r.nm === (S.nm || 0) && S.nm < NM_MAX) { S.nm++; nmMsg = nmName(S.nm) + ' unlocked!'; } else if (won && r.nm === 0 && !(S.nm > 0)) { S.nm = 1; nmMsg = 'Nightmare I unlocked! Find it under Run options.'; }
  const echoes = echoGain(S, r.kills, won, S.district, r.nm || 0); S.echo = (S.echo || 0) + echoes; const rk = rankBlock(r, won);
  S.gold += earned; S.scrap = (S.scrap || 0) + r.scrap; S.runs++; S.best = Math.max(S.best, r.kills); if (won) { S.wins++; if (S.district === S.maxDistrict) { S.maxDistrict++; } }
  for (const it of items) if (S.bag.length < 120) S.bag.push(it); else S.gold += salvageValue(it);
  S.gems.push(...(r.lootGems || []));
  if (r.pumpkins) { const ev = evState(S); ev.p += r.pumpkins; ev.total += r.pumpkins; }
  const achBefore = achSet(); addStats(S, { kills: r.kills, elites: r.eliteKills || 0, bosses: won ? 1 : 0, crates: r.crates || 0, gems: (r.lootGems || []).length, runs: 1 }); mergeKills(S, r.killed); syncDex(S); achToast(achBefore);
  qtoast([...track(S, 'kills', r.kills), ...track(S, 'elites', r.eliteKills || 0), ...track(S, 'crates', r.crates || 0), ...track(S, 'gems', (r.lootGems || []).length), ...track(S, 'gold', earned), ...track(S, 'runs', 1), ...track(S, 'minutes', Math.floor(r.t / 60)), ...(won ? track(S, 'bosses', 1) : [])]);
  if (S.opts.afk) autoEquip(S);
  S.lastSeen = Date.now(); save();
  if (r.retreated) S.opts.afk = false; save(); const afk = !!S.opts.afk; r.destroy();
  screen(`<div class="result ${won ? 'win' : 'lose'}"><h1>${won ? (r.boss ? r.boss.def.name.toUpperCase() + ' FALLS' : 'VICTORY') : r.retreated ? 'YOU GOT OUT' : 'YOU DIED'}</h1><p class="sub">${won ? 'The district is quiet. For now. A new district opens.' : r.retreated ? 'You slipped away with what you found.' : 'The dead take another one...'}</p>${r.nm || (r.mods && r.mods.size) ? `<p class="sub nm">${nmName(r.nm)}${r.mods && r.mods.size ? ' · ' + [...r.mods].map((k) => MODS[k].name).join(', ') : ''} · +${Math.round((r.rewardMul - 1) * 100)}% rewards</p>` : ''}${nmMsg ? `<p class="sub nm">${nmMsg}</p>` : ''}<p class="sub nm">+${echoes} Echoes <small>(spend them in Gear &rarr; Talents)</small></p>${rk}${r.pumpkins ? `<p class="sub nm">+${r.pumpkins} pumpkins <small>(Pumpkin Patch in the church)</small></p>` : ''}
    <div class="stats"><div><small>Time</small><b>${Math.floor(r.t / 60)}:${String(Math.floor(r.t % 60)).padStart(2, '0')}</b></div><div><small>Kills</small><b>${r.kills}</b></div><div><small>Gold</small><b>${earned}</b></div><div><small>Scrap</small><b>${r.scrap}</b></div><div><small>Gear</small><b>${items.length}</b></div></div>
    <div class="bag small">${items.map((it) => cardHtml(it)).join('') || '<p class="dim">No gear this time.</p>'}</div>
    ${r.lootGems && r.lootGems.length ? `<div class="gemline">${r.lootGems.map(gemChip).join('')}<small>${r.lootGems.length} gem${r.lootGems.length > 1 ? 's' : ''}</small></div>` : ''}<div class="btns"><button class="go big" data-act="again">Run again</button><button class="big2" data-act="camp">Camp &amp; gear</button></div>${afk ? '<p class="dim" id="afkCount">AFK is on: the next run starts in 6 seconds. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.</p>' : ''}</div>`);
  $('#hud').classList.remove('on');
  if (afk) { clearTimeout(UI.afkT); let n = 6; const tick = () => { const el = $('#afkCount'); if (!el) return; n--; if (n <= 0) { cb.start(); return; } el.innerHTML = `AFK is on: the next run starts in ${n} second${n > 1 ? 's' : ''}. Tap <b>Camp &amp; gear</b> to stop it and look at your loot.`; UI.afkT = setTimeout(tick, 1000); }; UI.afkT = setTimeout(tick, 1000); }
};
UI.stopAfkTimer = () => clearTimeout(UI.afkT);
UI.heroPick = (done) => {
  screen(`<div class="pick"><h1>HAUNTFALL</h1><p class="sub">The town fell in the night. Who are you?</p><div class="two"><button data-act="hero" data-h="f"><img src="art/hero_f_1.png" alt=""><b>Her</b></button><button data-act="hero" data-h="m"><img src="art/hero_m_1.png" alt=""><b>Him</b></button></div></div>`, 'title');
  $('#screen').onclick = (e) => { const b = e.target.closest('[data-h]'); if (!b) return; S.hero = b.dataset.h; save(); $('#screen').onclick = null; done(); };
};
