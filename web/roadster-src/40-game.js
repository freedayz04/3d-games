
// ======================================================================
// GAME STATE
// ======================================================================
let state = 'title';
let run = null;
const enemies = [], projectiles = [], ebullets = [], fx = [], gates = [], pickups = [], popups = [], hazards = [];
let timeScale = 1, slowUntil = 0, shake = 0;

// Weapon slots per car: [x, y, z]. Slot 0 is the roof; 1 and 2 sit low on the front fenders
// so three weapons never pile on top of each other.
const SLOT_POS = {
  roadster: [[0, 1.28, 0.35], [-0.66, 0.92, -0.95], [0.66, 0.92, -0.95]],
  police:   [[0, 1.62, 0.95], [-0.66, 0.96, -1.05], [0.66, 0.96, -1.05]],
  fire:     [[0, 2.05, 1.6],  [-0.72, 1.82, -1.45], [0.72, 1.82, -1.45]],
  tank:     [[0, 1.88, 0.85], [-0.95, 0.98, -1.35], [0.95, 0.98, -1.35]],
  taxi:     [[0, 1.4, 0.75], [-0.66, 0.95, -0.95], [0.66, 0.95, -0.95]],
  sports:   [[0, 1.12, 0.45], [-0.7, 0.84, -1.0], [0.7, 0.84, -1.0]],
  ambulance:[[0, 2.12, 0.9], [-0.7, 1.55, -1.45], [0.7, 1.55, -1.45]],
  icecream: [[0, 2.2, -0.3], [-0.7, 1.55, -1.45], [0.7, 1.55, -1.45]],
  garbage:  [[0, 2.45, 1.2], [-0.72, 1.82, -1.45], [0.72, 1.82, -1.45]],
  monster:  [[0, 2.75, 0.5], [-0.75, 2.05, -1.3], [0.75, 2.05, -1.3]],
};
// A car's own weapon uses the car's built-in hardware instead of a bolt-on mount.
const BUILT_IN = { police: 'siren', fire: 'water', tank: 'cannon' };
const player = {
  x: 0, targetX: 0, oz: 0, targetOZ: 0, scale: 1, w: 1.7, l: 3.1,
  group: new THREE.Group(), body: new THREE.Group(), model: null, mounts: new THREE.Group(), carId: null, mountKey: '', slots: [],
  label: makeLabel(256, 128, 1.6), spin: 0,
};
player.group.add(player.body);
player.body.add(player.mounts);
player.body.add(player.label.spr);
scene.add(player.group);
const bubble = new THREE.Mesh(GEO.sphere, new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.6, transparent: true, opacity: 0.22, depthWrite: false }));
bubble.visible = false; player.group.add(bubble);
const drone = new THREE.Group();
(function buildDrone() {
  drone.add(part(GEO.box, '#e5e7eb', [0.7, 0.3, 0.7], [0, 0, 0]));
  drone.add(part(GEO.box, '#ff3b4d', [0.2, 0.2, 0.2], [0, -0.1, -0.35], { emissive: '#ff1f35', emissiveIntensity: 1 }));
  for (const [x, z] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    drone.add(part(GEO.box, '#4b5563', [0.08, 0.08, 0.6], [x * 0.5, 0, z * 0.5]));
    const rot = new THREE.Mesh(GEO.disc, basic('#a3e635', 0.6)); rot.rotation.x = -Math.PI / 2; rot.scale.setScalar(0.32); rot.position.set(x, 0.18, z); drone.add(rot);
  }
  drone.visible = false; scene.add(drone);
})();

function setPlayerCar(carId, weaponIds, barrels, skin = skinOf(carId)) {
  const skinKey = carId + ':' + skin.b + ':' + skin.w;
  if (player.skinKey !== skinKey) {
    player.skinKey = skinKey;
    if (player.model) player.body.remove(player.model.g);
    player.model = buildPlayerCar(carId, skin);
    player.body.add(player.model.g);
    player.carId = carId; player.mountKey = '';
    player.w = player.model.w; player.l = player.model.l;
    player.label.spr.position.set(0, 0.7, player.l / 2 + 1.0);
  }
  const key = carId + '|' + weaponIds.join(',') + '|' + barrels;
  if (player.mountKey !== key) {
    player.mounts.clear();
    player.slots = weaponIds.map((id, i) => {
      const pos = SLOT_POS[carId][i];
      const builtIn = BUILT_IN[carId] === id;
      if (barrels > 0 && !builtIn) {
        const m = buildWeaponModel(id, barrels);
        m.position.set(...pos);
        if (i > 0) m.scale.setScalar(0.8);
        player.mounts.add(m);
      }
      return { id, pos, builtIn };
    });
    player.mountKey = key;
  }
  bubble.scale.set(player.w * 0.95, 1.5, player.l * 0.7);
  bubble.position.set(0, 0.9, 0);
}
// AutoPilot visuals: violet underglow, a chevron path to its target and a lock-on ring.
const apGlow = new THREE.Mesh(GEO.disc, new THREE.MeshBasicMaterial({ color: '#a78bfa', transparent: true, opacity: 0.45, depthWrite: false }));
apGlow.rotation.x = -Math.PI / 2; apGlow.position.y = 0.05; apGlow.visible = false; scene.add(apGlow);
const apRing = new THREE.Mesh(GEO.ring, new THREE.MeshBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }));
apRing.rotation.x = -Math.PI / 2; apRing.visible = false; scene.add(apRing);
const apPath = [];
for (let i = 0; i < 7; i++) {
  const c = new THREE.Group();
  for (const s of [-1, 1]) { const b = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#c4b5fd', transparent: true, opacity: 0.8, depthWrite: false })); b.scale.set(0.12, 0.02, 0.6); b.position.x = s * 0.2; b.rotation.y = s * 0.75; c.add(b); }
  c.visible = false; scene.add(c); apPath.push(c);
}
let apTarget = null;
function updateAutopilotFx(on, pz) {
  apGlow.visible = on; apRing.visible = on && !!apTarget;
  for (const c of apPath) c.visible = on;
  if (!on) return;
  const t = run.t;
  apGlow.position.set(player.x, 0.05, pz); apGlow.scale.set(player.w * player.scale * 0.9, player.l * player.scale * 0.65, 1);
  apGlow.material.opacity = 0.35 + 0.15 * Math.sin(t * 8);
  const tx = apTarget ? apTarget.x : player.targetX, tz = apTarget ? apTarget.z : pz - 22;
  apPath.forEach((c, i) => {
    const k = ((i + (t * 2.5) % 1) / apPath.length);
    const z = pz - 2 - (pz - 2 - tz) * k;
    c.position.set(player.x + (tx - player.x) * k, 0.06, z);
    c.rotation.y = Math.atan2(-(tx - player.x), (pz - tz));
    c.children.forEach(b => b.material.opacity = 0.85 * (1 - k * 0.7));
  });
  if (apTarget) { apRing.position.set(apTarget.x, 0.08, apTarget.z); apRing.scale.setScalar(apTarget.w * 0.9 + 0.3 * Math.sin(t * 10)); }
}
const OZ_BACK = 6.5; // how far the car can drop back down the screen (position only, speed unchanged)
const playerZ = () => -run.dist + player.oz;
const effPower = () => run.power * (run.fx.boost > 0 ? 1.5 : 1);
function canRam(e) {
  if (e.kind === 'boss') return effPower() > Math.ceil(e.power);
  if (run.fx.nitro > 0) return true;
  return !e.hazard && !e.obstacle && effPower() > Math.ceil(e.power);
}

// ======================================================================
// RUN SETUP
// ======================================================================
function newRun() {
  const car = CARS.find(c => c.id === save.car) || CARS[0];
  const weaponIds = equippedWeapons();
  const level = save.level, P = save.parts;
  const biome = BIOMES[(level - 1) % BIOMES.length];
  run = {
    level, biome, car, weaponIds, ws: weaponIds.map(() => ({ cd: 0, charge: 0, acc: 0 })),
    power: car.power + P.engine * 5, topPower: 0,
    hearts: 3 + P.armor, maxHearts: 3 + P.armor,
    barrels: save.gun || level > 1 ? 1 : 0, rateMul: 1,
    dist: 0, speed: speedOf(P.wheels, level) / 7.2,
    length: level === 1 ? 800 : 720 + Math.min(level, 12) * 40,
    cash: 0, smashed: 0, shot: 0, kills: 0, t: 0,
    dropT: 0,
    invuln: 0, events: [], evIdx: 0, boss: null, over: false, hintUntil: 0,
    fx: { guard: 0, nitro: 0, magnet: 0, gold: 0, drone: 0, autopilot: 0, boost: 0, slide: 0 },
    slideDir: 1, hammer: save.gadgets.hammer || 0, repair: false, repairCount: 0, found: {},
    tutUntil: 0, movedX: false, movedY: false,
  };
  run.topPower = run.power;
  if ((save.gadgets.repair || 0) > 0) { save.gadgets.repair--; run.repair = true; persist(); }
  run.events = buildEvents(level, run.length);
  setBiome(biome);
  clearEntities();
  player.x = player.targetX = 0; player.oz = player.targetOZ = 0; player.scale = 0.9; player.spin = 0;
  player.group.visible = true; player.body.visible = true;
  setPlayerCar(car.id, weaponIds, run.barrels);
  camState.pos.set(0, 10, 12); camState.look.set(0, 0, -10);
  sfx.horn();
  sfx.setSong('race', 57 + [0, 2, -3, 5, -1][(level - 1) % 5]);
  sfx.engineStart();
  setState('play');
  flash('LEVEL ' + level, '#ffffff', 1.1);
  setTimeout(() => { if (run && run.level === level && state === 'play') flashSub(biome.name); }, 50);
  if (level === 1 || !save.tutorialDone) { $('tut').classList.remove('off'); run.tutUntil = 6; }
  if (INTRO[level]) setTimeout(() => { if (run && state === 'play' && run.level === level) showHint(INTRO[level].text, 4.5); }, 1600);
}
function clearEntities() {
  for (const e of enemies) removeEnemy(e); enemies.length = 0;
  for (const p of projectiles) scene.remove(p.mesh); projectiles.length = 0;
  for (const b of ebullets) scene.remove(b.mesh); ebullets.length = 0;
  for (const g of gates) { scene.remove(g.group); g.labels.forEach(disposeLabel); } gates.length = 0;
  for (const p of pickups) removePickup(p); pickups.length = 0;
  for (const f of fx) { scene.remove(f.m); f.dispose && f.dispose(); } fx.length = 0;
  for (const p of popups) { scene.remove(p.L.spr); disposeLabel(p.L); } popups.length = 0;
  for (const h of hazards) scene.remove(h.mesh); hazards.length = 0;
  drone.visible = false; bubble.visible = false; apTarget = null;
  apGlow.visible = apRing.visible = false; for (const c of apPath) c.visible = false;
}

// ======================================================================
// LEVEL SCRIPT
// ======================================================================
const CRATE_REWARDS = ['gun', 'rate', 'cash', 'power', 'g:guard', 'g:emp', 'g:drone', 'g:magnet', 'g:gold', 'g:hammer', 'g:autopilot'];
function buildEvents(level, length) {
  const ev = [];
  let d;
  if (level === 1) {
    ev.push({ d: 45,  type: 'cars', cars: [{ x: 0, p: 8 }], hint: 'Ram cars with a <span class="g">GREEN</span> bar to absorb their power!' });
    ev.push({ d: 85,  type: 'cars', cars: [{ x: -3, p: 10 }, { x: 3, p: 12 }] });
    ev.push({ d: 125, type: 'cars', cars: [{ x: 0, p: 6 }, { x: 0, p: 7, dz: -9 }, { x: 0, p: 8, dz: -18 }], hint: 'Drag <span class="y">UP</span> to speed in and eat the whole convoy!' });
    ev.push({ d: 185, type: 'cars', cars: [{ x: 0, p: 70, kind: 'truck' }, { x: -3, p: 9 }], hint: '<span class="r">RED</span> bar = too strong. Dodge it!' });
    ev.push({ d: 245, type: 'pickup', kind: 'gun', xs: [-2.8, 0, 2.8], hint: 'Grab a <span class="y">GUN</span>!' });
    ev.push({ d: 300, type: 'cars', cars: [{ x: 0, p: 55 }], hint: 'Shoot the bar past the <span class="y">white line</span>, then ram it. Shot-down cars leave <span class="g">scrap</span> to eat!' });
    ev.push({ d: 360, type: 'gate' });
    ev.push({ d: 410, type: 'crate', x: 0, reward: 'g:guard', hint: 'Break crates for <span class="y">gadgets</span>!' });
    d = 460;
  } else if (INTRO[level]) {
    const it = INTRO[level];
    ev.push({ d: 70, type: it.enemy === 'biker' ? 'bikers' : it.enemy });
    if (it.hazard) ev.push({ d: 115, type: it.hazard === 'barrier' ? 'roadwork' : it.hazard });
    d = 160;
  } else d = 60;

  const U = unlocked(level);
  const pool = [['weak', 2.6], ['convoy', 1.6], ['strong', 3], ['cash', 0.7]];
  const add = { biker: ['bikers', 1.4], gunner: ['gunner', 1.3], shield: ['shield', 1.2], kamikaze: ['kamikaze', 1.1], splitter: ['splitter', 1.2] };
  const addH = { boost: ['boost', 0.8], oil: ['oil', 1], barrier: ['roadwork', 1], rocks: ['rocks', 0.9] };
  for (const e of U.enemies) if (add[e]) pool.push(add[e]);
  for (const h of U.hazards) if (addH[h]) pool.push(addH[h]);
  const total = pool.reduce((s, p) => s + p[1], 0);
  let lastGate = d - 70, lastCrate = d - 40;
  while (d < length - 30) {
    const prog = d / length;
    if (d - lastGate > 150) { ev.push({ d, type: 'gate' }); lastGate = d; }
    else if (d - lastCrate > 105 && Math.random() < 0.45) { ev.push({ d, type: 'crate', x: pick(LANES), reward: pick(CRATE_REWARDS) }); lastCrate = d; }
    else {
      let r = Math.random() * total, type = 'weak';
      for (const [t, w] of pool) { r -= w; if (r <= 0) { type = t; break; } }
      ev.push({ d, type, prog });
    }
    d += rand(22, 31) * (1 - 0.25 * prog);
  }
  return ev;
}
const CAR_COLORS = ['#ffd23f', '#ff7b54', '#9b5de5', '#f15bb5', '#00c2a8', '#fb8500', '#e63946', '#8ecae6', '#90be6d'];
const lvlScale = () => 1 + 0.18 * (run.level - 1);
function spawnEvent(e) {
  const z0 = -e.d, P = run.power;
  if (e.hint) showHint(e.hint, 3.4);
  const weakP = (a, b) => Math.max(2, Math.round(P * rand(a, b)));
  const lanes3 = () => shuffle([...LANES]);
  switch (e.type) {
    case 'cars': for (const c of e.cars) addEnemy(c.kind || 'car', c.x, z0 + (c.dz || 0), c.p, c.kind === 'truck' ? 6 : 9); break;
    case 'weak': for (const x of lanes3().slice(0, 1 + Math.floor(Math.random() * ((e.prog || 0) > 0.5 ? 4 : 3)))) addEnemy('car', x, z0 + rand(-3, 3), weakP(0.22, 0.6), rand(7, 11)); break;
    case 'convoy': { const x = pick(LANES), n = 3 + Math.floor((e.prog || 0) * 3); for (let i = 0; i < n; i++) addEnemy('car', x, z0 - i * 8, weakP(0.12, 0.3), 9); break; }
    case 'strong': {
      const x = pick(LANES), truck = Math.random() < 0.4;
      addEnemy(truck ? 'truck' : 'car', x, z0, Math.round(P * rand(1.5, 2.3) * lvlScale()), truck ? 6 : 9);
      if (Math.random() < 0.6) addEnemy('car', pick(LANES.filter(l => l !== x)), z0 + rand(-4, 4), weakP(0.2, 0.45), 9);
      break;
    }
    case 'bikers': for (const x of lanes3().slice(0, 2 + (Math.random() < 0.4 ? 1 : 0))) { const b = addEnemy('biker', x, z0 + rand(-5, 5), weakP(0.15, 0.4), 13); b.baseX = x; } break;
    case 'gunner': addEnemy('gunner', pick(LANES), z0, Math.round(P * rand(1.0, 1.6) * lvlScale()), 10); break;
    case 'shield': { const s = addEnemy('shield', pick(LANES), z0, Math.round(P * rand(0.55, 1.1) * lvlScale()), 9); s.shield = s.shieldMax = Math.round(P * 0.5 + 10); break; }
    case 'kamikaze': addEnemy('kamikaze', pick(LANES), z0 - 10, weakP(0.25, 0.4), -6); break;
    case 'splitter': addEnemy('splitter', pick(LANES), z0, Math.round(P * rand(0.9, 1.5) * lvlScale()), 8); break;
    case 'boost': addHazard('boost', pick(LANES), z0); break;
    case 'oil': for (const x of lanes3().slice(0, Math.random() < 0.5 ? 1 : 2)) addHazard('oil', x, z0 + rand(-3, 3)); break;
    case 'roadwork': {
      const open = lanes3().slice(0, 2);
      for (const x of LANES) if (!open.includes(x)) { addEnemy('barrier', x, z0, 0, 0); addEnemy('barrier', x, z0 - 9, 0, 0);  }
      break;
    }
    case 'rocks': for (let k = 0; k < 3; k++) addHazard('rockfall', pick(LANES), z0 - k * 11); break;
    case 'crate': addCrate(e.x, z0, Math.round(P * rand(0.6, 1.1) * lvlScale()), e.reward); break;
    case 'cash': { const x = pick(LANES); for (let i = 0; i < 6; i++) addPickup('cash', x, z0 - i * 2.2); break; }
    case 'pickup': for (const x of e.xs) addPickup(e.kind, x, z0); break;
    case 'gate': addGate(z0); break;
  }
}

// ======================================================================
// ENEMIES
// ======================================================================
function addEnemy(kind, x, z, power, speed, opts = {}) {
  const color = opts.color || (kind === 'shield' ? '#e5e7eb' : kind === 'splitter' ? pick(['#4cc9f0', '#f72585', '#7209b7']) : pick(CAR_COLORS));
  const v = buildVehicle(kind === 'boss' ? 'boss-' + opts.variant : kind, color);
  const e = {
    kind, variant: opts.variant, x, z, y: 0, w: v.w, l: v.l, h: v.h, power, max: power, speed, color,
    group: v.g, wl: v.wl, extra: v.extra, label: null, hitT: 0, wob: rand(0, 6.28), dead: false,
    hazard: kind === 'mine' || kind === 'kamikaze', obstacle: kind === 'barrier' || kind === 'rock',
    shield: 0, shieldMax: 0, stun: 0, fireT: rand(0.5, 1.2), baseX: x,
  };
  if (e.obstacle) { e.power = e.max = Math.max(6, Math.round(run.power * 0.45 * lvlScale())); } // obstacles can be shot down, never eaten
  {
    e.label = makeLabel(256, 128, kind === 'boss' ? 3.4 : kind === 'biker' ? 1.9 : 2.3);
    e.label.spr.position.set(0, v.h + (kind === 'boss' ? 1.8 : 1.0), 0);
    v.g.add(e.label.spr);
  }
  v.g.position.set(x, 0, z);
  scene.add(v.g);
  enemies.push(e);
  return e;
}
function addCrate(x, z, hp, reward) {
  const gid = reward.startsWith('g:') ? reward.slice(2) : null;
  const col = gid ? GADGET[gid].color : { gun: '#3d3d3d', rate: '#2e9bff', cash: '#ffc21a', power: '#22c55e' }[reward];
  const e = addEnemy('crate', x, z, hp, 0, { color: col });
  e.reward = reward;
  return e;
}
function removeEnemy(e) { scene.remove(e.group); if (e.label) disposeLabel(e.label); }
const REWARD_TEXT = { gun: 'GUN +1', rate: 'FIRE RATE', cash: 'CASH', power: 'POWER' };
function updateEnemyLabel(e) {
  if (!e.label) return;
  const frac = Math.max(0, e.power) / e.max;
  if (e.obstacle) return drawBar(e.label, frac, null, '#f59e0b', e.kind === 'rock' ? 'ROCK' : 'BLOCKED');
  if (e.hazard) return drawBar(e.label, frac, null, RED, e.kind === 'kamikaze' ? 'KAMIKAZE' : 'DANGER');
  let sub = '';
  if (e.kind === 'crate') sub = e.reward.startsWith('g:') ? GADGET[e.reward.slice(2)].name.toUpperCase() : REWARD_TEXT[e.reward];
  else if (e.kind === 'boss') sub = 'BOSS';
  else if (e.shield > 0) sub = 'SHIELD';
  // Green bar = you can ram it now. The notch shows how far to shoot it down before you can.
  drawBar(e.label, frac, effPower() / e.max, canRam(e) ? GREEN : RED, sub, e.shield > 0 ? '#4cc9ff' : null);
}

function damageEnemy(e, dmg, src) {
  if (e.dead) return;
  if (e.shield > 0) {
    if (src === 'laser' || src === 'siren') breakShield(e);
    else {
      e.shield -= dmg; e.hitT = 0.05; sfx.ping();
      if (e.extra.shield) e.extra.shield.material.emissiveIntensity = 2;
      if (e.shield <= 0) breakShield(e);
      return;
    }
  }
  if (e.kind === 'boss') dmg *= 0.45; // armoured: guns weaken it, ramming finishes it
  e.power -= dmg; e.hitT = 0.06;
  if (e.kind === 'boss') e.power = Math.max(1, e.power); // a boss is only finished by ramming
  else if (e.power <= 0) killEnemy(e, 'shot');
}
function breakShield(e) {
  e.shield = 0;
  if (e.extra.shield) { e.group.remove(e.extra.shield); scrap(new THREE.Vector3(e.x, 1, e.z + 2), '#4cc9ff', 8, false); e.extra.shield = null; }
}

function killEnemy(e, how) {
  if (e.dead) return;
  e.dead = true;
  const pos = new THREE.Vector3(e.x, e.y, e.z);
  if (e.kind === 'mine') { explosion(pos, 0.6); sfx.boom(); return; }
  if (e.kind === 'barrier' || e.kind === 'rock') { scrap(pos, e.kind === 'rock' ? '#8d7b68' : '#ff6b1a', 10, false); sfx.smash(); shake = Math.max(shake, 0.25); return; }
  if (e.kind === 'crate') { explosion(pos, 0.7); scrap(pos, '#c9853f', 10, false); applyReward(e.reward); sfx.smash(); return; }
  explosion(pos, e.kind === 'boss' ? 2.4 : e.kind === 'truck' ? 1.3 : e.kind === 'kamikaze' ? 1.6 : 1);
  sfx.smash();
  if (e.kind === 'kamikaze') { sfx.boom(); for (const o of enemies) if (o !== e && !o.dead && Math.hypot(o.x - e.x, o.z - e.z) < 4.5) damageEnemy(o, 15 * lvlScale(), 'splash'); }
  run.kills++;
  if (run.repair && ++run.repairCount >= 10) { run.repairCount = 0; if (run.hearts < run.maxHearts) { run.hearts++; popup('+1 ♥', '#10b981'); sfx.pickup(); } }
  if (how === 'ram') {
    const gain = Math.max(1, Math.ceil(e.max * absorbOf(save.parts.crusher)));
    gainPower(gain);
    addCash(Math.ceil(e.max * 0.5) + 2);
    scrap(pos, e.color, e.kind === 'boss' ? 30 : 12, true);
    run.smashed++;
    shake = Math.max(shake, e.kind === 'boss' ? 0.7 : 0.3);
    hitstop(e.kind === 'boss' ? 900 : 70, e.kind === 'boss' ? 0.2 : 0.08);
  } else {
    addCash(Math.ceil(e.max * 0.2) + 1);
    scrap(pos, e.color, 6, false);
    if (!e.hazard) addPickup('wreck', e.x, e.z, { y: 1.4, vy: 7, value: Math.max(1, Math.ceil(e.max * absorbOf(save.parts.crusher))), color: e.color });
    run.shot++;
    shake = Math.max(shake, 0.12);
  }
  if (e.kind === 'splitter') {
    for (const s of [-1, 1]) addEnemy('car', clamp(e.x + s * 1.6, -5.6, 5.6), e.z - 3, Math.max(2, Math.round(e.max * 0.3)), 9);
    showHint('It split! <span class="g">Eat both!</span>', 1.6);
  }
  if (e.kind === 'boss') return winLevel();
  const big = ['gunner', 'shield', 'splitter', 'truck'].includes(e.kind);
  if (Math.random() < (big ? 0.32 : 0.12)) spawnDrop(e.x, e.z);
}

function hurtPlayer(e) {
  if (run.invuln > 0 || run.over) return;
  if (run.fx.autopilot > 0) return; // autopilot dodges everything
  if (run.fx.guard > 0) {
    sfx.ping(); burst(new THREE.Vector3(player.x, 1, playerZ()), '#38bdf8', 2.2, 0.3);
    if (e) bounceAway(e);
    run.invuln = 0.4;
    return;
  }
  if (e && run.hammer > 0 && !e.hazard) {
    run.hammer--;
    if ((save.gadgets.hammer || 0) > 0) { save.gadgets.hammer--; persist(); }
    swingHammer();
    if (e.kind === 'boss') { e.power *= 0.7; e.gap = 18; }
    else killEnemy(e, e.obstacle ? 'shot' : 'ram');
    flash('HAMMER!', GADGET.hammer.color, 0.9);
    run.invuln = 0.4;
    return;
  }
  run.hearts--; run.invuln = 1.3;
  shake = Math.max(shake, 0.45);
  sfx.hurt(); restartAnim($('redflash'), 'go');
  popup('-1 ♥', RED);
  if (e) { if (e.hazard) killEnemy(e, 'shot'); else bounceAway(e); }
  hitstop(120, 0.1);
  if (run.hearts <= 0) loseLevel();
}
function bounceAway(e) {
  if (e.kind === 'boss') { e.gap = 20; if (e.phase === 'charge') e.phase = 'return'; return; }
  if (e.obstacle) { player.targetOZ = Math.min(OZ_BACK, player.oz + 3); player.oz = player.targetOZ; return; }
  e.z -= 7; e.x = clamp(e.x + (e.x >= player.x ? 1.6 : -1.6), -5.6, 5.6); e.baseX = e.x;
}
function hitstop(ms, scale) { timeScale = scale; slowUntil = performance.now() + ms; }

// ======================================================================
// GATES
// ======================================================================
function gateOptions() {
  const P = run.power;
  const n = Math.round(P * 0.15) + 4;
  const good = [
    { text: '+' + n, sub: 'POWER', good: true, apply: () => gainPower(n) },
    { text: 'x1.3', sub: 'FIRE RATE', good: true, apply: () => { run.rateMul *= 1.3; } },
  ];
  if (run.barrels < 4) good.push({ text: '+1', sub: 'GUN', good: true, apply: () => addBarrel() });
  if (run.hearts < run.maxHearts) good.push({ text: '+1 ♥', sub: 'REPAIR', good: true, apply: () => { run.hearts++; } });
  const gg = pick(['guard', 'emp', 'drone', 'magnet', 'gold']);
  good.push({ text: GADGET[gg].name.toUpperCase(), sub: 'GADGET', good: true, gadget: gg, apply: () => activate(gg) });
  const m = Math.round(P * 0.25);
  const bad = { text: '-' + m, sub: 'POWER', good: false, apply: () => { run.power = Math.max(1, run.power - m); popup('-' + m, RED); } };
  const a = pick(good);
  const b = Math.random() < 0.45 ? bad : (pick(good.filter(g => g !== a)) || bad);
  return Math.random() < 0.5 ? [a, b] : [b, a];
}
function addGate(z) {
  const opts = gateOptions(), group = new THREE.Group(), labels = [], panels = [];
  opts.forEach((o, i) => {
    const s = i === 0 ? -1 : 1, cx = s * ROAD_HALF / 2;
    const col = o.good ? (o.gadget ? GADGET[o.gadget].color : '#2e9bff') : '#ef3b4d';
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(ROAD_HALF - 0.35, 2.7), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false }));
    panel.position.set(cx, 1.5, 0); group.add(panel); panels.push(panel);
    group.add(part(GEO.box, col, [ROAD_HALF - 0.1, 0.3, 0.3], [cx, 3.0, 0], { emissive: col, emissiveIntensity: 0.4 }));
    group.add(part(GEO.box, '#e7ebf2', [0.25, 3.2, 0.25], [s * (ROAD_HALF - 0.1), 1.6, 0]));
    const L = makeLabel(256, 128, 2.6); drawLabel(L, o.text, o.sub, o.good ? (o.gadget ? '#6d28d9' : BLUE) : RED);
    L.spr.position.set(cx, 1.7, 0.05); group.add(L.spr); labels.push(L);
  });
  group.add(part(GEO.box, '#1d2433', [0.5, 3.4, 0.5], [0, 1.7, 0]));
  group.add(part(GEO.box, '#ffd23f', [0.55, 0.3, 0.55], [0, 3.45, 0], { emissive: '#ffb000', emissiveIntensity: 0.6 }));
  group.position.z = z; scene.add(group);
  gates.push({ z, opts, group, labels, panels, used: false });
}

// ======================================================================
// HAZARDS (oil, boost pads, falling rocks, cones)
// ======================================================================
function addHazard(type, x, z) {
  let mesh;
  if (type === 'oil') {
    mesh = new THREE.Group();
    const a = new THREE.Mesh(GEO.disc, new THREE.MeshStandardMaterial({ color: '#facc15', roughness: 0.15, metalness: 0.3, emissive: '#a16207', emissiveIntensity: 0.35 }));
    a.rotation.x = -Math.PI / 2; a.scale.set(1.5, 1.1, 1); a.position.y = 0.02; mesh.add(a);
    const b = new THREE.Mesh(GEO.disc, new THREE.MeshBasicMaterial({ color: '#fef08a', transparent: true, opacity: 0.5 }));
    b.rotation.x = -Math.PI / 2; b.scale.set(0.8, 0.5, 1); b.position.set(0.3, 0.025, -0.2); mesh.add(b);
  } else if (type === 'boost') {
    mesh = new THREE.Group();
    mesh.add(part(GEO.box, '#14532d', [2.2, 0.04, 3.4], [0, 0.02, 0]));
    for (let k = 0; k < 3; k++) for (const s of [-1, 1]) {
      const c = part(GEO.box, '#4ade80', [0.25, 0.05, 1.0], [s * 0.4, 0.05, -1 + k * 1.0], { emissive: '#22c55e', emissiveIntensity: 1 });
      c.rotation.y = s * 0.7; mesh.add(c);
    }
  } else if (type === 'cone') {
    mesh = new THREE.Group();
    mesh.add(part(GEO.cone6, '#ff6b1a', [0.25, 0.7, 0.25], [0, 0.35, 0]));
    mesh.add(part(GEO.cyl6, '#ffffff', [0.2, 0.1, 0.2], [0, 0.4, 0]));
    mesh.add(part(GEO.box, '#2b2f3a', [0.55, 0.06, 0.55], [0, 0.03, 0]));
  } else if (type === 'rockfall') {
    mesh = new THREE.Mesh(GEO.ring, new THREE.MeshBasicMaterial({ color: '#ff3b4d', transparent: true, opacity: 0.0, side: THREE.DoubleSide, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2; mesh.scale.setScalar(1.3); mesh.position.y = 0.04;
  }
  mesh.position.x = x; mesh.position.z = z;
  scene.add(mesh);
  const h = { type, x, z, mesh, used: false, t: 0, armed: false };
  hazards.push(h);
  return h;
}

// ======================================================================
// PICKUPS (cash, gun crates, drops that fly ahead of you)
// ======================================================================
const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 14);
function addPickup(type, x, z, opts = {}) {
  let mesh, L = null;
  if (type === 'cash') {
    mesh = new THREE.Mesh(coinGeo, mat('#ffc21a', { emissive: '#ffb000', emissiveIntensity: 0.4, metalness: 0.4 }));
    mesh.rotation.x = Math.PI / 2;
  } else if (type === 'bundle') {
    mesh = new THREE.Group();
    for (let k = 0; k < 3; k++) mesh.add(part(GEO.box, '#4ade80', [0.9, 0.18, 0.5], [0, k * 0.2, 0], { emissive: '#16a34a', emissiveIntensity: 0.3 }));
    L = makeLabel(256, 128, 1.6); drawLabel(L, '$$$', '', AMBER);
  } else if (type === 'gun') {
    mesh = new THREE.Group();
    mesh.add(part(GEO.box, '#ffc21a', [1.2, 1.2, 1.2], [0, 0, 0], { emissive: '#ffb000', emissiveIntensity: 0.35 }));
    mesh.add(part(GEO.box, '#2b2f3a', [0.36, 0.3, 1.3], [0, 0.75, 0]));
    mesh.add(part(GEO.box, '#2b2f3a', [0.3, 0.5, 0.3], [0, 0.55, 0.3]));
    L = makeLabel(256, 128, 1.8); drawLabel(L, 'GUN', '', '#1f2937');
  } else if (type === 'power' || type === 'wreck') {
    // Everything that gives power looks the same: a glowing green lightning bolt with a ground ring.
    mesh = makeBolt();
    L = makeLabel(256, 128, 1.6); drawLabel(L, type === 'wreck' ? '+' + opts.value : '+POWER', '', GREEN);
  } else if (type === 'gadget') {
    const G = GADGET[opts.gadget];
    mesh = new THREE.Group();
    mesh.add(part(GEO.box, G.color, [1.0, 1.0, 1.0], [0, 0, 0], { emissive: G.color, emissiveIntensity: 0.6 }));
    mesh.add(part(GEO.box, '#ffffff', [1.05, 0.15, 1.05], [0, 0, 0]));
    mesh.add(part(GEO.box, '#ffffff', [0.15, 1.05, 1.05], [0, 0, 0]));
    L = makeLabel(256, 128, 2.2); drawLabel(L, G.name.toUpperCase(), 'GADGET', '#6d28d9');
  }
  mesh.position.set(x, opts.y ?? 0.9, z);
  mesh.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(mesh);
  if (L) { L.spr.position.set(x, 2.2, z); scene.add(L.spr); }
  const p = { type, gadget: opts.gadget, value: opts.value, x, z, y: mesh.position.y, vz: opts.vz || 0, vy: opts.vy || 0, mesh, L, got: false };
  pickups.push(p);
  return p;
}
let boltGeo = null;
function makeBolt() {
  if (!boltGeo) {
    const sh = new THREE.Shape([[0.12, 0.95], [-0.4, 0.02], [-0.02, 0.02], [-0.2, -0.95], [0.42, 0.14], [0.04, 0.14], [0.32, 0.95]].map(([x, y]) => new THREE.Vector2(x, y)));
    boltGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.22, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 2 });
    boltGeo.center();
  }
  const g = new THREE.Group();
  const b = new THREE.Mesh(boltGeo, mat('#86efac', { emissive: '#22c55e', emissiveIntensity: 1.2, flatShading: false, roughness: 0.3 }));
  b.scale.setScalar(1.15); b.castShadow = true; g.add(b);
  const ring = new THREE.Mesh(GEO.ring, new THREE.MeshBasicMaterial({ color: '#4ade80', transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = -0.85; ring.scale.setScalar(1.1); g.add(ring);
  const glow = new THREE.Mesh(GEO.disc, new THREE.MeshBasicMaterial({ color: '#22c55e', transparent: true, opacity: 0.3, depthWrite: false }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = -0.86; glow.scale.setScalar(1.1); g.add(glow);
  return g;
}
function removePickup(p) { scene.remove(p.mesh); if (p.L) { scene.remove(p.L.spr); disposeLabel(p.L); } }
function spawnDrop(x, z) {
  const r = Math.random();
  const opts = { y: 1.2, vy: 8, vz: -(run.speed + rand(9, 13)) };
  if (r < 0.35) addPickup('bundle', x, z, opts);
  else if (r < 0.6) addPickup('power', x, z, opts);
  else addPickup('gadget', x, z, { ...opts, gadget: pick(['guard', 'emp', 'drone', 'magnet', 'gold', 'hammer', 'guard', 'autopilot']) });
}

// ======================================================================
// REWARDS / GADGETS
// ======================================================================
function gainPower(n) {
  run.power += n; run.topPower = Math.max(run.topPower, run.power);
  popup('+' + n, GREEN);
  restartAnim($('powerChip'), 'bump');
}
function addCash(n) { run.cash += Math.round(n * (run.fx.gold > 0 ? 2 : 1)); }
function addBarrel() {
  if (run.barrels === 0) { save.gun = true; persist(); }
  run.barrels = Math.min(4, run.barrels + 1);
  setPlayerCar(run.car.id, run.weaponIds, run.barrels);
  popup('GUN +1', BLUE);
}
function applyReward(r) {
  if (r.startsWith('g:')) return activate(r.slice(2));
  if (r === 'gun') addBarrel();
  else if (r === 'rate') { run.rateMul *= 1.25; popup('RATE UP', BLUE); }
  else if (r === 'cash') { const c = 20 + run.level * 6; addCash(c); popup('$' + c, AMBER); }
  else if (r === 'power') gainPower(Math.round(run.power * 0.2) + 3);
  sfx.pickup();
}
function activate(id) {
  const G = GADGET[id], F = run.fx;
  switch (id) {
    case 'guard': F.guard = 15; break;
    case 'nitro': F.nitro = 4; player.targetOZ = -6; break;
    case 'autopilot': F.autopilot = run.length * 0.2; F.autopilotMax = F.autopilot; sfx.autopilot(true); break;
    case 'emp': doEmp(); break;
    case 'drone': F.drone = 20; break;
    case 'magnet': F.magnet = 20; break;
    case 'gold': F.gold = 20; break;
    case 'hammer': run.hammer++; break;
    case 'repair': run.repair = true; break;
  }
  run.found[id] = (run.found[id] || 0) + 1;
  if (id !== 'autopilot') flash(G.name.toUpperCase() + '!', G.color, 1);
  sfx.gadget();
  renderGadgetBar(true);
}
function useOwnedGadget(id) {
  if (state !== 'play' || !run || run.over) return;
  const F = run.fx;
  const busy = { guard: F.guard, nitro: F.nitro, autopilot: F.autopilot, drone: F.drone, magnet: F.magnet, gold: F.gold }[id];
  if ((save.gadgets[id] || 0) <= 0 || busy > 0) { sfx.deny(); return; }
  save.gadgets[id]--; persist();
  run.found[id] = (run.found[id] || 0) - 1;
  activate(id);
}
function doEmp() {
  const pz = playerZ();
  ringFx(player.x, pz, 40, '#22d3ee', 0.7);
  for (const e of enemies) {
    if (e.dead || e.obstacle || e.z > pz + 4 || e.z < pz - 60) continue;
    if (e.kind === 'boss') { e.power = Math.max(1, e.power * 0.8); continue; }
    e.power *= 0.6; e.stun = 2; e.hitT = 0.1;
    if (e.power < 1) killEnemy(e, 'shot');
  }
  shake = Math.max(shake, 0.2);
}
function swingHammer() {
  const h = new THREE.Group();
  h.add(part(GEO.box, '#8b5a2b', [0.25, 2.2, 0.25], [0, 1.1, 0]));
  h.add(part(GEO.box, GADGET.hammer.color, [1.4, 0.8, 0.8], [0, 2.3, 0], { emissive: GADGET.hammer.color, emissiveIntensity: 0.4 }));
  h.position.set(player.x, 1, playerZ() - 1); scene.add(h);
  let t = 0;
  fx.push({ m: h, update(dt) { t += dt; h.position.set(player.x, 1, playerZ() - 1.5); h.rotation.x = -Math.min(1, t / 0.15) * 1.6; return t < 0.4; } });
  sfx.smash(); shake = Math.max(shake, 0.5);
}

// ======================================================================
// FX
// ======================================================================
function burst(pos, color, size, dur = 0.4) {
  const m = new THREE.Mesh(GEO.ico1, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, depthWrite: false }));
  m.position.copy(pos); m.scale.setScalar(0.1); scene.add(m);
  fx.push({ m, t: 0, update(dt) { this.t += dt; const k = this.t / dur; m.scale.setScalar(Math.max(0.01, size * Math.min(1, k / 0.3))); m.material.opacity = 0.85 * (1 - k); return k < 1; }, dispose() { m.material.dispose(); } });
}
function ringFx(x, z, radius, color, dur) {
  const m = new THREE.Mesh(GEO.ring, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.3, z); scene.add(m);
  let t = 0;
  fx.push({ m, update(dt) { t += dt; const k = t / dur; m.scale.setScalar(0.5 + radius * k); m.position.z = run ? playerZ() : z; m.position.x = player.x; m.material.opacity = 0.8 * (1 - k); return k < 1; }, dispose() { m.material.dispose(); } });
}
function sparks(x, y, z, color, n) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(GEO.box, basic(color)); m.scale.setScalar(0.08); m.position.set(x, y, z); scene.add(m);
    const v = new THREE.Vector3(rand(-4, 4), rand(2, 5), rand(0, 5)); let t = 0;
    fx.push({ m, update(dt) { t += dt; v.y -= 15 * dt; m.position.addScaledVector(v, dt); return t < 0.3; }, dispose() { m.material.dispose(); } });
  }
}
function scrap(pos, color, n, home) {
  for (let i = 0; i < n; i++) {
    const s = rand(0.15, 0.32);
    const m = new THREE.Mesh(GEO.box, mat(Math.random() < 0.3 ? '#2b2f3a' : color));
    m.scale.set(s, s * 0.6, s); m.position.copy(pos); m.position.y += 0.6; m.castShadow = true; scene.add(m);
    const v = new THREE.Vector3(rand(-6, 6), rand(4, 9), rand(-7, 2));
    const spin = new THREE.Vector3(rand(-10, 10), rand(-10, 10), rand(-10, 10));
    let t = 0;
    fx.push({ m, update(dt) {
      t += dt;
      if (home && run && t > 0.3) {
        const target = new THREE.Vector3(player.x, 1.2, playerZ());
        m.position.lerp(target, Math.min(1, dt * 9));
        m.scale.multiplyScalar(1 - dt * 2.2);
        return m.position.distanceTo(target) > 0.6 && t < 1.6;
      }
      v.y -= 22 * dt; m.position.addScaledVector(v, dt);
      if (m.position.y < 0.1) { m.position.y = 0.1; v.y *= -0.3; v.x *= 0.6; v.z *= 0.6; }
      m.rotation.x += spin.x * dt; m.rotation.y += spin.y * dt;
      if (!home && t > 1.2) m.scale.multiplyScalar(1 - dt * 4);
      return t < 1.6;
    } });
  }
}
function explosion(pos, scale = 1) {
  burst(pos.clone().add(new THREE.Vector3(0, 0.8, 0)), '#fff1a8', 1.4 * scale, 0.25);
  burst(pos.clone().add(new THREE.Vector3(0, 0.9, 0)), '#ffd23f', 1.8 * scale, 0.35);
  burst(pos.clone().add(new THREE.Vector3(rand(-.4, .4), 1.1, 0)), '#ff6a00', 2.3 * scale, 0.5);
  burst(pos.clone().add(new THREE.Vector3(0, 1.7, 0)), '#6b7280', 2.6 * scale, 0.9);
}
function smoke(x, y, z, color = '#d1d5db', size = 0.35) {
  const m = new THREE.Mesh(GEO.ico, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false }));
  m.position.set(x, y, z); m.scale.setScalar(size); scene.add(m);
  let t = 0;
  fx.push({ m, update(dt) { t += dt; m.scale.setScalar(size * (1 + t * 3)); m.material.opacity = 0.6 * (1 - t / 0.5); m.position.y += dt; return t < 0.5; }, dispose() { m.material.dispose(); } });
}
function popup(text, bg = GREEN) {
  if (!run) return;
  const L = makeLabel(256, 128, 1.7); drawLabel(L, text, '', bg);
  L.spr.position.set(player.x + 1.6, 2.2, playerZ());
  scene.add(L.spr);
  popups.push({ L, t: 0, side: popups.length % 2 ? -1 : 1 });
}

// ======================================================================
// WEAPONS
// ======================================================================
function nearestAhead(x, z, maxRange, inLine) {
  let best = null, bd = Infinity;
  for (const e of enemies) {
    if (e.dead || e.kind === 'mine') continue;
    const dz = z - e.z;
    if (dz < 0 || dz > maxRange) continue;
    if (inLine && Math.abs(e.x - x) > e.w / 2 + 0.4) continue;
    const s = dz + Math.abs(e.x - x) * 3;
    if (s < bd) { bd = s; best = e; }
  }
  return best;
}
function spawnProjectile(kind, x, y, z, vx, vz, dmg, extra = {}) {
  let mesh;
  if (kind === 'bullet') { mesh = new THREE.Mesh(GEO.box, mat(extra.color || '#fff3a0', { emissive: extra.color || '#ffd23f', emissiveIntensity: 1.2 })); mesh.scale.set(0.13, 0.13, 0.75); if (extra.size) { mesh.geometry = GEO.sphere; mesh.scale.setScalar(extra.size / 2); } }
  else if (kind === 'missile') {
    mesh = new THREE.Group();
    mesh.add(part(GEO.box, '#e5e7eb', [0.18, 0.18, 0.7], [0, 0, 0]));
    mesh.add(part(GEO.box, '#ff3b4d', [0.2, 0.2, 0.2], [0, 0, -0.38]));
  } else if (kind === 'rocket' || kind === 'shell') {
    mesh = new THREE.Group();
    mesh.add(part(GEO.box, kind === 'shell' ? '#3a3f2a' : '#556b2f', [0.32, 0.32, 0.9], [0, 0, 0]));
    mesh.add(part(GEO.cone6, '#ffd23f', [0.2, 0.4, 0.2], [0, 0, -0.6], { emissive: '#ffb000', emissiveIntensity: 0.8 }));
    mesh.children[1].rotation.x = -Math.PI / 2;
  } else if (kind === 'drone') { mesh = new THREE.Mesh(GEO.box, mat('#d9f99d', { emissive: '#a3e635', emissiveIntensity: 1.2 })); mesh.scale.set(0.1, 0.1, 0.6); }
  mesh.position.set(x, y, z);
  scene.add(mesh);
  projectiles.push({ kind, mesh, x, y, z, vx, vz, dmg, cash: extra.cash || 0, pierce: extra.pierce || 0, hitSet: null, traveled: 0, range: extra.range || 50, splash: extra.splash || 0, target: extra.target || null, trailT: 0 });
}
function explodeAt(x, z, r, dmg) {
  explosion(new THREE.Vector3(x, 0, z), r / 2.6);
  sfx.boom();
  for (const e of enemies) {
    if (e.dead) continue;
    const d = Math.max(Math.abs(e.x - x) - e.w / 2, 0) + Math.max(Math.abs(e.z - z) - e.l / 2, 0);
    if (d < r) damageEnemy(e, dmg, 'splash');
  }
  shake = Math.max(shake, 0.15 * r / 2);
}

function equippedWeapons() {
  const n = 1 + save.parts.slots;
  const list = save.equipped.filter(id => WEAPON[id] && weaponOwned(id)).slice(0, n);
  return list.length ? list : ['twin'];
}
// Each equipped weapon runs on its own timer from its own slot.
function updateWeapons(dt) {
  if (run.over) return;
  const pz = playerZ(), s = player.scale;
  const dmul = dmgMulOf(save.parts.damage) * Math.max(1, Math.pow(run.power / 30, 0.6)) / (0.6 + 0.4 * player.slots.length), rmul = rateMulOf(save.parts.rate) * run.rateMul;
  const ex = player.model.extra;
  if (ex.lb) { const blink = Math.floor(run.t * 6) % 2; ex.lb.material = mat('#2e7cf6', { emissive: '#2e7cf6', emissiveIntensity: blink ? 2 : 0.3 }); ex.lr.material = mat('#ff3b4d', { emissive: '#ff3b4d', emissiveIntensity: blink ? 0.3 : 2 }); }
  if (run.barrels > 0) player.slots.forEach((slot, si) => {
    const W = wEff(slot.id), st = run.ws[si];
    const ox = slot.pos[0] * s, oy = slot.pos[1] * s + 0.1, oz = slot.pos[2] * s - 0.6 * s;
    const n = run.barrels, offs = i => (i - (n - 1) / 2) * 0.24 * s;
    const x0 = player.x + ox, z0 = pz + oz;
    switch (W.kind) {
      case 'laser': {
        const prev = st.charge;
        st.charge = Math.min(1, st.charge + dt * rmul / W.charge);
        if (prev < 0.05 && st.charge >= 0.05) sfx.laserCharge();
        if (st.charge >= 1 && nearestAhead(x0, pz, W.range, true)) {
          for (let i = 0; i < n; i++) fireLaser(x0 + offs(i), oy, z0, W.range, W.dmg * dmul, W.color);
          st.charge = 0; sfx.laser();
        }
        break;
      }
      case 'bullet': case 'missile': case 'rocket': {
        st.cd -= dt;
        if (st.cd > 0) break;
        st.cd = 1 / (W.rate * rmul);
        for (let i = 0; i < n; i++) {
          const x = x0 + offs(i);
          if (W.kind === 'bullet') for (let k = 0; k < (W.pellets || 1); k++) spawnProjectile('bullet', x, oy, z0, (W.spread ? rand(-W.spread, W.spread) : 0) * W.speed, -W.speed - run.speed, W.dmg * dmul, { range: W.range, color: W.color, cash: W.cashHit, size: W.size, pierce: W.pierce });
          else if (W.kind === 'missile') for (let k = 0; k < (W.salvo || 1); k++) spawnProjectile('missile', x + (k - ((W.salvo || 1) - 1) / 2) * 0.25, oy, z0, rand(-3, 3) + (k ? 3 : -3) * ((W.salvo || 1) > 1), -W.speed - run.speed, W.dmg * dmul, { range: W.range, splash: W.splash, target: nearestAhead(x, pz, W.range, false) });
          else spawnProjectile('rocket', x, oy, z0, 0, -W.speed - run.speed, W.dmg * dmul, { range: W.range, splash: W.splash });
        }
        burst(new THREE.Vector3(x0, oy, z0 - 0.4), '#fff3a0', W.kind === 'rocket' ? 0.9 : 0.35, 0.08);
        if (W.kind === 'bullet') (W.id === 'minigun' ? sfx.mg : sfx.shot)();
        else if (W.kind === 'missile') sfx.missile(); else sfx.rocket();
        break;
      }
      case 'siren': {
        st.cd -= dt;
        if (st.cd > 0) break;
        st.cd = W.every / rateMulOf(save.parts.rate);
        const radius = W.radius * (1 + 0.15 * (n - 1));
        ringFx(player.x, pz, radius, W.color || (Math.floor(run.t * 6) % 2 ? '#2e7cf6' : '#ff3b4d'), 0.45);
        for (const e of enemies) if (!e.dead && Math.hypot(e.x - player.x, e.z - pz) < radius + e.l / 2) { damageEnemy(e, W.dmg * dmul * n * lvlScaleSoft(), 'siren'); if (W.stun && e.kind !== 'boss') e.stun = Math.max(e.stun, W.stun); if (e.z < pz && e.kind !== 'boss') e.z -= 2.5; }
        sfx.siren();
        break;
      }
      case 'water': {
        const nx = slot.builtIn ? player.x : x0, ny = slot.builtIn ? 2.1 * s : oy + 0.2, nzz = slot.builtIn ? pz - 1.4 * s : z0;
        const t = nearestAhead(nx, pz, W.range, true);
        st.acc += dt;
        if (st.acc > 0.028) {
          st.acc = 0;
          const tz = t ? t.z + t.l / 2 : pz - W.range;
          const wc = W.color || '#7dd3fc'; const m = new THREE.Mesh(GEO.ico, mat(wc, { emissive: wc, emissiveIntensity: W.color ? 1 : 0.6 })); m.scale.setScalar(rand(0.16, 0.3));
          m.position.set(nx + rand(-0.1, 0.1), ny, nzz); scene.add(m);
          const speed = 40, life = Math.max(0.05, (nzz - tz) / speed); let tt = 0; const vx = (t ? t.x - nx : 0) / life;
          const vy0 = 4, g = 2 * (vy0 * life - (ny - 1.0)) / (life * life);
          let vy = vy0;
          fx.push({ m, update(d) { tt += d; m.position.z -= speed * d; m.position.x += vx * d; vy -= g * d; m.position.y = Math.max(0.4, m.position.y + vy * d); return tt < life; } });
          if (t) sparks(t.x, 1.2, tz, '#bae6fd', 1);
        }
        if (t) { if (W.stun && t.kind !== 'boss') t.stun = Math.max(t.stun, W.stun); damageEnemy(t, W.dps * dmul * n * dt * lvlScaleSoft(), 'water'); if (t.kind !== 'boss') t.z -= W.push * dt; sfx.water(); }
        break;
      }
      case 'cannon': {
        const tgt = nearestAhead(x0, pz, W.range, false);
        const tur = slot.builtIn ? ex.turret : null;
        if (tur) tur.rotation.y += ((tgt ? Math.atan2(-(tgt.x - player.x), -(tgt.z - pz)) : 0) - tur.rotation.y) * Math.min(1, dt * 8);
        st.cd -= dt;
        if (st.cd <= 0 && tgt) {
          st.cd = W.every / rateMulOf(save.parts.rate);
          const sx = slot.builtIn ? player.x : x0, sy = slot.builtIn ? 1.7 * s : oy, sz = slot.builtIn ? pz - 1.5 * s : z0;
          const life = (sz - tgt.z) / (W.speed + run.speed);
          for (let i = 0; i < n; i++) spawnProjectile('shell', sx + offs(i), sy, sz, (tgt.x - sx) / Math.max(life, 0.1), -W.speed - run.speed, W.dmg * dmul * lvlScaleSoft(), { range: W.range, splash: W.splash });
          burst(new THREE.Vector3(sx, sy, sz - 1.5 * s), '#ffb000', 1.3, 0.12);
          if (tur) tur.position.z = 0.6;
          shake = Math.max(shake, 0.12); sfx.rocket();
        }
        if (tur) tur.position.z += (0.3 - tur.position.z) * Math.min(1, dt * 6);
        break;
      }
    }
  });
  // drone
  if (run.fx.drone > 0) {
    drone.visible = true;
    drone.position.set(player.x + 1.9, 3.2 + Math.sin(run.t * 5) * 0.2, pz + 0.5);
    drone.rotation.y = Math.sin(run.t * 2) * 0.2;
    run.dropT -= dt;
    if (run.dropT <= 0) {
      const t = nearestAhead(drone.position.x, pz, 40, false);
      if (t) {
        run.dropT = 0.17;
        const dz = drone.position.z - t.z, life = dz / (60 + run.speed);
        spawnProjectile('drone', drone.position.x, drone.position.y, drone.position.z - 0.4, (t.x - drone.position.x) / Math.max(life, 0.05), -60 - run.speed, 1.6 * dmul * lvlScaleSoft(), { range: 45 });
        sfx.shot();
      }
    }
  } else drone.visible = false;
}
const lvlScaleSoft = () => (1 + 0.08 * (run.level - 1)) * Math.max(1, Math.pow(run.power / 30, 0.6)); // guns grow with your power
function fireLaser(x, y, z, range, dmg, color = '#ff4d8d') {
  const beam = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
  beam.scale.set(0.35, 0.35, range); beam.position.set(x, y, z - range / 2); scene.add(beam);
  const core = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 1, depthWrite: false }));
  core.scale.set(0.12, 0.12, range); core.position.copy(beam.position); scene.add(core);
  let t = 0;
  fx.push({ m: beam, update(dt) { t += dt; beam.material.opacity = 0.9 * (1 - t / 0.22); beam.scale.x = beam.scale.y = 0.35 * (1 + t * 3); return t < 0.22; }, dispose() { beam.material.dispose(); } });
  fx.push({ m: core, update(dt) { core.material.opacity = Math.max(0, 1 - t / 0.15); return t < 0.22; }, dispose() { core.material.dispose(); } });
  for (const e of enemies) if (!e.dead && e.z < z && z - e.z < range && Math.abs(e.x - x) < e.w / 2 + 0.3) { damageEnemy(e, dmg, 'laser'); sparks(e.x, 1.2, e.z + e.l / 2, '#ff9cc4', 4); }
  shake = Math.max(shake, 0.1);
}

function updateProjectiles(dt) {
  for (const p of projectiles) {
    const prevZ = p.z;
    if (p.kind === 'missile') {
      if (!p.target || p.target.dead) p.target = nearestAhead(p.x, p.z, 50, false);
      if (p.target) { const want = clamp((p.target.x - p.x) * 5, -16, 16); p.vx += (want - p.vx) * Math.min(1, dt * 7); }
    }
    p.x += p.vx * dt; p.z += p.vz * dt; p.traveled += Math.abs(p.vz) * dt;
    p.mesh.position.set(p.x, p.y, p.z);
    p.mesh.rotation.y = Math.atan2(p.vx, p.vz);
    if (p.kind !== 'bullet' && p.kind !== 'drone') { p.trailT -= dt; if (p.trailT <= 0) { p.trailT = 0.035; smoke(p.x, p.y, p.z + 0.5, p.kind === 'shell' ? '#9ca3af' : '#e5e7eb', 0.2); } }
    if (p.traveled > p.range) { p.dead = true; if (p.splash) explodeAt(p.x, p.z, p.splash, p.dmg * 0.6); continue; }
    for (const e of enemies) {
      if (e.dead) continue;
      if (Math.abs(p.x - e.x) < e.w * 0.5 + 0.15 && p.z <= e.z + e.l * 0.5 && prevZ >= e.z - e.l * 0.5) {
        if (p.hitSet && p.hitSet.has(e)) continue;
        if (p.pierce > 0) { p.pierce--; (p.hitSet = p.hitSet || new Set()).add(e); } else p.dead = true;
        if (p.splash) { damageEnemy(e, p.dmg * 0.4, 'bullet'); explodeAt(p.x, e.z + e.l / 2, p.splash, p.dmg * 0.6); }
        else { if (p.cash) addCash(p.cash); damageEnemy(e, p.dmg, 'bullet'); burst(new THREE.Vector3(p.x, 1.2, e.z + e.l * 0.5), '#fff3a0', 0.45, 0.12); sfx.hit(); }
        if (p.dead) break;
      }
    }
  }
  for (let i = projectiles.length - 1; i >= 0; i--) if (projectiles[i].dead) { scene.remove(projectiles[i].mesh); projectiles.splice(i, 1); }
}

// ======================================================================
// BOSS
// ======================================================================
function spawnBoss() {
  const B = BOSSES[(run.level - 1) % BOSSES.length];
  const p = Math.round(run.power * Math.min(3, 2 + 0.15 * (run.level - 1)));
  const color = B.id === 'tankboss' ? '#7a8b4a' : B.id === 'monster' ? '#7c3aed' : '#c1121f';
  const e = addEnemy('boss', 0, -run.dist - 55, p, 0, { variant: B.id, color });
  Object.assign(e, { gap: 55, bt: 0, phase: 'cruise', timer: 2.6, warn: null });
  run.boss = e;
  sfx.horn();
  sfx.setSong('boss', 57);
  flash('BOSS!', '#ff3b4d', 1.3);
  showHint(`<span class="r">${B.name}</span> ${B.hint}. Shoot it to <span class="g">GREEN</span>, then ram it!`, 4);
}
function updateBoss(e, dt) {
  const anchor = -run.dist;
  const weak = canRam(e);
  e.bt += dt;
  if (!weak && e.bt > 28) e.power = Math.max(1, e.power - e.max * 0.04 * dt); // long fights wear the boss down
  const V = e.variant;
  let gapTarget = weak ? 2 : 16;
  if (V === 'armored') {
    e.x = Math.sin(e.bt * (weak ? 0.6 : 0.9)) * (weak ? 2.6 : 4.4);
    e.timer -= dt;
    if (!weak && e.timer <= 0) { e.timer = rand(0.7, 1.2); addEnemy('mine', e.x + rand(-0.6, 0.6), e.z + 3.6, 3 + run.level, run.speed - 9); }
    e.gap += (gapTarget - e.gap) * Math.min(1, dt * (weak ? 0.9 : 1.2));
  } else if (V === 'monster') {
    e.timer -= dt;
    if (weak) { e.phase = 'cruise'; clearWarn(e); }
    if (e.phase === 'cruise') {
      e.x += (Math.sin(e.bt * 0.8) * 3.8 - e.x) * Math.min(1, dt * 2);
      e.gap += (gapTarget - e.gap) * Math.min(1, dt * 1.2);
      if (!weak && e.timer <= 0) {
        e.phase = 'warn'; e.timer = 1.0; e.lane = LANES.reduce((a, b) => Math.abs(b - player.x) < Math.abs(a - player.x) ? b : a);
        e.warn = new THREE.Mesh(GEO.box, new THREE.MeshBasicMaterial({ color: '#ff3b4d', transparent: true, opacity: 0.35, depthWrite: false }));
        e.warn.scale.set(2.6, 0.02, 30); scene.add(e.warn); sfx.warn();
      }
    } else if (e.phase === 'warn') {
      e.x += (e.lane - e.x) * Math.min(1, dt * 5);
      e.warn.position.set(e.lane, 0.05, anchor - 4);
      e.warn.material.opacity = 0.2 + 0.25 * (Math.floor(e.bt * 10) % 2);
      if (e.timer <= 0) { e.phase = 'charge'; clearWarn(e); }
    } else if (e.phase === 'charge') {
      e.gap -= 30 * dt;
      if (e.gap < -12) { e.phase = 'return'; }
    } else if (e.phase === 'return') {
      e.gap += 18 * dt;
      if (e.gap >= 16) { e.phase = 'cruise'; e.timer = rand(1.4, 2.2); }
    }
  } else if (V === 'tankboss') {
    e.x = Math.sin(e.bt * 0.7) * 3.8;
    e.gap += (gapTarget - e.gap) * Math.min(1, dt * 1.2);
    const tur = e.extra.turret;
    if (tur) tur.rotation.y = Math.atan2(-(player.x - e.x), (playerZ() - e.z)) + Math.PI;
    e.timer -= dt;
    if (!weak && e.timer <= 0) {
      e.timer = rand(1.1, 1.6);
      const tx = clamp(player.x + rand(-0.5, 0.5), -3.5, 3.5), tz = playerZ() - run.speed * 1.1;
      const ring = addHazard('rockfall', tx, tz); ring.shell = true; ring.armed = true; ring.t = 0; ring.from = new THREE.Vector3(e.x, 3, e.z);
      burst(new THREE.Vector3(e.x, 3, e.z + 3), '#ffb000', 1.2, 0.15); sfx.rocket();
    }
  }
  e.z = anchor - e.gap - player.l * player.scale * 0.5;
}
function clearWarn(e) { if (e.warn) { scene.remove(e.warn); e.warn.material.dispose(); e.warn = null; } }

function winLevel() {
  if (run.over) return;
  run.over = true;
  if (run.boss) clearWarn(run.boss);
  run.cash += 80 + run.level * 40;
  sfx.win();
  flash('BOSS DOWN!', '#22c55e', 1.6);
  setTimeout(() => showResult(true), 1800);
}
function loseLevel() {
  if (run.over) return;
  run.over = true;
  if (run.boss) clearWarn(run.boss);
  const pos = new THREE.Vector3(player.x, 0, playerZ());
  explosion(pos, 1.4); scrap(pos, run.car.color, 14, false);
  player.group.visible = false; drone.visible = false;
  sfx.boom();
  flash('WRECKED', '#ff3b4d', 1.6);
  setTimeout(() => showResult(false), 1800);
}

// ======================================================================
// AUTOPILOT AI: chase what it can eat, sidestep what it can't
// ======================================================================
function autopilotSteer() {
  const pz = playerZ();
  const ahead = enemies.filter(e => !e.dead && e.z < pz + 2 && e.z > pz - 34);
  const threats = ahead.filter(e => !canRam(e));
  for (const h of hazards) if ((h.type === 'oil' || (h.type === 'rockfall' && h.armed)) && h.z < pz + 2 && h.z > pz - 25) threats.push({ x: h.x, z: h.z, w: 2.4 });
  for (const b of ebullets) threats.push({ x: b.x, z: b.z, w: 1 });
  const food = ahead.filter(e => canRam(e) && e.kind !== 'boss');
  for (const p of pickups) if (p.type === 'wreck' && !p.got && p.z < pz + 1 && p.z > pz - 34) food.push({ x: p.x, z: p.z, w: 1.6 });
  food.sort((a, b) => b.z - a.z);
  apTarget = food[0] || null;
  const blocked = x => threats.some(t => Math.abs(t.x - x) < (t.w || 2) / 2 + player.w * player.scale / 2 + 0.3 && t.z > pz - 24);
  let want = food.length ? food[0].x : player.x;
  if (blocked(want)) {
    const cands = [...LANES, player.x].filter(x => !blocked(x)).sort((a, b) => Math.abs(a - want) - Math.abs(b - want));
    if (cands.length) want = cands[0];
  }
  player.targetX = want;
  player.targetOZ = food.length && !blocked(want) ? -4.5 : 0;
}

// ======================================================================
// MAIN UPDATE
// ======================================================================
const keys = {};
addEventListener('keydown', e => { keys[e.key] = true; });
addEventListener('keyup', e => { keys[e.key] = false; });

function updatePlay(dt) {
  const r = run, F = r.fx, P = save.parts;
  r.t += dt;
  for (const k of ['guard', 'nitro', 'magnet', 'gold', 'drone', 'boost', 'slide']) if (F[k] > 0) F[k] = Math.max(0, F[k] - dt);

  // --- movement: drag in 4 directions; motor = handling, wheels = speed
  const motor = P.motor, steer = 7 + motor * 1.4;
  if (keys.ArrowLeft || keys.a) player.targetX -= (9 + motor) * dt;
  if (keys.ArrowRight || keys.d) player.targetX += (9 + motor) * dt;
  if (keys.ArrowUp || keys.w) player.targetOZ -= (9 + motor) * dt;
  if (keys.ArrowDown || keys.s) player.targetOZ += (9 + motor) * dt;
  if (F.autopilot > 0 && !r.over) autopilotSteer();
  if (F.slide > 0) { player.targetX += r.slideDir * 7 * dt; player.spin += dt * 14 * r.slideDir; } else player.spin *= 1 - Math.min(1, dt * 10);
  const lim = ROAD_HALF - 0.45 - player.w * player.scale / 2;
  const ozMin = -(6 + motor * 0.4), ozMax = OZ_BACK + motor * 0.2;
  if (F.nitro > 0) player.targetOZ = Math.min(player.targetOZ, -5);
  player.targetX = clamp(player.targetX, -lim, lim);
  player.targetOZ = clamp(player.targetOZ, ozMin, ozMax);
  const prevX = player.x;
  player.x += (player.targetX - player.x) * Math.min(1, dt * steer);
  player.oz += (player.targetOZ - player.oz) * Math.min(1, dt * steer * 0.6);
  const mult = F.nitro > 0 ? 1.7 : F.boost > 0 ? 1.45 : 1;
  if (!r.over) {
    const step = r.speed * mult * dt;
    r.dist += step;
    if (F.autopilot > 0) { F.autopilot = Math.max(0, F.autopilot - step); if (F.autopilot === 0) { flash('YOU DRIVE!', '#c4b5fd', 1.1); sfx.autopilot(false); apTarget = null; player.targetOZ = 0; } }
  }
  const pz = playerZ();
  updateAutopilotFx(F.autopilot > 0 && !r.over, pz);
  sfx.engineSet(clamp((mult - 1) * 1.5 + 0.4 - player.oz * 0.06, 0, 1.4));
  const baseScale = { tank: 0.82, fire: 0.88, garbage: 0.86, monster: 0.86, ambulance: 0.92, icecream: 0.92 }[r.car.id] || 1;
  player.scale += (baseScale * clamp(0.9 + 0.2 * Math.log2(Math.max(1, r.power) / 20), 0.9, 1.3) - player.scale) * Math.min(1, dt * 4);
  player.group.position.set(player.x, 0, pz);
  player.group.scale.setScalar(player.scale);
  player.body.rotation.y = clamp(-(player.x - prevX) / Math.max(dt, 0.001) * 0.03, -0.35, 0.35) + player.spin;
  player.body.rotation.z = clamp((player.x - prevX) / Math.max(dt, 0.001) * 0.01, -0.08, 0.08);
  if (player.model) for (const w of player.model.wl) w.rotation.x -= r.speed * mult * dt * 2.5;
  player.label.spr.visible = true;
  drawLabel(player.label, String(r.power), 'POWER', BLUE);
  bubble.visible = F.guard > 0; if (bubble.visible) bubble.material.opacity = 0.16 + 0.08 * Math.sin(r.t * 10);
  if (r.invuln > 0) { r.invuln -= dt; player.body.visible = F.guard > 0 || Math.floor(r.invuln * 12) % 2 === 0; } else player.body.visible = true;
  if (r.hearts === 1 && !r.over && Math.random() < dt * 12) smoke(player.x + rand(-0.4, 0.4), 1.2 * player.scale, pz - 1, '#4b5563', 0.3);
  if ((F.nitro > 0 || F.boost > 0) && Math.random() < dt * 30) smoke(player.x + rand(-0.6, 0.6), 0.4, pz + player.l * player.scale / 2, F.nitro > 0 ? '#fb923c' : '#4ade80', 0.25);

  recycleChunks(-r.dist);

  // --- spawn
  while (r.evIdx < r.events.length && r.events[r.evIdx].d <= r.dist + 75) spawnEvent(r.events[r.evIdx++]);
  if (r.level === 1 && r.dist > 300 && r.barrels === 0) addBarrel();
  if (!r.boss && r.dist >= r.length) spawnBoss();

  // --- enemies
  const pw = player.w * player.scale * 0.5, pl = player.l * player.scale * 0.5;
  // Cars and obstacles are solid to each other: faster cars queue behind slower ones instead of driving through.
  const front = enemies.filter(e => !e.dead && e.kind !== 'boss').sort((a, b) => a.z - b.z);
  for (const a of front) {
    if (a.speed <= 0 || a.y > 1 || a.stun > 0) continue;
    for (const b of front) {
      if (b === a || b.dead || b.z >= a.z || b.y > 1) continue;
      const gap = (a.l + b.l) / 2 + 0.4;
      if (Math.abs(a.x - b.x) < (a.w + b.w) / 2 - 0.1 && a.z - b.z < gap) a.z = b.z + gap;
    }
  }
  for (const e of enemies) {
    if (e.dead) continue;
    if (e.stun > 0) e.stun -= dt;
    if (e.kind === 'boss') updateBoss(e, dt);
    else if (e.stun <= 0) {
      e.z -= e.speed * dt;
      if (e.kind === 'biker') e.x = clamp(e.baseX + Math.sin(r.t * 1.6 + e.wob) * 1.6, -6.4, 6.4);
      else if (e.kind === 'car' && e.speed > 0) e.group.rotation.y = Math.sin((e.wob += dt) * 2) * 0.03;
      else if (e.kind === 'gunner') {
        const dz = pz - e.z;
        if (e.extra.turret) e.extra.turret.rotation.y = 0;
        e.fireT -= dt;
        if (e.fireT < 0.3 && !e.warned && dz > 8 && dz < 38) { e.warned = true; burst(new THREE.Vector3(e.x, 1.6, e.z + 1.3), '#ff3b4d', 0.7, 0.3); }
        if (e.fireT <= 0) e.warned = false;
        if (e.fireT <= 0 && dz > 8 && dz < 38 && !r.over) { e.fireT = 1.0; enemyShot(e); }
      } else if (e.kind === 'kamikaze' && e.extra.beacon) e.extra.beacon.visible = Math.floor(r.t * 8) % 2 === 0;
    }
    if (e.wl) for (const w of e.wl) w.rotation.x -= (e.kind === 'boss' ? r.speed : Math.max(e.speed, 0)) * dt * 2;
    if (e.extra.top) e.extra.top.rotation.y += dt * 2;
    if (e.extra.shield) e.extra.shield.material.emissiveIntensity += (0.9 - e.extra.shield.material.emissiveIntensity) * Math.min(1, dt * 8);
    if (e.y > 0) { e.y = Math.max(0, e.y - dt * 40); if (e.y === 0) { shake = Math.max(shake, 0.3); sfx.boom(); scrap(new THREE.Vector3(e.x, 0, e.z), '#a08c76', 6, false); } }
    e.group.position.set(e.x, e.y, e.z);
    e.group.scale.setScalar(e.hitT > 0 ? 1 + e.hitT * 1.3 : 1);
    if (e.hitT > 0) e.hitT -= dt;
    if (e.stun > 0) e.group.rotation.y = Math.sin(r.t * 30) * 0.08;
    updateEnemyLabel(e);

    if (!r.over && e.y < 1 && Math.abs(e.x - player.x) < pw + e.w * 0.5 - 0.1 && Math.abs(e.z - pz) < pl + e.l * 0.5 - 0.1) {
      if (canRam(e)) killEnemy(e, 'ram');
      else hurtPlayer(e);
    }
    if (e.z > -r.dist + 16 || e.z < -r.dist - 260) e.dead = true;
  }
  for (let i = enemies.length - 1; i >= 0; i--) if (enemies[i].dead) { removeEnemy(enemies[i]); enemies.splice(i, 1); }

  updateWeapons(dt);
  updateProjectiles(dt);

  // --- enemy bullets
  for (const b of ebullets) {
    b.x += b.vx * dt; b.z += b.vz * dt; b.mesh.position.set(b.x, 1.2, b.z);
    if (!r.over && Math.abs(b.x - player.x) < pw + 0.25 && Math.abs(b.z - pz) < pl + 0.25) { b.dead = true; hurtPlayer(null); }
    if (b.z > -r.dist + 14) b.dead = true;
  }
  for (let i = ebullets.length - 1; i >= 0; i--) if (ebullets[i].dead) { scene.remove(ebullets[i].mesh); ebullets.splice(i, 1); }

  // --- hazards
  for (const h of hazards) {
    const dx = Math.abs(h.x - player.x), dz = Math.abs(h.z - pz);
    if (h.type === 'oil' && !h.used && dx < 1.3 + pw * 0.6 && dz < 1.2 + pl * 0.5 && F.nitro <= 0 && F.autopilot <= 0) {
      h.used = true; F.slide = 1.1 * (1 - 0.06 * P.wheels); r.slideDir = Math.random() < 0.5 ? -1 : 1; sfx.hurt(); flash('SLIP!', '#a78bfa', 0.7);
    } else if (h.type === 'boost' && !h.used && dx < 1.2 + pw * 0.5 && dz < 1.8 + pl * 0.5) {
      h.used = true; F.boost = 2.2; sfx.gadget(); flash('BOOST!', '#4ade80', 0.7);
    } else if (h.type === 'rockfall') {
      if (!h.armed && h.z - pz > -26 && h.z < pz + 2) { h.armed = true; h.t = 0; sfx.warn(); }
      if (h.armed) {
        h.t += dt;
        h.mesh.material.opacity = 0.35 + 0.35 * (Math.floor(h.t * 10) % 2);
        h.mesh.scale.setScalar(1.3 + h.t * 0.3);
        if (h.shell && h.from) {
          if (!h.ball) { h.ball = part(GEO.sphere, '#2f3326', [0.35, 0.35, 0.35], [h.from.x, h.from.y, h.from.z]); scene.add(h.ball); }
          const k = Math.min(1, h.t / 1.0);
          h.ball.position.set(h.from.x + (h.x - h.from.x) * k, h.from.y + 6 * Math.sin(Math.PI * k), h.from.z + (h.z - h.from.z) * k);
        }
        if (h.t >= (h.shell ? 1.0 : 0.9) && !h.used) {
          h.used = true;
          if (h.ball) { scene.remove(h.ball); h.ball = null; }
          if (h.shell) {
            explosion(new THREE.Vector3(h.x, 0, h.z), 1.1); sfx.boom(); shake = Math.max(shake, 0.3);
            if (Math.abs(h.x - player.x) < 1.8 + pw && Math.abs(h.z - pz) < 1.8 + pl) hurtPlayer(null);
          } else {
            const rock = addEnemy('rock', h.x, h.z, 0, 0); rock.y = 14;
            if (Math.abs(h.x - player.x) < 0.9 + pw && Math.abs(h.z - pz) < 0.9 + pl) setTimeout(() => { if (run && !rock.dead) hurtPlayer(rock); }, 330);
          }
          h.mesh.visible = false;
        }
      }
    }
    if (h.type === 'boost') h.mesh.children.forEach((c, i) => { if (i) c.material = mat('#4ade80', { emissive: '#22c55e', emissiveIntensity: Math.floor(r.t * 6 + i) % 3 === 0 ? 1.6 : 0.6 }); });
    if (h.z > -r.dist + 16) h.dead = true;
  }
  for (let i = hazards.length - 1; i >= 0; i--) if (hazards[i].dead) { const h = hazards[i]; scene.remove(h.mesh); if (h.ball) scene.remove(h.ball); hazards.splice(i, 1); }

  // --- gates: decided by which side of the centre post you are on as you cross
  for (const g of gates) {
    if (!g.used && pz - pl <= g.z) {
      g.used = true;
      const side = Math.abs(player.x) < 0.35 ? (player.targetX < 0 ? 0 : 1) : (player.x < 0 ? 0 : 1);
      const o = g.opts[side];
      o.apply(); sfx.gate(o.good);
      g.panels[side].material.opacity = 0.9;
      burst(new THREE.Vector3(side ? ROAD_HALF / 2 : -ROAD_HALF / 2, 1.5, g.z), o.good ? '#7cc4ff' : '#ff6b7a', 2.4, 0.3);
      if (!o.gadget) flash(o.text + ' ' + o.sub, o.good ? '#7cc4ff' : '#ff6b7a', 0.9);
    }
    if (g.used) { for (const p of g.panels) p.material.opacity = Math.max(0, p.material.opacity - dt * 1.5); }
  }
  for (let i = gates.length - 1; i >= 0; i--) if (gates[i].z > -r.dist + 16) { scene.remove(gates[i].group); gates[i].labels.forEach(disposeLabel); gates.splice(i, 1); }

  // --- pickups
  for (const p of pickups) {
    if (p.vz || p.vy || p.y > 0.95) {
      p.vy -= 20 * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.y <= 0.9) { p.y = 0.9; if (Math.abs(p.vy) > 3) p.vy = -p.vy * 0.35; else p.vy = 0; p.vz *= 0.5; if (Math.abs(p.vz) < 0.5) p.vz = 0; }
    }
    if (F.magnet > 0 && Math.hypot(p.x - player.x, p.z - pz) < 16) {
      const k = Math.min(1, dt * 6); p.x += (player.x - p.x) * k; p.z += (pz - p.z) * k;
    }
    p.mesh.position.set(p.x, p.y + Math.sin(r.t * 4 + p.z) * 0.12, p.z);
    p.mesh.rotation.y += dt * 3;
    if ((p.type === 'wreck' || p.type === 'power') && !p.vy && Math.hypot(p.x - player.x, p.z - pz) < 3.2) { const k = Math.min(1, dt * 8); p.x += (player.x - p.x) * k; p.z += (pz - p.z) * k; }
    if (p.L) p.L.spr.position.set(p.x, p.y + 1.4, p.z);
    if (!p.got && Math.abs(p.x - player.x) < pw + 0.7 && Math.abs(p.z - pz) < pl + 0.7) {
      p.got = true;
      if (p.type === 'cash') { addCash(3 + r.level); sfx.coin(); }
      else if (p.type === 'bundle') { const c = 15 + r.level * 4; addCash(c); popup('$' + c, AMBER); sfx.coin(); }
      else if (p.type === 'power') { gainPower(Math.round(r.power * 0.1) + 3); sfx.pickup(); }
      else if (p.type === 'gun') { if (r.barrels === 0) { addBarrel(); sfx.pickup(); } for (const q of pickups) if (q.type === 'gun') q.got = true; }
      else if (p.type === 'gadget') activate(p.gadget);
      else if (p.type === 'wreck') { gainPower(p.value); run.smashed++; ringFx(player.x, pz, 3, '#4ade80', 0.35); sfx.pickup(); }
    }
  }
  for (let i = pickups.length - 1; i >= 0; i--) { const p = pickups[i]; if (p.got || p.z > -r.dist + 16) { removePickup(p); pickups.splice(i, 1); } }

  // --- popups drift up beside the car (never over the road ahead)
  for (let i = popups.length - 1; i >= 0; i--) {
    const p = popups[i]; p.t += dt;
    p.L.spr.position.set(player.x + 1.9 * p.side, 1.6 + p.t * 2.2, pz + 1);
    p.L.spr.material.opacity = 1 - Math.max(0, p.t - 0.5) * 2;
    if (p.t > 1) { scene.remove(p.L.spr); disposeLabel(p.L); popups.splice(i, 1); }
  }

  // --- tutorial overlay
  if (r.tutUntil > 0) {
    r.tutUntil -= dt;
    if (r.tutUntil <= 0 || (r.movedX && r.movedY && r.t > 2)) { r.tutUntil = 0; $('tut').classList.add('off'); save.tutorialDone = true; persist(); }
  }
  updateHud();
}
function enemyShot(e) {
  const m = new THREE.Mesh(GEO.sphere, mat('#ff3b4d', { emissive: '#ff1f35', emissiveIntensity: 1.5 }));
  m.scale.setScalar(0.28); scene.add(m);
  // Closing speed on the player used to be 2*speed+13; halved now. The lead uses the same closing speed.
  const closing = (2 * run.speed + 13) / 4, vz = closing - run.speed, dz = playerZ() - e.z, t = dz / closing;
  ebullets.push({ mesh: m, x: e.x, z: e.z + e.l / 2, vx: 0, vz }); // straight down its own lane: dodge by changing lane
  burst(new THREE.Vector3(e.x, 1.5, e.z + 1), '#ff6b7a', 0.5, 0.1);
  sfx.shot();
}
