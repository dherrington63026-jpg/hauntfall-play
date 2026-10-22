// Survivor story events. Every survivor who lives in the church gets a short three-part story based on
// their main skill. A new part comes up every few hours; you answer it with one of two choices.
// Effects: gold, scrap, echo (numbers), gem (tier), item (rarity), skill (+1 to their main skill), food, water.
import { makeGem, makeItem } from './data.js';

const H = 3600 * 1000;
export const STORIES = {
  elec: { title: 'The Hum', beats: [
    { text: '{n} stops {his} work and cocks {his} head. "Do you hear that? Under the floor. A hum. Something down in the crypt still has power."',
      ch: [{ label: 'Go down and strip it for parts', res: 'Behind a sealed door {n} finds a dead transformer, still warm. {He} comes up with a bag of copper and a grin.', eff: { scrap: 40 } },
           { label: 'Follow the cable to its source', res: 'The cable runs far under the graveyard before it ends in a locked box. {n} won\'t say what was inside, only that it was worth the walk.', eff: { gold: 120, echo: 4 } }] },
    { text: 'The hum has a rhythm now. {n} has taped a wire to a speaker. "Listen. It\'s not noise. It\'s a voice, very far away, saying the same thing over and over."',
      ch: [{ label: 'Boost the signal', res: 'The voice sharpens into a recording: coordinates, and a warning not to come at night. {n} copies them down carefully.', eff: { echo: 6, skill: 1 } },
           { label: 'Cut the wire. Some things stay buried.', res: '{n} nods slowly and pulls the plug. The church is quieter after that, and a little safer.', eff: { scrap: 30, gold: 80 } }] },
    { text: '{n} has rebuilt a radio from scrap and a tin cup. "One broadcast," {he} says. "I can send it one time before the battery dies. Who do we call?"',
      ch: [{ label: 'Call for survivors', res: 'The transmission goes out over the dead town. By morning, someone is knocking at the church door.', eff: { echo: 8, item: 3 } },
           { label: 'Keep the battery for the church', res: '{n} wires the battery into the generator room. The lights burn a little brighter for weeks.', eff: { skill: 1, gem: 3 } }] },
  ] },
  plumb: { title: 'Below the Cellar', beats: [
    { text: '{n} comes up from the cellar soaked to the knees. "The water tastes of rust and something sweeter. There\'s an old well down there, bricked over. It was not bricked from the outside."',
      ch: [{ label: 'Open the well', res: 'Cold air rushes up, smelling of stone. At the bottom {n} finds coins thrown in by a hundred years of wishers.', eff: { gold: 160 } },
           { label: 'Seal it for good', res: '{n} mortars the bricks back in place. The pipes stop knocking that night.', eff: { water: 150, scrap: 20 } }] },
    { text: '"There\'s a second chamber behind the well," {n} says, wiping {his} hands. "A cistern. Big as the nave. And somebody left lanterns in it."',
      ch: [{ label: 'Drain it', res: 'It takes two days. At the bottom: a clean spring, and a chest of church silver the old priest hid.', eff: { water: 250, gold: 140 } },
           { label: 'Study the lanterns', res: 'The lanterns burn with a green flame that gives off no heat. {n} bottles one, just in case.', eff: { gem: 2, echo: 5 } }] },
    { text: 'The water in the cistern has begun to rise on its own, one hand-width every night. {n} has marked the wall. "It\'s coming up to meet us. I don\'t think it\'s angry. I think it\'s lonely."',
      ch: [{ label: 'Build a spillway and let it flow', res: 'The water finds its channel and runs clear. The church will never be thirsty again.', eff: { skill: 1, water: 400 } },
           { label: 'Leave an offering at the edge', res: 'Flowers, a candle, a name read aloud. The water goes still, and something old is at peace.', eff: { echo: 10, item: 3 } }] },
  ] },
  cook: { title: 'Grandmother\'s Recipe', beats: [
    { text: '{n} found a stained notebook behind the pantry. "Recipes. Fifty years of them. And one page torn out, with a note: <i>never cook this one after dark</i>."',
      ch: [{ label: 'Cook the good ones', res: 'The church smells like bread for the first time in months. Everyone eats well.', eff: { food: 200, gold: 60 } },
           { label: 'Look for the missing page', res: 'It was tucked in the old stove\'s flue, wrapped in oilcloth. {n} reads it twice and says only, "Not yet."', eff: { echo: 5, scrap: 25 } }] },
    { text: '{n} is short a few ingredients for the big dish: wild thyme, smoked salt, and something from the old apothecary across the road.',
      ch: [{ label: 'Send someone to the apothecary', res: 'They come back pale but carrying a jar of dried herbs and a small, heavy gem the apothecary kept in a drawer.', eff: { gem: 2, food: 120 } },
           { label: 'Make do with what we have', res: '{n} improvises with a skill that borders on magic. It is not the recipe, but it is delicious.', eff: { skill: 1, food: 150 } }] },
    { text: 'The meal is ready, and {n} has laid the whole church a table in the nave. "There\'s an empty chair," {he} says. "Grandmother always set one for whoever was lost."',
      ch: [{ label: 'Leave the chair empty', res: 'Nobody speaks, but the candle at the empty place burns steadily all night. In the morning, the plate is clean.', eff: { echo: 12, item: 3 } },
           { label: 'Invite the next stranger to sit', res: 'A thin man appears at the door as the soup is served, and stays. The church has another pair of hands.', eff: { skill: 1, gold: 180 } }] },
  ] },
  mech: { title: 'The Hearse', beats: [
    { text: '{n} knocks on the church doors with a wrench. "There\'s a hearse in the old garage behind the chapel. Big engine, rotted tyres. I can make her run."',
      ch: [{ label: 'Give {him} the scrap to fix it', res: 'A week of banging and swearing later, the engine coughs, catches, and roars. The whole church cheers.', eff: { scrap: -20, skill: 1 } },
           { label: 'Strip it for parts instead', res: '{n} sighs and gets out the saw. It was a beautiful machine, and it was also a lot of scrap.', eff: { scrap: 60 } }] },
    { text: 'Under the driver\'s seat, {n} found a leather satchel. "Somebody was running from something. Look: maps, a pistol, and a note that says <i>the road out is closed</i>."',
      ch: [{ label: 'Keep the maps', res: 'The maps show routes through the town the dead haven\'t found yet. {n} marks them in red.', eff: { echo: 6, gold: 100 } },
           { label: 'Keep the pistol', res: 'It is old, clean, and well cared for. It goes straight into the armory.', eff: { item: 3 } }] },
    { text: 'The hearse runs. {n} sits behind the wheel, hands shaking. "She\'s ready to go anywhere you point her. The question is whether we go out, or hold the line."',
      ch: [{ label: 'Armor it and park it by the door', res: '{n} welds plate steel to the hearse. It becomes a rolling wall at the church gate.', eff: { skill: 1, scrap: 50, echo: 5 } },
           { label: 'Take it out for supplies', res: 'The hearse tears through the dead streets and comes back loaded to the roof.', eff: { gold: 220, scrap: 40 } }] },
  ] },
  med: { title: 'The Patient Nobody Sees', beats: [
    { text: '{n} won\'t look at the infirmary bed in the corner. "There\'s someone in it. Every night I tuck the blanket in, and every morning it\'s folded back. Nobody\'s there."',
      ch: [{ label: 'Sit with the empty bed tonight', res: 'Around midnight the blanket rises and falls in a slow breath. {n} stays until dawn and hums an old lullaby.', eff: { echo: 6 } },
           { label: 'Move the bed out of the room', res: 'The bed goes to the cellar. The infirmary feels lighter, and {n} sleeps through the night for once.', eff: { food: 60, scrap: 20 } }] },
    { text: '"{n} thinks the patient was a nurse," says someone at the door. "{He} found a name tag in the bedclothes. It says <i>Sister Ana</i>. The old church records say she died here in the first night."',
      ch: [{ label: 'Say a prayer for her', res: 'The candle flickers, steadies, and for a moment the room smells of lavender.', eff: { echo: 8, gem: 2 } },
           { label: 'Ask her what she needs', res: '{n} speaks to the empty room. A drawer slides open on its own: bandages and old, good medicine.', eff: { skill: 1, gold: 100 } }] },
    { text: 'Sister Ana has been helping. Bandages are rolled before {n} wakes, and a lamp is lit where the sickest sleep. "She wants to stay," {n} says. "I think she\'s earned it."',
      ch: [{ label: 'Let her stay', res: 'The infirmary has an extra pair of hands nobody can see. Healing comes faster after that.', eff: { skill: 1, item: 3 } },
           { label: 'Help her move on', res: '{n} opens the window at dawn. A pale figure in a white habit pauses at the door, smiles, and is gone.', eff: { echo: 12, gem: 3 } }] },
  ] },
  weap: { title: 'The Last Patrol', beats: [
    { text: '{n} has been staring at the badge on the table for an hour. "It was in the squad car at the end of Pine Street. My partner\'s. I haven\'t told anyone."',
      ch: [{ label: 'Sit with {him} in silence', res: '{n} says nothing for a long time, then starts to talk. By morning, {he} is steadier than before.', eff: { skill: 1 } },
           { label: 'Ask where the squad car is', res: '{n} draws a map on the back of an old ticket book. It leads to a crashed cruiser, its trunk still locked.', eff: { gold: 100, echo: 4 } }] },
    { text: 'The trunk held a shotgun, two boxes of shells, and a stack of case files. {n} reads one and goes pale. "These aren\'t cases. These are the names of everyone who died in the first night."',
      ch: [{ label: 'Take the weapons', res: 'The shotgun is clean and loaded. The shells are a gift for the whole church.', eff: { item: 3, scrap: 20 } },
           { label: 'Read the case files', res: 'Page after page of statements. Somewhere in them, a pattern: where the dead rise first. {n} circles it.', eff: { echo: 8, gold: 80 } }] },
    { text: '"Every name on this list is someone who didn\'t get out," {n} says. "I want to go and find the last one. Walk the whole beat, one more time. Will you cover me?"',
      ch: [{ label: 'Go with {him}', res: 'You walk the old patrol together through the quiet streets. At the end, {n} salutes an empty house and finally lets go.', eff: { skill: 1, echo: 10 } },
           { label: 'Let {him} go alone', res: '{n} returns at dawn, calm, with a small silver star pinned to {his} coat. "Closed," {he} says.', eff: { item: 3, gem: 2 } }] },
  ] },
  trade: { title: 'The Ledger', beats: [
    { text: '{n} drops a heavy book on the table. "Found it in the bank vault. A ledger. Every debt in this town for forty years, and next to each name, a date. The dates are all in the future."',
      ch: [{ label: 'Check the closest date', res: 'The name is a man in the old cemetery. The date was last Tuesday. {n} closes the book and says nothing.', eff: { echo: 5, gold: 60 } },
           { label: 'Sell the paper to travellers', res: 'The binding alone is worth a fortune. {n} haggles like a demon and comes back with a full purse.', eff: { gold: 200 } }] },
    { text: 'A stranger arrives at the door with a briefcase and a smile that does not move. "I\'m here for the ledger," he says. "I\'ll pay anything."',
      ch: [{ label: 'Sell it to him', res: 'He pays in old gold coins that are strangely warm. He leaves without his shadow.', eff: { gold: 350 } },
           { label: 'Refuse. Slam the door.', res: 'He bangs once, politely, and is gone. {n} nods, very slowly. "Good call."', eff: { skill: 1, echo: 8 } }] },
    { text: '{n} has been reading the ledger by candlelight. "Page forty. Our names are on it. Everyone in the church. The debt is the same for all of us: <i>paid in full</i>."',
      ch: [{ label: 'Burn the ledger', res: 'The pages curl and glow green, then go grey. The air in the church feels, impossibly, lighter.', eff: { echo: 14, item: 3 } },
           { label: 'Keep it hidden', res: '{n} locks it in the vault. "Better to know where it is," {he} says. The vault, somehow, never empties.', eff: { skill: 1, gold: 260 } }] },
  ] },
  scout: { title: 'Lights on the Hill', beats: [
    { text: '{n} watches from the bell tower, binoculars glued to {his} face. "There. Three lights, up on the hill beyond the water tower. They\'re moving. Not like the dead."',
      ch: [{ label: 'Signal back with a lantern', res: 'After a long wait, a single light blinks twice in answer. Somebody is out there.', eff: { echo: 5, gold: 60 } },
           { label: 'Stay quiet. Watch them.', res: '{n} sketches their route over three nights. It may save lives, someday.', eff: { scrap: 30, gold: 60 } }] },
    { text: '"They\'re a group," {n} reports. "Eight, maybe ten. Armed. Hauling a cart. They\'re headed for the river road, and the river road runs right past the cemetery."',
      ch: [{ label: 'Warn them', res: '{n} slips out at dusk and leaves a warning at their last camp. In the morning there\'s a gift on the church step.', eff: { item: 3, gold: 100 } },
           { label: 'Offer to guide them', res: 'You take the bell-tower path and lead them safe through the dead streets. They remember it.', eff: { skill: 1, echo: 8 } }] },
    { text: 'The group sends a woman to the church door with a crate of supplies and a message. "Winter is coming. We can\'t hold the hill. Can we come home with you?"',
      ch: [{ label: 'Let them in', res: 'The church fills with strangers, and for the first night in months it is full of laughter.', eff: { skill: 1, item: 3, echo: 8 } },
           { label: 'Trade, but keep the door shut', res: 'A fair deal, shaken through the gap in the gate. They leave stocked and grateful.', eff: { gold: 300, scrap: 50 } }] },
  ] },
  faith: { title: 'The Bell', beats: [
    { text: '{n} stands beneath the bell tower, hands clasped. "It rang last night. Once. No one was up there. The rope is cut, and the bell rang anyway."',
      ch: [{ label: 'Climb up and look', res: 'The belfry is empty, but the bell is warm to the touch and carved with names. Newest at the bottom: all of yours.', eff: { echo: 6, gem: 2 } },
           { label: 'Pray beneath it', res: '{n} prays through the night. At dawn, the tower is quiet, and a feeling of peace settles over the church.', eff: { gold: 100, scrap: 20 } }] },
    { text: 'The bell has rung twice more. Each time, {n} says, a hush falls over the dead outside. "It\'s not a warning. It\'s a call. Something wants us to ring it ourselves."',
      ch: [{ label: 'Replace the rope', res: 'The first true toll rolls over the graveyard. The wind stops, and for a moment you can hear the whole town listen.', eff: { skill: 1, echo: 8 } },
           { label: 'Muffle the bell with cloth', res: 'Silence. {n} looks uncertain, but the church sleeps soundly that night.', eff: { food: 80, item: 3 } }] },
    { text: '"We\'ll ring it at dawn," {n} says. "All of us together. I think it will carry farther than we know. Are you ready?"',
      ch: [{ label: 'Ring it together', res: 'Three great notes shake the dust from the beams. For a moment every ghost in town turns to look at the church, and then lowers its head.', eff: { skill: 1, echo: 14, gem: 3 } },
           { label: 'Let {him} ring it alone', res: '{n} pulls the rope with both hands. The bell sounds like a heartbeat. At the end of it, the church is blessed, and something else is gone.', eff: { item: 4 } }] },
  ] },
};

const pron = (g) => (g === 'm' ? { he: 'he', him: 'him', his: 'his', He: 'He' } : { he: 'she', him: 'her', his: 'her', He: 'She' });
export const fill = (txt, sv) => { const p = pron(sv.g); return txt.replace(/\{n\}/g, sv.name.split(' ')[0]).replace(/\{He\}/g, p.He).replace(/\{he\}/g, p.he).replace(/\{him\}/g, p.him).replace(/\{his\}/g, p.his); };
const arcOf = (sv) => (STORIES[sv.main] ? sv.main : 'scout');

export function ensureStories(S, now = Date.now()) {
  if (!S.base) return;
  for (const sv of S.base.survivors) if (!sv.story) sv.story = { beat: 0, next: now + (2 + Math.random() * 3) * H };
}
// the first survivor whose next story part is due
export function readyStory(S, now = Date.now()) {
  if (!S.base) return null; ensureStories(S, now);
  const list = S.base.survivors.filter((sv) => sv.story.beat < 3 && now >= sv.story.next).sort((a, b) => a.story.next - b.story.next);
  if (!list.length) return null;
  const sv = list[0], arc = STORIES[arcOf(sv)], beat = arc.beats[sv.story.beat];
  return { sv, arc, beat, n: sv.story.beat };
}
function apply(S, sv, e) {
  const out = [];
  if (e.gold) { S.gold = Math.max(0, S.gold + e.gold); out.push(`${e.gold > 0 ? '+' : ''}${e.gold} gold`); }
  if (e.scrap) { S.scrap = Math.max(0, (S.scrap || 0) + e.scrap); out.push(`${e.scrap > 0 ? '+' : ''}${e.scrap} scrap`); }
  if (e.echo) { S.echo = Math.max(0, (S.echo || 0) + e.echo); out.push(`${e.echo > 0 ? '+' : ''}${e.echo} Echoes`); }
  if (e.gem) { S.gems.push(makeGem(S, e.gem)); out.push('a gem'); }
  if (e.item) { S.bag.push(makeItem(S, 1 + Math.floor((S.maxDistrict || 1) * 1.4), e.item, undefined, undefined, 0.4)); out.push(['', '', 'a green item', 'a blue item', 'a purple item'][e.item] || 'a rare item'); }
  if (e.food) { S.base.res.food = Math.max(0, S.base.res.food + e.food); out.push(`${e.food > 0 ? '+' : ''}${e.food} food`); }
  if (e.water) { S.base.res.water = Math.max(0, S.base.res.water + e.water); out.push(`${e.water > 0 ? '+' : ''}${e.water} water`); }
  if (e.skill && sv.main && sv.skills[sv.main] != null) { sv.skills[sv.main] = Math.min(10, sv.skills[sv.main] + e.skill); out.push(`${sv.name.split(' ')[0]} improves`); }
  return out;
}
export function chooseStory(S, svId, idx, now = Date.now()) {
  const sv = S.base.survivors.find((x) => x.id === svId); if (!sv || !sv.story || sv.story.beat >= 3) return null;
  const arc = STORIES[arcOf(sv)], beat = arc.beats[sv.story.beat], ch = beat.ch[idx]; if (!ch) return null;
  if (ch.eff.gold < 0 && S.gold < -ch.eff.gold) return { poor: true };
  const got = apply(S, sv, ch.eff); sv.story.beat++; sv.story.next = now + (5 + Math.random() * 4) * H;
  return { text: fill(ch.res, sv), got, last: sv.story.beat >= 3, title: arc.title };
}
