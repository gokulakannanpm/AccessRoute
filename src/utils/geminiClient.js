/**
 * AccessRoute Gemini Client Utility
 * Placeholder ready for AI Engineer integration.
 */

export async function processVoiceQuery(transcript) {
  await new Promise(res => setTimeout(res, 400));
  
  return {
    understood: true,
    message: 'Route generated based on your voice request.',
    detectedPreferences: {
      avoidStairs: true,
      wheelchair: true,
      voiceGuidance: true
    },
    suggestedJourneyText: 'Take Bus 21, then Chennai Metro. Elevator access is available at the transfer and no stairs are required.',
    recommendedRouteId: 'rec-1'
  };
}
