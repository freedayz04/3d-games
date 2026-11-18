
// ======================================================================
// CAMERA + LOOP
// ======================================================================
const camState = { pos: new THREE.Vector3(8, 4, 8), look: new THREE.Vector3(0, 1, 0) };
let garageT = 0, showcaseZ = 0;
function updateCamera(rdt) {
  let pos, look, anchor = showcaseZ;
  if (state === 'play' && run) {
    anchor = -run.dist;
    const s = player.scale;
    pos = new THREE.Vector3(player.x * 0.4, 12.6 + s * 1.3, anchor + 14 + s);
    look = new THREE.Vector3(player.x * 0.5, 0, anchor - 11);
  } else {
    garageT += rdt;
    const a = garageT * 0.35, r = (state === 'garage' ? 7.5 : 7) + player.l * 1.1;
    pos = new THREE.Vector3(Math.sin(a) * r, state === 'garage' ? 4.6 : 4.4, showcaseZ + Math.cos(a) * r);
    look = new THREE.Vector3(0, state === 'garage' ? -2.2 : 1.6, showcaseZ);
  }
  const k = 1 - Math.exp(-6 * rdt);
  camState.pos.lerp(pos, k); camState.look.lerp(look, k);
  shake = Math.max(0, shake - rdt * 1.2);
  camera.position.copy(camState.pos);
  if (shake > 0) camera.position.add(new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(shake * 0.6));
  camera.lookAt(camState.look);
  sun.position.set(6, 16, anchor + 6); sun.target.position.set(0, 0, anchor - 12);
}

let last = performance.now();
function frame(now) {
  const rdt = Math.min(0.05, (now - last) / 1000); last = now;
  if (slowUntil && now > slowUntil) { timeScale = 1; slowUntil = 0; }
  const dt = rdt * timeScale;
  if (state === 'play' && run && !paused) updatePlay(dt);
  else {
    player.group.position.set(0, 0, showcaseZ); player.group.scale.setScalar(1.1);
    player.body.rotation.set(0, 0, 0); player.body.visible = true; player.group.visible = true; bubble.visible = false; player.label.spr.visible = false;
    if (state === 'title' && player.model) { player.body.position.y = Math.abs(Math.sin(now / 260)) * 0.06; player.body.rotation.z = Math.sin(now / 520) * 0.02; for (const w of player.model.wl) w.rotation.x -= rdt * 9; if (Math.random() < rdt * 10) dust(rand(-0.6, 0.6), player.l * 0.55, '#e7e5e4'); } else player.body.position.y = 0;
  }
  for (let i = fx.length - 1; i >= 0; i--) if (!fx[i].update(rdt)) { scene.remove(fx[i].m); fx[i].dispose && fx[i].dispose(); fx.splice(i, 1); }
  updateCamera(rdt);
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ======================================================================
// INPUT: drag anywhere in 4 directions (relative to where the finger went down)
// ======================================================================
let dragging = false, dragX0 = 0, dragY0 = 0, tx0 = 0, oz0 = 0;
canvas.addEventListener('pointerdown', e => {
  sfx.init();
  if (state !== 'play') return;
  canvas.setPointerCapture(e.pointerId);
  dragging = true; dragX0 = e.clientX; dragY0 = e.clientY; tx0 = player.targetX; oz0 = player.targetOZ;
});
canvas.addEventListener('pointermove', e => {
  if (!dragging || state !== 'play' || !run) return;
  if (run.fx.autopilot > 0) { if (Math.hypot(e.clientX - dragX0, e.clientY - dragY0) > 30) { restartAnim($('apbar'), 'nudge'); dragX0 = e.clientX; dragY0 = e.clientY; } return; }
  const r = canvas.getBoundingClientRect();
  const dx = e.clientX - dragX0, dy = e.clientY - dragY0;
  player.targetX = tx0 + dx / r.width * (21 + save.parts.motor * 0.9);
  player.targetOZ = oz0 + dy / r.height * 24;
  if (Math.abs(dx) > r.width * 0.06) run.movedX = true;
  if (Math.abs(dy) > r.height * 0.04) run.movedY = true;
});
const endDrag = () => { dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);

// ======================================================================
// HUD
// ======================================================================
function setState(s) {
  state = s;
  $('titlePanel').hidden = s !== 'title';
  $('garagePanel').hidden = s !== 'garage';
  $('resultPanel').hidden = s !== 'result';
  $('hud').hidden = s !== 'play';
  $('gadgets').hidden = s !== 'play';
  $('charge').hidden = !(s === 'play' && run && run.weaponIds.some(id => WEAPON[id].kind === 'laser'));
  if (s !== 'play') { $('apbar').hidden = true; sfx.engineStop(); sfx.setSong('menu', 57); }
  if (s !== 'play') {
    $('tut').classList.add('off'); $('hint').classList.remove('on');
    $('speedlines').classList.remove('on'); $('edge').classList.remove('on');
  }
  if (s === 'play') renderGadgetBar(true);
  if (s === 'garage') renderGarage();
  if (s === 'title') { $('tLvl').textContent = 'LV ' + save.level; $('tCash').textContent = save.cash; $('tCoin').innerHTML = icon('coin'); }
}
let hudCache = {};
function setHTML(id, html) { if (hudCache[id] !== html) { hudCache[id] = html; $(id).innerHTML = html; } }
function updateHud() {
  const r = run, F = r.fx;
  setHTML('lvl', 'LV ' + r.level);
  const prog = Math.min(1, r.dist / r.length);
  $('progFill').style.width = prog * 100 + '%';
  $('progCar').style.left = prog * 100 + '%';
  setHTML('cash', String(r.cash));
  setHTML('powerVal', String(r.power));
  let h = '';
  for (let i = 0; i < r.maxHearts; i++) h += icon('heart', i < r.hearts ? '#ff3b4d' : 'rgba(0,0,0,.3)');
  setHTML('hearts', h);
  const chips = [];
  const chip = (id, left, extra = '') => chips.push(`<span class="fx${left !== null && left < 3 ? ' blink' : ''}" style="--c:${GADGET[id].color}"><img src="${itemPic(id)}" alt="${GADGET[id].name}">${extra}</span>`);
  if (F.guard > 0) chip('guard', F.guard);
  if (F.drone > 0) chip('drone', F.drone);
  if (F.magnet > 0) chip('magnet', F.magnet);
  if (F.gold > 0) chip('gold', F.gold);
  if (r.hammer > 0) chip('hammer', null, r.hammer > 1 ? `<b>${r.hammer}</b>` : '');
  if (r.repair) chip('repair', null, `<b>${r.repairCount}/10</b>`);
  setHTML('effects', chips.join(''));
  $('speedlines').classList.toggle('on', F.nitro > 0 || F.boost > 0);
  const edge = $('edge');
  const ec = F.guard > 0 ? '#38bdf8' : F.autopilot > 0 ? '#a78bfa' : F.nitro > 0 ? '#fb923c' : null;
  edge.classList.toggle('on', !!ec); if (ec) edge.style.setProperty('--c', ec);
  const li = r.weaponIds.findIndex(id => WEAPON[id].kind === 'laser');
  if (li >= 0) {
    const c = r.ws[li].charge;
    $('chargeFill').style.width = (r.barrels ? c * 100 : 0) + '%';
    $('charge').classList.toggle('ready', c >= 1);
  }
  const ap = F.autopilot > 0 && !r.over;
  if ($('apbar').hidden === ap) $('apbar').hidden = !ap;
  if (ap) { $('apFill').style.width = (F.autopilot / (F.autopilotMax || 1) * 100) + '%'; setHTML('apText', apTarget ? 'Hunting a <b style="color:#86efac;font:inherit">GREEN</b> car &middot; ' + Math.ceil(F.autopilot) + 'm left' : 'Dodging threats &middot; ' + Math.ceil(F.autopilot) + 'm left'); }
  if (r.hintUntil && r.t > r.hintUntil) { $('hint').classList.remove('on'); r.hintUntil = 0; }
  renderGadgetBar(false);
}
let gadgetKey = '';
function renderGadgetBar(force) {
  if (!run) return;
  const F = run.fx;
  const busy = { guard: F.guard, nitro: F.nitro, autopilot: F.autopilot, drone: F.drone, magnet: F.magnet, gold: F.gold };
  const list = GADGETS.filter(g => g.active && (save.gadgets[g.id] || 0) > 0);
  const key = list.map(g => g.id + (save.gadgets[g.id]) + (busy[g.id] > 0 ? 'b' : '')).join(',');
  if (!force && key === gadgetKey) return;
  gadgetKey = key;
  const wrap = $('gadgets');
  wrap.innerHTML = '';
  for (const g of list) {
    const b = document.createElement('button');
    b.className = 'gbtn'; b.style.setProperty('--c', g.color);
    b.setAttribute('aria-label', 'Use ' + g.name);
    b.innerHTML = `<img src="${itemPic(g.id)}" alt="">` + `<b>${save.gadgets[g.id]}</b>`;
    b.disabled = busy[g.id] > 0;
    b.addEventListener('pointerdown', ev => { ev.stopPropagation(); useOwnedGadget(g.id); });
    wrap.appendChild(b);
  }
}
function showHint(html, secs) { if (!run) return; const h = $('hint'); h.innerHTML = html; h.classList.add('on'); run.hintUntil = run.t + secs; }
function flashSub(text) { showHint(`<span class="y">${text}</span>`, 1.4); }
function restartAnim(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function flash(text, color, dur) { const f = $('flash'); f.textContent = text; f.style.color = color; f.style.setProperty('--d', dur + 's'); restartAnim(f, 'go'); }

// ======================================================================
// RESULT
// ======================================================================
let lastEarned = 0, doubled = false;
function showResult(win) {
  lastEarned = run.cash; doubled = false;
  save.cash += run.cash;
  if (win) save.level++;
  persist();
  $('resTitle').textContent = win ? 'LEVEL CLEAR!' : 'WRECKED';
  $('resTitle').className = win ? 'win' : 'lose';
  $('rSmash').textContent = run.smashed;
  $('rShot').textContent = run.shot;
  $('rPower').textContent = run.topPower;
  $('rCash').textContent = '$' + run.cash;
  const db = $('doubleBtn');
  db.hidden = run.cash <= 0; db.disabled = false; db.innerHTML = '&times;2 CASH &middot; watch ad';
  showcaseZ = playerZ();
  player.group.visible = true;
  setState('result');
}
$('doubleBtn').addEventListener('click', () => {
  if (doubled) return;
  doubled = true; save.cash += lastEarned; persist(); sfx.pickup();
  $('rCash').textContent = '$' + lastEarned * 2;
  $('doubleBtn').textContent = 'Ad placeholder: cash doubled';
  $('doubleBtn').disabled = true;
});
function toGarage() {
  clearEntities(); run = null; showcaseZ = 0;
  setBiome(BIOMES[(save.level - 1) % BIOMES.length]);
  preview = save.car;
  showPreview();
  setState('garage');
}
$('garageBtn').addEventListener('click', () => { sfx.init(); sfx.click(); toGarage(); });
$('playBtn').addEventListener('click', () => {
  sfx.init(); sfx.click();
  toGarage();
});
$('raceBtn').addEventListener('click', () => { sfx.init(); sfx.click(); if (preview !== save.car && save.cars.includes(preview)) save.car = preview; persist(); newRun(); });
let resetArmed = false;
$('resetBtn').addEventListener('click', () => {
  if (!resetArmed) { resetArmed = true; $('resetBtn').textContent = 'Tap again to erase all progress'; setTimeout(() => { resetArmed = false; $('resetBtn').textContent = 'Reset progress'; }, 2500); return; }
  save = freshSave(); persist(); resetArmed = false; $('resetBtn').textContent = 'Reset progress'; $('settings').hidden = true; toGarage();
});

// ======================================================================
// GARAGE / SHOP — one screen: icon tabs, a detail strip and a 4×2 grid (no scrolling)
// ======================================================================
let tab = 'cars', preview = save.car;
const sel = { cars: null, weapons: null, parts: 'engine', gadgets: 'guard', body: null, wheels: null };
let skinPart = 'body', skinPreview = null;
const wheelPic = wid => thumb('wheel:' + wid, () => { const g = new THREE.Group(); wheels(g, 0.01, 0.01, 0.6); g.children.length = 2; applySkin(g, 'roadster', { b: 'default', w: wid }); return g; });
const TABS = [['cars', 'tabCars'], ['skins', 'tabSkins'], ['weapons', 'tabGuns'], ['parts', 'tabParts'], ['gadgets', 'tabGadgets']];
const PART_SHORT = {
  engine: lv => `START POWER <b>+${lv * 5} → +${(lv + 1) * 5}</b>`,
  crusher: lv => `Ram a car to gain <b>${pct(absorbOf(lv))} → ${pct(absorbOf(lv + 1))}</b> of its POWER`,
  damage: lv => `All weapons <b>×${dmgMulOf(lv).toFixed(2)} → ×${dmgMulOf(lv + 1).toFixed(2)}</b> damage`,
  rate: lv => `All weapons <b>×${rateMulOf(lv).toFixed(1)} → ×${rateMulOf(lv + 1).toFixed(1)}</b> fire speed`,
  motor: () => 'Steer and move faster',
  wheels: () => 'Drive faster',
  armor: lv => `Hearts <b>${3 + lv} → ${4 + lv}</b>`,
  slots: lv => `Carry <b>${lv + 1} → ${lv + 2}</b> weapons`,
};
const PART_LABEL = { engine: 'POWER', crusher: 'GAIN', damage: 'DMG', rate: 'RATE', motor: 'HANDLING', wheels: 'SPEED', armor: 'HEARTS', slots: 'SLOTS' };
function showPreview() {
  const c = CARS.find(x => x.id === preview);
  const ws = equippedWeapons();
  setPlayerCar(c.id, ws, 1, skinPreview && tab === 'skins' ? skinPreview : skinOf(c.id));
  $('scName').textContent = c.name;
  $('scSub').innerHTML = `<span class="pw"><small>POWER</small> ${c.power + save.parts.engine * 5}</span>` + ws.map(id => `<img src="${weaponPic(id)}" alt="${WEAPON[id].name}">`).join('');
}
function buyBtn(label, cls, disabled, onClick, withCoin) {
  const b = document.createElement('button');
  b.className = 'buy ' + (cls || '');
  b.innerHTML = (withCoin ? icon('coin') : '') + label;
  b.disabled = !!disabled;
  b.addEventListener('click', ev => { ev.stopPropagation(); onClick(); });
  return b;
}
function spend(cost) { if (save.cash < cost) { sfx.deny(); return false; } save.cash -= cost; sfx.buy(); return true; }
const coinTag = n => `<span class="tg2">${icon('coin')}${n}</span>`;
function renderGarage() {
  $('gCash').textContent = save.cash;
  document.querySelector('.coin-slot').innerHTML = icon('coin');
  $('raceBtn').innerHTML = `<span class="tri" style="display:inline-block;vertical-align:middle;margin-right:.4em"></span>LV ${save.level}`;
  const tabs = $('tabs'); tabs.innerHTML = '';
  for (const [id, ic] of TABS) {
    const t = document.createElement('button');
    t.className = 'tab'; t.id = 'tab-' + id; t.setAttribute('role', 'tab'); t.setAttribute('aria-selected', tab === id); t.setAttribute('aria-label', id);
    t.innerHTML = icon(ic);
    t.addEventListener('click', () => { tab = id; skinPreview = null; sfx.click(); showPreview(); renderGarage(); });
    tabs.appendChild(t);
  }
  const grid = $('items'); grid.innerHTML = '';
  const count = { cars: CARS.length, weapons: WEAPONS.length, parts: PARTS.length, gadgets: GADGETS.length }[tab];
  const n = tab === 'skins' ? (skinPart === 'body' ? 11 : 5) : count;
  grid.style.gridTemplateColumns = `repeat(${n > 15 ? 7 : n > 10 ? 6 : n > 8 ? 5 : 4}, 1fr)`;
  const det = $('detail'); det.innerHTML = '';
  const eqd = equippedWeapons(), slots = 1 + save.parts.slots;
  const tile = (id, img, tag, badge, isSel, locked, onTap) => {
    const b = document.createElement('button');
    b.className = 'tile' + (isSel ? ' sel' : '') + (locked ? ' lock' : '');
    b.setAttribute('aria-label', id);
    b.innerHTML = `<img src="${img}" alt="">` + (tag || '') + (badge || '');
    b.addEventListener('click', () => { sfx.click(); onTap(); renderGarage(); });
    grid.appendChild(b);
  };
  const detail = (name, line, btns) => {
    det.innerHTML = `<div class="dtx"><div class="dn">${name}</div><div class="dl">${line}</div></div>`;
    const col = document.createElement('div'); col.className = 'acts';
    for (const b of [].concat(btns)) {
      col.appendChild(b);
      if (b.classList.contains('upgrade')) for (const ev of ['pointerenter', 'focus']) b.addEventListener(ev, () => det.classList.add('pv'));
      if (b.classList.contains('upgrade')) for (const ev of ['pointerleave', 'blur']) b.addEventListener(ev, () => det.classList.remove('pv'));
    }
    det.appendChild(col);
  };
  const check = `<span class="bd">✓</span>`;
  if (tab === 'cars') {
    if (!sel.cars) sel.cars = save.car;
    for (const c of CARS) {
      const owned = save.cars.includes(c.id);
      tile(c.id, carPic(c.id), owned ? (save.car === c.id ? `<span class="tg2 on">✓</span>` : '') : coinTag(c.price), '', sel.cars === c.id, false, () => { sel.cars = c.id; preview = c.id; showPreview(); });
    }
    const c = CARS.find(x => x.id === sel.cars), owned = save.cars.includes(c.id), eq = save.car === c.id;
    const btn = owned ? buyBtn(eq ? '✓' : 'DRIVE', eq ? 'on' : 'equip', eq, () => { save.car = c.id; persist(); showPreview(); renderGarage(); })
      : buyBtn(String(c.price), '', save.cash < c.price, () => { if (spend(c.price)) { save.cars.push(c.id); save.car = c.id; persist(); showPreview(); renderGarage(); } }, true);
    detail(c.name, `POWER <b>${c.power}</b>` + (c.special ? ` + <img src="${weaponPic(c.special)}" width="34" height="34" alt="" style="object-fit:contain"> <b>${WEAPON[c.special].name}</b>` : ''), btn);
  } else if (tab === 'skins') {
    // Skins belong to a car you own: if the showcase was previewing an unowned car, switch it back.
    if (!save.cars.includes(preview)) { preview = save.car; sel.cars = save.car; showPreview(); }
    const carId = preview, st = skinState(carId);
    const list = skinPart === 'body' ? bodySkins(carId) : WHEELS.map(w => ({ id: w[0], name: w[1], price: w[3] }));
    const key = skinPart === 'body' ? 'body' : 'wheels', ownKey = id => skinPart === 'body' ? id : 'w:' + id, cur = skinPart === 'body' ? st.b : st.w;
    if (!sel[key] || !list.find(x => x.id === sel[key])) sel[key] = cur;
    for (const k of list) {
      const owned = st.own.includes(ownKey(k.id));
      const img = skinPart === 'body' ? carPic(carId, { b: k.id, w: st.w }) : wheelPic(k.id);
      tile(k.id, img, owned ? (cur === k.id ? `<span class="tg2 on">✓</span>` : '') : coinTag(k.price), '', sel[key] === k.id, false, () => {
        sel[key] = k.id; skinPreview = skinPart === 'body' ? { b: k.id, w: st.w } : { b: st.b, w: k.id }; showPreview();
      });
    }
    const k = list.find(x => x.id === sel[key]), owned = st.own.includes(ownKey(k.id)), on = cur === k.id;
    const use = () => { if (skinPart === 'body') st.b = k.id; else st.w = k.id; skinPreview = null; persist(); showPreview(); renderGarage(); };
    const btn = owned ? buyBtn(on ? '✓' : 'USE', on ? 'on' : 'equip', on, use)
      : buyBtn(String(k.price), '', save.cash < k.price, () => { if (spend(k.price)) { st.own.push(ownKey(k.id)); use(); } }, true);
    detail(k.name, `<span class="seg"><button class="${skinPart === 'body' ? 'on' : ''}" id="segBody">BODY</button><button class="${skinPart === 'wheels' ? 'on' : ''}" id="segWheels">WHEELS</button></span>`, [btn]);
    $('segBody').onclick = () => { skinPart = 'body'; skinPreview = null; sfx.click(); showPreview(); renderGarage(); };
    $('segWheels').onclick = () => { skinPart = 'wheels'; skinPreview = null; sfx.click(); showPreview(); renderGarage(); };
  } else if (tab === 'weapons') {
    if (!sel.weapons) sel.weapons = eqd[0];
    for (const w of WEAPONS) {
      const owned = weaponOwned(w.id), i = eqd.indexOf(w.id), lv = wLevel(w.id);
      const tag = owned ? `<span class="tg2 lv">Lv ${lv}</span>` : w.car ? `<span class="tg2 lv">${icon('lock')}</span>` : coinTag(w.price);
      tile(w.id, weaponPic(w.id), tag, i >= 0 ? `<span class="bd n">${i + 1}</span>` : '', sel.weapons === w.id, !owned && !!w.car, () => { sel.weapons = w.id; });
    }
    const w = WEAPON[sel.weapons], owned = weaponOwned(w.id), on = eqd.includes(w.id), lv = wLevel(w.id), maxed = lv >= W_MAX;
    const equip = () => {
      if (on) { if (eqd.length > 1) save.equipped = eqd.filter(x => x !== w.id); }
      else { const list = eqd.slice(); if (list.length >= slots) list[list.length - 1] = w.id; else list.push(w.id); save.equipped = list; }
      persist(); showPreview(); renderGarage();
    };
    const acts = [];
    if (owned) {
      acts.push(buyBtn(on ? (eqd.length > 1 ? 'REMOVE' : '✓') : (eqd.length >= slots ? 'SWAP' : 'EQUIP'), on ? 'on' : 'equip', on && eqd.length <= 1, equip));
      const cost = wUpCost(w.id, lv);
      const up = maxed ? buyBtn('MAX', 'max', true, () => {}) : buyBtn('▲ ' + cost, 'up', save.cash < cost, () => { if (spend(cost)) { save.wlv[w.id] = lv + 1; persist(); renderGarage(); } });
      up.classList.add('upgrade'); acts.push(up);
    } else if (w.car) acts.push(buyBtn(`<img src="${carPic(w.car)}" width="44" height="30" alt="" style="object-fit:contain">`, 'max', true, () => {}));
    else acts.push(buyBtn(String(w.price), '', save.cash < w.price, () => { if (spend(w.price)) { save.weapons.push(w.id); persist(); equip(); } }, true));
    // 10-segment bars: base stat ×2 plus one segment per 2 levels; the next upgrade's gain blinks
    // 15-segment bars: base stat (1–5) + one segment per upgrade level; the next level's gain blinks
    const up = stat => W_UPS[w.id].includes(stat);
    const bar = (lbl, stat, base, c) => {
      const now = base + (up(stat) ? lv : 0), nx = up(stat) && owned && !maxed ? now + 1 : now;
      return `<span>${lbl}</span><span style="--c:${c}">${Array.from({ length: 15 }, (_, k) => `<i class="${k < now ? 'on' : k < nx ? 'nx' : ''}"></i>`).join('')}</span>`;
    };
    detail(w.name + ` <small class="dsm">${owned ? 'Lv ' + lv + '/' + W_MAX + ' · ' : ''}${eqd.length}/${slots} slots</small>`,
      `<div class="bars wide">${bar('DMG', 'dmg', w.stats[0], '#ff6b7a')}${bar('RATE', 'rate', w.stats[1], '#ffc21a')}${bar('RANGE', 'range', w.stats[2], '#7cc4ff')}</div>`, acts);
  } else if (tab === 'parts') {
    for (const p of PARTS) {
      const lv = save.parts[p.id], maxed = lv >= p.max;
      tile(p.id, itemPic(p.id), `<span class="tg2 lv">${maxed ? 'MAX' : 'Lv ' + lv}</span>`, '', sel.parts === p.id, false, () => { sel.parts = p.id; });
    }
    const p = PARTS.find(x => x.id === sel.parts), lv = save.parts[p.id], maxed = lv >= p.max, cost = partCost(p, lv);
    const btn = maxed ? buyBtn('MAX', 'max', true, () => {}) : buyBtn('▲ ' + cost, 'up', save.cash < cost, () => { if (spend(cost)) { save.parts[p.id]++; persist(); showPreview(); renderGarage(); } });
    btn.classList.add('upgrade');
    const meter = `<div class="bars wide one"><span>${PART_LABEL[p.id]}</span><span style="--c:#2bd96b">${Array.from({ length: p.max }, (_, k) => `<i class="${k < lv ? 'on' : (!maxed && k === lv ? 'nx' : '')}"></i>`).join('')}</span></div>`;
    detail(`${p.name} <small class="dsm">Lv ${lv}/${p.max}</small>`, (maxed ? '' : PART_SHORT[p.id](lv)) + meter, [btn]);
  } else {
    for (const g of GADGETS) {
      const have = save.gadgets[g.id] || 0;
      tile(g.id, itemPic(g.id), `<span class="tg2 lv">${have}/${MAX_GADGET}</span>`, '', sel.gadgets === g.id, false, () => { sel.gadgets = g.id; });
    }
    const g = GADGET[sel.gadgets], have = save.gadgets[g.id] || 0, full = have >= MAX_GADGET;
    const btn = full ? buyBtn('MAX', 'max', true, () => {}) : buyBtn(String(g.price), '', save.cash < g.price, () => { if (spend(g.price)) { save.gadgets[g.id] = have + 1; persist(); renderGarage(); } }, true);
    detail(`${g.name} <small style="font:600 calc(var(--u)*2.6)/1 var(--body);color:var(--muted)">${have}/${MAX_GADGET}</small>`, g.desc, btn);
  }
}

// ======================================================================
// BOOT
// ======================================================================
$('coinIco').innerHTML = icon('coin');
$('bossIco').innerHTML = icon('skull');
$('tutIco').innerHTML = icon('dpad');
setBiome(BIOMES[(save.level - 1) % BIOMES.length]);
setPlayerCar(save.car, equippedWeapons(), 1);
renderToggles();
drawLabel(player.label, String(CARS.find(c => c.id === save.car).power), 'POWER', BLUE);
if (document.fonts && document.fonts.load) document.fonts.load('64px "Russo One"').then(() => { player.label.key = ''; }).catch(() => {});
setState('title');
requestAnimationFrame(frame);

// ---------- music / sound toggles + autopilot takeover ----------
function renderToggles() {
  document.querySelectorAll('.tg-music').forEach(b => { b.innerHTML = icon('music', save.settings.music); b.setAttribute('aria-pressed', save.settings.music); });
  document.querySelectorAll('.tg-sfx').forEach(b => { b.innerHTML = icon('sound', save.settings.sfx); b.setAttribute('aria-pressed', save.settings.sfx); });
}
document.querySelectorAll('.tg-music').forEach(b => b.addEventListener('click', () => { sfx.init(); save.settings.music = !save.settings.music; sfx.setMusic(save.settings.music); persist(); renderToggles(); }));
document.querySelectorAll('.tg-sfx').forEach(b => b.addEventListener('click', () => { sfx.init(); save.settings.sfx = !save.settings.sfx; sfx.setSfx(save.settings.sfx); persist(); renderToggles(); sfx.click(); }));
$('apWheel').innerHTML = icon('autopilot');
$('setBtn').innerHTML = icon('gear'); $('homeBtn').innerHTML = icon('home'); $('closeSet').innerHTML = icon('close');
let paused = false;
function openMenu() {
  sfx.init(); sfx.click(); renderToggles();
  const inGame = state === 'play' || state === 'garage';
  $('resumeBtn').hidden = !inGame; $('menuHome').hidden = !inGame; $('resetBtn').hidden = state === 'play';
  $('menuTitle').textContent = state === 'play' ? 'Paused' : 'Settings';
  if (state === 'play') { paused = true; sfx.engineStop(); }
  $('settings').hidden = false;
}
function closeMenu() { $('settings').hidden = true; if (paused) { paused = false; last = performance.now(); sfx.engineStart(); } }
$('setBtn').addEventListener('click', openMenu);
$('pauseBtn').addEventListener('pointerdown', e => { e.stopPropagation(); openMenu(); });
$('gPause').addEventListener('click', openMenu);
$('resumeBtn').addEventListener('click', () => { sfx.click(); closeMenu(); });
$('menuHome').addEventListener('click', () => { sfx.click(); $('settings').hidden = true; paused = false; if (run) { clearEntities(); run = null; } setState('title'); });
$('pauseBtn').innerHTML = icon('pause'); $('gPause').innerHTML = icon('pause');
$('closeSet').addEventListener('click', () => { sfx.click(); closeMenu(); });
$('homeBtn').addEventListener('click', () => { sfx.click(); setState('title'); });
$('iSmash').innerHTML = icon('crusher'); $('iShot').innerHTML = icon('target'); $('iPower').innerHTML = icon('bolt'); $('iCash').innerHTML = icon('coin');
$('apStop').addEventListener('pointerdown', ev => {
  ev.stopPropagation();
  if (!run || run.fx.autopilot <= 0) return;
  run.fx.autopilot = 0; apTarget = null; player.targetOZ = 0;
  flash('YOU DRIVE!', '#c4b5fd', 1.1); sfx.autopilot(false);
});
document.addEventListener('pointerdown', () => sfx.init(), { once: true });
