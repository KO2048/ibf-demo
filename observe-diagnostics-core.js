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
    if (distance <= tuning.pursuitNoAutoCaptureRadius) return 0;
    if (distance <= tuning.pursuitNearRadius) {
      return lerp(
        0,
        tuning.pursuitNearStrength,
        (distance - tuning.pursuitNoAutoCaptureRadius)
          / Math.max(1, tuning.pursuitNearRadius - tuning.pursuitNoAutoCaptureRadius),
      );
    }
    if (distance <= tuning.pursuitMidRadius) {
      return lerp(
        tuning.pursuitNearStrength,
        tuning.pursuitMidStrength,
        (distance - tuning.pursuitNearRadius)
          / Math.max(1, tuning.pursuitMidRadius - tuning.pursuitNearRadius),
      );
    }
    return tuning.pursuitFarStrength;
  }

  function computeOrientationTargets({
    latestAlpha,
    latestBeta,
    latestGamma,
    baseAlpha,
    baseBeta,
    baseGamma,
    tuning,
    axisSignX = 1,
    axisSignY = 1,
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
    const targetOffsetX = axisSignX * (horizontalDelta / horizontalRange) * tuning.yawMaxOffsetX;
    const targetOffsetY = axisSignY * (betaDelta / tuning.pitchRangeBeta) * tuning.pitchMaxOffsetY;

    return {
      alphaDelta,
      betaDelta,
      gammaDelta,
      horizontalInputMode,
      intentX: targetOffsetX,
      intentY: targetOffsetY,
      targetOffsetX,
      targetOffsetY,
    };
  }

  function computeObservationProjection({
    worldX,
    worldY,
    frameX,
    frameY,
    windowOffsetX,
    windowOffsetY,
    intentX,
    intentY,
    tuning,
  }) {
    const baseScreenX = worldX - windowOffsetX;
    const baseScreenY = worldY - windowOffsetY;
    const dx = baseScreenX - frameX;
    const dy = baseScreenY - frameY;
    const distanceBefore = Math.hypot(dx, dy);
    const intentMag = Math.hypot(intentX, intentY);

    let alignmentScore = 0;
    let pursuitInfluence = 0;
    let desiredAssistX = 0;
    let desiredAssistY = 0;

    if (distanceBefore > 1 && intentMag > tuning.pursuitDeadZone) {
      const dirX = dx / distanceBefore;
      const dirY = dy / distanceBefore;
      const normalizedIntentX = intentX / intentMag;
      const normalizedIntentY = intentY / intentMag;
      alignmentScore = dirX * normalizedIntentX + dirY * normalizedIntentY;

      if (alignmentScore > tuning.pursuitAlignmentThreshold) {
        const strength = getPursuitStrength(distanceBefore, tuning);
        const scaledIntent = clamp(
          intentMag * tuning.pursuitIntentResponse,
          0,
          tuning.pursuitIntentMax,
        );
        const assistMagnitude = clamp(
          (alignmentScore - tuning.pursuitAlignmentThreshold)
            / (1 - tuning.pursuitAlignmentThreshold)
            * scaledIntent
            * strength,
          0,
          tuning.pursuitAssistMaxOffset,
        );
        pursuitInfluence = assistMagnitude;
        desiredAssistX = dirX * assistMagnitude;
        desiredAssistY = dirY * assistMagnitude;
      }
    }

    return {
      baseScreenX,
      baseScreenY,
      dx,
      dy,
      distanceBefore,
      intentMag,
      alignmentScore,
      pursuitInfluence,
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
    computeOrientationTargets,
    computeObservationProjection,
    evaluateStartleGate,
  };
}));
