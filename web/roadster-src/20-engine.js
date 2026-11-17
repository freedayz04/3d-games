
// ======================================================================
// SAVE (per viewer, optional)
// ======================================================================
const SAVE_KEY = 'roadster_save_v2';
const freshSave = () => ({
  cash: 0, level: 1, gun: false, tutorialDone: false,
  car: 'roadster', cars: ['roadster'], weapon: 'twin', weapons: ['twin'],
  parts: { engine: 0, crusher: 0, damage: 0, rate: 0, motor: 0, wheels: 0, armor: 0, slots: 0 },
  wlv: {}, gadgets: { guard: 1, emp: 1 }, equipped: ['twin'], settings: { music: true, sfx: true },
});
let save = freshSave();
try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY));
  if (s) {
    const f = freshSave();
    save = { ...f, ...s, parts: { ...f.parts, ...(s.parts || {}) }, gadgets: { ...(s.gadgets || {}) }, settings: { ...f.settings, ...(s.settings || {}) } };
    if (!Array.isArray(save.equipped) || !save.equipped.length) save.equipped = [s.weapon || 'twin'];
  }
} catch {}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch {} }

// ======================================================================
// RENDERER / SCENE
// ======================================================================
const $ = id => document.getElementById(id);
const stageEl = $('stage'), canvas = $('game');
let renderer;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true }); }
catch (e) { stageEl.innerHTML = '<div class="err">This game needs WebGL, which this browser has turned off.</div>'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#9ad8ff');
scene.fog = new THREE.Fog('#9ad8ff', 55, 130);
const camera = new THREE.PerspectiveCamera(55, 9 / 16, 0.1, 220);
const hemi = new THREE.HemisphereLight('#eaf6ff', '#6f9a4e', 1.6);
scene.add(hemi);
const sun = new THREE.DirectionalLight('#fff1dc', 2.4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 28, bottom: -28, near: 1, far: 70 });
sun.shadow.bias = -0.0006;
scene.add(sun, sun.target);

function resize() {
  const availW = innerWidth - 32, availH = innerHeight - 20;
  let w = Math.min(availW, availH * 0.62), h = Math.min(availH, w * 2.17);
  if (h < w * 1.4) w = h / 1.4;
  stageEl.style.width = w + 'px'; stageEl.style.height = h + 'px';
  stageEl.style.setProperty('--u', (w / 100) + 'px');
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = w / h < 0.5 ? 62 : 56; camera.updateProjectionMatrix();
}
addEventListener('resize', resize); resize();

const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.05, flatShading: true, ...opts }));
  return matCache.get(key);
}
// Unit box with chamfered/rounded edges: gives vehicles and items soft, toy-like volume.
function roundedUnitBox(r = 0.14) {
  const g = new THREE.BoxGeometry(1, 1, 1, 3, 3, 3), p = g.attributes.position, v = new THREE.Vector3(), c = new THREE.Vector3();
  const inner = 0.5 - r;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    for (const k of ['x', 'y', 'z']) if (Math.abs(v[k]) < 0.4) v[k] = Math.sign(v[k]) * inner;
    c.set(THREE.MathUtils.clamp(v.x, -inner, inner), THREE.MathUtils.clamp(v.y, -inner, inner), THREE.MathUtils.clamp(v.z, -inner, inner));
    v.sub(c).normalize().multiplyScalar(r).add(c);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  rbox: roundedUnitBox(),
  wheel: new THREE.CylinderGeometry(1, 1, 1, 20),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cone6: new THREE.ConeGeometry(1, 1, 6),
  ico: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  sphere: new THREE.SphereGeometry(1, 16, 12),
  ring: new THREE.RingGeometry(0.86, 1, 40),
  disc: new THREE.CircleGeometry(1, 28),
  torus: new THREE.TorusGeometry(1, 0.28, 10, 28),
  halfTorus: new THREE.TorusGeometry(1, 0.32, 10, 20, Math.PI),
};
function part(geo, color, s, p, opts) {
  const m = new THREE.Mesh(geo, mat(color, (geo === GEO.rbox || geo === GEO.wheel || geo === GEO.sphere) ? { flatShading: false, ...opts } : opts));
  m.scale.set(...s); m.position.set(...p); m.castShadow = true; m.receiveShadow = true;
  return m;
}
const shade = (c, l) => '#' + new THREE.Color(c).offsetHSL(0, 0, l).getHexString();
const rand = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function basic(color, opacity = 1) {
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
}

// ======================================================================
// NUMBER LABELS (canvas sprites)
// ======================================================================
const GREEN = '#22c55e', RED = '#ef3b4d', BLUE = '#2e7cf6', AMBER = '#f59e0b', SLATE = '#334155';
function makeLabel(w = 256, h = 128, worldW = 2.4) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true, toneMapped: false }));
  spr.renderOrder = 20; spr.scale.set(worldW, worldW * h / w, 1);
  return { spr, c, ctx: c.getContext('2d'), tex, key: '' };
}
function drawLabel(L, big, small, bg, ring) {
  const key = big + '|' + small + '|' + bg + '|' + (ring || '');
  if (L.key === key) return;
  L.key = key;
  const { ctx, c } = L, w = c.width, h = c.height;
  ctx.clearRect(0, 0, w, h);
  const pad = 8, r = 26;
  ctx.fillStyle = 'rgba(0,0,0,.3)'; rr(ctx, pad, pad + 6, w - pad * 2, h - pad * 2 - 6, r); ctx.fill();
  ctx.fillStyle = bg; rr(ctx, pad, pad, w - pad * 2, h - pad * 2 - 6, r); ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = ring || 'rgba(255,255,255,.9)'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowOffsetY = 3;
  const font = s => `${Math.round(h * s)}px "Russo One", "Arial Black", sans-serif`;
  if (small) {
    ctx.font = font(0.2); ctx.fillText(small, w / 2, h * 0.27);
    ctx.font = font(0.42); fitText(ctx, big, w - 40, h * 0.42); ctx.fillText(big, w / 2, h * 0.6);
  } else {
    ctx.font = font(0.5); fitText(ctx, big, w - 40, h * 0.5); ctx.fillText(big, w / 2, h * 0.47);
  }
  ctx.shadowColor = 'transparent';
  L.tex.needsUpdate = true;
}
function fitText(ctx, text, maxW, size) {
  const m = ctx.measureText(text).width;
  if (m > maxW) ctx.font = `${Math.floor(size * maxW / m)}px "Russo One", "Arial Black", sans-serif`;
}
function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function disposeLabel(L) { L.tex.dispose(); L.spr.material.dispose(); }

// ======================================================================
// AUDIO: procedural music sequencer + layered SFX, through one compressor.
// Music sits on its own quiet bus and ducks under big hits.
// ======================================================================
const MUSIC_VOL = 0.3;
const sfx = (() => {
  let ac = null, noise = null, master, sfxBus, musicBus, engine = null;
  const last = {};
  // ---------- setup ----------
  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch { return; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(ac.destination);
    master = ac.createGain(); master.gain.value = 0.9; master.connect(comp);
    sfxBus = ac.createGain(); sfxBus.gain.value = save.settings.sfx ? 0.7 : 0; sfxBus.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = save.settings.music ? MUSIC_VOL : 0; musicBus.connect(master);
    noise = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(schedule, 25);
  }
  const on = () => !!ac && save.settings.sfx;
  const gate = (k, ms) => { const n = performance.now(); if (last[k] && n - last[k] < ms) return false; last[k] = n; return true; };
  function env(g, t, peak, a, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
  function nz(t, { f = 1000, type = 'lowpass', q = 0.7, vol = 0.3, a = 0.005, dur = 0.2, f2, bus = sfxBus }) {
    const s = ac.createBufferSource(), fl = ac.createBiquadFilter(), g = ac.createGain();
    s.buffer = noise; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, t);
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, vol, a, dur); s.connect(fl).connect(g).connect(bus);
    s.start(t, Math.random() * 1.5); s.stop(t + dur + 0.05);
  }
  function osc(t, { f = 440, f2, type = 'sine', vol = 0.2, a = 0.005, dur = 0.2, lp, bus = sfxBus, detune = 0 }) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); o.detune.value = detune;
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, vol, a, dur);
    if (lp) { const fl = ac.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = lp; o.connect(fl).connect(g); } else o.connect(g);
    g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function duck(amount = 0.45, hold = 0.25) {
    if (!ac || !save.settings.music) return;
    const t = ac.currentTime, g = musicBus.gain;
    g.cancelScheduledValues(t); g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * amount, t + 0.02);
    g.linearRampToValueAtTime(MUSIC_VOL, t + hold + 0.3);
  }

  // ---------- music ----------
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const SONGS = {
    menu: { bpm: 100, prog: [[0, 'maj'], [9, 'min'], [5, 'maj'], [7, 'maj']], drums: 'chill', arp: 'pluck' },
    race: { bpm: 128, prog: [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj']], drums: 'drive', arp: 'run' },
    boss: { bpm: 140, prog: [[0, 'min'], [8, 'maj'], [3, 'maj'], [10, 'maj']], drums: 'boss', arp: 'run' },
  };
  let song = SONGS.menu, pending = null, key = 57, pendingKey = 57, step = 0, nextT = 0;
  function setSong(name, k = 57) { pending = SONGS[name]; pendingKey = k; }
  function chordNotes(root, q) { return q === 'maj' ? [root, root + 4, root + 7] : [root, root + 3, root + 7]; }
  function kick(t) { osc(t, { f: 150, f2: 42, vol: 0.55, dur: 0.22, bus: musicBus }); }
  function snare(t) { nz(t, { f: 1800, type: 'bandpass', q: 0.8, vol: 0.2, dur: 0.15, bus: musicBus }); osc(t, { f: 210, f2: 160, type: 'triangle', vol: 0.08, dur: 0.08, bus: musicBus }); }
  function clap(t) { for (const o of [0, 0.012, 0.024]) nz(t + o, { f: 1400, type: 'bandpass', q: 1.2, vol: 0.12, dur: 0.08, bus: musicBus }); }
  function hat(t, open) { nz(t, { f: 8000, type: 'highpass', vol: open ? 0.05 : 0.035, dur: open ? 0.12 : 0.03, bus: musicBus }); }
  function bass(t, m, dur) { osc(t, { f: mtof(m), type: 'sawtooth', vol: 0.11, dur, lp: 520, bus: musicBus }); osc(t, { f: mtof(m - 12), type: 'sine', vol: 0.1, dur, bus: musicBus }); }
  function pluck(t, m, vol = 0.045) { osc(t, { f: mtof(m), type: 'triangle', vol, dur: 0.22, bus: musicBus }); }
  function arp(t, m) { osc(t, { f: mtof(m), type: 'square', vol: 0.022, dur: 0.11, lp: 2400, bus: musicBus }); }
  function pad(t, notes, dur) { for (const m of notes) for (const dt of [-7, 7]) osc(t, { f: mtof(m), type: 'sawtooth', vol: 0.012, a: 0.25, dur, lp: 900, detune: dt, bus: musicBus }); }
  function playStep(i, t) {
    const S = song, s16 = i % 16, bar = Math.floor(i / 16) % S.prog.length, beat = 60 / S.bpm / 4;
    const [r, q] = S.prog[bar];
    const root = key + r, ch = chordNotes(root, q);
    if (S.drums === 'chill') {
      if (s16 === 0 || s16 === 10) kick(t);
      if (s16 === 4 || s16 === 12) clap(t);
      if (s16 % 2 === 0) hat(t, s16 % 4 === 2);
      if (s16 === 0) pad(t, ch.map(n => n), beat * 16);
      if ([0, 3, 6, 8, 11, 14].includes(s16)) pluck(t, ch[[0, 3, 6, 8, 11, 14].indexOf(s16) % 3] + 12);
      if (s16 === 0 || s16 === 8) bass(t, root - 12, beat * 6);
    } else {
      if (s16 % 4 === 0) kick(t);
      if (S.drums === 'boss' && (s16 === 14 || s16 === 7)) kick(t);
      if (s16 === 4 || s16 === 12) snare(t);
      if (s16 % 2 === 1) hat(t, s16 % 4 === 3); else if (S.drums === 'boss') hat(t, false);
      if (s16 === 0) pad(t, ch, beat * 16);
      if ([0, 2, 3, 6, 8, 10, 11, 14].includes(s16)) bass(t, root - 12 + (s16 === 11 ? 12 : 0), beat * 0.9);
      arp(t, ch[s16 % 3] + 12 + (s16 >= 8 ? 12 : 0));
    }
  }
  function schedule() {
    if (!ac || ac.state !== 'running') return;
    if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
    while (nextT < ac.currentTime + 0.12) {
      if (step % 16 === 0 && pending) { song = pending; key = pendingKey; pending = null; step = 0; }
      if (save.settings.music) playStep(step, nextT);
      nextT += 60 / song.bpm / 4; step++;
    }
  }

  // ---------- engine hum ----------
  function engineStart() {
    if (!ac || engine) return;
    const o1 = ac.createOscillator(), o2 = ac.createOscillator(), fl = ac.createBiquadFilter(), g = ac.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o1.frequency.value = 48; o2.frequency.value = 48.7;
    fl.type = 'lowpass'; fl.frequency.value = 240; g.gain.value = 0;
    o1.connect(fl); o2.connect(fl); fl.connect(g).connect(sfxBus); o1.start(); o2.start();
    g.gain.linearRampToValueAtTime(0.035, ac.currentTime + 0.5);
    engine = { o1, o2, fl, g };
  }
  function engineSet(k) { if (!engine) return; const t = ac.currentTime; engine.o1.frequency.setTargetAtTime(44 + k * 26, t, 0.1); engine.o2.frequency.setTargetAtTime(44.6 + k * 26, t, 0.1); engine.fl.frequency.setTargetAtTime(200 + k * 260, t, 0.1); }
  function engineStop() { if (!engine) return; const e = engine; engine = null; e.g.gain.linearRampToValueAtTime(0, ac.currentTime + 0.3); setTimeout(() => { e.o1.stop(); e.o2.stop(); }, 400); }

  const T = () => ac.currentTime;
  return {
    init, setSong, duck, engineStart, engineSet, engineStop,
    setMusic(v) { if (musicBus) musicBus.gain.setTargetAtTime(v ? MUSIC_VOL : 0, ac.currentTime, 0.05); },
    setSfx(v) { if (sfxBus) sfxBus.gain.setTargetAtTime(v ? 0.7 : 0, ac.currentTime, 0.05); },
    shot() { if (on() && gate('shot', 65)) { nz(T(), { f: 1200, f2: 400, vol: 0.05, dur: 0.05 }); } },
    mg() { if (on() && gate('shot', 50)) nz(T(), { f: 900 + Math.random() * 300, vol: 0.05, dur: 0.04 }); },
    missile() { if (on() && gate('missile', 80)) { nz(T(), { f: 600, f2: 2500, type: 'bandpass', vol: 0.12, dur: 0.35 }); } },
    laserCharge() { if (on() && gate('lc', 900)) osc(T(), { f: 200, f2: 1600, type: 'sine', vol: 0.04, a: 0.3, dur: 1.0 }); },
    laser() { if (on()) { osc(T(), { f: 900, f2: 180, type: 'sawtooth', vol: 0.06, dur: 0.3, lp: 1800 }); } },
    rocket() { if (on()) { nz(T(), { f: 900, f2: 150, vol: 0.35, dur: 0.35 }); osc(T(), { f: 110, f2: 50, vol: 0.12, dur: 0.3 }); } },
    water() { if (on() && gate('water', 110)) nz(T(), { f: 1400, type: 'bandpass', q: 0.5, vol: 0.05, dur: 0.14 }); },
    siren() { if (on()) { osc(T(), { f: 600, f2: 900, type: 'triangle', vol: 0.03, dur: 0.22, lp: 1500 }); osc(T() + 0.22, { f: 900, f2: 600, type: 'triangle', vol: 0.03, dur: 0.22, lp: 1500 }); nz(T(), { f: 300, vol: 0.2, dur: 0.3 }); } },
    hit() { if (on() && gate('hit', 60)) nz(T(), { f: 700, vol: 0.05, dur: 0.05 }); },
    ping() { if (on() && gate('ping', 90)) osc(T(), { f: 600, f2: 450, vol: 0.04, dur: 0.08 }); },
    smash() {
      if (!on()) return; const t = T();
      nz(t, { f: 1400, f2: 150, vol: 0.6, dur: 0.4 });
      osc(t, { f: 120, f2: 38, vol: 0.4, dur: 0.35 });

      duck(0.5, 0.2);
    },
    boom() { if (on() && gate('boom', 60)) { const t = T(); nz(t, { f: 1600, f2: 90, vol: 0.9, dur: 0.8 }); osc(t, { f: 80, f2: 30, vol: 0.5, dur: 0.6 }); duck(0.35, 0.35); } },
    hurt() { if (!on()) return; const t = T(); osc(t, { f: 140, f2: 70, vol: 0.25, dur: 0.3 }); nz(t, { f: 700, vol: 0.45, dur: 0.3 }); duck(0.4, 0.3); },
    pickup() { if (on()) [660, 880, 1320].forEach((f, i) => { osc(T() + i * 0.06, { f, vol: 0.08, dur: 0.16 }); }); },
    gadget() { if (!on()) return; nz(T(), { f: 400, f2: 4000, type: 'bandpass', q: 1, vol: 0.12, dur: 0.35 }); [523, 784, 1046, 1568].forEach((f, i) => osc(T() + 0.05 + i * 0.05, { f, type: 'triangle', vol: 0.1, dur: 0.22 })); duck(0.6, 0.3); },
    coin() { if (on() && gate('coin', 45)) { osc(T(), { f: 988, vol: 0.04, dur: 0.07 }); osc(T() + 0.05, { f: 1319, vol: 0.04, dur: 0.1 }); } },
    gate(good) { if (!on()) return; if (good) { [523, 659, 784].forEach((f, i) => osc(T() + i * 0.05, { f, type: 'triangle', vol: 0.13, dur: 0.2 })); nz(T(), { f: 2000, f2: 6000, type: 'bandpass', vol: 0.06, dur: 0.25 }); } else osc(T(), { f: 320, f2: 140, type: 'sawtooth', vol: 0.09, dur: 0.35, lp: 1500 }); },
    horn() { if (on()) { osc(T(), { f: 196, type: 'sawtooth', vol: 0.08, a: 0.02, dur: 0.5, lp: 1800 }); osc(T(), { f: 247, type: 'sawtooth', vol: 0.07, a: 0.02, dur: 0.5, lp: 1800 }); } },
    warn() { if (on() && gate('warn', 300)) { osc(T(), { f: 660, vol: 0.05, dur: 0.1 }); osc(T() + 0.13, { f: 660, vol: 0.05, dur: 0.1 }); } },
    autopilot(onOff) { if (!on()) return; const seq = onOff ? [440, 660, 880, 1320] : [1320, 880, 660]; seq.forEach((f, i) => osc(T() + i * 0.07, { f, type: 'sine', vol: 0.08, dur: 0.16 })); },
    win() { if (on()) { [523, 659, 784, 1046, 1318].forEach((f, i) => osc(T() + i * 0.09, { f, type: 'triangle', vol: 0.16, dur: 0.35 })); duck(0.2, 1.2); } },
    buy() { if (on()) { [880, 1175, 1568].forEach((f, i) => osc(T() + i * 0.05, { f, type: 'triangle', vol: 0.12, dur: 0.14 }));  } },
    click() { if (on()) osc(T(), { f: 1000, f2: 700, type: 'sine', vol: 0.06, dur: 0.05 }); },
    deny() { if (on()) osc(T(), { f: 200, f2: 150, vol: 0.06, dur: 0.14 }); },
  };
})();

// ======================================================================
// 3D THUMBNAILS: real models rendered once into images for the shop & HUD
// ======================================================================
const thumbCache = new Map();
let thumbR = null, thumbScene = null, thumbCam = null;
function thumb(key, build) {
  if (thumbCache.has(key)) return thumbCache.get(key);
  if (!thumbR) {
    try {
      thumbR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      thumbR.setSize(176, 176); thumbR.setPixelRatio(1);
      thumbR.toneMapping = THREE.ACESFilmicToneMapping; thumbR.toneMappingExposure = 1.15;
    } catch { thumbR = false; }
    thumbScene = new THREE.Scene();
    thumbScene.add(new THREE.HemisphereLight('#ffffff', '#5b6b8c', 1.9));
    const key1 = new THREE.DirectionalLight('#fff4e0', 2.4); key1.position.set(4, 6, 5); thumbScene.add(key1);
    const rim = new THREE.DirectionalLight('#9fd3ff', 1.6); rim.position.set(-5, 3, -4); thumbScene.add(rim);
    thumbCam = new THREE.PerspectiveCamera(28, 1, 0.05, 100);
  }
  if (!thumbR) return '';
  const obj = build();
  const box = new THREE.Box3().setFromObject(obj);
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  obj.position.sub(center);
  const holder = new THREE.Group(); holder.add(obj); holder.rotation.y = -0.65; thumbScene.add(holder);
  const r = size.length() / 2;
  const dist = r / Math.sin(THREE.MathUtils.degToRad(thumbCam.fov / 2)) * 1.02;
  thumbCam.position.set(0, dist * 0.42, dist * 0.91); thumbCam.lookAt(0, 0, 0);
  thumbR.render(thumbScene, thumbCam);
  const url = thumbR.domElement.toDataURL('image/png');
  thumbScene.remove(holder);
  thumbCache.set(key, url);
  return url;
}
