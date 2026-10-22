// Playable heroes. The first two are plain survivors; the others unlock with Rank and start every run with a small kit.
export const HEROES = [
  { id: 'f', name: 'The Survivor', sub: 'Her', rank: 1, desc: 'No special training. Just stubborn, and still alive.', kit: null },
  { id: 'm', name: 'The Survivor', sub: 'Him', rank: 1, desc: 'No special training. Just stubborn, and still alive.', kit: null },
  { id: 'priest', name: 'Father Anselm', sub: 'The Priest', rank: 5, desc: 'Starts with the Flashlight Beam. His Ghost Burst charges 25% faster.',
    kit: (R) => { R.beam += 1; R.picked.beam = 1; R.ultGain *= 1.25; } },
  { id: 'mech', name: 'Dex', sub: 'The Mechanic', rank: 10, desc: 'Starts with Bear Traps. Picks up loot from further away, and her dash recharges 15% faster.',
    kit: (R) => { R.mines += 1; R.picked.mines = 1; R.magnetMul *= 1.3; R.dashMax *= 0.85; } },
  { id: 'hunter', name: 'Rook', sub: 'The Hunter', rank: 15, desc: '+12% crit chance, much heavier crits, and starts with Executioner.',
    kit: (R) => { R.crit += 0.12; R.hs.critDmg += 0.4; R.perkSet.add('exec'); R.picked.exec = 1; } },
  { id: 'nurse', name: 'Mara', sub: 'The Nurse', rank: 20, desc: '+60 health, regenerates 1.2 health a second, and heals on kills.',
    kit: (R) => { R.maxHp += 60; R.hero.hp += 60; R.regen += 1.2; R.perkSet.add('vamp'); R.picked.vamp = 1; } },
];
export const heroOf = (id) => HEROES.find((h) => h.id === id) || HEROES[0];
