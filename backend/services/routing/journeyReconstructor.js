import { secondsToTimeString } from '../ingestion/gtfsValidator.js';

/**
 * AccessRoute Journey Reconstructor
 *
 * Backtracks through CSA parent pointers to reconstruct ordered journey legs,
 * transit boardings/alightings, transfer footpaths, and calculates accessibility scores.
 */

export function reconstructJourneys(rawCandidates, transitGraph, originStopIds, preferences = {}) {
  const journeys = [];
  const seenJourneySignatures = new Set();

  for (const candidate of rawCandidates) {
    const { destStopId, parentMapSnapshot } = candidate;
    const pathElements = [];
    let currStop = destStopId;
    let iterations = 0;
    const maxHops = 50;

    while (currStop && !originStopIds.includes(currStop) && iterations < maxHops) {
      iterations++;
      const p = parentMapSnapshot.get(currStop);
      if (!p) break;
      pathElements.unshift(p);
      currStop = p.fromStopId;
    }

    if (!originStopIds.includes(currStop) || pathElements.length === 0) {
      continue;
    }

    // Compress consecutive connections on the same trip into single transit legs
    const legs = [];
    let currentTransitLeg = null;
    let legCounter = 1;

    for (const elem of pathElements) {
      if (elem.type === 'connection') {
        const c = elem.connection;
        if (currentTransitLeg && currentTransitLeg.tripId === c.tripId) {
          // Extend current leg
          currentTransitLeg.toStopId = c.toStopId;
          currentTransitLeg.arrivalTimeSec = c.arrivalTimeSec;
          currentTransitLeg.arrivalTimeStr = c.arrivalTimeStr;
          currentTransitLeg.intermediateStops.push(c.toStopId);
        } else {
          // Finish previous leg if open
          if (currentTransitLeg) {
            legs.push(finalizeTransitLeg(currentTransitLeg, transitGraph, legCounter++));
          }
          currentTransitLeg = {
            type: 'transit',
            tripId: c.tripId,
            routeId: c.routeId,
            mode: c.mode,
            routeShortName: c.routeShortName,
            routeLongName: c.routeLongName,
            fromStopId: c.fromStopId,
            toStopId: c.toStopId,
            departureTimeSec: c.departureTimeSec,
            arrivalTimeSec: c.arrivalTimeSec,
            departureTimeStr: c.departureTimeStr,
            arrivalTimeStr: c.arrivalTimeStr,
            wheelchairAccessible: c.wheelchairAccessible,
            intermediateStops: [c.fromStopId, c.toStopId]
          };
        }
      } else if (elem.type === 'transfer') {
        // Finish any ongoing transit leg
        if (currentTransitLeg) {
          legs.push(finalizeTransitLeg(currentTransitLeg, transitGraph, legCounter++));
          currentTransitLeg = null;
        }

        const tr = elem.transfer;
        const fromStop = transitGraph.getStop(elem.fromStopId);
        const toStop = transitGraph.getStop(tr.toStopId);
        const durMin = Math.max(1, Math.round(tr.minTransferTimeSec / 60));

        legs.push({
          id: legCounter++,
          type: 'transfer',
          mode: 'Walk',
          fromStopId: elem.fromStopId,
          fromStopName: fromStop ? fromStop.name : elem.fromStopId,
          fromCoordinates: (fromStop && fromStop.longitude && fromStop.latitude) ? [fromStop.longitude, fromStop.latitude] : null,
          toStopId: tr.toStopId,
          toStopName: toStop ? toStop.name : tr.toStopId,
          toCoordinates: (toStop && toStop.longitude && toStop.latitude) ? [toStop.longitude, toStop.latitude] : null,
          duration: `${durMin} min`,
          durationMinutes: durMin,
          distanceMeters: tr.distanceMeters || 80,
          distance: `${tr.distanceMeters || 80}m`,
          description: tr.isStepFree ? 'Step-free transfer walkway' : 'Transfer walkway (stairs present)',
          isStepFree: Boolean(tr.isStepFree),
          icon: 'walk',
          coordinates: (fromStop?.longitude && toStop?.longitude) ? [[fromStop.longitude, fromStop.latitude], [toStop.longitude, toStop.latitude]] : []
        });
      }
    }

    if (currentTransitLeg) {
      legs.push(finalizeTransitLeg(currentTransitLeg, transitGraph, legCounter++));
    }

    if (legs.length === 0) continue;

    // Check unique signature to deduplicate identical journeys
    const sig = legs.map(l => `${l.type}_${l.tripId || l.fromStopId}_${l.departureTimeStr || ''}_${l.arrivalTimeStr || ''}`).join('|');
    if (seenJourneySignatures.has(sig)) continue;
    seenJourneySignatures.add(sig);

    // Compute journey totals
    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];
    const depTimeSec = firstLeg.departureTimeSec;
    const arrTimeSec = lastLeg.arrivalTimeSec;
    const durationMinutes = Math.max(1, Math.round((arrTimeSec - depTimeSec) / 60));

    let walkingMeters = 0;
    let transfersCount = 0;
    let allStepFree = true;
    let elevatorsCount = 0;
    let stairsCount = 0;
    let hasRamp = true;

    for (const leg of legs) {
      if (leg.type === 'transfer' || leg.type === 'walk') {
        walkingMeters += leg.distanceMeters || 0;
        transfersCount++;
        if (!leg.isStepFree) {
          allStepFree = false;
          stairsCount += 2;
        }
      } else if (leg.type === 'transit') {
        if (!leg.isStepFree) {
          allStepFree = false;
        }
        if (leg.mode === 'chennai_metro') {
          elevatorsCount += 1;
        }
      }
    }

    // Accessibility score = (elevators * 10) - (stairs * 15) + (ramps * 5) - (walking_distance / 20)
    const accessibilityScore = Math.round(((elevatorsCount * 10) - (stairsCount * 15) + (hasRamp ? 5 : 0) - (walkingMeters / 20)) * 10) / 10;
    const accessibilityLevel = allStepFree && stairsCount === 0 ? 'Highly Accessible' : (stairsCount > 0 ? 'Limited Accessibility' : 'Good Accessibility');

    // Aggregate map coordinates
    const coordinates = [];
    for (const leg of legs) {
      if (leg.coordinates && Array.isArray(leg.coordinates)) {
        coordinates.push(...leg.coordinates);
      }
    }

    // Estimate realistic fare based on modes
    let fare = 15;
    const modesUsed = new Set(legs.filter(l => l.type === 'transit').map(l => l.mode));
    if (modesUsed.has('chennai_metro')) fare += 20;
    if (modesUsed.has('suburban_rail')) fare += 5;
    if (modesUsed.has('mtc_bus')) fare += 10;

    journeys.push({
      id: `journey_${journeys.length + 1}_${depTimeSec}_${arrTimeSec}`,
      routingMode: 'timetable',
      isRealTimetable: true,
      departureTime: firstLeg.departureTimeStr,
      arrivalTime: lastLeg.arrivalTimeStr,
      departureTimeSec: depTimeSec,
      arrivalTimeSec: arrTimeSec,
      duration: durationMinutes,
      durationMinutes,
      durationText: `${durationMinutes} min`,
      fare,
      fareText: `₹${fare}`,
      transfersCount,
      walkingDistanceMeters: walkingMeters,
      walkingText: `${walkingMeters}m walking distance`,
      isStepFree: allStepFree,
      accessibilityLevel,
      accessibilityBadgeColor: allStepFree ? 'teal' : 'warning',
      accessibilityScore,
      accessibility: {
        level: allStepFree ? 'highly_accessible' : (stairsCount > 0 ? 'limited' : 'good'),
        elevators: elevatorsCount,
        stairs: stairsCount,
        ramps: hasRamp ? 1 : 0,
        score: accessibilityScore
      },
      coordinates,
      legs,
      segments: legs // Compatibility alias with existing UI segment format
    });
  }

  return journeys;
}

function finalizeTransitLeg(legData, transitGraph, id) {
  const fromStop = transitGraph.getStop(legData.fromStopId);
  const toStop = transitGraph.getStop(legData.toStopId);
  const durMin = Math.max(1, Math.round((legData.arrivalTimeSec - legData.departureTimeSec) / 60));

  let modeLabel = 'Transit';
  let icon = 'bus';
  if (legData.mode === 'chennai_metro') {
    modeLabel = 'Chennai Metro';
    icon = 'metro';
  } else if (legData.mode === 'suburban_rail') {
    modeLabel = 'Suburban Rail';
    icon = 'train';
  } else if (legData.mode === 'mtc_bus') {
    modeLabel = 'MTC Bus';
    icon = 'bus';
  }

  const coords = [];
  if (fromStop && fromStop.longitude && fromStop.latitude) {
    coords.push([fromStop.longitude, fromStop.latitude]);
  }
  if (toStop && toStop.longitude && toStop.latitude) {
    coords.push([toStop.longitude, toStop.latitude]);
  }

  return {
    id,
    type: 'transit',
    mode: modeLabel,
    transitMode: legData.mode,
    tripId: legData.tripId,
    routeId: legData.routeId,
    routeName: legData.routeShortName || legData.routeLongName || modeLabel,
    badge: legData.routeShortName ? `${modeLabel} ${legData.routeShortName}` : modeLabel,
    fromStopId: legData.fromStopId,
    fromStopName: fromStop ? fromStop.name : legData.fromStopId,
    fromCoordinates: (fromStop && fromStop.longitude && fromStop.latitude) ? [fromStop.longitude, fromStop.latitude] : null,
    toStopId: legData.toStopId,
    toStopName: toStop ? toStop.name : legData.toStopId,
    toCoordinates: (toStop && toStop.longitude && toStop.latitude) ? [toStop.longitude, toStop.latitude] : null,
    departureTimeSec: legData.departureTimeSec,
    arrivalTimeSec: legData.arrivalTimeSec,
    departureTimeStr: legData.departureTimeStr,
    arrivalTimeStr: legData.arrivalTimeStr,
    duration: `${durMin} min`,
    durationMinutes: durMin,
    description: `Board ${modeLabel} at ${fromStop ? fromStop.name : legData.fromStopId}`,
    isStepFree: Boolean(legData.wheelchairAccessible),
    icon,
    coordinates: coords
  };
}

/**
 * Ranks candidate journeys into { recommended, fastest, lowestCost }
 */
export function rankTimetableJourneys(journeys, preferences = {}) {
  if (!Array.isArray(journeys) || journeys.length === 0) {
    return {
      recommended: null,
      fastest: null,
      lowestCost: null,
      candidates: []
    };
  }

  const { wheelchair = false, avoidStairs = false } = preferences;

  // Filter candidates matching hard constraints
  let valid = journeys;
  if (wheelchair || avoidStairs) {
    const accessible = journeys.filter(j => j.isStepFree);
    if (accessible.length > 0) {
      valid = accessible;
    }
  }

  // Sort pools
  const byAccessibility = [...valid].sort((a, b) => b.accessibilityScore - a.accessibilityScore || a.durationMinutes - b.durationMinutes);
  const byDuration = [...journeys].sort((a, b) => a.durationMinutes - b.durationMinutes);
  const byFare = [...valid].sort((a, b) => a.fare - b.fare || a.durationMinutes - b.durationMinutes);

  const recommended = byAccessibility[0] || journeys[0];
  const fastest = byDuration[0] || journeys[0];
  const lowestCost = byFare[0] || journeys[0];

  return {
    recommended: { ...recommended, label: 'RECOMMENDED FOR YOU', type: 'recommended' },
    fastest: { ...fastest, label: 'FASTEST', type: 'fastest' },
    lowestCost: { ...lowestCost, label: 'LOWEST COST', type: 'lowest_cost' },
    candidates: journeys
  };
}
