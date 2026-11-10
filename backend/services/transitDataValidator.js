import fs from 'fs';
import path from 'path';

/**
 * AccessRoute Transit Data Foundation Validator
 * Validates integrity, coordinate bounds, schemas, and provenance across
 * the four isolated transit categories: CMRL, Suburban Rail, MTC Bus, and Express Rail.
 */

export function validateCoordinateBounds(lat, lon, bounds = { minLatitude: 12.50, maxLatitude: 13.50, minLongitude: 79.50, maxLongitude: 80.40 }) {
  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return { valid: false, error: `Invalid coordinate types: lat=${typeof lat}, lon=${typeof lon}` };
  }
  if (lat < bounds.minLatitude || lat > bounds.maxLatitude) {
    return { valid: false, error: `Latitude ${lat} is outside bounds [${bounds.minLatitude}, ${bounds.maxLatitude}]` };
  }
  if (lon < bounds.minLongitude || lon > bounds.maxLongitude) {
    return { valid: false, error: `Longitude ${lon} is outside bounds [${bounds.minLongitude}, ${bounds.maxLongitude}]` };
  }
  return { valid: true };
}

export function validateProvenance(provenance, expectedCategory) {
  const errors = [];
  const requiredFields = [
    'datasetName',
    'category',
    'operator',
    'verificationStatus',
    'openDataSources',
    'licenseAndAttribution',
    'limitationsAndCaveats'
  ];

  for (const field of requiredFields) {
    if (!provenance[field]) {
      errors.push(`Missing required provenance field: ${field}`);
    }
  }

  if (provenance.category !== expectedCategory) {
    errors.push(`Provenance category mismatch: expected "${expectedCategory}", got "${provenance.category}"`);
  }

  if (!Array.isArray(provenance.openDataSources) || provenance.openDataSources.length === 0) {
    errors.push('Provenance must contain at least one verified openDataSource entry');
  }

  if (!Array.isArray(provenance.limitationsAndCaveats) || provenance.limitationsAndCaveats.length === 0) {
    errors.push('Provenance must document known dataset limitations and caveats');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function validateTransitData(baseDataDir = path.resolve(process.cwd(), 'data')) {
  const report = {
    valid: true,
    categoriesValidated: 0,
    totalNodesValidated: 0,
    errors: [],
    details: {}
  };

  const coveragePath = path.join(baseDataDir, 'coverage', 'network_scope.json');
  if (!fs.existsSync(coveragePath)) {
    report.valid = false;
    report.errors.push(`Network scope definition missing at: ${coveragePath}`);
    return report;
  }

  const networkScope = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
  const bounds = networkScope.spatialBounds;

  // 1. Chennai Metro (CMRL)
  try {
    const cmrlDir = path.join(baseDataDir, 'chennai_metro');
    const stationsData = JSON.parse(fs.readFileSync(path.join(cmrlDir, 'verified_stations.json'), 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(path.join(cmrlDir, 'provenance.json'), 'utf8'));

    const provCheck = validateProvenance(provenance, 'chennai_metro');
    if (!provCheck.valid) {
      report.valid = false;
      report.errors.push(...provCheck.errors.map(e => `[CMRL Provenance] ${e}`));
    }

    if (!Array.isArray(stationsData.stations) || stationsData.stations.length !== 41) {
      report.valid = false;
      report.errors.push(`[CMRL] Expected 41 operational stations, got ${stationsData.stations?.length || 0}`);
    }

    let cmrlNodes = 0;
    for (const station of stationsData.stations) {
      cmrlNodes++;
      const coordCheck = validateCoordinateBounds(station.latitude, station.longitude, bounds);
      if (!coordCheck.valid) {
        report.valid = false;
        report.errors.push(`[CMRL Station: ${station.name}] ${coordCheck.error}`);
      }
      if (!station.lines || station.lines.length === 0) {
        report.valid = false;
        report.errors.push(`[CMRL Station: ${station.name}] Must belong to at least one metro line`);
      }
      if (typeof station.stepFreeAccess !== 'boolean') {
        report.valid = false;
        report.errors.push(`[CMRL Station: ${station.name}] Missing stepFreeAccess boolean`);
      }
      if (station.evidenceStatus && !['source_verified', 'cross_checked', 'manually_curated', 'unverified', 'planned_not_operational'].includes(station.evidenceStatus)) {
        report.valid = false;
        report.errors.push(`[CMRL Station: ${station.name}] Invalid evidenceStatus: ${station.evidenceStatus}`);
      }
    }

    report.categoriesValidated++;
    report.totalNodesValidated += cmrlNodes;
    report.details.chennai_metro = {
      operator: stationsData.operator.name,
      totalStations: cmrlNodes,
      lines: stationsData.lines.map(l => l.name)
    };
  } catch (err) {
    report.valid = false;
    report.errors.push(`[CMRL Validation Failed] ${err.message}`);
  }

  // 2. Suburban Rail & MRTS
  try {
    const srrDir = path.join(baseDataDir, 'suburban_rail');
    const stationsData = JSON.parse(fs.readFileSync(path.join(srrDir, 'verified_stations.json'), 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(path.join(srrDir, 'provenance.json'), 'utf8'));

    const provCheck = validateProvenance(provenance, 'suburban_rail');
    if (!provCheck.valid) {
      report.valid = false;
      report.errors.push(...provCheck.errors.map(e => `[Suburban Rail Provenance] ${e}`));
    }

    let srrNodes = 0;
    const allowedDistricts = ['Chennai', 'Chengalpattu', 'Kanchipuram', 'Tiruvallur'];

    for (const station of stationsData.stations) {
      srrNodes++;
      const coordCheck = validateCoordinateBounds(station.latitude, station.longitude, bounds);
      if (!coordCheck.valid) {
        report.valid = false;
        report.errors.push(`[Suburban Rail Station: ${station.name}] ${coordCheck.error}`);
      }
      if (!allowedDistricts.includes(station.district)) {
        report.valid = false;
        report.errors.push(`[Suburban Rail Station: ${station.name}] District ${station.district} is not in covered scope`);
      }
      if (!station.corridors || station.corridors.length === 0) {
        report.valid = false;
        report.errors.push(`[Suburban Rail Station: ${station.name}] Station must be associated with at least one corridor`);
      }
      if (station.evidenceStatus && !['source_verified', 'cross_checked', 'manually_curated', 'unverified', 'planned_not_operational'].includes(station.evidenceStatus)) {
        report.valid = false;
        report.errors.push(`[Suburban Rail Station: ${station.name}] Invalid evidenceStatus: ${station.evidenceStatus}`);
      }
    }

    report.categoriesValidated++;
    report.totalNodesValidated += srrNodes;
    report.details.suburban_rail = {
      operator: stationsData.operator.name,
      division: stationsData.operator.division,
      totalStations: srrNodes,
      corridors: stationsData.corridors.map(c => c.name)
    };
  } catch (err) {
    report.valid = false;
    report.errors.push(`[Suburban Rail Validation Failed] ${err.message}`);
  }

  // 3. MTC Bus
  try {
    const mtcDir = path.join(baseDataDir, 'mtc_bus');
    const hubsData = JSON.parse(fs.readFileSync(path.join(mtcDir, 'verified_hubs.json'), 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(path.join(mtcDir, 'provenance.json'), 'utf8'));

    const provCheck = validateProvenance(provenance, 'mtc_bus');
    if (!provCheck.valid) {
      report.valid = false;
      report.errors.push(...provCheck.errors.map(e => `[MTC Provenance] ${e}`));
    }

    let mtcNodes = 0;
    const allowedDistricts = ['Chennai', 'Chengalpattu', 'Kanchipuram', 'Tiruvallur'];

    for (const hub of hubsData.interchangeHubs) {
      mtcNodes++;
      const coordCheck = validateCoordinateBounds(hub.latitude, hub.longitude, bounds);
      if (!coordCheck.valid) {
        report.valid = false;
        report.errors.push(`[MTC Hub: ${hub.name}] ${coordCheck.error}`);
      }
      if (!allowedDistricts.includes(hub.district)) {
        report.valid = false;
        report.errors.push(`[MTC Hub: ${hub.name}] District ${hub.district} is not in covered scope`);
      }
      if (!hub.corridorRole) {
        report.valid = false;
        report.errors.push(`[MTC Hub: ${hub.name}] Missing corridorRole description`);
      }
      if (hub.evidenceStatus && !['source_verified', 'cross_checked', 'manually_curated', 'unverified', 'planned_not_operational'].includes(hub.evidenceStatus)) {
        report.valid = false;
        report.errors.push(`[MTC Hub: ${hub.name}] Invalid evidenceStatus: ${hub.evidenceStatus}`);
      }
    }

    report.categoriesValidated++;
    report.totalNodesValidated += mtcNodes;
    report.details.mtc_bus = {
      operator: hubsData.operator.name,
      totalHubs: mtcNodes,
      fareCategories: hubsData.fareCategories.map(f => f.name)
    };
  } catch (err) {
    report.valid = false;
    report.errors.push(`[MTC Bus Validation Failed] ${err.message}`);
  }

  // 4. Relevant Express Rail
  try {
    const expDir = path.join(baseDataDir, 'express_rail');
    const expressData = JSON.parse(fs.readFileSync(path.join(expDir, 'verified_express_stops.json'), 'utf8'));
    const provenance = JSON.parse(fs.readFileSync(path.join(expDir, 'provenance.json'), 'utf8'));

    const provCheck = validateProvenance(provenance, 'express_rail');
    if (!provCheck.valid) {
      report.valid = false;
      report.errors.push(...provCheck.errors.map(e => `[Express Rail Provenance] ${e}`));
    }

    if (!expressData.commuterUtilityRules?.strictIsolationFromSuburbanEMU) {
      report.valid = false;
      report.errors.push('[Express Rail] strictIsolationFromSuburbanEMU rule must be true');
    }

    let expNodes = 0;
    for (const stop of expressData.chennaiBeltStations) {
      expNodes++;
      const coordCheck = validateCoordinateBounds(stop.latitude, stop.longitude, bounds);
      if (!coordCheck.valid) {
        report.valid = false;
        report.errors.push(`[Express Stop: ${stop.name}] ${coordCheck.error}`);
      }
      if (!['major_terminal', 'intermediate_commercial_stop', 'peri_urban_junction'].includes(stop.terminalType)) {
        report.valid = false;
        report.errors.push(`[Express Stop: ${stop.name}] Invalid terminalType: ${stop.terminalType}`);
      }
      if (stop.evidenceStatus && !['source_verified', 'cross_checked', 'manually_curated', 'unverified', 'planned_not_operational'].includes(stop.evidenceStatus)) {
        report.valid = false;
        report.errors.push(`[Express Stop: ${stop.name}] Invalid evidenceStatus: ${stop.evidenceStatus}`);
      }
    }

    report.categoriesValidated++;
    report.totalNodesValidated += expNodes;
    report.details.express_rail = {
      trainTypes: expressData.trainTypes.map(t => t.name),
      totalStopsInBelt: expNodes,
      isolationEnforced: expressData.commuterUtilityRules.strictIsolationFromSuburbanEMU
    };
  } catch (err) {
    report.valid = false;
    report.errors.push(`[Express Rail Validation Failed] ${err.message}`);
  }

  return report;
}
