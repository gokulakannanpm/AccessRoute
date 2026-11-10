import { parseGtfsDirectory } from '../ingestion/gtfsParser.js';
import { timeStringToSeconds, secondsToTimeString } from '../ingestion/gtfsValidator.js';
import { inspectFeedEligibility } from './feedEligibility.js';

/**
 * AccessRoute Unified Transit Graph
 *
 * Encapsulates stops, parent stations, routes, trips, scheduled connections,
 * and verified multi-modal transfer footpaths.
 */

export class TransitGraph {
  constructor() {
    this.stops = new Map();
    this.stations = new Map();
    this.routes = new Map();
    this.trips = new Map();
    this.connections = []; // Ordered chronologically by departureTimeSec
    this.transfers = new Map(); // fromStopId -> [ { toStopId, minTransferTimeSec, distanceMeters, isStepFree } ]
    this.loadedFeeds = [];
  }

  getStop(stopId) {
    return this.stops.get(stopId) || null;
  }

  getStation(stationId) {
    return this.stations.get(stationId) || null;
  }

  getTransfersFrom(stopId) {
    return this.transfers.get(stopId) || [];
  }

  /**
   * Add a stop node
   */
  addStop(stop) {
    this.stops.set(stop.id, stop);
    if (stop.parentStation) {
      if (!this.stations.has(stop.parentStation)) {
        this.stations.set(stop.parentStation, {
          id: stop.parentStation,
          name: stop.name,
          code: stop.code || stop.parentStation,
          latitude: stop.latitude,
          longitude: stop.longitude,
          stopIds: []
        });
      }
      const stn = this.stations.get(stop.parentStation);
      if (!stn.stopIds.includes(stop.id)) {
        stn.stopIds.push(stop.id);
      }
    }
  }

  /**
   * Add a station node
   */
  addStation(station) {
    this.stations.set(station.id, {
      id: station.id,
      name: station.name,
      code: station.code || station.id,
      latitude: station.latitude,
      longitude: station.longitude,
      stopIds: station.stopIds || []
    });
  }

  /**
   * Add a verified transfer footpath
   */
  addTransfer({ fromStopId, toStopId, minTransferTimeSec = 120, distanceMeters = 80, isStepFree = true }) {
    if (!this.transfers.has(fromStopId)) {
      this.transfers.set(fromStopId, []);
    }
    const list = this.transfers.get(fromStopId);
    // Avoid duplicate transfer entries
    const existing = list.find(t => t.toStopId === toStopId);
    if (!existing) {
      list.push({
        toStopId,
        minTransferTimeSec: Math.max(30, minTransferTimeSec),
        distanceMeters: Math.max(10, distanceMeters),
        isStepFree: Boolean(isStepFree)
      });
    }
  }

  /**
   * Loads a GTFS feed directory into the graph after checking eligibility.
   * If enforceEligibility is true (production mode), rejects feeds with readyForJourneyRouting: false.
   */
  loadFeed(feedDir, options = {}) {
    const { enforceEligibility = true, feedMode = null } = options;

    if (enforceEligibility) {
      const eligibility = inspectFeedEligibility(feedDir);
      if (!eligibility.eligible) {
        throw new Error(`Feed in ${feedDir} is not eligible for journey routing: ${eligibility.reasons.join('; ')}`);
      }
    }

    const parsed = parseGtfsDirectory(feedDir);
    const tables = parsed.tables;

    // 1. Routes
    if (tables.routes?.rows) {
      for (const row of tables.routes.rows) {
        const routeType = parseInt(row.route_type, 10);
        let mode = null;
        if (routeType === 1) mode = 'chennai_metro';
        else if (routeType === 2) mode = 'suburban_rail';
        else if (routeType === 3) mode = 'mtc_bus';
        else mode = feedMode || 'transit';

        this.routes.set(row.route_id, {
          id: row.route_id,
          agencyId: row.agency_id,
          shortName: row.route_short_name || '',
          longName: row.route_long_name || '',
          routeType,
          mode
        });
      }
    }

    // 2. Stops
    if (tables.stops?.rows) {
      for (const row of tables.stops.rows) {
        const isStation = row.location_type === '1';
        const stopNode = {
          id: row.stop_id,
          name: row.stop_name,
          code: row.stop_code || row.stop_id,
          latitude: parseFloat(row.stop_lat),
          longitude: parseFloat(row.stop_lon),
          parentStation: row.parent_station || null,
          wheelchairBoarding: row.wheelchair_boarding === '1'
        };

        if (isStation) {
          this.addStation(stopNode);
        } else {
          this.addStop(stopNode);
        }
      }
    }

    // 3. Trips
    const tripToRoute = new Map();
    if (tables.trips?.rows) {
      for (const row of tables.trips.rows) {
        const route = this.routes.get(row.route_id);
        const tripNode = {
          id: row.trip_id,
          routeId: row.route_id,
          serviceId: row.service_id,
          headsign: row.trip_headsign || '',
          wheelchairAccessible: row.wheelchair_accessible === '1',
          mode: route ? route.mode : (feedMode || 'transit')
        };
        this.trips.set(row.trip_id, tripNode);
        tripToRoute.set(row.trip_id, tripNode);
      }
    }

    // 4. Stop Times -> Scheduled Connections
    if (tables.stop_times?.rows) {
      // Group stop times by trip_id, sorted by stop_sequence
      const tripStopTimes = new Map();
      for (const st of tables.stop_times.rows) {
        if (!tripStopTimes.has(st.trip_id)) {
          tripStopTimes.set(st.trip_id, []);
        }
        tripStopTimes.get(st.trip_id).push({
          stopId: st.stop_id,
          sequence: parseInt(st.stop_sequence, 10),
          arrivalTimeStr: st.arrival_time,
          departureTimeStr: st.departure_time,
          arrivalTimeSec: timeStringToSeconds(st.arrival_time),
          departureTimeSec: timeStringToSeconds(st.departure_time)
        });
      }

      for (const [tripId, stList] of tripStopTimes.entries()) {
        stList.sort((a, b) => a.sequence - b.sequence);
        const trip = tripToRoute.get(tripId);
        const route = trip ? this.routes.get(trip.routeId) : null;
        const mode = trip ? trip.mode : (feedMode || 'transit');
        const wheelchair = trip ? trip.wheelchairAccessible : false;

        for (let i = 0; i < stList.length - 1; i++) {
          const from = stList[i];
          const to = stList[i + 1];

          // Skip invalid non-monotonic consecutive stops
          if (to.arrivalTimeSec < from.departureTimeSec) {
            continue;
          }

          const connection = {
            id: `${tripId}_${from.sequence}_${to.sequence}`,
            tripId,
            routeId: route ? route.id : null,
            routeShortName: route ? route.shortName : '',
            routeLongName: route ? route.longName : '',
            mode,
            fromStopId: from.stopId,
            toStopId: to.stopId,
            departureTimeSec: from.departureTimeSec,
            arrivalTimeSec: to.arrivalTimeSec,
            departureTimeStr: from.departureTimeStr,
            arrivalTimeStr: to.arrivalTimeStr,
            wheelchairAccessible: wheelchair
          };

          this.connections.push(connection);
        }
      }
    }

    // 5. Explicit Transfers
    if (tables.transfers?.rows) {
      for (const row of tables.transfers.rows) {
        const minTransferSec = row.min_transfer_time ? parseInt(row.min_transfer_time, 10) : 120;
        const isStepFree = row.is_step_free !== undefined ? row.is_step_free === '1' : true;
        const distance = row.distance_meters ? parseInt(row.distance_meters, 10) : 80;

        this.addTransfer({
          fromStopId: row.from_stop_id,
          toStopId: row.to_stop_id,
          minTransferTimeSec: minTransferSec,
          distanceMeters: distance,
          isStepFree
        });
      }
    }

    // 6. Connect platforms within the same parent station (internal step-free interchange)
    for (const station of this.stations.values()) {
      const stops = station.stopIds;
      if (stops.length > 1) {
        for (let i = 0; i < stops.length; i++) {
          for (let j = 0; j < stops.length; j++) {
            if (i !== j) {
              this.addTransfer({
                fromStopId: stops[i],
                toStopId: stops[j],
                minTransferTimeSec: 180, // 3 min standard internal platform transfer
                distanceMeters: 100,
                isStepFree: true
              });
            }
          }
        }
      }
    }

    // Re-sort all connections chronologically by departureTimeSec: O(C log C)
    this.connections.sort((a, b) => a.departureTimeSec - b.departureTimeSec);

    this.loadedFeeds.push({
      dir: feedDir,
      mode: feedMode || (parsed.tables.routes?.rows[0]?.route_type === '1' ? 'chennai_metro' : 'transit'),
      connectionsCount: this.connections.length
    });

    return {
      success: true,
      connectionsCount: this.connections.length,
      stopsCount: this.stops.size,
      stationsCount: this.stations.size
    };
  }
}
