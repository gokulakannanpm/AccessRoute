import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * AccessRoute Server-Side Gemini Service
 * Handles Google Gemini API calls exclusively on the backend server.
 * Protects secrets by keeping GEMINI_API_KEY strictly on the server.
 */

export function getGeminiApiKey() {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim();
}

export function isGeminiConfigured() {
  const key = getGeminiApiKey();
  return Boolean(key && !key.includes('YOUR_') && key.length >= 15);
}

/**
 * Extract structured accessibility preferences from user input using Gemini API
 * @param {string} userInput - Raw natural language query
 * @returns {Promise<{ origin: string|null, destination: string|null, wheelchair: boolean, avoidStairs: boolean, minimizeWalking: boolean, voiceGuidance: boolean }>}
 */
export async function extractPreferencesWithGemini(userInput) {
  if (!isGeminiConfigured()) {
    const error = new Error('Gemini AI service unavailable: GEMINI_API_KEY is not configured on the server.');
    error.code = 'GEMINI_UNCONFIGURED';
    error.status = 503;
    throw error;
  }

  const apiKey = getGeminiApiKey();
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
    You are an accessibility preference extractor for a Chennai transportation app.
    Supported hotspots: Chennai Central, Egmore, T. Nagar, Koyambedu, Guindy, Tambaram.
    
    User input: "${userInput.replace(/"/g, '\\"')}"
    
    Extract structured preferences as JSON:
    {
      "origin": "exact hotspot name or null if not mentioned",
      "destination": "exact hotspot name or null if not mentioned",
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
    origin: parsed.origin || null,
    destination: parsed.destination || null,
    wheelchair: Boolean(parsed.wheelchair),
    avoidStairs: Boolean(parsed.avoidStairs),
    minimizeWalking: Boolean(parsed.minimizeWalking),
    voiceGuidance: Boolean(parsed.voiceGuidance)
  };
}

/**
 * Generate human-friendly route explanation using Gemini API
 * @param {object} route - Route structure with duration, fare, segments, and accessibility
 * @returns {Promise<string>}
 */
export async function explainRouteWithGemini(route) {
  if (!isGeminiConfigured()) {
    const error = new Error('Gemini AI service unavailable: GEMINI_API_KEY is not configured on the server.');
    error.code = 'GEMINI_UNCONFIGURED';
    error.status = 503;
    throw error;
  }

  const durationText = route.durationText || (route.durationMinutes ? `${route.durationMinutes} min` : '38 min');
  const fare = route.fare || 25;
  const segments = Array.isArray(route.segments)
    ? route.segments.map((s) => s.description || s.mode || s.routeName).join(', ')
    : 'Bus 21, Chennai Metro';
  const accessibilityDetails =
    route.accessibilityLevel ||
    (route.accessibility && route.accessibility.details) ||
    (route.destinationDetails && route.destinationDetails.status) ||
    'Elevator access is available at the transfer and no stairs are required';

  const apiKey = getGeminiApiKey();
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
  return text;
}
