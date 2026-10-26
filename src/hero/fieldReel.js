// 15-second code-built 3D intro: the BIOBUZZ field assembles itself.
// Blueprint floor → foam tiles slam in → walls rise → the A-frame hive bolts
// together → hex pods and the honeycomb panel lock on → flowers, nectar rails
// and gardens arrive → camera flies through while nectar scores → title.
// No robot is ever drawn. Libraries load from a pinned CDN at runtime so the
// app's package-lock stays untouched.
const CDN = 'https://esm.sh/three@0.170.0';
const LIBS = {
  three: CDN,
  composer: `${CDN}/examples/jsm/postprocessing/EffectComposer.js`,
  render: `${CDN}/examples/jsm/postprocessing/RenderPass.js`,
  bloom: `${CDN}/examples/jsm/postprocessing/UnrealBloomPass.js`,
  shader: `${CDN}/examples/jsm/postprocessing/ShaderPass.js`,
  output: `${CDN}/examples/jsm/postprocessing/OutputPass.js`,
  room: `${CDN}/examples/jsm/environments/RoomEnvironment.js`,
  gsap: 'https://esm.sh/gsap@3.12.5',
  opentype: 'https://esm.sh/opentype.js@1.3.4',
};
const FONT_URL = 'https://cdn.jsdelivr.net/npm/@fontsource/bebas-neue@5.0.8/files/bebas-neue-latin-400-normal.woff';
export const DURATION = 15;

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

export async function createFieldReel(container, opts = {}) {
  const L = await loadLibs();
  return build(container, opts, L);
}

function build(container, { onScore, onProgress, onBeat, accent = '#FF6B00', title = 'TEAM TRACKER', subtitle = 'BIOBUZZ · 2026–27' } = {}, L) {
  const THREE = L.three;
  const gsap = L.gsap.gsap || L.gsap.default;
  const opentype = L.opentype.default || L.opentype;
  const { EffectComposer } = L.composer, { RenderPass } = L.render, { UnrealBloomPass } = L.bloom;
  const { ShaderPass } = L.shader, { OutputPass } = L.output, { RoomEnvironment } = L.room;

  const ACC = new THREE.Color(accent);
  const YEL = new THREE.Color('#FFC400');
  const RED = new THREE.Color('#E0322B');
  const BLUE = new THREE.Color('#2F55E0');
  const W = () => container.clientWidth, H = () => container.clientHeight;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- renderer / scene ---------- */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(W(), H());
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050505');
  scene.fog = new THREE.FogExp2('#050505', 0.035);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(40, W() / H(), 0.05, 200);
  const cam = { x: 0, y: 9, z: 20, lx: 0, ly: 1.5, lz: 0, roll: 0, fov: 40 };
  const shake = { v: 0 };

  scene.add(new THREE.HemisphereLight('#ffe2c4', '#0a0a0a', 0.35));
  const key = new THREE.SpotLight('#ffb070', 260, 50, Math.PI / 4.5, 0.55, 1.5);
  key.position.set(-8, 16, 10); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight('#cfe0ff', 1.3); rim.position.set(9, 8, -10); scene.add(rim);
  const warm = new THREE.PointLight(ACC, 10, 12, 1.8); warm.position.set(0, 4, 3); scene.add(warm);

  /* ---------- procedural textures ---------- */
  const canvasTex = (w, h, draw, rep) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h
    draw(c.getContext('2d'), w, h)
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8
    if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep) }
    return t
  };
  const hazardTex = (a, b, rep) => canvasTex(256, 64, (g, w, h) => {
    g.fillStyle = b; g.fillRect(0, 0, w, h); g.fillStyle = a
    for (let x = -h; x < w + h; x += 64) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 32, h); g.lineTo(x + 32 + h, 0); g.lineTo(x + h, 0); g.fill() }
  }, rep);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const noiseTex = (base, spread, streak) => canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h)
    const img = g.getImageData(0, 0, w, h)
    for (let i = 0; i < img.data.length; i += 4) {
      const y = Math.floor(i / 4 / w), n = (rnd() - 0.5) * spread + (streak ? Math.sin(y * 0.9) * streak : 0)
      img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n
    }
    g.putImageData(img, 0, 0)
  });
  const tileTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2b2b2d'; g.fillRect(0, 0, w, h)
    for (let i = 0; i < 7000; i++) { const v = 32 + rnd() * 24; g.fillStyle = `rgb(${v},${v},${v + 2})`; g.fillRect(rnd() * w, rnd() * h, 2, 2) }
    g.strokeStyle = '#141415'; g.lineWidth = 5; g.strokeRect(2, 2, w - 4, h - 4)
    g.beginPath(); for (let i = 1; i < 8; i++) { const p = (i / 8) * w; g.moveTo(p - 6, 0); g.lineTo(p, 7); g.lineTo(p + 6, 0) } g.stroke()
  });
  const honeyTex = canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#E8C547'; g.fillRect(0, 0, w, h)
    const r = 26
    for (let row = 0; row < 8; row++) for (let col = 0; col < 16; col++) {
      const cx = col * r * 1.75 + (row % 2) * r * 0.87, cy = row * r * 1.5
      if (cx > w * 0.32) continue
      g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; g[k ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r * 0.9, cy + Math.sin(a) * r * 0.9) } g.closePath()
      g.fillStyle = (row + col) % 3 ? '#FFD84A' : '#F5B900'; g.fill(); g.strokeStyle = '#7A5A00'; g.lineWidth = 3; g.stroke()
    }
    g.fillStyle = '#16120a'; g.font = '900 120px Impact, "Arial Black", sans-serif'; g.textBaseline = 'middle'
    g.fillText('BIOBUZZ', w * 0.36, h * 0.52)
  });
  const ballTex = (col) => canvasTex(128, 64, (g, w, h) => {
    g.fillStyle = col; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.55)'
    for (let y = 8; y < h; y += 14) for (let x = (y / 14) % 2 ? 6 : 13; x < w; x += 14) { g.beginPath(); g.arc(x, y, 3.2, 0, Math.PI * 2); g.fill() }
  });

  /* ---------- materials ---------- */
  const brushed = noiseTex('#888', 24, 10); brushed.colorSpace = THREE.NoColorSpace;
  const alu = new THREE.MeshStandardMaterial({ color: '#b9bdc2', metalness: 1, roughness: 0.38, roughnessMap: brushed });
  const darkAlu = new THREE.MeshStandardMaterial({ color: '#4a4d52', metalness: 0.9, roughness: 0.45, roughnessMap: brushed });
  const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex('#FFC400', '#0d0d0d', [8, 1]), roughness: 0.7 });
  const poly = new THREE.MeshPhysicalMaterial({ color: '#dfe6ee', metalness: 0, roughness: 0.08, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const rimMat = (c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, metalness: 0.3, roughness: 0.35 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: '#F2C230', roughness: 0.5, metalness: 0.1, emissive: YEL, emissiveIntensity: 0.06 });
  const redBall = new THREE.MeshStandardMaterial({ map: ballTex('#D2302A'), roughness: 0.45, emissive: RED, emissiveIntensity: 0.25 });
  const blueBall = new THREE.MeshStandardMaterial({ map: ballTex('#2D52D8'), roughness: 0.45, emissive: BLUE, emissiveIntensity: 0.25 });
  const pollenBall = new THREE.MeshStandardMaterial({ map: ballTex('#F29A12'), roughness: 0.45, emissive: new THREE.Color('#F29A12'), emissiveIntensity: 0.35 });

  /* ---------- blueprint floor ---------- */
  const floorU = { uReveal: { value: 0 }, uAcc: { value: ACC } };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShaderMaterial({
    uniforms: floorU, fog: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader: `uniform float uReveal; uniform vec3 uAcc; varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
      float grid(vec2 p, float s){ vec2 q=p/s; vec2 g=abs(fract(q-0.5)-0.5)/fwidth(q); return 1.0-min(min(g.x,g.y),1.0); }
      void main(){ float d=length(vW.xz);
        vec3 col=vec3(0.03+noise(vW.xz*2.5)*0.02+noise(vW.xz*0.35)*0.02);
        float m=smoothstep(uReveal, uReveal-3.0, d);
        float g1=grid(vW.xz,1.0)*0.35, g2=grid(vW.xz,2.0)*0.8;
        col+=vec3(0.18,0.42,0.9)*(g1+g2)*0.2*m;
        col+=uAcc*smoothstep(2.0,0.0,abs(d-uReveal))*step(0.01,uReveal)*(g1+g2+0.15)*1.5;
        gl_FragColor=vec4(col*smoothstep(46.0,7.0,d),1.0); }`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.002; scene.add(floor);

  /* ---------- field: 6×6 foam tiles (2 ft each, field is 12×12 ft) ---------- */
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1.97, 0.1, 1.97), new THREE.MeshStandardMaterial({ map: tileTex, roughness: 0.95 }), 36);
  tiles.receiveShadow = true; scene.add(tiles);
  const tileState = Array.from({ length: 36 }, (_, i) => ({ x: (i % 6) * 2 - 5, z: Math.floor(i / 6) * 2 - 5, y: 10 + rnd() * 4, r: (rnd() - 0.5) * 1.6 }));
  const dummy = new THREE.Object3D();
  const syncTiles = () => { tileState.forEach((t, i) => { dummy.position.set(t.x, t.y + 0.05, t.z); dummy.rotation.set(t.r * 0.4, t.r, t.r * 0.3); dummy.updateMatrix(); tiles.setMatrixAt(i, dummy.matrix) }); tiles.instanceMatrix.needsUpdate = true };
  syncTiles();

  const walls = new THREE.Group(); scene.add(walls);
  const panelMat = new THREE.MeshStandardMaterial({ color: '#9ab', transparent: true, opacity: 0.08, roughness: 0.05, depthWrite: false, side: THREE.DoubleSide });
  for (let s = 0; s < 4; s++) {
    const side = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(12.2, 0.07, 0.07), alu); top.position.y = 1.0; side.add(top);
    const bot = top.clone(); bot.position.y = 0.1; side.add(bot);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.88), panelMat); pane.position.y = 0.55; side.add(pane);
    for (const zz of [0.04, -0.04]) { const band = new THREE.Mesh(new THREE.PlaneGeometry(12, 0.16), hazardMat); band.position.set(0, 0.24, zz); if (zz < 0) band.rotation.y = Math.PI; side.add(band) }
    for (let k = -3; k <= 3; k++) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.05, 0.07), darkAlu); post.position.set(k * 2, 0.52, 0); side.add(post) }
    side.rotation.y = (s * Math.PI) / 2;
    side.position.set(s === 1 ? 6.05 : s === 3 ? -6.05 : 0, 0, s === 0 ? 6.05 : s === 2 ? -6.05 : 0);
    side.scale.y = 0.001; walls.add(side);
  }

  /* ---------- the hive (A-frame with four hex pods) ---------- */
  const hive = new THREE.Group(); scene.add(hive);
  const HB = { x: 1.67, z: 2.1 }, TOP = 4.1, BEAM = 1.15;
  const bar = (len, t = 0.09, mat = alu) => { const m = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), mat); m.castShadow = true; return m };
  const between = (m, a, b) => { const d = new THREE.Vector3().subVectors(b, a); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()); m.scale.y = d.length() / m.geometry.parameters.height; return m };
  // base rails along x (front/back) and side lines
  const rails = [-1, 1].map((sz) => { const r = new THREE.Mesh(new THREE.BoxGeometry(HB.x * 2 + 0.3, 0.12, 0.16), darkAlu); r.position.set(0, 0.11, sz * HB.z); r.castShadow = true; r.userData.home = r.position.clone(); r.position.x = sz * 14; hive.add(r); return r });
  // four legs: corner → beam end
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const a = new THREE.Vector3(sx * HB.x, 0.15, sz * HB.z), b = new THREE.Vector3(0, TOP, sz * BEAM);
    const pivot = new THREE.Group(); pivot.position.copy(a); hive.add(pivot);
    const leg = between(bar(1), new THREE.Vector3(), b.clone().sub(a)); pivot.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 0.28), darkAlu); pivot.add(foot);
    pivot.userData = { sx, sz, target: pivot.quaternion.clone() };
    pivot.rotation.set(sz * 1.45, 0, -sx * 0.25); pivot.scale.setScalar(0.001);
    legs.push(pivot);
  }
  // top spine along z + cross arms along x at each end
  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, BEAM * 2 + 0.4), alu); spine.position.set(0, TOP + 9, 0); spine.castShadow = true; hive.add(spine);
  const arms = [-1, 1].map((sz) => { const a = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.08, 0.08), darkAlu); a.position.set(0, TOP + 0.62, sz * BEAM); a.scale.x = 0.001; hive.add(a); return a });
  for (const sz of [-1, 1]) { const r = bar(0.66, 0.08, darkAlu); r.position.set(0, TOP + 0.31, sz * BEAM); hive.add(r) }
  // honeycomb sign panel (both faces)
  const sign = new THREE.Group(); sign.position.set(0, TOP - 0.85, 0); hive.add(sign);
  for (const r of [Math.PI / 2, -Math.PI / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.55), new THREE.MeshStandardMaterial({ map: honeyTex, roughness: 0.6, emissive: YEL, emissiveIntensity: 0.12, emissiveMap: honeyTex })); p.rotation.y = r; p.position.x = r > 0 ? 0.03 : -0.03; sign.add(p) }
  sign.scale.set(1, 0.001, 1);
  // hex pods: translucent hex tube along x with two coloured rims
  const hexShape = (r) => { const s = new THREE.Shape(); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; s[k ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r) } s.closePath(); return s };
  const rimGeo = (() => { const s = hexShape(0.82); const hole = new THREE.Path(); for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3; hole[k ? 'lineTo' : 'moveTo'](Math.cos(a) * 0.7, Math.sin(a) * 0.7) } hole.closePath(); s.holes.push(hole); const g = new THREE.ExtrudeGeometry(s, { depth: 0.07, bevelEnabled: false }); g.translate(0, 0, -0.035); return g })();
  const tubeGeo = new THREE.CylinderGeometry(0.78, 0.78, 1.3, 6, 1, true);
  const pods = [];
  for (const [sz, col] of [[-1, BLUE], [1, RED]]) for (const sx of [-1, 1]) {
    const pod = new THREE.Group();
    const tube = new THREE.Mesh(tubeGeo, poly); tube.rotation.z = Math.PI / 2; pod.add(tube);
    const mat = rimMat(col);
    for (const ex of [-0.66, 0.66]) { const rim = new THREE.Mesh(rimGeo, mat); rim.rotation.y = Math.PI / 2; rim.position.x = ex; rim.castShadow = true; pod.add(rim) }
    const axle = bar(1.4, 0.05, darkAlu); axle.rotation.z = Math.PI / 2; pod.add(axle);
    pod.position.set(sx * 1.05, TOP + 0.62, sz * BEAM);
    pod.userData = { home: pod.position.clone(), sx, sz, mat, filled: 0, tilt: sz * 0.32 };
    pod.rotation.x = pod.userData.tilt;
    pod.position.y += 7; pod.position.x += sx * 4; pod.scale.setScalar(0.001);
    hive.add(pod); pods.push(pod);
  }

  /* ---------- flowers, nectar rails, gardens ---------- */
  const ballGeo = new THREE.SphereGeometry(0.17, 20, 14);
  const flowers = [[-2, -6, 0], [6, -2, -Math.PI / 2], [2, 6, Math.PI], [-6, 2, Math.PI / 2]].map(([x, z, ry]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
    const post = bar(1.25, 0.08, darkAlu); post.position.set(0, 0.62, -0.25); g.add(post);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.34, 0.22, 6), yellowMat); pot.position.set(0, 1.3, 0.1); pot.castShadow = true; g.add(pot);
    const core = new THREE.Mesh(ballGeo, pollenBall); core.position.set(0, 1.5, 0.1); g.add(core);
    g.scale.setScalar(0.001); scene.add(g); return g;
  });
  const railBalls = [];
  const rails2 = [[-5.85, -5, BLUE, -1], [5.85, 5, RED, 1]].map(([x, z, col, dir]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 2.0), rimMat(col)); r.position.y = 0.6; g.add(r);
    for (let k = 0; k < 4; k++) { const b = new THREE.Mesh(ballGeo, pollenBall); b.position.set(0, 0.86 + 6, (k - 1.5) * 0.4 * dir); b.userData.y = 0.86; g.add(b); railBalls.push(b) }
    g.scale.set(1, 1, 0.001); scene.add(g); return g;
  });
  const gardens = [[3, -5.55, BLUE], [-3, 5.55, RED]].map(([x, z, col]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z);
    const m = rimMat(col);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2, 0.14, 0.12), m); back.position.set(0, 0.07, z < 0 ? -0.4 : 0.4); g.add(back);
    for (const sx of [-1, 1]) { const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.14, 0.9), m); arm.position.set(sx * 0.94, 0.07, 0); g.add(arm) }
    g.scale.setScalar(0.001); scene.add(g); return g;
  });

  /* ---------- sparks ---------- */
  const N = 2600;
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
  function emit(at, count, { speed = 4, up = 2, life = 0.8, size = 0.9 } = {}) {
    for (let k = 0; k < count; k++) {
      const i = (sp.i = (sp.i + 1) % N);
      sp.pos[i * 3] = at.x; sp.pos[i * 3 + 1] = at.y; sp.pos[i * 3 + 2] = at.z;
      const th = rnd() * Math.PI * 2, s = speed * (0.3 + rnd() * 0.9);
      sp.vel[i * 3] = Math.cos(th) * s; sp.vel[i * 3 + 1] = rnd() * up + s * 0.3; sp.vel[i * 3 + 2] = Math.sin(th) * s;
      sp.max[i] = life * (0.5 + rnd()); sp.life[i] = 1; sp.size[i] = size * (0.25 + rnd() * 0.55);
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

  /* ---------- scoring shots ---------- */
  const shots = [];
  function launch(from, pod, color, dur) {
    const m = new THREE.Mesh(ballGeo, color === 'red' ? redBall : blueBall); scene.add(m);
    const target = new THREE.Vector3(); pod.getWorldPosition(target);
    const ctrl = from.clone().lerp(target, 0.5); ctrl.y += 3.4;
    const s = { m, t: 0, from: from.clone(), ctrl, target, pod, done: false };
    shots.push(s);
    gsap.to(s, { t: 1, duration: dur, ease: 'power1.in', onComplete: () => {
      s.done = true; scene.remove(s.m);
      emit(s.target, 26, { speed: 4, up: 2, life: 0.6 });
      const mat = s.pod.userData.mat; mat.emissiveIntensity = 1.4; gsap.to(mat, { emissiveIntensity: 0.4, duration: 0.8 });
      gsap.fromTo(s.pod.scale, { x: 1.12, y: 1.12, z: 1.12 }, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(3)' });
      onScore?.(20);
    } });
  }

  /* ---------- title ---------- */
  const titleG = new THREE.Group(); titleG.position.set(0, TOP + 2.5, 2.4); titleG.visible = false; scene.add(titleG);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 96), new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
  ring.position.set(0, TOP + 2.5, 2.3); scene.add(ring);
  const under = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 0.16), new THREE.MeshBasicMaterial({ map: hazardTex('#FFC400', '#0b0b0b', [12, 1]), transparent: true, fog: false }));
  under.position.y = -1.0; under.scale.x = 0.001; titleG.add(under);
  let line1 = null, line2 = null;
  const flatText = (text, w, h, font, color) => {
    const c = document.createElement('canvas'); c.width = 2048; c.height = Math.round(2048 * (h / w));
    const g = c.getContext('2d'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font(c.height); g.fillStyle = color; g.fillText(text, c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t, transparent: true, fog: false })); m.userData.w = w; return m;
  };
  function textGeo(font, str, size, depth) {
    const scale = size / font.unitsPerEm, shapes = []; let x = 0;
    for (const gl of font.stringToGlyphs(str)) {
      const sp2 = new THREE.ShapePath();
      for (const c of gl.path.commands) {
        if (c.type === 'M') sp2.moveTo(x + c.x * scale, c.y * scale);
        else if (c.type === 'L') sp2.lineTo(x + c.x * scale, c.y * scale);
        else if (c.type === 'Q') sp2.quadraticCurveTo(x + c.x1 * scale, c.y1 * scale, x + c.x * scale, c.y * scale);
        else if (c.type === 'C') sp2.bezierCurveTo(x + c.x1 * scale, c.y1 * scale, x + c.x2 * scale, c.y2 * scale, x + c.x * scale, c.y * scale);
      }
      shapes.push(...sp2.toShapes(font.outlinesFormat === 'cff'));
      x += gl.advanceWidth * scale + size * 0.03;
    }
    const geo = new THREE.ExtrudeGeometry(shapes, { depth, curveSegments: 5, bevelEnabled: true, bevelThickness: depth * 0.18, bevelSize: size * 0.012, bevelSegments: 2 });
    geo.computeBoundingBox(); const bb = geo.boundingBox;
    geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -depth / 2);
    return geo;
  }
  const fontReady = fetch(FONT_URL).then((r) => r.arrayBuffer()).then((buf) => {
    const font = opentype.parse(buf);
    const face = new THREE.MeshStandardMaterial({ color: ACC, metalness: 0.7, roughness: 0.3, emissive: ACC, emissiveIntensity: 0.3 });
    const side = new THREE.MeshStandardMaterial({ color: '#2a1606', metalness: 0.9, roughness: 0.5 });
    const yel = new THREE.MeshStandardMaterial({ color: YEL, metalness: 0.4, roughness: 0.35, emissive: YEL, emissiveIntensity: 0.45 });
    line1 = new THREE.Mesh(textGeo(font, title, 1.45, 0.36), [face, side]); line1.position.y = 0.32;
    line1.geometry.computeBoundingBox(); line1.userData.w = line1.geometry.boundingBox.max.x - line1.geometry.boundingBox.min.x;
    line2 = new THREE.Mesh(textGeo(font, subtitle, 0.55, 0.16), [yel, side]); line2.position.y = -0.55;
  }).catch(() => {
    line1 = flatText(title, 9, 1.6, (h) => `900 ${h * 0.8}px Impact, "Arial Black", sans-serif`, `#${ACC.getHexString()}`); line1.position.y = 0.3;
    line2 = flatText(subtitle, 6, 0.7, (h) => `800 ${h * 0.7}px Impact, "Arial Black", sans-serif`, '#FFC400'); line2.position.y = -0.55;
  }).then(() => { line1.scale.setScalar(0.001); line2.scale.setScalar(0.001); titleG.add(line1, line2) });

  /* ---------- post ---------- */
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W(), H()), 0.5, 0.4, 0.86); composer.addPass(bloom);
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uFlash: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uTime; uniform float uFlash; varying vec2 vUv;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
      void main(){ vec2 c=vUv-0.5; float r=dot(c,c); vec2 off=c*0.0015*(1.0+r*4.0);
        vec3 col=vec3(texture2D(tDiffuse,vUv+off).r, texture2D(tDiffuse,vUv).g, texture2D(tDiffuse,vUv-off).b);
        col*=smoothstep(0.95,0.15,r*1.6); col+=(h(vUv*vec2(1920.,1080.)+uTime)-0.5)*0.04; col=mix(col, vec3(1.0,0.78,0.5), uFlash);
        gl_FragColor=vec4(col,1.0); }`,
  });
  composer.addPass(grade); composer.addPass(new OutputPass());

  /* ================= timeline ================= */
  const prevLag = gsap.ticker.lagSmoothing; gsap.ticker.lagSmoothing(0);
  const tl = gsap.timeline({ paused: true, onUpdate: () => onProgress?.(tl.time() / DURATION), onComplete: () => onProgress?.(1) });
  const beat = (label, at) => tl.call(() => onBeat?.(label), null, at);
  const snap = (p, n = 30) => { emit(p, n, { speed: 5, up: 1.6, life: 0.55 }); shake.v = Math.max(shake.v, 0.06) };

  // 0–1.6 blueprint reveal
  beat('GROUND', 0.1);
  tl.to(floorU.uReveal, { value: 32, duration: 4, ease: 'power2.inOut' }, 0);
  tl.fromTo(cam, { x: 2, y: 13, z: 22, lx: 0, ly: 0, lz: 0, fov: 34 }, { x: -3, y: 11, z: 17, fov: 40, duration: 2.6, ease: 'power2.out' }, 0);
  // 0.6–2.9 tiles slam in from the centre out
  beat('FIELD', 0.6);
  [...tileState.keys()].sort((a, b) => Math.hypot(tileState[a].x, tileState[a].z) - Math.hypot(tileState[b].x, tileState[b].z)).forEach((idx, k) => {
    const t = tileState[idx];
    tl.to(t, { y: 0, r: 0, duration: 0.4, ease: 'power4.in', onComplete: () => { if (k % 3 === 0) emit(new THREE.Vector3(t.x, 0.12, t.z), 10, { speed: 3, up: 1, life: 0.45, size: 0.7 }); if (k % 6 === 0) shake.v = Math.max(shake.v, 0.04) } }, 0.6 + k * 0.045);
  });
  // 2.6–3.6 walls rise
  walls.children.forEach((w, i) => tl.to(w.scale, { y: 1, duration: 0.55, ease: 'back.out(2.2)' }, 2.6 + i * 0.1));
  tl.to(cam, { x: 7.5, y: 6.5, z: 9.5, lx: 0, ly: 1.6, lz: 0, duration: 2.4, ease: 'power2.inOut' }, 2.9);
  // 3.3–4.3 hive base rails slide in
  beat('THE HIVE', 3.3);
  rails.forEach((r, i) => tl.to(r.position, { x: 0, duration: 0.6, ease: 'expo.out', onComplete: () => snap(new THREE.Vector3(0, 0.15, r.position.z)) }, 3.3 + i * 0.18));
  // 4.0–5.4 legs swing up and bolt in
  legs.forEach((p, i) => {
    tl.to(p.scale, { x: 1, y: 1, z: 1, duration: 0.15 }, 4.0 + i * 0.22);
    tl.to(p.rotation, { x: 0, z: 0, duration: 0.6, ease: 'back.out(1.6)', onComplete: () => snap(new THREE.Vector3(0, TOP, p.userData.sz * BEAM), 22) }, 4.0 + i * 0.22);
  });
  // 5.2–6.0 spine drops, arms extend, sign flips up
  tl.to(spine.position, { y: TOP, duration: 0.5, ease: 'power4.in', onComplete: () => { snap(new THREE.Vector3(0, TOP, 0), 40); warm.intensity = 30; gsap.to(warm, { intensity: 10, duration: 0.5 }) } }, 5.2);
  arms.forEach((a, i) => tl.to(a.scale, { x: 1, duration: 0.4, ease: 'expo.out' }, 5.7 + i * 0.1));
  tl.to(sign.scale, { y: 1, duration: 0.45, ease: 'back.out(2.4)' }, 5.9);
  tl.to(cam, { x: 6.4, y: 5.6, z: 9.2, lx: 0, ly: TOP - 0.2, lz: 0, duration: 1.8, ease: 'sine.inOut' }, 5.2);
  // 6.1–7.3 four hex pods fly in and lock
  beat('PODS LOCKED', 6.2);
  pods.forEach((p, i) => {
    const at = 6.1 + i * 0.28;
    tl.to(p.scale, { x: 1, y: 1, z: 1, duration: 0.3 }, at);
    tl.to(p.position, { x: p.userData.home.x, y: p.userData.home.y, z: p.userData.home.z, duration: 0.55, ease: 'expo.out', onComplete: () => { const w = new THREE.Vector3(); p.getWorldPosition(w); snap(w, 34); const m = p.userData.mat; m.emissiveIntensity = 1.6; gsap.to(m, { emissiveIntensity: 0.35, duration: 0.6 }) } }, at);
  });
  // 7.0–8.6 flowers, rails, gardens, pollen drops
  beat('FLOWERS', 7.1);
  flowers.forEach((f, i) => tl.to(f.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: 'back.out(2.4)' }, 7.0 + i * 0.12));
  rails2.forEach((r, i) => tl.to(r.scale, { z: 1, duration: 0.45, ease: 'expo.out' }, 7.3 + i * 0.12));
  gardens.forEach((g, i) => tl.to(g.scale, { x: 1, y: 1, z: 1, duration: 0.45, ease: 'back.out(2)' }, 7.5 + i * 0.12));
  railBalls.forEach((b, i) => tl.to(b.position, { y: b.userData.y, duration: 0.5, ease: 'bounce.out' }, 7.7 + i * 0.07));
  tl.to(cam, { x: -9, y: 5.5, z: 7, lx: 0, ly: 1.5, lz: 0, duration: 2, ease: 'sine.inOut' }, 7.0);
  // 8.6–12.4 flythrough while nectar scores into the pods
  beat('SCORE', 8.7);
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-9, 5.5, 7), new THREE.Vector3(-6.2, 1.4, 3.5), new THREE.Vector3(-3.4, 1.1, -0.2),
    new THREE.Vector3(-1.2, 1.6, -4.4), new THREE.Vector3(3.4, 2.0, -4.6), new THREE.Vector3(6.4, 2.6, -1.0), new THREE.Vector3(5.6, 4.2, 5.2),
  ], false, 'centripetal');
  const fly = { t: 0 };
  tl.to(fly, { t: 1, duration: 3.8, ease: 'sine.inOut', onUpdate: () => {
    const p = path.getPointAt(fly.t);
    cam.x = p.x; cam.y = p.y; cam.z = p.z; cam.lx = 0; cam.ly = TOP - 0.4; cam.lz = 0; cam.roll = Math.sin(fly.t * Math.PI * 2) * 0.05;
  } }, 8.6);
  tl.to(cam, { fov: 50, duration: 1.6, ease: 'sine.inOut' }, 8.8);
  tl.to(cam, { fov: 40, duration: 1.4, ease: 'sine.inOut' }, 11.0);
  const launchers = [new THREE.Vector3(-4.2, 0.4, 4.4), new THREE.Vector3(4.2, 0.4, -4.4), new THREE.Vector3(-4.4, 0.4, -4.0), new THREE.Vector3(4.4, 0.4, 4.0)];
  for (let i = 0; i < 12; i++) {
    tl.call(() => {
      const pod = pods[i % 4], red = pod.userData.sz > 0, from = launchers[i % 4];
      emit(from, 12, { speed: 2, up: 3, life: 0.4, size: 0.6 });
      launch(from, pod, red ? 'red' : 'blue', 0.85 + (i % 3) * 0.07);
    }, null, 8.9 + i * 0.25);
  }
  // 12.3–15 crane to the hero shot, title slams
  beat('READY', 12.3);
  tl.to(cam, { x: 0, y: TOP + 2.6, z: 11.5, lx: 0, ly: TOP + 1.5, lz: 0, roll: 0, fov: 38, duration: 1.2, ease: 'power3.out' }, 12.3);
  tl.to(scene.fog, { density: 0.055, duration: 1 }, 12.4);
  tl.call(() => { titleG.visible = true }, null, 12.8);
  tl.fromTo(titleG.position, { z: 8 }, { z: 2.4, duration: 0.5, ease: 'expo.in' }, 12.85);
  tl.to({}, { duration: 0.5, onUpdate() { const s = 0.001 + this.progress() * 0.999; line1?.scale.set(s * 1.4 - (s - 1) * 0.4, s, s) } }, 12.85);
  tl.call(() => {
    line1?.scale.set(1, 1, 1); shake.v = 0.3;
    grade.uniforms.uFlash.value = 0.3; gsap.to(grade.uniforms.uFlash, { value: 0, duration: 0.7 });
    gsap.fromTo(ring.scale, { x: 0.5, y: 0.5 }, { x: 9, y: 9, duration: 1.1, ease: 'expo.out' });
    gsap.fromTo(ring.material, { opacity: 1 }, { opacity: 0, duration: 1.1 });
    for (let k = -6; k <= 6; k++) emit(new THREE.Vector3(k * 0.55, TOP + 2.3, 2.6), 8, { speed: 5, up: 3, life: 0.9, size: 1 });
  }, null, 13.35);
  tl.to({}, { duration: 0.45, onUpdate() { const s = gsap.parseEase('back.out(2.4)')(this.progress()); line2?.scale.setScalar(Math.max(0.001, s)) } }, 13.55);
  tl.to(under.scale, { x: 1, duration: 0.55, ease: 'expo.out' }, 13.8);
  tl.to(cam, { z: 10.6, duration: 1.1, ease: 'sine.out' }, 13.85);
  tl.to({}, { duration: 0.01 }, DURATION);

  /* ================= render loop ================= */
  const clock = new THREE.Clock();
  let raf = 0, visible = true, t0 = 0;
  const look = new THREE.Vector3();
  function frame() {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 1 / 30), time = (t0 += dt);
    grade.uniforms.uTime.value = time;
    syncTiles();
    for (const s of shots) {
      if (s.done) continue;
      const u = s.t, iu = 1 - u;
      s.m.position.set(iu * iu * s.from.x + 2 * iu * u * s.ctrl.x + u * u * s.target.x, iu * iu * s.from.y + 2 * iu * u * s.ctrl.y + u * u * s.target.y, iu * iu * s.from.z + 2 * iu * u * s.ctrl.z + u * u * s.target.z);
      s.m.rotation.x += dt * 8;
      emit(s.m.position, 1, { speed: 0.4, up: 0.2, life: 0.25, size: 0.5 });
    }
    pods.forEach((p) => { if (p.scale.x > 0.99) p.rotation.x = p.userData.tilt + Math.sin(time * 0.9 + p.userData.sx) * 0.04 });
    updateSparks(dt);
    sparkMat.uniforms.uPx.value = renderer.getPixelRatio();
    shake.v *= Math.pow(0.02, dt);
    camera.position.set(cam.x + (rnd() - 0.5) * shake.v, cam.y + (rnd() - 0.5) * shake.v, cam.z + (rnd() - 0.5) * shake.v * 0.5);
    look.set(cam.lx, cam.ly, cam.lz); camera.lookAt(look); camera.rotateZ(cam.roll);
    if (camera.fov !== cam.fov) { camera.fov = cam.fov; camera.updateProjectionMatrix() }
    if (line1?.userData.w) {
      const dist = Math.max(1, camera.position.z - titleG.position.z);
      const vis = 2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect;
      titleG.scale.setScalar(Math.min(1, (vis * 0.84) / line1.userData.w));
    }
    key.target.position.set(cam.lx * 0.5, 0, cam.lz * 0.5);
    composer.render();
  }
  function resize() {
    const w = W(), h = H(); if (!w || !h) return;
    renderer.setSize(w, h); composer.setSize(w, h); bloom.setSize(w, h);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(container);
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) clock.getDelta() }, { threshold: 0.01 }); io.observe(container);
  resize(); frame();
  if (reduced) fontReady.then(() => { tl.progress(1, true); tl.pause(); titleG.visible = true; line1?.scale.set(1, 1, 1); line2?.scale.set(1, 1, 1) });
  else fontReady.finally(() => tl.play());

  return {
    restart() { shots.forEach((s) => { if (!s.done) scene.remove(s.m); gsap.killTweensOf(s) }); shots.length = 0; tl.restart() },
    toggle() { if (tl.paused()) tl.play(); else tl.pause(); return !tl.paused() },
    seek(t) { tl.pause(); tl.seek(t, false) },
    dispose() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); tl.kill();
      shots.forEach((s) => gsap.killTweensOf(s)); gsap.killTweensOf([warm, ring.scale, ring.material, grade.uniforms.uFlash]);
      gsap.ticker.lagSmoothing(500, 33); void prevLag;
      renderer.dispose(); pmrem.dispose();
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : [m]).forEach((x) => { x?.map?.dispose?.(); x?.dispose?.() }) });
      renderer.domElement.remove();
    },
  };
}
