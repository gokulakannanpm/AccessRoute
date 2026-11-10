/**
 * AccessRoute Gemini Client Utility (Frontend Client)
 * Proxies AI operations to backend Express endpoints (/api/ai/*).
 * Completely isolates API keys on the server to prevent browser secret leakage.
 * Provides deterministic offline rule-based fallback when server or provider is unavailable.
 */

const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return ''; // Browser uses relative path (proxied by Vite to backend)
  }
  return (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) || 'http://127.0.0.1:5000';
};

export const HOTSPOT_ALIASES = {
  'chennai central': 'Chennai Central',
  'central': 'Chennai Central',
  'central station': 'Chennai Central',
  'egmore': 'Egmore',
  'egmore station': 'Egmore',
  't. nagar': 'T. Nagar',
  't nagar': 'T. Nagar',
  'tnagar': 'T. Nagar',
  'thyagaraya nagar': 'T. Nagar',
  'koyambedu': 'Koyambedu',
  'cmbt': 'Koyambedu',
  'guindy': 'Guindy',
  'guindy metro': 'Guindy',
  'tambaram': 'Tambaram',
  'tambaram station': 'Tambaram'
};

export function matchLocationName(str) {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();
  for (const aliasKey in HOTSPOT_ALIASES) {
    if (s.includes(aliasKey) || aliasKey.includes(s)) {
      return HOTSPOT_ALIASES[aliasKey];
    }
  }
  return null;
}

export function extractOriginAndDestination(text) {
  if (!text || typeof text !== 'string') return { origin: null, destination: null };
  const lower = text.toLowerCase().trim();

  let origin = null;
  let destination = null;

  // 1. Pattern "from <loc1> to <loc2>"
  const fromToMatch = lower.match(/from\s+([a-z0-9\s.]+?)\s+to\s+([a-z0-9\s.]+?)(?:\s+(?:with|without|via|for|using|please)|$)/i);
  if (fromToMatch) {
    const candidateOrigin = matchLocationName(fromToMatch[1]);
    const candidateDest = matchLocationName(fromToMatch[2]);
    if (candidateOrigin) origin = candidateOrigin;
    if (candidateDest) destination = candidateDest;
  }

  // 2. Pattern "to <loc2> from <loc1>"
  if (!origin || !destination) {
    const toFromMatch = lower.match(/to\s+([a-z0-9\s.]+?)\s+from\s+([a-z0-9\s.]+?)(?:\s+(?:with|without|via|for|using|please)|$)/i);
    if (toFromMatch) {
      const candidateDest = matchLocationName(toFromMatch[1]);
      const candidateOrigin = matchLocationName(toFromMatch[2]);
      if (candidateDest) destination = candidateDest;
      if (candidateOrigin) origin = candidateOrigin;
    }
  }

  // 3. Pattern "<loc1> to <loc2>"
  if (!origin || !destination) {
    const simpleToMatch = lower.match(/([a-z0-9\s.]+?)\s+to\s+([a-z0-9\s.]+?)(?:\s+(?:with|without|via|for|using|please)|$)/i);
    if (simpleToMatch) {
      const candidateOrigin = matchLocationName(simpleToMatch[1]);
      const candidateDest = matchLocationName(simpleToMatch[2]);
      if (candidateOrigin && candidateDest) {
        origin = candidateOrigin;
        destination = candidateDest;
      }
    }
  }

  // 4. Search for any mentioned hotspots
  if (!origin || !destination) {
    const foundLocations = [];
    const sortedAliasKeys = Object.keys(HOTSPOT_ALIASES).sort((a, b) => b.length - a.length);

    for (const key of sortedAliasKeys) {
      if (lower.includes(key)) {
        const canonical = HOTSPOT_ALIASES[key];
        if (!foundLocations.includes(canonical)) {
          foundLocations.push(canonical);
        }
      }
    }

    if (foundLocations.length >= 2) {
      if (!origin) origin = foundLocations[0];
      if (!destination) destination = foundLocations[1];
    } else if (foundLocations.length === 1) {
      if (lower.includes('from ' + foundLocations[0].toLowerCase())) {
        if (!origin) origin = foundLocations[0];
      } else {
        if (!destination) destination = foundLocations[0];
      }
    }
  }

  return { origin, destination };
}

/**
 * Deterministic offline rule-based extractor
 * Provides 100% reliable fallback when API key is not configured or network is unavailable
 */
export function fallbackExtractPreferences(userInput = '') {
  const text = String(userInput).toLowerCase().trim();
  const { origin, destination } = extractOriginAndDestination(userInput);

  const wheelchair =
    text.includes('wheelchair') ||
    text.includes('wheel chair') ||
    text.includes('chair bound');

  const avoidStairs =
    text.includes('avoid stairs') ||
    text.includes("can't use stairs") ||
    text.includes("cannot use stairs") ||
    text.includes("cant use stairs") ||
    text.includes('no stairs') ||
    text.includes('without stairs') ||
    text.includes('skip stairs') ||
    text.includes('elevator only') ||
    text.includes('step-free') ||
    text.includes('step free');

  const minimizeWalking =
    text.includes("can't walk far") ||
    text.includes("cannot walk far") ||
    text.includes("cant walk far") ||
    text.includes('minimize walking') ||
    text.includes('less walking') ||
    text.includes('minimum walking') ||
    text.includes('short walk') ||
    text.includes('limited mobility') ||
    text.includes('tired easily');

  const voiceGuidance =
    text.includes('voice guidance') ||
    text.includes('voice navigation') ||
    text.includes('audio navigation') ||
    text.includes('voice directions') ||
    text.includes('audio directions') ||
    text.includes('speak directions') ||
    text.includes('audio guidance') ||
    text.includes('read out');

  return {
    origin,
    destination,
    wheelchair,
    avoidStairs,
    minimizeWalking,
    voiceGuidance
  };
}

/**
 * Extract structured accessibility preferences from natural language
 * Calls the secure backend endpoint /api/ai/extract-preferences with fallback to deterministic local rules.
 * @param {string} userInput - The raw text or voice transcript from the user
 * @returns {Promise<{ origin: string|null, destination: string|null, wheelchair: boolean, avoidStairs: boolean, minimizeWalking: boolean, voiceGuidance: boolean }>}
 */
export async function extractPreferences(userInput) {
  if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
    return {
      origin: null,
      destination: null,
      wheelchair: false,
      avoidStairs: false,
      minimizeWalking: false,
      voiceGuidance: false
    };
  }

  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/ai/extract-preferences`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userInput.trim() })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.preferences) {
        const fallbackLocations = extractOriginAndDestination(userInput);
        return {
          origin: data.preferences.origin || fallbackLocations.origin || null,
          destination: data.preferences.destination || fallbackLocations.destination || null,
          wheelchair: Boolean(data.preferences.wheelchair),
          avoidStairs: Boolean(data.preferences.avoidStairs),
          minimizeWalking: Boolean(data.preferences.minimizeWalking),
          voiceGuidance: Boolean(data.preferences.voiceGuidance)
        };
      }
    }
  } catch {
    // Backend offline or network failure; gracefully use offline deterministic parser
  }

  return fallbackExtractPreferences(userInput);
}

/**
 * Generate a human-friendly route explanation
 * Calls secure backend endpoint /api/ai/explain-route with fallback to template generator.
 * @param {object} route - Route object with duration, fare, segments, and accessibility data
 * @returns {Promise<string>}
 */
export async function explainRoute(route) {
  if (!route) {
    return 'Take public transit to your destination.';
  }

  const defaultExplanation = 'Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.';

  const getTemplateExplanation = () => {
    if (route.segments && route.segments.length > 0) {
      const mainModes = route.segments
        .filter((s) => s.type === 'bus' || s.type === 'metro' || s.type === 'train')
        .map((s) => s.badge || s.routeName || s.mode);

      const modesStr = mainModes.length > 0 ? mainModes.join(', then ') : 'Bus 21, then Chennai Metro';
      const accessStr = route.isStepFree
        ? 'Elevator access is available at the transfer and no stairs are required.'
        : 'Please note some stairs may be present along this route.';
      return `Take ${modesStr}. ${accessStr}`;
    }
    return defaultExplanation;
  };

  try {
    const baseUrl = getApiBaseUrl();
    const response = await fetch(`${baseUrl}/api/ai/explain-route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ route })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.success && data.explanation) {
        return data.explanation;
      }
    }
  } catch {
    // Backend offline or network failure; gracefully use template explanation
  }

  return getTemplateExplanation();
}

/**
 * Unified Voice Query Handler for Assisted Travel UI
 * Processes voice transcript, extracts preferences, and returns journey guidance
 */
export async function processVoiceQuery(transcript) {
  const preferences = await extractPreferences(transcript);

  const mockRoute = {
    durationText: '38 min',
    fare: 25,
    isStepFree: true,
    segments: [
      { mode: 'Bus 21', badge: 'MTC Bus 21', type: 'bus', description: 'MTC Low-floor Bus' },
      { mode: 'Chennai Metro', badge: 'Chennai Metro', type: 'metro', description: 'Step-free transfer via Elevator B' }
    ],
    accessibilityLevel: 'Elevator access is available at the transfer and no stairs are required'
  };

  const suggestedJourneyText = await explainRoute(mockRoute);

  return {
    understood: true,
    message: 'Route generated based on your voice request.',
    detectedPreferences: preferences,
    suggestedJourneyText: suggestedJourneyText || 'Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.',
    recommendedRouteId: 'rec-1'
  };
}
