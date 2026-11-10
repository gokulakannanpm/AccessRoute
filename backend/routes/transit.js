import { Router } from 'express';
import { transitExplorerService } from '../services/transitExplorerService.js';

const router = Router();

/**
 * GET /api/transit/stations
 * Query parameters:
 *  - q: search term (name, code, tamilName, corridor)
 *  - mode: comma-separated modes (chennai_metro, suburban_rail, mtc_bus, express_rail)
 *  - corridor: specific corridor ID
 *  - stepFreeOnly: boolean
 */
router.get('/stations', (req, res) => {
  try {
    const { q, mode, corridor, stepFreeOnly } = req.query;
    const stations = transitExplorerService.getAllStations({
      q,
      mode,
      corridor,
      stepFreeOnly: stepFreeOnly === 'true' || stepFreeOnly === '1'
    });
    return res.status(200).json({
      count: stations.length,
      stations
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/transit/corridors
 * Returns all 6 verified transit corridors with sequential station codes and coordinates
 */
router.get('/corridors', (req, res) => {
  try {
    const corridors = transitExplorerService.getCorridors();
    return res.status(200).json({
      count: corridors.length,
      corridors
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/transit/network
 * Returns full network summary, station counts, and mode breakdown
 */
router.get('/network', (req, res) => {
  try {
    const network = transitExplorerService.getNetwork();
    return res.status(200).json(network);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/transit/stations/:id
 * Returns a single station/hub by ID or station code with accessibility and status
 */
router.get('/stations/:id', (req, res) => {
  try {
    const { id } = req.params;
    const station = transitExplorerService.getStationByIdOrCode(id);
    if (!station) {
      return res.status(404).json({ error: `Station "${id}" not found in curated catalogue.` });
    }
    const accessibility = transitExplorerService.getStationAccessibility(id);
    return res.status(200).json({
      ...station,
      accessibility: accessibility?.accessibility || null
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
