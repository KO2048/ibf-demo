const diagnosticsCore = window.ObserveDiagnosticsCore || {};
const clamp = diagnosticsCore.clamp || ((value, min, max) => Math.min(max, Math.max(min, value)));
const lerp = diagnosticsCore.lerp || ((start, end, amount) => start + (end - start) * amount);
const normalizeAngleDelta = diagnosticsCore.normalizeAngleDelta || ((delta) => {
  let next = delta;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
});
const computeWindowTargets = diagnosticsCore.computeWindowTargets;
const computeCameraMotion = diagnosticsCore.computeCameraMotion;
const computeObservationProjection = diagnosticsCore.computeObservationProjection;

const video = document.getElementById('labCamera');
const statusEl = document.getElementById('labStatus');
const buildStamp = document.getElementById('labBuildStamp');
const compactStatusEl = document.getElementById('labCompactStatus');
const captureFrame = document.getElementById('labCaptureFrame');
const centerZone = document.getElementById('labCenterZone');
const targetsLayer = document.getElementById('labTargetsLayer');
const summaryPrimaryEl = document.getElementById('labSummaryPrimary');
const summarySecondaryEl = document.getElementById('labSummarySecondary');
const sensorSummaryEl = document.getElementById('labSensorSummary');
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
  label: 'observe-lab-v9',
  channel: 'main',
};

const WINDOW_TUNING = {
  windowTargetSmoothing: 5.2,
  yawRangeAlpha: 28,
  gammaFallbackRange: 18,
  yawMaxOffsetX: 240,
  pitchRangeBeta: 42,
  pitchMaxOffsetY: 360,
  windowSignX: -1,
  windowSignY: -1,
  yawMotionScale: 24,
  pitchMotionScale: 26,
  motionSignX: -1,
  motionSignY: -1,
  motionSmoothing: 0.26,
  motionDeadZone: 1.05,
  closingScoreThreshold: 0.1,
  closingForceScale: 2.8,
  closingForceFar: 0.92,
  closingForceMid: 0.5,
  closingForceNear: 0.18,
  closingMidRadius: 208,
  closingNearRadius: 116,
  noAutoCaptureRadius: 74,
  assistDamping: 5.2,
  maxWindowVelocity: 68,
};

const LAB_CONFIG = {
  pairRadius: 146,
  diagonalRadius: 108,
  sampleRadius: 152,
  centerZoneSize: 48,
  distanceTieThreshold: 12,
  motionTracePauseMs: 280,
  motionTraceHoldMs: 6000,
  motionTraceMinGain: 10,
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

function computeLabScreenAnchor() {
  return {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.34,
  };
}

let stream;
let orientationPermission = 'idle';
let gyroPermission = 'idle';
let lastFrameAt = 0;

let labState = createLabState();
let cameraState = createCameraState();

function createLabState() {
  const labScreenAnchor = computeLabScreenAnchor();
  return {
    mode: 'pair',
    pairPreset: 'horizontal',
    selectedTarget: 'blue',
    targets: [],
    closestTargetId: '',
    enteredTargetId: '',
    targetDistance: null,
    winnerDistance: null,
    hint: '等待开始',
    debugExpanded: false,
    labScreenAnchor,
    labWorldOrigin: { ...labScreenAnchor },
    selectedProjection: null,
    motionTrace: createMotionTraceState(),
  };
}

function createMotionTraceState() {
  return {
    active: false,
    hasRecent: false,
    startedAt: 0,
    updatedAt: 0,
    lastMovingAt: 0,
    endedAt: 0,
    mode: '',
    targetId: '',
    startClosestId: '',
    endClosestId: '',
    enteredId: '',
    actualTargetId: '',
    actualGain: 0,
    selectedStart: null,
    selectedEnd: null,
    selectedChange: null,
    startDistances: {},
    endDistances: {},
    motionXSum: 0,
    motionYSum: 0,
    motionSamples: 0,
    lastMotionX: 0,
    lastMotionY: 0,
    peakMotion: 0,
    orientationSamples: 0,
    gyroSamples: 0,
  };
}

function createCameraState() {
  return {
    cameraStreamState: 'idle',
    cameraRoleState: 'rear-unconfirmed',
    motionState: 'idle',
    experimentState: 'idle',
    latestAlpha: null,
    latestBeta: null,
    latestGamma: null,
    latestGyroAlpha: null,
    latestGyroBeta: null,
    latestGyroGamma: null,
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
    assistOffsetX: 0,
    assistOffsetY: 0,
    motionX: 0,
    motionY: 0,
    motionMagnitude: 0,
    debugSelectedDistanceBefore: null,
    debugSelectedDistanceAfter: null,
    debugSelectedDistanceDelta: null,
    debugSelectedClosingScore: null,
    debugSelectedRadialForce: null,
    debugPitchRawDelta: null,
    debugPitchClampedDelta: null,
    debugPitchLimitHit: false,
    orientationSampleCount: 0,
    gyroSampleCount: 0,
    lastOrientationAt: 0,
    lastGyroAt: 0,
    facingMode: 'unknown',
    cameraLabel: '',
    isMirrored: false,
    lastError: '',
  };
}

function getCurrentViewOffset() {
  return {
    x: cameraState.windowOffsetX + cameraState.assistOffsetX,
    y: cameraState.windowOffsetY + cameraState.assistOffsetY,
  };
}

function syncLabWorldOriginFromCurrentView() {
  labState.labScreenAnchor = computeLabScreenAnchor();
  const viewOffset = getCurrentViewOffset();
  labState.labWorldOrigin = {
    x: viewOffset.x + labState.labScreenAnchor.x,
    y: viewOffset.y + labState.labScreenAnchor.y,
  };
}

function cameraRoleLabel() {
  if (cameraState.cameraRoleState === 'rear-confirmed') return '后摄已连接';
  if (cameraState.cameraRoleState === 'non-rear') return '摄像头已连接 · 非后摄';
  return '相机已连接 · 后摄待确认';
}

function deriveExperimentStateLabel() {
  if (cameraState.experimentState === 'active') return '诊断中';
  if (cameraState.experimentState === 'starting') {
    if (cameraState.cameraStreamState === 'requesting') return '请求相机中';
    if (cameraState.cameraStreamState === 'failed') return '相机失败';
    if (cameraState.motionState === 'permission-denied') return '姿态权限被拒绝';
    if (cameraState.motionState === 'waiting-permission') return '等待姿态权限';
    if (cameraState.motionState === 'waiting-calibration') return '等待标定';
    return '准备中';
  }
  return '未开始';
}

function deriveHeaderStatus() {
  switch (cameraState.cameraStreamState) {
    case 'requesting':
      return '请求相机中';
    case 'live': {
      const roleLabel = cameraRoleLabel();
      if (cameraState.motionState === 'permission-denied') return `${roleLabel} · 姿态权限被拒绝`;
      if (cameraState.motionState === 'waiting-permission') return `${roleLabel} · 等待姿态权限`;
      if (cameraState.motionState === 'waiting-calibration') return `${roleLabel} · 等待标定`;
      if (cameraState.motionState === 'ready') return `${roleLabel} · 观察已就绪`;
      return roleLabel;
    }
    case 'failed':
      return '无法启动后摄';
    case 'idle':
    default:
      return '等待开始';
  }
}

function isDiagnosticActive() {
  return cameraState.experimentState === 'active'
    && cameraState.motionState === 'ready'
    && cameraState.cameraStreamState === 'live';
}

function syncMotionStateFromReadiness() {
  if (orientationPermission === 'denied') {
    cameraState.motionState = 'permission-denied';
    return;
  }
  if (orientationPermission !== 'granted') {
    cameraState.motionState = cameraState.experimentState === 'idle' ? 'idle' : 'waiting-permission';
    return;
  }
  cameraState.motionState = cameraState.orientationReady ? 'ready' : 'waiting-calibration';
  if (
    cameraState.experimentState === 'starting'
    && cameraState.cameraStreamState === 'live'
    && cameraState.motionState === 'ready'
  ) {
    cameraState.experimentState = 'active';
  }
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
  if (facingMode === 'environment') {
    cameraState.cameraRoleState = 'rear-confirmed';
  } else if (facingMode === 'user') {
    cameraState.cameraRoleState = 'non-rear';
  } else {
    cameraState.cameraRoleState = 'rear-unconfirmed';
  }
}

async function startCamera() {
  if (cameraState.cameraStreamState === 'live') return;
  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: 'environment' } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  updateCameraTrackInfo(stream.getVideoTracks()[0]);
  cameraState.cameraStreamState = 'live';
}

async function ensureOrientationPermission() {
  if (orientationPermission === 'granted') return true;
  if (orientationPermission === 'denied') return false;
  if (orientationPermission === 'unsupported') return false;

  orientationPermission = await requestSensorPermission(window.DeviceOrientationEvent);
  return orientationPermission === 'granted';
}

async function ensureGyroPermission() {
  if (gyroPermission === 'granted') return true;
  if (gyroPermission === 'denied') return false;
  if (gyroPermission === 'unsupported') return false;

  gyroPermission = await requestSensorPermission(window.DeviceMotionEvent);
  return gyroPermission === 'granted';
}

function isFinalPermissionState(value) {
  return value === 'granted' || value === 'denied' || value === 'unsupported';
}

async function requestSensorPermission(Ctor) {
  if (typeof Ctor === 'undefined') return 'unsupported';
  if (typeof Ctor.requestPermission === 'function') {
    const result = await Ctor.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  }
  return 'granted';
}

async function requestSensorPermissionsFromGesture() {
  const orientationRequest = isFinalPermissionState(orientationPermission)
    ? Promise.resolve(orientationPermission)
    : requestSensorPermission(window.DeviceOrientationEvent);
  const gyroRequest = isFinalPermissionState(gyroPermission)
    ? Promise.resolve(gyroPermission)
    : requestSensorPermission(window.DeviceMotionEvent);
  const [orientationResult, gyroResult] = await Promise.allSettled([
    orientationRequest,
    gyroRequest,
  ]);
  const errors = [];

  if (orientationResult.status === 'fulfilled') {
    orientationPermission = orientationResult.value;
  } else {
    orientationPermission = 'denied';
    errors.push(orientationResult.reason);
  }

  if (gyroResult.status === 'fulfilled') {
    gyroPermission = gyroResult.value;
  } else {
    gyroPermission = 'denied';
    errors.push(gyroResult.reason);
  }

  return {
    orientationGranted: orientationPermission === 'granted',
    gyroGranted: gyroPermission === 'granted',
    errors,
  };
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
  cameraState.assistOffsetX = 0;
  cameraState.assistOffsetY = 0;
  cameraState.motionX = 0;
  cameraState.motionY = 0;
  cameraState.motionMagnitude = 0;
  cameraState.debugSelectedDistanceBefore = null;
  cameraState.debugSelectedDistanceAfter = null;
  cameraState.debugSelectedDistanceDelta = null;
  cameraState.debugSelectedClosingScore = null;
  cameraState.debugSelectedRadialForce = null;
  cameraState.debugPitchRawDelta = null;
  cameraState.debugPitchClampedDelta = null;
  cameraState.debugPitchLimitHit = false;
  labState.selectedProjection = null;
  resetMotionTrace();
  cameraState.horizontalInputMode = Number.isFinite(cameraState.baseAlpha) ? 'alpha' : 'gamma-fallback';
  syncMotionStateFromReadiness();
}

function onOrientation(event) {
  const hasAlpha = typeof event.alpha === 'number';
  const hasBeta = typeof event.beta === 'number';
  const hasGamma = typeof event.gamma === 'number';
  cameraState.latestAlpha = hasAlpha ? event.alpha : cameraState.latestAlpha;
  cameraState.latestBeta = hasBeta ? event.beta : cameraState.latestBeta;
  cameraState.latestGamma = hasGamma ? event.gamma : cameraState.latestGamma;

  if (hasAlpha || hasBeta || hasGamma) {
    orientationPermission = 'granted';
    cameraState.orientationSampleCount += 1;
    cameraState.lastOrientationAt = performance.now();
    if (cameraState.motionState === 'permission-denied' && cameraState.experimentState === 'starting') {
      cameraState.motionState = 'waiting-calibration';
    }
  }

  if (
    cameraState.motionState !== 'idle'
    && cameraState.motionState !== 'permission-denied'
    && !cameraState.orientationReady
    && Number.isFinite(cameraState.latestBeta)
    && (Number.isFinite(cameraState.latestAlpha) || Number.isFinite(cameraState.latestGamma))
  ) {
    recenterObservationWindow();
    renderLabSummary();
  }
}

function onDeviceMotion(event) {
  const rotation = event.rotationRate || {};
  const hasAlpha = typeof rotation.alpha === 'number';
  const hasBeta = typeof rotation.beta === 'number';
  const hasGamma = typeof rotation.gamma === 'number';

  if (!hasAlpha && !hasBeta && !hasGamma) return;

  gyroPermission = 'granted';
  cameraState.latestGyroAlpha = hasAlpha ? rotation.alpha : cameraState.latestGyroAlpha;
  cameraState.latestGyroBeta = hasBeta ? rotation.beta : cameraState.latestGyroBeta;
  cameraState.latestGyroGamma = hasGamma ? rotation.gamma : cameraState.latestGyroGamma;
  cameraState.gyroSampleCount += 1;
  cameraState.lastGyroAt = performance.now();
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
  cameraState.debugPitchRawDelta = Number.isFinite(cameraState.latestBeta) && Number.isFinite(cameraState.baseBeta)
    ? cameraState.latestBeta - cameraState.baseBeta
    : null;
  cameraState.debugPitchClampedDelta = targets.betaDelta;
  cameraState.debugPitchLimitHit = Number.isFinite(cameraState.debugPitchRawDelta)
    && Math.abs(cameraState.debugPitchRawDelta) >= WINDOW_TUNING.pitchRangeBeta - 0.01;
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

function resetSelectedProjectionDebug() {
  labState.selectedProjection = null;
  cameraState.debugSelectedDistanceBefore = null;
  cameraState.debugSelectedDistanceAfter = null;
  cameraState.debugSelectedDistanceDelta = null;
  cameraState.debugSelectedClosingScore = null;
  cameraState.debugSelectedRadialForce = null;
}

function resetMotionTrace() {
  labState.motionTrace = createMotionTraceState();
}

function snapshotTargetDistances() {
  return labState.targets.reduce((snapshot, target) => {
    snapshot[target.id] = target.distance;
    return snapshot;
  }, {});
}

function getActualTargetFromTrace(trace) {
  let bestId = '';
  let bestGain = -Infinity;

  Object.keys(trace.startDistances).forEach((id) => {
    const startDistance = trace.startDistances[id];
    const endDistance = trace.endDistances[id];
    if (!Number.isFinite(startDistance) || !Number.isFinite(endDistance)) return;
    const gain = startDistance - endDistance;
    if (gain > bestGain) {
      bestGain = gain;
      bestId = id;
    }
  });

  return bestGain >= LAB_CONFIG.motionTraceMinGain
    ? { id: bestId, gain: bestGain }
    : { id: '', gain: Number.isFinite(bestGain) ? bestGain : 0 };
}

function refreshMotionTraceResult() {
  const trace = labState.motionTrace;
  const actual = getActualTargetFromTrace(trace);
  trace.actualTargetId = actual.id;
  trace.actualGain = actual.gain;
  trace.selectedEnd = trace.endDistances[trace.targetId] ?? null;
  trace.selectedChange = Number.isFinite(trace.selectedStart) && Number.isFinite(trace.selectedEnd)
    ? trace.selectedStart - trace.selectedEnd
    : null;
}

function beginMotionTrace(now, closest, entered) {
  const distances = snapshotTargetDistances();
  labState.motionTrace = {
    ...createMotionTraceState(),
    active: true,
    startedAt: now,
    updatedAt: now,
    lastMovingAt: now,
    mode: labState.mode,
    targetId: labState.selectedTarget,
    startClosestId: closest?.id || '',
    endClosestId: closest?.id || '',
    enteredId: entered?.id || '',
    selectedStart: distances[labState.selectedTarget] ?? null,
    selectedEnd: distances[labState.selectedTarget] ?? null,
    selectedChange: 0,
    startDistances: distances,
    endDistances: { ...distances },
    orientationSamples: cameraState.orientationSampleCount,
    gyroSamples: cameraState.gyroSampleCount,
  };
}

function updateMotionTraceSample(now, closest, entered, moving) {
  const trace = labState.motionTrace;
  trace.updatedAt = now;
  if (moving) trace.lastMovingAt = now;
  trace.endClosestId = closest?.id || '';
  if (entered?.id && !trace.enteredId) trace.enteredId = entered.id;
  trace.endDistances = snapshotTargetDistances();
  trace.lastMotionX = cameraState.motionX;
  trace.lastMotionY = cameraState.motionY;
  trace.peakMotion = Math.max(trace.peakMotion, cameraState.motionMagnitude);
  trace.motionXSum += cameraState.motionX;
  trace.motionYSum += cameraState.motionY;
  trace.motionSamples += 1;
  refreshMotionTraceResult();
}

function updateMotionTrace(diagnosticActive, closest, entered) {
  const now = performance.now();
  const trace = labState.motionTrace;
  const moving = diagnosticActive && cameraState.motionMagnitude > WINDOW_TUNING.motionDeadZone;

  if (!diagnosticActive) return;

  if (moving && !trace.active) {
    beginMotionTrace(now, closest, entered);
  }

  if (labState.motionTrace.active) {
    updateMotionTraceSample(now, closest, entered, moving);
    if (!moving && now - labState.motionTrace.lastMovingAt > LAB_CONFIG.motionTracePauseMs) {
      labState.motionTrace.active = false;
      labState.motionTrace.hasRecent = true;
      labState.motionTrace.endedAt = now;
      refreshMotionTraceResult();
    }
    return;
  }

  if (
    trace.hasRecent
    && trace.endedAt
    && now - trace.endedAt > LAB_CONFIG.motionTraceHoldMs
  ) {
    trace.hasRecent = false;
  }
}

function updateSelectedTargetAssist(dt) {
  const selectedTarget = labState.targets.find((target) => target.id === labState.selectedTarget);
  const canAssist = isDiagnosticActive()
    && selectedTarget
    && typeof computeObservationProjection === 'function';
  let desiredAssistX = 0;
  let desiredAssistY = 0;

  if (canAssist) {
    const frameCenter = getCaptureFrameCenter();
    const projection = computeObservationProjection({
      worldX: selectedTarget.worldX,
      worldY: selectedTarget.worldY,
      frameX: frameCenter.x,
      frameY: frameCenter.y,
      windowOffsetX: cameraState.windowOffsetX,
      windowOffsetY: cameraState.windowOffsetY,
      motionX: cameraState.motionX,
      motionY: cameraState.motionY,
      tuning: WINDOW_TUNING,
    });
    labState.selectedProjection = projection;
    desiredAssistX = projection.desiredAssistX;
    desiredAssistY = projection.desiredAssistY;
    cameraState.debugSelectedDistanceBefore = projection.distanceBefore;
    cameraState.debugSelectedClosingScore = projection.closingScore;
    cameraState.debugSelectedRadialForce = projection.radialForce;
  } else {
    resetSelectedProjectionDebug();
  }

  const assistLerp = clamp(dt * WINDOW_TUNING.assistDamping, 0, 1);
  cameraState.assistOffsetX = lerp(cameraState.assistOffsetX, desiredAssistX, assistLerp);
  cameraState.assistOffsetY = lerp(cameraState.assistOffsetY, desiredAssistY, assistLerp);

  if (canAssist) {
    const frameCenter = getCaptureFrameCenter();
    const viewOffset = getCurrentViewOffset();
    cameraState.debugSelectedDistanceAfter = Math.hypot(
      selectedTarget.worldX - viewOffset.x - frameCenter.x,
      selectedTarget.worldY - viewOffset.y - frameCenter.y,
    );
    cameraState.debugSelectedDistanceDelta = cameraState.debugSelectedDistanceAfter
      - cameraState.debugSelectedDistanceBefore;
  }
}

function projectLabTargets() {
  const viewOffset = getCurrentViewOffset();
  labState.targets.forEach((target) => {
    target.screenX = target.worldX - viewOffset.x;
    target.screenY = target.worldY - viewOffset.y;
  });
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
  syncLabWorldOriginFromCurrentView();
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
  labState.closestTargetId = '';
  labState.enteredTargetId = '';
  labState.targetDistance = null;
  labState.winnerDistance = null;
  resetSelectedProjectionDebug();
  resetMotionTrace();
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
      resetMotionTrace();
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

function permissionLabel(value) {
  if (value === 'granted') return 'granted';
  if (value === 'denied') return 'denied';
  if (value === 'unsupported') return 'unsupported';
  return 'idle';
}

function formatAge(lastAt) {
  if (!lastAt) return '--';
  const ageSeconds = Math.max(0, (performance.now() - lastAt) / 1000);
  return `${ageSeconds.toFixed(ageSeconds < 10 ? 1 : 0)}s`;
}

function getOrientationDeltas() {
  return {
    alpha: Number.isFinite(cameraState.latestAlpha) && Number.isFinite(cameraState.baseAlpha)
      ? normalizeAngleDelta(cameraState.latestAlpha - cameraState.baseAlpha)
      : null,
    beta: Number.isFinite(cameraState.latestBeta) && Number.isFinite(cameraState.baseBeta)
      ? cameraState.latestBeta - cameraState.baseBeta
      : null,
    gamma: Number.isFinite(cameraState.latestGamma) && Number.isFinite(cameraState.baseGamma)
      ? cameraState.latestGamma - cameraState.baseGamma
      : null,
  };
}

function formatSensorTriple(prefix, alpha, beta, gamma, digits = 1) {
  return `${prefix} α${formatNumber(alpha, digits)} β${formatNumber(beta, digits)} γ${formatNumber(gamma, digits)}`;
}

function deriveSensorSummaryLine() {
  const orientation = formatSensorTriple(
    'ori',
    cameraState.latestAlpha,
    cameraState.latestBeta,
    cameraState.latestGamma,
    0,
  );
  const gyro = formatSensorTriple(
    'gyro',
    cameraState.latestGyroAlpha,
    cameraState.latestGyroBeta,
    cameraState.latestGyroGamma,
    1,
  );
  const pitch = `pitch ${formatNumber(cameraState.debugPitchRawDelta, 0)}→${formatNumber(cameraState.debugPitchClampedDelta, 0)}${cameraState.debugPitchLimitHit ? ' cap' : ''}`;
  return `传感器：${orientation} · ${gyro} · ${pitch} · samples ${cameraState.orientationSampleCount}/${cameraState.gyroSampleCount} · age ${formatAge(cameraState.lastOrientationAt)}/${formatAge(cameraState.lastGyroAt)}`;
}

function hasMotionTrace() {
  return labState.motionTrace.active || labState.motionTrace.hasRecent;
}

function motionTraceStatusLabel() {
  const trace = labState.motionTrace;
  if (trace.active) return 'active';
  if (trace.hasRecent) return 'recent';
  return '--';
}

function motionTraceActualLabel() {
  const trace = labState.motionTrace;
  return trace.actualTargetId ? targetDisplayLabel(trace.actualTargetId) : '不明显';
}

function describeMotionTrace() {
  const trace = labState.motionTrace;
  if (!hasMotionTrace()) return '';

  const prefix = trace.active ? '移动中' : '最近移动';
  const targetLabel = targetDisplayLabel(trace.targetId);
  const actualLabel = motionTraceActualLabel();
  const enteredLabel = trace.enteredId ? `${targetDisplayLabel(trace.enteredId)}进中心` : '中心未进';
  const selectedChange = Number.isFinite(trace.selectedChange)
    ? `目标${trace.selectedChange >= 0 ? '近' : '远'}${Math.abs(trace.selectedChange).toFixed(0)}`
    : '目标变化--';

  if (!trace.actualTargetId) {
    return `${prefix}：选${targetLabel} · 没有明显追向 · ${selectedChange}`;
  }

  return `${prefix}：选${targetLabel} · 更像追${actualLabel} · ${enteredLabel}`;
}

function updateTargets() {
  projectLabTargets();
  const center = getCaptureFrameCenter();
  const halfCenter = LAB_CONFIG.centerZoneSize * 0.5;
  const diagnosticActive = isDiagnosticActive();
  let closest = null;
  let entered = null;

  labState.targets.forEach((target) => {
    const vecX = target.screenX - center.x;
    const vecY = target.screenY - center.y;
    target.distance = Math.hypot(vecX, vecY);
    target.delta = diagnosticActive && target.prevDistance !== null ? target.prevDistance - target.distance : 0;
    target.prevDistance = diagnosticActive ? target.distance : null;
    target.closingScore = 0;

    if (diagnosticActive && cameraState.motionMagnitude > WINDOW_TUNING.motionDeadZone && target.distance > 1) {
      const normX = vecX / target.distance;
      const normY = vecY / target.distance;
      const motionNormX = cameraState.motionX / cameraState.motionMagnitude;
      const motionNormY = cameraState.motionY / cameraState.motionMagnitude;
      target.closingScore = normX * motionNormX + normY * motionNormY;
    }

    if (diagnosticActive) {
      if (!closest || target.distance < closest.distance) closest = target;
      const insideCenter = Math.abs(vecX) <= halfCenter && Math.abs(vecY) <= halfCenter;
      if (insideCenter && (!entered || target.distance < entered.distance)) entered = target;
    }
  });

  labState.closestTargetId = closest ? closest.id : '';
  labState.enteredTargetId = entered ? entered.id : '';
  labState.targetDistance = diagnosticActive
    ? labState.targets.find((target) => target.id === labState.selectedTarget)?.distance || null
    : null;
  labState.winnerDistance = diagnosticActive && closest ? closest.distance : null;
  updateMotionTrace(diagnosticActive, closest, entered);

  labState.targets.forEach((target) => {
    target.el.style.left = `${target.screenX}px`;
    target.el.style.top = `${target.screenY}px`;
    target.el.classList.toggle('is-selected', target.id === labState.selectedTarget);
    target.el.classList.toggle('is-closest', diagnosticActive && target.id === labState.closestTargetId);
    target.el.classList.toggle('is-entered', diagnosticActive && target.id === labState.enteredTargetId);
  });
}

function deriveHint() {
  if (cameraState.cameraStreamState === 'failed') return '无法启动后摄';
  if (cameraState.cameraStreamState === 'requesting') return '请求相机中';
  if (cameraState.cameraStreamState === 'idle') return '等待开始';
  if (cameraState.motionState === 'permission-denied') {
    return 'Safari 动作与方向访问未开启，或本次权限被拒绝；移动手机不会改变测试对象';
  }
  if (cameraState.motionState === 'waiting-permission') return '等待姿态权限';
  if (cameraState.motionState === 'waiting-calibration' && cameraState.orientationSampleCount === 0) {
    return '未收到姿态采样，移动手机不会改变测试对象';
  }
  if (cameraState.motionState === 'waiting-calibration') return '等待标定';
  if (!isDiagnosticActive()) return deriveExperimentStateLabel();
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

function deriveSummaryState() {
  const targetLabel = targetDisplayLabel(labState.selectedTarget);
  const centerLabel = isDiagnosticActive() ? targetDisplayLabel(labState.enteredTargetId) : '--';

  if (!isDiagnosticActive()) {
    return {
      primary: `当前目标：${targetLabel} · 当前实验：${deriveExperimentStateLabel()}`,
      secondary: `判读：${labState.hint} · 参照中心区：${centerLabel}`,
    };
  }

  return {
    primary: `当前目标：${targetLabel} · 当前更接近参照中心：${targetDisplayLabel(labState.closestTargetId)}`,
    secondary: hasMotionTrace()
      ? describeMotionTrace()
      : `判读：${labState.hint} · 参照中心区：${centerLabel}`,
  };
}

function renderLabSummary() {
  const diagnosticActive = isDiagnosticActive();
  const viewOffset = getCurrentViewOffset();
  const orientationDeltas = getOrientationDeltas();
  labState.hint = deriveHint();
  statusEl.textContent = deriveHeaderStatus();
  compactStatusEl.textContent = `${compactModeLabel()} · 当前追 ${targetDisplayLabel(labState.selectedTarget)}`;

  const summary = deriveSummaryState();
  summaryPrimaryEl.textContent = summary.primary;
  summarySecondaryEl.textContent = summary.secondary;
  sensorSummaryEl.textContent = deriveSensorSummaryLine();

  const lines = [
    `stream   ${cameraState.cameraStreamState}`,
    `role     ${cameraState.cameraRoleState}`,
    `motion   ${cameraState.motionState}`,
    `experim  ${cameraState.experimentState}`,
    `perm     ori ${permissionLabel(orientationPermission)}  gyro ${permissionLabel(gyroPermission)}`,
    `samples  ori ${cameraState.orientationSampleCount}  gyro ${cameraState.gyroSampleCount}`,
    `age      ori ${formatAge(cameraState.lastOrientationAt)}  gyro ${formatAge(cameraState.lastGyroAt)}`,
    `ori      alpha ${formatNumber(cameraState.latestAlpha, 2)}  beta ${formatNumber(cameraState.latestBeta, 2)}  gamma ${formatNumber(cameraState.latestGamma, 2)}`,
    `ori d    alpha ${formatNumber(orientationDeltas.alpha, 2)}  beta ${formatNumber(orientationDeltas.beta, 2)}  gamma ${formatNumber(orientationDeltas.gamma, 2)}`,
    `pitch   raw ${formatNumber(cameraState.debugPitchRawDelta, 2)}  clamped ${formatNumber(cameraState.debugPitchClampedDelta, 2)}  range ${WINDOW_TUNING.pitchRangeBeta}  cap ${cameraState.debugPitchLimitHit ? 'yes' : 'no'}`,
    `gyro     alpha ${formatNumber(cameraState.latestGyroAlpha, 2)}  beta ${formatNumber(cameraState.latestGyroBeta, 2)}  gamma ${formatNumber(cameraState.latestGyroGamma, 2)}`,
    `cam      ${cameraState.facingMode}`,
    `mode     ${labState.mode === 'pair' ? `pair-${labState.pairPreset}` : 'sample-8'}`,
    `target   ${targetDisplayLabel(labState.selectedTarget)}`,
    `anchor   x ${formatNumber(labState.labScreenAnchor.x)}  y ${formatNumber(labState.labScreenAnchor.y)}`,
    `worldorg x ${formatNumber(labState.labWorldOrigin.x)}  y ${formatNumber(labState.labWorldOrigin.y)}`,
    `window   x ${formatNumber(cameraState.windowOffsetX)}  y ${formatNumber(cameraState.windowOffsetY)}`,
    `assist   x ${formatNumber(cameraState.assistOffsetX)}  y ${formatNumber(cameraState.assistOffsetY)}`,
    `view     x ${formatNumber(viewOffset.x)}  y ${formatNumber(viewOffset.y)}`,
    `vector   x ${formatNumber(cameraState.motionX, 2)}  y ${formatNumber(cameraState.motionY, 2)}  mag ${formatNumber(cameraState.motionMagnitude, 2)}`,
    `trace    ${motionTraceStatusLabel()}  target ${hasMotionTrace() ? targetDisplayLabel(labState.motionTrace.targetId) : '--'}  actual ${hasMotionTrace() ? motionTraceActualLabel() : '--'}`,
    `trace d  selected ${formatNumber(hasMotionTrace() ? labState.motionTrace.selectedStart : null)} -> ${formatNumber(hasMotionTrace() ? labState.motionTrace.selectedEnd : null)}  gain ${formatNumber(hasMotionTrace() ? labState.motionTrace.selectedChange : null)}`,
    `trace in ${hasMotionTrace() ? targetDisplayLabel(labState.motionTrace.enteredId) : '--'}  closest ${hasMotionTrace() ? targetDisplayLabel(labState.motionTrace.startClosestId) : '--'} -> ${hasMotionTrace() ? targetDisplayLabel(labState.motionTrace.endClosestId) : '--'}`,
    `trace mv x ${formatNumber(hasMotionTrace() ? labState.motionTrace.lastMotionX : null, 2)}  y ${formatNumber(hasMotionTrace() ? labState.motionTrace.lastMotionY : null, 2)}  peak ${formatNumber(hasMotionTrace() ? labState.motionTrace.peakMotion : null, 2)}`,
    `selected before ${formatNumber(diagnosticActive ? cameraState.debugSelectedDistanceBefore : null)}  after ${formatNumber(diagnosticActive ? cameraState.debugSelectedDistanceAfter : null)}  d ${formatNumber(diagnosticActive ? cameraState.debugSelectedDistanceDelta : null, 2)}`,
    `closing  score ${formatNumber(diagnosticActive ? cameraState.debugSelectedClosingScore : null, 2)}  force ${formatNumber(diagnosticActive ? cameraState.debugSelectedRadialForce : null, 2)}`,
    `winner   ${diagnosticActive ? targetDisplayLabel(labState.closestTargetId) : '--'}`,
    `entered  ${diagnosticActive ? targetDisplayLabel(labState.enteredTargetId) : '--'}`,
    `target d ${formatNumber(diagnosticActive ? labState.targetDistance : null)}`,
    `winner d ${formatNumber(diagnosticActive ? labState.winnerDistance : null)}`,
  ];

  if (labState.mode === 'pair') {
    const blue = labState.targets.find((target) => target.id === 'blue');
    const red = labState.targets.find((target) => target.id === 'red');
    lines.push(`blue d   ${formatNumber(diagnosticActive ? blue?.distance : null)}`);
    lines.push(`red d    ${formatNumber(diagnosticActive ? red?.distance : null)}`);
  } else {
    lines.push(`closest# ${diagnosticActive ? targetDisplayLabel(labState.closestTargetId) : '--'}`);
    lines.push(`entered# ${diagnosticActive ? targetDisplayLabel(labState.enteredTargetId) : '--'}`);
    lines.push(`target#  ${targetDisplayLabel(labState.selectedTarget)}`);
  }

  if (cameraState.lastError) lines.push(`error    ${cameraState.lastError}`);

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
  cameraState.experimentState = 'starting';
  cameraState.cameraStreamState = cameraState.cameraStreamState === 'live' ? 'live' : 'idle';
  cameraState.motionState = 'waiting-permission';
  cameraState.lastError = '';
  resetMotionTrace();
  renderLabSummary();

  let orientationGranted = false;
  let sensorPermissionResult;
  try {
    sensorPermissionResult = await requestSensorPermissionsFromGesture();
    orientationGranted = sensorPermissionResult.orientationGranted;
  } catch (error) {
    orientationPermission = 'denied';
    gyroPermission = gyroPermission === 'idle' ? 'denied' : gyroPermission;
    cameraState.lastError = error instanceof Error ? error.message : '传感器权限请求失败';
  }

  cameraState.cameraStreamState = cameraState.cameraStreamState === 'live' ? 'live' : 'requesting';
  renderLabSummary();

  try {
    await startCamera();
  } catch (error) {
    cameraState.cameraStreamState = 'failed';
    cameraState.motionState = 'idle';
    cameraState.experimentState = 'idle';
    cameraState.lastError = error instanceof Error ? error.message : '相机启动失败';
    renderLabSummary();
    return;
  }

  if (!orientationGranted) {
    cameraState.motionState = 'permission-denied';
    if (!cameraState.lastError && sensorPermissionResult?.errors?.length) {
      cameraState.lastError = sensorPermissionResult.errors
        .map((error) => (error instanceof Error ? error.message : String(error)))
        .join('; ');
    }
    if (!cameraState.lastError) {
      cameraState.lastError = 'Safari Motion & Orientation Access disabled or permission denied';
    }
    renderLabSummary();
    return;
  }

  cameraState.motionState = 'waiting-calibration';
  recenterObservationWindow();
  rebuildTargets();
  renderLabSummary();
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
  updateSelectedTargetAssist(dt);
  updateTargets();
  renderLabSummary();
  requestAnimationFrame(loop);
}

function bindEvents() {
  window.addEventListener('deviceorientation', onOrientation, true);
  window.addEventListener('devicemotion', onDeviceMotion, true);
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
  syncLabWorldOriginFromCurrentView();
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
