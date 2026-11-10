import { RoutingError, RoutingErrorCodes } from './errors.js';

/**
 * Connection Scan Algorithm (CSA) for Timetable Journey Routing
 *
 * Scans chronologically ordered elementary scheduled connections,
 * supporting multi-modal transfers, wheelchair accessibility filtering,
 * time-dependent departure planning, and overnight schedules (> 24:00:00).
 */

export function runConnectionScan(transitGraph, query) {
  const {
    originStopIds = [],
    destinationStopIds = [],
    departureTimeSec = 0,
    searchHorizonSec = 7200,      // 2 hours search window
    maxTransfers = 3,
    maxWalkingDistanceMeters = 800,
    preferences = {},
    maxCandidates = 3
  } = query;

  if (originStopIds.length === 0) {
    throw new RoutingError(RoutingErrorCodes.UNKNOWN_ORIGIN, 'No valid origin stop nodes provided');
  }
  if (destinationStopIds.length === 0) {
    throw new RoutingError(RoutingErrorCodes.UNKNOWN_DESTINATION, 'No valid destination stop nodes provided');
  }

  // Check if origin and destination intersect
  const overlap = originStopIds.some(s => destinationStopIds.includes(s));
  if (overlap) {
    throw new RoutingError(RoutingErrorCodes.SAME_ORIGIN_DESTINATION, 'Origin and destination stops are identical');
  }

  const {
    wheelchair = false,
    avoidStairs = false,
    minimizeWalking = false,
    transportModes = { metro: true, bus: true, suburban: true, express: true }
  } = preferences;

  const effectiveMaxWalk = minimizeWalking ? Math.min(400, maxWalkingDistanceMeters) : maxWalkingDistanceMeters;

  // Helper to check if a connection mode is enabled in transportModes
  const isModeEnabled = (mode) => {
    if (!mode) return true;
    const m = mode.toLowerCase();
    if (m.includes('metro') && transportModes.metro === false) return false;
    if (m.includes('bus') && transportModes.bus === false) return false;
    if (m.includes('suburban') && transportModes.suburban === false) return false;
    if (m.includes('express') && transportModes.express === false) return false;
    return true;
  };

  const connections = transitGraph.connections;
  if (!connections || connections.length === 0) {
    return { journeys: [], rawCandidatesCount: 0 };
  }

  // Binary search to find start connection index (first with departureTimeSec >= departureTimeSec)
  let low = 0;
  let high = connections.length - 1;
  let startIndex = connections.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (connections[mid].departureTimeSec >= departureTimeSec) {
      startIndex = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  if (startIndex >= connections.length) {
    // All connections departed before requested time
    return { journeys: [], rawCandidatesCount: 0 };
  }

  // Earliest arrival tracking and parent pointers
  // Keyed by stopId -> { arrivalTimeSec, parentPointer }
  const earliestArrival = new Map();
  const parent = new Map(); // stopId -> { type, connection/transfer, fromStopId }
  const inTrip = new Map(); // tripId -> { boardedStopId, boardedTimeSec }

  // Initialize origins
  for (const s of originStopIds) {
    earliestArrival.set(s, departureTimeSec);
    // Relax initial transfers out of origin
    const originTransfers = transitGraph.getTransfersFrom(s);
    for (const tr of originTransfers) {
      if ((wheelchair || avoidStairs) && !tr.isStepFree) continue;
      if (tr.distanceMeters > effectiveMaxWalk) continue;
      const arr = departureTimeSec + tr.minTransferTimeSec;
      if (!earliestArrival.has(tr.toStopId) || arr < earliestArrival.get(tr.toStopId)) {
        earliestArrival.set(tr.toStopId, arr);
        parent.set(tr.toStopId, {
          type: 'transfer',
          transfer: tr,
          fromStopId: s,
          departureTimeSec,
          arrivalTimeSec: arr
        });
      }
    }
  }

  const horizonEndSec = departureTimeSec + searchHorizonSec;
  const recordedCandidates = [];
  const candidateTripsUsed = new Set();

  for (let i = startIndex; i < connections.length; i++) {
    const c = connections[i];
    if (c.departureTimeSec > horizonEndSec) {
      break;
    }

    // Filter by mode
    if (!isModeEnabled(c.mode)) {
      continue;
    }

    // Filter by accessibility
    if (wheelchair && !c.wheelchairAccessible) {
      continue;
    }

    const fromArrival = earliestArrival.get(c.fromStopId);
    const canBoard = fromArrival !== undefined && c.departureTimeSec >= fromArrival;
    const alreadyOnTrip = inTrip.has(c.tripId);

    if (alreadyOnTrip || canBoard) {
      if (!alreadyOnTrip) {
        inTrip.set(c.tripId, {
          boardedStopId: c.fromStopId,
          boardedTimeSec: c.departureTimeSec
        });
      }

      const toArrival = earliestArrival.get(c.toStopId);
      if (toArrival === undefined || c.arrivalTimeSec < toArrival) {
        earliestArrival.set(c.toStopId, c.arrivalTimeSec);
        parent.set(c.toStopId, {
          type: 'connection',
          connection: c,
          fromStopId: c.fromStopId,
          departureTimeSec: c.departureTimeSec,
          arrivalTimeSec: c.arrivalTimeSec
        });

        // Relax transfers out of c.toStopId
        const transfers = transitGraph.getTransfersFrom(c.toStopId);
        for (const tr of transfers) {
          if ((wheelchair || avoidStairs) && !tr.isStepFree) continue;
          if (tr.distanceMeters > effectiveMaxWalk) continue;
          const transferArrival = c.arrivalTimeSec + tr.minTransferTimeSec;
          const existing = earliestArrival.get(tr.toStopId);
          if (existing === undefined || transferArrival < existing) {
            earliestArrival.set(tr.toStopId, transferArrival);
            parent.set(tr.toStopId, {
              type: 'transfer',
              transfer: tr,
              fromStopId: c.toStopId,
              departureTimeSec: c.arrivalTimeSec,
              arrivalTimeSec: transferArrival
            });
          }
        }
      }

      // Check if we reached a destination stop!
      if (destinationStopIds.includes(c.toStopId)) {
        const candidateKey = `${c.tripId}_${c.toStopId}_${c.arrivalTimeSec}`;
        if (!candidateTripsUsed.has(candidateKey)) {
          candidateTripsUsed.add(candidateKey);
          // Snapshot state for journey reconstruction
          recordedCandidates.push({
            destStopId: c.toStopId,
            arrivalTimeSec: c.arrivalTimeSec,
            parentMapSnapshot: new Map(parent)
          });
        }
      }
    }
  }

  // Also check if any transfer reached destination
  for (const destId of destinationStopIds) {
    const p = parent.get(destId);
    if (p && p.type === 'transfer') {
      const candidateKey = `transfer_${destId}_${p.arrivalTimeSec}`;
      if (!candidateTripsUsed.has(candidateKey)) {
        candidateTripsUsed.add(candidateKey);
        recordedCandidates.push({
          destStopId: destId,
          arrivalTimeSec: p.arrivalTimeSec,
          parentMapSnapshot: new Map(parent)
        });
      }
    }
  }

  return {
    rawCandidates: recordedCandidates,
    rawCandidatesCount: recordedCandidates.length,
    earliestArrival
  };
}
