import fs from 'fs';
import path from 'path';

/**
 * AccessRoute Feed Eligibility Validator
 *
 * Inspects ingestion_manifest.json for transit feeds and enforces strict eligibility rules:
 * - readyForJourneyRouting MUST be strictly true.
 * - feedLevelBlockers MUST be empty.
 * - status MUST be 'VALIDATED' or 'VALIDATED_WITH_WARNINGS' (not 'EXPIRED_CALENDAR' or 'VALIDATION_FAILED').
 * - calendarStatus MUST be 'ACTIVE'.
 * - Community scrapes, expired calendars, and unresolved suburban datasets are blocked.
 */

export function inspectFeedEligibility(feedDirOrManifest) {
  let manifest;

  if (typeof feedDirOrManifest === 'string') {
    const manifestPath = path.join(feedDirOrManifest, 'ingestion_manifest.json');
    if (!fs.existsSync(manifestPath)) {
      return {
        eligible: false,
        mode: 'unknown',
        reasons: [`MISSING_MANIFEST: No ingestion_manifest.json found at ${manifestPath}`]
      };
    }
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (err) {
      return {
        eligible: false,
        mode: 'unknown',
        reasons: [`CORRUPT_MANIFEST: Failed to parse ingestion_manifest.json: ${err.message}`]
      };
    }
  } else if (feedDirOrManifest && typeof feedDirOrManifest === 'object') {
    manifest = feedDirOrManifest;
  } else {
    return {
      eligible: false,
      mode: 'unknown',
      reasons: ['INVALID_ARGUMENT: Feed directory path or manifest object required']
    };
  }

  const reasons = [];
  const mode = manifest.mode || 'unknown';

  // 1. readyForJourneyRouting check
  if (manifest.readyForJourneyRouting !== true) {
    reasons.push(`READY_FOR_ROUTING_FALSE: Feed explicitly marked readyForJourneyRouting: ${manifest.readyForJourneyRouting}`);
  }

  // 2. Feed-level blockers check
  if (Array.isArray(manifest.feedLevelBlockers) && manifest.feedLevelBlockers.length > 0) {
    reasons.push(...manifest.feedLevelBlockers.map(b => `BLOCKER: ${b}`));
  }

  // 3. Calendar status check
  if (manifest.calendarStatus === 'EXPIRED') {
    reasons.push('EXPIRED_CALENDAR: All calendar services in feed have expired');
  } else if (manifest.calendarStatus !== 'ACTIVE') {
    reasons.push(`INACTIVE_CALENDAR: Calendar status is ${manifest.calendarStatus || 'UNKNOWN'}`);
  }

  // 4. Ingestion status check
  const allowedStatuses = ['VALIDATED', 'VALIDATED_WITH_WARNINGS'];
  if (!allowedStatuses.includes(manifest.status)) {
    reasons.push(`INVALID_INGESTION_STATUS: Ingestion status is ${manifest.status || 'UNKNOWN'}`);
  }

  return {
    eligible: reasons.length === 0,
    mode,
    reasons,
    manifest
  };
}

/**
 * Scans standard production directories under data/ and reports eligibility.
 */
export function auditProductionFeeds(baseDataDir = path.resolve(process.cwd(), 'data')) {
  const modes = [
    { mode: 'chennai_metro', dir: path.join(baseDataDir, 'chennai_metro', 'imported') },
    { mode: 'suburban_rail', dir: path.join(baseDataDir, 'suburban_rail', 'imported') },
    { mode: 'mtc_bus', dir: path.join(baseDataDir, 'mtc_bus', 'imported') }
  ];

  const results = {};
  const eligibleFeeds = [];

  for (const { mode, dir } of modes) {
    if (fs.existsSync(dir)) {
      const inspection = inspectFeedEligibility(dir);
      results[mode] = {
        dir,
        eligible: inspection.eligible,
        reasons: inspection.reasons,
        blockers: inspection.manifest?.feedLevelBlockers || []
      };
      if (inspection.eligible) {
        eligibleFeeds.push({ mode, dir, manifest: inspection.manifest });
      }
    } else {
      results[mode] = {
        dir,
        eligible: false,
        reasons: ['DIRECTORY_NOT_FOUND: Feed directory does not exist'],
        blockers: ['DIRECTORY_NOT_FOUND']
      };
    }
  }

  return {
    totalModesChecked: modes.length,
    eligibleCount: eligibleFeeds.length,
    eligibleFeeds,
    productionRoutingReady: eligibleFeeds.length > 0,
    modes: results
  };
}
