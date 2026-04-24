#!/usr/bin/env node

const {
  computeOrientationTargets,
  computeObservationProjection,
  lerp,
  clamp,
} = require('../observe-diagnostics-core.js');

const tuning = {
  orientationRangeGamma: 20,
  orientationRangeBeta: 18,
  maxOffsetX: 220,
  maxOffsetY: 170,
  pursuitDeadZone: 0.35,
  pursuitAlignmentThreshold: 0.12,
  pursuitResponse: 5.2,
  pursuitFarStrength: 0.82,
  pursuitMidStrength: 0.44,
  pursuitNearStrength: 0.16,
  pursuitMidRadius: 180,
  pursuitNearRadius: 104,
  pursuitNoAutoCaptureRadius: 72,
  pursuitDamping: 4.8,
  pursuitAssistMaxOffset: 82,
};

function runProjectionScenario(name, options) {
  const projection = computeObservationProjection({ ...options, tuning });
  const assistLerp = clamp((1 / 60) * tuning.pursuitDamping, 0, 1);
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
    alignment: projection.alignmentScore,
  };
}

function printScenarioGroup(title, scenarios) {
  console.log(`\n=== ${title} ===`);
  for (const scenario of scenarios) {
    const result = runProjectionScenario(scenario.name, scenario);
    const status = result.ok ? 'PASS' : 'FAIL';
    console.log(
      `${status} ${result.name}\n` +
      `  before=${result.before.toFixed(2)} after=${result.after.toFixed(2)} delta=${result.delta.toFixed(2)} align=${result.alignment.toFixed(2)}`,
    );
  }
}

console.log('Observe diagnostics simulation');
console.log('Rear camera is the authoritative model. Front camera is only a compatibility branch.\n');

const orientationRear = computeOrientationTargets({
  latestBeta: 6,
  latestGamma: 8,
  baseBeta: 0,
  baseGamma: 0,
  tuning,
  axisSignX: 1,
  axisSignY: 1,
  mirrorSignX: 1,
});

const orientationFrontCompat = computeOrientationTargets({
  latestBeta: 6,
  latestGamma: 8,
  baseBeta: 0,
  baseGamma: 0,
  tuning,
  axisSignX: 1,
  axisSignY: 1,
  mirrorSignX: -1,
});

console.log('Rear orientation sample');
console.log(`  gamma +8 -> targetOffsetX ${orientationRear.targetOffsetX.toFixed(2)}`);
console.log(`  beta  +6 -> targetOffsetY ${orientationRear.targetOffsetY.toFixed(2)}`);
console.log('Front compatibility sample');
console.log(`  gamma +8 -> targetOffsetX ${orientationFrontCompat.targetOffsetX.toFixed(2)}`);
console.log(`  beta  +6 -> targetOffsetY ${orientationFrontCompat.targetOffsetY.toFixed(2)}`);

printScenarioGroup('Rear camera pursuit matrix', [
  {
    name: 'right / correct pursuit',
    worldX: 700,
    worldY: 300,
    frameX: 500,
    frameY: 300,
    windowOffsetX: 30,
    windowOffsetY: 0,
    smoothedDeltaX: 12,
    smoothedDeltaY: 0,
    expectCloser: true,
  },
  {
    name: 'right / wrong pursuit',
    worldX: 700,
    worldY: 300,
    frameX: 500,
    frameY: 300,
    windowOffsetX: -30,
    windowOffsetY: 0,
    smoothedDeltaX: -12,
    smoothedDeltaY: 0,
    expectCloser: false,
  },
  {
    name: 'left / correct pursuit',
    worldX: 300,
    worldY: 300,
    frameX: 500,
    frameY: 300,
    windowOffsetX: -30,
    windowOffsetY: 0,
    smoothedDeltaX: -12,
    smoothedDeltaY: 0,
    expectCloser: true,
  },
  {
    name: 'up / correct pursuit',
    worldX: 500,
    worldY: 180,
    frameX: 500,
    frameY: 320,
    windowOffsetX: 0,
    windowOffsetY: -24,
    smoothedDeltaX: 0,
    smoothedDeltaY: -10,
    expectCloser: true,
  },
  {
    name: 'down / correct pursuit',
    worldX: 500,
    worldY: 500,
    frameX: 500,
    frameY: 300,
    windowOffsetX: 0,
    windowOffsetY: 30,
    smoothedDeltaX: 0,
    smoothedDeltaY: 12,
    expectCloser: true,
  },
  {
    name: 'near zone / no auto capture',
    worldX: 562,
    worldY: 300,
    frameX: 500,
    frameY: 300,
    windowOffsetX: 0,
    windowOffsetY: 0,
    smoothedDeltaX: 12,
    smoothedDeltaY: 0,
    expectCloser: false,
  },
]);

printScenarioGroup('Front compatibility branch', [
  {
    name: 'front camera / mirrored right pursuit',
    worldX: 700,
    worldY: 300,
    frameX: 500,
    frameY: 300,
    windowOffsetX: -30,
    windowOffsetY: 0,
    smoothedDeltaX: -12,
    smoothedDeltaY: 0,
    expectCloser: false,
  },
]);
