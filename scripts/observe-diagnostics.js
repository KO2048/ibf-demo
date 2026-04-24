#!/usr/bin/env node

const {
  computeWindowTargets,
  computeCameraMotion,
  computeObservationProjection,
  evaluateStartleGate,
  lerp,
  clamp,
} = require('../observe-diagnostics-core.js');

const tuning = {
  windowTargetSmoothing: 5.2,
  yawRangeAlpha: 28,
  gammaFallbackRange: 18,
  yawMaxOffsetX: 240,
  pitchRangeBeta: 18,
  pitchMaxOffsetY: 170,
  windowSignX: -1,
  windowSignY: -1,
  yawMotionScale: 24,
  pitchMotionScale: 20,
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
  nearDampingRadius: 96,
  noAutoCaptureRadius: 74,
  slowdownFactor: 0.18,
  assistDamping: 5.2,
  maxWindowVelocity: 68,
};

const startleTuning = {
  enabled: true,
  startleNearRadius: 72,
  motionThreshold: 31,
  jitterThreshold: 14,
  confirmWindowMs: 180,
  confirmBurstCount: 3,
};

function normalizeVector(x, y, scale = 1) {
  const magnitude = Math.hypot(x, y) || 1;
  return {
    x: (x / magnitude) * scale,
    y: (y / magnitude) * scale,
  };
}

function runProjectionScenario(name, options) {
  const projection = computeObservationProjection({ ...options, tuning });
  const assistLerp = clamp((1 / 60) * tuning.assistDamping, 0, 1);
  const assistOffsetX = lerp(0, projection.desiredAssistX, assistLerp);
  const assistOffsetY = lerp(0, projection.desiredAssistY, assistLerp);
  const screenX = options.worldX - (options.windowOffsetX + assistOffsetX);
  const screenY = options.worldY - (options.windowOffsetY + assistOffsetY);
  const distanceAfter = Math.hypot(screenX - options.frameX, screenY - options.frameY);
  const delta = distanceAfter - projection.distanceBefore;
  const ok = options.expectCloser ? delta < 0 : delta >= 0;

  return {
    name,
    ok,
    before: projection.distanceBefore,
    after: distanceAfter,
    delta,
    closing: projection.closingScore,
    force: projection.radialForce,
    leak: projection.tangentialLeak,
  };
}

function printScenarioGroup(title, scenarios) {
  console.log(`\n=== ${title} ===`);
  for (const scenario of scenarios) {
    const result = runProjectionScenario(scenario.name, scenario);
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(
      `${status} ${result.name}\n` +
      `  before=${result.before.toFixed(2)} after=${result.after.toFixed(2)} delta=${result.delta.toFixed(2)} close=${result.closing.toFixed(2)} force=${result.force.toFixed(2)} leak=${result.leak.toFixed(2)}`,
    );
  }
}

console.log('Observe diagnostics simulation');
console.log('Rear camera is the authoritative model. Pursuit is now evaluated as continuous closing force, not axis matching.\n');

const windowRear = computeWindowTargets({
  latestAlpha: 8,
  latestBeta: -6,
  latestGamma: 8,
  baseAlpha: 0,
  baseBeta: 0,
  baseGamma: 0,
  tuning,
  windowSignX: tuning.windowSignX,
  windowSignY: tuning.windowSignY,
  mirrorSignX: 1,
});

const motionRear = computeCameraMotion({
  latestAlpha: 5,
  latestBeta: -4,
  latestGamma: 2,
  prevAlpha: 0,
  prevBeta: 0,
  prevGamma: 0,
  tuning,
  motionSignX: tuning.motionSignX,
  motionSignY: tuning.motionSignY,
  mirrorSignX: 1,
});

console.log('Rear camera sample');
console.log(`  window target -> x ${windowRear.targetOffsetX.toFixed(2)} y ${windowRear.targetOffsetY.toFixed(2)} (${windowRear.horizontalInputMode})`);
console.log(`  motion vector -> x ${motionRear.motionX.toFixed(2)} y ${motionRear.motionY.toFixed(2)} mag ${motionRear.motionMagnitude.toFixed(2)} (${motionRear.horizontalInputMode})`);

const frame = { x: 500, y: 320 };
const directionSpecs = [
  ['right', 1, 0],
  ['left', -1, 0],
  ['up', 0, -1],
  ['down', 0, 1],
  ['up-right', 1, -1],
  ['up-left', -1, -1],
  ['down-right', 1, 1],
  ['down-left', -1, 1],
];

const correctScenarios = directionSpecs.map(([label, x, y]) => {
  const target = normalizeVector(x, y, 180);
  const motion = normalizeVector(x, y, 10);
  return {
    name: `${label} / closing motion`,
    worldX: frame.x + target.x,
    worldY: frame.y + target.y,
    frameX: frame.x,
    frameY: frame.y,
    windowOffsetX: 0,
    windowOffsetY: 0,
    motionX: motion.x,
    motionY: motion.y,
    expectCloser: true,
  };
});

const wrongScenarios = directionSpecs.map(([label, x, y]) => {
  const target = normalizeVector(x, y, 180);
  const motion = normalizeVector(-x, -y, 10);
  return {
    name: `${label} / look-away motion`,
    worldX: frame.x + target.x,
    worldY: frame.y + target.y,
    frameX: frame.x,
    frameY: frame.y,
    windowOffsetX: 0,
    windowOffsetY: 0,
    motionX: motion.x,
    motionY: motion.y,
    expectCloser: false,
  };
});

printScenarioGroup('Rear camera vector sweep / closing motion', correctScenarios);
printScenarioGroup('Rear camera vector sweep / look-away motion', wrongScenarios);

printScenarioGroup('Near zone damping', [
  {
    name: 'near zone / no auto capture',
    worldX: 560,
    worldY: 320,
    frameX: frame.x,
    frameY: frame.y,
    windowOffsetX: 0,
    windowOffsetY: 0,
    motionX: 10,
    motionY: 0,
    expectCloser: false,
  },
]);

console.log('\n=== Startle gate diagnostics ===');
const calmStartle = evaluateStartleGate({
  distanceToButterfly: 78,
  magnitude: 14,
  jitter: 5,
  tuning: startleTuning,
  pendingBurstCount: 0,
  pendingSince: 0,
  nowMs: 100,
});
console.log(
  `${calmStartle.triggered ? 'FAIL' : 'PASS'} calm pursuit / no trigger\n` +
  `  pending=${calmStartle.pendingBurstCount} reason=${calmStartle.gateReason || '--'}`,
);

const burstStartleA = evaluateStartleGate({
  distanceToButterfly: 58,
  magnitude: 36,
  jitter: 18,
  tuning: startleTuning,
  pendingBurstCount: 0,
  pendingSince: 0,
  nowMs: 200,
});
const burstStartleB = evaluateStartleGate({
  distanceToButterfly: 58,
  magnitude: 34,
  jitter: 16,
  tuning: startleTuning,
  pendingBurstCount: burstStartleA.pendingBurstCount,
  pendingSince: burstStartleA.pendingSince,
  nowMs: 290,
});
const burstStartleC = evaluateStartleGate({
  distanceToButterfly: 58,
  magnitude: 35,
  jitter: 17,
  tuning: startleTuning,
  pendingBurstCount: burstStartleB.pendingBurstCount,
  pendingSince: burstStartleB.pendingSince,
  nowMs: 340,
});
console.log(
  `${burstStartleC.triggered ? 'PASS' : 'FAIL'} near burst / gated trigger\n` +
  `  pendingA=${burstStartleA.pendingBurstCount} pendingB=${burstStartleB.pendingBurstCount} triggeredC=${burstStartleC.triggered} reason=${burstStartleC.gateReason || burstStartleB.gateReason || burstStartleA.gateReason || '--'}`,
);
