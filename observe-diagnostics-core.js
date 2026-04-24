(function attachObserveDiagnosticsCore(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  root.ObserveDiagnosticsCore = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createObserveDiagnosticsCore() {
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function normalizeAngleDelta(delta) {
    let next = delta;
    while (next > 180) next -= 360;
    while (next < -180) next += 360;
    return next;
  }

  function getPursuitStrength(distance, tuning) {
    if (distance <= tuning.noAutoCaptureRadius) return 0;
    if (distance <= tuning.closingNearRadius) {
      return lerp(
        0,
        tuning.closingForceNear,
        (distance - tuning.noAutoCaptureRadius)
          / Math.max(1, tuning.closingNearRadius - tuning.noAutoCaptureRadius),
      );
    }
    if (distance <= tuning.closingMidRadius) {
      return lerp(
        tuning.closingForceNear,
        tuning.closingForceMid,
        (distance - tuning.closingNearRadius)
          / Math.max(1, tuning.closingMidRadius - tuning.closingNearRadius),
      );
    }
    return tuning.closingForceFar;
  }

  function computeWindowTargets({
    latestAlpha,
    latestBeta,
    latestGamma,
    baseAlpha,
    baseBeta,
    baseGamma,
    tuning,
    windowSignX = 1,
    windowSignY = 1,
    mirrorSignX = 1,
  }) {
    const betaDelta = clamp(latestBeta - baseBeta, -tuning.pitchRangeBeta, tuning.pitchRangeBeta);
    const rawGammaDelta = Number.isFinite(latestGamma) && Number.isFinite(baseGamma)
      ? latestGamma - baseGamma
      : 0;
    const gammaDelta = clamp(rawGammaDelta, -tuning.gammaFallbackRange, tuning.gammaFallbackRange);
    const hasAlpha = Number.isFinite(latestAlpha) && Number.isFinite(baseAlpha);
    const rawAlphaDelta = hasAlpha ? normalizeAngleDelta(latestAlpha - baseAlpha) : 0;
    const alphaDelta = clamp(rawAlphaDelta, -tuning.yawRangeAlpha, tuning.yawRangeAlpha);
    const horizontalInputMode = hasAlpha ? 'alpha' : 'gamma-fallback';
    const horizontalDelta = horizontalInputMode === 'alpha'
      ? alphaDelta
      : mirrorSignX * gammaDelta;
    const horizontalRange = horizontalInputMode === 'alpha'
      ? tuning.yawRangeAlpha
      : tuning.gammaFallbackRange;
    const targetOffsetX = windowSignX * (horizontalDelta / horizontalRange) * tuning.yawMaxOffsetX;
    const targetOffsetY = windowSignY * (betaDelta / tuning.pitchRangeBeta) * tuning.pitchMaxOffsetY;

    return {
      alphaDelta,
      betaDelta,
      gammaDelta,
      horizontalInputMode,
      targetOffsetX,
      targetOffsetY,
    };
  }

  function computeCameraMotion({
    latestAlpha,
    latestBeta,
    latestGamma,
    prevAlpha,
    prevBeta,
    prevGamma,
    tuning,
    motionSignX = 1,
    motionSignY = 1,
    mirrorSignX = 1,
  }) {
    const hasAlpha = Number.isFinite(latestAlpha) && Number.isFinite(prevAlpha);
    const rawAlphaDelta = hasAlpha ? normalizeAngleDelta(latestAlpha - prevAlpha) : 0;
    const alphaDelta = clamp(rawAlphaDelta, -tuning.yawRangeAlpha, tuning.yawRangeAlpha);
    const rawGammaDelta = Number.isFinite(latestGamma) && Number.isFinite(prevGamma)
      ? latestGamma - prevGamma
      : 0;
    const gammaDelta = clamp(rawGammaDelta, -tuning.gammaFallbackRange, tuning.gammaFallbackRange);
    const rawBetaDelta = Number.isFinite(latestBeta) && Number.isFinite(prevBeta)
      ? latestBeta - prevBeta
      : 0;
    const betaDelta = clamp(rawBetaDelta, -tuning.pitchRangeBeta, tuning.pitchRangeBeta);

    const horizontalInputMode = hasAlpha ? 'alpha' : 'gamma-fallback';
    const horizontalDelta = horizontalInputMode === 'alpha'
      ? alphaDelta
      : mirrorSignX * gammaDelta;
    const horizontalRange = horizontalInputMode === 'alpha'
      ? tuning.yawRangeAlpha
      : tuning.gammaFallbackRange;

    const motionX = motionSignX * (horizontalDelta / Math.max(1, horizontalRange)) * tuning.yawMotionScale;
    const motionY = motionSignY * (betaDelta / Math.max(1, tuning.pitchRangeBeta)) * tuning.pitchMotionScale;
    const motionMagnitude = Math.hypot(motionX, motionY);

    return {
      alphaDelta,
      betaDelta,
      gammaDelta,
      horizontalInputMode,
      motionX,
      motionY,
      motionMagnitude,
    };
  }

  function computeObservationProjection({
    worldX,
    worldY,
    frameX,
    frameY,
    windowOffsetX,
    windowOffsetY,
    motionX,
    motionY,
    tuning,
  }) {
    const baseScreenX = worldX - windowOffsetX;
    const baseScreenY = worldY - windowOffsetY;
    const butterflyVecX = baseScreenX - frameX;
    const butterflyVecY = baseScreenY - frameY;
    const distanceBefore = Math.hypot(butterflyVecX, butterflyVecY);
    const motionMagnitude = Math.hypot(motionX, motionY);

    let closingScore = 0;
    let radialForce = 0;
    let tangentialLeak = 0;
    let desiredAssistX = 0;
    let desiredAssistY = 0;

    if (distanceBefore > 1 && motionMagnitude > tuning.motionDeadZone) {
      const dirX = butterflyVecX / distanceBefore;
      const dirY = butterflyVecY / distanceBefore;
      const normalizedMotionX = motionX / motionMagnitude;
      const normalizedMotionY = motionY / motionMagnitude;
      closingScore = dirX * normalizedMotionX + dirY * normalizedMotionY;
      tangentialLeak = Math.sqrt(Math.max(0, 1 - clamp(closingScore, -1, 1) ** 2));

      if (closingScore > tuning.closingScoreThreshold) {
        const strength = getPursuitStrength(distanceBefore, tuning);
        const scaledMotion = clamp(
          motionMagnitude * tuning.closingForceScale,
          0,
          tuning.maxWindowVelocity,
        );
        radialForce = clamp(
          (closingScore - tuning.closingScoreThreshold)
            / (1 - tuning.closingScoreThreshold)
            * scaledMotion
            * strength,
          0,
          tuning.maxWindowVelocity,
        );
        desiredAssistX = dirX * radialForce;
        desiredAssistY = dirY * radialForce;
      }
    }

    return {
      baseScreenX,
      baseScreenY,
      butterflyVecX,
      butterflyVecY,
      distanceBefore,
      motionMagnitude,
      closingScore,
      radialForce,
      tangentialLeak,
      desiredAssistX,
      desiredAssistY,
    };
  }

  function evaluateStartleGate({
    distanceToButterfly,
    magnitude,
    jitter,
    tuning,
    pendingBurstCount = 0,
    pendingSince = 0,
    nowMs = 0,
  }) {
    const nearEnough = distanceToButterfly > 0 && distanceToButterfly <= tuning.startleNearRadius;
    const reason = magnitude > tuning.motionThreshold
      ? 'motion'
      : jitter > tuning.jitterThreshold
        ? 'jitter'
        : '';
    const burstActive = tuning.enabled && nearEnough && Boolean(reason);

    let nextPendingBurstCount = pendingBurstCount;
    let nextPendingSince = pendingSince;
    let gateReason = reason;
    let triggered = false;

    if (burstActive) {
      if (!pendingSince || nowMs - pendingSince > tuning.confirmWindowMs) {
        nextPendingSince = nowMs;
        nextPendingBurstCount = 1;
      } else {
        nextPendingBurstCount += 1;
      }
      triggered = nextPendingBurstCount >= tuning.confirmBurstCount;
      if (triggered) {
        nextPendingBurstCount = 0;
        nextPendingSince = 0;
      }
    } else if (pendingSince && nowMs - pendingSince > tuning.confirmWindowMs) {
      nextPendingBurstCount = 0;
      nextPendingSince = 0;
      gateReason = '';
    }

    return {
      nearEnough,
      burstActive,
      triggered,
      pendingBurstCount: nextPendingBurstCount,
      pendingSince: nextPendingSince,
      gateReason,
    };
  }

  return {
    clamp,
    lerp,
    normalizeAngleDelta,
    getPursuitStrength,
    computeWindowTargets,
    computeCameraMotion,
    computeObservationProjection,
    evaluateStartleGate,
  };
}));
