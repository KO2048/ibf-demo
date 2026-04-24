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
    latestBeta,
    latestGamma,
    baseBeta,
    baseGamma,
    tuning,
    axisSignX = 1,
    axisSignY = 1,
    mirrorSignX = 1,
  }) {
    const betaDelta = clamp(
      latestBeta - baseBeta,
      -tuning.orientationRangeBeta,
      tuning.orientationRangeBeta,
    );
    const gammaDelta = clamp(
      latestGamma - baseGamma,
      -tuning.orientationRangeGamma,
      tuning.orientationRangeGamma,
    );

    return {
      betaDelta,
      gammaDelta,
      targetOffsetX: axisSignX * mirrorSignX * (gammaDelta / tuning.orientationRangeGamma) * tuning.maxOffsetX,
      targetOffsetY: axisSignY * (betaDelta / tuning.orientationRangeBeta) * tuning.maxOffsetY,
    };
  }

  function computeObservationProjection({
    worldX,
    worldY,
    frameX,
    frameY,
    windowOffsetX,
    windowOffsetY,
    smoothedDeltaX,
    smoothedDeltaY,
    tuning,
  }) {
    const baseScreenX = worldX - windowOffsetX;
    const baseScreenY = worldY - windowOffsetY;
    const dx = baseScreenX - frameX;
    const dy = baseScreenY - frameY;
    const distanceBefore = Math.hypot(dx, dy);
    const deltaMag = Math.hypot(smoothedDeltaX, smoothedDeltaY);

    let alignmentScore = 0;
    let pursuitInfluence = 0;
    let desiredAssistX = 0;
    let desiredAssistY = 0;

    if (distanceBefore > 1 && deltaMag > tuning.pursuitDeadZone) {
      const dirX = dx / distanceBefore;
      const dirY = dy / distanceBefore;
      const intentX = smoothedDeltaX / deltaMag;
      const intentY = smoothedDeltaY / deltaMag;
      alignmentScore = dirX * intentX + dirY * intentY;

      if (alignmentScore > tuning.pursuitAlignmentThreshold) {
        const strength = getPursuitStrength(distanceBefore, tuning);
        const assistMagnitude = clamp(
          (alignmentScore - tuning.pursuitAlignmentThreshold)
            / (1 - tuning.pursuitAlignmentThreshold)
            * deltaMag
            * tuning.pursuitResponse
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
      deltaMag,
      alignmentScore,
      pursuitInfluence,
      desiredAssistX,
      desiredAssistY,
    };
  }

  return {
    clamp,
    lerp,
    getPursuitStrength,
    computeOrientationTargets,
    computeObservationProjection,
  };
}));
