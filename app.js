const video = document.getElementById('camera');
const canvas = document.getElementById('fx');
const ctx = canvas.getContext('2d');
const butterfly = document.getElementById('butterfly');
const butterflyFigure = document.getElementById('butterflyFigure');
const butterflyRig = document.getElementById('butterflyRig');
const butterflyArt = document.getElementById('butterflyArt');
const butterflySprite = document.getElementById('butterflySprite');
const statusEl = document.getElementById('status');
const specimenName = document.getElementById('specimenName');
const specimenMeta = document.getElementById('specimenMeta');
const startBtn = document.getElementById('startBtn');
const swipeModeBtn = document.getElementById('swipeModeBtn');
const shakeModeBtn = document.getElementById('shakeModeBtn');
const captureCluster = document.getElementById('captureCluster');
const captureFrame = document.getElementById('captureFrame');
const timingHud = document.getElementById('timingHud');
const timingBar = document.getElementById('timingBar');
const timingWindow = document.getElementById('timingWindow');
const timingCursor = document.getElementById('timingCursor');
const timingMeta = document.getElementById('timingMeta');
const bottomPanel = document.getElementById('bottomPanel');
const bottomPanelExpanded = document.getElementById('bottomPanelExpanded');
const panelMini = document.getElementById('panelMini');
const panelExpandBtn = document.getElementById('panelExpandBtn');
const panelMiniLabel = document.getElementById('panelMiniLabel');
const panelCollapseBtn = document.getElementById('panelCollapseBtn');
const toast = document.getElementById('toast');
const resultCard = document.getElementById('resultCard');
const resultBadge = document.getElementById('resultBadge');
const resultTitle = document.getElementById('resultTitle');
const resultMeta = document.getElementById('resultMeta');
const resultFlavor = document.getElementById('resultFlavor');
const continueBtn = document.getElementById('continueBtn');
const buildStamp = document.getElementById('buildStamp');

const rigParts = {
  body: document.getElementById('partBody'),
  leftWingFront: document.getElementById('partWingFrontLeft'),
  rightWingFront: document.getElementById('partWingFrontRight'),
  leftWingBack: document.getElementById('partWingBackLeft'),
  rightWingBack: document.getElementById('partWingBackRight'),
};

const rigPartImages = Object.fromEntries(
  Object.entries(rigParts).map(([key, part]) => [key, part.querySelector('.butterfly-part-image')]),
);

const MOTION_STATES = {
  HOVER_IDLE: 'hover_idle',
  FLAP_FORWARD: 'flap_forward',
  BANK_LEFT: 'bank_left',
  BANK_RIGHT: 'bank_right',
  STARTLED_ESCAPE: 'startled_escape',
  CAPTURED_STAGGER: 'captured_stagger',
};

const FLIGHT_TUNING = {
  returnToViewBias: 0.34,
  offscreenAllowance: 180,
};

const WINDOW_TUNING = {
  smoothing: 5.2,
  maxOffsetX: 220,
  maxOffsetY: 170,
  orientationRangeGamma: 20,
  orientationRangeBeta: 18,
  pursuitDeadZone: 0.35,
  pursuitAlignmentThreshold: 0.12,
  pursuitResponse: 5.2,
  pursuitFarStrength: 0.82,
  pursuitMidStrength: 0.44,
  pursuitNearStrength: 0.16,
  pursuitMidRadius: 180,
  pursuitNearRadius: 104,
  pursuitNoAutoCaptureRadius: 72,
  pursuitSlowdownFactor: 0.22,
  pursuitDamping: 4.8,
  pursuitAssistMaxOffset: 82,
};

const STARTLE_TUNING = {
  enabled: true,
  startleNearRadius: 118,
  motionThreshold: 18,
  jitterThreshold: 7.5,
  escapeBoost: 15,
};

const CAPTURE_TUNING = {
  frameSize: 156,
  frameSizeCompact: 142,
  frameVisualOffsetY: 0,
  frameHitMarginX: 10,
  frameHitMarginY: 8,
  cursorSpeed: 68,
  shakeCooldownMs: 900,
  shakeCaptureThreshold: 22,
};

const BUILD_INFO = {
  label: 'observe-v1',
  channel: 'main',
};

function createSliceBoxes(frontX, frontY, frontW, frontH, backX, backY, backW, backH, bodyX, bodyY, bodyW, bodyH) {
  return {
    leftWingFront: { x: frontX, y: frontY, w: frontW, h: frontH },
    rightWingFront: { x: 100 - frontX - frontW, y: frontY, w: frontW, h: frontH },
    leftWingBack: { x: backX, y: backY, w: backW, h: backH },
    rightWingBack: { x: 100 - backX - backW, y: backY, w: backW, h: backH },
    body: { x: bodyX, y: bodyY, w: bodyW, h: bodyH },
  };
}

const butterflyCatalog = [
  {
    id: 'amber-glider',
    name: '琥珀滑翔蝶',
    rarity: 'Common',
    role: '轻快型',
    flavor: '它会突然提速，然后像被暖风托住一样轻轻漂回你的视线。',
    weight: 0.45,
    size: 118,
    captureRadius: 58,
    timingWindowSize: 27,
    timingZoneCenterRange: [44, 56],
    rigMode: 'sliced',
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_54 PM (1) Background Removed.png',
    sliceBoxes: createSliceBoxes(5, 3, 42, 42, 13, 40, 29, 30, 39, 9, 22, 70),
    rig: {
      frontPivot: { x: 84, y: 48 },
      backPivot: { x: 82, y: 44 },
      bodyScale: 1,
    },
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
    name: '雾尾燕蝶',
    rarity: 'Rare',
    role: '平稳型',
    flavor: '它转向时几乎不慌张，像在空气里写出一条柔软的弧线。',
    weight: 0.35,
    size: 104,
    captureRadius: 52,
    timingWindowSize: 20,
    timingZoneCenterRange: [46, 54],
    rigMode: 'sliced',
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_55 PM (3) Background Removed.png',
    sliceBoxes: createSliceBoxes(8, 4, 39, 39, 16, 40, 27, 28, 40, 11, 20, 68),
    rig: {
      frontPivot: { x: 84, y: 47 },
      backPivot: { x: 80, y: 43 },
      bodyScale: 0.98,
    },
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
    name: '曙辉帝蝶',
    rarity: 'Epic',
    role: '稀有缓慢型',
    flavor: '它不像是在逃离你，更像是在确认你是否值得被它短暂停留。',
    weight: 0.2,
    size: 134,
    captureRadius: 66,
    timingWindowSize: 13,
    timingZoneCenterRange: [47, 53],
    rigMode: 'sliced',
    assetSrc: 'assets/butterflies/ChatGPT Image Apr 23, 2026, 04_38_55 PM (2) Background Removed.png',
    sliceBoxes: createSliceBoxes(5, 2, 43, 44, 15, 39, 28, 30, 40, 8, 20, 72),
    rig: {
      frontPivot: { x: 85, y: 48 },
      backPivot: { x: 82, y: 45 },
      bodyScale: 1.04,
    },
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

let mode = 'swipe';
let motionPermission = 'idle';
let stream;
let cameraReady = false;
let running = false;
let shakeCooldown = false;
let swipeTrail = [];
let lastPointer = null;
let lastFrameAt = 0;
let currentButterfly = null;
let revealTimer = null;
let panelCollapsed = false;
let panelPinnedOpen = false;
let butterflyState = createEmptyButterflyState();
let cameraState = createCameraState();
let pursuitState = createPursuitState();
let startleState = createStartleState();
let timingState = createTimingState();

function createEmptyButterflyState() {
  return {
    worldX: window.innerWidth * 0.5,
    worldY: window.innerHeight * 0.36,
    screenX: window.innerWidth * 0.5,
    screenY: window.innerHeight * 0.36,
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
    dirX: 1,
    bankAngle: 0,
    lift: 0,
    captureRadius: 56,
    motionState: MOTION_STATES.HOVER_IDLE,
    motionStateTime: 0,
    flapPhase: 0,
    flapRate: 4.2,
    nearMissCooldown: 0,
    startleUntil: 0,
    staggerUntil: 0,
    bodyTilt: 0,
    bodyYawFake: 0,
    escapeBoost: 0,
    lastVx: 0,
    lastVy: 0,
    capturePending: false,
    resolvingCapture: false,
    inView: true,
  };
}

function createCameraState() {
  return {
    latestBeta: null,
    latestGamma: null,
    baseBeta: null,
    baseGamma: null,
    needsCalibration: true,
    orientationReady: false,
    targetOffsetX: 0,
    targetOffsetY: 0,
    windowOffsetX: 0,
    windowOffsetY: 0,
    assistOffsetX: 0,
    assistOffsetY: 0,
    smoothedDeltaX: 0,
    smoothedDeltaY: 0,
  };
}

function createPursuitState() {
  return {
    alignmentScore: 0,
    distanceToButterfly: 0,
    pursuitInfluence: 0,
    nearZoneFactor: 0,
  };
}

function createStartleState() {
  return {
    startleRisk: 0,
    recentMotionBurst: 0,
    recentJitter: 0,
    lastMagnitude: 0,
    isStartled: false,
  };
}

function createTimingState() {
  return {
    cursorPosition: 16,
    cursorDirection: 1,
    cursorSpeed: CAPTURE_TUNING.cursorSpeed,
    zoneCenter: 50,
    zoneStart: 38,
    zoneEnd: 62,
    windowSize: 24,
  };
}

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clearRevealTimer() {
  if (revealTimer) {
    clearTimeout(revealTimer);
    revealTimer = null;
  }
}

function resize() {
  canvas.width = window.innerWidth * devicePixelRatio;
  canvas.height = window.innerHeight * devicePixelRatio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
}

function setStatus(message) {
  statusEl.textContent = message;
}

function renderBuildStamp() {
  if (!buildStamp) return;
  buildStamp.textContent = BUILD_INFO.channel
    ? `build ${BUILD_INFO.label} · ${BUILD_INFO.channel}`
    : `build ${BUILD_INFO.label}`;
}

function showToast(message, duration = 1900) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add('hidden'), duration);
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

function rarityLabel(rarity) {
  if (rarity === 'Epic') return '稀有发现';
  if (rarity === 'Rare') return '稳定捕获';
  return '捕获成功';
}

function updateSpecimenCard() {
  if (!running || !currentButterfly) {
    specimenName.textContent = '等待蝴蝶出现';
    specimenMeta.textContent = '点击开始后进入观察状态';
    return;
  }

  specimenName.textContent = currentButterfly.name;
  const stateCopy = butterflyState.capturePending
    ? '已命中，正在揭晓'
    : mode === 'swipe'
      ? '滑动备用已启用'
      : !butterflyState.inView
        ? '先把镜头转回去找回它'
        : startleState.isStartled
          ? '动作太大，它被惊走了'
          : '缓慢追近 + 入框 + timing + 甩动';
  specimenMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity} · ${stateCopy}`;
}

function configureTimingForVariant(variant) {
  const centerRange = variant.timingZoneCenterRange || [46, 54];
  const zoneCenter = rand(centerRange[0], centerRange[1]);
  const windowSize = variant.timingWindowSize || 22;
  timingState = {
    cursorPosition: rand(10, 90),
    cursorDirection: Math.random() > 0.5 ? 1 : -1,
    cursorSpeed: CAPTURE_TUNING.cursorSpeed,
    zoneCenter,
    zoneStart: clamp(zoneCenter - windowSize * 0.5, 6, 94 - windowSize),
    zoneEnd: clamp(zoneCenter + windowSize * 0.5, windowSize + 6, 94),
    windowSize,
  };
  timingState.zoneCenter = (timingState.zoneStart + timingState.zoneEnd) * 0.5;
}

function recenterObservationWindow() {
  cameraState.baseBeta = cameraState.latestBeta;
  cameraState.baseGamma = cameraState.latestGamma;
  cameraState.orientationReady = Number.isFinite(cameraState.baseBeta) && Number.isFinite(cameraState.baseGamma);
  cameraState.needsCalibration = !cameraState.orientationReady;
  cameraState.targetOffsetX = 0;
  cameraState.targetOffsetY = 0;
  cameraState.windowOffsetX = 0;
  cameraState.windowOffsetY = 0;
  cameraState.assistOffsetX = 0;
  cameraState.assistOffsetY = 0;
  cameraState.smoothedDeltaX = 0;
  cameraState.smoothedDeltaY = 0;
}

function refreshObservationTargets() {
  if (!cameraState.orientationReady) return;
  const betaDelta = clamp(cameraState.latestBeta - cameraState.baseBeta, -WINDOW_TUNING.orientationRangeBeta, WINDOW_TUNING.orientationRangeBeta);
  const gammaDelta = clamp(cameraState.latestGamma - cameraState.baseGamma, -WINDOW_TUNING.orientationRangeGamma, WINDOW_TUNING.orientationRangeGamma);
  cameraState.targetOffsetX = (gammaDelta / WINDOW_TUNING.orientationRangeGamma) * WINDOW_TUNING.maxOffsetX;
  cameraState.targetOffsetY = (betaDelta / WINDOW_TUNING.orientationRangeBeta) * WINDOW_TUNING.maxOffsetY;
}

function updateObservationWindow(dt) {
  const active = mode === 'shake' && motionPermission === 'granted' && cameraState.orientationReady;
  const desiredX = active ? cameraState.targetOffsetX : 0;
  const desiredY = active ? cameraState.targetOffsetY : 0;
  const lerpAmount = clamp(dt * WINDOW_TUNING.smoothing, 0, 1);

  const prevX = cameraState.windowOffsetX;
  const prevY = cameraState.windowOffsetY;
  cameraState.windowOffsetX = lerp(cameraState.windowOffsetX, desiredX, lerpAmount);
  cameraState.windowOffsetY = lerp(cameraState.windowOffsetY, desiredY, lerpAmount);

  const deltaX = cameraState.windowOffsetX - prevX;
  const deltaY = cameraState.windowOffsetY - prevY;
  cameraState.smoothedDeltaX = lerp(cameraState.smoothedDeltaX, deltaX, clamp(dt * 10.5, 0, 1));
  cameraState.smoothedDeltaY = lerp(cameraState.smoothedDeltaY, deltaY, clamp(dt * 10.5, 0, 1));

  if (!active) {
    cameraState.assistOffsetX = lerp(cameraState.assistOffsetX, 0, clamp(dt * WINDOW_TUNING.pursuitDamping, 0, 1));
    cameraState.assistOffsetY = lerp(cameraState.assistOffsetY, 0, clamp(dt * WINDOW_TUNING.pursuitDamping, 0, 1));
  }
}

function getCaptureFrameCenter() {
  const rect = captureFrame.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5 + CAPTURE_TUNING.frameVisualOffsetY,
  };
}

function getPursuitStrength(distance) {
  if (distance <= WINDOW_TUNING.pursuitNoAutoCaptureRadius) return 0;
  if (distance <= WINDOW_TUNING.pursuitNearRadius) {
    return lerp(
      0,
      WINDOW_TUNING.pursuitNearStrength,
      (distance - WINDOW_TUNING.pursuitNoAutoCaptureRadius)
        / Math.max(1, WINDOW_TUNING.pursuitNearRadius - WINDOW_TUNING.pursuitNoAutoCaptureRadius),
    );
  }
  if (distance <= WINDOW_TUNING.pursuitMidRadius) {
    return lerp(
      WINDOW_TUNING.pursuitNearStrength,
      WINDOW_TUNING.pursuitMidStrength,
      (distance - WINDOW_TUNING.pursuitNearRadius)
        / Math.max(1, WINDOW_TUNING.pursuitMidRadius - WINDOW_TUNING.pursuitNearRadius),
    );
  }
  return WINDOW_TUNING.pursuitFarStrength;
}

function getPursuitSlowdown() {
  if (mode !== 'shake' || butterflyState.capturePending || butterflyState.startleUntil > 0) return 0;
  if (pursuitState.alignmentScore <= WINDOW_TUNING.pursuitAlignmentThreshold) return 0;
  if (pursuitState.distanceToButterfly <= WINDOW_TUNING.pursuitNoAutoCaptureRadius) return 0;
  if (pursuitState.distanceToButterfly >= WINDOW_TUNING.pursuitNearRadius) return 0;
  const nearFactor = 1 - clamp(
    (pursuitState.distanceToButterfly - WINDOW_TUNING.pursuitNoAutoCaptureRadius)
      / Math.max(1, WINDOW_TUNING.pursuitNearRadius - WINDOW_TUNING.pursuitNoAutoCaptureRadius),
    0,
    1,
  );
  return nearFactor * WINDOW_TUNING.pursuitSlowdownFactor * clamp(pursuitState.alignmentScore, 0, 1);
}

function projectButterflyToScreen(dt) {
  const frameCenter = getCaptureFrameCenter();
  const baseScreenX = butterflyState.worldX - cameraState.windowOffsetX;
  const baseScreenY = butterflyState.worldY - cameraState.windowOffsetY;
  const dx = baseScreenX - frameCenter.x;
  const dy = baseScreenY - frameCenter.y;
  const distance = Math.hypot(dx, dy);
  const deltaMag = Math.hypot(cameraState.smoothedDeltaX, cameraState.smoothedDeltaY);

  pursuitState.distanceToButterfly = distance;
  pursuitState.alignmentScore = 0;
  pursuitState.pursuitInfluence = 0;
  pursuitState.nearZoneFactor = distance < WINDOW_TUNING.pursuitNearRadius
    ? 1 - clamp(
      (distance - WINDOW_TUNING.pursuitNoAutoCaptureRadius)
        / Math.max(1, WINDOW_TUNING.pursuitNearRadius - WINDOW_TUNING.pursuitNoAutoCaptureRadius),
      0,
      1,
    )
    : 0;

  let desiredAssistX = 0;
  let desiredAssistY = 0;
  if (
    mode === 'shake'
    && motionPermission === 'granted'
    && cameraState.orientationReady
    && !butterflyState.capturePending
    && butterflyState.startleUntil <= 0
    && distance > 1
    && deltaMag > WINDOW_TUNING.pursuitDeadZone
  ) {
    const dirX = dx / distance;
    const dirY = dy / distance;
    const intentX = cameraState.smoothedDeltaX / deltaMag;
    const intentY = cameraState.smoothedDeltaY / deltaMag;
    const alignment = dirX * intentX + dirY * intentY;
    pursuitState.alignmentScore = alignment;

    if (alignment > WINDOW_TUNING.pursuitAlignmentThreshold) {
      const strength = getPursuitStrength(distance);
      const assistMagnitude = clamp(
        (alignment - WINDOW_TUNING.pursuitAlignmentThreshold)
          / (1 - WINDOW_TUNING.pursuitAlignmentThreshold)
          * deltaMag
          * WINDOW_TUNING.pursuitResponse
          * strength,
        0,
        WINDOW_TUNING.pursuitAssistMaxOffset,
      );
      pursuitState.pursuitInfluence = assistMagnitude;
      desiredAssistX = dirX * assistMagnitude;
      desiredAssistY = dirY * assistMagnitude;
    }
  }

  const assistLerp = clamp(dt * WINDOW_TUNING.pursuitDamping, 0, 1);
  cameraState.assistOffsetX = lerp(cameraState.assistOffsetX, desiredAssistX, assistLerp);
  cameraState.assistOffsetY = lerp(cameraState.assistOffsetY, desiredAssistY, assistLerp);

  const viewOffsetX = cameraState.windowOffsetX + cameraState.assistOffsetX;
  const viewOffsetY = cameraState.windowOffsetY + cameraState.assistOffsetY;
  butterflyState.screenX = butterflyState.worldX - viewOffsetX;
  butterflyState.screenY = butterflyState.worldY - viewOffsetY;
  butterflyState.x = butterflyState.screenX;
  butterflyState.y = butterflyState.screenY;
  butterflyState.inView = butterflyState.screenX > -FLIGHT_TUNING.offscreenAllowance
    && butterflyState.screenX < window.innerWidth + FLIGHT_TUNING.offscreenAllowance
    && butterflyState.screenY > -FLIGHT_TUNING.offscreenAllowance
    && butterflyState.screenY < window.innerHeight + FLIGHT_TUNING.offscreenAllowance;
}

function getTimingMetaCopy() {
  if (!running || !currentButterfly) return '等待开始';
  if (mode !== 'shake') return '滑动备用';
  if (!butterflyState.inView) return '把镜头转回去找回它';
  if (startleState.isStartled) return '动作放轻一点';
  const inside = isButterflyInsideCaptureFrame();
  const timingReady = isTimingHit();
  if (inside && timingReady) return '可出手';
  if (inside) return '等 X 入窗';
  return '先入框';
}

function getPanelMiniCopy() {
  if (!running || !cameraReady) return '点击开始体验';
  if (mode === 'swipe') return '备用：滑动';
  return `主玩法：甩动 · ${getTimingMetaCopy()}`;
}

function syncPanelCollapse() {
  const canCollapse = running && cameraReady && mode === 'shake';
  panelCollapsed = canCollapse && !panelPinnedOpen;
}

function renderPanelUi() {
  syncPanelCollapse();
  bottomPanel.classList.toggle('is-collapsed', panelCollapsed);
  panelMini.classList.toggle('hidden', !panelCollapsed);
  bottomPanelExpanded.classList.toggle('hidden', panelCollapsed);
  panelCollapseBtn.classList.toggle('hidden', !running);
  panelMiniLabel.textContent = getPanelMiniCopy();
  panelExpandBtn.setAttribute('aria-expanded', panelCollapsed ? 'false' : 'true');
}

function pulseTimingMiss() {
  timingHud.classList.remove('is-miss');
  void timingHud.offsetWidth;
  timingHud.classList.add('is-miss');
  clearTimeout(pulseTimingMiss.timer);
  pulseTimingMiss.timer = setTimeout(() => timingHud.classList.remove('is-miss'), 240);
}

function renderTimingUi() {
  captureCluster.classList.toggle('hidden', !running);
  captureCluster.classList.toggle('is-passive', mode !== 'shake');
  timingHud.classList.toggle('hidden', !running || mode !== 'shake');
  timingWindow.style.left = `${timingState.zoneStart}%`;
  timingWindow.style.width = `${timingState.zoneEnd - timingState.zoneStart}%`;
  timingCursor.style.left = `${timingState.cursorPosition}%`;
  timingMeta.textContent = getTimingMetaCopy();
  const ready = mode === 'shake' && isButterflyInsideCaptureFrame() && isTimingHit();
  captureFrame.classList.toggle('is-ready', ready);
  captureFrame.classList.toggle('is-active', running && mode === 'shake');
  timingHud.classList.toggle('is-shake-active', running && mode === 'shake');
  timingHud.classList.toggle('is-ready', ready);
  if (!running || !currentButterfly) {
    timingMeta.textContent = mode === 'swipe' ? '滑动备用' : '等待目标';
  }
  updateSpecimenCard();
  renderPanelUi();
}

function updateTiming(dt) {
  if (!running || !currentButterfly) return;
  timingState.cursorPosition += timingState.cursorDirection * timingState.cursorSpeed * dt;
  if (timingState.cursorPosition >= 100) {
    timingState.cursorPosition = 100;
    timingState.cursorDirection = -1;
  } else if (timingState.cursorPosition <= 0) {
    timingState.cursorPosition = 0;
    timingState.cursorDirection = 1;
  }
}

function getCaptureFrameMetrics() {
  const rect = captureFrame.getBoundingClientRect();
  const center = getCaptureFrameCenter();
  return {
    centerX: center.x,
    centerY: center.y,
    halfW: rect.width * 0.5,
    halfH: rect.height * 0.5,
  };
}

function isButterflyInsideCaptureFrame() {
  if (!running || !currentButterfly || !butterflyState.alive) return false;
  const frame = getCaptureFrameMetrics();
  const marginX = Math.min(CAPTURE_TUNING.frameHitMarginX, butterflyState.captureRadius * 0.18);
  const marginY = Math.min(CAPTURE_TUNING.frameHitMarginY, butterflyState.captureRadius * 0.16);
  return Math.abs(butterflyState.x - frame.centerX) <= frame.halfW - marginX
    && Math.abs(butterflyState.y - frame.centerY) <= frame.halfH - marginY;
}

function isTimingHit() {
  return timingState.cursorPosition >= timingState.zoneStart && timingState.cursorPosition <= timingState.zoneEnd;
}

function configureSlicedPart(partEl, imageEl, box, source) {
  partEl.style.left = `${box.x}%`;
  partEl.style.top = `${box.y}%`;
  partEl.style.width = `${box.w}%`;
  partEl.style.height = `${box.h}%`;
  imageEl.src = source;
  imageEl.style.left = `${(-box.x / box.w) * 100}%`;
  imageEl.style.top = `${(-box.y / box.h) * 100}%`;
  imageEl.style.width = `${(100 / box.w) * 100}%`;
  imageEl.style.height = `${(100 / box.h) * 100}%`;
}

function setRigMode(modeName) {
  butterfly.dataset.rigMode = modeName;
  const sliced = modeName === 'sliced';
  butterflyRig.classList.toggle('hidden', !sliced);
  butterflyArt.classList.toggle('hidden', sliced);
  butterflySprite.classList.add('hidden');
}

function applyButterflyVariant(variant) {
  currentButterfly = variant;
  butterfly.style.setProperty('--size', `${variant.size}px`);
  butterfly.style.setProperty('--wing-a', variant.palette.wingA);
  butterfly.style.setProperty('--wing-b', variant.palette.wingB);
  butterfly.style.setProperty('--wing-c', variant.palette.wingC);
  butterfly.style.setProperty('--wing-d', variant.palette.wingD);
  butterfly.style.setProperty('--body-color', variant.palette.body);
  butterfly.style.setProperty('--front-origin-left-x', `${variant.rig.frontPivot.x}%`);
  butterfly.style.setProperty('--front-origin-right-x', `${100 - variant.rig.frontPivot.x}%`);
  butterfly.style.setProperty('--front-origin-y', `${variant.rig.frontPivot.y}%`);
  butterfly.style.setProperty('--back-origin-left-x', `${variant.rig.backPivot.x}%`);
  butterfly.style.setProperty('--back-origin-right-x', `${100 - variant.rig.backPivot.x}%`);
  butterfly.style.setProperty('--back-origin-y', `${variant.rig.backPivot.y}%`);
  butterfly.style.setProperty('--body-scale-base', variant.rig.bodyScale);
  captureCluster.style.setProperty('--frame-size', `${CAPTURE_TUNING.frameSize}px`);
  captureCluster.style.setProperty('--frame-size-compact', `${CAPTURE_TUNING.frameSizeCompact}px`);

  const rigMode = variant.rigMode === 'sliced' && variant.assetSrc ? 'sliced' : 'placeholder';
  setRigMode(rigMode);

  if (rigMode === 'sliced') {
    butterflySprite.src = variant.assetSrc;
    configureSlicedPart(rigParts.body, rigPartImages.body, variant.sliceBoxes.body, variant.assetSrc);
    configureSlicedPart(rigParts.leftWingFront, rigPartImages.leftWingFront, variant.sliceBoxes.leftWingFront, variant.assetSrc);
    configureSlicedPart(rigParts.rightWingFront, rigPartImages.rightWingFront, variant.sliceBoxes.rightWingFront, variant.assetSrc);
    configureSlicedPart(rigParts.leftWingBack, rigPartImages.leftWingBack, variant.sliceBoxes.leftWingBack, variant.assetSrc);
    configureSlicedPart(rigParts.rightWingBack, rigPartImages.rightWingBack, variant.sliceBoxes.rightWingBack, variant.assetSrc);
  } else {
    butterflySprite.removeAttribute('src');
  }

  updateSpecimenCard();
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

function setMotionState(nextState) {
  if (butterflyState.motionState === nextState) return;
  butterflyState.motionState = nextState;
  butterflyState.motionStateTime = 0;
}

function placeButterfly() {
  butterfly.style.left = `${butterflyState.screenX}px`;
  butterfly.style.top = `${butterflyState.screenY}px`;
  butterfly.style.setProperty('--dir-x', butterflyState.dirX);
  butterfly.style.setProperty('--flight-tilt', `${butterflyState.bankAngle}deg`);
  butterfly.style.setProperty('--bank-angle', `${clamp(butterflyState.bankAngle * 0.42, -10, 10)}deg`);
  butterfly.style.setProperty('--figure-lift', `${butterflyState.lift}px`);
}

function spawnButterfly() {
  clearRevealTimer();
  const variant = pickButterflyVariant();
  applyButterflyVariant(variant);
  configureTimingForVariant(variant);
  recenterObservationWindow();
  pursuitState = createPursuitState();
  startleState = createStartleState();
  const centerBias = rand(0.32, 0.68);
  const spawnX = window.innerWidth * centerBias;
  const spawnY = window.innerHeight * rand(0.24, 0.52);
  butterflyState = {
    worldX: spawnX,
    worldY: spawnY,
    screenX: spawnX,
    screenY: spawnY,
    x: spawnX,
    y: spawnY,
    heading: rand(-0.55, 0.55),
    targetHeading: rand(-0.7, 0.7),
    speed: variant.motion.baseSpeed * 0.8,
    targetSpeed: variant.motion.baseSpeed,
    t: 0,
    alive: true,
    visible: true,
    hoverRemaining: 0,
    nextDecisionIn: rand(...variant.motion.decisionWindow),
    dirX: Math.random() > 0.5 ? 1 : -1,
    bankAngle: 0,
    lift: 0,
    captureRadius: variant.captureRadius,
    motionState: MOTION_STATES.HOVER_IDLE,
    motionStateTime: 0,
    flapPhase: rand(0, Math.PI * 2),
    flapRate: 4.6,
    nearMissCooldown: 0,
    startleUntil: 0,
    staggerUntil: 0,
    bodyTilt: 0,
    bodyYawFake: 0,
    escapeBoost: 0,
    lastVx: 0,
    lastVy: 0,
    capturePending: false,
    resolvingCapture: false,
    inView: true,
  };

  butterfly.classList.remove('hidden', 'capture-hit', 'miss');
  butterflyFigure.classList.remove('capture-hit');
  resultCard.classList.add('hidden');
  setStatus(
    mode === 'swipe'
      ? '观察飞行轨迹后可用滑动备用捕捉'
      : '蝴蝶已出现，将其引入中央画框并等待 timing',
  );
  updateSpecimenCard();
  placeButterfly();
  updateRigPose(0, 0, 0, 0);
  renderTimingUi();
}

function respawnButterfly() {
  spawnButterfly();
  swipeTrail = [];
  lastPointer = null;
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function angleDelta(current, target) {
  let delta = target - current;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  return delta;
}

function chooseNextFlightDecision() {
  if (!currentButterfly || !butterflyState.alive || butterflyState.capturePending) return;
  const { motion } = currentButterfly;
  const centerX = window.innerWidth * 0.5;
  const centerY = window.innerHeight * 0.4;
  const offsetX = centerX - butterflyState.worldX;
  const offsetY = centerY - butterflyState.worldY;
  const edgeForceX = butterflyState.worldX < motion.boundaryMargin ? 0.95 : butterflyState.worldX > window.innerWidth - motion.boundaryMargin ? -0.95 : 0;
  const edgeForceY = butterflyState.worldY < 90 ? 0.8 : butterflyState.worldY > window.innerHeight * 0.68 ? -0.9 : 0;
  const shouldHover = Math.random() < motion.hoverChance;

  if (shouldHover) {
    butterflyState.hoverRemaining = rand(...motion.hoverDuration);
    butterflyState.targetSpeed = motion.baseSpeed * rand(0.08, 0.18);
    butterflyState.targetHeading += rand(-0.35, 0.35);
  } else {
    const centerHeading = Math.atan2(offsetY * 0.45 + edgeForceY * 90, offsetX * 0.65 + edgeForceX * 120);
    butterflyState.targetHeading = centerHeading + rand(-0.75, 0.75);
    butterflyState.targetSpeed = motion.baseSpeed + rand(-motion.speedJitter, motion.speedJitter);
  }

  butterflyState.nextDecisionIn = rand(...motion.decisionWindow);
}

function applyRigPoseVariable(name, value, unit = 'deg') {
  butterfly.style.setProperty(name, `${value}${unit}`);
}

function updateRigPose(dt, turnDelta, vx, vy) {
  if (!currentButterfly) return;

  const { motion } = currentButterfly;
  butterflyState.motionStateTime += dt;

  let nextState = MOTION_STATES.FLAP_FORWARD;
  if (butterflyState.capturePending) {
    nextState = MOTION_STATES.CAPTURED_STAGGER;
  } else if (butterflyState.startleUntil > 0) {
    nextState = MOTION_STATES.STARTLED_ESCAPE;
  } else if (butterflyState.hoverRemaining > 0.08 && butterflyState.speed < motion.baseSpeed * 0.62) {
    nextState = MOTION_STATES.HOVER_IDLE;
  } else if (turnDelta < -0.12) {
    nextState = MOTION_STATES.BANK_LEFT;
  } else if (turnDelta > 0.12) {
    nextState = MOTION_STATES.BANK_RIGHT;
  }
  setMotionState(nextState);

  const risingFactor = clamp((-vy) / Math.max(18, motion.baseSpeed * 0.65), 0, 1);
  const hoverFactor = butterflyState.motionState === MOTION_STATES.HOVER_IDLE ? 1 : 0;
  const stateRate = {
    [MOTION_STATES.HOVER_IDLE]: 3.1,
    [MOTION_STATES.FLAP_FORWARD]: 4.9,
    [MOTION_STATES.BANK_LEFT]: 5.3,
    [MOTION_STATES.BANK_RIGHT]: 5.3,
    [MOTION_STATES.STARTLED_ESCAPE]: 7.6,
    [MOTION_STATES.CAPTURED_STAGGER]: 8.4,
  }[butterflyState.motionState];

  butterflyState.flapRate += (stateRate + risingFactor * 0.8 - butterflyState.flapRate) * clamp(dt * 5.4, 0, 1);
  butterflyState.flapPhase += dt * butterflyState.flapRate * Math.PI * 2;

  const phaseOffset = 0.36 + currentButterfly.size * 0.0022;
  const flapLeftFront = (Math.sin(butterflyState.flapPhase) + 1) * 0.5;
  const flapRightFront = (Math.sin(butterflyState.flapPhase + phaseOffset) + 1) * 0.5;
  const flapLeftBack = (Math.sin(butterflyState.flapPhase + phaseOffset * 0.55) + 1) * 0.5;
  const flapRightBack = (Math.sin(butterflyState.flapPhase + phaseOffset * 1.4) + 1) * 0.5;

  let leftBias = 1;
  let rightBias = 1;
  let bodyTiltTarget = turnDelta * 7;
  let bodyYawTarget = turnDelta * 5;
  let jitterX = 0;
  let jitterY = 0;
  let bobOffset = Math.sin(butterflyState.t * 3.2) * (hoverFactor ? 2.4 : 1.1);
  let shadowScale = 0.9;
  let shadowOpacity = 0.26;

  if (butterflyState.motionState === MOTION_STATES.BANK_LEFT) {
    leftBias = 0.78;
    rightBias = 1.1;
    bodyTiltTarget = -12;
    bodyYawTarget = -5;
  } else if (butterflyState.motionState === MOTION_STATES.BANK_RIGHT) {
    leftBias = 1.1;
    rightBias = 0.78;
    bodyTiltTarget = 12;
    bodyYawTarget = 5;
  } else if (butterflyState.motionState === MOTION_STATES.STARTLED_ESCAPE) {
    leftBias = 0.9 + Math.sin(butterflyState.t * 31) * 0.08;
    rightBias = 1.05 + Math.cos(butterflyState.t * 28) * 0.08;
    bodyTiltTarget = clamp(turnDelta * 20 + Math.sin(butterflyState.t * 34) * 7, -18, 18);
    bodyYawTarget = clamp(turnDelta * 9, -9, 9);
    jitterX = Math.sin(butterflyState.t * 42) * 1.8;
    jitterY = Math.cos(butterflyState.t * 36) * 1.4;
    bobOffset += Math.sin(butterflyState.t * 19) * 1.5;
  } else if (butterflyState.motionState === MOTION_STATES.CAPTURED_STAGGER) {
    leftBias = 1.18;
    rightBias = 0.82;
    bodyTiltTarget = Math.sin(butterflyState.t * 22) * 16;
    bodyYawTarget = Math.cos(butterflyState.t * 20) * 6;
    jitterX = Math.sin(butterflyState.t * 54) * 2.2;
    jitterY = Math.cos(butterflyState.t * 43) * 1.8;
    bobOffset += Math.sin(butterflyState.t * 28) * 2.2;
  }

  const frontOpen = {
    [MOTION_STATES.HOVER_IDLE]: 36,
    [MOTION_STATES.FLAP_FORWARD]: 58,
    [MOTION_STATES.BANK_LEFT]: 52,
    [MOTION_STATES.BANK_RIGHT]: 52,
    [MOTION_STATES.STARTLED_ESCAPE]: 74,
    [MOTION_STATES.CAPTURED_STAGGER]: 86,
  }[butterflyState.motionState] + risingFactor * 10;

  const backOpen = frontOpen * 0.7;
  const frontClosed = butterflyState.motionState === MOTION_STATES.HOVER_IDLE ? -6 : -16;
  const backClosed = butterflyState.motionState === MOTION_STATES.HOVER_IDLE ? -10 : -18;

  const frontLeftAngle = lerp(frontClosed, frontOpen * leftBias, flapLeftFront);
  const frontRightAngle = -lerp(frontClosed, frontOpen * rightBias, flapRightFront);
  const backLeftAngle = lerp(backClosed, backOpen * leftBias * 0.94, flapLeftBack);
  const backRightAngle = -lerp(backClosed, backOpen * rightBias * 0.94, flapRightBack);

  const frontLeftScale = 0.9 + flapLeftFront * 0.14;
  const frontRightScale = 0.9 + flapRightFront * 0.14;
  const backLeftScale = 0.9 + flapLeftBack * 0.11;
  const backRightScale = 0.9 + flapRightBack * 0.11;

  butterflyState.bodyTilt += (bodyTiltTarget - butterflyState.bodyTilt) * clamp(dt * 7.2, 0, 1);
  butterflyState.bodyYawFake += (bodyYawTarget - butterflyState.bodyYawFake) * clamp(dt * 6.5, 0, 1);
  shadowScale = 0.84 + (flapLeftFront + flapRightFront) * 0.08;
  shadowOpacity = 0.2 + (flapLeftBack + flapRightBack) * 0.12;

  applyRigPoseVariable('--body-tilt', butterflyState.bodyTilt);
  applyRigPoseVariable('--body-yaw', butterflyState.bodyYawFake);
  butterfly.style.setProperty('--body-bob', `${bobOffset}px`);
  butterfly.style.setProperty('--body-jitter-x', `${jitterX}px`);
  butterfly.style.setProperty('--body-jitter-y', `${jitterY}px`);
  applyRigPoseVariable('--wing-front-left-angle', frontLeftAngle);
  applyRigPoseVariable('--wing-front-right-angle', frontRightAngle);
  applyRigPoseVariable('--wing-back-left-angle', backLeftAngle);
  applyRigPoseVariable('--wing-back-right-angle', backRightAngle);
  butterfly.style.setProperty('--wing-front-left-scale', frontLeftScale);
  butterfly.style.setProperty('--wing-front-right-scale', frontRightScale);
  butterfly.style.setProperty('--wing-back-left-scale', backLeftScale);
  butterfly.style.setProperty('--wing-back-right-scale', backRightScale);
  butterfly.style.setProperty('--shadow-scale', shadowScale);
  butterfly.style.setProperty('--shadow-opacity', shadowOpacity);
}

function finalizeCaptureReveal() {
  if (!currentButterfly || butterflyState.resolvingCapture) return;
  butterflyState.capturePending = false;
  butterflyState.alive = false;
  butterflyState.resolvingCapture = true;
  butterfly.classList.add('capture-hit');
  setStatus('捕捉完成，正在揭晓');
  drawBurst(butterflyState.screenX, butterflyState.screenY, currentButterfly.palette.wingB);

  revealTimer = setTimeout(() => {
    butterfly.classList.remove('capture-hit');
    butterfly.classList.add('hidden');
    resultBadge.textContent = rarityLabel(currentButterfly.rarity);
    resultTitle.textContent = `你抓到了${currentButterfly.name}`;
    resultMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity}`;
    resultFlavor.textContent = currentButterfly.flavor;
    resultCard.classList.remove('hidden');
    specimenMeta.textContent = `已完成捕捉 · ${currentButterfly.role} · ${currentButterfly.rarity}`;
    butterflyState.resolvingCapture = false;
    revealTimer = null;
  }, 200);
}

function updateButterfly(dt) {
  if (!currentButterfly || (!butterflyState.alive && !butterflyState.capturePending)) return;

  const { motion } = currentButterfly;
  butterflyState.t += dt;
  butterflyState.nextDecisionIn -= dt;
  butterflyState.nearMissCooldown = Math.max(0, butterflyState.nearMissCooldown - dt);

  if (butterflyState.hoverRemaining > 0) {
    butterflyState.hoverRemaining -= dt;
  }

  if (butterflyState.startleUntil > 0) {
    butterflyState.startleUntil = Math.max(0, butterflyState.startleUntil - dt);
    if (butterflyState.startleUntil === 0) {
      butterflyState.escapeBoost = 0;
      startleState.isStartled = false;
    }
  }

  if (butterflyState.capturePending) {
    butterflyState.staggerUntil = Math.max(0, butterflyState.staggerUntil - dt);
    if (butterflyState.staggerUntil === 0) {
      finalizeCaptureReveal();
      return;
    }
  } else if (butterflyState.nextDecisionIn <= 0) {
    chooseNextFlightDecision();
  }

  const boundaryBiasX = butterflyState.worldX < motion.boundaryMargin ? 1 : butterflyState.worldX > window.innerWidth - motion.boundaryMargin ? -1 : 0;
  const boundaryBiasY = butterflyState.worldY < 82 ? 0.8 : butterflyState.worldY > window.innerHeight * 0.68 ? -1 : 0;

  if (!butterflyState.capturePending && (boundaryBiasX || boundaryBiasY)) {
    butterflyState.targetHeading = Math.atan2(boundaryBiasY + rand(-0.15, 0.15), boundaryBiasX + rand(-0.15, 0.15));
    butterflyState.targetSpeed = motion.baseSpeed + motion.speedJitter * 0.4;
    butterflyState.hoverRemaining = 0;
  }

  if (butterflyState.startleUntil > 0) {
    butterflyState.targetSpeed = motion.baseSpeed + motion.speedJitter * 1.3;
  }

  const pursuitSlowdown = getPursuitSlowdown();
  const headingAdjust = angleDelta(butterflyState.heading, butterflyState.targetHeading);
  const turnRate = butterflyState.capturePending ? motion.turnRate * 1.6 : motion.turnRate;
  butterflyState.heading += headingAdjust * clamp(dt * turnRate, 0, 1);

  const speedTarget = butterflyState.capturePending
    ? motion.baseSpeed * 0.16
    : (butterflyState.targetSpeed + butterflyState.escapeBoost * 18) * (1 - pursuitSlowdown);
  butterflyState.speed += (speedTarget - butterflyState.speed) * clamp(dt * 3.2, 0, 1);

  const sway = Math.sin(butterflyState.t * 1.7 + currentButterfly.size * 0.02) * motion.swayAmp;
  const bob = Math.cos(butterflyState.t * 2.5 + currentButterfly.size * 0.03) * motion.bobAmp;
  const hoverDampen = butterflyState.hoverRemaining > 0 ? 0.36 : 1;

  let vx = Math.cos(butterflyState.heading) * butterflyState.speed + sway * hoverDampen;
  let vy = Math.sin(butterflyState.heading) * butterflyState.speed * 0.72 + bob;

  if (butterflyState.startleUntil > 0) {
    vx += Math.cos(butterflyState.t * 22) * 12;
    vy += Math.sin(butterflyState.t * 18) * 8;
  }

  if (butterflyState.capturePending) {
    vx *= 0.22;
    vy *= 0.18;
  }

  butterflyState.worldX += vx * dt;
  butterflyState.worldY += vy * dt;
  butterflyState.dirX = vx >= 0 ? 1 : -1;
  butterflyState.bankAngle = clamp(vx * 0.08 + vy * 0.04, -16, 16);
  butterflyState.lift = Math.sin(butterflyState.t * 5.2) * (motion.bobAmp * 0.12);
  butterflyState.lastVx = vx;
  butterflyState.lastVy = vy;

  projectButterflyToScreen(dt);
  updateRigPose(dt, headingAdjust, vx, vy);
  placeButterfly();
}

function drawTrail() {
  if (swipeTrail.length < 2) return;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(136, 215, 255, 0.75)';
  ctx.beginPath();
  ctx.moveTo(swipeTrail[0].x, swipeTrail[0].y);
  for (let i = 1; i < swipeTrail.length; i += 1) {
    ctx.lineTo(swipeTrail[i].x, swipeTrail[i].y);
  }
  ctx.stroke();
  const now = performance.now();
  swipeTrail = swipeTrail.filter((point) => now - point.t < 160);
}

function animate(now) {
  if (!running) return;
  if (!lastFrameAt) lastFrameAt = now;
  const dt = Math.min(0.033, (now - lastFrameAt) / 1000);
  lastFrameAt = now;

  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawTrail();
  updateObservationWindow(dt);
  updateTiming(dt);
  updateButterfly(dt);
  renderTimingUi();
  requestAnimationFrame(animate);
}

function segmentDistanceToPoint(ax, ay, bx, by, px, py) {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLengthSquared = abx * abx + aby * aby;
  if (!abLengthSquared) return Math.hypot(px - ax, py - ay);
  const ratio = clamp((apx * abx + apy * aby) / abLengthSquared, 0, 1);
  const nearestX = ax + abx * ratio;
  const nearestY = ay + aby * ratio;
  return Math.hypot(px - nearestX, py - nearestY);
}

function triggerStartledEscape(originX, originY) {
  if (!currentButterfly || !butterflyState.alive || butterflyState.capturePending || butterflyState.nearMissCooldown > 0) return;

  const awayX = butterflyState.screenX - originX;
  const awayY = butterflyState.screenY - originY;
  butterflyState.hoverRemaining = 0;
  butterflyState.startleUntil = rand(0.38, 0.56);
  butterflyState.nearMissCooldown = 0.34;
  butterflyState.escapeBoost = rand(STARTLE_TUNING.escapeBoost - 4, STARTLE_TUNING.escapeBoost + 2);
  butterflyState.targetHeading = Math.atan2(awayY + rand(-28, 28), awayX + rand(-28, 28));
  butterflyState.targetSpeed = currentButterfly.motion.baseSpeed + currentButterfly.motion.speedJitter * 1.45;
  startleState.isStartled = true;
  setMotionState(MOTION_STATES.STARTLED_ESCAPE);
  butterfly.classList.add('miss');
  setTimeout(() => butterfly.classList.remove('miss'), 280);
}

function handleCaptureSuccess(trigger) {
  if (!butterflyState.alive || !currentButterfly || butterflyState.capturePending) return;

  butterflyState.capturePending = true;
  butterflyState.staggerUntil = 0.3;
  butterflyState.hoverRemaining = 0;
  butterflyState.escapeBoost = 0;
  setMotionState(MOTION_STATES.CAPTURED_STAGGER);
  setStatus(trigger === 'shake' ? 'timing 命中成功，蝴蝶正在失稳' : '命中成功，蝴蝶正在失稳');
  showToast(`${currentButterfly.name} 已被命中`);
  if (navigator.vibrate) navigator.vibrate([24, 18, 46]);
  updateSpecimenCard();
}

function handleCaptureFail(reason = 'miss') {
  if (!currentButterfly) return;
  setStatus(
    reason === 'timing_miss'
      ? '时机不对，等 X 落入 MN 再甩动'
      : reason === 'frame_miss'
        ? '蝴蝶不在中央画框中'
        : reason === 'weak_shake'
          ? '甩动幅度不足，建议切回滑动主流程'
          : '没有命中，再观察一下飞行轨迹',
  );
  butterfly.classList.add('miss');
  showToast(
    reason === 'timing_miss'
      ? '当前 X 不在高亮窗口 MN 内'
      : reason === 'frame_miss'
        ? '先把蝴蝶引入中央画框'
        : reason === 'weak_shake'
          ? '动作太轻，或蝴蝶不在捕获框内'
          : '划得再快一点，尽量掠过飞行中心',
  );
  setTimeout(() => butterfly.classList.remove('miss'), 280);
  if (mode === 'shake') pulseTimingMiss();
}

function drawBurst(x, y, accentColor) {
  const particles = Array.from({ length: 18 }, () => ({
    x,
    y,
    vx: rand(-3.8, 3.8),
    vy: rand(-3.8, 3.8),
    life: rand(18, 32),
  }));

  function frame() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawTrail();
    let aliveCount = 0;
    for (const particle of particles) {
      if (particle.life <= 0) continue;
      aliveCount += 1;
      particle.life -= 1;
      particle.x += particle.vx;
      particle.y += particle.vy;
      ctx.fillStyle = `rgba(${hexToRgb(accentColor)}, ${Math.max(0, particle.life / 32)})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (aliveCount > 0) requestAnimationFrame(frame);
  }

  frame();
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

function onPointerMove(clientX, clientY) {
  const now = performance.now();
  swipeTrail.push({ x: clientX, y: clientY, t: now });

  if (!lastPointer) {
    lastPointer = { x: clientX, y: clientY, t: now };
    return;
  }

  if (mode === 'swipe' && butterflyState.alive && !butterflyState.capturePending) {
    const dt = Math.max(1, now - lastPointer.t);
    const distance = Math.hypot(clientX - lastPointer.x, clientY - lastPointer.y);
    const speed = distance / dt;
    const trackDistance = segmentDistanceToPoint(
      lastPointer.x,
      lastPointer.y,
      clientX,
      clientY,
      butterflyState.x,
      butterflyState.y,
    );

    if (speed > 0.62 && trackDistance <= butterflyState.captureRadius) {
      handleCaptureSuccess('swipe');
    } else if (
      speed > 0.52
      && trackDistance <= butterflyState.captureRadius * 1.7
      && trackDistance > butterflyState.captureRadius
    ) {
      triggerStartledEscape(clientX, clientY);
    }
  }

  lastPointer = { x: clientX, y: clientY, t: now };
}

async function startExperience() {
  if (running && cameraReady) {
    respawnButterfly();
    setStatus('重新进入观察状态');
    showToast('新的蝴蝶已出现');
    return;
  }

  try {
    setStatus('正在打开相机');
    await startCamera();
    running = true;
    panelPinnedOpen = false;
    startBtn.textContent = '重新召唤蝴蝶';
    respawnButterfly();
    showToast('相机已启动。缓慢朝蝴蝶方向移动镜头把它逼近，再入框 + timing + 甩动');
    if (!lastFrameAt) requestAnimationFrame(animate);
  } catch (error) {
    console.error(error);
    setStatus('相机启动失败');
    showToast('请用 iPhone Safari 通过 HTTPS 打开，并允许相机权限', 2600);
  }
}

async function setMode(nextMode) {
  if (nextMode === 'shake') {
    try {
      const granted = await ensureMotionPermission();
      if (!granted) {
        const message = motionPermission === 'unsupported'
          ? '当前设备不支持甩动权限，已保留滑动主流程'
          : '未获得动作权限，继续使用滑动主流程即可';
        mode = 'swipe';
        swipeModeBtn.classList.add('active');
        shakeModeBtn.classList.remove('active');
        showToast(message, 2200);
        setStatus(running ? '滑动备用已启用' : '等待开始');
        updateSpecimenCard();
        renderTimingUi();
        return;
      }
    } catch (error) {
      console.error(error);
      motionPermission = 'denied';
      mode = 'swipe';
      swipeModeBtn.classList.add('active');
      shakeModeBtn.classList.remove('active');
      showToast('动作权限请求失败，继续使用滑动主流程即可', 2200);
      setStatus(running ? '滑动备用已启用' : '等待开始');
      updateSpecimenCard();
      renderTimingUi();
      return;
    }
  }

  mode = nextMode;
  panelPinnedOpen = false;
  if (mode === 'shake' && Number.isFinite(cameraState.latestBeta) && Number.isFinite(cameraState.latestGamma)) {
    recenterObservationWindow();
  }
  swipeModeBtn.classList.toggle('active', mode === 'swipe');
  shakeModeBtn.classList.toggle('active', mode === 'shake');

  if (mode === 'swipe') {
    setStatus(running ? '滑动备用已启用' : '等待开始');
  } else if (motionPermission === 'granted') {
    setStatus('主玩法已启用：先稳稳追近，再入框看准 timing');
    showToast('缓慢朝蝴蝶方向移动镜头，把它追近后再入框甩动');
  } else {
    setStatus('甩动不可用，建议继续滑动主流程');
  }

  updateSpecimenCard();
  renderTimingUi();
}

window.addEventListener('resize', resize);
resize();

window.addEventListener('touchstart', (event) => {
  const touch = event.touches[0];
  if (touch) lastPointer = { x: touch.clientX, y: touch.clientY, t: performance.now() };
}, { passive: true });

window.addEventListener('touchmove', (event) => {
  const touch = event.touches[0];
  if (touch) onPointerMove(touch.clientX, touch.clientY);
}, { passive: true });

window.addEventListener('mousemove', (event) => onPointerMove(event.clientX, event.clientY));
window.addEventListener('touchend', () => { lastPointer = null; }, { passive: true });
window.addEventListener('mouseup', () => { lastPointer = null; });

window.addEventListener('deviceorientation', (event) => {
  if (typeof event.beta !== 'number' || typeof event.gamma !== 'number') return;
  cameraState.latestBeta = event.beta;
  cameraState.latestGamma = event.gamma;
  if (cameraState.needsCalibration) {
    recenterObservationWindow();
  } else {
    refreshObservationTargets();
  }
});

window.addEventListener('devicemotion', (event) => {
  if (mode !== 'shake' || motionPermission !== 'granted' || !butterflyState.alive || butterflyState.capturePending || shakeCooldown) return;
  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  if (!acceleration) return;

  const magnitude = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2);
  const jitter = Math.abs(magnitude - startleState.lastMagnitude);
  startleState.lastMagnitude = magnitude;
  startleState.recentMotionBurst = magnitude;
  startleState.recentJitter = jitter;

  const nearEnoughToStartle = pursuitState.distanceToButterfly > 0
    && pursuitState.distanceToButterfly <= STARTLE_TUNING.startleNearRadius;
  const shouldStartle = STARTLE_TUNING.enabled
    && nearEnoughToStartle
    && (magnitude > STARTLE_TUNING.motionThreshold || jitter > STARTLE_TUNING.jitterThreshold)
    && butterflyState.startleUntil <= 0
    && butterflyState.inView;

  if (magnitude > CAPTURE_TUNING.shakeCaptureThreshold) {
    shakeCooldown = true;
    const insideFrame = isButterflyInsideCaptureFrame();
    const timingReady = isTimingHit();

    if (insideFrame && timingReady) {
      handleCaptureSuccess('shake');
    } else if (!insideFrame) {
      handleCaptureFail('frame_miss');
      if (shouldStartle) {
        const frame = getCaptureFrameMetrics();
        triggerStartledEscape(frame.centerX, frame.centerY);
      }
    } else {
      handleCaptureFail('timing_miss');
      if (shouldStartle) {
        const frame = getCaptureFrameMetrics();
        triggerStartledEscape(frame.centerX, frame.centerY);
      }
    }

    setTimeout(() => {
      shakeCooldown = false;
    }, CAPTURE_TUNING.shakeCooldownMs);
  } else if (shouldStartle) {
    const frame = getCaptureFrameMetrics();
    triggerStartledEscape(frame.centerX, frame.centerY);
    showToast('动作太大，它被惊动了');
    setStatus('动作放轻一点，稳住再继续逼近');
  }
});

startBtn.addEventListener('click', startExperience);
swipeModeBtn.addEventListener('click', () => setMode('swipe'));
shakeModeBtn.addEventListener('click', () => setMode('shake'));
continueBtn.addEventListener('click', () => {
  resultCard.classList.add('hidden');
  panelPinnedOpen = false;
  respawnButterfly();
  setStatus(mode === 'swipe' ? '新的目标已出现，滑动可用作备用' : '新的目标已出现，先稳稳追近再入框');
});

panelExpandBtn.addEventListener('click', () => {
  panelPinnedOpen = true;
  renderPanelUi();
});

panelCollapseBtn.addEventListener('click', () => {
  panelPinnedOpen = false;
  renderPanelUi();
});

setMode('swipe');
renderBuildStamp();
updateSpecimenCard();
placeButterfly();
renderTimingUi();
