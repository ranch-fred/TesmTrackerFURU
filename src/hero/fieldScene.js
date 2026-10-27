// Code-built 3D BIOBUZZ field for the sign-in page background.
// It assembles once (tiles → walls → A-frame hive → hex pods → flowers,
// nectar, gardens, trays), then the camera orbits slowly forever.
// Layout follows the game manual's top-down drawing: 6×6 tiles (2 ft each),
// hive in the centre with blue pods on the back arm and red on the front,
// flowers on the wall seams, corner nectar rails, gardens on the alliance walls.
// No robot is drawn and nothing is launched. Libraries load from a pinned
// CDN at runtime so the app's package-lock stays untouched.
const CDN = 'https://esm.sh/three@0.170.0';
const LIBS = {
  three: CDN,
  composer: `${CDN}/examples/jsm/postprocessing/EffectComposer.js`,
  render: `${CDN}/examples/jsm/postprocessing/RenderPass.js`,
  bloom: `${CDN}/examples/jsm/postprocessing/UnrealBloomPass.js`,
  output: `${CDN}/examples/jsm/postprocessing/OutputPass.js`,
  room: `${CDN}/examples/jsm/environments/RoomEnvironment.js`,
  gsap: 'https://esm.sh/gsap@3.12.5',
};

let libsPromise = null;
function loadLibs() {
  if (!libsPromise) {
    const load = (url) => import(/* @vite-ignore */ url);
    libsPromise = Promise.all(Object.values(LIBS).map(load)).then((mods) =>
      Object.fromEntries(Object.keys(LIBS).map((k, i) => [k, mods[i]])),
    );
  }
  return libsPromise;
}

export async function createFieldScene(container, opts = {}) {
  const L = await loadLibs();
  return build(container, opts, L);
}

function build(container, { accent = '#FF6B00', animate = true, centered = false, onBuilt } = {}, L) {
  const THREE = L.three;
  const gsap = L.gsap.gsap || L.gsap.default;
  const { EffectComposer } = L.composer, { RenderPass } = L.render, { UnrealBloomPass } = L.bloom;
  const { OutputPass } = L.output, { RoomEnvironment } = L.room;

  const ACC = new THREE.Color(accent);
  const RED = new THREE.Color('#E0322B');
  const BLUE = new THREE.Color('#2F55E0');
  const W = () => container.clientWidth, H = () => container.clientHeight;

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#040404');
  scene.fog = new THREE.FogExp2('#040404', 0.03);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.05, 200);
  const cam = { x: 2, y: 14, z: 22, ly: 0, fov: 34 };

  scene.add(new THREE.HemisphereLight('#ffe2c4', '#0a0a0a', 0.4));
  const key = new THREE.SpotLight('#ffb070', 260, 50, Math.PI / 4.5, 0.55, 1.5);
  key.position.set(-8, 16, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.DirectionalLight('#cfe0ff', 1.2); rim.position.set(9, 8, -10); scene.add(rim);
  const warm = new THREE.PointLight(ACC, 10, 12, 1.8); warm.position.set(0, 4, 3); scene.add(warm);

  /* ---------- procedural textures ---------- */
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
  };
  const tileTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#3a3a3c'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 7000; i++) { const v = 46 + rnd() * 22; g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(rnd() * w, rnd() * h, 2, 2) }
    g.strokeStyle = '#1a1a1b'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h - 4);
    g.beginPath(); for (let i = 1; i < 8; i++) { const p = (i / 8) * w; g.moveTo(p - 6, 0); g.lineTo(p, 7); g.lineTo(p + 6, 0) } g.stroke();
  });
  const honeyTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#E8C547'; g.fillRect(0, 0, w, h);
    const r = 26;
    for (let row = 0; row < 8; row++) for (let col = 0; col < 16; col++) {
      const cx = col * r * 1.75 + (row % 2) * r * 0.87, cy = row * r * 1.5;
      if (cx > w * 0.32) continue;
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9) } g.closePath();
      g.fillStyle = (row + col) % 3 ? '#FFD84A' : '#F5B900'; g.fill(); g.strokeStyle = '#7A5A00'; g.lineWidth = 3; g.stroke();
    }
    g.fillStyle = '#16120a'; g.font = '900 120px Impact, "Arial Black", sans-serif'; g.textBaseline = 'middle';
    g.fillText('BIOBUZZ', w * 0.36, h * 0.52);
  });
  // wiffle-ball look: solid colour with dark holes
  const ballTex = (col) => canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.5)';
    for (let y = 10; y < h; y += 18) for (let x = (y / 18) % 2 ? 8 : 17; x < w; x += 18) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill() }
  });

  /* ---------- materials ---------- */
  const alu = new THREE.MeshStandardMaterial({ color: '#b9bdc2', metalness: 1, roughness: 0.38 });
  const darkAlu = new THREE.MeshStandardMaterial({ color: '#4a4d52', metalness: 0.9, roughness: 0.45 });
  const black = new THREE.MeshStandardMaterial({ color: '#141414', metalness: 0.4, roughness: 0.6 });
  const poly = new THREE.MeshPhysicalMaterial({ color: '#dfe6ee', roughness: 0.08, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const glow = (c, k = 0.35) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: k, metalness: 0.3, roughness: 0.35 });
  const tape = (c) => new THREE.MeshBasicMaterial({ color: c });
  const green = new THREE.MeshStandardMaterial({ color: '#4FC23A', roughness: 0.4, emissive: '#2a8a1a', emissiveIntensity: 0.25 });
  const orangeRing = glow('#F29A12', 0.4);
  const purple = glow('#7B4FD0', 0.3);
  const ballMat = {
    yellow: new THREE.MeshStandardMaterial({ map: ballTex('#F2C230'), roughness: 0.45, emissive: '#F2C230', emissiveIntensity: 0.2 }),
    red: new THREE.MeshStandardMaterial({ map: ballTex('#D2302A'), roughness: 0.45, emissive: RED, emissiveIntensity: 0.25 }),
    blue: new THREE.MeshStandardMaterial({ map: ballTex('#2D52D8'), roughness: 0.45, emissive: BLUE, emissiveIntensity: 0.25 }),
  };
  const ballGeo = new THREE.SphereGeometry(0.17, 20, 14);
  const ball = (kind, x, y, z) => { const m = new THREE.Mesh(ballGeo, ballMat[kind]); m.position.set(x, y, z); m.castShadow = true; return m };
  const box = (w, h, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.castShadow = true; return m };
  const appear = (o) => { o.scale.setScalar(0.001); return o };

  /* ---------- blueprint floor ---------- */
  const floorU = { uReveal: { value: 0 }, uAcc: { value: ACC } };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShaderMaterial({
    uniforms: floorU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uReveal; uniform vec3 uAcc; varying vec3 vW;
      float grid(vec2 p, float s){ vec2 q=p/s; vec2 g=abs(fract(q-0.5)-0.5)/fwidth(q); return 1.0-min(min(g.x,g.y),1.0); }
      void main(){ float d=length(vW.xz);
        vec3 col=vec3(0.025);
        float m=smoothstep(uReveal, uReveal-3.0, d);
        float g=grid(vW.xz,1.0)*0.3+grid(vW.xz,2.0)*0.7;
        col+=uAcc*g*0.12*m;
        col+=uAcc*smoothstep(2.0,0.0,abs(d-uReveal))*step(0.01,uReveal)*(g+0.15)*1.2;
        gl_FragColor=vec4(col*smoothstep(40.0,6.0,d),1.0); }`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.002; scene.add(floor);

  /* ---------- field: 6×6 foam tiles ---------- */
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1.97, 0.1, 1.97), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.95 }), 36);
  tiles.receiveShadow = true; scene.add(tiles);
  const tileState = Array.from({ length: 36 }, (_, i) => ({ x: (i % 6) * 2 - 5, z: Math.floor(i / 6) * 2 - 5, y: 10 + rnd() * 4, r: (rnd() - 0.5) * 1.6 }));
  const dummy = new THREE.Object3D();
  const syncTiles = () => { tileState.forEach((t, i) => { dummy.position.set(t.x, t.y + 0.05, t.z); dummy.rotation.set(t.r * 0.4, t.r, t.r * 0.3); dummy.updateMatrix(); tiles.setMatrixAt(i, dummy.matrix) }); tiles.instanceMatrix.needsUpdate = true };
  syncTiles();

  // perimeter: clear polycarbonate between black top and bottom rails
  const walls = new THREE.Group(); scene.add(walls);
  const pane = new THREE.MeshStandardMaterial({ color: '#9ab', transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  for (let s = 0; s < 4; s++) {
    const side = new THREE.Group();
    for (const y of [1.0, 0.1]) { const r = box(12.2, 0.08, 0.08, black); r.position.y = y; side.add(r) }
    const p = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.88), pane); p.position.y = 0.55; side.add(p);
    for (let k = -3; k <= 3; k++) { const post = box(0.06, 1.05, 0.06, black); post.position.set(k * 2, 0.52, 0); side.add(post) }
    side.rotation.y = (s * Math.PI) / 2;
    side.position.set(s === 1 ? 6.05 : s === 3 ? -6.05 : 0, 0, s === 0 ? 6.05 : s === 2 ? -6.05 : 0);
    side.scale.y = 0.001; walls.add(side);
  }

  /* ---------- the hive: A-frame with four hex pods ---------- */
  const hive = new THREE.Group(); scene.add(hive);
  const HB = { x: 1.67, z: 2.1 }, TOP = 4.1, BEAM = 1.15;
  const bar = (len, t = 0.09, mat = alu) => { const m = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), mat); m.castShadow = true; return m };
  const between = (m, a, b) => { const d = new THREE.Vector3().subVectors(b, a); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.scale.y = d.length() / m.geometry.parameters.height; return m };
  // base: front/back rails along x, thin side members along z
  const rails = [-1, 1].map((sz) => { const r = box(HB.x * 2 + 0.3, 0.12, 0.16, darkAlu); r.position.set(sz * 14, 0.11, sz * HB.z); hive.add(r); return r });
  const sides = [-1, 1].map((sx) => { const r = box(0.06, 0.04, HB.z * 2, alu); r.position.set(sx * HB.x, 0.08, 0); r.scale.z = 0.001; hive.add(r); return r });
  // four legs: base corner → top of the A at each end of the spine
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(sx * HB.x, 0.15, sz * HB.z), b = new THREE.Vector3(0, TOP, sz * BEAM);
    const pivot = new THREE.Group(); pivot.position.copy(a); hive.add(pivot);
    pivot.add(between(bar(1), new THREE.Vector3(), b.clone().sub(a)));
    pivot.add(box(0.28, 0.06, 0.28, darkAlu));
    pivot.userData = { sz };
    pivot.rotation.set(sz * 1.45, 0, -sx * 0.25); pivot.scale.setScalar(0.001);
    legs.push(pivot);
  }
  const spine = box(0.12, 0.12, BEAM * 2 + 0.4, alu); spine.position.set(0, TOP + 9, 0); hive.add(spine);
  const arms = [-1, 1].map((sz) => { const a = box(2.9, 0.08, 0.08, darkAlu); a.position.set(0, TOP + 0.62, sz * BEAM); a.scale.x = 0.001; hive.add(a); return a });
  for (const sz of [-1, 1]) { const r = bar(0.66, 0.08, darkAlu); r.position.set(0, TOP + 0.31, sz * BEAM); hive.add(r) }
  // the yellow honeycomb BIOBUZZ panel hangs under the spine
  const sign = new THREE.Group(); sign.position.set(0, TOP - 0.5, 0); hive.add(sign);
  for (const r of [Math.PI / 2, -Math.PI / 2]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshStandardMaterial({ map: honeyTex, roughness: 0.6, emissive: '#FFC400', emissiveIntensity: 0.12, emissiveMap: honeyTex }));
    p.rotation.y = r; p.position.x = r > 0 ? 0.03 : -0.03; sign.add(p);
  }
  sign.scale.set(1, 0.001, 1);
  // pods: clear "house" tubes (flat floor, upright walls, peaked roof) along x
  // with a coloured frame at each end, tipped so the outer opening faces up and out
  const houseOutline = (k) => [[-0.75, -0.6], [0.75, -0.6], [0.75, 0.15], [0, 0.85], [-0.75, 0.15]].map(([x, y]) => [x * k, (y + 0.05) * k - 0.05]);
  const housePath = (k, P) => { houseOutline(k).forEach(([x, y], i) => P[i ? 'lineTo' : 'moveTo'](x, y)); P.closePath(); return P };
  const rimGeo = (() => { const s = housePath(1, new THREE.Shape()); s.holes.push(housePath(0.84, new THREE.Path())); const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false }); g.translate(0, 0, -0.035); return g })();
  const tubeGeo = new THREE.ExtrudeGeometry(housePath(0.97, new THREE.Shape()), { depth: 1.3, bevelEnabled: false });
  tubeGeo.translate(0, 0, -0.65);
  const noCaps = new THREE.MeshBasicMaterial({ visible: false });
  const pods = [];
  for (const [sz, col] of [[-1, BLUE], [1, RED]]) for (const sx of [-1, 1]) {
    const pod = new THREE.Group();
    // extrude groups: 0 = end caps (left open), 1 = walls
    const tube = new THREE.Mesh(tubeGeo, [noCaps, poly]); tube.rotation.y = Math.PI / 2; pod.add(tube);
    const mat = glow(col);
    for (const ex of [-0.66, 0.66]) { const r = new THREE.Mesh(rimGeo, mat); r.rotation.y = Math.PI / 2; r.position.x = ex; r.castShadow = true; pod.add(r) }
    // floor rails the pod sits on, along its length
    for (const fz of [-0.55, 0.55]) { const rail = box(1.32, 0.04, 0.05, mat); rail.position.set(0, -0.6, fz); pod.add(rail) }
    pod.position.set(sx * 1.1, TOP + 0.62, sz * BEAM);
    pod.rotation.z = sx * 0.38;
    pod.userData = { home: pod.position.clone(), mat };
    pod.position.y += 7; pod.position.x += sx * 4; pod.scale.setScalar(0.001);
    hive.add(pod); pods.push(pod);
  }

  /* ---------- flowers: four green poles, orange crown, purple handle, nectar inside ---------- */
  const poleGeo = new THREE.CylinderGeometry(0.045, 0.045, 1.7, 10);
  const crownGeo = new THREE.TorusGeometry(0.3, 0.05, 8, 6);
  const flowers = [[-2, -5.65], [5.65, -2], [2, 5.65], [-5.65, 2]].map(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const base = box(0.62, 0.08, 0.62, black); base.position.y = 0.14; g.add(base);
    for (const [px, pz] of [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]]) { const p = new THREE.Mesh(poleGeo, green); p.position.set(px, 1.03, pz); p.castShadow = true; g.add(p) }
    const crown = new THREE.Mesh(crownGeo, orangeRing); crown.rotation.x = Math.PI / 2; crown.position.y = 1.88; g.add(crown);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12, Math.PI), purple); handle.position.y = 1.9; g.add(handle);
    const mid = box(0.5, 0.03, 0.5, black); mid.position.y = 0.95; g.add(mid);
    for (let k = 0; k < 3; k++) g.add(ball('yellow', 0, 0.36 + k * 0.34, 0));
    scene.add(appear(g)); return g;
  });

  /* ---------- nectar rails, gardens, trays, alliance tape ---------- */
  // corner rails: four yellow nectar on a blue rail (back-left) and a red rail (front-right)
  const nectar = [[-5.85, -5, BLUE, -1], [5.85, 5, RED, 1]].map(([x, z, col, dir]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const r = box(0.2, 0.12, 2.0, glow(col)); r.position.y = 0.16; g.add(r);
    for (let k = 0; k < 4; k++) g.add(ball('yellow', 0, 0.39, (k - 1.5) * 0.4 * dir));
    g.scale.set(1, 1, 0.001); scene.add(g); return g;
  });
  // gardens: open three-sided tape boxes on the alliance walls
  const strip = (w, d, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.02, d), mat); m.receiveShadow = true; return m };
  const gardens = [[3, -5.5, BLUE], [-3, 5.5, RED]].map(([x, z, col]) => {
    const g = new THREE.Group(); g.position.set(x, 0.11, z); const m = tape(col);
    const back = strip(2, 0.1, m); back.position.z = z < 0 ? 0.45 : -0.45; g.add(back);
    for (const sx of [-1, 1]) { const arm = strip(0.1, 1.0, m); arm.position.x = sx * 0.95; g.add(arm) }
    scene.add(appear(g)); return g;
  });
  // alliance trays (8 balls each) and a row of nectar outside each alliance wall
  const trays = [[-1.6, 7.0, 'red'], [1.6, -7.0, 'blue']].map(([x, z, kind]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const floorP = box(1.3, 0.04, 0.8, black); floorP.position.y = 0.02; g.add(floorP);
    for (const sx of [-1, 1]) { const w = box(0.04, 0.26, 0.8, black); w.position.set(sx * 0.63, 0.13, 0); g.add(w) }
    for (const sz of [-1, 1]) { const w = box(1.3, 0.26, 0.04, black); w.position.set(0, 0.13, sz * 0.38); g.add(w) }
    for (let k = 0; k < 8; k++) g.add(ball(kind, -0.42 + (k % 4) * 0.28, 0.2 + (k > 3 ? 0.08 : 0), k > 3 ? 0.14 : -0.14));
    for (let k = 0; k < 8; k++) g.add(ball('yellow', (x < 0 ? -1.4 : 1.4) - (x < 0 ? 1 : -1) * k * 0.36, 0.17, 0));
    scene.add(appear(g)); return g;
  });
  const lines = [[-3, 7.3, RED], [3, -7.3, BLUE]].map(([x, z, col]) => {
    const g = new THREE.Group(); g.position.set(x, 0.01, z); const m = tape(col);
    const far = strip(6, 0.08, m); far.position.z = z > 0 ? 1.2 : -1.2; g.add(far);
    for (const sx of [-1, 1]) { const s = strip(0.08, 2.4, m); s.position.x = sx * 3; g.add(s) }
    g.scale.set(0.001, 1, 1); scene.add(g); return g;
  });

  /* ---------- sparks (only where parts bolt together) ---------- */
  const N = 1200;
  const sp = { pos: new Float32Array(N * 3), vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N), size: new Float32Array(N), i: 0 };
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(sp.pos, 3));
  sg.setAttribute('aLife', new THREE.BufferAttribute(sp.life, 1));
  sg.setAttribute('aSize', new THREE.BufferAttribute(sp.size, 1));
  const sparkMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uPx: { value: 1 }, uAcc: { value: ACC } },
    vertexShader: 'attribute float aLife; attribute float aSize; varying float vL; uniform float uPx; void main(){ vL=aLife; vec4 mv=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*mv; gl_PointSize= aLife>0.0 ? aSize*uPx*(200.0/-mv.z)*(0.35+aLife) : 0.0; }',
    fragmentShader: 'varying float vL; uniform vec3 uAcc; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; float a=smoothstep(0.5,0.0,d)*clamp(vL*1.6,0.0,1.0); gl_FragColor=vec4(mix(uAcc, vec3(1.0,0.86,0.5), vL*0.6)*1.15, a*0.85); }',
  });
  const sparks = new THREE.Points(sg, sparkMat); sparks.frustumCulled = false; scene.add(sparks);
  function emit(at, count) {
    for (let k = 0; k < count; k++) {
      const i = (sp.i = (sp.i + 1) % N);
      sp.pos[i * 3] = at.x; sp.pos[i * 3 + 1] = at.y; sp.pos[i * 3 + 2] = at.z;
      const th = rnd() * Math.PI * 2, s = 5 * (0.3 + rnd() * 0.9);
      sp.vel[i * 3] = Math.cos(th) * s; sp.vel[i * 3 + 1] = rnd() * 1.6 + s * 0.3; sp.vel[i * 3 + 2] = Math.sin(th) * s;
      sp.max[i] = 0.55 * (0.5 + rnd()); sp.life[i] = 1; sp.size[i] = 0.9 * (0.25 + rnd() * 0.55);
    }
  }
  function updateSparks(dt) {
    for (let i = 0; i < N; i++) {
      if (sp.life[i] <= 0) continue;
      sp.life[i] -= dt / sp.max[i]; sp.vel[i * 3 + 1] -= 8.8 * dt;
      sp.pos[i * 3] += sp.vel[i * 3] * dt; sp.pos[i * 3 + 1] += sp.vel[i * 3 + 1] * dt; sp.pos[i * 3 + 2] += sp.vel[i * 3 + 2] * dt;
      if (sp.pos[i * 3 + 1] < 0.02) { sp.pos[i * 3 + 1] = 0.02; sp.vel[i * 3 + 1] *= -0.3; sp.vel[i * 3] *= 0.6; sp.vel[i * 3 + 2] *= 0.6 }
    }
    sg.attributes.position.needsUpdate = true; sg.attributes.aLife.needsUpdate = true; sg.attributes.aSize.needsUpdate = true;
  }

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.45, 0.4, 0.86); composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ================= assembly timeline (~9 s) ================= */
  let finished = false;
  const built = () => { if (!finished) { finished = true; onBuilt?.() } };
  const tl = gsap.timeline({ paused: true, onComplete: built });
  const snap = (p, n = 26) => emit(p, n);
  const full = { x: 1, y: 1, z: 1 };
  tl.to(floorU.uReveal, { value: 32, duration: 4, ease: 'power2.inOut' }, 0);
  tl.to(cam, { x: -3, y: 11, z: 17, fov: 40, duration: 2.6, ease: 'power2.out' }, 0);
  [...tileState.keys()].sort((a, b) => Math.hypot(tileState[a].x, tileState[a].z) - Math.hypot(tileState[b].x, tileState[b].z)).forEach((idx, k) => {
    tl.to(tileState[idx], { y: 0, r: 0, duration: 0.4, ease: 'power4.in' }, 0.6 + k * 0.045);
  });
  walls.children.forEach((w, i) => tl.to(w.scale, { y: 1, duration: 0.55, ease: 'back.out(2.2)' }, 2.6 + i * 0.1));
  tl.to(cam, { x: 7.5, y: 6.5, z: 9.5, ly: 1.6, duration: 2.4, ease: 'power2.inOut' }, 2.9);
  rails.forEach((r, i) => tl.to(r.position, { x: 0, duration: 0.6, ease: 'expo.out', onComplete: () => snap(new THREE.Vector3(0, 0.15, r.position.z)) }, 3.3 + i * 0.18));
  sides.forEach((s, i) => tl.to(s.scale, { z: 1, duration: 0.4, ease: 'expo.out' }, 3.7 + i * 0.1));
  legs.forEach((p, i) => {
    tl.to(p.scale, { ...full, duration: 0.15 }, 4.0 + i * 0.22);
    tl.to(p.rotation, { x: 0, z: 0, duration: 0.6, ease: 'back.out(1.6)', onComplete: () => snap(new THREE.Vector3(0, TOP, p.userData.sz * BEAM), 20) }, 4.0 + i * 0.22);
  });
  tl.to(spine.position, { y: TOP, duration: 0.5, ease: 'power4.in', onComplete: () => { snap(new THREE.Vector3(0, TOP, 0), 36); warm.intensity = 30; gsap.to(warm, { intensity: 10, duration: 0.5 }) } }, 5.2);
  arms.forEach((a, i) => tl.to(a.scale, { x: 1, duration: 0.4, ease: 'expo.out' }, 5.7 + i * 0.1));
  tl.to(sign.scale, { y: 1, duration: 0.45, ease: 'back.out(2.4)' }, 5.9);
  tl.to(cam, { x: 6.4, y: 5.6, z: 9.2, ly: TOP - 0.4, duration: 1.8, ease: 'sine.inOut' }, 5.2);
  pods.forEach((p, i) => {
    const at = 6.1 + i * 0.28, h = p.userData.home;
    tl.to(p.scale, { ...full, duration: 0.3 }, at);
    tl.to(p.position, { x: h.x, y: h.y, z: h.z, duration: 0.55, ease: 'expo.out', onComplete: () => { const w = new THREE.Vector3(); p.getWorldPosition(w); snap(w, 30); const m = p.userData.mat; m.emissiveIntensity = 1.6; gsap.to(m, { emissiveIntensity: 0.35, duration: 0.6 }) } }, at);
  });
  flowers.forEach((f, i) => tl.to(f.scale, { ...full, duration: 0.5, ease: 'back.out(2.4)' }, 7.0 + i * 0.12));
  nectar.forEach((r, i) => tl.to(r.scale, { z: 1, duration: 0.45, ease: 'expo.out' }, 7.3 + i * 0.12));
  [...gardens, ...trays].forEach((g, i) => tl.to(g.scale, { ...full, duration: 0.45, ease: 'back.out(2)' }, 7.5 + i * 0.1));
  lines.forEach((g, i) => tl.to(g.scale, { x: 1, duration: 0.5, ease: 'expo.out' }, 7.6 + i * 0.1));
  // finish on the orbit circle so the idle orbit picks up without a jump
  const ORBIT = { r: 20, y: 10, ly: 1.2, speed: 0.05 };
  let angle = Math.atan2(9, -9);
  tl.to(cam, { x: Math.cos(angle) * ORBIT.r, y: ORBIT.y, z: Math.sin(angle) * ORBIT.r, ly: ORBIT.ly, duration: 2.2, ease: 'sine.inOut' }, 7.0);

  /* ================= render loop ================= */
  const clock = new THREE.Clock();
  let raf = 0, moving = animate, lastOff = null;
  // how far the field slides right to leave room for the sign-in copy (0 while it plays centred)
  const shift = { v: centered ? 0 : 0.2 };
  const look = new THREE.Vector3();
  function frame() {
    raf = requestAnimationFrame(frame);
    if (document.hidden || !container.isConnected) return;
    const dt = Math.min(clock.getDelta(), 1 / 30);
    syncTiles();
    if (tl.progress() >= 1 && moving) {
      angle += dt * ORBIT.speed;
      cam.x = Math.cos(angle) * ORBIT.r; cam.z = Math.sin(angle) * ORBIT.r;
    }
    updateSparks(dt);
    sparkMat.uniforms.uPx.value = renderer.getPixelRatio();
    camera.position.set(cam.x, cam.y, cam.z);
    look.set(0, cam.ly, 0); camera.lookAt(look);
    // tall screens need a wider lens to keep the whole field in view
    const fov = Math.min(75, cam.fov * (camera.aspect < 1.25 ? 1 + (1.25 - camera.aspect) * 0.8 : 1));
    if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix() }
    // on wide screens slide the field right so the copy on the left stays readable
    const off = camera.aspect > 1.2 ? Math.round(W() * shift.v) : 0;
    if (off !== lastOff) {
      lastOff = off;
      if (off) camera.setViewOffset(W(), H(), -off, 0, W(), H()); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    }
    composer.render();
  }
  function resize() {
    const w = W(), h = H(); if (!w || !h) return;
    renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; lastOff = null;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  resize(); frame();
  if (animate) tl.play(); else { tl.progress(1, true); built() }

  return {
    // motion off: finish the build and hold the camera still
    setMotion(on) { moving = on; if (!on) { tl.progress(1, true); built() } else if (tl.progress() < 1) tl.play() },
    // slide the field aside once the sign-in copy appears
    makeRoom() { gsap.to(shift, { v: 0.2, duration: 1.2, ease: 'power2.inOut' }) },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); tl.kill();
      gsap.killTweensOf([warm, shift, ...pods.map((p) => p.userData.mat)]);
      renderer.dispose(); pmrem.dispose();
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { x?.map?.dispose?.(); x?.dispose?.() }) });
      renderer.domElement.remove();
    },
  };
}
