const diagnosticsCore = window.ObserveDiagnosticsCore || {};
const clamp = diagnosticsCore.clamp || ((value, min, max) => Math.min(max, Math.max(min, value)));
const lerp = diagnosticsCore.lerp || ((start, end, amount) => start + (end - start) * amount);
const computeWindowTargets = diagnosticsCore.computeWindowTargets;
const computeCameraMotion = diagnosticsCore.computeCameraMotion;

const video = document.getElementById('labCamera');
const statusEl = document.getElementById('labStatus');
const buildStamp = document.getElementById('labBuildStamp');
const compactStatusEl = document.getElementById('labCompactStatus');
const captureFrame = document.getElementById('labCaptureFrame');
const centerZone = document.getElementById('labCenterZone');
const targetsLayer = document.getElementById('labTargetsLayer');
const summaryPrimaryEl = document.getElementById('labSummaryPrimary');
const summarySecondaryEl = document.getElementById('labSummarySecondary');
const debugToggleBtn = document.getElementById('labDebugToggle');
const debugDetailsEl = document.getElementById('labDebugDetails');
const debugContent = document.getElementById('labDebugContent');
const pairModeBtn = document.getElementById('pairModeBtn');
const sampleModeBtn = document.getElementById('sampleModeBtn');
const pairPresetGroup = document.getElementById('pairPresetGroup');
const presetHorizontalBtn = document.getElementById('presetHorizontalBtn');
const presetVerticalBtn = document.getElementById('presetVerticalBtn');
const presetDiagonalBtn = document.getElementById('presetDiagonalBtn');
const targetPicker = document.getElementById('labTargetPicker');
const startBtn = document.getElementById('labStartBtn');
const recenterBtn = document.getElementById('labRecenterBtn');

const BUILD_INFO = {
  label: 'observe-lab-v3',
  channel: 'main',
};

const WINDOW_TUNING = {
  windowTargetSmoothing: 5.2,
  yawRangeAlpha: 28,
  gammaFallbackRange: 18,
  yawMaxOffsetX: 240,
  pitchRangeBeta: 18,
  pitchMaxOffsetY: 180,
  windowSignX: -1,
  windowSignY: -1,
  yawMotionScale: 24,
  pitchMotionScale: 20,
  motionSignX: -1,
  motionSignY: -1,
  motionSmoothing: 0.26,
  motionDeadZone: 1.05,
};

const LAB_CONFIG = {
  pairRadius: 146,
  diagonalRadius: 108,
  sampleRadius: 152,
  centerZoneSize: 48,
  distanceTieThreshold: 12,
};

const PAIR_LABELS = {
  blue: '蓝色',
  red: '红色',
};

const SAMPLE_LABELS = {
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
};

const SAMPLE_ANGLES = [
  { id: '1', angleDeg: -90 },
  { id: '2', angleDeg: -45 },
  { id: '3', angleDeg: 0 },
  { id: '4', angleDeg: 45 },
  { id: '5', angleDeg: 90 },
  { id: '6', angleDeg: 135 },
  { id: '7', angleDeg: 180 },
  { id: '8', angleDeg: 225 },
];

function computeLabWorldOrigin() {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.34,
  };
}

let stream;
let orientationPermission = 'idle';
let lastFrameAt = 0;

let labState = createLabState();
let cameraState = createCameraState();

function createLabState() {
  return {
    mode: 'pair',
    pairPreset: 'horizontal',
    selectedTarget: 'blue',
    targets: [],
    closestTargetId: '',
    enteredTargetId: '',
    targetDistance: 0,
    winnerDistance: 0,
    hint: '等待开始',
    debugExpanded: false,
    labWorldOrigin: computeLabWorldOrigin(),
  };
}

function createCameraState() {
  return {
    cameraStreamState: 'idle',
    motionState: 'idle',
    latestAlpha: null,
    latestBeta: null,
    latestGamma: null,
    prevAlpha: null,
    prevBeta: null,
    prevGamma: null,
    baseAlpha: null,
    baseBeta: null,
    baseGamma: null,
    orientationReady: false,
    horizontalInputMode: 'gamma-fallback',
    targetOffsetX: 0,
    targetOffsetY: 0,
    windowOffsetX: 0,
    windowOffsetY: 0,
    motionX: 0,
    motionY: 0,
    motionMagnitude: 0,
    facingMode: 'unknown',
    cameraLabel: '',
    isMirrored: false,
  };
}

function updateLabWorldOrigin() {
  labState.labWorldOrigin = computeLabWorldOrigin();
}

function deriveStatusText() {
  switch (cameraState.cameraStreamState) {
    case 'requesting':
      return '请求后摄中';
    case 'live-environment':
      if (cameraState.motionState === 'waiting-permission') return '后摄已连接 · 等待动作权限';
      if (cameraState.motionState === 'waiting-calibration') return '后摄已连接 · 等待标定';
      if (cameraState.motionState === 'ready') return '后摄已连接 · 观察已就绪';
      return '后摄已连接';
    case 'live-non-environment':
      return '摄像头已连接 · 非后摄';
    case 'failed':
      return '无法启动后摄';
    case 'idle':
    default:
      return '等待开始';
  }
}

function syncMotionStateFromReadiness() {
  if (orientationPermission !== 'granted') {
    cameraState.motionState = 'waiting-permission';
    return;
  }
  cameraState.motionState = cameraState.orientationReady ? 'ready' : 'waiting-calibration';
}

function renderBuildStamp() {
  buildStamp.textContent = BUILD_INFO.channel
    ? `build ${BUILD_INFO.label} · ${BUILD_INFO.channel}`
    : `build ${BUILD_INFO.label}`;
}

function inferFacingMode(rawFacingMode, label = '') {
  if (rawFacingMode === 'environment' || rawFacingMode === 'user') return rawFacingMode;
  const normalized = label.toLowerCase();
  if (/front|facetime|user/.test(normalized)) return 'user';
  if (/back|rear|environment/.test(normalized)) return 'environment';
  return 'unknown';
}

function updateCameraTrackInfo(track) {
  const settings = track?.getSettings?.() || {};
  const cameraLabel = track?.label || '';
  const facingMode = inferFacingMode(settings.facingMode, cameraLabel);
  cameraState.facingMode = facingMode;
  cameraState.cameraLabel = cameraLabel;
  cameraState.isMirrored = facingMode === 'user';
  cameraState.cameraStreamState = facingMode === 'environment' ? 'live-environment' : 'live-non-environment';
}

async function startCamera() {
  if (cameraState.cameraStreamState === 'live-environment' || cameraState.cameraStreamState === 'live-non-environment') return;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  updateCameraTrackInfo(stream.getVideoTracks()[0]);
  video.srcObject = stream;
  await video.play();
}

async function ensureOrientationPermission() {
  if (orientationPermission === 'granted') return true;
  if (orientationPermission === 'denied') return false;

  if (typeof window.DeviceOrientationEvent !== 'undefined'
    && typeof window.DeviceOrientationEvent.requestPermission === 'function') {
    const result = await window.DeviceOrientationEvent.requestPermission();
    orientationPermission = result === 'granted' ? 'granted' : 'denied';
    return orientationPermission === 'granted';
  }

  orientationPermission = 'granted';
  return true;
}

function recenterObservationWindow() {
  cameraState.baseAlpha = Number.isFinite(cameraState.latestAlpha) ? cameraState.latestAlpha : null;
  cameraState.baseBeta = cameraState.latestBeta;
  cameraState.baseGamma = cameraState.latestGamma;
  cameraState.orientationReady = Number.isFinite(cameraState.baseBeta)
    && (Number.isFinite(cameraState.baseAlpha) || Number.isFinite(cameraState.baseGamma));
  cameraState.prevAlpha = cameraState.latestAlpha;
  cameraState.prevBeta = cameraState.latestBeta;
  cameraState.prevGamma = cameraState.latestGamma;
  cameraState.targetOffsetX = 0;
  cameraState.targetOffsetY = 0;
  cameraState.windowOffsetX = 0;
  cameraState.windowOffsetY = 0;
  cameraState.motionX = 0;
  cameraState.motionY = 0;
  cameraState.motionMagnitude = 0;
  cameraState.horizontalInputMode = Number.isFinite(cameraState.baseAlpha) ? 'alpha' : 'gamma-fallback';
  syncMotionStateFromReadiness();
}

function onOrientation(event) {
  cameraState.latestAlpha = typeof event.alpha === 'number' ? event.alpha : cameraState.latestAlpha;
  cameraState.latestBeta = typeof event.beta === 'number' ? event.beta : cameraState.latestBeta;
  cameraState.latestGamma = typeof event.gamma === 'number' ? event.gamma : cameraState.latestGamma;

  if (
    cameraState.motionState !== 'idle'
    && !cameraState.orientationReady
    && Number.isFinite(cameraState.latestBeta)
    && (Number.isFinite(cameraState.latestAlpha) || Number.isFinite(cameraState.latestGamma))
  ) {
    recenterObservationWindow();
    renderLabSummary();
  }
}

function refreshObservationWindowTargets() {
  if (cameraState.motionState !== 'ready' || !computeWindowTargets || !computeCameraMotion) return;

  const targets = computeWindowTargets({
    latestAlpha: cameraState.latestAlpha,
    latestBeta: cameraState.latestBeta,
    latestGamma: cameraState.latestGamma,
    baseAlpha: cameraState.baseAlpha,
    baseBeta: cameraState.baseBeta,
    baseGamma: cameraState.baseGamma,
    tuning: WINDOW_TUNING,
    windowSignX: WINDOW_TUNING.windowSignX,
    windowSignY: WINDOW_TUNING.windowSignY,
    mirrorSignX: cameraState.isMirrored ? -1 : 1,
  });
  const motion = computeCameraMotion({
    latestAlpha: cameraState.latestAlpha,
    latestBeta: cameraState.latestBeta,
    latestGamma: cameraState.latestGamma,
    prevAlpha: cameraState.prevAlpha,
    prevBeta: cameraState.prevBeta,
    prevGamma: cameraState.prevGamma,
    tuning: WINDOW_TUNING,
    motionSignX: WINDOW_TUNING.motionSignX,
    motionSignY: WINDOW_TUNING.motionSignY,
    mirrorSignX: cameraState.isMirrored ? -1 : 1,
  });

  cameraState.targetOffsetX = targets.targetOffsetX;
  cameraState.targetOffsetY = targets.targetOffsetY;
  cameraState.horizontalInputMode = motion.horizontalInputMode;
  cameraState.motionX = lerp(cameraState.motionX, motion.motionX, WINDOW_TUNING.motionSmoothing);
  cameraState.motionY = lerp(cameraState.motionY, motion.motionY, WINDOW_TUNING.motionSmoothing);
  cameraState.motionMagnitude = Math.hypot(cameraState.motionX, cameraState.motionY);
  cameraState.prevAlpha = cameraState.latestAlpha;
  cameraState.prevBeta = cameraState.latestBeta;
  cameraState.prevGamma = cameraState.latestGamma;
}

function updateObservationWindow(dt) {
  const desiredX = cameraState.motionState === 'ready' ? cameraState.targetOffsetX : 0;
  const desiredY = cameraState.motionState === 'ready' ? cameraState.targetOffsetY : 0;
  const amount = clamp(dt * WINDOW_TUNING.windowTargetSmoothing, 0, 1);
  cameraState.windowOffsetX = lerp(cameraState.windowOffsetX, desiredX, amount);
  cameraState.windowOffsetY = lerp(cameraState.windowOffsetY, desiredY, amount);
}

function getCaptureFrameCenter() {
  const rect = captureFrame.getBoundingClientRect();
  return {
    x: rect.left + rect.width * 0.5,
    y: rect.top + rect.height * 0.5,
  };
}

function getPairOffsets() {
  if (labState.pairPreset === 'vertical') {
    return {
      blue: { x: 0, y: LAB_CONFIG.pairRadius },
      red: { x: 0, y: -LAB_CONFIG.pairRadius },
    };
  }
  if (labState.pairPreset === 'diagonal') {
    return {
      blue: { x: LAB_CONFIG.diagonalRadius, y: LAB_CONFIG.diagonalRadius },
      red: { x: -LAB_CONFIG.diagonalRadius, y: -LAB_CONFIG.diagonalRadius },
    };
  }
  return {
    blue: { x: LAB_CONFIG.pairRadius, y: 0 },
    red: { x: -LAB_CONFIG.pairRadius, y: 0 },
  };
}

function createTargetElement(target) {
  const el = document.createElement('div');
  el.className = `lab-target ${target.kind}`;
  el.dataset.targetId = target.id;
  el.innerHTML = `
    <span class="lab-target-label">${target.label}</span>
  `;
  targetsLayer.appendChild(el);
  return el;
}

function rebuildTargets() {
  updateLabWorldOrigin();
  const center = labState.labWorldOrigin;
  targetsLayer.innerHTML = '';
  const targets = [];

  if (labState.mode === 'pair') {
    const offsets = getPairOffsets();
    [
      { id: 'blue', label: '蓝', kind: 'is-blue', offset: offsets.blue },
      { id: 'red', label: '红', kind: 'is-red', offset: offsets.red },
    ].forEach((entry) => {
      targets.push({
        ...entry,
        worldX: center.x + entry.offset.x,
        worldY: center.y + entry.offset.y,
        el: createTargetElement(entry),
        screenX: 0,
        screenY: 0,
        distance: 0,
        delta: 0,
        prevDistance: null,
      });
    });
  } else {
    SAMPLE_ANGLES.forEach((entry) => {
      const radians = (entry.angleDeg * Math.PI) / 180;
      const offsetX = Math.cos(radians) * LAB_CONFIG.sampleRadius;
      const offsetY = Math.sin(radians) * LAB_CONFIG.sampleRadius;
      const target = {
        id: entry.id,
        label: entry.id,
        kind: 'is-sample',
        worldX: center.x + offsetX,
        worldY: center.y + offsetY,
        el: createTargetElement({ id: entry.id, label: entry.id, kind: 'is-sample' }),
        screenX: 0,
        screenY: 0,
        distance: 0,
        delta: 0,
        prevDistance: null,
      };
      targets.push(target);
    });
  }

  labState.targets = targets;
  renderTargetPicker();
}

function renderTargetPicker() {
  targetPicker.innerHTML = '';
  const targetIds = labState.mode === 'pair' ? ['blue', 'red'] : SAMPLE_ANGLES.map((entry) => entry.id);

  targetIds.forEach((id) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'lab-chip';
    if (labState.selectedTarget === id) button.classList.add('active');
    button.dataset.targetId = id;
    button.textContent = labState.mode === 'pair' ? PAIR_LABELS[id] : `#${id}`;
    button.addEventListener('click', () => {
      labState.selectedTarget = id;
      renderTargetPicker();
      renderLabSummary();
    });
    targetPicker.appendChild(button);
  });
}

function formatNumber(value, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '--';
}

function compactModeLabel() {
  if (labState.mode !== 'pair') return '采样模式';
  if (labState.pairPreset === 'vertical') return '对称模式 · 垂直';
  if (labState.pairPreset === 'diagonal') return '对称模式 · 斜向';
  return '对称模式 · 水平';
}

function targetDisplayLabel(id) {
  if (!id) return '--';
  return labState.mode === 'pair' ? PAIR_LABELS[id] : `#${id}`;
}

function updateTargets() {
  const center = getCaptureFrameCenter();
  const halfCenter = LAB_CONFIG.centerZoneSize * 0.5;
  let closest = null;
  let entered = null;

  labState.targets.forEach((target) => {
    target.screenX = target.worldX - cameraState.windowOffsetX;
    target.screenY = target.worldY - cameraState.windowOffsetY;

    const vecX = target.screenX - center.x;
    const vecY = target.screenY - center.y;
    target.distance = Math.hypot(vecX, vecY);
    target.delta = target.prevDistance === null ? 0 : target.prevDistance - target.distance;
    target.prevDistance = target.distance;
    target.closingScore = 0;

    if (cameraState.motionMagnitude > WINDOW_TUNING.motionDeadZone && target.distance > 1) {
      const normX = vecX / target.distance;
      const normY = vecY / target.distance;
      const motionNormX = cameraState.motionX / cameraState.motionMagnitude;
      const motionNormY = cameraState.motionY / cameraState.motionMagnitude;
      target.closingScore = normX * motionNormX + normY * motionNormY;
    }

    if (!closest || target.distance < closest.distance) closest = target;
    const insideCenter = Math.abs(vecX) <= halfCenter && Math.abs(vecY) <= halfCenter;
    if (insideCenter && (!entered || target.distance < entered.distance)) entered = target;
  });

  labState.closestTargetId = closest ? closest.id : '';
  labState.enteredTargetId = entered ? entered.id : '';
  labState.targetDistance = labState.targets.find((target) => target.id === labState.selectedTarget)?.distance || 0;
  labState.winnerDistance = closest ? closest.distance : 0;

  labState.targets.forEach((target) => {
    target.el.style.left = `${target.screenX}px`;
    target.el.style.top = `${target.screenY}px`;
    target.el.classList.toggle('is-selected', target.id === labState.selectedTarget);
    target.el.classList.toggle('is-closest', target.id === labState.closestTargetId);
    target.el.classList.toggle('is-entered', target.id === labState.enteredTargetId);
  });
}

function getHint() {
  if (cameraState.cameraStreamState === 'failed') return '后摄未就绪';
  if (cameraState.cameraStreamState === 'requesting') return '请求后摄中';
  if (cameraState.cameraStreamState === 'idle') return '等待开始';
  if (cameraState.cameraStreamState !== 'live-environment') return '后摄未就绪';
  if (cameraState.motionState === 'waiting-permission') return '等待动作权限';
  if (cameraState.motionState === 'waiting-calibration') return '等待标定';
  if (cameraState.motionState !== 'ready') return '等待开始';
  if (cameraState.motionMagnitude <= WINDOW_TUNING.motionDeadZone) return '等待移动';
  if (labState.enteredTargetId) {
    return labState.enteredTargetId === labState.selectedTarget
      ? '目标进入参照中心区'
      : '非目标进入参照中心区';
  }

  const target = labState.targets.find((item) => item.id === labState.selectedTarget);
  const winner = labState.targets.find((item) => item.id === labState.closestTargetId);
  if (!target || !winner) return '等待目标';

  if (Math.abs(target.distance - winner.distance) <= LAB_CONFIG.distanceTieThreshold) {
    return '两者接近相当';
  }
  if (winner.id === target.id) return '目标更接近参照中心';
  if (target.delta < -0.35 && winner.delta > 0.15) return '你在把观察窗移开';
  return '非目标更接近参照中心';
}

function renderLabSummary() {
  labState.hint = getHint();
  statusEl.textContent = deriveStatusText();
  compactStatusEl.textContent = `${compactModeLabel()} · 当前追 ${targetDisplayLabel(labState.selectedTarget)}`;

  const winnerLabel = targetDisplayLabel(labState.closestTargetId);
  const enteredLabel = targetDisplayLabel(labState.enteredTargetId);
  summaryPrimaryEl.textContent = `当前目标：${targetDisplayLabel(labState.selectedTarget)} · 当前更接近参照中心：${winnerLabel}`;
  summarySecondaryEl.textContent = `判读：${labState.hint} · 参照中心区：${enteredLabel}`;

  const lines = [
    `stream   ${cameraState.cameraStreamState}`,
    `motionst ${cameraState.motionState}`,
    `cam      ${cameraState.facingMode}`,
    `mode     ${labState.mode === 'pair' ? `pair-${labState.pairPreset}` : 'sample-8'}`,
    `target   ${targetDisplayLabel(labState.selectedTarget)}`,
    `origin   x ${formatNumber(labState.labWorldOrigin.x)}  y ${formatNumber(labState.labWorldOrigin.y)}`,
    `motion   x ${formatNumber(cameraState.motionX, 2)}  y ${formatNumber(cameraState.motionY, 2)}  mag ${formatNumber(cameraState.motionMagnitude, 2)}`,
    `winner   ${targetDisplayLabel(labState.closestTargetId)}`,
    `entered  ${targetDisplayLabel(labState.enteredTargetId)}`,
    `target d ${formatNumber(labState.targetDistance)}`,
    `winner d ${formatNumber(labState.winnerDistance)}`,
  ];

  if (labState.mode === 'pair') {
    const blue = labState.targets.find((target) => target.id === 'blue');
    const red = labState.targets.find((target) => target.id === 'red');
    lines.push(`blue d   ${formatNumber(blue?.distance)}`);
    lines.push(`red d    ${formatNumber(red?.distance)}`);
  } else {
    lines.push(`closest# ${targetDisplayLabel(labState.closestTargetId)}`);
    lines.push(`entered# ${targetDisplayLabel(labState.enteredTargetId)}`);
    lines.push(`target#  ${targetDisplayLabel(labState.selectedTarget)}`);
  }

  debugContent.textContent = lines.join('\n');
  debugToggleBtn.setAttribute('aria-expanded', String(labState.debugExpanded));
  debugToggleBtn.textContent = labState.debugExpanded ? '收起诊断详情' : '展开诊断详情';
  debugDetailsEl.classList.toggle('hidden', !labState.debugExpanded);
}

function setMode(nextMode) {
  if (labState.mode === nextMode) return;
  labState.mode = nextMode;
  labState.selectedTarget = nextMode === 'pair' ? 'blue' : '4';
  pairModeBtn.classList.toggle('active', nextMode === 'pair');
  sampleModeBtn.classList.toggle('active', nextMode === 'sample');
  pairPresetGroup.classList.toggle('hidden', nextMode !== 'pair');
  rebuildTargets();
  renderLabSummary();
}

function setPairPreset(nextPreset) {
  if (labState.pairPreset === nextPreset) return;
  labState.pairPreset = nextPreset;
  presetHorizontalBtn.classList.toggle('active', nextPreset === 'horizontal');
  presetVerticalBtn.classList.toggle('active', nextPreset === 'vertical');
  presetDiagonalBtn.classList.toggle('active', nextPreset === 'diagonal');
  if (labState.mode === 'pair') {
    rebuildTargets();
    renderLabSummary();
  }
}

async function startExperiment() {
  cameraState.cameraStreamState = 'requesting';
  cameraState.motionState = 'waiting-permission';
  renderLabSummary();
  try {
    await startCamera();
    const granted = await ensureOrientationPermission();
    if (!granted) {
      cameraState.motionState = 'waiting-permission';
      renderLabSummary();
      return;
    }
    cameraState.motionState = 'waiting-calibration';
    recenterObservationWindow();
    renderLabSummary();
  } catch (error) {
    cameraState.cameraStreamState = 'failed';
    cameraState.motionState = 'idle';
    debugContent.textContent = error instanceof Error ? error.message : '启动失败';
    renderLabSummary();
  }
}

function onResize() {
  rebuildTargets();
  renderLabSummary();
}

function loop(now) {
  const dt = clamp((now - (lastFrameAt || now)) / 1000, 0, 0.05);
  lastFrameAt = now;
  refreshObservationWindowTargets();
  updateObservationWindow(dt);
  updateTargets();
  renderLabSummary();
  requestAnimationFrame(loop);
}

function bindEvents() {
  window.addEventListener('deviceorientation', onOrientation, true);
  window.addEventListener('resize', onResize);
  startBtn.addEventListener('click', startExperiment);
  recenterBtn.addEventListener('click', () => {
    recenterObservationWindow();
    renderLabSummary();
  });
  pairModeBtn.addEventListener('click', () => setMode('pair'));
  sampleModeBtn.addEventListener('click', () => setMode('sample'));
  presetHorizontalBtn.addEventListener('click', () => setPairPreset('horizontal'));
  presetVerticalBtn.addEventListener('click', () => setPairPreset('vertical'));
  presetDiagonalBtn.addEventListener('click', () => setPairPreset('diagonal'));
  debugToggleBtn.addEventListener('click', () => {
    labState.debugExpanded = !labState.debugExpanded;
    renderLabSummary();
  });
}

function init() {
  renderBuildStamp();
  updateLabWorldOrigin();
  bindEvents();
  setPairPreset('horizontal');
  setMode('pair');
  centerZone.style.width = `${LAB_CONFIG.centerZoneSize}px`;
  centerZone.style.height = `${LAB_CONFIG.centerZoneSize}px`;
  requestAnimationFrame(() => {
    rebuildTargets();
    renderLabSummary();
  });
  requestAnimationFrame(loop);
}

init();
