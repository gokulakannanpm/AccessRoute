import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { parseGtfsDirectory } from './gtfsParser.js';
import { validateGtfsFeed, DEFAULT_SPATIAL_BOUNDS, reconcileCuratedCatalogue } from './gtfsValidator.js';

/**
 * AccessRoute Transit Data Ingestion Pipeline
 * Modular, repeatable pipeline that accepts local GTFS archives/directories,
 * validates structure and integrity, enforces strict mode isolation,
 * preserves source provenance, and produces an immutable ingestion manifest.
 */

export const ALLOWED_MODES = [
  'chennai_metro',
  'suburban_rail',
  'mtc_bus',
  'express_rail'
];

export function runIngestion(sourceDir, options = {}) {
  const mode = options.mode;
  if (!mode || !ALLOWED_MODES.includes(mode)) {
    throw new Error(`Mode is mandatory and must be one of: ${ALLOWED_MODES.join(', ')}. Got: "${mode}"`);
  }

  // 1. Parse directory
  let parsedFeed;
  try {
    parsedFeed = parseGtfsDirectory(sourceDir);
  } catch (err) {
    return {
      success: false,
      mode,
      provenance: null,
      error: `Failed to read GTFS directory: ${err.message}`,
      validation: null,
      manifest: null
    };
  }

  // 2. Validate parsed feed
  const validationOptions = {
    bounds: options.bounds || DEFAULT_SPATIAL_BOUNDS,
    referenceDate: options.referenceDate,
    strictCalendar: options.strictCalendar !== undefined ? options.strictCalendar : true,
    corridorExceptions: options.corridorExceptions || []
  };

  const validation = validateGtfsFeed(parsedFeed, validationOptions);

  // 3. Catalogue reconciliation (if catalogue path provided)
  let catalogueReconciliation = null;
  if (options.cataloguePath && fs.existsSync(options.cataloguePath)) {
    try {
      const catData = JSON.parse(fs.readFileSync(options.cataloguePath, 'utf8'));
      const stations = catData.stations || catData.interchangeHubs;
      catalogueReconciliation = reconcileCuratedCatalogue(parsedFeed.tables.stops?.rows, stations, { mode });
      if (catalogueReconciliation && catalogueReconciliation.unmatchedExtensionStations?.length > 0) {
        validation.feedLevelBlockers.push(
          `FEED_MISSING_EXTENSION_TIMETABLES: Stations ${catalogueReconciliation.unmatchedExtensionStations.map(s => s.code).join(', ')} lack commercial schedules in this snapshot`
        );
      }
    } catch {
      // pass
    }
  }

  // 4. File inventory with SHA-256 and byte sizes
  const fileInventory = {};
  for (const fileName of parsedFeed.foundFiles) {
    const filePath = path.join(sourceDir, fileName);
    if (fs.existsSync(filePath)) {
      const buf = fs.readFileSync(filePath);
      fileInventory[fileName] = {
        bytes: buf.length,
        sha256: crypto.createHash('sha256').update(buf).digest('hex')
      };
    }
  }

  // 5. Build 4-dimension temporal and legal provenance
  const agencyName = options.operator || (mode === 'chennai_metro' ? 'Chennai Metro Rail Limited' : (mode === 'suburban_rail' ? 'Southern Railway' : 'operator'));
  const timetableDataLicense = options.licensing?.timetableSchedules ||
    (options.license === 'Government Open Data' ? 'PERMITTED_OPEN_DATA' : (options.licensing ? 'UNCONFIRMED' : options.license || 'UNCONFIRMED'));

  if (timetableDataLicense === 'UNCONFIRMED') {
    validation.feedLevelBlockers.push(
      `FEED_UNCONFIRMED_DATA_LICENSE: Underlying ${agencyName} timetable data redistribution rights are UNCONFIRMED`
    );
  }

  if (Array.isArray(options.additionalBlockers)) {
    for (const b of options.additionalBlockers) {
      if (!validation.feedLevelBlockers.includes(b)) {
        validation.feedLevelBlockers.push(b);
      }
    }
  }

  const provenance = {
    mode,
    sourceUrl: options.sourceUrl || 'unspecified_source_url',
    sourceCommit: options.sourceCommit || null,
    sourceRelease: options.sourceRelease || null,
    publisher: options.publisher || 'unspecified_publisher',
    license: options.license || timetableDataLicense,
    retrievalDate: options.retrievalDate || new Date().toISOString().slice(0, 10),
    feedPublicationDate: options.feedPublicationDate || null,
    timetableValidityRange: options.timetableValidityRange || {
      feedStartDate: parsedFeed.tables.feed_info?.rows[0]?.feed_start_date || 'unknown',
      feedEndDate: parsedFeed.tables.feed_info?.rows[0]?.feed_end_date || 'unknown',
      calendarStartDate: validation.stats.serviceDates?.calendarMinStart || null,
      calendarEndDate: validation.stats.serviceDates?.calendarMaxEnd || null,
      minServiceDate: validation.stats.serviceDates?.minServiceDate || null,
      maxServiceDate: validation.stats.serviceDates?.maxServiceDate || null,
      status: (validation.stats.distantCalendarServicesCount || 0) > 0 ? 'SUSPICIOUS_FAR_FUTURE_PLACEHOLDER' : (validation.calendarStatus === 'EXPIRED' ? 'EXPIRED' : 'STANDARD')
    },
    verifiedOperationalCurrency: options.verifiedOperationalCurrency || 'UNVERIFIED_HISTORICAL',
    licensing: {
      compilationPipeline: options.licensing?.compilationPipeline || options.license || 'UNCONFIRMED',
      timetableSchedules: timetableDataLicense,
      publisher: options.publisher || 'unspecified_publisher',
      legalAttribution: options.licensing?.legalAttribution ||
        (mode === 'chennai_metro'
          ? 'Public passenger metro operational timetable published by Chennai Metro Rail Limited; redistribution rights unconfirmed'
          : 'Public passenger railway operational timetable sheets published by Ministry of Railways; redistribution rights unconfirmed')
    },
    ingestedAt: new Date().toISOString()
  };

  // 6. Build manifest
  const hasQualityWarnings = validation.warnings.length > 0;
  let status = 'VALIDATION_FAILED';
  if (validation.calendarStatus === 'EXPIRED') {
    status = 'EXPIRED_CALENDAR';
  } else if (validation.valid) {
    status = hasQualityWarnings ? 'VALIDATED_WITH_WARNINGS' : 'VALIDATED';
  }

  const isReadyForRouting = validation.valid && validation.calendarStatus === 'ACTIVE' && validation.feedLevelBlockers.length === 0;

  const manifest = {
    manifestVersion: '1.1.0',
    mode,
    provenance,
    status,
    readyForJourneyRouting: isReadyForRouting,
    calendarStatus: validation.calendarStatus,
    fileInventory,
    filesFound: parsedFeed.foundFiles,
    recordCounts: validation.stats.recordCounts,
    qualityClassification: {
      sourceValidTripsCount: validation.stats.sourceValidTripsCount,
      quarantinedTripsCount: validation.stats.quarantinedTripsCount,
      quarantinedTrips: validation.quarantinedTrips
    },
    feedLevelBlockers: validation.feedLevelBlockers,
    catalogueReconciliation,
    rejectionsCount: validation.stats.rejectedCount,
    duplicateCount: validation.stats.duplicateCount,
    brokenReferencesCount: validation.stats.brokenReferencesCount,
    anomalies: {
      timeInversionsCount: validation.stats.timeInversionCount || 0,
      timeRegressionsCount: validation.stats.timeRegressionCount || 0,
      singleStopTripsCount: validation.stats.singleStopTripsCount || 0,
      distantCalendarServicesCount: validation.stats.distantCalendarServicesCount || 0
    },
    errors: validation.errors,
    warnings: validation.warnings,
    sampleRejectedRecords: validation.rejectedRecords.slice(0, 20)
  };

  // 7. Write manifest to target directory if requested
  if (options.outputDir) {
    fs.mkdirSync(options.outputDir, { recursive: true });
    const manifestPath = path.join(options.outputDir, 'ingestion_manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  }

  return {
    success: validation.valid,
    mode,
    provenance,
    validation,
    manifest
  };
}
