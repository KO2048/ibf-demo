const PHASES = {
  IDLE: 'idle',
  SEARCH: 'search',
  MATERIALIZE: 'materialize',
  TRACK: 'track',
  THROW: 'throwTiming',
  SUCCESS: 'success',
  ESCAPE: 'escape',
  OUT_OF_NETS: 'outOfNets',
};

const MODES = {
  HUNT: 'hunt',
  SHAKE: 'shake',
};

const DEFAULT_NETS = 5;
const GRAZE_MARGIN = 6;
const RETICLE_SIZE = 148;
const TRACK_RADIUS = 58;

const app = document.getElementById('app');
const video = document.getElementById('camera');
const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
const butterfly = document.getElementById('butterfly');
const butterflyFigure = document.getElementById('butterflyFigure');
const butterflyRig = document.getElementById('butterflyRig');
const bodyPart = butterflyRig.querySelector('.part-body');
const wingFrontLeftPart = butterflyRig.querySelector('.part-wing-front-left');
const wingFrontRightPart = butterflyRig.querySelector('.part-wing-front-right');
const wingBackLeftPart = butterflyRig.querySelector('.part-wing-back-left');
const wingBackRightPart = butterflyRig.querySelector('.part-wing-back-right');
const statusEl = document.getElementById('status');
const specimenName = document.getElementById('specimenName');
const specimenMeta = document.getElementById('specimenMeta');
const hudPanel = document.getElementById('hudPanel');
const signalFill = document.getElementById('signalFill');
const signalValue = document.getElementById('signalValue');
const lockFill = document.getElementById('lockFill');
const lockValue = document.getElementById('lockValue');
const trackCard = document.getElementById('trackCard');
const trackFill = document.getElementById('trackFill');
const trackValue = document.getElementById('trackValue');
const alertValue = document.getElementById('alertValue');
const netsValue = document.getElementById('netsValue');
const startBtn = document.getElementById('startBtn');
const huntModeBtn = document.getElementById('huntModeBtn');
const shakeModeBtn = document.getElementById('shakeModeBtn');
const phaseHint = document.getElementById('phaseHint');
const bottomPanel = document.getElementById('bottomPanel');
const reticle = document.getElementById('reticle');
const reticleLabel = document.getElementById('reticleLabel');
const throwPanel = document.getElementById('throwPanel');
const throwTitle = document.getElementById('throwTitle');
const throwHint = document.getElementById('throwHint');
const timingZone = document.getElementById('timingZone');
const perfectZone = document.getElementById('perfectZone');
const timingCursor = document.getElementById('timingCursor');
const throwBtn = document.getElementById('throwBtn');
const toast = document.getElementById('toast');
const resultCard = document.getElementById('resultCard');
const resultBadge = document.getElementById('resultBadge');
const resultTitle = document.getElementById('resultTitle');
const resultMeta = document.getElementById('resultMeta');
const resultFlavor = document.getElementById('resultFlavor');
const continueBtn = document.getElementById('continueBtn');

const butterflyCatalog = [
  {
    id: 'amber-glider',
    rigMode: 'sliced',
    name: '琥珀滑翔蝶',
    rarity: 'Common',
    role: '轻快型',
    flavor: '它会突然提速，然后像被暖风托住一样轻轻漂回你的视线。',
    weight: 0.45,
    size: 118,
    captureRadius: 58,
    signalDifficulty: 0.84,
    trackHoldMs: 650,
    timingWindowSize: 20,
    timingCursorSpeed: 72,
    alertMax: 3,
    falseSignalChance: 0.04,
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_54 PM (1) Background Removed.png',
    palette: {
      wingA: '#fff0b1',
      wingB: '#ffb766',
      wingC: '#7ec8ff',
      wingD: '#6d69ee',
      body: '#41324a',
    },
    motion: {
      flapDuration: 0.22,
      flapDepth: 0.96,
      baseSpeed: 68,
      speedJitter: 16,
      bobAmp: 9,
      swayAmp: 12,
      turnRate: 3.2,
      decisionWindow: [0.4, 0.95],
      hoverChance: 0.22,
      hoverDuration: [0.22, 0.55],
      boundaryMargin: 92,
    },
  },
  {
    id: 'mist-swallowtail',
    rigMode: 'sliced',
    name: '雾尾燕蝶',
    rarity: 'Rare',
    role: '平稳型',
    flavor: '它转向时几乎不慌张，像在空气里写出一条柔软的弧线。',
    weight: 0.35,
    size: 104,
    captureRadius: 52,
    signalDifficulty: 1.02,
    trackHoldMs: 850,
    timingWindowSize: 14,
    timingCursorSpeed: 90,
    alertMax: 3,
    falseSignalChance: 0.18,
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_55 PM (3) Background Removed.png',
    palette: {
      wingA: '#f2f3ff',
      wingB: '#c6d9ff',
      wingC: '#8ac0ff',
      wingD: '#8e79f2',
      body: '#29374d',
    },
    motion: {
      flapDuration: 0.26,
      flapDepth: 0.86,
      baseSpeed: 63,
      speedJitter: 13,
      bobAmp: 11,
      swayAmp: 10,
      turnRate: 2.8,
      decisionWindow: [0.48, 1.08],
      hoverChance: 0.28,
      hoverDuration: [0.28, 0.68],
      boundaryMargin: 96,
    },
  },
  {
    id: 'aurora-empress',
    rigMode: 'sliced',
    name: '曙辉帝蝶',
    rarity: 'Epic',
    role: '稀有缓慢型',
    flavor: '它不像是在逃离你，更像是在确认你是否值得被它短暂停留。',
    weight: 0.2,
    size: 134,
    captureRadius: 66,
    signalDifficulty: 1.18,
    trackHoldMs: 1100,
    timingWindowSize: 9,
    timingCursorSpeed: 108,
    alertMax: 3,
    falseSignalChance: 0.42,
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_55 PM (2) Background Removed.png',
    palette: {
      wingA: '#fff2d9',
      wingB: '#ffcf9c',
      wingC: '#f39fda',
      wingD: '#8f77f7',
      body: '#45314c',
    },
    motion: {
      flapDuration: 0.31,
      flapDepth: 0.78,
      baseSpeed: 47,
      speedJitter: 10,
      bobAmp: 12,
      swayAmp: 8,
      turnRate: 2.0,
      decisionWindow: [0.65, 1.45],
      hoverChance: 0.42,
      hoverDuration: [0.45, 1.05],
      boundaryMargin: 108,
    },
  },
];

let mode = MODES.HUNT;
let motionPermission = 'idle';
let stream;
let cameraReady = false;
let running = false;
let shakeCooldown = false;
let lastFrameAt = 0;
let currentButterfly = null;
let butterflyState = createEmptyButterflyState();
let encounter = createEncounterState();
let fxParticles = [];
let revealResultTimer = 0;

function createEmptyButterflyState() {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.36,
    heading: -0.2,
    targetHeading: -0.2,
    speed: 0,
    targetSpeed: 0,
    t: 0,
    alive: false,
    visible: false,
    hoverRemaining: 0,
    nextDecisionIn: 0,
    motionState: 'hover_idle',
    motionStateTime: 0,
    startledRemaining: 0,
    staggerRemaining: 0,
    nearMissCooldown: 0,
    flapPhase: 0,
    vx: 0,
    vy: 0,
    dirX: 1,
    bankAngle: 0,
    lift: 0,
    captureRadius: 56,
  };
}

function createEncounterState() {
  return {
    phase: PHASES.IDLE,
    reticleX: window.innerWidth * 0.5,
    reticleY: window.innerHeight * 0.42,
    pointerActive: false,
    pointerId: null,
    signalStrength: 0,
    lockProgress: 0,
    trackProgress: 0,
    materializeRemaining: 0,
    netsRemaining: DEFAULT_NETS,
    alertLevel: 0,
    signalTarget: null,
    signalNoise: 0,
    falseSignal: null,
    falseSignalUsed: false,
    currentSignalLabel: '弱',
    throwCursor: 14,
    throwDirection: 1,
    throwZoneCenter: 50,
    throwWindowSize: 20,
    perfectWindowSize: 8,
    lastJudgement: '',
    signalSparkCooldown: 0,
  };
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);

  const bounded = clampReticle(encounter.reticleX, encounter.reticleY);
  encounter.reticleX = bounded.x;
  encounter.reticleY = bounded.y;
  placeButterfly();
  renderReticle();
}

function setStatus(message) {
  statusEl.textContent = message;
}

function showToast(message, duration = 1900) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), duration);
}

function setMotionState(nextState) {
  if (butterflyState.motionState === nextState) return;
  butterflyState.motionState = nextState;
  butterflyState.motionStateTime = 0;
}

async function startCamera() {
  if (cameraReady) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('当前浏览器不支持相机调用');
  }
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  cameraReady = true;
}

async function ensureMotionPermission() {
  if (motionPermission === 'granted') return true;
  if (motionPermission === 'denied') return false;

  const maybeRequest = async (Ctor) => {
    if (typeof Ctor === 'undefined') return 'unsupported';
    if (typeof Ctor.requestPermission === 'function') {
      const result = await Ctor.requestPermission();
      return result === 'granted' ? 'granted' : 'denied';
    }
    return 'granted';
  };

  const motionResult = await maybeRequest(window.DeviceMotionEvent);
  const orientationResult = await maybeRequest(window.DeviceOrientationEvent);

  if (motionResult === 'granted' || orientationResult === 'granted') {
    motionPermission = 'granted';
    return true;
  }

  if (motionResult === 'unsupported' && orientationResult === 'unsupported') {
    motionPermission = 'unsupported';
    return false;
  }

  motionPermission = 'denied';
  return false;
}

function rarityLabel(rarity, verdict = 'Good') {
  if (verdict === 'Perfect') return 'Perfect 捕获';
  if (rarity === 'Epic') return '稀有捕获';
  if (rarity === 'Rare') return '稳定捕获';
  return '捕获成功';
}

function getReticleBounds() {
  const half = RETICLE_SIZE * 0.5;
  const top = Math.max(124, 88 + (window.visualViewport?.offsetTop || 0));
  const bottomReserved = Math.max(232, bottomPanel.offsetHeight + 84);
  const bottom = window.innerHeight - bottomReserved;
  return {
    minX: half + 14,
    maxX: window.innerWidth - half - 14,
    minY: top + half,
    maxY: Math.max(top + half, bottom - half),
  };
}

function clampReticle(x, y) {
  const bounds = getReticleBounds();
  return {
    x: clamp(x, bounds.minX, bounds.maxX),
    y: clamp(y, bounds.minY, bounds.maxY),
  };
}

function getPlayfieldBounds() {
  const reticleBounds = getReticleBounds();
  return {
    left: reticleBounds.minX,
    right: reticleBounds.maxX,
    top: reticleBounds.minY,
    bottom: reticleBounds.maxY,
  };
}

function placeButterfly() {
  butterfly.style.left = `${butterflyState.x}px`;
  butterfly.style.top = `${butterflyState.y}px`;
  butterfly.style.setProperty('--dir-x', butterflyState.dirX);
  butterfly.style.setProperty('--flight-tilt', `${butterflyState.bankAngle}deg`);
  butterfly.style.setProperty('--bank-angle', `${clamp(butterflyState.bankAngle * 0.55, -14, 14)}deg`);
  butterfly.style.setProperty('--lift', `${butterflyState.lift}px`);
}

function renderReticle() {
  reticle.style.left = `${encounter.reticleX}px`;
  reticle.style.top = `${encounter.reticleY}px`;
  reticle.style.setProperty('--signal-strength', encounter.signalStrength.toFixed(3));
  reticle.style.setProperty('--lock-progress', encounter.lockProgress.toFixed(3));
  reticle.style.setProperty('--track-progress', encounter.trackProgress.toFixed(3));
  reticle.classList.toggle('hidden', ![
    PHASES.SEARCH,
    PHASES.MATERIALIZE,
    PHASES.TRACK,
    PHASES.THROW,
  ].includes(encounter.phase));
  reticle.classList.toggle('is-focused', encounter.pointerActive && encounter.phase === PHASES.SEARCH);
  reticle.classList.toggle('is-track', encounter.phase === PHASES.TRACK);
  reticle.classList.toggle('is-throw', encounter.phase === PHASES.THROW);

  if (encounter.phase === PHASES.SEARCH) reticleLabel.textContent = 'SEARCH';
  if (encounter.phase === PHASES.MATERIALIZE) reticleLabel.textContent = 'LOCKED';
  if (encounter.phase === PHASES.TRACK) reticleLabel.textContent = 'TRACK';
  if (encounter.phase === PHASES.THROW) reticleLabel.textContent = 'THROW';
}

function updateHint(lines) {
  phaseHint.innerHTML = lines.map((line) => `<div>${line}</div>`).join('');
}

function updatePhaseHint() {
  if (encounter.phase === PHASES.IDLE) {
    updateHint([
      '1. 点击“开始体验”后允许相机权限。',
      '2. 按住屏幕拖动准星，找到强信号后持续锁定。',
      '3. 压圈完成后进入撒网时机条，再看准时机出手。',
    ]);
    return;
  }

  if (encounter.phase === PHASES.SEARCH) {
    updateHint([
      '1. 按住屏幕拖动准星扫描，信号越强越接近真实目标。',
      '2. 只有强信号时锁定条才会持续上涨，松手会缓慢回退。',
      '3. Rare 和 Epic 会出现抖动或假峰值，不要被瞬时强信号骗到。',
    ]);
    return;
  }

  if (encounter.phase === PHASES.MATERIALIZE) {
    updateHint([
      '1. 信号刚刚实体化，准星不要移得太远。',
      '2. 蝶影会短暂稳定，准备直接进入压圈追踪。',
      mode === MODES.SHAKE
        ? '3. 实验甩动已启用，但本轮主节奏仍然是先压圈。'
        : '3. 接下来需要把蝴蝶稳定留在准星内，压圈满了才有撒网资格。',
    ]);
    return;
  }

  if (encounter.phase === PHASES.TRACK) {
    updateHint([
      '1. 把蝴蝶稳定留在准星内，压圈会持续上涨，脱圈则回退。',
      '2. 警觉越高，蝴蝶越容易提速和变向。',
      mode === MODES.SHAKE
        ? '3. 实验甩动可在准星内直接尝试，但不保证比正常撒网更稳。'
        : '3. 压圈满后会打开撒网时机条，再用 timing 把它收进去。',
    ]);
    return;
  }

  if (encounter.phase === PHASES.THROW) {
    updateHint([
      '1. 光标会高速往返移动，别急着点。',
      '2. 落在绿色中心区是 Perfect，落在黄色有效区是 Good。',
      '3. 擦网和 Miss 都会提高警觉；测试网耗尽或警觉爆表，本轮直接失败。',
    ]);
    return;
  }

  updateHint([
    '1. 结果卡会总结本轮表现。',
    '2. 点击下方按钮可立即开始下一轮测试。',
    '3. 主流程保持在相机画面内，不会跳去独立遭遇场景。',
  ]);
}

function updateSpecimenCard() {
  if (!running || !currentButterfly || encounter.phase === PHASES.IDLE) {
    specimenName.textContent = '等待测试轮开始';
    specimenMeta.textContent = '点击开始后进入雷达搜索，锁定后才会真正现身。';
    return;
  }

  if (encounter.phase === PHASES.SEARCH) {
    specimenName.textContent = '未知蝶群信号';
    specimenMeta.textContent = `雷达搜索中 · 测试网 ${encounter.netsRemaining} · 警觉 ${encounter.alertLevel}/${currentButterfly.alertMax}`;
    return;
  }

  if (encounter.phase === PHASES.MATERIALIZE) {
    specimenName.textContent = '蝶影显形中';
    specimenMeta.textContent = `${currentButterfly.rarity} 信号已锁定 · 准备压圈追踪`;
    return;
  }

  if (encounter.phase === PHASES.TRACK) {
    specimenName.textContent = currentButterfly.name;
    specimenMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity} · 压圈 ${Math.round(encounter.trackProgress * 100)}%`;
    return;
  }

  if (encounter.phase === PHASES.THROW) {
    specimenName.textContent = currentButterfly.name;
    specimenMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity} · 撒网窗口已开启`;
    return;
  }

  if (encounter.phase === PHASES.SUCCESS) {
    specimenName.textContent = currentButterfly.name;
    specimenMeta.textContent = `已完成捕获 · ${currentButterfly.role} · ${currentButterfly.rarity}`;
    return;
  }

  if (encounter.phase === PHASES.ESCAPE) {
    specimenName.textContent = `${currentButterfly.name} 已逃逸`;
    specimenMeta.textContent = `警觉拉满 · ${currentButterfly.role} · 本轮结束`;
    return;
  }

  specimenName.textContent = '测试网耗尽';
  specimenMeta.textContent = `${currentButterfly.name} 仍未捕获 · 重开测试轮继续尝试`;
}

function updateHud() {
  hudPanel.classList.toggle('hidden', !running || encounter.phase === PHASES.IDLE);
  signalFill.style.width = `${Math.round(encounter.signalStrength * 100)}%`;
  signalValue.textContent = encounter.currentSignalLabel;
  lockFill.style.width = `${Math.round(encounter.lockProgress * 100)}%`;
  lockValue.textContent = `${Math.round(encounter.lockProgress * 100)}%`;
  trackFill.style.width = `${Math.round(encounter.trackProgress * 100)}%`;
  trackValue.textContent = `${Math.round(encounter.trackProgress * 100)}%`;
  alertValue.textContent = `${encounter.alertLevel} / ${currentButterfly?.alertMax || 3}`;
  netsValue.textContent = `${encounter.netsRemaining}`;
  trackCard.classList.toggle('is-dimmed', ![PHASES.MATERIALIZE, PHASES.TRACK, PHASES.THROW].includes(encounter.phase));
}

function renderThrowPanel() {
  const active = encounter.phase === PHASES.THROW;
  throwPanel.classList.toggle('hidden', !active);
  throwBtn.disabled = !active;
  if (!active) return;

  throwTitle.textContent = mode === MODES.SHAKE && motionPermission === 'granted' ? '撒网窗口 / 可甩动' : '撒网窗口';
  throwHint.textContent = encounter.lastJudgement
    ? `上次判定：${encounter.lastJudgement}`
    : '观察光标往返节奏，在有效区内出手。';

  const zoneLeft = encounter.throwZoneCenter - encounter.throwWindowSize * 0.5;
  const perfectLeft = encounter.throwZoneCenter - encounter.perfectWindowSize * 0.5;
  timingZone.style.left = `${zoneLeft}%`;
  timingZone.style.width = `${encounter.throwWindowSize}%`;
  perfectZone.style.left = `${perfectLeft}%`;
  perfectZone.style.width = `${encounter.perfectWindowSize}%`;
  timingCursor.style.left = `${encounter.throwCursor}%`;
}

function updateModeButtons() {
  huntModeBtn.classList.toggle('active', mode === MODES.HUNT);
  shakeModeBtn.classList.toggle('active', mode === MODES.SHAKE);
}

function applyButterflyVariant(variant) {
  currentButterfly = variant;
  butterfly.style.setProperty('--size', `${variant.size}px`);
  butterfly.style.setProperty('--flap-duration', `${variant.motion.flapDuration}s`);
  butterfly.style.setProperty('--flap-depth', variant.motion.flapDepth);
  butterfly.style.setProperty('--wing-a', variant.palette.wingA);
  butterfly.style.setProperty('--wing-b', variant.palette.wingB);
  butterfly.style.setProperty('--wing-c', variant.palette.wingC);
  butterfly.style.setProperty('--wing-d', variant.palette.wingD);
  butterfly.style.setProperty('--body-color', variant.palette.body);

  const sharedSource = variant.assetSrc ? `url("${variant.assetSrc}")` : 'none';
  bodyPart.style.backgroundImage = sharedSource;
  wingFrontLeftPart.style.backgroundImage = sharedSource;
  wingFrontRightPart.style.backgroundImage = sharedSource;
  wingBackLeftPart.style.backgroundImage = sharedSource;
  wingBackRightPart.style.backgroundImage = sharedSource;
}

function pickButterflyVariant() {
  const totalWeight = butterflyCatalog.reduce((sum, item) => sum + item.weight, 0);
  let threshold = Math.random() * totalWeight;
  for (const item of butterflyCatalog) {
    threshold -= item.weight;
    if (threshold <= 0) return item;
  }
  return butterflyCatalog[0];
}

function createSignalPoint(avoidX, avoidY) {
  const bounds = getPlayfieldBounds();
  let x = bounds.left;
  let y = bounds.top;
  let attempts = 0;

  while (attempts < 24) {
    x = rand(bounds.left, bounds.right);
    y = rand(bounds.top, bounds.bottom);
    if (Math.hypot(x - avoidX, y - avoidY) > 160) break;
    attempts += 1;
  }

  return { x, y };
}

function prepareSignalField() {
  const center = clampReticle(window.innerWidth * 0.5, window.innerHeight * 0.42);
  const trueSignal = createSignalPoint(center.x, center.y);
  const falseSignalEnabled = Math.random() < currentButterfly.falseSignalChance;
  let falseSignal = null;

  if (falseSignalEnabled) {
    const point = createSignalPoint(trueSignal.x, trueSignal.y);
    falseSignal = {
      x: point.x,
      y: point.y,
      delay: rand(0.4, 1.3),
      duration: rand(0.5, 0.95),
      active: false,
      consumed: false,
    };
  }

  encounter.signalTarget = trueSignal;
  encounter.falseSignal = falseSignal;
  encounter.falseSignalUsed = false;
}

function startNewRound() {
  const variant = pickButterflyVariant();
  applyButterflyVariant(variant);
  encounter = createEncounterState();
  butterflyState = createEmptyButterflyState();
  encounter.phase = PHASES.SEARCH;
  const reticleStart = clampReticle(window.innerWidth * 0.5, window.innerHeight * 0.42);
  encounter.reticleX = reticleStart.x;
  encounter.reticleY = reticleStart.y;
  encounter.throwWindowSize = variant.timingWindowSize;
  encounter.perfectWindowSize = variant.timingWindowSize * 0.4;
  prepareSignalField();
  clearTimeout(revealResultTimer);
  fxParticles = [];
  butterfly.classList.add('hidden');
  butterfly.classList.remove('materializing');
  butterflyFigure.classList.remove('capture-hit');
  resultCard.classList.add('hidden');
  resultCard.classList.remove('is-failure', 'is-perfect');
  continueBtn.textContent = '继续探索';
  encounter.lastJudgement = '';
  setStatus('拖动准星搜索蝴蝶雷达信号');
  startBtn.textContent = '重开测试轮';
  showToast('雷达已启动，按住屏幕拖动准星寻找强信号', 2200);
  updateModeButtons();
  updatePhaseHint();
  updateSpecimenCard();
  updateHud();
  renderThrowPanel();
  renderReticle();
}

function seedButterflyAtSignal() {
  const target = encounter.signalTarget;
  butterflyState = {
    x: target.x,
    y: target.y,
    heading: rand(-0.2, 0.2),
    targetHeading: rand(-0.4, 0.4),
    speed: currentButterfly.motion.baseSpeed * 0.24,
    targetSpeed: currentButterfly.motion.baseSpeed * 0.35,
    t: 0,
    alive: true,
    visible: true,
    hoverRemaining: 0.6,
    nextDecisionIn: rand(...currentButterfly.motion.decisionWindow),
    motionState: 'hover_idle',
    motionStateTime: 0,
    startledRemaining: 0,
    staggerRemaining: 0,
    nearMissCooldown: 0,
    flapPhase: rand(0, Math.PI * 2),
    vx: 0,
    vy: 0,
    dirX: Math.random() > 0.5 ? 1 : -1,
    bankAngle: 0,
    lift: 0,
    captureRadius: currentButterfly.captureRadius,
  };
  butterfly.classList.remove('hidden');
  butterfly.classList.add('materializing');
  placeButterfly();
}

function beginMaterialize() {
  encounter.phase = PHASES.MATERIALIZE;
  encounter.materializeRemaining = rand(0.62, 0.8);
  encounter.lockProgress = 1;
  encounter.currentSignalLabel = '锁定';
  seedButterflyAtSignal();
  emitParticles(encounter.signalTarget.x, encounter.signalTarget.y, currentButterfly.palette.wingC, 18, {
    speedMin: 28,
    speedMax: 110,
    lifeMin: 0.25,
    lifeMax: 0.7,
    sizeMin: 1.4,
    sizeMax: 3.2,
  });
  setStatus('锁定完成，蝶影正在显形');
  showToast('目标现身，下一步把它压进准星', 1600);
  updatePhaseHint();
}

function beginTrack() {
  encounter.phase = PHASES.TRACK;
  encounter.trackProgress = 0;
  encounter.currentSignalLabel = '追踪';
  butterfly.classList.remove('materializing');
  setStatus(mode === MODES.SHAKE && motionPermission === 'granted'
    ? '保持目标在准星内，实验甩动随时可试'
    : '把蝴蝶稳定留在准星内，压圈满后才可撒网');
  updatePhaseHint();
}

function configureThrowWindow() {
  const zoneSize = currentButterfly.timingWindowSize;
  const minCenter = zoneSize * 0.5 + GRAZE_MARGIN + 6;
  const maxCenter = 100 - zoneSize * 0.5 - GRAZE_MARGIN - 6;
  encounter.throwWindowSize = zoneSize;
  encounter.perfectWindowSize = zoneSize * 0.4;
  encounter.throwZoneCenter = rand(minCenter, maxCenter);
  encounter.throwCursor = rand(10, 90);
  encounter.throwDirection = Math.random() > 0.5 ? 1 : -1;
}

function beginThrowTiming() {
  encounter.phase = PHASES.THROW;
  encounter.trackProgress = 1;
  encounter.lastJudgement = '';
  encounter.currentSignalLabel = '出手';
  encounter.pointerActive = false;
  encounter.pointerId = null;
  configureThrowWindow();
  butterflyState.hoverRemaining = 0.8;
  butterflyState.targetSpeed = currentButterfly.motion.baseSpeed * 0.12;
  butterflyState.speed *= 0.42;
  butterflyState.targetHeading += rand(-0.08, 0.08);
  setStatus(mode === MODES.SHAKE && motionPermission === 'granted'
    ? '出手窗口已打开，也可以直接试验甩动'
    : '时机窗口已打开，看准条内节奏再撒网');
  showToast('撒网窗口开启，黄色有效区内出手', 1500);
  updatePhaseHint();
}

function triggerStartledEscape(originX, originY) {
  if (!currentButterfly || !butterflyState.alive || butterflyState.nearMissCooldown > 0) return;
  const { motion } = currentButterfly;
  const fleeHeading = Math.atan2(butterflyState.y - originY, butterflyState.x - originX) + rand(-0.32, 0.32);
  butterflyState.targetHeading = fleeHeading;
  butterflyState.targetSpeed = motion.baseSpeed * rand(1.45, 1.9);
  butterflyState.startledRemaining = rand(0.34, 0.58);
  butterflyState.nearMissCooldown = 0.42;
  butterflyState.hoverRemaining = 0;
  setMotionState('startled_escape');
}

function showResultCard({
  badge,
  title,
  meta,
  flavor,
  actionLabel,
  failure = false,
  perfect = false,
}) {
  resultBadge.textContent = badge;
  resultTitle.textContent = title;
  resultMeta.textContent = meta;
  resultFlavor.textContent = flavor;
  continueBtn.textContent = actionLabel;
  resultCard.classList.toggle('is-failure', failure);
  resultCard.classList.toggle('is-perfect', perfect);
  resultCard.classList.remove('hidden');
}

function enterFailurePhase(kind, copy) {
  encounter.phase = kind;
  encounter.pointerActive = false;
  encounter.pointerId = null;
  butterflyState.alive = false;
  butterfly.classList.add('hidden');
  showResultCard(copy);
  updatePhaseHint();
  updateSpecimenCard();
}

function resolveEscape(reason) {
  encounter.currentSignalLabel = '中断';
  setStatus('目标警觉拉满，已从视野中逃逸');
  emitParticles(butterflyState.x, butterflyState.y, currentButterfly.palette.wingD, 16, {
    speedMin: 34,
    speedMax: 120,
    lifeMin: 0.22,
    lifeMax: 0.64,
    sizeMin: 1.3,
    sizeMax: 3,
  });
  enterFailurePhase(PHASES.ESCAPE, {
    badge: '目标逃逸',
    title: `${currentButterfly.name} 受惊逃走`,
    meta: `${reason} · 警觉 ${encounter.alertLevel}/${currentButterfly.alertMax}`,
    flavor: '你已经接近成功，但这次出手还是让它彻底警觉了。下一轮可以更稳地锁定，再晚半拍或早半拍都别急。',
    actionLabel: '重开测试轮',
    failure: true,
  });
}

function resolveOutOfNets() {
  encounter.currentSignalLabel = '耗尽';
  setStatus('测试网耗尽，本轮结束');
  enterFailurePhase(PHASES.OUT_OF_NETS, {
    badge: '测试网耗尽',
    title: '网子已经全部用完',
    meta: `${currentButterfly.name} 仍在场内游走，但这轮无法继续出手`,
    flavor: 'V1 先按固定测试次数处理。后续可以在这里接入分享、邀请或修复类补网逻辑。',
    actionLabel: '重开测试轮',
    failure: true,
  });
}

function buildSuccessFlavor(verdict) {
  if (verdict === 'Perfect') {
    return `最佳时机合拢，${currentButterfly.flavor}`;
  }
  return `准星与时机终于对上了，${currentButterfly.flavor}`;
}

function handleCaptureSuccess(trigger, verdict = 'Good') {
  if (!currentButterfly) return;
  encounter.phase = PHASES.SUCCESS;
  encounter.currentSignalLabel = '完成';
  encounter.pointerActive = false;
  encounter.pointerId = null;
  butterflyState.alive = false;
  butterflyState.staggerRemaining = 0.3;
  butterflyState.startledRemaining = 0;
  setMotionState('captured_stagger');
  butterflyFigure.classList.add('capture-hit');
  setStatus(trigger === 'shake' ? '实验甩动捕获成功' : '捕捉完成，正在揭晓');
  showToast(verdict === 'Perfect' ? `${currentButterfly.name} 被完美捕获` : `${currentButterfly.name} 已被捕捉`);
  if (navigator.vibrate) navigator.vibrate([40, 28, 72]);
  emitParticles(butterflyState.x, butterflyState.y, currentButterfly.palette.wingB, 22, {
    speedMin: 30,
    speedMax: 130,
    lifeMin: 0.25,
    lifeMax: 0.8,
    sizeMin: 1.2,
    sizeMax: 3.6,
  });

  clearTimeout(revealResultTimer);
  revealResultTimer = setTimeout(() => {
    butterflyFigure.classList.remove('capture-hit');
    butterfly.classList.add('hidden');
    showResultCard({
      badge: rarityLabel(currentButterfly.rarity, verdict),
      title: `你抓到了${currentButterfly.name}`,
      meta: `${currentButterfly.role} · ${currentButterfly.rarity} · ${verdict}`,
      flavor: buildSuccessFlavor(verdict),
      actionLabel: '继续探索',
      perfect: verdict === 'Perfect',
    });
    updatePhaseHint();
    updateSpecimenCard();
  }, 340);
}

function applyFailedThrow(judgement, alertDelta) {
  encounter.lastJudgement = judgement;
  encounter.alertLevel = clamp(encounter.alertLevel + alertDelta, 0, currentButterfly.alertMax);

  if (encounter.netsRemaining <= 0) {
    resolveOutOfNets();
    return;
  }

  if (encounter.alertLevel >= currentButterfly.alertMax) {
    resolveEscape(judgement === 'Graze' ? '擦网过近' : '出手失误');
    return;
  }

  encounter.phase = PHASES.TRACK;
  encounter.currentSignalLabel = '追踪';
  encounter.trackProgress = judgement === 'Graze' ? 0.18 : 0.08;
  triggerStartledEscape(encounter.reticleX, encounter.reticleY);
  setStatus(judgement === 'Graze'
    ? '擦网了，目标警觉上升，重新压圈'
    : '时机没卡住，目标开始变向，重新压圈');
  showToast(judgement === 'Graze' ? '擦网未收住，警觉 +1' : 'Miss，警觉 +2', 1600);
  emitParticles(encounter.reticleX, encounter.reticleY, currentButterfly.palette.wingC, 8, {
    speedMin: 20,
    speedMax: 64,
    lifeMin: 0.2,
    lifeMax: 0.45,
    sizeMin: 1,
    sizeMax: 2.2,
  });
  updatePhaseHint();
}

function performThrow() {
  if (encounter.phase !== PHASES.THROW || !currentButterfly) return;

  encounter.netsRemaining = Math.max(0, encounter.netsRemaining - 1);
  const halfWindow = encounter.throwWindowSize * 0.5;
  const halfPerfect = encounter.perfectWindowSize * 0.5;
  const delta = Math.abs(encounter.throwCursor - encounter.throwZoneCenter);

  if (delta <= halfPerfect) {
    handleCaptureSuccess('throw', 'Perfect');
    return;
  }

  if (delta <= halfWindow) {
    handleCaptureSuccess('throw', 'Good');
    return;
  }

  if (delta <= halfWindow + GRAZE_MARGIN) {
    applyFailedThrow('Graze', 1);
    return;
  }

  applyFailedThrow('Miss', 2);
}

function angleDelta(current, target) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function chooseNextFlightDecision() {
  if (!currentButterfly || !butterflyState.alive || butterflyState.startledRemaining > 0) return;
  const { motion } = currentButterfly;
  const offsetX = encounter.reticleX - butterflyState.x;
  const offsetY = encounter.reticleY - butterflyState.y;
  const edgeForceX = butterflyState.x < motion.boundaryMargin
    ? 0.95
    : butterflyState.x > window.innerWidth - motion.boundaryMargin
      ? -0.95
      : 0;
  const edgeForceY = butterflyState.y < 90 ? 0.8 : butterflyState.y > getReticleBounds().maxY + RETICLE_SIZE * 0.3 ? -0.9 : 0;
  const shouldHover = Math.random() < motion.hoverChance;

  if (shouldHover) {
    butterflyState.hoverRemaining = rand(...motion.hoverDuration);
    butterflyState.targetSpeed = motion.baseSpeed * rand(0.08, 0.18);
    butterflyState.targetHeading += rand(-0.35, 0.35);
  } else {
    const centerHeading = Math.atan2(offsetY * 0.45 + edgeForceY * 90, offsetX * 0.55 + edgeForceX * 120);
    butterflyState.targetHeading = centerHeading + rand(-0.82, 0.82);
    butterflyState.targetSpeed = motion.baseSpeed + rand(-motion.speedJitter, motion.speedJitter);
  }

  butterflyState.nextDecisionIn = rand(...motion.decisionWindow);
}

function updateRigPose(dt, vx, vy, turnDelta = 0) {
  if (!currentButterfly) return;
  const { motion } = currentButterfly;
  const verticalFactor = clamp(-vy / Math.max(42, motion.baseSpeed), -1, 1);
  const bankDirection = butterflyState.motionState === 'bank_left' ? -1 : butterflyState.motionState === 'bank_right' ? 1 : 0;

  let flapRate = 1 / motion.flapDuration;
  let frontAmplitude = 16 + motion.flapDepth * 12;
  let backAmplitude = 10 + motion.flapDepth * 8;
  let bodyTilt = clamp(vx * 0.045, -10, 10);
  let bodyYaw = clamp(turnDelta * 32, -11, 11);
  let rigLift = Math.sin(butterflyState.t * 4.8) * 1.2;
  let jitterX = 0;
  let jitterY = 0;
  let shadowScale = 0.94;
  let shadowOpacity = 0.42;
  let bodyScale = 1;

  if (butterflyState.motionState === 'hover_idle') {
    flapRate *= 0.78;
    frontAmplitude *= 0.72;
    backAmplitude *= 0.68;
    rigLift += Math.sin(butterflyState.t * 11.5) * 0.75;
    jitterX = Math.sin(butterflyState.t * 21) * 0.35;
    jitterY = Math.cos(butterflyState.t * 17) * 0.3;
  } else if (butterflyState.motionState === 'bank_left') {
    flapRate *= 1.06;
    bodyTilt -= 8;
    bodyYaw -= 7;
  } else if (butterflyState.motionState === 'bank_right') {
    flapRate *= 1.06;
    bodyTilt += 8;
    bodyYaw += 7;
  } else if (butterflyState.motionState === 'startled_escape') {
    flapRate *= 1.55;
    frontAmplitude *= 1.26;
    backAmplitude *= 1.16;
    jitterX = Math.sin(butterflyState.t * 33) * 1.3;
    jitterY = Math.cos(butterflyState.t * 29) * 1.1;
    rigLift += Math.sin(butterflyState.t * 16.5) * 1.4;
    shadowScale = 0.88;
    shadowOpacity = 0.34;
  } else if (butterflyState.motionState === 'captured_stagger') {
    flapRate *= 1.34;
    frontAmplitude *= 0.66;
    backAmplitude *= 0.54;
    bodyTilt += Math.sin(butterflyState.t * 38) * 13;
    bodyYaw += Math.cos(butterflyState.t * 27) * 8;
    jitterX = Math.sin(butterflyState.t * 47) * 2.2;
    jitterY = Math.cos(butterflyState.t * 41) * 1.6;
    rigLift += Math.sin(butterflyState.t * 19) * 2.1;
    shadowScale = 0.84;
    shadowOpacity = 0.26;
    bodyScale = 0.98;
  }

  flapRate *= 1 + Math.max(0, verticalFactor) * 0.2 - Math.max(0, -verticalFactor) * 0.08;
  frontAmplitude *= 1 + Math.max(0, verticalFactor) * 0.18;
  backAmplitude *= 1 + Math.max(0, verticalFactor) * 0.14;
  butterflyState.flapPhase += dt * flapRate * Math.PI * 2;

  const leftBias = bankDirection < 0 ? 0.74 : bankDirection > 0 ? 1.08 : 1;
  const rightBias = bankDirection > 0 ? 0.74 : bankDirection < 0 ? 1.08 : 1;
  const frontLeftWave = Math.sin(butterflyState.flapPhase);
  const frontRightWave = Math.sin(butterflyState.flapPhase + 0.28);
  const backLeftWave = Math.sin(butterflyState.flapPhase + 0.18);
  const backRightWave = Math.sin(butterflyState.flapPhase + 0.42);

  const wingFrontLeftAngle = -(frontLeftWave * frontAmplitude * leftBias + (bankDirection < 0 ? 5 : 0));
  const wingFrontRightAngle = frontRightWave * frontAmplitude * rightBias + (bankDirection > 0 ? 5 : 0);
  const wingBackLeftAngle = -(backLeftWave * backAmplitude * leftBias + (bankDirection < 0 ? 2.4 : 0));
  const wingBackRightAngle = backRightWave * backAmplitude * rightBias + (bankDirection > 0 ? 2.4 : 0);
  const wingFrontLeftScale = 1 - Math.max(0, frontLeftWave) * 0.08;
  const wingFrontRightScale = 1 - Math.max(0, frontRightWave) * 0.08;
  const wingBackLeftScale = 1 - Math.max(0, backLeftWave) * 0.06;
  const wingBackRightScale = 1 - Math.max(0, backRightWave) * 0.06;

  butterfly.style.setProperty('--body-tilt', `${bodyTilt.toFixed(2)}deg`);
  butterfly.style.setProperty('--body-yaw', `${bodyYaw.toFixed(2)}deg`);
  butterfly.style.setProperty('--body-bob', `${(Math.sin(butterflyState.t * 7.3) * 0.9).toFixed(2)}px`);
  butterfly.style.setProperty('--body-scale', bodyScale.toFixed(3));
  butterfly.style.setProperty('--rig-lift', `${rigLift.toFixed(2)}px`);
  butterfly.style.setProperty('--rig-jitter-x', `${jitterX.toFixed(2)}px`);
  butterfly.style.setProperty('--rig-jitter-y', `${jitterY.toFixed(2)}px`);
  butterfly.style.setProperty('--wing-front-left-angle', `${wingFrontLeftAngle.toFixed(2)}deg`);
  butterfly.style.setProperty('--wing-front-right-angle', `${wingFrontRightAngle.toFixed(2)}deg`);
  butterfly.style.setProperty('--wing-back-left-angle', `${wingBackLeftAngle.toFixed(2)}deg`);
  butterfly.style.setProperty('--wing-back-right-angle', `${wingBackRightAngle.toFixed(2)}deg`);
  butterfly.style.setProperty('--wing-front-left-scale', wingFrontLeftScale.toFixed(3));
  butterfly.style.setProperty('--wing-front-right-scale', wingFrontRightScale.toFixed(3));
  butterfly.style.setProperty('--wing-back-left-scale', wingBackLeftScale.toFixed(3));
  butterfly.style.setProperty('--wing-back-right-scale', wingBackRightScale.toFixed(3));
  butterfly.style.setProperty('--shadow-scale', shadowScale.toFixed(3));
  butterfly.style.setProperty('--shadow-opacity', shadowOpacity.toFixed(3));
}

function updateButterfly(dt) {
  if (!currentButterfly) return;

  const { motion } = currentButterfly;
  butterflyState.t += dt;
  butterflyState.motionStateTime += dt;
  butterflyState.nextDecisionIn -= dt;
  if (butterflyState.nearMissCooldown > 0) butterflyState.nearMissCooldown -= dt;

  if (butterflyState.hoverRemaining > 0) {
    butterflyState.hoverRemaining -= dt;
  }

  if (butterflyState.staggerRemaining > 0) {
    butterflyState.staggerRemaining -= dt;
    butterflyState.vx *= 0.92;
    butterflyState.vy *= 0.92;
    butterflyState.y += 10 * dt;
    setMotionState('captured_stagger');
    updateRigPose(dt, butterflyState.vx, butterflyState.vy, 0);
    placeButterfly();
    return;
  }

  if (!butterflyState.alive) return;

  if (butterflyState.startledRemaining > 0) {
    butterflyState.startledRemaining -= dt;
  }

  if (butterflyState.nextDecisionIn <= 0) {
    chooseNextFlightDecision();
  }

  const boundaryBiasX = butterflyState.x < motion.boundaryMargin ? 1 : butterflyState.x > window.innerWidth - motion.boundaryMargin ? -1 : 0;
  const boundaryBiasY = butterflyState.y < 82 ? 0.8 : butterflyState.y > getReticleBounds().maxY + RETICLE_SIZE * 0.3 ? -1 : 0;

  if (boundaryBiasX || boundaryBiasY) {
    butterflyState.targetHeading = Math.atan2(boundaryBiasY + rand(-0.15, 0.15), boundaryBiasX + rand(-0.15, 0.15));
    butterflyState.targetSpeed = motion.baseSpeed + motion.speedJitter * 0.4;
    butterflyState.hoverRemaining = 0;
  }

  const alertMultiplier = encounter.phase === PHASES.TRACK ? 1 + encounter.alertLevel * 0.06 : 1;
  if (encounter.phase === PHASES.THROW) {
    butterflyState.targetSpeed = motion.baseSpeed * 0.1;
  }

  const headingAdjust = angleDelta(butterflyState.heading, butterflyState.targetHeading);
  butterflyState.heading += headingAdjust * clamp(dt * motion.turnRate, 0, 1);
  butterflyState.speed += (butterflyState.targetSpeed - butterflyState.speed) * clamp(dt * 3.1, 0, 1);

  const sway = Math.sin(butterflyState.t * 1.7 + currentButterfly.size * 0.02) * motion.swayAmp;
  const bob = Math.cos(butterflyState.t * 2.5 + currentButterfly.size * 0.03) * motion.bobAmp;
  const hoverDampen = butterflyState.hoverRemaining > 0 ? 0.36 : 1;
  const startledBoost = butterflyState.startledRemaining > 0 ? 1.12 : 1;
  const vx = Math.cos(butterflyState.heading) * butterflyState.speed * startledBoost * alertMultiplier + sway * hoverDampen;
  const vy = Math.sin(butterflyState.heading) * butterflyState.speed * 0.72 * startledBoost * alertMultiplier + bob;

  butterflyState.x += vx * dt;
  butterflyState.y += vy * dt;
  butterflyState.vx = vx;
  butterflyState.vy = vy;
  butterflyState.dirX = vx >= 0 ? 1 : -1;
  butterflyState.bankAngle = clamp(vx * 0.09 + vy * 0.05, -18, 18);
  butterflyState.lift = Math.sin(butterflyState.t * 5.2) * (motion.bobAmp * 0.16);

  if (butterflyState.startledRemaining > 0) {
    setMotionState('startled_escape');
  } else if (headingAdjust < -0.18) {
    setMotionState('bank_left');
  } else if (headingAdjust > 0.18) {
    setMotionState('bank_right');
  } else if (butterflyState.hoverRemaining > 0.12 || butterflyState.speed < motion.baseSpeed * 0.55) {
    setMotionState('hover_idle');
  } else {
    setMotionState('flap_forward');
  }

  updateRigPose(dt, vx, vy, headingAdjust);
  placeButterfly();
}

function updateFalseSignal(dt) {
  const falseSignal = encounter.falseSignal;
  if (!falseSignal || falseSignal.consumed) return false;

  if (!falseSignal.active) {
    falseSignal.delay -= dt;
    if (falseSignal.delay <= 0) falseSignal.active = true;
    return false;
  }

  falseSignal.duration -= dt;
  if (falseSignal.duration <= 0) {
    falseSignal.active = false;
    falseSignal.consumed = true;
  }

  return falseSignal.active;
}

function classifySignal(strength) {
  if (strength >= 0.82) return '强';
  if (strength >= 0.48) return '中';
  if (strength >= 0.18) return '弱';
  return '无';
}

function updateSearchPhase(dt) {
  if (encounter.phase !== PHASES.SEARCH || !currentButterfly || !encounter.signalTarget) return;

  const falseSignalActive = updateFalseSignal(dt);
  const signalRadius = 190 / currentButterfly.signalDifficulty;
  const falseSignalRadius = signalRadius * 0.88;
  const trueDistance = Math.hypot(encounter.reticleX - encounter.signalTarget.x, encounter.reticleY - encounter.signalTarget.y);
  let strength = clamp(1 - trueDistance / signalRadius, 0, 1);

  if (falseSignalActive && encounter.falseSignal) {
    const falseDistance = Math.hypot(encounter.reticleX - encounter.falseSignal.x, encounter.reticleY - encounter.falseSignal.y);
    const falseStrength = clamp(1 - falseDistance / falseSignalRadius, 0, 1) * 1.08;
    strength = Math.max(strength, falseStrength);
  }

  const noiseAmp = clamp((currentButterfly.signalDifficulty - 0.78) * 0.18, 0.02, 0.1);
  encounter.signalNoise = lerp(encounter.signalNoise, rand(-noiseAmp, noiseAmp), clamp(dt * 5, 0, 1));
  strength = clamp(strength + encounter.signalNoise, 0, 1);
  encounter.signalStrength = lerp(encounter.signalStrength, strength, clamp(dt * 8.5, 0, 1));
  encounter.currentSignalLabel = classifySignal(encounter.signalStrength);

  if (encounter.pointerActive && encounter.signalStrength >= 0.74) {
    encounter.lockProgress = clamp(encounter.lockProgress + dt * (0.55 + encounter.signalStrength * 0.65), 0, 1);
    if (encounter.signalSparkCooldown <= 0) {
      emitParticles(encounter.reticleX, encounter.reticleY, currentButterfly.palette.wingC, 3, {
        speedMin: 10,
        speedMax: 36,
        lifeMin: 0.14,
        lifeMax: 0.28,
        sizeMin: 0.8,
        sizeMax: 1.6,
      });
      encounter.signalSparkCooldown = 0.08;
    }
  } else {
    encounter.lockProgress = clamp(encounter.lockProgress - dt * 0.32, 0, 1);
  }

  encounter.signalSparkCooldown -= dt;

  if (encounter.lockProgress >= 1) {
    beginMaterialize();
  }
}

function updateMaterializePhase(dt) {
  if (encounter.phase !== PHASES.MATERIALIZE) return;
  encounter.materializeRemaining -= dt;
  encounter.signalStrength = lerp(encounter.signalStrength, 1, clamp(dt * 4, 0, 1));
  encounter.trackProgress = lerp(encounter.trackProgress, 0.2, clamp(dt * 2, 0, 1));
  if (encounter.materializeRemaining <= 0) {
    beginTrack();
  }
}

function updateTrackPhase(dt) {
  if (encounter.phase !== PHASES.TRACK || !butterflyState.alive) return;

  const distance = Math.hypot(encounter.reticleX - butterflyState.x, encounter.reticleY - butterflyState.y);
  const inside = distance <= TRACK_RADIUS;

  if (inside) {
    encounter.trackProgress = clamp(
      encounter.trackProgress + dt / (currentButterfly.trackHoldMs / 1000),
      0,
      1,
    );
  } else {
    encounter.trackProgress = clamp(
      encounter.trackProgress - dt * 1.1 / (currentButterfly.trackHoldMs / 1000),
      0,
      1,
    );
  }

  if (inside && distance <= TRACK_RADIUS * 0.72) {
    encounter.signalStrength = lerp(encounter.signalStrength, 0.92, clamp(dt * 5, 0, 1));
  } else {
    encounter.signalStrength = lerp(encounter.signalStrength, 0.34, clamp(dt * 4, 0, 1));
  }

  if (encounter.trackProgress >= 1) {
    beginThrowTiming();
  }
}

function updateThrowPhase(dt) {
  if (encounter.phase !== PHASES.THROW) return;
  encounter.signalStrength = lerp(encounter.signalStrength, 0.84, clamp(dt * 3.5, 0, 1));
  encounter.throwCursor += encounter.throwDirection * currentButterfly.timingCursorSpeed * dt;

  if (encounter.throwCursor >= 100) {
    encounter.throwCursor = 100;
    encounter.throwDirection = -1;
  } else if (encounter.throwCursor <= 0) {
    encounter.throwCursor = 0;
    encounter.throwDirection = 1;
  }
}

function emitParticles(
  x,
  y,
  color,
  count,
  {
    speedMin = 24,
    speedMax = 80,
    lifeMin = 0.18,
    lifeMax = 0.42,
    sizeMin = 1,
    sizeMax = 2.6,
  } = {},
) {
  for (let i = 0; i < count; i += 1) {
    const angle = rand(0, Math.PI * 2);
    const speed = rand(speedMin, speedMax);
    const life = rand(lifeMin, lifeMax);
    fxParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      size: rand(sizeMin, sizeMax),
      color,
    });
  }
}

function drawFx(dt) {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  fxParticles = fxParticles.filter((particle) => particle.life > 0);

  for (const particle of fxParticles) {
    particle.life -= dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= 0.96;
    particle.vy *= 0.96;

    const alpha = clamp(particle.life / particle.maxLife, 0, 1);
    ctx.fillStyle = `rgba(${hexToRgb(particle.color)}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(
    normalized.length === 3
      ? normalized.split('').map((char) => `${char}${char}`).join('')
      : normalized,
    16,
  );
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function animate(now) {
  if (!running) return;
  if (!lastFrameAt) lastFrameAt = now;
  const dt = Math.min(0.033, (now - lastFrameAt) / 1000);
  lastFrameAt = now;

  updateSearchPhase(dt);
  updateMaterializePhase(dt);
  updateButterfly(dt);
  updateTrackPhase(dt);
  updateThrowPhase(dt);
  drawFx(dt);
  renderReticle();
  updateHud();
  renderThrowPanel();
  updateSpecimenCard();
  requestAnimationFrame(animate);
}

function moveReticle(clientX, clientY) {
  const next = clampReticle(clientX, clientY);
  encounter.reticleX = next.x;
  encounter.reticleY = next.y;
}

function isInteractiveControl(target) {
  return Boolean(target.closest('button, .bottom-panel, .result-card, .throw-panel, .toast'));
}

async function startExperience() {
  if (running && cameraReady) {
    startNewRound();
    return;
  }

  try {
    setStatus('正在打开相机');
    await startCamera();
    running = true;
    startNewRound();
    if (!lastFrameAt) requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    setStatus('相机启动失败');
    showToast('请用 iPhone Safari 通过 HTTPS 打开，并允许相机权限', 2600);
  }
}

async function setMode(nextMode) {
  if (nextMode === MODES.SHAKE) {
    try {
      const granted = await ensureMotionPermission();
      if (!granted) {
        mode = MODES.HUNT;
        updateModeButtons();
        const message = motionPermission === 'unsupported'
          ? '当前设备不支持甩动权限，继续使用雷达主流程'
          : '未获得动作权限，继续使用雷达主流程即可';
        showToast(message, 2200);
        updatePhaseHint();
        return;
      }
    } catch (error) {
      console.error(error);
      motionPermission = 'denied';
      mode = MODES.HUNT;
      updateModeButtons();
      showToast('动作权限请求失败，继续使用雷达主流程即可', 2200);
      updatePhaseHint();
      return;
    }
  }

  mode = nextMode;
  updateModeButtons();

  if (mode === MODES.HUNT) {
    setStatus(running ? '雷达主流程已启用' : '等待开始');
  } else if (motionPermission === 'granted') {
    setStatus('实验甩动模式已启用');
    showToast('搜索和压圈不变；进入追踪后可尝试甩动直收', 1900);
  }

  updatePhaseHint();
  updateSpecimenCard();
}

function handlePointerDown(event) {
  if (!running || isInteractiveControl(event.target)) return;
  if (![PHASES.SEARCH, PHASES.MATERIALIZE, PHASES.TRACK].includes(encounter.phase)) return;
  encounter.pointerActive = true;
  encounter.pointerId = event.pointerId;
  moveReticle(event.clientX, event.clientY);
}

function handlePointerMove(event) {
  if (!encounter.pointerActive || encounter.pointerId !== event.pointerId) return;
  moveReticle(event.clientX, event.clientY);
}

function handlePointerUp(event) {
  if (encounter.pointerId !== event.pointerId) return;
  encounter.pointerActive = false;
  encounter.pointerId = null;
}

function handleShakeCapture() {
  if (
    mode !== MODES.SHAKE
    || motionPermission !== 'granted'
    || ![PHASES.TRACK, PHASES.THROW].includes(encounter.phase)
    || !butterflyState.alive
    || shakeCooldown
  ) {
    return;
  }

  shakeCooldown = true;
  const nearReticle = Math.hypot(butterflyState.x - encounter.reticleX, butterflyState.y - encounter.reticleY) < TRACK_RADIUS;

  if (nearReticle) {
    handleCaptureSuccess('shake', 'Good');
  } else {
    showToast('甩动时目标不在准星内，先把它重新压回来', 1500);
  }

  setTimeout(() => {
    shakeCooldown = false;
  }, 900);
}

window.addEventListener('resize', resize);
resize();

app.addEventListener('pointerdown', handlePointerDown);
app.addEventListener('pointermove', handlePointerMove);
window.addEventListener('pointerup', handlePointerUp);
window.addEventListener('pointercancel', handlePointerUp);

window.addEventListener('devicemotion', (event) => {
  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  if (!acceleration) return;

  const magnitude = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2);
  if (magnitude > 22) {
    handleShakeCapture();
  }
});

startBtn.addEventListener('click', startExperience);
huntModeBtn.addEventListener('click', () => setMode(MODES.HUNT));
shakeModeBtn.addEventListener('click', () => setMode(MODES.SHAKE));
throwBtn.addEventListener('click', performThrow);
continueBtn.addEventListener('click', () => {
  resultCard.classList.add('hidden');
  startNewRound();
});

setMode(MODES.HUNT);
updateSpecimenCard();
updateHud();
renderReticle();
