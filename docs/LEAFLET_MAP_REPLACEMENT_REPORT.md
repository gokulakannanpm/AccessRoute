# AccessRoute — Leaflet & OpenStreetMap Minimal Map Replacement Report

## Overview
This document records the complete transition of the AccessRoute map rendering system from MapLibre GL JS to **Leaflet 1.9.4** with **OpenStreetMap raster tiles**, adopting the proven implementation pattern from EveHub (`frontend/src/pages/explore/ExploreMapPage.tsx` in `NewStars_Boopathi`).

---

## 1. Selected Map Architecture & Configuration

| Parameter | Specification |
|---|---|
| **Map Rendering Engine** | Leaflet 1.9.4 (`leaflet`) |
| **Tile Provider** | OpenStreetMap Standard Raster Tile Server |
| **Tile URL** | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| **Tile Attribution** | `&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors` |
| **Maximum Zoom** | `19` |
| **Default Map Center** | Chennai City Viewport (`13.0827°N, 80.2707°E`) |
| **Geographic Constraints** | `maxBounds: [[12.35, 79.35], [13.65, 80.55]]` (`maxBoundsViscosity: 0.8`) |
| **API Key / Billing Status** | **100% Free, Zero Billing, Zero API Keys required** |

---

## 2. EveHub Implementation Pattern Reused

The map initialization, tile loading, layering, and cleanup strictly follow the EveHub implementation pattern:
1. **Container Reference & Lifecycle**: Managed via React `useRef(null)` and clean instance teardown in `useEffect` cleanup (`map.remove()`, resetting layers).
2. **Attribution & Controls**:
   - `zoomControl: false` configured on `L.map` to delegate zoom interactions to custom AccessRoute accessible buttons (`map.zoomIn()`, `map.zoomOut()`).
   - Standard OpenStreetMap attribution mounted in default Leaflet attribution control.
   - Tile error resilience: `tileLayer.on('tileerror', ...)` handler attached to track tile loading health.
3. **Layer Management**:
   - `L.layerGroup` for transit station and hub markers (`markersLayerRef`).
   - Dedicated `L.layerGroup` for pedestrian infrastructure markers (`accessMarkersLayerRef`) allowing instant, single-line show/hide toggling without DOM manipulation.
   - `L.polyline` instances for corridor lines, illustrative preview routes, real timetable routes, and geographical routes.
4. **Custom HTML Markers (`L.divIcon`)**:
   - Custom SVG & Tailwind badges encapsulated inside `L.divIcon` with exact pixel dimensions and anchor points.
   - Global `.leaflet-div-icon` override in `src/index.css` removing default gray borders and background rectangles.

---

## 3. Preserved AccessRoute Capabilities

The replacement strictly preserves all existing AccessRoute transit features:
- **140 Curated Transit Locations**: Metro (41), Suburban Rail (70), MTC Bus Hubs (21), and Express Rail (8) markers with transport-mode color coding and step-free access indicators.
- **6 Verified Transit Corridors**: Blue Line, Green Line, South Line, West Line, North Line, and MRTS alignments with real-time mode visibility filtering.
- **7 Pedestrian Infrastructure Types**: Elevators (🛗), Stairs (🪜), Ramps (♿), Footbridges (🌉), Underpasses (🚇), Step-free gates (🚪), and Crossings (🚸) with 3 status confidence rings (verified, provisional, unknown).
- **Geographical Routing (OSRM)**: Cyan casing and dark navy polyline rendering of road/pedestrian geometry with turn-by-turn waypoint nodes.
- **Transit Routing Polylines**: Live rendering of Recommended, Fastest, and Lowest-Cost preview routes with step-free preference filtering and active selection casing.
- **Interactive Station Popup**: Full modal detail card with verified status, platform elevators, ramps, step-free access, timetable isolation alerts, and "Set as Origin" / "Set as Destination" triggers.
- **Accessibility Layer & Voice Guidance**: Quick legend drawer, layer visibility switch, and voice assistance buttons.

---

## 4. Files Changed

| File Path | Description of Changes |
|---|---|
| `src/components/Map.jsx` | Completely replaced MapLibre GL JS engine and CartoDB raster style with Leaflet 1.9.4 and OpenStreetMap raster tiles following the EveHub pattern. Preserved all station markers, corridor layers, pedestrian markers, route polylines, and UI controls. |
| `src/index.css` | Added `.leaflet-div-icon { background: transparent !important; border: none !important; }` to eliminate default Leaflet gray marker boxes. |
| `src/components/RouteOptions.jsx` | Added missing `Compass` icon import from `lucide-react` for geographical route result card rendering. |
| `tests/accessroute.spec.js` | Aligned asynchronous network response wait pattern in Test 16 (`Promise.all` with `/api/geo/route`). |

---

## 5. Verification Results

### A. Production Build Verification
```bash
npm run build
```
- **Vite Build**: PASS (`1819 modules transformed`, `built in 1.08s`)
- **Bundle Footprint**: Production bundle size reduced from 1,679 kB to **880.87 kB** by eliminating MapLibre GL JS WebGL runtime.

### B. Automated Unit & Integration Suites
- `npm run test:transit` → **49 / 49 Passed** (Transit network scope, CMRL, Suburban, MTC, Express)
- `npm run test:explorer` → **58 / 58 Passed** (140 stations, 6 corridors, data provenance audit)
- `npm run test:georouting` → **66 / 66 Passed** (12 routing scenarios, pedestrian infrastructure, boundary enforcement)
- `npm run test:ai` → **7 / 7 Passed** (Gemini AI intent extraction & preference parsing)

### C. Browser End-to-End Test Suite (Playwright)
```bash
npx playwright test
```
- **Result**: **17 Passed, 0 Failed (100% Success)**
  1. Complete demo flow: Chennai Central → Guindy with wheelchair
  2. Mobile view: route options visible on small screen
  3. Desktop view: map and routes side-by-side
  4. Changing preferences updates routes
  5. Voice input extracts preferences
  6. Timetable search on production feeds honestly reports `ROUTING_DATA_UNAVAILABLE`
  7. Switching to Illustrative Preview keeps preview explicitly labelled
  8. Evaluating real timetable CSA search with synthetic fixtures renders verified timetable legs
  9. Selecting identical origin and destination renders clear validation error
  10. Phase 12: Open Transit Network Explorer and verify mode counts
  11. Phase 12: Station discovery search and accessibility details
  12. Phase 12: Corridor alignment and linear station sequence view
  13. Phase 12: Data audit and provenance transparency view
  14. Phase 12: Set station as origin switches seamlessly to Journey Planner
  15. Phase 13: Non-Chennai cities show coverage alert and prevent planning
  16. Phase 13: Geographical Walk route displays road geometry and distance without transit timetable claims
  17. Phase 13: Map Legend displays 7 pedestrian infrastructure types and 3 confidence statuses

---

## 6. Conclusion
The map replacement is complete, fully functional, and verified. AccessRoute now runs on Leaflet 1.9.4 and OpenStreetMap without any paid APIs, API keys, or billing constraints.

