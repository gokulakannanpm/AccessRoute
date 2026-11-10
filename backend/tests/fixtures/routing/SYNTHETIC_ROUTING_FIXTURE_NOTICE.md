# Synthetic GTFS Routing Test Fixtures

**NOTICE**: The fixtures in this directory are purely synthetic, minimal datasets specifically constructed for unit and integration testing of the AccessRoute timetable journey routing engine (`backend/services/routing/`).

- They are **NOT** real operational timetables.
- They must **NEVER** be used as production schedules.
- They cover deterministic routing topologies:
  1. Direct single-leg transit.
  2. Multi-modal transfers with verified interchange footpaths (`min_transfer_time`).
  3. Time-dependent departure dispatching.
  4. Extended overnight schedules (> 24:00:00).
  5. Accessibility barriers (inaccessible transfers with stairs).
  6. Mode disablement.
  7. Blocked feed rejection.
