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
const startBtn = document.getElementById('startBtn');
const swipeModeBtn = document.getElementById('swipeModeBtn');
const shakeModeBtn = document.getElementById('shakeModeBtn');
const reticle = document.getElementById('reticle');
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
let butterflyState = createEmptyButterflyState();

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

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const modeCopy = mode === 'swipe' ? '滑动主流程已就绪' : '实验甩动模式已启用';
  specimenMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity} · ${modeCopy}`;
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

function placeButterfly() {
  butterfly.style.left = `${butterflyState.x}px`;
  butterfly.style.top = `${butterflyState.y}px`;
  butterfly.style.setProperty('--dir-x', butterflyState.dirX);
  butterfly.style.setProperty('--flight-tilt', `${butterflyState.bankAngle}deg`);
  butterfly.style.setProperty('--bank-angle', `${clamp(butterflyState.bankAngle * 0.55, -14, 14)}deg`);
  butterfly.style.setProperty('--lift', `${butterflyState.lift}px`);
}

function spawnButterfly() {
  const variant = pickButterflyVariant();
  applyButterflyVariant(variant);
  const centerBias = rand(0.32, 0.68);
  butterflyState = {
    x: window.innerWidth * centerBias,
    y: window.innerHeight * rand(0.24, 0.52),
    heading: rand(-0.55, 0.55),
    targetHeading: rand(-0.7, 0.7),
    speed: variant.motion.baseSpeed * 0.8,
    targetSpeed: variant.motion.baseSpeed,
    t: 0,
    alive: true,
    visible: true,
    hoverRemaining: 0,
    nextDecisionIn: rand(...variant.motion.decisionWindow),
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
    captureRadius: variant.captureRadius,
  };
  butterfly.classList.remove('hidden');
  resultCard.classList.add('hidden');
  setStatus(mode === 'swipe' ? '观察飞行轨迹后滑动捕捉' : '蝴蝶已出现，可切回滑动或测试甩动');
  updateSpecimenCard();
  placeButterfly();
}

function respawnButterfly() {
  spawnButterfly();
  swipeTrail = [];
  lastPointer = null;
  butterflyFigure.classList.remove('capture-hit');
  butterfly.classList.remove('miss');
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
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
  const centerX = window.innerWidth * 0.5;
  const centerY = window.innerHeight * 0.4;
  const offsetX = centerX - butterflyState.x;
  const offsetY = centerY - butterflyState.y;
  const edgeForceX = butterflyState.x < motion.boundaryMargin ? 0.95 : butterflyState.x > window.innerWidth - motion.boundaryMargin ? -0.95 : 0;
  const edgeForceY = butterflyState.y < 90 ? 0.8 : butterflyState.y > window.innerHeight * 0.68 ? -0.9 : 0;
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

function triggerStartledEscape(originX, originY) {
  if (!currentButterfly || !butterflyState.alive || butterflyState.nearMissCooldown > 0) return;
  const { motion } = currentButterfly;
  const fleeHeading = Math.atan2(
    butterflyState.y - originY,
    butterflyState.x - originX,
  ) + rand(-0.32, 0.32);
  butterflyState.targetHeading = fleeHeading;
  butterflyState.targetSpeed = motion.baseSpeed * rand(1.45, 1.85);
  butterflyState.startledRemaining = rand(0.34, 0.58);
  butterflyState.nearMissCooldown = 0.42;
  butterflyState.hoverRemaining = 0;
  setMotionState('startled_escape');
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
  const boundaryBiasY = butterflyState.y < 82 ? 0.8 : butterflyState.y > window.innerHeight * 0.68 ? -1 : 0;

  if (boundaryBiasX || boundaryBiasY) {
    butterflyState.targetHeading = Math.atan2(boundaryBiasY + rand(-0.15, 0.15), boundaryBiasX + rand(-0.15, 0.15));
    butterflyState.targetSpeed = motion.baseSpeed + motion.speedJitter * 0.4;
    butterflyState.hoverRemaining = 0;
  }

  const headingAdjust = angleDelta(butterflyState.heading, butterflyState.targetHeading);
  butterflyState.heading += headingAdjust * clamp(dt * motion.turnRate, 0, 1);
  butterflyState.speed += (butterflyState.targetSpeed - butterflyState.speed) * clamp(dt * 3.1, 0, 1);

  const sway = Math.sin(butterflyState.t * 1.7 + currentButterfly.size * 0.02) * motion.swayAmp;
  const bob = Math.cos(butterflyState.t * 2.5 + currentButterfly.size * 0.03) * motion.bobAmp;
  const hoverDampen = butterflyState.hoverRemaining > 0 ? 0.36 : 1;
  const startledBoost = butterflyState.startledRemaining > 0 ? 1.12 : 1;
  const vx = Math.cos(butterflyState.heading) * butterflyState.speed * startledBoost + sway * hoverDampen;
  const vy = Math.sin(butterflyState.heading) * butterflyState.speed * 0.72 * startledBoost + bob;

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
  updateButterfly(dt);
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

function handleCaptureSuccess(trigger) {
  if (!butterflyState.alive || !currentButterfly) return;
  butterflyState.alive = false;
  butterflyState.staggerRemaining = 0.3;
  butterflyState.startledRemaining = 0;
  setMotionState('captured_stagger');
  butterflyFigure.classList.add('capture-hit');
  setStatus(trigger === 'shake' ? '实验甩动捕获成功' : '捕捉完成，正在揭晓');
  showToast(`${currentButterfly.name} 已被捕捉`);
  if (navigator.vibrate) navigator.vibrate([40, 28, 72]);
  drawBurst(butterflyState.x, butterflyState.y, currentButterfly.palette.wingB);

  setTimeout(() => {
    butterflyFigure.classList.remove('capture-hit');
    butterfly.classList.add('hidden');
    resultBadge.textContent = rarityLabel(currentButterfly.rarity);
    resultTitle.textContent = `你抓到了${currentButterfly.name}`;
    resultMeta.textContent = `${currentButterfly.role} · ${currentButterfly.rarity}`;
    resultFlavor.textContent = currentButterfly.flavor;
    resultCard.classList.remove('hidden');
    specimenMeta.textContent = `已完成捕捉 · ${currentButterfly.role} · ${currentButterfly.rarity}`;
  }, 340);
}

function handleCaptureFail(reason = 'miss') {
  if (!currentButterfly) return;
  setStatus(reason === 'weak_shake' ? '甩动幅度不足，建议切回滑动主流程' : '没有命中，再观察一下飞行轨迹');
  butterfly.classList.add('miss');
  showToast(reason === 'weak_shake' ? '动作太轻，或蝴蝶不在锁定圈内' : '划得再快一点，尽量掠过飞行中心');
  setTimeout(() => butterfly.classList.remove('miss'), 280);
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

function onPointerMove(clientX, clientY) {
  const now = performance.now();
  swipeTrail.push({ x: clientX, y: clientY, t: now });

  if (!lastPointer) {
    lastPointer = { x: clientX, y: clientY, t: now };
    return;
  }

  if (mode === 'swipe' && butterflyState.alive) {
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
      && trackDistance <= butterflyState.captureRadius * 1.85
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
    startBtn.textContent = '重新召唤蝴蝶';
    respawnButterfly();
    showToast('相机已启动，观察飞行轨迹后滑动捕捉');
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
        showToast(message, 2200);
      }
    } catch (error) {
      console.error(error);
      motionPermission = 'denied';
      showToast('动作权限请求失败，继续使用滑动主流程即可', 2200);
    }
  }

  mode = nextMode;
  swipeModeBtn.classList.toggle('active', mode === 'swipe');
  shakeModeBtn.classList.toggle('active', mode === 'shake');
  reticle.classList.toggle('hidden', mode !== 'shake');

  if (mode === 'swipe') {
    setStatus(running ? '滑动主流程已启用' : '等待开始');
  } else if (motionPermission === 'granted') {
    setStatus('实验甩动模式已启用');
    showToast('将蝴蝶引入中央圆环后，再快速甩动手机');
  } else {
    setStatus('甩动不可用，建议继续滑动主流程');
  }

  updateSpecimenCard();
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

window.addEventListener('devicemotion', (event) => {
  if (mode !== 'shake' || motionPermission !== 'granted' || !butterflyState.alive || shakeCooldown) return;
  const acceleration = event.accelerationIncludingGravity || event.acceleration;
  if (!acceleration) return;

  const magnitude = Math.sqrt((acceleration.x || 0) ** 2 + (acceleration.y || 0) ** 2 + (acceleration.z || 0) ** 2);
  if (magnitude > 22) {
    shakeCooldown = true;
    const nearReticle = Math.abs(butterflyState.x - window.innerWidth * 0.5) < 84
      && Math.abs(butterflyState.y - window.innerHeight * 0.36) < 84;

    if (nearReticle) {
      handleCaptureSuccess('shake');
    } else {
      handleCaptureFail('weak_shake');
    }

    setTimeout(() => {
      shakeCooldown = false;
    }, 900);
  }
});

startBtn.addEventListener('click', startExperience);
swipeModeBtn.addEventListener('click', () => setMode('swipe'));
shakeModeBtn.addEventListener('click', () => setMode('shake'));
continueBtn.addEventListener('click', () => {
  resultCard.classList.add('hidden');
  respawnButterfly();
  setStatus(mode === 'swipe' ? '新的目标已出现，观察轨迹后滑动捕捉' : '新的目标已出现，可继续测试甩动');
});

setMode('swipe');
updateSpecimenCard();
placeButterfly();
