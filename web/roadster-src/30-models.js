
// ======================================================================
// VEHICLE MODELS (toy low-poly). Front of every vehicle faces -Z.
// ======================================================================
function wheels(g, w, l, r, color = '#25272e') {
  const list = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wh = part(GEO.wheel, color, [r, 0.32, r], [sx * w / 2, r, sz * l * 0.31]);
    wh.rotation.z = Math.PI / 2; g.add(wh); list.push(wh);
    const hub = part(GEO.cyl6, '#c3cad6', [r * 0.45, 0.34, r * 0.45], [sx * w / 2, r, sz * l * 0.31]);
    hub.rotation.z = Math.PI / 2; g.add(hub);
  }
  return list;
}
function lights(g, w, y, zf, zr) {
  for (const s of [-1, 1]) {
    g.add(part(GEO.rbox, '#fff4b0', [0.34, 0.16, 0.06], [s * w * 0.32, y, zf], { emissive: '#ffe066', emissiveIntensity: 0.8 }));
    if (zr) g.add(part(GEO.rbox, '#ff4655', [0.34, 0.14, 0.06], [s * w * 0.32, y, zr], { emissive: '#ff1f35', emissiveIntensity: 0.7 }));
  }
}
const GLASS = '#bfe6ff';
const glassOpts = { emissive: '#28465e', emissiveIntensity: 0.25, roughness: 0.15 };

// Small details that sell the toy look without clutter: mirrors, grille, plate, exhaust, door seams.
function carDetails(g, w, l, yBody, yCab, zCab, color) {
  const dark = '#2b2f3a';
  for (const s of [-1, 1]) {
    g.add(part(GEO.rbox, color, [0.12, 0.12, 0.2], [s * (w / 2 + 0.06), yCab, zCab], { flatShading: false }));
    g.add(part(GEO.box, '#bfe6ff', [0.02, 0.08, 0.14], [s * (w / 2 + 0.13), yCab, zCab]));
    g.add(part(GEO.box, dark, [0.015, 0.36, 0.02], [s * (w / 2 + 0.003), yBody, 0.15]));
    g.add(part(GEO.box, dark, [0.015, 0.03, 0.18], [s * (w / 2 + 0.003), yBody + 0.08, -0.25]));
  }
  g.add(part(GEO.rbox, '#1f2430', [w * 0.5, 0.2, 0.05], [0, yBody - 0.02, -l / 2 - 0.02]));
  for (let i = -2; i <= 2; i++) g.add(part(GEO.box, '#59616e', [0.03, 0.16, 0.06], [i * w * 0.09, yBody - 0.02, -l / 2 - 0.03]));
  g.add(part(GEO.box, '#f4f6fb', [0.42, 0.14, 0.03], [0, yBody - 0.18, l / 2 + 0.07]));
  g.add(part(GEO.box, '#1d2433', [0.3, 0.04, 0.035], [0, yBody - 0.18, l / 2 + 0.075]));
  const ex = part(GEO.wheel, '#9aa3b2', [0.06, 0.25, 0.06], [-w * 0.3, yBody - 0.3, l / 2 + 0.05], { metalness: 0.6, roughness: 0.3 }); ex.rotation.x = Math.PI / 2; g.add(ex);
}
function sedan(g, color, opts = {}) {
  g.add(part(GEO.rbox, color, [1.7, 0.5, 3.1], [0, 0.62, 0]));
  g.add(part(GEO.rbox, shade(color, -0.1), [1.74, 0.12, 3.14], [0, 0.4, 0]));
  g.add(part(GEO.rbox, shade(color, -0.08), [1.42, 0.48, 1.5], [0, 1.1, 0.25]));
  g.add(part(GEO.rbox, GLASS, [1.44, 0.36, 0.06], [0, 1.1, -0.51], glassOpts));
  g.add(part(GEO.rbox, GLASS, [1.46, 0.3, 1.2], [0, 1.08, 0.25], glassOpts));
  g.add(part(GEO.rbox, '#2b2f3a', [1.76, 0.18, 0.14], [0, 0.45, -1.56]));
  g.add(part(GEO.rbox, '#2b2f3a', [1.76, 0.18, 0.14], [0, 0.45, 1.56]));
  lights(g, 1.7, 0.7, -1.57, 1.57);
  carDetails(g, 1.7, 3.1, 0.62, 1.05, -0.35, color);
  return wheels(g, 1.76, 3.1, 0.34);
}

function buildVehicle(kind, color) {
  const g = new THREE.Group();
  let w = 1.7, l = 3.1, h = 1.4, wl = [];
  const extra = {};
  switch (kind) {
    case 'car': wl = sedan(g, color); break;
    case 'splitter': {
      w = 1.9; l = 3.6; h = 1.9;
      g.add(part(GEO.rbox, color, [1.9, 1.1, 3.6], [0, 0.95, 0]));
      g.add(part(GEO.rbox, '#ffffff', [1.92, 0.14, 3.62], [0, 0.95, 0]));
      g.add(part(GEO.rbox, GLASS, [1.7, 0.45, 0.06], [0, 1.2, -1.8], glassOpts));
      g.add(part(GEO.rbox, '#2b2f3a', [0.06, 1.1, 3.62], [0, 0.95, 0]));
      lights(g, 1.9, 0.75, -1.81, 1.81);
      wl = wheels(g, 1.95, 3.6, 0.36);
      break;
    }
    case 'truck': {
      w = 2.2; l = 5; h = 2.7;
      g.add(part(GEO.rbox, color, [2.2, 1.86, 3.3], [0, 1.52, 0.8]));
      g.add(part(GEO.rbox, '#ffffff', [2.22, 0.25, 3.32], [0, 1.3, 0.8]));
      g.add(part(GEO.rbox, shade(color, -0.18), [2.1, 1.35, 1.5], [0, 1.1, -1.6]));
      g.add(part(GEO.rbox, GLASS, [1.9, 0.5, 0.06], [0, 1.4, -2.36], glassOpts));
      g.add(part(GEO.rbox, '#2b2f3a', [2.04, 0.35, 5.04], [0, 0.45, 0]));
      lights(g, 2.1, 0.75, -2.37, 2.47);
      wl = wheels(g, 2.26, 5, 0.45);
      break;
    }
    case 'biker': {
      w = 0.8; l = 2.1; h = 1.7;
      g.add(part(GEO.rbox, color, [0.45, 0.45, 1.5], [0, 0.65, 0]));
      g.add(part(GEO.rbox, '#2b2f3a', [0.5, 0.2, 0.7], [0, 0.95, 0.25]));
      g.add(part(GEO.rbox, '#1f2937', [0.5, 0.7, 0.4], [0, 1.35, 0.15]));
      g.add(part(GEO.sphere, color, [0.26, 0.26, 0.26], [0, 1.85, 0]));
      g.add(part(GEO.rbox, '#bfe6ff', [0.3, 0.12, 0.1], [0, 1.85, -0.24], glassOpts));
      for (const z of [-0.75, 0.75]) { const wh = part(GEO.wheel, '#25272e', [0.36, 0.2, 0.36], [0, 0.36, z]); wh.rotation.z = Math.PI / 2; g.add(wh); wl.push(wh); }
      g.add(part(GEO.rbox, '#fff4b0', [0.2, 0.15, 0.06], [0, 0.8, -0.76], { emissive: '#ffe066', emissiveIntensity: 0.8 }));
      break;
    }
    case 'gunner': {
      w = 1.9; l = 3.2; h = 1.9;
      g.add(part(GEO.rbox, '#6b705c', [1.9, 0.6, 3.2], [0, 0.7, 0]));
      g.add(part(GEO.rbox, '#55593f', [1.7, 0.1, 1.6], [0, 1.25, 0.6]));
      for (const s of [-1, 1]) g.add(part(GEO.rbox, '#3a3f2a', [0.08, 0.5, 1.2], [s * 0.8, 1.3, -0.4]));
      g.add(part(GEO.rbox, GLASS, [1.6, 0.4, 0.06], [0, 1.25, -0.8], glassOpts));
      const tur = new THREE.Group(); tur.position.set(0, 1.45, 0.6);
      tur.add(part(GEO.cyl6, '#3a3f2a', [0.45, 0.35, 0.45], [0, 0, 0]));
      tur.add(part(GEO.rbox, '#25272e', [0.14, 0.14, 1.2], [0, 0.05, 0.6]));
      g.add(tur); extra.turret = tur;
      lights(g, 1.9, 0.8, -1.61, 1.61);
      wl = wheels(g, 1.98, 3.2, 0.42, '#1f2124');
      break;
    }
    case 'shield': {
      w = 1.9; l = 3.4; h = 2.1;
      g.add(part(GEO.rbox, color, [1.9, 1.3, 3.4], [0, 1.05, 0]));
      g.add(part(GEO.rbox, GLASS, [1.7, 0.45, 0.06], [0, 1.35, -1.71], glassOpts));
      lights(g, 1.9, 0.8, -1.71, 0);
      wl = wheels(g, 1.95, 3.4, 0.38);
      const sh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 0.18), new THREE.MeshStandardMaterial({ color: '#4cc9ff', emissive: '#1e90ff', emissiveIntensity: 0.9, transparent: true, opacity: 0.55, depthWrite: false }));
      sh.position.set(0, 1.15, 2.1); g.add(sh); extra.shield = sh;
      g.add(part(GEO.rbox, '#9aa3b2', [2.6, 0.12, 0.2], [0, 0.18, 2.1]));
      break;
    }
    case 'kamikaze': {
      wl = sedan(g, '#2b2f3a');
      const bomb = part(GEO.sphere, '#1f2937', [0.5, 0.5, 0.5], [0, 1.55, 0.4]); g.add(bomb);
      const beacon = part(GEO.rbox, '#ff3b4d', [0.3, 0.2, 0.3], [0, 2.1, 0.4], { emissive: '#ff1f35', emissiveIntensity: 1 });
      g.add(beacon); extra.beacon = beacon;
      g.add(part(GEO.rbox, '#ffd23f', [1.76, 0.1, 3.14], [0, 0.7, 0], { emissive: '#ffb000', emissiveIntensity: 0.3 }));
      break;
    }
    case 'boss-armored': {
      w = 3.4; l = 6.4; h = 3.2;
      g.add(part(GEO.rbox, '#3a3f4b', [3.4, 0.48, 6.4], [0, 0.6, 0]));
      g.add(part(GEO.rbox, color, [3.2, 2.0, 4.0], [0, 1.85, 1.0]));
      g.add(part(GEO.rbox, shade(color, -0.15), [3.0, 1.7, 2.0], [0, 1.5, -2.1]));
      g.add(part(GEO.rbox, '#ffcf3f', [3.25, 0.3, 4.05], [0, 2.35, 1.0]));
      for (let i = -1; i <= 1; i++) { const sp = part(GEO.cone4, '#d7dde8', [0.32, 0.9, 0.32], [i * 1.0, 0.95, -3.4]); sp.rotation.x = -Math.PI / 2; g.add(sp); }
      g.add(part(GEO.rbox, '#ff3b4d', [2.4, 0.25, 0.2], [0, 2.45, -3.12], { emissive: '#ff2030', emissiveIntensity: 0.9 }));
      wl = wheels(g, 3.5, 6.4, 0.62);
      break;
    }
    case 'boss-monster': {
      w = 3.6; l = 5.6; h = 4;
      g.add(part(GEO.rbox, color, [3.0, 1.3, 5.0], [0, 2.4, 0]));
      g.add(part(GEO.rbox, shade(color, -0.2), [2.6, 1.0, 2.2], [0, 3.5, 0.4]));
      g.add(part(GEO.rbox, GLASS, [2.4, 0.7, 0.06], [0, 3.5, -0.72], glassOpts));
      g.add(part(GEO.rbox, '#25272e', [3.2, 0.3, 0.4], [0, 1.9, -2.6]));
      for (const s of [-1, 1]) for (const sz of [-1, 1]) {
        const wh = part(GEO.wheel, '#1f2124', [1.15, 0.9, 1.15], [s * 1.75, 1.15, sz * 1.8]); wh.rotation.z = Math.PI / 2; g.add(wh); wl.push(wh);
        const hb = part(GEO.cyl6, '#ffd23f', [0.5, 0.95, 0.5], [s * 1.75, 1.15, sz * 1.8]); hb.rotation.z = Math.PI / 2; g.add(hb);
      }
      for (let i = 0; i < 4; i++) g.add(part(GEO.rbox, '#ffd23f', [0.3, 0.3, 0.3], [-1.1 + i * 0.73, 4.1, -0.7], { emissive: '#ffb000', emissiveIntensity: 0.6 }));
      break;
    }
    case 'boss-tankboss': {
      w = 3.6; l = 6.2; h = 3.2;
      for (const s of [-1, 1]) {
        g.add(part(GEO.rbox, '#2f3326', [0.9, 1.0, 6.2], [s * 1.35, 0.6, 0]));
        for (let i = 0; i < 5; i++) { const r = part(GEO.wheel, '#5b6150', [0.35, 0.95, 0.35], [s * 1.35, 0.45, -2.4 + i * 1.2]); r.rotation.z = Math.PI / 2; g.add(r); }
      }
      g.add(part(GEO.rbox, color, [2.8, 0.9, 5.6], [0, 1.4, 0]));
      const tur = new THREE.Group(); tur.position.set(0, 2.2, 0.4);
      tur.add(part(GEO.rbox, shade(color, -0.1), [2.1, 0.9, 2.4], [0, 0, 0]));
      tur.add(part(GEO.wheel, '#2f3326', [0.25, 3.6, 0.25], [0, 0.1, -2.6]));
      tur.children[1].rotation.x = Math.PI / 2;
      g.add(tur); extra.turret = tur;
      break;
    }
    case 'crate': {
      w = 1.5; l = 1.5; h = 1.6;
      g.add(part(GEO.rbox, '#c9853f', [1.5, 1.5, 1.5], [0, 0.75, 0]));
      for (const y of [0.22, 1.28]) g.add(part(GEO.rbox, '#8a5a2b', [1.54, 0.16, 1.54], [0, y, 0]));
      for (const s of [-1, 1]) g.add(part(GEO.rbox, '#8a5a2b', [0.16, 1.57, 1.57], [s * 0.55, 0.75, 0]));
      const top = part(GEO.rbox, color, [0.8, 0.5, 0.8], [0, 1.78, 0], { emissive: color, emissiveIntensity: 0.4 });
      g.add(top); extra.top = top;
      break;
    }
    case 'mine': {
      w = 1.1; l = 1.1; h = 1;
      g.add(part(GEO.ico1, '#2b2f3a', [0.5, 0.5, 0.5], [0, 0.5, 0]));
      for (const [x, y, z] of [[1,0,0],[-1,0,0],[0,1,0],[0,0,1],[0,0,-1]]) {
        const s = part(GEO.cone4, '#ff3b4d', [0.14, 0.35, 0.14], [x * 0.55, 0.5 + y * 0.55, z * 0.55], { emissive: '#ff2030', emissiveIntensity: 0.6 });
        if (x) s.rotation.z = -x * Math.PI / 2; if (z) s.rotation.x = z * Math.PI / 2; g.add(s);
      }
      break;
    }
    case 'barrier': {
      w = 2.6; l = 0.9; h = 1.1;
      g.add(part(GEO.rbox, '#e5e7eb', [2.6, 0.9, 0.7], [0, 0.45, 0]));
      for (let i = 0; i < 4; i++) { const st = part(GEO.rbox, '#ff6b1a', [0.36, 0.92, 0.72], [-0.95 + i * 0.63, 0.46, 0]); st.rotation.z = 0.5; g.add(st); }
      g.add(part(GEO.rbox, '#ffd23f', [0.2, 0.2, 0.2], [-1.1, 1.0, 0], { emissive: '#ffb000', emissiveIntensity: 1 }));
      g.add(part(GEO.rbox, '#ffd23f', [0.2, 0.2, 0.2], [1.1, 1.0, 0], { emissive: '#ffb000', emissiveIntensity: 1 }));
      break;
    }
    case 'rock': {
      w = 1.8; l = 1.8; h = 1.5;
      g.add(part(GEO.ico, '#8d7b68', [1.0, 0.85, 1.0], [0, 0.7, 0]));
      g.add(part(GEO.ico, '#a08c76', [0.6, 0.5, 0.6], [0.5, 1.1, 0.2]));
      break;
    }
  }
  return { g, w, l, h, wl, extra };
}

// ---------- Player cars ----------
function buildPlayerCar(id, skin = null) {
  const g = new THREE.Group();
  let w = 1.7, l = 3.1, wl = [];
  const extra = {};
  if (id === 'roadster') {
    const c = '#2e9bff';
    g.add(part(GEO.rbox, c, [1.8, 0.45, 3.2], [0, 0.6, 0]));
    g.add(part(GEO.rbox, shade(c, -0.12), [1.84, 0.12, 3.24], [0, 0.4, 0]));
    g.add(part(GEO.rbox, '#ffffff', [0.3, 0.48, 3.22], [0, 0.61, 0]));
    g.add(part(GEO.rbox, '#1d2433', [1.4, 0.4, 1.0], [0, 0.98, 0.35]));
    g.add(part(GEO.rbox, GLASS, [1.42, 0.32, 0.06], [0, 1.0, -0.16], glassOpts));
    g.add(part(GEO.rbox, '#1d2433', [1.8, 0.1, 0.45], [0, 1.35, 1.45]));
    for (const s of [-1, 1]) g.add(part(GEO.rbox, '#1d2433', [0.1, 0.45, 0.1], [s * 0.65, 1.12, 1.45]));
    lights(g, 1.8, 0.66, -1.61, 1.61);
    carDetails(g, 1.8, 3.2, 0.6, 0.95, -0.05, c);
    wl = wheels(g, 1.86, 3.2, 0.36);
  } else if (id === 'police') {
    w = 1.8; l = 3.3;
    g.add(part(GEO.rbox, '#f4f6fb', [1.8, 0.5, 3.3], [0, 0.62, 0]));
    g.add(part(GEO.rbox, '#1d2433', [1.84, 0.22, 3.34], [0, 0.5, 0]));
    g.add(part(GEO.rbox, '#1d2433', [1.84, 0.54, 1.2], [0, 0.62, -1.05]));
    g.add(part(GEO.rbox, '#f4f6fb', [1.5, 0.48, 1.6], [0, 1.12, 0.25]));
    g.add(part(GEO.rbox, GLASS, [1.52, 0.34, 0.06], [0, 1.12, -0.56], glassOpts));
    const bar = new THREE.Group(); bar.position.set(0, 1.42, 0.25);
    bar.add(part(GEO.rbox, '#1d2433', [1.2, 0.12, 0.35], [0, 0, 0]));
    const lb = part(GEO.rbox, '#2e7cf6', [0.5, 0.18, 0.3], [-0.3, 0.12, 0], { emissive: '#2e7cf6', emissiveIntensity: 1.2 });
    const lr = part(GEO.rbox, '#ff3b4d', [0.5, 0.18, 0.3], [0.3, 0.12, 0], { emissive: '#ff3b4d', emissiveIntensity: 1.2 });
    bar.add(lb, lr); g.add(bar); extra.lb = lb; extra.lr = lr;
    lights(g, 1.8, 0.7, -1.66, 1.66);
    carDetails(g, 1.8, 3.3, 0.62, 1.05, -0.45, '#f4f6fb');
    wl = wheels(g, 1.86, 3.3, 0.36);
  } else if (id === 'fire') {
    w = 2.1; l = 4.6;
    g.add(part(GEO.rbox, '#e63946', [2.1, 1.3, 3.0], [0, 1.15, 0.7]));
    g.add(part(GEO.rbox, '#ffffff', [2.12, 0.18, 3.02], [0, 0.95, 0.7]));
    g.add(part(GEO.rbox, '#c1121f', [2.0, 1.25, 1.4], [0, 1.05, -1.5]));
    g.add(part(GEO.rbox, GLASS, [1.8, 0.45, 0.06], [0, 1.35, -2.21], glassOpts));
    g.add(part(GEO.rbox, '#2b2f3a', [1.94, 0.3, 4.64], [0, 0.4, 0]));
    for (const s of [-1, 1]) g.add(part(GEO.rbox, '#d9dde5', [0.1, 0.1, 3.4], [s * 0.45, 1.95, 0.6]));
    for (let i = 0; i < 6; i++) g.add(part(GEO.rbox, '#d9dde5', [0.9, 0.06, 0.06], [0, 1.95, -0.9 + i * 0.6]));
    const nozzle = new THREE.Group(); nozzle.position.set(0, 2.0, -0.9);
    nozzle.add(part(GEO.cyl6, '#9aa3b2', [0.2, 0.3, 0.2], [0, 0, 0]));
    const pipe = part(GEO.wheel, '#d9dde5', [0.1, 0.9, 0.1], [0, 0.05, -0.45]); pipe.rotation.x = Math.PI / 2; nozzle.add(pipe);
    g.add(nozzle);
    g.add(part(GEO.rbox, '#ff3b4d', [0.8, 0.15, 0.25], [0, 1.75, -1.5], { emissive: '#ff1f35', emissiveIntensity: 1 }));
    lights(g, 2.0, 0.75, -2.21, 2.21);
    wl = wheels(g, 2.16, 4.6, 0.42);
  } else if (id === 'tank') {
    w = 2.4; l = 4.2;
    for (const s of [-1, 1]) {
      g.add(part(GEO.rbox, '#2f3326', [0.7, 0.75, 4.2], [s * 0.95, 0.45, 0]));
      for (let i = 0; i < 4; i++) { const r = part(GEO.wheel, '#5b6150', [0.28, 0.74, 0.28], [s * 0.95, 0.36, -1.4 + i * 0.93]); r.rotation.z = Math.PI / 2; g.add(r); wl.push(r); }
    }
    g.add(part(GEO.rbox, '#6b8f3a', [2.0, 0.6, 3.8], [0, 0.95, 0]));
    const tur = new THREE.Group(); tur.position.set(0, 1.5, 0.3);
    tur.add(part(GEO.rbox, '#5d7d31', [1.5, 0.6, 1.8], [0, 0, 0]));
    const barrel = part(GEO.wheel, '#2f3326', [0.16, 2.4, 0.16], [0, 0.05, -1.9]); barrel.rotation.x = Math.PI / 2; tur.add(barrel);
    const muzzle = part(GEO.cyl6, '#3a3f2a', [0.24, 0.4, 0.24], [0, 0.05, -3.05]); muzzle.rotation.x = Math.PI / 2; tur.add(muzzle);
    g.add(tur); extra.turret = tur;
  }
  else if (id === 'taxi') {
    wl = sedan(g, '#ffd23f');
    g.add(part(GEO.rbox, '#1d2433', [0.7, 0.26, 0.3], [0, 1.48, 0.25]));
    g.add(part(GEO.rbox, '#fff4b0', [0.62, 0.18, 0.32], [0, 1.5, 0.25], { emissive: '#ffd23f', emissiveIntensity: 0.6 }));
    for (let i = 0; i < 8; i++) for (const s of [-1, 1]) g.add(part(GEO.box, i % 2 ? '#1d2433' : '#ffffff', [0.02, 0.1, 0.32], [s * 0.86, 0.72, -1.1 + i * 0.32]));
  } else if (id === 'sports') {
    w = 1.9; l = 3.4;
    const c = '#ff3b4d';
    g.add(part(GEO.rbox, c, [1.9, 0.4, 3.4], [0, 0.52, 0]));
    g.add(part(GEO.rbox, shade(c, -0.12), [1.96, 0.14, 3.0], [0, 0.36, 0]));
    g.add(part(GEO.rbox, '#1d2433', [1.4, 0.36, 1.2], [0, 0.86, 0.3]));
    g.add(part(GEO.box, GLASS, [1.42, 0.28, 0.06], [0, 0.88, -0.3], glassOpts));
    g.add(part(GEO.rbox, '#1d2433', [0.5, 0.12, 0.6], [0, 0.76, -0.95]));
    for (const s of [-1, 1]) { g.add(part(GEO.rbox, '#ffffff', [0.18, 0.41, 3.42], [s * 0.3, 0.53, 0])); g.add(part(GEO.rbox, '#1d2433', [0.1, 0.4, 0.1], [s * 0.7, 1.0, 1.55])); }
    g.add(part(GEO.rbox, '#1d2433', [2.0, 0.08, 0.5], [0, 1.22, 1.55]));
    lights(g, 1.9, 0.56, -1.71, 1.71);
    carDetails(g, 1.9, 3.4, 0.5, 0.85, 0.0, c);
    wl = wheels(g, 1.98, 3.4, 0.38);
  } else if (id === 'ambulance') {
    w = 2.0; l = 4.0;
    g.add(part(GEO.rbox, '#f4f6fb', [2.0, 1.6, 2.7], [0, 1.25, 0.6]));
    g.add(part(GEO.rbox, '#f4f6fb', [1.9, 1.0, 1.4], [0, 0.95, -1.35]));
    g.add(part(GEO.box, GLASS, [1.7, 0.42, 0.06], [0, 1.2, -2.06], glassOpts));
    for (const s of [-1, 1]) {
      g.add(part(GEO.box, '#ff3b4d', [0.02, 0.22, 4.0], [s * 1.01, 0.85, 0.05]));
      g.add(part(GEO.box, '#ff3b4d', [0.02, 0.5, 0.15], [s * 1.01, 1.45, 0.6])); g.add(part(GEO.box, '#ff3b4d', [0.02, 0.15, 0.5], [s * 1.01, 1.45, 0.6]));
    }
    const lb = part(GEO.rbox, '#ff3b4d', [0.4, 0.16, 0.3], [-0.3, 2.12, -0.6], { emissive: '#ff3b4d', emissiveIntensity: 1.2 });
    const lr = part(GEO.rbox, '#2e7cf6', [0.4, 0.16, 0.3], [0.3, 2.12, -0.6], { emissive: '#2e7cf6', emissiveIntensity: 1.2 });
    g.add(lb, lr); extra.lb = lb; extra.lr = lr;
    lights(g, 1.9, 0.8, -2.06, 1.96);
    wl = wheels(g, 2.06, 4.0, 0.4);
  } else if (id === 'icecream') {
    w = 2.0; l = 4.0;
    g.add(part(GEO.rbox, '#ffb3d1', [2.0, 1.7, 2.8], [0, 1.3, 0.55]));
    g.add(part(GEO.rbox, '#ffd6e7', [1.9, 1.0, 1.3], [0, 0.95, -1.4]));
    g.add(part(GEO.box, GLASS, [1.7, 0.42, 0.06], [0, 1.2, -2.06], glassOpts));
    for (const s of [-1, 1]) { g.add(part(GEO.rbox, '#ffffff', [0.04, 0.6, 1.4], [s * 1.0, 1.45, 0.5])); g.add(part(GEO.box, '#7dd3fc', [0.02, 0.18, 2.8], [s * 1.01, 0.62, 0.55])); }
    // The roof cone changes with the top three skins.
    const b = skin && skin.b, top = b === 'p2' ? 'mint' : b === 'p3' ? 'neon' : b === 'p4' ? 'gold' : 'classic';
    const cone = part(GEO.cone6, top === 'gold' ? '#ffc21a' : '#e0a96d', [0.32, 0.8, 0.32], [0, 2.45, 0.9], top === 'gold' ? { metalness: 0.8, roughness: 0.25 } : {}); cone.rotation.x = Math.PI; g.add(cone);
    const glow = c => ({ emissive: c, emissiveIntensity: 0.9 });
    if (top === 'classic') { g.add(part(GEO.sphere, '#fff1f6', [0.36, 0.32, 0.36], [0, 2.95, 0.9])); g.add(part(GEO.sphere, '#ff4d8d', [0.08, 0.08, 0.08], [0, 3.28, 0.9])); }
    else if (top === 'mint') { g.add(part(GEO.sphere, '#a7f3d0', [0.36, 0.3, 0.36], [0, 2.92, 0.9])); g.add(part(GEO.sphere, '#5b3a29', [0.3, 0.26, 0.3], [0, 3.28, 0.9])); for (let k = 0; k < 6; k++) g.add(part(GEO.box, '#3b2416', [0.05, 0.05, 0.12], [Math.cos(k) * 0.25, 3.0 + (k % 2) * 0.12, 0.9 + Math.sin(k) * 0.25])); }
    else if (top === 'neon') { g.add(part(GEO.sphere, '#f472b6', [0.36, 0.3, 0.36], [0, 2.92, 0.9], glow('#f472b6'))); g.add(part(GEO.sphere, '#38bdf8', [0.3, 0.26, 0.3], [0, 3.26, 0.9], glow('#38bdf8'))); g.add(part(GEO.sphere, '#a3e635', [0.22, 0.2, 0.22], [0, 3.52, 0.9], glow('#a3e635'))); }
    else {
      g.add(part(GEO.sphere, '#fff7d6', [0.38, 0.3, 0.38], [0, 2.92, 0.9])); g.add(part(GEO.sphere, '#5b3a29', [0.32, 0.26, 0.32], [0, 3.24, 0.9])); g.add(part(GEO.sphere, '#ffb3d1', [0.26, 0.22, 0.26], [0, 3.5, 0.9]));
      for (let k = 0; k < 5; k++) { const sp = part(GEO.cone4, '#ffc21a', [0.07, 0.22, 0.07], [Math.cos(k * 1.256) * 0.2, 3.78, 0.9 + Math.sin(k * 1.256) * 0.2], { metalness: 0.8, roughness: 0.25, emissive: '#b88200', emissiveIntensity: 0.4 }); g.add(sp); }
      g.add(part(GEO.sphere, '#ff1f35', [0.1, 0.1, 0.1], [0, 3.82, 0.9], glow('#ff1f35')));
    }
    lights(g, 1.9, 0.8, -2.06, 1.96);
    wl = wheels(g, 2.06, 4.0, 0.4);
  } else if (id === 'garbage') {
    w = 2.2; l = 4.8;
    g.add(part(GEO.rbox, '#3f9d4a', [2.2, 1.9, 3.0], [0, 1.45, 0.8]));
    for (let i = 0; i < 4; i++) g.add(part(GEO.box, '#2f7a38', [2.22, 0.06, 0.06], [0, 0.8 + i * 0.42, 0.8]));
    g.add(part(GEO.rbox, '#e5e7eb', [2.1, 1.3, 1.4], [0, 1.05, -1.5]));
    g.add(part(GEO.box, GLASS, [1.8, 0.45, 0.06], [0, 1.35, -2.21], glassOpts));
    g.add(part(GEO.rbox, '#2b2f3a', [1.96, 0.3, 4.84], [0, 0.4, 0]));
    g.add(part(GEO.rbox, '#ffc21a', [2.0, 0.3, 0.4], [0, 2.1, 2.35], { emissive: '#ffb000', emissiveIntensity: 0.3 }));
    g.add(part(GEO.rbox, '#59616e', [0.15, 1.2, 0.15], [1.05, 1.4, -0.6]));
    lights(g, 2.1, 0.75, -2.21, 2.41);
    wl = wheels(g, 2.26, 4.8, 0.45);
  } else if (id === 'monster') {
    w = 2.4; l = 3.8;
    const c = '#7c3aed';
    g.add(part(GEO.rbox, c, [2.0, 0.7, 3.6], [0, 1.6, 0]));
    g.add(part(GEO.rbox, shade(c, -0.12), [1.7, 0.6, 1.4], [0, 2.2, -0.2]));
    g.add(part(GEO.box, GLASS, [1.5, 0.4, 0.06], [0, 2.2, -0.91], glassOpts));
    g.add(part(GEO.rbox, '#2b2f3a', [1.9, 0.12, 1.4], [0, 1.98, 1.15]));
    for (const s of [-1, 1]) g.add(part(GEO.rbox, '#ffc21a', [0.12, 0.12, 1.6], [s * 0.8, 2.6, 0.4]));
    g.add(part(GEO.rbox, '#ffc21a', [1.72, 0.12, 0.12], [0, 2.6, 1.2]));
    for (let i = 0; i < 4; i++) g.add(part(GEO.sphere, '#fff4b0', [0.1, 0.1, 0.08], [-0.45 + i * 0.3, 2.55, -0.85], { emissive: '#ffe066', emissiveIntensity: 1 }));
    g.add(part(GEO.rbox, '#2b2f3a', [1.4, 0.3, 0.4], [0, 1.15, -1.9]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const wh = part(GEO.wheel, '#1f2124', [0.85, 0.7, 0.85], [sx * 1.25, 0.85, sz * 1.25]); wh.rotation.z = Math.PI / 2; g.add(wh); wl.push(wh);
      const hub = part(GEO.cyl6, '#a3e635', [0.38, 0.72, 0.38], [sx * 1.25, 0.85, sz * 1.25]); hub.rotation.z = Math.PI / 2; g.add(hub);
    }
    lights(g, 2.0, 1.6, -1.81, 1.81);
  }
  if (skin) applySkin(g, id, skin);
  return { g, w, l, wl, extra };
}

// ---------- Weapon models: used on the car and for shop pictures ----------
// `barrels` = extra in-run guns; they are packed tightly so mounts never sprawl.
function buildWeaponModel(id, barrels = 1) {
  const g = new THREE.Group();
  const n = Math.max(1, Math.min(4, barrels)), sp = 0.24;
  const each = fn => { for (let i = 0; i < n; i++) fn((i - (n - 1) / 2) * sp); };
  const rotX = m => { m.rotation.x = Math.PI / 2; return m; };
  const rot0 = (m, x) => { m.rotation.x = x; return m; };
  switch (id) {
    case 'twin':
      g.add(part(GEO.rbox, '#3b4256', [0.34 + n * 0.12, 0.26, 0.55], [0, 0, 0.15]));
      g.add(part(GEO.rbox, '#ffc21a', [0.2, 0.16, 0.3], [0.3 + n * 0.06, -0.02, 0.25]));
      each(x => { for (const dx of [-0.06, 0.06]) g.add(rotX(part(GEO.wheel, '#9aa3b2', [0.045, 0.85, 0.045], [x + dx, 0.03, -0.45]))); });
      break;
    case 'minigun':
      g.add(part(GEO.rbox, '#3b4256', [0.3 + n * 0.14, 0.3, 0.5], [0, 0, 0.2]));
      g.add(part(GEO.rbox, '#c58a12', [0.14, 0.12, 0.4], [0.24 + n * 0.07, -0.08, 0.3]));
      each(x => {
        g.add(rotX(part(GEO.cyl6, '#59616e', [0.12, 0.12, 0.12], [x, 0.02, -0.1])));
        for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; g.add(rotX(part(GEO.wheel, '#c3cad6', [0.028, 0.9, 0.028], [x + Math.cos(a) * 0.07, 0.02 + Math.sin(a) * 0.07, -0.55]))); }
        g.add(rotX(part(GEO.cyl6, '#59616e', [0.11, 0.05, 0.11], [x, 0.02, -0.95])));
      });
      break;
    case 'missile':
      each(x => {
        g.add(part(GEO.rbox, '#3b4256', [0.22, 0.3, 0.7], [x, 0, 0.05]));
        for (const dy of [-0.07, 0.07]) {
          g.add(rotX(part(GEO.wheel, '#e5e7eb', [0.05, 0.4, 0.05], [x, dy, -0.38])));
          g.add(rot0(part(GEO.cone6, '#ff3b4d', [0.05, 0.12, 0.05], [x, dy, -0.62]), -Math.PI / 2));
        }
      });
      break;
    case 'laser':
      g.add(part(GEO.rbox, '#e5e7eb', [0.24 + n * 0.12, 0.24, 0.6], [0, 0, 0.15]));
      g.add(part(GEO.rbox, '#3b4256', [0.26 + n * 0.12, 0.08, 0.62], [0, 0.13, 0.15]));
      each(x => {
        g.add(rotX(part(GEO.wheel, '#ff4d8d', [0.07, 0.75, 0.07], [x, 0.02, -0.45], { emissive: '#ff4d8d', emissiveIntensity: 1.3 })));
        for (const z of [-0.3, -0.55, -0.8]) g.add(rotX(part(GEO.wheel, '#3b4256', [0.1, 0.05, 0.1], [x, 0.02, z])));
      });
      break;
    case 'bazooka':
      each(x => {
        g.add(rotX(part(GEO.wheel, '#556b2f', [0.11, 1.3, 0.11], [x, 0.04, -0.2])));
        g.add(rotX(part(GEO.wheel, '#3a3f2a', [0.14, 0.16, 0.14], [x, 0.04, -0.85])));
        g.add(rotX(part(GEO.wheel, '#3a3f2a', [0.13, 0.12, 0.13], [x, 0.04, 0.42])));
      });
      g.add(part(GEO.rbox, '#2b2f3a', [0.08, 0.14, 0.2], [0, 0.18, -0.1]));
      g.add(part(GEO.rbox, '#2b2f3a', [0.1, 0.22, 0.1], [0, -0.14, 0.05]));
      break;
    case 'water':
      g.add(rotX(part(GEO.wheel, '#e63946', [0.24, 0.6, 0.24], [0, 0, 0.25])));
      g.add(part(GEO.rbox, '#d9dde5', [0.5, 0.06, 0.06], [0, 0, 0.25]));
      g.add(part(GEO.cyl6, '#9aa3b2', [0.12, 0.2, 0.12], [0, 0.22, -0.05]));
      each(x => { g.add(rotX(part(GEO.wheel, '#d9dde5', [0.06, 0.7, 0.06], [x, 0.24, -0.4]))); g.add(rotX(part(GEO.wheel, '#4cc9ff', [0.08, 0.1, 0.08], [x, 0.24, -0.78], { emissive: '#38bdf8', emissiveIntensity: 0.8 }))); });
      break;
    case 'siren':
      g.add(part(GEO.rbox, '#1d2433', [0.9, 0.1, 0.32], [0, 0, 0]));
      g.add(part(GEO.rbox, '#2e7cf6', [0.38, 0.16, 0.28], [-0.22, 0.12, 0], { emissive: '#2e7cf6', emissiveIntensity: 1.2 }));
      g.add(part(GEO.rbox, '#ff3b4d', [0.38, 0.16, 0.28], [0.22, 0.12, 0], { emissive: '#ff3b4d', emissiveIntensity: 1.2 }));
      for (const s of [-1, 1]) g.add(rot0(part(GEO.cone6, '#c3cad6', [0.1, 0.22, 0.1], [s * 0.36, 0.14, -0.22]), -Math.PI / 2));
      break;
    case 'shotgun':
      g.add(part(GEO.rbox, '#8b5a2b', [0.3, 0.24, 0.5], [0, -0.02, 0.25]));
      each(x => { for (const dx of [-0.05, 0.05]) g.add(rotX(part(GEO.wheel, '#3b4256', [0.05, 0.7, 0.05], [x + dx, 0.04, -0.3]))); });
      g.add(part(GEO.rbox, '#59616e', [0.22, 0.1, 0.3], [0, -0.08, -0.25]));
      break;
    case 'tesla':
      g.add(part(GEO.wheel, '#334155', [0.3, 0.16, 0.3], [0, -0.05, 0]));
      g.add(part(GEO.wheel, '#94a3b8', [0.08, 0.5, 0.08], [0, 0.25, 0]));
      for (const y of [0.15, 0.3, 0.45]) { const t = new THREE.Mesh(GEO.torus, mat('#c4b5fd', { emissive: '#8b5cf6', emissiveIntensity: 1 })); t.rotation.x = Math.PI / 2; t.scale.setScalar(0.16); t.position.y = y; g.add(t); }
      g.add(part(GEO.sphere, '#ede9fe', [0.12, 0.12, 0.12], [0, 0.6, 0], { emissive: '#a78bfa', emissiveIntensity: 1.5 }));
      break;
    case 'grenade':
      g.add(part(GEO.rbox, '#3f6212', [0.4, 0.3, 0.5], [0, 0, 0.15]));
      each(x => g.add(rotX(part(GEO.wheel, '#4d7c0f', [0.13, 0.6, 0.13], [x, 0.05, -0.35]))));
      for (let k = 0; k < 3; k++) g.add(part(GEO.sphere, '#4d7c0f', [0.08, 0.08, 0.08], [-0.15 + k * 0.15, 0.2, 0.3]));
      break;
    case 'plasma':
      g.add(part(GEO.rbox, '#1e1b4b', [0.36, 0.3, 0.55], [0, 0, 0.15]));
      each(x => { g.add(rotX(part(GEO.wheel, '#334155', [0.09, 0.55, 0.09], [x, 0.03, -0.35]))); g.add(part(GEO.sphere, '#f472b6', [0.11, 0.11, 0.11], [x, 0.03, -0.65], { emissive: '#ec4899', emissiveIntensity: 1.6 })); });
      g.add(part(GEO.box, '#f472b6', [0.38, 0.04, 0.3], [0, 0.16, 0.15], { emissive: '#ec4899', emissiveIntensity: 1 }));
      break;
    case 'sniper':
      g.add(part(GEO.rbox, '#1f2937', [0.22, 0.2, 0.6], [0, 0, 0.3]));
      each(x => g.add(rotX(part(GEO.wheel, '#111827', [0.04, 1.3, 0.04], [x, 0.03, -0.55]))));
      g.add(rotX(part(GEO.wheel, '#334155', [0.07, 0.4, 0.07], [0, 0.17, 0.2])));
      g.add(part(GEO.sphere, '#38bdf8', [0.05, 0.05, 0.02], [0, 0.17, -0.01], { emissive: '#38bdf8', emissiveIntensity: 1.2 }));
      break;
    case 'railgun':
      for (const s of [-1, 1]) g.add(part(GEO.rbox, '#1e3a8a', [0.08, 0.14, 1.2], [s * 0.12, 0.03, -0.3]));
      g.add(part(GEO.rbox, '#e5e7eb', [0.4, 0.28, 0.45], [0, 0, 0.35]));
      for (const z of [-0.1, -0.4, -0.7]) g.add(part(GEO.box, '#38bdf8', [0.3, 0.04, 0.06], [0, 0.03, z], { emissive: '#38bdf8', emissiveIntensity: 1.4 }));
      break;
    case 'coinshot':
      g.add(part(GEO.rbox, '#ffc21a', [0.4, 0.3, 0.5], [0, 0, 0.15], { metalness: 0.5, roughness: 0.3 }));
      each(x => g.add(rotX(part(GEO.wheel, '#b88200', [0.07, 0.8, 0.07], [x, 0.03, -0.4]))));
      g.add(rotX(part(GEO.wheel, '#ffd84d', [0.16, 0.05, 0.16], [0, 0.22, 0.15])));
      break;
    case 'rockets':
      each(x => { g.add(part(GEO.rbox, '#1d2433', [0.22, 0.24, 0.8], [x, 0, 0])); for (const dy of [-0.06, 0.06]) g.add(rot0(part(GEO.cone6, '#ff3b4d', [0.05, 0.14, 0.05], [x, dy, -0.47]), -Math.PI / 2)); });
      break;
    case 'defib':
      g.add(part(GEO.rbox, '#f4f6fb', [0.6, 0.22, 0.4], [0, 0, 0]));
      for (const s of [-1, 1]) g.add(part(GEO.rbox, '#34d399', [0.2, 0.16, 0.26], [s * 0.2, 0.17, 0], { emissive: '#10b981', emissiveIntensity: 0.9 }));
      g.add(part(GEO.box, '#ff3b4d', [0.18, 0.05, 0.06], [0, 0.12, -0.21])); g.add(part(GEO.box, '#ff3b4d', [0.06, 0.05, 0.18], [0, 0.12, -0.21]));
      break;
    case 'freeze':
      g.add(part(GEO.rbox, '#e0f2fe', [0.36, 0.3, 0.6], [0, 0, 0.15]));
      each(x => { g.add(rotX(part(GEO.wheel, '#7dd3fc', [0.08, 0.6, 0.08], [x, 0.03, -0.35], { emissive: '#38bdf8', emissiveIntensity: 1 }))); g.add(part(GEO.ico, '#a5f3fc', [0.12, 0.12, 0.12], [x, 0.03, -0.7], { emissive: '#67e8f9', emissiveIntensity: 1 })); });
      break;
    case 'trash':
      g.add(part(GEO.rbox, '#3f9d4a', [0.5, 0.3, 0.6], [0, 0, 0.15]));
      each(x => { g.add(rotX(part(GEO.wheel, '#2f7a38', [0.16, 0.9, 0.16], [x, 0.1, -0.35]))); });
      g.add(part(GEO.wheel, '#59616e', [0.12, 0.2, 0.12], [0, 0.32, 0.15]));
      break;
    case 'flame':
      g.add(rotX(part(GEO.wheel, '#ff3b4d', [0.18, 0.5, 0.18], [0, -0.02, 0.25])));
      each(x => { g.add(rotX(part(GEO.wheel, '#2b2f3a', [0.06, 0.7, 0.06], [x, 0.15, -0.3]))); g.add(part(GEO.cone6, '#ff8a1a', [0.08, 0.16, 0.08], [x, 0.15, -0.7], { emissive: '#ff6a00', emissiveIntensity: 1.3 })); });
      break;
    case 'cannon':
      g.add(part(GEO.rbox, '#5d7d31', [0.6, 0.32, 0.6], [0, 0, 0.2]));
      g.add(rotX(part(GEO.wheel, '#2f3326', [0.09, 1.2, 0.09], [0, 0.04, -0.55])));
      g.add(rotX(part(GEO.cyl6, '#3a3f2a', [0.14, 0.2, 0.14], [0, 0.04, -1.15])));
      break;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

// ---------- Part & gadget models (shop pictures, HUD buttons) ----------
function buildItemModel(id) {
  const g = new THREE.Group();
  const rot = (m, x = 0, y = 0, z = 0) => { m.rotation.set(x, y, z); return m; };
  switch (id) {
    case 'engine':
      g.add(part(GEO.rbox, '#9aa3b2', [1.4, 0.9, 1.0], [0, 0, 0]));
      for (let i = 0; i < 4; i++) g.add(part(GEO.wheel, '#6b7280', [0.15, 0.4, 0.15], [-0.5 + i * 0.33, 0.6, 0]));
      g.add(rot(part(GEO.wheel, '#ff3b4d', [0.3, 0.12, 0.3], [-0.78, 0, 0.2]), 0, 0, Math.PI / 2));
      g.add(part(GEO.rbox, '#2b2f3a', [1.2, 0.12, 0.5], [0, 0.84, 0]));
      break;
    case 'crusher':
      g.add(part(GEO.rbox, '#6b7280', [1.6, 0.6, 0.3], [0, 0, 0]));
      g.add(part(GEO.rbox, '#ffd23f', [1.62, 0.12, 0.32], [0, 0.1, 0]));
      for (let i = 0; i < 4; i++) g.add(rot(part(GEO.cone4, '#e5e7eb', [0.15, 0.45, 0.15], [-0.6 + i * 0.4, 0, -0.35]), -Math.PI / 2));
      break;
    case 'damage':
      g.add(part(GEO.wheel, '#c58a12', [0.32, 0.8, 0.32], [0, 0, 0], { metalness: 0.5, roughness: 0.3 }));
      g.add(part(GEO.cone6, '#d8a03a', [0.32, 0.6, 0.32], [0, 0.7, 0], { metalness: 0.5, roughness: 0.3 }));
      g.add(part(GEO.wheel, '#8a5a12', [0.34, 0.08, 0.34], [0, -0.38, 0]));
      break;
    case 'rate': {
      g.add(rot(part(GEO.wheel, '#9aa3b2', [0.7, 0.25, 0.7], [0, 0, 0]), Math.PI / 2));
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; g.add(rot(part(GEO.rbox, '#9aa3b2', [0.2, 0.25, 0.22], [Math.cos(a) * 0.78, Math.sin(a) * 0.78, 0]), 0, 0, a)); }
      g.add(rot(part(GEO.wheel, '#ffc21a', [0.25, 0.3, 0.25], [0, 0, 0]), Math.PI / 2));
      break;
    }
    case 'motor':
      g.add(rot(part(GEO.wheel, '#2e7cf6', [0.5, 1.1, 0.5], [0, 0, 0]), 0, 0, Math.PI / 2));
      for (let i = 0; i < 5; i++) g.add(rot(part(GEO.wheel, '#1d4ed8', [0.56, 0.06, 0.56], [-0.4 + i * 0.2, 0, 0]), 0, 0, Math.PI / 2));
      g.add(rot(part(GEO.wheel, '#c3cad6', [0.08, 0.5, 0.08], [0.78, 0, 0]), 0, 0, Math.PI / 2));
      g.add(part(GEO.rbox, '#2b2f3a', [0.9, 0.12, 0.7], [0, -0.52, 0]));
      break;
    case 'wheels':
      { const t = rot(new THREE.Mesh(GEO.torus, mat('#25272e')), 0, Math.PI / 2); t.scale.setScalar(0.75); g.add(t); }
      g.add(rot(part(GEO.wheel, '#c3cad6', [0.55, 0.3, 0.55], [0, 0, 0], { metalness: 0.6, roughness: 0.3 }), 0, 0, Math.PI / 2));
      for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; g.add(rot(part(GEO.rbox, '#6b7280', [0.32, 0.1, 0.12], [0.17, Math.cos(a) * 0.3, Math.sin(a) * 0.3]), a, 0, 0)); }
      break;
    case 'armor':
      g.add(part(GEO.rbox, '#9aa3b2', [1.2, 1.4, 0.18], [0, 0, 0], { metalness: 0.5, roughness: 0.35 }));
      g.add(part(GEO.rbox, '#6b7280', [1.24, 0.14, 0.2], [0, 0.4, 0]));
      g.add(part(GEO.rbox, '#6b7280', [1.24, 0.14, 0.2], [0, -0.4, 0]));
      for (const x of [-0.45, 0.45]) for (const y of [-0.55, 0.55]) g.add(part(GEO.sphere, '#e5e7eb', [0.07, 0.07, 0.07], [x, y, 0.1]));
      g.add(part(GEO.sphere, '#ff3b4d', [0.24, 0.24, 0.1], [0, 0, 0.12]));
      break;
    case 'slots':
      g.add(part(GEO.rbox, '#2b2f3a', [1.8, 0.14, 0.7], [0, 0, 0]));
      for (const [i, w] of [[-1, 'twin'], [0, 'missile'], [1, 'laser']]) { const m = buildWeaponModel(w, 1); m.scale.setScalar(0.85); m.position.set(i * 0.62, 0.22, 0); g.add(m); }
      break;
    case 'guard':
      g.add(part(GEO.wheel, '#334155', [0.6, 0.2, 0.6], [0, -0.3, 0]));
      g.add(new THREE.Mesh(GEO.sphere, new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0ea5e9', emissiveIntensity: 0.6, transparent: true, opacity: 0.55, roughness: 0.1 })));
      g.children[1].scale.set(0.75, 0.75, 0.75);
      g.add(part(GEO.sphere, '#e0f2fe', [0.22, 0.22, 0.22], [0, 0, 0], { emissive: '#7dd3fc', emissiveIntensity: 1 }));
      break;
    case 'nitro':
      g.add(part(GEO.wheel, '#2e7cf6', [0.32, 1.1, 0.32], [0, 0, 0], { metalness: 0.4, roughness: 0.3 }));
      g.add(part(GEO.sphere, '#2e7cf6', [0.32, 0.25, 0.32], [0, 0.55, 0]));
      g.add(part(GEO.wheel, '#e5e7eb', [0.33, 0.14, 0.33], [0, 0.1, 0]));
      g.add(part(GEO.wheel, '#9aa3b2', [0.08, 0.25, 0.08], [0, 0.85, 0]));
      g.add(part(GEO.rbox, '#ff3b4d', [0.3, 0.06, 0.06], [0, 0.95, 0]));
      g.add(part(GEO.cone6, '#fb923c', [0.22, 0.5, 0.22], [0, -0.85, 0], { emissive: '#f97316', emissiveIntensity: 1.2 }));
      g.children[g.children.length - 1].rotation.x = Math.PI;
      break;
    case 'autopilot':
      g.add(rot(new THREE.Mesh(GEO.torus, mat('#1f2937')), 0, 0, 0));
      g.children[0].scale.setScalar(0.7);
      for (const a of [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6]) g.add(rot(part(GEO.rbox, '#374151', [0.7, 0.12, 0.1], [Math.cos(a) * 0.35, Math.sin(a) * 0.35, 0]), 0, 0, a));
      g.add(rot(part(GEO.wheel, '#a78bfa', [0.25, 0.14, 0.25], [0, 0, 0.05], { emissive: '#8b5cf6', emissiveIntensity: 1.3 }), Math.PI / 2));
      g.add(part(GEO.rbox, '#c4b5fd', [0.12, 0.12, 0.1], [0, 0, 0.14], { emissive: '#a78bfa', emissiveIntensity: 1.5 }));
      break;
    case 'emp':
      g.add(part(GEO.wheel, '#334155', [0.5, 0.25, 0.5], [0, -0.45, 0]));
      g.add(part(GEO.wheel, '#0e7490', [0.28, 0.9, 0.28], [0, 0.05, 0]));
      for (const y of [-0.2, 0.1, 0.4]) { const t = rot(new THREE.Mesh(GEO.torus, mat('#22d3ee', { emissive: '#06b6d4', emissiveIntensity: 1 })), Math.PI / 2); t.position.y = y; g.add(t); }
      for (const c of g.children.slice(-3)) c.scale.setScalar(0.42);
      g.add(part(GEO.sphere, '#a5f3fc', [0.18, 0.18, 0.18], [0, 0.6, 0], { emissive: '#22d3ee', emissiveIntensity: 1.5 }));
      break;
    case 'drone': {
      const d = drone ? drone.clone() : new THREE.Group();
      d.visible = true; d.scale.setScalar(1.4); g.add(d);
      break;
    }
    case 'magnet':
      g.add(rot(new THREE.Mesh(GEO.halfTorus, mat('#f43f5e')), 0, 0, Math.PI));
      g.children[0].scale.setScalar(0.6);
      for (const s of [-1, 1]) g.add(part(GEO.rbox, '#e5e7eb', [0.38, 0.3, 0.38], [s * 0.6, 0.15, 0]));
      break;
    case 'gold':
      for (let i = 0; i < 6; i++) g.add(part(GEO.wheel, '#ffc21a', [0.42, 0.1, 0.42], [rand(-0.03, 0.03), -0.4 + i * 0.11, 0], { metalness: 0.6, roughness: 0.3, emissive: '#b88200', emissiveIntensity: 0.2 }));
      for (let i = 0; i < 4; i++) g.add(part(GEO.wheel, '#ffd84d', [0.42, 0.1, 0.42], [0.62, -0.4 + i * 0.11, 0.2], { metalness: 0.6, roughness: 0.3 }));
      g.add(rot(part(GEO.wheel, '#ffd84d', [0.42, 0.1, 0.42], [-0.6, -0.1, 0.25], { metalness: 0.6, roughness: 0.3 }), 1.2));
      break;
    case 'hammer':
      g.add(rot(part(GEO.rbox, '#8b5a2b', [0.16, 1.4, 0.16], [0, -0.2, 0]), 0, 0, 0.5));
      g.add(rot(part(GEO.rbox, '#fb7185', [0.9, 0.42, 0.42], [-0.3, 0.42, 0]), 0, 0, 0.5));
      g.add(rot(part(GEO.rbox, '#e5e7eb', [0.12, 0.44, 0.44], [-0.68, 0.22, 0]), 0, 0, 0.5));
      break;
    case 'repair':
      g.add(rot(part(GEO.rbox, '#34d399', [0.22, 1.3, 0.12], [0, 0, 0]), 0, 0, -0.6));
      g.add(rot(new THREE.Mesh(GEO.torus, mat('#34d399')), 0, 0, 0));
      g.children[1].scale.setScalar(0.28); g.children[1].position.set(0.42, 0.58, 0);
      g.add(part(GEO.rbox, '#ff3b4d', [0.5, 0.15, 0.15], [-0.4, -0.45, 0.1])); g.add(part(GEO.rbox, '#ff3b4d', [0.15, 0.5, 0.15], [-0.4, -0.45, 0.1]));
      break;
  }
  return g;
}
const itemPic = id => thumb('item:' + id, () => buildItemModel(id));
const weaponPic = id => thumb('weapon:' + id, () => buildWeaponModel(id, id === 'twin' || id === 'missile' ? 2 : 1));
const carPic = (id, skin = skinOf(id)) => thumb('car:' + id + ':' + skin.b + ':' + skin.w, () => buildPlayerCar(id, skin).g);

// ======================================================================
// SKIN PAINTER: canvas patterns + recolouring of the car's main colour (stripes and trim stay)
// ======================================================================
const patternCache = new Map();
function patternTex(type, c = []) {
  const key = type + c.join();
  if (patternCache.has(key)) return patternCache.get(key);
  const cv = document.createElement('canvas'); cv.width = cv.height = 256;
  const x = cv.getContext('2d'), R = (a, b) => a + Math.random() * (b - a);
  const fill = col => { x.fillStyle = col; x.fillRect(0, 0, 256, 256); };
  switch (type) {
    case 'stripes': fill(c[0]); x.fillStyle = c[1]; x.fillRect(84, 0, 34, 256); x.fillRect(138, 0, 34, 256); break;
    case 'checker': for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.fillStyle = (i + j) % 2 ? c[0] : c[1]; x.fillRect(i * 32, j * 32, 32, 32); } break;
    case 'hazard': fill(c[0]); x.fillStyle = c[1]; for (let i = -256; i < 512; i += 64) { x.beginPath(); x.moveTo(i, 256); x.lineTo(i + 32, 256); x.lineTo(i + 288, 0); x.lineTo(i + 256, 0); x.fill(); } break;
    case 'camo': fill(c[0]); for (const col of [c[1], c[2]]) { x.fillStyle = col; for (let k = 0; k < 14; k++) { const cx = R(0, 256), cy = R(0, 256); for (let m = 0; m < 4; m++) { x.beginPath(); x.ellipse(cx + R(-22, 22), cy + R(-14, 14), R(14, 30), R(8, 18), R(0, 3), 0, 7); x.fill(); } } } break;
    case 'digital': for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { x.fillStyle = c[Math.random() < 0.5 ? 0 : Math.random() < 0.6 ? 1 : 2]; x.fillRect(i * 16, j * 16, 16, 16); } break;
    case 'flames': {
      fill(c[0]);
      const gr = x.createLinearGradient(0, 256, 0, 60); gr.addColorStop(0, c[2]); gr.addColorStop(0.5, c[1]); gr.addColorStop(1, c[1]);
      x.fillStyle = gr;
      for (let i = 0; i < 9; i++) { const bx = i * 32 - 10, h = R(110, 200); x.beginPath(); x.moveTo(bx, 256); x.quadraticCurveTo(bx + 4, 256 - h * 0.6, bx + 26, 256 - h); x.quadraticCurveTo(bx + 18, 256 - h * 0.45, bx + 40, 256); x.fill(); }
      break;
    }
    case 'tiger': fill(c[0]); x.fillStyle = c[1]; for (let i = 0; i < 9; i++) { const y = i * 30 + R(-6, 6); x.beginPath(); x.moveTo(0, y); x.quadraticCurveTo(70, y + R(-20, 20), 140, y + 6); x.lineTo(150, y + 14); x.quadraticCurveTo(70, y + 18, 0, y + 12); x.fill(); x.beginPath(); x.moveTo(256, y + 14); x.quadraticCurveTo(190, y, 120, y + 10); x.lineTo(256, y + 22); x.fill(); } break;
    case 'carbon': for (let i = 0; i < 32; i++) for (let j = 0; j < 32; j++) { x.fillStyle = (i + j) % 2 ? '#2b2f3a' : '#1a1d24'; x.fillRect(i * 8, j * 8, 8, 8); x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(i * 8, j * 8, 8, 2); } break;
    case 'galaxy': {
      const gr = x.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#1e1b4b'); gr.addColorStop(0.5, '#581c87'); gr.addColorStop(1, '#0f172a'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
      for (const [col, n] of [['rgba(236,72,153,.35)', 6], ['rgba(56,189,248,.3)', 6]]) for (let k = 0; k < n; k++) { const g2 = x.createRadialGradient(R(0, 256), R(0, 256), 2, R(0, 256), R(0, 256), R(40, 90)); g2.addColorStop(0, col); g2.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g2; x.fillRect(0, 0, 256, 256); }
      for (let k = 0; k < 140; k++) { x.fillStyle = Math.random() < 0.8 ? '#fff' : '#fde68a'; x.fillRect(R(0, 256), R(0, 256), R(1, 3), R(1, 3)); }
      break;
    }
    case 'neon': fill(c[0]); x.strokeStyle = c[1]; x.lineWidth = 4; for (let i = 0; i <= 256; i += 42) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 256); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); } x.lineWidth = 8; x.beginPath(); x.moveTo(0, 200); x.lineTo(256, 60); x.stroke(); break;
    case 'candy': fill(c[0]); x.fillStyle = c[1]; for (let i = -256; i < 512; i += 48) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 24, 0); x.lineTo(i + 280, 256); x.lineTo(i + 256, 256); x.fill(); } break;
    case 'sprinkle': fill(c[0]); for (let k = 0; k < 160; k++) { x.save(); x.translate(R(0, 256), R(0, 256)); x.rotate(R(0, 3.14)); x.fillStyle = pick(['#ff4d8d', '#38bdf8', '#a3e635', '#facc15', '#a78bfa']); x.fillRect(-7, -2, 14, 4); x.restore(); } break;
    case 'gold': { const gr = x.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#fff3b0'); gr.addColorStop(0.4, '#ffc21a'); gr.addColorStop(0.7, '#b88200'); gr.addColorStop(1, '#ffe27a'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); x.fillStyle = '#111827'; x.fillRect(0, 118, 256, 20); x.fillStyle = '#fff7d6'; x.fillRect(0, 122, 256, 3); break; }
    case 'chrome': { const gr = x.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.45, '#94a3b8'); gr.addColorStop(0.55, '#e2e8f0'); gr.addColorStop(1, '#64748b'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256); break; }
  }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  patternCache.set(key, tex);
  return tex;
}
const skinMatCache = new Map();
function skinMaterials(carId, bodyId) {
  const key = carId + ':' + bodyId;
  if (skinMatCache.has(key)) return skinMatCache.get(key);
  const sk = bodySkins(carId).find(s => s.id === bodyId) || bodySkins(carId)[0];
  let main = null, dark = null;
  if (sk.solid) {
    main = new THREE.MeshStandardMaterial({ color: sk.solid, roughness: 0.45, metalness: 0.1 });
    dark = new THREE.MeshStandardMaterial({ color: shade(sk.solid, -0.12), roughness: 0.5, metalness: 0.1 });
  } else if (sk.pattern) {
    const tex = patternTex(sk.pattern, sk.colors), t = sk.pattern;
    const metal = t === 'gold' || t === 'chrome', glow = t === 'neon' || t === 'galaxy';
    const base = { map: tex, roughness: metal ? 0.22 : t === 'carbon' ? 0.35 : 0.5, metalness: metal ? 0.85 : 0.1 };
    if (glow) Object.assign(base, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: t === 'neon' ? 0.55 : 0.35 });
    main = new THREE.MeshStandardMaterial(base);
    dark = new THREE.MeshStandardMaterial({ ...base, color: '#c8c8c8' });
  }
  const r = { main, dark };
  skinMatCache.set(key, r);
  return r;
}
const wheelMatCache = new Map();
function applySkin(g, carId, skin) {
  const bases = SKIN_BASE[carId] || [];
  const mainHex = new Set(bases.map(c => new THREE.Color(c).getHex()));
  const darkHex = new Set();
  for (const c of bases) for (const l of [-0.08, -0.1, -0.12, -0.15, -0.18, -0.2]) darkHex.add(new THREE.Color(shade(c, l)).getHex());
  const { main, dark } = skinMaterials(carId, skin.b || 'default');
  const wh = WHEELS.find(w => w[0] === (skin.w || 'default'));
  let hubMat = null;
  if (wh && wh[0] !== 'default') {
    if (!wheelMatCache.has(wh[0])) wheelMatCache.set(wh[0], new THREE.MeshStandardMaterial({ color: wh[2], metalness: wh[0] === 'neon' ? 0.2 : 0.85, roughness: 0.25, emissive: wh[0] === 'neon' ? wh[2] : '#000000', emissiveIntensity: wh[0] === 'neon' ? 1.2 : 0 }));
    hubMat = wheelMatCache.get(wh[0]);
  }
  const hubHex = new Set(['#c3cad6', '#a3e635', '#5b6150'].map(c => new THREE.Color(c).getHex()));
  g.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    const h = o.material.color.getHex();
    if (main && mainHex.has(h)) o.material = main;
    else if (dark && darkHex.has(h)) o.material = dark;
    else if (hubMat && hubHex.has(h) && (o.geometry === GEO.cyl6 || o.geometry === GEO.wheel)) o.material = hubMat;
  });
}
const skinOf = carId => { const s = skinState(carId); return { b: s.b, w: s.w }; };

// ======================================================================
// WORLD CHUNKS (road + biome decoration), recycled as we drive
// ======================================================================
const chunks = [];
let windowTex = null;
function getWindowTex() {
  if (windowTex) return windowTex;
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 64, 128);
  for (let r = 0; r < 8; r++) for (let k = 0; k < 4; k++) {
    x.fillStyle = Math.random() < 0.35 ? '#ffe9a8' : '#33415c';
    x.fillRect(6 + k * 14, 6 + r * 15, 9, 9);
  }
  windowTex = new THREE.CanvasTexture(c); windowTex.colorSpace = THREE.SRGBColorSpace;
  windowTex.wrapS = windowTex.wrapT = THREE.RepeatWrapping;
  return windowTex;
}
const buildingMats = new Map();
function buildingMat(color) {
  if (!buildingMats.has(color)) buildingMats.set(color, new THREE.MeshStandardMaterial({ color, map: getWindowTex(), roughness: 0.7, flatShading: true }));
  return buildingMats.get(color);
}

function buildChunk(i, biome) {
  const g = new THREE.Group();
  const zc = -CHUNK / 2, B = biome;
  g.add(part(GEO.box, B.road, [ROAD_HALF * 2, 0.2, CHUNK], [0, -0.1, zc]));
  for (const s of [-1, 1]) {
    g.add(part(GEO.box, '#ffffff', [0.18, 0.02, CHUNK], [s * (ROAD_HALF - 0.25), 0.014, zc]));
    g.add(part(GEO.box, B.shoulder, [1.2, 0.24, CHUNK], [s * (ROAD_HALF + 0.6), -0.06, zc]));
    g.add(part(GEO.box, B.rail, [0.12, 0.22, CHUNK], [s * (ROAD_HALF + 0.25), 0.5, zc]));
    for (let z = 0; z > -CHUNK; z -= 5) g.add(part(GEO.box, '#9aa3b2', [0.12, 0.5, 0.12], [s * (ROAD_HALF + 0.25), 0.25, z - 2.5]));
    if (B.deco === 'bridge') g.add(part(GEO.box, B.ground, [60, 0.3, CHUNK], [s * (ROAD_HALF + 31), -3, zc], { roughness: 0.2, metalness: 0.1 }));
    else g.add(part(GEO.box, B.ground, [40, 0.3, CHUNK], [s * (ROAD_HALF + 21.2), -0.2, zc]));
  }
  for (const x of [-1.5, 1.5]) for (let z = -2; z > -CHUNK; z -= 6) g.add(part(GEO.box, '#f4f6fa', [0.15, 0.02, 2.4], [x, 0.012, z]));
  decorate(g, B);
  g.position.z = 20 - i * CHUNK;
  scene.add(g);
  return g;
}
const HOUSE_COLORS = ['#ff8a65', '#ffd166', '#f4f1de', '#a0c4ff', '#ffadad', '#cdb4db'];
const ROOF_COLORS = ['#c0392b', '#7b3f2b', '#3d5a80', '#e76f51'];
function tree(g, x, z, h, leaf) {
  g.add(part(GEO.wheel, '#8b5a2b', [0.18, h * 0.5, 0.18], [x, h * 0.25, z]));
  g.add(part(Math.random() < 0.5 ? GEO.ico : GEO.cone6, leaf || pick(['#2f9e44', '#40c057', '#37b24d', '#69db7c']), [h * 0.45, h * 0.6, h * 0.45], [x, h * 0.75, z]));
}
function decorate(g, B) {
  const sides = [-1, 1];
  if (B.deco === 'bridge') {
    for (const s of sides) {
      for (const z of [-8, -28]) {
        const x = s * (ROAD_HALF + 1.2);
        g.add(part(GEO.box, '#e2353b', [0.7, 12, 0.7], [x, 5.8, z]));
        g.add(part(GEO.box, '#c1121f', [0.9, 0.5, 0.9], [x, 11.9, z]));
        const cab = part(GEO.box, '#b91c1c', [0.08, 0.08, 21], [x, 7, z + 10]); cab.rotation.x = 0.5; g.add(cab);
      }
      g.add(part(GEO.box, '#e2353b', [0.25, 0.25, CHUNK], [s * (ROAD_HALF + 1.2), 4.2, -CHUNK / 2]));
      for (let z = -2; z > -CHUNK; z -= 4) g.add(part(GEO.box, '#b91c1c', [0.06, 3.8, 0.06], [s * (ROAD_HALF + 1.2), 2.2, z]));
      if (Math.random() < 0.5) {
        const bx = s * rand(ROAD_HALF + 12, ROAD_HALF + 26), bz = -rand(5, 35);
        g.add(part(GEO.box, '#ffffff', [2.4, 0.6, 5], [bx, -2.4, bz]));
        g.add(part(GEO.box, '#e63946', [1.4, 0.7, 2], [bx, -1.8, bz + 0.6]));
      }
    }
    g.add(part(GEO.box, '#e2353b', [ROAD_HALF * 2 + 2.6, 0.6, 0.6], [0, 12, -8]));
    return;
  }
  for (const s of sides) {
    for (let z = -3; z > -CHUNK; z -= rand(5, 9)) {
      const x = s * rand(ROAD_HALF + 3, ROAD_HALF + 16);
      const r = Math.random();
      if (B.deco === 'country') {
        if (r < 0.45) tree(g, x, z, rand(1.6, 2.6));
        else if (r < 0.72) {
          const w = rand(2.2, 3.4), d = rand(2.2, 3), h = rand(1.6, 2.4);
          g.add(part(GEO.box, pick(HOUSE_COLORS), [w, h, d], [x, h / 2, z]));
          const roof = part(GEO.cone4, pick(ROOF_COLORS), [w * 0.78, 1.2, d * 0.78], [x, h + 0.6, z]); roof.rotation.y = Math.PI / 4; g.add(roof);
        } else if (r < 0.86) {
          const fx = s * (ROAD_HALF + 2.2);
          for (let k = 0; k < 4; k++) g.add(part(GEO.box, '#f4f1de', [0.12, 0.7, 0.12], [fx, 0.35, z - k * 1.2]));
          g.add(part(GEO.box, '#f4f1de', [0.08, 0.1, 3.8], [fx, 0.55, z - 1.8]));
        } else g.add(part(GEO.ico, '#2b8a3e', [rand(0.5, 0.9), rand(0.4, 0.7), rand(0.5, 0.9)], [x, 0.3, z]));
      } else if (B.deco === 'desert') {
        if (r < 0.4) {
          const h = rand(1.4, 2.6);
          g.add(part(GEO.cyl6, '#3f9d4a', [0.28, h, 0.28], [x, h / 2, z]));
          g.add(part(GEO.cyl6, '#3f9d4a', [0.16, 0.7, 0.16], [x + 0.4, h * 0.6, z]));
          g.add(part(GEO.cyl6, '#3f9d4a', [0.16, 0.6, 0.16], [x - 0.4, h * 0.45, z]));
        } else if (r < 0.62) {
          const w = rand(3, 7), h = rand(2.5, 6);
          g.add(part(GEO.box, pick(['#c8743c', '#b5602f', '#d98a4b']), [w, h, w * 0.8], [x + s * 4, h / 2, z]));
          g.add(part(GEO.box, '#e8a065', [w * 1.05, 0.4, w * 0.85], [x + s * 4, h, z]));
        } else g.add(part(GEO.ico, pick(['#a0866a', '#b89a74']), [rand(0.6, 1.4), rand(0.4, 0.9), rand(0.6, 1.2)], [x, 0.3, z]));
      } else if (B.deco === 'city') {
        if (r < 0.75) {
          const w = rand(3, 5), d = rand(3, 5), h = rand(5, 16);
          const m = new THREE.Mesh(GEO.box, buildingMat(pick(['#9fb3d1', '#c7b8e8', '#f2c5a0', '#a8d8c8', '#e8a0b8'])));
          m.scale.set(w, h, d); m.position.set(s * rand(ROAD_HALF + 5, ROAD_HALF + 14), h / 2, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
          g.add(part(GEO.box, '#3e4351', [w * 0.6, 0.6, d * 0.6], [m.position.x, h + 0.3, z]));
        } else {
          const lx = s * (ROAD_HALF + 1.6);
          g.add(part(GEO.box, '#3e4351', [0.12, 3.4, 0.12], [lx, 1.7, z]));
          g.add(part(GEO.box, '#3e4351', [0.9, 0.1, 0.12], [lx - s * 0.45, 3.4, z]));
          g.add(part(GEO.box, '#ff4d8d', [0.4, 0.14, 0.3], [lx - s * 0.85, 3.32, z], { emissive: '#ff4d8d', emissiveIntensity: 1 }));
        }
      } else if (B.deco === 'snow') {
        if (r < 0.55) {
          const h = rand(2, 3.4);
          g.add(part(GEO.wheel, '#6b4a2b', [0.16, 0.6, 0.16], [x, 0.3, z]));
          for (let k = 0; k < 3; k++) g.add(part(GEO.cone6, k === 2 ? '#e8f1fb' : '#2f6b4f', [h * (0.45 - k * 0.1), h * 0.45, h * (0.45 - k * 0.1)], [x, 0.8 + k * h * 0.25, z]));
        } else if (r < 0.7) {
          g.add(part(GEO.sphere, '#ffffff', [0.55, 0.55, 0.55], [x, 0.5, z]));
          g.add(part(GEO.sphere, '#ffffff', [0.38, 0.38, 0.38], [x, 1.25, z]));
          g.add(part(GEO.cone6, '#fb923c', [0.07, 0.3, 0.07], [x, 1.28, z + s * 0.4]));
        } else if (r < 0.85) {
          const w = rand(2.4, 3.2), h = rand(1.6, 2.2);
          g.add(part(GEO.box, pick(['#8b5a2b', '#a0522d']), [w, h, w], [x, h / 2, z]));
          const roof = part(GEO.cone4, '#ffffff', [w * 0.8, 1.2, w * 0.8], [x, h + 0.6, z]); roof.rotation.y = Math.PI / 4; g.add(roof);
        } else g.add(part(GEO.ico, '#cfd8e6', [rand(0.6, 1.2), rand(0.4, 0.8), rand(0.6, 1.2)], [x, 0.3, z]));
      }
    }
  }
  // distant clouds
  if (Math.random() < 0.6) {
    const cx = pick([-1, 1]) * rand(14, 30), cy = rand(14, 22), cz = -rand(5, 35);
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(GEO.ico1, basic('#ffffff'));
      c.scale.set(rand(2, 3.5), rand(1.2, 2), rand(1.6, 2.6)); c.position.set(cx + k * 2.2, cy + rand(-0.5, 0.5), cz); g.add(c);
    }
  }
}
let currentBiome = null;
function setBiome(B) {
  if (currentBiome === B && chunks.length) { chunks.forEach((c, i) => c.position.z = 20 - i * CHUNK); return; }
  currentBiome = B;
  for (const c of chunks) scene.remove(c);
  chunks.length = 0;
  for (let i = 0; i < NCHUNK; i++) chunks.push(buildChunk(i, B));
  scene.background = new THREE.Color(B.sky);
  scene.fog.color = new THREE.Color(B.sky);
  hemi.groundColor = new THREE.Color(B.ground);
}
function recycleChunks(pz) {
  for (const c of chunks) if (c.position.z - CHUNK > pz + 24) c.position.z -= NCHUNK * CHUNK;
}
