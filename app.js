// NebulaTouch v5 — Crystal Expanse
// ===================================

// --- Audio System ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, dur, type = 'sine') {
    if (!S.soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass'; filter.frequency.value = 3000;
        osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
        osc.frequency.value = freq; osc.type = type;
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
        osc.start(); osc.stop(audioCtx.currentTime + dur);
    } catch (e) { }
}
const NOTES = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
function playNote(idx) { playSound(NOTES[idx % NOTES.length], 0.15, 'sine'); }

// --- Config ---
const CFG = {
    particles: 18000, camZ: 50, minZ: 10, maxZ: 200,
    swipeThresh: 0.6, pinchThresh: 0.07, clapThresh: 0.2, pushPullThresh: 0.04,
    starCount: 3000
};

// --- State ---
const S = {
    hand: { x: 0, y: 0 }, hand2: { x: 0, y: 0 },
    lastHX: 0, lastHY: 0, lastHDist: 0, velocity: 0,
    pinchDist: 0.1, isPinching: false,
    swipeCD: 0, shapeIdx: 0, gestCD: 0, handCount: 0,
    autoRotate: false, gravity: false, mirror: false,
    freeze: false, trails: false, soundEnabled: true,
    rainbow: false, pulsate: false, warp: false,
    explosion: false, wave: false, vortex: false,
    speed: 0.12, expansionF: 1,
    smoothRot: { x: 0, y: 0 }, targetRot: { x: 0, y: 0 },
    mouseDown: false, mouseX: 0, mouseY: 0, mouseDX: 0, mouseDY: 0,
    fps: 60, lastTime: performance.now(), frameCount: 0, fpsTime: 0, currentGesture: null
};

// --- UI Helpers ---
function toggleUI() { document.getElementById('ui').classList.toggle('minimized'); }
function togFx() { document.getElementById('fx-panel').classList.toggle('minimized'); }
function togSec(id) { document.getElementById(id).classList.toggle('closed'); }

function updateDetect(n) {
    const b = document.getElementById('detect-bar');
    if (n === 0) { b.className = 'detect-bar none'; b.textContent = '❌ No hands detected — use mouse'; }
    else if (n === 1) { b.className = 'detect-bar ok'; b.textContent = '✅ 1 hand tracked'; }
    else { b.className = 'detect-bar ok'; b.textContent = '✅ 2 hands tracked'; }
}

function showFB(emoji) {
    const fb = document.getElementById('gesture-fb');
    fb.textContent = emoji; fb.classList.add('show');
    setTimeout(() => fb.classList.remove('show'), 600);
}

function setGestureLive(emoji, name) {
    const el = document.getElementById('gesture-live');
    if (name) {
        el.innerHTML = `<span class="g-emoji">${emoji}</span> <span>${name}</span>`;
    } else {
        el.innerHTML = '<span style="opacity:.5">Awaiting gesture…</span>';
    }
}

// --- Effects Panel ---
const FX_LIST = [
    { id: 'autoRotate', label: 'Auto-Rotate', key: 'autoRotate' },
    { id: 'gravity', label: 'Gravity', key: 'gravity' },
    { id: 'mirror', label: 'Mirror', key: 'mirror' },
    { id: 'freeze', label: 'Freeze', key: 'freeze' },
    { id: 'trails', label: 'Trails', key: 'trails' },
    { id: 'soundEnabled', label: 'Sound', key: 'soundEnabled' },
    { id: 'rainbow', label: 'Rainbow', key: 'rainbow' },
    { id: 'pulsate', label: 'Pulsate', key: 'pulsate' },
    { id: 'warp', label: 'Warp', key: 'warp' }
];

function buildFxPanel() {
    const grid = document.getElementById('fx-grid');
    grid.innerHTML = FX_LIST.map(f =>
        `<div class="fx-item ${S[f.key] ? 'on' : 'off'}" id="fx-${f.id}"><span>${f.label}</span><span class="dot"></span></div>`
    ).join('');
}

function updateFx(key) {
    const el = document.getElementById('fx-' + key);
    if (el) el.className = 'fx-item ' + (S[key] ? 'on' : 'off');
}
function updateAllFx() { FX_LIST.forEach(f => updateFx(f.id)); }

// --- THREE.JS Setup ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x020208, 0.008);

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
camera.position.z = CFG.camZ;

const renderer = new THREE.WebGLRenderer({
    antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true
});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
document.body.appendChild(renderer.domElement);

// Lights
scene.add(new THREE.AmbientLight(0x404040, 0.4));
const pL1 = new THREE.PointLight(0x00ffe5, 1.5, 120); pL1.position.set(25, 25, 25); scene.add(pL1);
const pL2 = new THREE.PointLight(0x7b61ff, 1.2, 120); pL2.position.set(-25, -25, 25); scene.add(pL2);
const pL3 = new THREE.PointLight(0xff6b9d, 0.6, 80); pL3.position.set(0, 30, -20); scene.add(pL3);

// --- Starfield ---
const starGeo = new THREE.BufferGeometry();
const starPos = new Float32Array(CFG.starCount * 3);
const starCols = new Float32Array(CFG.starCount * 3);
for (let i = 0; i < CFG.starCount; i++) {
    const i3 = i * 3;
    starPos[i3] = (Math.random() - .5) * 600;
    starPos[i3 + 1] = (Math.random() - .5) * 600;
    starPos[i3 + 2] = (Math.random() - .5) * 600;
    const b = 0.3 + Math.random() * 0.7;
    const tint = Math.random();
    starCols[i3] = b * (tint > .7 ? 1 : .8);
    starCols[i3 + 1] = b * (tint > .5 ? 1 : .85);
    starCols[i3 + 2] = b;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starCols, 3));
const starMat = new THREE.PointsMaterial({ size: .6, vertexColors: true, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending });
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);

// --- Particle System ---
const geo = new THREE.BufferGeometry();
const pos = new Float32Array(CFG.particles * 3);
const tgt = new Float32Array(CFG.particles * 3);
const vel = new Float32Array(CFG.particles * 3);
const col = new Float32Array(CFG.particles * 3);

for (let i = 0; i < CFG.particles; i++) {
    const i3 = i * 3;
    pos[i3] = pos[i3 + 1] = pos[i3 + 2] = (Math.random() - .5) * 100;
    tgt[i3] = pos[i3]; tgt[i3 + 1] = pos[i3 + 1]; tgt[i3 + 2] = pos[i3 + 2];
    vel[i3] = vel[i3 + 1] = vel[i3 + 2] = 0;
    col[i3] = col[i3 + 1] = col[i3 + 2] = 1;
}
geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

// Sprite texture for glow
const spriteCanvas = document.createElement('canvas');
spriteCanvas.width = spriteCanvas.height = 64;
const sCtx = spriteCanvas.getContext('2d');
const grad = sCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
grad.addColorStop(0, 'rgba(255,255,255,1)');
grad.addColorStop(0.15, 'rgba(255,255,255,0.8)');
grad.addColorStop(0.4, 'rgba(255,255,255,0.3)');
grad.addColorStop(1, 'rgba(255,255,255,0)');
sCtx.fillStyle = grad; sCtx.fillRect(0, 0, 64, 64);
const spriteTexture = new THREE.CanvasTexture(spriteCanvas);

const mat = new THREE.PointsMaterial({
    size: 0.7, vertexColors: true, blending: THREE.AdditiveBlending,
    transparent: true, opacity: 0.9, depthWrite: false,
    map: spriteTexture, sizeAttenuation: true
});

const particles = new THREE.Points(geo, mat);
scene.add(particles);

// --- Shapes (8 total) ---
const shapes = {
    sphere: (i) => {
        const r = 12, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        return [r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), 0.05, 0.85, 0.95];
    },
    heart: (i) => {
        const t = Math.random() * Math.PI * 2, s = 0.8;
        const x = 16 * Math.pow(Math.sin(t), 3) * s;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
        return [x, y, (Math.random() - .5) * 6, 1.0, 0.15, 0.35];
    },
    cube: (i) => {
        const face = Math.floor(Math.random() * 6), u = (Math.random() - .5) * 20, v = (Math.random() - .5) * 20;
        let x, y, z;
        if (face === 0) { x = 10; y = u; z = v } else if (face === 1) { x = -10; y = u; z = v }
        else if (face === 2) { x = u; y = 10; z = v } else if (face === 3) { x = u; y = -10; z = v }
        else if (face === 4) { x = u; y = v; z = 10 } else { x = u; y = v; z = -10 }
        return [x, y, z, 0.2, 0.95, 0.85];
    },
    galaxy: (i) => {
        const arm = Math.floor(Math.random() * 4), t = Math.random() * Math.PI * 5;
        const r = t * 2, a = (arm / 4) * Math.PI * 2;
        return [r * Math.cos(t + a), (Math.random() - .5) * 2.5, r * Math.sin(t + a), 0.85, 0.6, 1.0];
    },
    dna: (i) => {
        const t = (i / CFG.particles) * Math.PI * 8, r = 6, s = i % 2;
        return [r * Math.cos(t + s * Math.PI), (i / CFG.particles - .5) * 35, r * Math.sin(t + s * Math.PI), s ? 1.0 : 0.1, 0.3, s ? 0.15 : 1.0];
    },
    torusKnot: (i) => {
        const t = Math.random() * Math.PI * 4, p = 2, q = 3, r = 8, tube = 3;
        const cx = (r + tube * Math.cos(q * t)) * Math.cos(p * t);
        const cy = (r + tube * Math.cos(q * t)) * Math.sin(p * t);
        const cz = tube * Math.sin(q * t);
        return [cx * .8, cy * .8, cz * .8, 0.95, 0.45, 0.9];
    },
    star: (i) => {
        const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
        const spike = Math.abs(Math.sin(th * 2.5)) * 8 + 4;
        const r = spike * (0.8 + Math.random() * 0.2);
        return [r * Math.sin(ph) * Math.cos(th), r * Math.sin(ph) * Math.sin(th), r * Math.cos(ph), 1.0, 0.85, 0.15];
    },
    tornado: (i) => {
        const t = (i / CFG.particles) * Math.PI * 6, h = (i / CFG.particles - .5) * 30;
        const r = Math.abs(h) * 0.5 + 1;
        return [r * Math.cos(t * 3), h, r * Math.sin(t * 3), 0.4, 0.9, 0.95];
    }
};
const shapeKeys = Object.keys(shapes);

// Color palettes
const PALETTES = [
    null, // shape default
    [[1, .2, .4], [1, .4, .6], [.9, .1, .3]], // crimson
    [[.1, .9, .8], [.2, 1, .6], [0, .7, .9]],  // teal
    [[.95, .75, .2], [1, .5, .1], [.9, .9, .3]], // gold
    [[.5, .2, 1], [.8, .4, 1], [.3, .1, .9]], // purple
    [[.1, .95, .1], [.4, 1, .2], [0, .8, .5]], // neo green
];
let paletteIdx = 0;

function morphTo(name) {
    const fn = shapes[name];
    for (let i = 0; i < CFG.particles; i++) {
        const [x, y, z, r, g, b] = fn(i);
        const i3 = i * 3;
        tgt[i3] = x; tgt[i3 + 1] = y; tgt[i3 + 2] = z;
        if (!S.rainbow) { col[i3] = r; col[i3 + 1] = g; col[i3 + 2] = b; }
    }
    geo.attributes.color.needsUpdate = true;
    document.getElementById('s-shape').textContent = name.toUpperCase();
    document.getElementById('mode-label').textContent = name.toUpperCase();
    playNote(S.shapeIdx);
}

function nextShape(dir) {
    S.shapeIdx = (S.shapeIdx + dir + shapeKeys.length) % shapeKeys.length;
    morphTo(shapeKeys[S.shapeIdx]);
    showFB(dir > 0 ? '➡️' : '⬅️');
}

function randomizeColors() {
    paletteIdx = (paletteIdx + 1) % PALETTES.length;
    const pal = PALETTES[paletteIdx];
    for (let i = 0; i < CFG.particles; i++) {
        const i3 = i * 3;
        if (pal) {
            const c = pal[Math.floor(Math.random() * pal.length)];
            const v = 0.8 + Math.random() * 0.2;
            col[i3] = c[0] * v; col[i3 + 1] = c[1] * v; col[i3 + 2] = c[2] * v;
        } else {
            const h = Math.random();
            const c = new THREE.Color().setHSL(h, 1, .55);
            col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
        }
    }
    geo.attributes.color.needsUpdate = true;
    showFB('🎨'); playSound(800, .15, 'square');
}

function resetView() {
    particles.rotation.set(0, 0, 0);
    particles.scale.set(1, 1, 1);
    camera.position.z = CFG.camZ;
    S.speed = .12; S.expansionF = 1;
    showFB('🔄'); playSound(300, .2, 'triangle');
}

function resetAll() {
    resetView();
    S.autoRotate = S.gravity = S.mirror = S.freeze = S.rainbow = S.pulsate = S.warp = S.wave = S.vortex = false;
    S.soundEnabled = true; S.trails = false; S.expansionF = 1;
    updateAllFx(); showFB('🔄');
}

function explode() {
    S.explosion = true;
    for (let i = 0; i < CFG.particles; i++) {
        const i3 = i * 3;
        vel[i3] = (Math.random() - .5) * 6;
        vel[i3 + 1] = (Math.random() - .5) * 6;
        vel[i3 + 2] = (Math.random() - .5) * 6;
    }
    showFB('💥'); playSound(80, .5, 'sawtooth');
    setTimeout(() => { S.explosion = false; }, 2500);
}

function takeScreenshot() {
    renderer.render(scene, camera);
    const a = document.createElement('a');
    a.download = 'NebulaTouch_' + Date.now() + '.png';
    a.href = renderer.domElement.toDataURL();
    a.click();
    showFB('📸'); playSound(800, .1);
}

// --- Gesture Detection ---
function detectGesture(lm) {
    const tips = [lm[4], lm[8], lm[12], lm[16], lm[20]];
    const mcps = [null, lm[5], lm[9], lm[13], lm[17]];
    const wrist = lm[0];
    const ext = (tip, mcp) => tip.y < mcp.y - 0.02;
    const iE = ext(tips[1], mcps[1]), mE = ext(tips[2], mcps[2]), rE = ext(tips[3], mcps[3]), pE = ext(tips[4], mcps[4]);

    if (!iE && !mE && !rE && !pE) return 'fist';
    if (iE && mE && rE && pE) {
        const mr = Math.abs(tips[2].x - tips[3].x), im = Math.abs(tips[1].x - tips[2].x);
        if (mr > im * 1.8) return 'vulcan';
        return 'open_palm';
    }
    if (iE && mE && !rE && !pE) return 'peace';
    if (!iE && !mE && !rE && !pE && tips[0].y < wrist.y - .1) return 'thumbs_up';
    if (!iE && !mE && !rE && !pE && tips[0].y > wrist.y + .1) return 'thumbs_down';
    if (iE && !mE && !rE && !pE && tips[1].y < wrist.y - .15) return 'point_up';
    if (iE && !mE && !rE && !pE && tips[1].y > wrist.y + .05) return 'point_down';
    if (iE && !mE && !rE && pE) return 'rock';
    if (!iE && !mE && !rE && pE) return 'hang_loose';
    const td = Math.sqrt((tips[0].x - tips[1].x) ** 2 + (tips[0].y - tips[1].y) ** 2);
    if (td < .04 && mE && rE && pE) return 'ok_sign';
    return null;
}

function detectTwoHand(h1, h2) {
    const i1 = h1[8], i2 = h2[8], t1 = h1[4], t2 = h2[4];
    const hd = Math.sqrt((i1.x - i2.x) ** 2 + (i1.y - i2.y) ** 2);
    const hdc = hd - S.lastHDist; S.lastHDist = hd;
    const g1 = detectGesture(h1), g2 = detectGesture(h2);
    if (hd < CFG.clapThresh) return 'clap';
    if (g1 === 'peace' && g2 === 'peace') return 'both_peace';
    if (g1 === 'open_palm' && g2 === 'open_palm') return 'both_open';
    const p1 = Math.sqrt((i1.x - t1.x) ** 2 + (i1.y - t1.y) ** 2);
    const p2 = Math.sqrt((i2.x - t2.x) ** 2 + (i2.y - t2.y) ** 2);
    if (p1 < CFG.pinchThresh && p2 < CFG.pinchThresh) return 'both_pinch';
    if (Math.abs(hdc) > CFG.pushPullThresh) return hdc > 0 ? 'push_apart' : 'pull_together';
    return null;
}

const GESTURE_NAMES = {
    fist: 'Fist ✊', open_palm: 'Open Palm 🖐️', peace: 'Peace ✌️', thumbs_up: 'Thumbs Up 👍',
    thumbs_down: 'Thumbs Down 👎', point_up: 'Point Up ☝️', point_down: 'Point Down 👇',
    rock: 'Rock 🤘', vulcan: 'Vulcan 🖖', hang_loose: 'Hang Loose 🤙', ok_sign: 'OK 👌',
    clap: 'Clap 👏', both_peace: 'Both Peace ✌️✌️', both_open: 'Both Open 🤲',
    both_pinch: 'Zoom 🤏🤏', push_apart: 'Push Apart 👐', pull_together: 'Pull Together 🤜🤛'
};

// --- MediaPipe Handler ---
function onResults(results) {
    const hc = results.multiHandLandmarks ? results.multiHandLandmarks.length : 0;
    S.handCount = hc;
    document.getElementById('s-hands').textContent = hc;
    updateDetect(hc);

    const hc1 = document.getElementById('hc1'), hc2 = document.getElementById('hc2');
    if (hc >= 1) {
        const idx = results.multiHandLandmarks[0][8];
        hc1.style.left = (idx.x * innerWidth) + 'px';
        hc1.style.top = (idx.y * innerHeight) + 'px';
        hc1.classList.add('visible');
    } else hc1.classList.remove('visible');
    if (hc >= 2) {
        const idx = results.multiHandLandmarks[1][8];
        hc2.style.left = (idx.x * innerWidth) + 'px';
        hc2.style.top = (idx.y * innerHeight) + 'px';
        hc2.classList.add('visible');
    } else hc2.classList.remove('visible');

    const zp = Math.round((CFG.camZ / camera.position.z) * 100);
    document.getElementById('s-zoom').textContent = zp + '%';

    if (hc > 0) {
        const lm = results.multiHandLandmarks[0];
        const idxF = lm[8], thumb = lm[4];
        const x = (idxF.x - .5) * -40, y = (idxF.y - .5) * -30;
        S.velocity = x - S.lastHX; S.lastHX = x; S.lastHY = y;
        S.hand.x = x; S.hand.y = y;
        const dist = Math.sqrt((idxF.x - thumb.x) ** 2 + (idxF.y - thumb.y) ** 2);
        S.pinchDist = dist; S.isPinching = dist < CFG.pinchThresh;

        if (hc === 2) {
            const lm2 = results.multiHandLandmarks[1];
            const i2 = lm2[8];
            S.hand2.x = (i2.x - .5) * -40; S.hand2.y = (i2.y - .5) * -30;
            const thg = detectTwoHand(lm, lm2);
            if (thg) setGestureLive(thg in GESTURE_NAMES ? '🤲' : '🖐️', GESTURE_NAMES[thg] || thg);
            if (S.gestCD <= 0 && thg) {
                if (thg === 'both_open') { S.gravity = !S.gravity; updateFx('gravity'); showFB(S.gravity ? '🌌' : '⭕'); playSound(600, .2); S.gestCD = 30; }
                else if (thg === 'both_peace') { S.mirror = !S.mirror; updateFx('mirror'); showFB(S.mirror ? '🪞' : '⭕'); playSound(700, .2, 'triangle'); S.gestCD = 30; }
                else if (thg === 'clap') { showFB('💫'); playSound(150, .3); S.gestCD = 30; }
                else if (thg === 'both_pinch') {
                    const i1 = lm[8], i2x = lm2[8];
                    const zd = Math.sqrt((i1.x - i2x.x) ** 2 + (i1.y - i2x.y) ** 2);
                    const tz = CFG.minZ + (1 - Math.min(zd, 1)) * (CFG.maxZ - CFG.minZ);
                    camera.position.z += (tz - camera.position.z) * .1;
                }
                else if (thg === 'push_apart') { S.expansionF = Math.min(S.expansionF + .05, 3); showFB('👐'); }
                else if (thg === 'pull_together') { S.expansionF = Math.max(S.expansionF - .05, .3); showFB('🤜🤛'); }
            }
        }

        const g = detectGesture(lm);
        if (g) setGestureLive(GESTURE_NAMES[g] ? GESTURE_NAMES[g].split(' ').pop() : '🖐️', GESTURE_NAMES[g] || g);
        if (S.gestCD <= 0 && g) {
            if (g === 'peace') { S.autoRotate = !S.autoRotate; updateFx('autoRotate'); showFB(S.autoRotate ? '🔄' : '⏸️'); playSound(500, .15); S.gestCD = 30; }
            else if (g === 'thumbs_up') { randomizeColors(); S.gestCD = 30; }
            else if (g === 'thumbs_down') { resetView(); S.gestCD = 30; }
            else if (g === 'point_up') { S.speed = Math.min(S.speed + .02, .3); showFB('⚡'); playSound(900, .1, 'square'); S.gestCD = 20; }
            else if (g === 'point_down') { S.speed = Math.max(S.speed - .02, .02); showFB('🐌'); playSound(300, .1, 'square'); S.gestCD = 20; }
            else if (g === 'rock') { explode(); S.gestCD = 60; }
            else if (g === 'vulcan') { S.freeze = !S.freeze; updateFx('freeze'); showFB(S.freeze ? '❄️' : '🔥'); playSound(400, .2, 'triangle'); S.gestCD = 30; }
            else if (g === 'hang_loose') { S.wave = !S.wave; showFB(S.wave ? '🌊' : '⭕'); playSound(600, .2); S.gestCD = 30; }
            else if (g === 'ok_sign') { S.vortex = !S.vortex; showFB(S.vortex ? '🌀' : '⭕'); playSound(700, .2, 'triangle'); S.gestCD = 30; }
            else if (g === 'fist') { S.expansionF = Math.max(S.expansionF - .1, .3); showFB('✊'); S.gestCD = 15; }
            else if (g === 'open_palm') { S.expansionF = Math.min(S.expansionF + .1, 3); showFB('🖐️'); S.gestCD = 15; }
        } else if (S.gestCD > 0) S.gestCD--;

        if (S.swipeCD <= 0) {
            if (S.velocity > CFG.swipeThresh) { nextShape(1); S.swipeCD = 20; }
            else if (S.velocity < -CFG.swipeThresh) { nextShape(-1); S.swipeCD = 20; }
        } else S.swipeCD--;
    } else {
        setGestureLive(null);
    }
}

// --- Mouse/Touch Fallback ---
renderer.domElement.addEventListener('mousedown', e => { S.mouseDown = true; S.mouseX = e.clientX; S.mouseY = e.clientY; });
renderer.domElement.addEventListener('mousemove', e => {
    if (!S.mouseDown) return;
    S.mouseDX = (e.clientX - S.mouseX) * 0.005;
    S.mouseDY = (e.clientY - S.mouseY) * 0.005;
    particles.rotation.y += S.mouseDX;
    particles.rotation.x += S.mouseDY;
    S.mouseX = e.clientX; S.mouseY = e.clientY;
});
window.addEventListener('mouseup', () => { S.mouseDown = false; });
renderer.domElement.addEventListener('wheel', e => {
    camera.position.z = Math.max(CFG.minZ, Math.min(CFG.maxZ, camera.position.z + e.deltaY * 0.05));
    const zp = Math.round((CFG.camZ / camera.position.z) * 100);
    document.getElementById('s-zoom').textContent = zp + '%';
}, { passive: true });

// Touch
let touchStartDist = 0;
renderer.domElement.addEventListener('touchstart', e => {
    if (e.touches.length === 1) { S.mouseDown = true; S.mouseX = e.touches[0].clientX; S.mouseY = e.touches[0].clientY; }
    if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
    }
}, { passive: true });
renderer.domElement.addEventListener('touchmove', e => {
    if (e.touches.length === 1 && S.mouseDown) {
        const dx = (e.touches[0].clientX - S.mouseX) * .005, dy = (e.touches[0].clientY - S.mouseY) * .005;
        particles.rotation.y += dx; particles.rotation.x += dy;
        S.mouseX = e.touches[0].clientX; S.mouseY = e.touches[0].clientY;
    }
    if (e.touches.length === 2) {
        const ddx = e.touches[0].clientX - e.touches[1].clientX;
        const ddy = e.touches[0].clientY - e.touches[1].clientY;
        const d = Math.sqrt(ddx * ddx + ddy * ddy);
        camera.position.z = Math.max(CFG.minZ, Math.min(CFG.maxZ, camera.position.z - (d - touchStartDist) * .1));
        touchStartDist = d;
    }
}, { passive: true });
renderer.domElement.addEventListener('touchend', () => { S.mouseDown = false; }, { passive: true });

// --- Keyboard ---
window.addEventListener('keydown', e => {
    switch (e.key.toLowerCase()) {
        case 't': S.trails = !S.trails; updateFx('trails'); showFB(S.trails ? '✨' : '⭕'); break;
        case 's': S.soundEnabled = !S.soundEnabled; updateFx('soundEnabled'); showFB(S.soundEnabled ? '🔊' : '🔇'); break;
        case 'r': S.rainbow = !S.rainbow; updateFx('rainbow'); showFB(S.rainbow ? '🌈' : '⭕'); break;
        case 'p': S.pulsate = !S.pulsate; updateFx('pulsate'); showFB(S.pulsate ? '💓' : '⭕'); break;
        case 'c': takeScreenshot(); break;
        case 'w': S.warp = !S.warp; updateFx('warp'); showFB(S.warp ? '🚀' : '⭕'); break;
        case 'n': nextShape(1); break;
        case 'b': nextShape(-1); break;
        case ' ': e.preventDefault(); explode(); break;
    }
});

// --- Animation Loop ---
let frame = 0;
function animate(now) {
    requestAnimationFrame(animate);

    // FPS
    frame++;
    const dt = (now - S.lastTime) / 1000 || 0.016;
    S.lastTime = now;
    S.fpsTime += dt;
    S.frameCount++;
    if (S.fpsTime >= 0.5) {
        S.fps = Math.round(S.frameCount / S.fpsTime);
        document.getElementById('s-fps').textContent = S.fps;
        S.fpsTime = 0; S.frameCount = 0;
    }

    // Stars drift
    stars.rotation.y += 0.00008;
    stars.rotation.x += 0.00003;

    // Light animation
    const lt = now * 0.001;
    pL1.position.x = Math.sin(lt * 0.3) * 30;
    pL1.position.y = Math.cos(lt * 0.4) * 25;
    pL2.position.x = Math.cos(lt * 0.2) * 28;
    pL2.position.z = Math.sin(lt * 0.35) * 25;

    if (!S.freeze) {
        const p = geo.attributes.position.array;
        const spd = S.warp ? S.speed * 3 : S.speed;

        for (let i = 0; i < CFG.particles; i++) {
            const i3 = i * 3;
            if (S.explosion) {
                p[i3] += vel[i3]; p[i3 + 1] += vel[i3 + 1]; p[i3 + 2] += vel[i3 + 2];
                vel[i3] *= .95; vel[i3 + 1] *= .95; vel[i3 + 2] *= .95;
            } else if (S.gravity && S.handCount > 0) {
                const dx = S.hand.x - p[i3], dy = S.hand.y - p[i3 + 1];
                const d = Math.sqrt(dx * dx + dy * dy) + .1;
                const f = .5 / (d * d);
                vel[i3] += dx * f; vel[i3 + 1] += dy * f;
                p[i3] += vel[i3]; p[i3 + 1] += vel[i3 + 1];
                vel[i3] *= .95; vel[i3 + 1] *= .95;
            } else if (S.vortex) {
                const a = Math.atan2(p[i3 + 1], p[i3]);
                vel[i3] = -Math.sin(a) * .5; vel[i3 + 1] = Math.cos(a) * .5;
                p[i3] += vel[i3]; p[i3 + 1] += vel[i3 + 1];
            } else {
                const ease = 1 - Math.pow(1 - spd, 2);
                const tx = tgt[i3] * S.expansionF, ty = tgt[i3 + 1] * S.expansionF, tz = tgt[i3 + 2] * S.expansionF;
                p[i3] += (tx - p[i3]) * ease;
                p[i3 + 1] += (ty - p[i3 + 1]) * ease;
                p[i3 + 2] += (tz - p[i3 + 2]) * ease;
                if (S.wave) p[i3 + 1] += Math.sin(frame * .05 + i * .01) * 2;
            }
            if (S.mirror) p[i3] = -p[i3];
            if (S.rainbow) {
                const h = (frame * .0015 + i / CFG.particles) % 1;
                const c = new THREE.Color().setHSL(h, .9, .55);
                col[i3] = c.r; col[i3 + 1] = c.g; col[i3 + 2] = c.b;
            }
        }
        geo.attributes.position.needsUpdate = true;
        if (S.rainbow) geo.attributes.color.needsUpdate = true;

        if (S.autoRotate) {
            particles.rotation.y += .006;
            particles.rotation.x += .002;
        } else if (S.handCount > 0 && Math.abs(S.velocity) < .3) {
            S.targetRot.y = S.hand.x * .002;
            S.targetRot.x = -S.hand.y * .002;
            S.smoothRot.y += (S.targetRot.y - S.smoothRot.y) * .1;
            S.smoothRot.x += (S.targetRot.x - S.smoothRot.x) * .1;
            particles.rotation.y += S.smoothRot.y;
            particles.rotation.x += S.smoothRot.x;
        }

        if (S.pulsate) {
            particles.scale.setScalar(1 + Math.sin(frame * .05) * .2);
        } else if (S.handCount > 0) {
            const ts = Math.max(.5, Math.min(3, S.pinchDist * 10));
            particles.scale.setScalar(particles.scale.x + (ts - particles.scale.x) * .15);
        }
    }

    // Trails via fade overlay
    if (S.trails) {
        renderer.autoClear = false;
        if (!window._fadeScene) {
            const fg = new THREE.PlaneGeometry(2, 2);
            const fm = new THREE.MeshBasicMaterial({ color: 0x020208, transparent: true, opacity: 0.08, depthTest: false, depthWrite: false });
            window._fadeScene = new THREE.Scene();
            window._fadeScene.add(new THREE.Mesh(fg, fm));
            window._fadeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        }
        renderer.render(window._fadeScene, window._fadeCam);
        renderer.render(scene, camera);
    } else {
        renderer.autoClear = true;
        renderer.render(scene, camera);
    }
}

// --- Init ---
morphTo('sphere');
buildFxPanel();
updateAllFx();
updateDetect(0);

// MediaPipe
const videoEl = document.getElementById('video-input');
const hands = new Hands({ locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${f}` });
hands.setOptions({
    maxNumHands: 2, modelComplexity: 1,
    minDetectionConfidence: 0.7, minTrackingConfidence: 0.6, selfieMode: true
});
hands.onResults(onResults);

const cam = new Camera(videoEl, {
    onFrame: async () => { await hands.send({ image: videoEl }); },
    width: 1280, height: 720, facingMode: 'user'
});
cam.start().then(() => { updateDetect(0); }).catch(err => {
    console.warn('Camera unavailable:', err);
    document.getElementById('detect-bar').textContent = '⚠️ No camera — use mouse/touch controls';
});

requestAnimationFrame(animate);

window.addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
});
