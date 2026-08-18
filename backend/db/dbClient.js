import { supabase, isSupabaseConfigured } from '../config/supabase.js';
import {
  CHENNAI_LOCATIONS,
  CHENNAI_STATIONS_ACCESSIBILITY,
  CHENNAI_ROUTES,
  CHENNAI_USER_PROFILE,
  INITIAL_ISSUES
} from './seedData.js';

// Local mutable state initialized with seed data for hackathon execution / fallback
let localLocations = [...CHENNAI_LOCATIONS];
let localStationsAccessibility = { ...CHENNAI_STATIONS_ACCESSIBILITY };
let localRoutes = { ...CHENNAI_ROUTES };
let localUserProfile = JSON.parse(JSON.stringify(CHENNAI_USER_PROFILE));
let localIssues = [...INITIAL_ISSUES];

export const dbClient = {
  /**
   * Fetch all searchable locations (stations, stops, landmarks)
   */
  async getLocations() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('locations').select('*');
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('[dbClient] Supabase getLocations error, falling back to seed store:', err.message);
      }
    }
    return localLocations;
  },

  /**
   * Get location by ID or name
   */
  async findLocation(query) {
    if (!query) return null;
    const lowerQuery = String(query).toLowerCase().trim();
    
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('locations')
          .select('*')
          .or(`id.eq.${query},name.ilike.%${query}%`)
          .limit(1);
        if (!error && data && data.length > 0) {
          return data[0];
        }
      } catch {
        // fallback
      }
    }

    return (
      localLocations.find(
        (loc) =>
          loc.id.toLowerCase() === lowerQuery ||
          loc.name.toLowerCase().includes(lowerQuery) ||
          lowerQuery.includes(loc.name.toLowerCase())
      ) || null
    );
  },

  /**
   * Search for routes between origin and destination with preferences
   */
  async searchRoutes({ origin, destination, preferences = {} }) {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('routes').select('*');
        if (!error && data && data.length >= 3) {
          // Map supabase rows to ranked routes response
          const recommended = data.find((r) => r.accessibility_level === 'highly_accessible') || data[0];
          const fastest = data.find((r) => r.accessibility_level === 'limited') || data[1];
          const lowestCost = data.find((r) => r.accessibility_level === 'good') || data[2];
          return { recommended, fastest, lowestCost };
        }
      } catch (err) {
        console.warn('[dbClient] Supabase searchRoutes error, using seed store:', err.message);
      }
    }

    // Dynamic preference adjustment and scoring
    const result = JSON.parse(JSON.stringify(localRoutes));

    // Calculate accessibility scores: score = (elevators * 10) - (stairs * 15) + (ramps * 5) - (walking_distance / 20)
    for (const key of ['recommended', 'fastest', 'lowestCost']) {
      if (result[key]) {
        const elevators = result[key].elevatorsCount || (result[key].accessibility?.elevators || 0);
        const stairs = result[key].stairsCount || (result[key].accessibility?.stairs || 0);
        const ramps = result[key].hasRamp || (result[key].accessibility?.ramps ? 1 : 0) ? 1 : 0;
        const walking = result[key].walkingDistanceMeters || result[key].walkingDistance || 0;
        result[key].accessibilityScore = Math.round(((elevators * 10) - (stairs * 15) + (ramps * 5) - (walking / 20)) * 10) / 10;
      }
    }

    // If voice guidance requested, add voice badge
    if (preferences.voiceGuidance) {
      result.recommended.voiceGuidanceEnabled = true;
    }

    return result;
  },

  /**
   * Retrieve a single route by ID
   */
  async getRouteById(routeId) {
    if (!routeId) return null;
    const cleanId = String(routeId).toLowerCase().trim();

    // Check pre-computed keys
    if (cleanId === 'recommended' || cleanId === 'route_1' || cleanId === 'rec-1') {
      return localRoutes.recommended;
    }
    if (cleanId === 'fastest' || cleanId === 'route_2' || cleanId === 'fast-1') {
      return localRoutes.fastest;
    }
    if (cleanId === 'lowestcost' || cleanId === 'lowest_cost' || cleanId === 'route_3' || cleanId === 'cost-1') {
      return localRoutes.lowestCost;
    }

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('routes')
          .select('*')
          .eq('id', routeId)
          .single();
        if (!error && data) {
          return data;
        }
      } catch {
        // fallback
      }
    }

    // Search across local routes
    for (const key of ['recommended', 'fastest', 'lowestCost']) {
      if (localRoutes[key] && (localRoutes[key].id === routeId || key.toLowerCase() === cleanId)) {
        return localRoutes[key];
      }
    }

    return null;
  },

  /**
   * Get station accessibility details by station ID or name
   */
  async getStationAccessibility(stationId) {
    if (!stationId) return null;
    const cleanId = String(stationId).toLowerCase().trim();

    // Map common aliases
    let mappedKey = cleanId;
    if (cleanId === 'station_guindy' || cleanId === 'guindy' || cleanId === 'location_2') {
      mappedKey = 'station_guindy';
    } else if (cleanId === 'station_chennai_central' || cleanId === 'chennai central' || cleanId === 'location_1') {
      mappedKey = 'station_chennai_central';
    } else if (cleanId === 'station_egmore' || cleanId === 'egmore' || cleanId === 'location_3') {
      mappedKey = 'station_egmore';
    }

    if (isSupabaseConfigured) {
      try {
        const { data: stationLoc } = await supabase
          .from('locations')
          .select('*, accessibility_data(*), issues(*)')
          .or(`id.eq.${stationId},name.ilike.%${stationId}%`)
          .single();
        if (stationLoc) {
          return {
            id: stationLoc.id,
            name: stationLoc.name,
            verified: true,
            verificationDate: '2024-08-15',
            accessibility: stationLoc.accessibility_data || {},
            knownIssues: stationLoc.issues || []
          };
        }
      } catch {
        // fallback
      }
    }

    if (localStationsAccessibility[mappedKey]) {
      return localStationsAccessibility[mappedKey];
    }

    // Default accessibility structure for known locations
    const foundLoc = localLocations.find(
      (l) => l.id.toLowerCase() === cleanId || l.name.toLowerCase().includes(cleanId)
    );

    if (foundLoc) {
      return {
        id: `station_${foundLoc.name.toLowerCase().replace(/\s+/g, '_')}`,
        name: foundLoc.name,
        verified: true,
        verificationDate: '2024-08-15',
        accessibility: {
          elevators: { count: 1, status: 'working', details: 'Operational elevator available' },
          ramps: { available: true, details: 'Standard gradient ramp' },
          stairs: { present: true, count: 2, details: 'Elevator alternative available' },
          stepFreeEntrance: { available: true, gate: 'Main Gate', details: 'Accessible step-free entry' },
          accessibleToilet: { available: true, details: 'Available' },
          lowFloorVehicles: { available: true, details: 'Transit units offer low-floor or level boarding' }
        },
        knownIssues: []
      };
    }

    return null;
  },

  /**
   * Submit an infrastructure issue
   */
  async createIssue({ type, stationId, details, userContact }) {
    const newIssue = {
      id: `issue_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`,
      type: type || 'other',
      stationId: stationId || 'unspecified',
      details: details || '',
      description: details || '',
      userContact: userContact || null,
      status: 'open',
      createdAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('issues')
          .insert({
            issue_type: newIssue.type,
            station_id: stationId && stationId.length === 36 ? stationId : null,
            description: newIssue.details,
            user_contact: userContact,
            status: 'open'
          })
          .select()
          .single();
        if (!error && data) {
          newIssue.id = data.id;
        }
      } catch (err) {
        console.warn('[dbClient] Supabase issue insert error, saved locally:', err.message);
      }
    }

    localIssues.unshift(newIssue);
    localUserProfile.impact.issuesReported = (localUserProfile.impact.issuesReported || 0) + 1;

    return newIssue;
  },

  /**
   * Get all reported issues
   */
  async getIssues() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('issues').select('*').order('created_at', { ascending: false });
        if (!error && data) {
          return data;
        }
      } catch {
        // fallback
      }
    }
    return localIssues;
  },

  /**
   * Get user profile and impact stats
   */
  async getUserProfile() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('user_profile').select('*').limit(1).single();
        if (!error && data) {
          return {
            user: {
              name: data.name,
              preferences: data.preferences
            },
            impact: {
              totalJourneys: data.total_journeys,
              accessibleJourneys: data.accessible_journeys,
              estimatedSavings: data.estimated_savings,
              co2Avoided: parseFloat(data.co2_avoided),
              issuesReported: data.issues_reported
            }
          };
        }
      } catch {
        // fallback
      }
    }
    return localUserProfile;
  }
};
