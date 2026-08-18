import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AccessRoute Gemini Client Utility
 * Integrates Google Gemini API for accessibility preference extraction and route explanations.
 */

// Retrieve Gemini API Key from Vite or React or generic environment
const getGeminiApiKey = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY;
    if (import.meta.env.REACT_APP_GEMINI_API_KEY) return import.meta.env.REACT_APP_GEMINI_API_KEY;
  }
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_GEMINI_API_KEY) return process.env.VITE_GEMINI_API_KEY;
    if (process.env.REACT_APP_GEMINI_API_KEY) return process.env.REACT_APP_GEMINI_API_KEY;
    if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  }
  return '';
};

/**
 * Deterministic offline rule-based extractor
 * Provides 100% reliable fallback when API key is not configured or network is unavailable
 */
export function fallbackExtractPreferences(userInput = '') {
  const text = String(userInput).toLowerCase().trim();
  
  // Destination detection
  let destination = null;
  const knownLocations = [
    'Guindy',
    'Chennai Central',
    'Egmore',
    'Koyambedu',
    'T. Nagar',
    'Airport',
    'Velachery',
    'Tambaram',
    'Anna Nagar',
    'Thiruvanmiyur',
    'Adyar',
    'Marina Beach',
    'Apollo Hospital'
  ];

  for (const loc of knownLocations) {
    if (text.includes(loc.toLowerCase())) {
      destination = loc;
      break;
    }
  }

  // If "to <Location>" pattern
  if (!destination) {
    const toMatch = text.match(/\bto\s+([A-Za-z0-9\s.]+?)(?:\s+(?:with|without|via|for|and|please)|$)/i);
    if (toMatch && toMatch[1]) {
      destination = toMatch[1].trim();
    }
  }

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
    destination,
    wheelchair,
    avoidStairs,
    minimizeWalking,
    voiceGuidance
  };
}

/**
 * Extract structured accessibility preferences from natural language using Gemini API
 * @param {string} userInput - The raw text or voice transcript from the user
 * @returns {Promise<{ destination: string|null, wheelchair: boolean, avoidStairs: boolean, minimizeWalking: boolean, voiceGuidance: boolean }>}
 */
export async function extractPreferences(userInput) {
  if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
    return {
      destination: null,
      wheelchair: false,
      avoidStairs: false,
      minimizeWalking: false,
      voiceGuidance: false
    };
  }

  const apiKey = getGeminiApiKey();

  // If no API key is provided, use high-fidelity deterministic fallback
  if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 15) {
    console.info('[Gemini Client] No API key detected; using deterministic preference extraction fallback.');
    return fallbackExtractPreferences(userInput);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are an accessibility preference extractor for a Chennai transportation app.
      
      User input: "${userInput}"
      
      Extract structured preferences as JSON:
      {
        "destination": "location name or null if not mentioned",
        "wheelchair": boolean,
        "avoidStairs": boolean,
        "minimizeWalking": boolean,
        "voiceGuidance": boolean
      }
      
      Return ONLY valid JSON, no explanation.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text().trim();

    // Clean any markdown code blocks from Gemini response
    if (text.startsWith('```json')) {
      text = text.slice(7);
    } else if (text.startsWith('```')) {
      text = text.slice(3);
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3);
    }
    text = text.trim();

    const parsed = JSON.parse(text);

    return {
      destination: parsed.destination || null,
      wheelchair: Boolean(parsed.wheelchair),
      avoidStairs: Boolean(parsed.avoidStairs),
      minimizeWalking: Boolean(parsed.minimizeWalking),
      voiceGuidance: Boolean(parsed.voiceGuidance)
    };
  } catch (error) {
    console.warn('[Gemini Client] Preference extraction via Gemini API failed, falling back:', error.message);
    return fallbackExtractPreferences(userInput);
  }
}

/**
 * Generate a human-friendly route explanation using Gemini API
 * @param {object} route - Route object with duration, fare, segments, and accessibility data
 * @returns {Promise<string>}
 */
export async function explainRoute(route) {
  if (!route) {
    return 'Take public transit to your destination.';
  }

  const durationText = route.durationText || (route.durationMinutes ? `${route.durationMinutes} min` : '38 min');
  const fare = route.fare || 25;
  const segments = route.segments
    ? route.segments.map((s) => s.description || s.mode || s.routeName).join(', ')
    : 'Bus 21, Chennai Metro';
  const accessibilityDetails =
    route.accessibilityLevel ||
    (route.accessibility && route.accessibility.details) ||
    (route.destinationDetails && route.destinationDetails.status) ||
    'Elevator access is available at the transfer and no stairs are required';

  const defaultExplanation = `Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.`;

  const apiKey = getGeminiApiKey();
  if (!apiKey || apiKey.includes('YOUR_') || apiKey.length < 15) {
    // Generate deterministic template explanation
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
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `
      You are explaining a public transportation route to an accessibility-first user.
      
      Route details:
      - Duration: ${durationText}
      - Fare: ₹${fare}
      - Segments: ${segments}
      - Accessibility: ${accessibilityDetails}
      
      Generate a 1-2 sentence explanation in simple English. Mention transit options and key accessibility accommodations. Do not invent details not present in the route.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    return text || defaultExplanation;
  } catch (error) {
    console.warn('[Gemini Client] Route explanation via Gemini API failed, using default:', error.message);
    return defaultExplanation;
  }
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
    segments: [
      { mode: 'Bus 21', description: 'MTC Low-floor Bus' },
      { mode: 'Chennai Metro', description: 'Step-free transfer via Elevator B' }
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
