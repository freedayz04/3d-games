
// ======================================================================
// DATA — every balance number lives here
// ======================================================================
const ROAD_HALF = 7.0, LANES = [-5.6, -2.8, 0, 2.8, 5.6]; // 5 lanes
const CHUNK = 40, NCHUNK = 8;

const CARS = [
  { id: 'roadster', name: 'Roadster',    price: 0,    power: 20, color: '#2e9bff', special: null,     desc: 'Light, nimble starter car.' },
  { id: 'police',   name: 'Interceptor', price: 600,  power: 35, color: '#f4f6fb', special: 'siren',  desc: 'Comes with a free SIREN PULSE weapon.' },
  { id: 'fire',     name: 'Fire Truck',  price: 1500, power: 55, color: '#e63946', special: 'water',  desc: 'Comes with a free WATER CANNON weapon.' },
  { id: 'tank',     name: 'Tank',        price: 3500, power: 90, color: '#6b8f3a', special: 'cannon', desc: 'Comes with a free TANK CANNON weapon.' },
  { id: 'taxi',     name: 'Taxi',        price: 400,  power: 28, color: '#ffd23f', special: 'coinshot', desc: 'Comes with a free COIN SHOT weapon.' },
  { id: 'sports',   name: 'Viper',       price: 1100, power: 40, color: '#ff3b4d', special: 'rockets',  desc: 'Comes with free TWIN ROCKETS.' },
  { id: 'ambulance',name: 'Ambulance',   price: 900,  power: 45, color: '#f4f6fb', special: 'defib',    desc: 'Comes with a free DEFIB ZAP weapon.' },
  { id: 'icecream', name: 'Ice Cream',   price: 2000, power: 60, color: '#ffb3d1', special: 'freeze',   desc: 'Comes with a free FREEZE RAY weapon.' },
  { id: 'garbage',  name: 'Garbage Truck', price: 2800, power: 75, color: '#3f9d4a', special: 'trash',  desc: 'Comes with a free TRASH LAUNCHER.' },
  { id: 'monster',  name: 'Monster',     price: 5000, power: 110, color: '#7c3aed', special: 'flame',   desc: 'Comes with a free FLAMETHROWER.' },
];
// Weapons. `car` = can't be bought: it comes free with that car, then it can be equipped on any car.
const WEAPONS = [
  { id: 'twin',    name: 'Twin Gun',     price: 0,    kind: 'bullet',  dmg: 2,   rate: 5,   range: 48, speed: 70, stats: [2, 3, 2], desc: 'Reliable starter gun.' },
  { id: 'minigun', name: 'Minigun',      price: 300,  kind: 'bullet',  dmg: 0.9, rate: 14,  range: 40, speed: 75, spread: 0.05, stats: [1, 5, 2], desc: 'Sprays fast, light rounds.' },
  { id: 'missile', name: 'Missiles',     price: 700,  kind: 'missile', dmg: 7,   rate: 1.7, range: 60, speed: 34, splash: 1.8, stats: [3, 2, 4], desc: 'Homing rockets with a small blast.' },
  { id: 'laser',   name: 'Laser',        price: 1100, kind: 'laser',   dmg: 30,  charge: 1.15, range: 70, stats: [5, 1, 5], desc: 'Charges up, then a beam pierces every car in the line.' },
  { id: 'bazooka', name: 'Bazooka',      price: 1600, kind: 'rocket',  dmg: 24,  rate: 0.75, range: 82, speed: 30, splash: 3.2, stats: [5, 1, 5], desc: 'Slow, heavy rocket. Huge blast.' },
  { id: 'shotgun', name: 'Shotgun',      price: 450,  kind: 'bullet',  dmg: 1.3, rate: 1.6, range: 26, speed: 70, pellets: 6, spread: 0.2, stats: [3, 2, 1], desc: 'Close-range blast of pellets.' },
  { id: 'tesla',   name: 'Tesla Coil',   price: 900,  kind: 'siren',   every: 1.2, dmg: 6, radius: 7, color: '#a78bfa', stats: [2, 4, 1], desc: 'Fast electric pulses around you.' },
  { id: 'grenade', name: 'Grenade',      price: 1300, kind: 'rocket',  dmg: 14, rate: 1.2, range: 50, speed: 24, splash: 3, color: '#4d7c0f', stats: [3, 3, 3], desc: 'Bouncy bombs with a wide blast.' },
  { id: 'plasma',  name: 'Plasma',       price: 1900, kind: 'bullet',  dmg: 5, rate: 3, range: 55, speed: 45, size: 0.5, pierce: 2, color: '#f472b6', stats: [4, 3, 3], desc: 'Glowing orbs that pass through 2 cars.' },
  { id: 'sniper',  name: 'Sniper',       price: 2400, kind: 'bullet',  dmg: 16, rate: 0.9, range: 95, speed: 140, color: '#ffffff', stats: [5, 1, 5], desc: 'One huge hit from very far away.' },
  { id: 'railgun', name: 'Railgun',      price: 3200, kind: 'laser',   dmg: 70, charge: 2.2, range: 95, color: '#38bdf8', stats: [5, 1, 5], desc: 'Long charge, devastating piercing shot.' },
  { id: 'siren',   name: 'Siren Pulse',  car: 'police', kind: 'siren',  every: 2.4, dmg: 12, radius: 11, stats: [2, 2, 3], desc: 'Shockwave that hits every car around you.' },
  { id: 'water',   name: 'Water Cannon', car: 'fire',   kind: 'water',  dps: 11, range: 34, push: 9, stats: [2, 5, 4], desc: 'Long jet that soaks power and pushes cars away.' },
  { id: 'cannon',  name: 'Tank Cannon',  car: 'tank',   kind: 'cannon', every: 1.7, dmg: 42, splash: 3.6, speed: 46, range: 80, stats: [5, 1, 5], desc: 'Huge shell with splash damage.' },
  { id: 'coinshot', name: 'Coin Shot',   car: 'taxi',   kind: 'bullet', dmg: 1.6, rate: 6, range: 46, speed: 65, color: '#ffc21a', cashHit: 1, stats: [2, 3, 2], desc: 'Every hit pays you a coin.' },
  { id: 'rockets', name: 'Twin Rockets', car: 'sports', kind: 'missile', dmg: 6, rate: 1.5, range: 62, speed: 38, splash: 1.6, salvo: 2, stats: [3, 2, 4], desc: 'Two homing rockets per shot.' },
  { id: 'defib',   name: 'Defib Zap',    car: 'ambulance', kind: 'siren', every: 2.8, dmg: 9, radius: 9, stun: 1.2, color: '#34d399', stats: [2, 2, 2], desc: 'Shock ring that freezes nearby cars for a moment.' },
  { id: 'freeze',  name: 'Freeze Ray',   car: 'icecream', kind: 'water', dps: 7, range: 30, push: 3, stun: 0.25, color: '#a5f3fc', stats: [2, 5, 4], desc: 'Icy beam that stops cars in their tracks.' },
  { id: 'trash',   name: 'Trash Launcher', car: 'garbage', kind: 'rocket', dmg: 30, rate: 0.6, range: 70, speed: 26, splash: 4.2, stats: [5, 1, 4], desc: 'Lobs a bin with a huge splash.' },
  { id: 'flame',   name: 'Flamethrower', car: 'monster', kind: 'water', dps: 22, range: 17, push: 2, color: '#ff8a1a', stats: [5, 5, 2], desc: 'Short range, burns hard.' },
];
const WEAPON = Object.fromEntries(WEAPONS.map(w => [w.id, w]));
// Which stats each weapon can upgrade (dmg / rate / range). 10 levels, gentle at first.
const W_UPS = { twin: ['dmg', 'rate', 'range'], minigun: ['dmg', 'rate'], missile: ['dmg', 'rate', 'range'], laser: ['dmg', 'rate', 'range'],
  bazooka: ['dmg', 'range'], siren: ['dmg', 'range'], water: ['dmg', 'range'], cannon: ['dmg', 'rate'],
  shotgun: ['dmg', 'rate'], tesla: ['dmg', 'range'], grenade: ['dmg', 'rate', 'range'], plasma: ['dmg', 'rate'], sniper: ['dmg', 'rate'], railgun: ['dmg', 'rate'],
  coinshot: ['dmg', 'rate'], rockets: ['dmg', 'rate', 'range'], defib: ['dmg', 'range'], freeze: ['dmg', 'range'], trash: ['dmg', 'range'], flame: ['dmg', 'range'] };
const W_MAX = 10;

// ======================================================================
// SKINS: per car — Default + 5 solid colours + 5 themed patterns, and 5 wheel styles
// ======================================================================
const SKIN_BASE = { roadster: ['#2e9bff'], police: ['#f4f6fb'], fire: ['#e63946', '#c1121f'], tank: ['#6b8f3a', '#5d7d31'], taxi: ['#ffd23f'],
  sports: ['#ff3b4d'], ambulance: ['#f4f6fb'], icecream: ['#ffb3d1', '#ffd6e7'], garbage: ['#3f9d4a'], monster: ['#7c3aed'] };
const SOLIDS = [['red', 'Red', '#ff3b4d'], ['orange', 'Orange', '#ff9f1c'], ['green', 'Lime', '#2bd96b'], ['purple', 'Grape', '#8b5cf6'], ['black', 'Midnight', '#1f2937']];
const SOLID_PRICE = 150, PATTERN_PRICES = [400, 400, 800, 800, 2000];
const PATTERNS = {
  roadster:  [['Racing', 'stripes', '#2e9bff', '#ffffff'], ['Checker', 'checker', '#111827', '#ffffff'], ['Hot Rod', 'flames', '#1f2937', '#ff6a00', '#ffd23f'], ['Carbon', 'carbon'], ['Galaxy', 'galaxy']],
  police:    [['Highway', 'stripes', '#1d4ed8', '#ffffff'], ['Hazard', 'hazard', '#facc15', '#111827'], ['Urban Camo', 'digital', '#334155', '#64748b', '#94a3b8'], ['Neon Patrol', 'neon', '#0f172a', '#38bdf8'], ['Chrome Chief', 'chrome']],
  fire:      [['Hazard', 'hazard', '#facc15', '#e63946'], ['Blaze', 'flames', '#7f1d1d', '#ff6a00', '#ffd23f'], ['Checker', 'checker', '#e63946', '#ffffff'], ['Carbon', 'carbon'], ['Inferno Gold', 'gold']],
  tank:      [['Jungle Camo', 'camo', '#4d6b2f', '#2f3d1f', '#8a7d4f'], ['Arctic Camo', 'camo', '#e5e7eb', '#93c5fd', '#64748b'], ['Desert Pixel', 'digital', '#c8a26a', '#8a6d3b', '#e8d2a6'], ['Tiger', 'tiger', '#f59e0b', '#111827'], ['Royal Gold', 'gold']],
  taxi:      [['Checker', 'checker', '#111827', '#ffd23f'], ['Racing', 'stripes', '#ffd23f', '#111827'], ['Night Cab', 'neon', '#111827', '#facc15'], ['Carbon', 'carbon'], ['Gold Cab', 'gold']],
  sports:    [['Racing', 'stripes', '#ff3b4d', '#ffffff'], ['Hot Rod', 'flames', '#111827', '#ff3b4d', '#ffd23f'], ['Tiger', 'tiger', '#fb923c', '#111827'], ['Carbon', 'carbon'], ['Galaxy', 'galaxy']],
  ambulance: [['Rescue', 'checker', '#22c55e', '#facc15'], ['Red Line', 'stripes', '#f4f6fb', '#ff3b4d'], ['Urban Camo', 'digital', '#334155', '#64748b', '#94a3b8'], ['Night Shift', 'neon', '#0f172a', '#34d399'], ['Chrome Medic', 'chrome']],
  icecream:  [['Candy', 'candy', '#ffffff', '#ff4d8d'], ['Sprinkles', 'sprinkle', '#fff1f6'], ['Mint Choc', 'camo', '#a7f3d0', '#5b3a29', '#d1fae5'], ['Neon Pop', 'neon', '#1e1b4b', '#f472b6'], ['Golden Sundae', 'gold']],
  garbage:   [['Hazard', 'hazard', '#facc15', '#111827'], ['Urban Camo', 'camo', '#475569', '#1f2937', '#94a3b8'], ['Recycle', 'digital', '#3f9d4a', '#166534', '#86efac'], ['Toxic', 'neon', '#0f172a', '#a3e635'], ['Chrome Crusher', 'chrome']],
  monster:   [['Hot Rod', 'flames', '#1f2937', '#ff6a00', '#ffd23f'], ['Tiger', 'tiger', '#a855f7', '#111827'], ['Jungle Camo', 'camo', '#4d6b2f', '#2f3d1f', '#8a7d4f'], ['Carbon', 'carbon'], ['Galaxy', 'galaxy']],
};
const WHEELS = [['default', 'Stock', '#c3cad6', 0], ['chrome', 'Chrome', '#f1f5f9', 200], ['red', 'Red Rims', '#ff3b4d', 350], ['neon', 'Neon', '#22d3ee', 600], ['gold', 'Gold', '#ffc21a', 1000]];
function bodySkins(carId) {
  const list = [{ id: 'default', name: 'Default', price: 0 }];
  for (const [id, name, c] of SOLIDS) list.push({ id, name, price: SOLID_PRICE, solid: c });
  PATTERNS[carId].forEach((p, i) => list.push({ id: 'p' + i, name: p[0], price: PATTERN_PRICES[i], pattern: p[1], colors: p.slice(2), tier: i }));
  return list;
}
const skinState = carId => { save.skins = save.skins || {}; return save.skins[carId] = save.skins[carId] || { b: 'default', w: 'default', own: ['default', 'w:default'] }; };
const W_STEP = { dmg: 0.12, rate: 0.08, range: 0.06 };
const wLevel = id => (save.wlv && save.wlv[id]) || 0;
const wMul = (id, stat, lv = wLevel(id)) => W_UPS[id].includes(stat) ? 1 + W_STEP[stat] * lv : 1;
const wUpCost = (id, lv) => Math.round((60 + (WEAPON[id].price || 900) * 0.12) * Math.pow(1.5, lv));
function wEff(id) {
  const W = WEAPON[id], d = wMul(id, 'dmg'), r = wMul(id, 'rate'), g = wMul(id, 'range');
  return { ...W, dmg: W.dmg && W.dmg * d, dps: W.dps && W.dps * d, rate: W.rate && W.rate * r, every: W.every && W.every / r, charge: W.charge && W.charge / r, range: W.range && W.range * g, radius: W.radius && W.radius * g };
}
const weaponOwned = id => { const w = WEAPON[id]; return w.car ? save.cars.includes(w.car) : save.weapons.includes(id); };
const PARTS = [
  { id: 'engine',  name: 'Engine',     base: 40,  max: 20, desc: lv => `Start power +${lv * 5} → +${(lv + 1) * 5}` },
  { id: 'crusher', name: 'Crusher',    base: 60,  max: 10, desc: lv => `Absorb ${pct(absorbOf(lv))} → ${pct(absorbOf(lv + 1))} of a smashed car` },
  { id: 'damage',  name: 'Gun Damage', base: 50,  max: 20, desc: lv => `Damage ×${dmgMulOf(lv).toFixed(2)} → ×${dmgMulOf(lv + 1).toFixed(2)}` },
  { id: 'rate',    name: 'Fire Rate',  base: 50,  max: 10, desc: lv => `Fire speed ×${rateMulOf(lv).toFixed(2)} → ×${rateMulOf(lv + 1).toFixed(2)}` },
  { id: 'motor',   name: 'Motor',      base: 70,  max: 10, desc: lv => `Handling ${lv + 1} → ${lv + 2}: snappier steering, wider move range` },
  { id: 'wheels',  name: 'Wheels',     base: 70,  max: 10, desc: lv => `Top speed ${speedOf(lv, 1)} → ${speedOf(lv + 1, 1)} km/h, better grip on oil` },
  { id: 'armor',   name: 'Armor',      base: 150, max: 3,  desc: lv => `${3 + lv} → ${4 + lv} hearts` },
  { id: 'slots',   name: 'Gun Slot',   base: 500, max: 2,  desc: lv => `Carry ${lv + 1} → ${lv + 2} weapons at once` },
];
const pct = v => Math.round(v * 100) + '%';
const absorbOf = lv => 0.35 + 0.05 * lv;
const dmgMulOf = lv => 1 + 0.15 * lv;
const rateMulOf = lv => 1 + 0.1 * lv;
const speedOf = (wheels, level) => Math.round((20 + wheels * 0.7 + Math.min(level, 10) * 0.3) * 7.2);
const partCost = (p, lv) => Math.round(p.base * Math.pow(p.id === 'slots' ? 2.4 : 1.45, lv));

const GADGETS = [
  { id: 'guard',     name: 'Guard',            price: 80,  active: true,  color: '#38bdf8', desc: 'A shield blocks all damage for 15 seconds.' },
  // Nitro removed: it forced the car forward and blocked reversing.
  { id: 'nitro', hidden: true,     name: 'Nitro',            price: 70,  active: true,  color: '#fb923c', desc: '4 seconds of top speed. Smash anything that isn’t a boss.' },
  { id: 'autopilot', name: 'AutoPilot',        price: 150, active: true,  color: '#a78bfa', desc: 'Drives 20% of the level for you: eats what it can, dodges the rest.' },
  { id: 'emp',       name: 'EMP Blast',        price: 90,  active: true,  color: '#22d3ee', desc: 'Every car ahead loses 40% power and stalls for 2 seconds.' },
  { id: 'drone',     name: 'Drone',            price: 110, active: true,  color: '#a3e635', desc: 'A helper drone shoots for 20 seconds.' },
  { id: 'magnet',    name: 'Magnet',           price: 50,  active: true,  color: '#f43f5e', desc: 'Pulls in cash and drops for 20 seconds.' },
  { id: 'gold',      name: 'Gold Rush',        price: 60,  active: true,  color: '#facc15', desc: 'Double cash for 20 seconds.' },
  { id: 'hammer',    name: 'Emergency Hammer', price: 120, active: false, color: '#fb7185', desc: 'Automatic: smashes one stronger car right before you crash.' },
  { id: 'repair',    name: 'Auto Repair',      price: 100, active: false, color: '#34d399', desc: 'Automatic for one race: every 10 cars destroyed restores a heart.' },
];
const GADGET = Object.fromEntries(GADGETS.map(g => [g.id, g]));
GADGETS.splice(GADGETS.findIndex(g => g.hidden), 1);
const MAX_GADGET = 3;

const BIOMES = [
  { name: 'Countryside', sky: '#9ad8ff', ground: '#7fd05a', road: '#5d6372', shoulder: '#d9cfb8', rail: '#e7ebf2', deco: 'country' },
  { name: 'Desert',      sky: '#ffd9a6', ground: '#e8c27c', road: '#6c645a', shoulder: '#d6b47a', rail: '#c9a46a', deco: 'desert' },
  { name: 'Neon City',   sky: '#8fb4ff', ground: '#5c6577', road: '#3e4351', shoulder: '#9aa3b2', rail: '#c8d0dc', deco: 'city' },
  { name: 'Red Bridge',  sky: '#8ecdf5', ground: '#2f86c9', road: '#666c7a', shoulder: '#c7ccd6', rail: '#e2353b', deco: 'bridge' },
  { name: 'Snowpeak',    sky: '#d4ebff', ground: '#f3f7fd', road: '#5f6775', shoulder: '#dde6f1', rail: '#e7ebf2', deco: 'snow' },
];
// What each level adds. Later levels mix everything.
const INTRO = {
  2: { enemy: 'biker',    hazard: 'boost',   text: 'NEW: <span class="y">Bikers</span> weave between lanes. Green <span class="g">boost pads</span> speed you up!' },
  3: { enemy: 'gunner',   hazard: 'oil',     text: 'NEW: <span class="r">Gunner jeeps</span> shoot back. Avoid <span class="y">oil slicks</span>!' },
  4: { enemy: 'shield',   hazard: 'barrier', text: 'NEW: <span class="b">Shield vans</span> block bullets from behind. Ram them or use a laser! Watch the roadwork.' },
  5: { enemy: 'kamikaze', hazard: 'rocks',   text: 'NEW: <span class="r">Kamikaze</span> cars drive at you. Shoot them first! Falling rocks ahead.' },
  6: { enemy: 'splitter', hazard: null,      text: 'NEW: <span class="g">Splitter vans</span> break into two small cars. Eat both!' },
};
function unlocked(level) {
  const enemies = ['car', 'truck'], hazards = [];
  for (let l = 2; l <= level; l++) if (INTRO[l]) { enemies.push(INTRO[l].enemy); if (INTRO[l].hazard) hazards.push(INTRO[l].hazard); }
  return { enemies, hazards };
}
const BOSSES = [
  { id: 'armored', name: 'Armored Truck', hint: 'drops mines' },
  { id: 'monster', name: 'Monster Truck', hint: 'charges backward down a red lane' },
  { id: 'tankboss', name: 'Siege Tank',   hint: 'shells the red circles' },
];

// ======================================================================
// SVG icons (inline, no assets)
// ======================================================================
const ICONS = {
  coin: `<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="18" fill="#b88200"/><circle cx="24" cy="22" r="18" fill="#ffc21a"/><circle cx="24" cy="22" r="12.5" fill="none" stroke="#ffe27a" stroke-width="3"/><path d="M24 13v18M28.5 16.5c-1.2-1.6-3-2-4.5-2-2.6 0-4.5 1.3-4.5 3.4 0 4.6 9.5 2.2 9.5 7 0 2.1-2 3.6-5 3.6-2 0-3.8-.8-5-2.4" fill="none" stroke="#b88200" stroke-width="3" stroke-linecap="round"/></svg>`,
  heart: c => `<svg viewBox="0 0 48 48"><path d="M24 42S5 30 5 17.5C5 11 10 6 16 6c3.6 0 6.4 1.8 8 4.5C25.6 7.8 28.4 6 32 6c6 0 11 5 11 11.5C43 30 24 42 24 42z" fill="${c}" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M13 14c1.5-2.5 4-3.5 6-3" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round" fill="none"/></svg>`,
  skull: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="22" fill="#ff3b4d" stroke="#fff" stroke-width="3"/><path d="M24 11c-7 0-12 5-12 11 0 4 2 6.5 4 8v4h16v-4c2-1.5 4-4 4-8 0-6-5-11-12-11z" fill="#fff"/><circle cx="19" cy="23" r="3.2" fill="#ff3b4d"/><circle cx="29" cy="23" r="3.2" fill="#ff3b4d"/><path d="M21 34v3M24 34v3M27 34v3" stroke="#ff3b4d" stroke-width="2"/></svg>`,
  car: c => `<svg viewBox="0 0 48 48"><path d="M6 30v-6l5-2 5-8h15l7 8 5 1.5V30z" fill="${c}" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linejoin="round"/><path d="M18 15.5h6v6.5h-10zM26 15.5h4.5l5.5 6.5H26z" fill="#bfe6ff"/><circle cx="14" cy="31" r="5" fill="#25272e"/><circle cx="35" cy="31" r="5" fill="#25272e"/><circle cx="14" cy="31" r="2" fill="#9aa3b2"/><circle cx="35" cy="31" r="2" fill="#9aa3b2"/></svg>`,
  police: `<svg viewBox="0 0 48 48"><rect x="18" y="8" width="5" height="4" rx="1" fill="#2e7cf6"/><rect x="25" y="8" width="5" height="4" rx="1" fill="#ff3b4d"/><path d="M6 30v-6l5-2 5-8h15l7 8 5 1.5V30z" fill="#f4f6fb" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linejoin="round"/><path d="M6 25h37v4H6z" fill="#1d2433"/><path d="M18 15.5h6v6.5h-10zM26 15.5h4.5l5.5 6.5H26z" fill="#bfe6ff"/><circle cx="14" cy="31" r="5" fill="#25272e"/><circle cx="35" cy="31" r="5" fill="#25272e"/></svg>`,
  fire: `<svg viewBox="0 0 48 48"><rect x="4" y="15" width="28" height="15" rx="2" fill="#e63946" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M32 18h7l5 6v6H32z" fill="#c1121f" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M35 20h4l3 4h-7z" fill="#bfe6ff"/><path d="M4 12h26M6 9v6M11 9v6M16 9v6M21 9v6M26 9v6" stroke="#d9dde5" stroke-width="2"/><rect x="4" y="22" width="28" height="2.5" fill="#fff"/><circle cx="11" cy="32" r="4.5" fill="#25272e"/><circle cx="37" cy="32" r="4.5" fill="#25272e"/></svg>`,
  tank: `<svg viewBox="0 0 48 48"><rect x="4" y="26" width="40" height="10" rx="5" fill="#3a3f2a"/><circle cx="10" cy="31" r="3" fill="#6b705c"/><circle cx="18" cy="31" r="3" fill="#6b705c"/><circle cx="26" cy="31" r="3" fill="#6b705c"/><circle cx="34" cy="31" r="3" fill="#6b705c"/><path d="M7 26l3-6h28l3 6z" fill="#6b8f3a" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="15" y="13" width="16" height="8" rx="3" fill="#556b2f"/><rect x="29" y="15" width="16" height="3.5" rx="1.5" fill="#3a3f2a"/></svg>`,
  twin: `<svg viewBox="0 0 48 48"><rect x="6" y="26" width="20" height="12" rx="3" fill="#3b4256"/><rect x="10" y="14" width="32" height="5" rx="2" fill="#9aa3b2"/><rect x="10" y="22" width="32" height="5" rx="2" fill="#9aa3b2"/><circle cx="43" cy="16.5" r="3" fill="#ffd23f"/><circle cx="43" cy="24.5" r="3" fill="#ffd23f"/></svg>`,
  minigun: `<svg viewBox="0 0 48 48"><rect x="4" y="18" width="12" height="14" rx="3" fill="#3b4256"/><rect x="14" y="16" width="28" height="4" rx="2" fill="#9aa3b2"/><rect x="14" y="22" width="28" height="4" rx="2" fill="#c3cad6"/><rect x="14" y="28" width="28" height="4" rx="2" fill="#9aa3b2"/><rect x="22" y="14" width="4" height="20" rx="1" fill="#3b4256"/><path d="M44 18l3-2M44 24h3M44 30l3 2" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  missile: `<svg viewBox="0 0 48 48"><path d="M8 28l22-14c4-2.5 9-2 12 0-1 4-3 8-7 10.5L13 38z" fill="#e5e7eb" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M35 15c2.5-1.5 5-1.5 7-1-.5 2.5-1.5 4.5-3.5 6z" fill="#ff3b4d"/><path d="M13 26l-6-1 2 6zM18 33l1 6 5-4z" fill="#ff3b4d"/><path d="M8 30l-5 6 7-2z" fill="#fb923c"/></svg>`,
  laser: `<svg viewBox="0 0 48 48"><rect x="4" y="19" width="16" height="12" rx="3" fill="#3b4256"/><rect x="18" y="21" width="10" height="8" rx="2" fill="#ff4d8d"/><path d="M28 25h18" stroke="#ff4d8d" stroke-width="7" stroke-linecap="round" opacity=".45"/><path d="M28 25h18" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="25" r="3" fill="#ff4d8d"/></svg>`,
  bazooka: `<svg viewBox="0 0 48 48"><rect x="4" y="18" width="38" height="11" rx="4" fill="#556b2f" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="16" y="29" width="5" height="9" rx="1.5" fill="#3b4256"/><rect x="38" y="16" width="7" height="15" rx="2" fill="#3a3f2a"/><circle cx="10" cy="23.5" r="3" fill="#ffd23f"/></svg>`,
  siren: `<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="19" fill="none" stroke="#7cc4ff" stroke-width="3" opacity=".6"/><circle cx="24" cy="26" r="12" fill="none" stroke="#ff6b7a" stroke-width="3" opacity=".8"/><rect x="15" y="20" width="18" height="12" rx="4" fill="#1d2433"/><rect x="17" y="22" width="6" height="8" rx="2" fill="#2e7cf6"/><rect x="25" y="22" width="6" height="8" rx="2" fill="#ff3b4d"/></svg>`,
  water: `<svg viewBox="0 0 48 48"><rect x="4" y="22" width="16" height="10" rx="3" fill="#c1121f"/><rect x="18" y="24" width="10" height="6" rx="2" fill="#d9dde5"/><path d="M28 27c6-6 12-4 17-1M28 27c5 3 10 5 16 3" stroke="#4cc9ff" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="41" cy="18" r="2.5" fill="#4cc9ff"/><circle cx="45" cy="34" r="2" fill="#4cc9ff"/></svg>`,
  cannon: `<svg viewBox="0 0 48 48"><rect x="6" y="20" width="18" height="12" rx="4" fill="#556b2f"/><rect x="22" y="23" width="20" height="6" rx="2" fill="#3a3f2a"/><circle cx="44" cy="26" r="4" fill="#ff8a00"/><circle cx="44" cy="26" r="2" fill="#ffd23f"/></svg>`,
  engine: `<svg viewBox="0 0 48 48"><rect x="8" y="16" width="28" height="20" rx="3" fill="#9aa3b2" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="12" y="10" width="6" height="7" fill="#6b7280"/><rect x="22" y="10" width="6" height="7" fill="#6b7280"/><rect x="36" y="22" width="6" height="8" fill="#6b7280"/><path d="M22 20l-4 7h5l-3 6 8-9h-5l3-4z" fill="#ffd23f"/></svg>`,
  crusher: `<svg viewBox="0 0 48 48"><rect x="6" y="20" width="36" height="16" rx="3" fill="#6b7280"/><path d="M8 20l4-9 4 9M18 20l4-9 4 9M28 20l4-9 4 9" fill="#e5e7eb" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/><rect x="6" y="26" width="36" height="3" fill="#ffd23f"/></svg>`,
  damage: `<svg viewBox="0 0 48 48"><path d="M12 30V18c0-6 4-11 8-12 4 1 8 6 8 12v12z" fill="#ffc21a" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="10" y="30" width="20" height="10" rx="1.5" fill="#c58a12"/><path d="M34 12l8-4M36 20h8M34 28l8 4" stroke="#ff3b4d" stroke-width="3" stroke-linecap="round"/></svg>`,
  rate: `<svg viewBox="0 0 48 48"><circle cx="24" cy="26" r="16" fill="#e5e7eb" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="21" y="5" width="6" height="5" rx="1" fill="#6b7280"/><path d="M24 26V16" stroke="#1d2433" stroke-width="3" stroke-linecap="round"/><path d="M24 26l7 4" stroke="#ff3b4d" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="26" r="2.5" fill="#1d2433"/></svg>`,
  motor: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="#9aa3b2" stroke-width="6"/><circle cx="24" cy="24" r="5" fill="#9aa3b2"/><path d="M8 22h11M29 22h11M24 29v12" stroke="#9aa3b2" stroke-width="5"/><circle cx="24" cy="24" r="17" fill="none" stroke="#2e9bff" stroke-width="2"/></svg>`,
  wheels: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="#25272e"/><circle cx="24" cy="24" r="10" fill="#c3cad6"/><path d="M24 14v20M14 24h20M17 17l14 14M31 17L17 31" stroke="#6b7280" stroke-width="2.5"/><circle cx="24" cy="24" r="3" fill="#25272e"/><path d="M3 12h8M1 20h7" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/></svg>`,
  armor: `<svg viewBox="0 0 48 48"><path d="M24 4l16 6v12c0 10-7 17-16 22C15 39 8 32 8 22V10z" fill="#9aa3b2" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M24 33s-8-5-8-10.5c0-2.7 2-4.7 4.4-4.7 1.6 0 2.9.8 3.6 2 .7-1.2 2-2 3.6-2 2.4 0 4.4 2 4.4 4.7C32 28 24 33 24 33z" fill="#ff3b4d"/></svg>`,
  guard: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#38bdf8" opacity=".25"/><path d="M24 6l14 5v11c0 9-6 15-14 19-8-4-14-10-14-19V11z" fill="#38bdf8" stroke="#fff" stroke-width="2.5"/><path d="M17 23l5 5 9-10" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  nitro: `<svg viewBox="0 0 48 48"><path d="M10 34c0-8 6-10 6-18 4 3 5 7 5 10 2-2 3-5 3-8 6 4 9 10 9 16 0 7-5 11-11.5 11S10 41 10 34z" fill="#fb923c"/><path d="M16 36c0-4 3-5 3-9 3 2 3 4 3 6 1-1 2-2 2-4 3 2 4 5 4 7 0 4-3 6-6 6s-6-2-6-6z" fill="#ffd23f"/><rect x="28" y="5" width="10" height="20" rx="4" fill="#e5e7eb" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="28" y="12" width="10" height="5" fill="#2e7cf6"/></svg>`,
  autopilot: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="#a78bfa" stroke-width="5"/><path d="M24 7v7M24 34v7M7 24h7M34 24h7" stroke="#a78bfa" stroke-width="4"/><text x="24" y="30" text-anchor="middle" font-family="Russo One, Arial Black, sans-serif" font-size="17" fill="#fff">A</text></svg>`,
  emp: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="none" stroke="#22d3ee" stroke-width="3" stroke-dasharray="5 4"/><circle cx="24" cy="24" r="13" fill="#0e7490"/><path d="M26 11l-9 15h7l-3 11 10-15h-7z" fill="#a5f3fc" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  drone: `<svg viewBox="0 0 48 48"><path d="M12 12l24 24M36 12L12 36" stroke="#4b5563" stroke-width="4"/><ellipse cx="11" cy="11" rx="8" ry="3" fill="#a3e635" opacity=".85"/><ellipse cx="37" cy="11" rx="8" ry="3" fill="#a3e635" opacity=".85"/><ellipse cx="11" cy="37" rx="8" ry="3" fill="#a3e635" opacity=".85"/><ellipse cx="37" cy="37" rx="8" ry="3" fill="#a3e635" opacity=".85"/><rect x="17" y="18" width="14" height="12" rx="4" fill="#e5e7eb" stroke="rgba(0,0,0,.35)" stroke-width="2"/><circle cx="24" cy="24" r="3" fill="#ff3b4d"/></svg>`,
  magnet: `<svg viewBox="0 0 48 48"><path d="M10 8h10v16c0 3 2 5 4 5s4-2 4-5V8h10v16c0 8-6 15-14 15S10 32 10 24z" fill="#f43f5e" stroke="rgba(0,0,0,.35)" stroke-width="2"/><rect x="10" y="8" width="10" height="7" fill="#e5e7eb"/><rect x="28" y="8" width="10" height="7" fill="#e5e7eb"/><path d="M40 34l5 2M42 27l5-1" stroke="#ffd23f" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  gold: `<svg viewBox="0 0 48 48"><circle cx="18" cy="28" r="12" fill="#b88200"/><circle cx="18" cy="25" r="12" fill="#ffc21a"/><circle cx="31" cy="21" r="12" fill="#b88200"/><circle cx="31" cy="18" r="12" fill="#ffd84d"/><text x="31" y="24" text-anchor="middle" font-family="Russo One, Arial Black, sans-serif" font-size="14" fill="#b88200">x2</text></svg>`,
  hammer: `<svg viewBox="0 0 48 48"><rect x="21" y="18" width="6" height="26" rx="2" fill="#8b5a2b" transform="rotate(-30 24 30)"/><path d="M9 14l20-10 6 11-20 10z" fill="#fb7185" stroke="rgba(0,0,0,.35)" stroke-width="2"/><path d="M35 15l7-3" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/></svg>`,
  repair: `<svg viewBox="0 0 48 48"><path d="M30 6a10 10 0 00-9 13L7 33a4 4 0 006 6l14-14a10 10 0 0013-9l-6 3-5-4 1-6z" fill="#34d399" stroke="rgba(0,0,0,.35)" stroke-width="2" stroke-linejoin="round"/><path d="M36 30h10M41 25v10" stroke="#ff3b4d" stroke-width="4" stroke-linecap="round"/></svg>`,
  music: on => `<svg viewBox="0 0 48 48"><path d="M18 34V12l20-5v22" fill="none" stroke="#fff" stroke-width="4" stroke-linejoin="round"/><circle cx="13" cy="34" r="6" fill="#fff"/><circle cx="33" cy="29" r="6" fill="#fff"/>${on ? '' : '<path d="M6 6l36 36" stroke="#ff3b4d" stroke-width="5" stroke-linecap="round"/>'}</svg>`,
  sound: on => `<svg viewBox="0 0 48 48"><path d="M8 18h8l10-8v28l-10-8H8z" fill="#fff"/>${on ? '<path d="M32 16c3 2 4 5 4 8s-1 6-4 8M36 10c5 4 7 9 7 14s-2 10-7 14" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>' : '<path d="M32 16l12 16M44 16L32 32" stroke="#ff3b4d" stroke-width="4" stroke-linecap="round"/>'}</svg>`,
  slots: `<svg viewBox="0 0 48 48"><rect x="4" y="14" width="12" height="20" rx="3" fill="#9aa3b2"/><rect x="18" y="14" width="12" height="20" rx="3" fill="#9aa3b2"/><rect x="32" y="14" width="12" height="20" rx="3" fill="#2bd96b"/></svg>`,
  gear: `<svg viewBox="0 0 48 48"><g fill="#334155">${Array.from({ length: 8 }, (_, i) => `<rect x="20" y="3" width="8" height="10" rx="2" transform="rotate(${i * 45} 24 24)"/>`).join('')}<circle cx="24" cy="24" r="14"/></g><circle cx="24" cy="24" r="6" fill="#fff"/></svg>`,
  pause: `<svg viewBox="0 0 48 48"><rect x="12" y="10" width="9" height="28" rx="2.5" fill="#334155"/><rect x="27" y="10" width="9" height="28" rx="2.5" fill="#334155"/></svg>`,
  home: `<svg viewBox="0 0 48 48"><path d="M6 24L24 8l18 16" fill="none" stroke="#334155" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 22v18h9V30h6v10h9V22" fill="#334155"/></svg>`,
  close: `<svg viewBox="0 0 48 48"><path d="M12 12l24 24M36 12L12 36" stroke="#334155" stroke-width="6" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 48 48"><path d="M10 25l9 9 19-20" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  lock: `<svg viewBox="0 0 48 48"><rect x="10" y="21" width="28" height="22" rx="4" fill="#9aa3b2"/><path d="M16 21v-6a8 8 0 0116 0v6" fill="none" stroke="#9aa3b2" stroke-width="5"/></svg>`,
  bolt: `<svg viewBox="0 0 48 48"><path d="M28 4L10 28h12l-4 16 20-26H26z" fill="#7cc4ff" stroke="#fff" stroke-width="2" stroke-linejoin="round"/></svg>`,
  target: `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="17" fill="none" stroke="#ff6b7a" stroke-width="5"/><circle cx="24" cy="24" r="6" fill="#ff6b7a"/><path d="M24 2v10M24 36v10M2 24h10M36 24h10" stroke="#ff6b7a" stroke-width="4"/></svg>`,
  dpad: `<svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" fill="rgba(15,21,35,.55)" stroke="rgba(255,255,255,.5)" stroke-width="3"/><path d="M60 14l12 16H48zM60 106l12-16H48zM14 60l16-12v24zM106 60l-16-12v24z" fill="#fff"/><g class="finger"><circle cx="60" cy="60" r="15" fill="#ffc21a" stroke="#fff" stroke-width="4"/></g></svg>`,
  tabCars: `<svg viewBox="0 0 48 48"><path d="M6 30v-6l5-2 5-8h15l7 8 5 1.5V30z" fill="currentColor"/><circle cx="14" cy="31" r="5" fill="#172033" stroke="currentColor" stroke-width="2"/><circle cx="35" cy="31" r="5" fill="#172033" stroke="currentColor" stroke-width="2"/></svg>`,
  tabSkins: `<svg viewBox="0 0 48 48"><rect x="14" y="14" width="20" height="30" rx="5" fill="currentColor"/><rect x="18" y="6" width="12" height="9" rx="2" fill="currentColor"/><circle cx="38" cy="8" r="2.5" fill="currentColor"/><circle cx="42" cy="14" r="2" fill="currentColor"/><circle cx="36" cy="16" r="1.6" fill="currentColor"/></svg>`,
  tabGuns: `<svg viewBox="0 0 48 48"><rect x="6" y="18" width="34" height="8" rx="2" fill="currentColor"/><rect x="10" y="26" width="10" height="12" rx="2" fill="currentColor"/><circle cx="43" cy="22" r="3" fill="currentColor"/></svg>`,
  tabParts: `<svg viewBox="0 0 48 48"><path d="M30 6a10 10 0 00-9 13L7 33a4 4 0 006 6l14-14a10 10 0 0013-9l-6 3-5-4 1-6z" fill="currentColor"/></svg>`,
  tabGadgets: `<svg viewBox="0 0 48 48"><rect x="8" y="14" width="32" height="26" rx="4" fill="currentColor"/><rect x="5" y="9" width="38" height="8" rx="2" fill="currentColor"/><path d="M24 9v31" stroke="#172033" stroke-width="4"/><path d="M24 9c-4-6-12-6-10 0M24 9c4-6 12-6 10 0" stroke="currentColor" stroke-width="3" fill="none"/></svg>`,
};
function icon(id, color) {
  const v = ICONS[id];
  return typeof v === 'function' ? v(color) : (v || '');
}
const carIcon = c => c.id === 'roadster' ? icon('car', c.color) : icon(c.id);
