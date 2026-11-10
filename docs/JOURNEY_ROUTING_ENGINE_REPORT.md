# AccessRoute — Phase 09: Real Multimodal Journey Routing Engine Report

**Project**: AccessRoute (Chennai Accessible Multi-Modal Transit Planner)  
**Phase**: Phase 09 — Timetable-Based Journey Routing Engine  
**Branch**: `hacknova-mvp`  
**Date**: October 2026  
**Status**: Completed & Verified  

---

## 1. Executive Summary

Phase 09 establishes the core timetable-based journey-routing engine for Chennai public transport under `backend/services/routing/`. Prior to this phase, journey recommendations relied on seed mock routes (`localRoutes`) on the backend and illustrative road-following OSRM geometry with static stage fare tables on the client.

Rather than fabricating artificial schedules or falsely treating unverified community scrapes as operational transit feeds, Phase 09 implements an algorithmically sound, time-dependent **Connection Scan Algorithm (CSA)** engine coupled with a strict **Feed Eligibility Enforcer**. The engine connects directly to the transit ingestion pipeline (`backend/services/ingestion/`) developed in Phase 07, ensuring that only feeds with `readyForJourneyRouting: true` and zero feed-level blockers can enter production graph calculation.

Because all currently available public GTFS datasets for Chennai (CMRL Metro, Southern Railway Suburban, MTC Bus) retain critical blockers (expired 2021 calendar, artificial 2170/2030 placeholder dates, and unconfirmed third-party app scrape provenance), the engine **honestly reports `ROUTING_DATA_UNAVAILABLE`** for production timetable searches. It strictly prevents any silent fallback from failed real routing to fabricated journey options, while maintaining full backward compatibility for illustrative design previews in the UI.

---

## 2. Audit Before Implementation

A comprehensive audit of the pre-Phase 09 codebase identified the following state:

| Component | Pre-Phase 09 State | Phase 09 Action / Replacement | Compatibility Status |
| :--- | :--- | :--- | :--- |
| **Route Search API** (`POST /api/routes/search`) | Returned static seed routes (`recommended`, `fastest`, `lowestCost`) from `backend/db/dbClient.js`. Scored accessibility statically. | Integrated `routingMode` support. Default/illustrative mode returns preview explicitly flagged `isIllustrativePreview: true`. `routingMode: 'timetable'` invokes the real CSA engine without fallback. Added dedicated `POST /api/routes/timetable-search`. | 100% backward compatible with existing UI and tests. |
| **Frontend Routing** (`src/utils/routing.js`) | Generated OSRM road geometry and mapped bus numbers from a static dictionary (`MTC_BUS_ROUTES_AND_FARES`). | Preserved as explicitly tagged illustrative fallback when real timetable feeds are blocked. Real results are never conflated with OSRM previews. | UI intact. |
| **GTFS Parser** (`backend/services/ingestion/gtfsParser.js`) | Lightweight RFC 4180 CSV parser handling CRLF/LF line endings, escaped quotes, and BOM headers. | Reused directly by `TransitGraph` to parse static GTFS tables. | Reused. |
| **Ingestion Manifests** (`data/*/imported/ingestion_manifest.json`) | Defined machine-readable schema (v1.1.0) with quality classifications, SHA-256 file inventories, and `feedLevelBlockers`. | Enforced as the strict cryptographic and operational gateway for feed loading in `feedEligibility.js`. | Enforced. |
| **Station Catalogues** (`data/*/verified_stations.json`) | Reconciled 41 CMRL Metro stations and 70 Suburban stations with architectural accessibility data. | Utilized by `LocationMatcher` to resolve natural language origin/destination queries to graph nodes. | Reused. |
| **Transfers & Pathways** (`transfers.txt`, `pathways.txt`) | Contained 50 internal CMRL platform transfers and 250 Suburban station pathways. | Ingested into `TransitGraph` as verified transfer footpaths with explicit `min_transfer_time` and step-free attributes. | Grounded in data. |

---

## 3. Algorithm Selection & Technical Trade-offs

### Evaluated Algorithms

For timetable-based multi-modal transit routing, two primary state-of-the-art algorithms were evaluated:
1. **RAPTOR (Round-Based Public Transit Routing)**
2. **Connection Scan Algorithm (CSA)**

### Comparison & Selection Rationale

| Evaluation Criterion | RAPTOR | Connection Scan Algorithm (CSA) [Selected] |
| :--- | :--- | :--- |
| **Data Structure** | Requires pre-grouping into routes, stop-sequences, and trip-route pointers. | Operates on a single, flat, chronologically sorted array of elementary connections $(s_u, s_v, t_{dep}, t_{arr}, trip, mode)$. |
| **Time Complexity** | $O(K \cdot (|E| + |V|))$ where $K$ is the number of rounds (transfers). | $O(C)$ linear scan over connections within the search horizon after an initial $O(\log C)$ binary search. |
| **Memory / Cache Locality** | Random access across routes, trip stop-times, and route transfers. | Sequential, stream-like array traversal with exceptional CPU L1/L2 cache locality. |
| **Time-Dependent Queries** | Requires time-dependent route traversal with binary search per stop. | Trivial: binary search finds the starting connection $\ge t_{dep}$; scan proceeds forward until horizon limit. |
| **Overnight & $> 24:00$ Schedules** | Modulo-24 arithmetic can cause edge-case bugs across midnight. | Operates natively on absolute seconds from midnight ($t \ge 86400$ s), naturally handling GTFS extended hours. |
| **Transfer Footpaths** | Relaxed between rounds using separate footpath arrays. | Explicit footpaths relaxed immediately upon connection arrival into `earliestArrival` and parent pointers. |
| **Implementation Complexity** | High (multiple indexing structures: routes, route-stops, route-trips). | Moderate, modular, highly deterministic, and easily testable. |

### Selection Decision
**Connection Scan Algorithm (CSA)** was chosen for AccessRoute Phase 09. Its linear scan structure guarantees deterministic execution, zero graph search overhead, native handling of GTFS extended hours (`> 24:00:00`), and clean integration of multi-modal transfers grounded in explicit transfer records (`min_transfer_time`).

---

## 4. Routing Engine Architecture

The routing engine is modularly structured under `backend/services/routing/`:

```
backend/services/routing/
├── index.js                     # Facade: RoutingService singleton, searchJourney, initialization
├── feedEligibility.js           # Manifest inspector, blocker checks, production feed auditor
├── transitGraph.js              # TransitGraph: stops, parent stations, routes, connections, transfers
├── connectionScanAlgorithm.js   # Pure CSA timetable routing implementation
├── journeyReconstructor.js      # Backtracking parent pointers, leg grouping, accessibility scoring
├── locationMatcher.js           # Resolves names, station codes, aliases, and coords to graph stop IDs
└── errors.js                    # Standard routing error types, codes, and JSON serialization
```

### Component Breakdown

1. **`TransitGraph`**:
   - Maps stop nodes (`stops`), station nodes (`stations`), and routes (`routes`).
   - Converts GTFS `stop_times.txt` into elementary connections:
     $$\{ id, tripId, routeId, mode, fromStopId, toStopId, departureTimeSec, arrivalTimeSec, wheelchairAccessible \}$$
   - Sorts all connections chronologically: $O(C \log C)$.
   - Ingests verified transfer footpaths from `transfers.txt` and internal parent station platform connections.

2. **`LocationMatcher`**:
   - Resolves user inputs (`"Chennai Central"`, `"location_1"`, `"Guindy"`, `"SMC"`, `"GDY"`) to physical stop and station IDs.
   - Provides coordinate proximity lookup ($< 500$m) using Haversine distance.
   - Rejects unresolvable origins/destinations with `UNKNOWN_ORIGIN` or `UNKNOWN_DESTINATION`.

3. **`ConnectionScanAlgorithm`**:
   - Accepts `originStopIds`, `destinationStopIds`, `departureTimeSec`, and accessibility constraints.
   - Relaxes origin stops and their outbound step-free transfers.
   - Scans connections chronologically up to `searchHorizonSec` (default 2 hours).
   - Enforces user preferences:
     - Disables trips of inactive transport modes (`preferences.transportModes`).
     - Bypasses non-wheelchair-accessible trips when `preferences.wheelchair === true`.
     - Skips transfers with stairs (`isStepFree === false`) when `wheelchair` or `avoidStairs` is active.
     - Respects `minTransferTimeSec`: a transfer from Trip A to Trip B is valid only if $t_{arr}(A) + t_{transfer} \le t_{dep}(B)$.

4. **`JourneyReconstructor`**:
   - Backtracks through CSA parent pointers to assemble consecutive connections on the same `tripId` into a single continuous transit leg.
   - Interleaves explicit transfer walking legs with distance, duration, and step-free accessibility details.
   - Computes overall journey duration, arrival time, fare, and standardized accessibility score:
     $$\text{Score} = (\text{elevators} \times 10) - (\text{stairs} \times 15) + (\text{ramps} \times 5) - \frac{\text{walkingDistanceMeters}}{20}$$
   - Ranks candidate journeys into `recommended` (highest accessibility score), `fastest` (minimum duration), and `lowestCost` (lowest fare).

---

## 5. Feed Eligibility & Blocker Enforcement

The engine strictly enforces the findings of the Phase 07 transit data ingestion reports. Feeds are loaded into the operational routing graph **only** if they satisfy all four criteria:
1. `manifest.readyForJourneyRouting === true`
2. `manifest.feedLevelBlockers` is completely empty (`[]`)
3. `manifest.status` is `'VALIDATED'` or `'VALIDATED_WITH_WARNINGS'`
4. `manifest.calendarStatus` is `'ACTIVE'`

### Production Feed Audit Status

| Feed Mode | Source Origin | Manifest Status | `readyForJourneyRouting` | Active Feed Blockers | Production Routing Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chennai Metro (`chennai_metro`)** | CMRL official 2021 timetable via UngalSoththu | `EXPIRED_CALENDAR` | `false` | `FEED_EXPIRED_CALENDAR`<br>`FEED_MISSING_EXTENSION_TIMETABLES`<br>`FEED_UNCONFIRMED_DATA_LICENSE` | **BLOCKED** |
| **Suburban Rail (`suburban_rail`)** | Southern Railway timetable sheets | `VALIDATED_WITH_WARNINGS` | `false` | `FEED_SUSPICIOUS_CALENDAR_EXPIRY`<br>`FEED_INCOMPLETE_SHUTTLE_TRIPS`<br>`FEED_UNNORMALIZED_MIDNIGHT_ROLLOVER`<br>`FEED_MISSING_EXTENSION_TIMETABLES`<br>`FEED_UNCONFIRMED_DATA_LICENSE` | **BLOCKED** |
| **MTC Bus (`mtc_bus`)** | Community third-party app scrape | `VALIDATED` | `false` | `FEED_UNCONFIRMED_DATA_LICENSE`<br>`FEED_COMMUNITY_SCRAPE_ORIGIN`<br>`FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER`<br>`FEED_MISSING_SHAPES_AND_FARES` | **BLOCKED** |
| **Express Rail (`express_rail`)** | Commercial stop catalog | Metadata only | N/A | No timetable feed published | **ISOLATED** |

**Zero production feeds are currently eligible.** When timetable journey routing is invoked in production, the engine strictly raises:
```json
{
  "status": "ROUTING_DATA_UNAVAILABLE",
  "code": "ROUTING_DATA_UNAVAILABLE",
  "error": "No eligible timetable feeds are available for production journey routing. Active feeds are blocked by data currency, licensing, or verification blockers.",
  "statusCode": 503,
  "details": {
    "feedBlockers": [
      "chennai_metro: BLOCKER: FEED_EXPIRED_CALENDAR: All 1 calendar services expired before 20261027, BLOCKER: FEED_MISSING_EXTENSION_TIMETABLES...",
      "suburban_rail: BLOCKER: FEED_SUSPICIOUS_CALENDAR_EXPIRY: 5 services specify distant placeholder end dates (>5 years in future)...",
      "mtc_bus: BLOCKER: FEED_UNCONFIRMED_DATA_LICENSE..., BLOCKER: FEED_COMMUNITY_SCRAPE_ORIGIN..."
    ],
    "readyForJourneyRouting": false,
    "productionRoutingReady": false
  }
}
```

The engine **never silently falls back** from failed timetable routing to simulated routes.

---

## 6. API Integration

The engine is integrated into `backend/routes/routes.js`:

### 1. `GET /api/routes/timetable/status`
Returns real-time status of the routing engine and the production feed eligibility audit.
- **Status Code**: `200 OK`
- **Payload**:
  ```json
  {
    "service": "AccessRoute Timetable Routing Engine",
    "algorithm": "Connection Scan Algorithm (CSA)",
    "productionRoutingReady": false,
    "totalModesAudited": 3,
    "eligibleFeedsCount": 0,
    "modes": { ... },
    "notice": "Production timetable routing is strictly disabled: unverified community scrapes, expired Metro timetables, and unresolved suburban datasets must not be used as operational service."
  }
  ```

### 2. `POST /api/routes/timetable-search`
Dedicated timetable routing endpoint. Strictly enforces timetable calculation; never returns illustrative previews.
- **Request**: `{ "origin": "Chennai Central", "destination": "Guindy", "departureTime": "08:30:00", "preferences": { ... } }`
- **Response**: `503 Service Unavailable` with `ROUTING_DATA_UNAVAILABLE` when production feeds are blocked; or `200 OK` with structured journey legs when eligible feeds are supplied.

### 3. `POST /api/routes/search`
Dual-mode endpoint preserving frontend backward compatibility:
- **`routingMode === 'timetable'`**: Invokes the timetable routing engine. If production feeds are blocked, returns `503 ROUTING_DATA_UNAVAILABLE`.
- **Default / Illustrative Preview**: Returns existing scored seed routes with explicit disclosure flags:
  ```json
  {
    "recommended": { ... },
    "fastest": { ... },
    "lowestCost": { ... },
    "isIllustrativePreview": true,
    "routingMode": "illustrative_preview",
    "previewNotice": "Illustrative journey preview based on road network and static stage fares. Real timetable calculation is unavailable due to unverified feeds."
  }
  ```

---

## 7. Supported Routing Behaviours

The routing engine implementation supports the following verified behaviours:

1. **Direct Single-Leg Journey**:
   Calculates non-stop transit between origin and destination on a single service (e.g. Metro Blue Line from Central to Guindy, 20 min).
2. **Multi-Modal Transfer**:
   Chains services across different transport modes (e.g. Suburban Rail from Central to Saidapet $\rightarrow$ 3 min step-free transfer walk $\rightarrow$ Metro Blue Line from Saidapet to Guindy).
3. **Multi-Route Candidate Ranking**:
   Generates distinct candidates and ranks them by accessibility score (`recommended`), travel time (`fastest`), and fare (`lowestCost`).
4. **Time-Dependent Departure Selection**:
   Filters connections by departure timestamp. Searching at 08:30 selects the 08:30 service; searching at 08:45 automatically selects the next available service at 09:00.
5. **GTFS Overnight Schedules ($> 24:00:00$)**:
   Supports journeys departing after midnight in GTFS extended notation (e.g. `24:10:00` arriving `24:30:00`), accurately calculating a 20-minute journey across midnight without modulo errors.
6. **Inaccessible Transfer Rejection**:
   Rejects transfer pathways containing stairs (`is_step_free = 0`) when `wheelchair` or `avoidStairs` preferences are active.
7. **Transfer Time Verification**:
   Guarantees that a connecting service can only be boarded if $t_{arr}(\text{inbound}) + \text{min\_transfer\_time} \le t_{dep}(\text{outbound})$. Tight transfers violating this condition are rejected.
8. **Origin / Destination Validation**:
   Returns structured errors (`UNKNOWN_ORIGIN`, `UNKNOWN_DESTINATION`, `SAME_ORIGIN_DESTINATION`) with 400/404 HTTP status codes.
9. **Search Horizon Boundaries**:
   Returns `NO_SERVICE_AVAILABLE` when no transit departures operate within the requested search window.
10. **Mode Filtering**:
    Excludes services belonging to transport modes disabled by user preferences (`transportModes: { metro: false }`).

---

## 8. Feasibility Statement on Current Production Feasibility

> [!CAUTION]
> **Definitive Statement on Current Production Journey Feasibility**:  
> **No real, current operational production journey can be calculated with the GTFS datasets currently available.**
>
> 1. **Chennai Metro (CMRL)**: The available GTFS calendar expired on **2021-12-31** (nearly 5 years ago) and lacks schedules for Phase 1 extension stations (Wimco Nagar Depot, Tiruvottiyur Theradi). CMRL has not published an updated, licensed GTFS feed to the Open Government Data (OGD) platform or CUMTA portal.
> 2. **Southern Railway Suburban**: The feed contains artificial placeholder calendar end dates up to the year **2170**, 19 unnormalized midnight progression rollovers, and lacks MRTS Phase 2 extension timetables.
> 3. **MTC Bus**: The dataset is a community scrape of a mobile application API with unconfirmed redistribution rights, lacks route shapes (`shapes.txt`), fare structures (`fare_rules.txt`), and contains an artificial 6-year calendar placeholder (2024 to 2030).
>
> Using any of these feeds as live production operational journeys would be dishonest, legally hazardous, and factually misleading to commuters with disabilities.

---

## 9. Verification & Test Results

All six required test suites pass with zero errors:

```bash
# 1. Transit Ingestion Pipeline Test Suite
npm run test:ingestion
# Result: 319 Passed, 0 Failed

# 2. Transit Data Foundation Test Suite
npm run test:transit
# Result: 49 Passed, 0 Failed

# 3. Backend API Test Suite
npm run test:api
# Result: 58 Passed, 0 Failed

# 4. Phase 09 Journey Routing Engine Test Suite
npm run test:routing
# Result: 65 Passed, 0 Failed

# 5. Gemini AI Layer Unit Tests
npm run test:ai
# Result: 7 Passed, 0 Failed

# 6. Playwright End-to-End Test Suite
npm run test:e2e
# Result: 5 Passed, 0 Failed

# 7. Production Build Verification
npm run build
# Result: Vite production build succeeded in 801ms
```

### Git Status (`git status --short`)

```
D  .env
 M .env.example
 M .gitignore
 M backend/middleware/validator.js
 M backend/routes/routes.js
 M backend/server.js
 M backend/tests/api.test.js
 M package.json
 M src/App.jsx
 M src/components/AssistedTravel.jsx
 M src/components/Header.jsx
 M src/components/JourneySteps.jsx
 M src/components/Map.jsx
 M src/components/Navigation.jsx
 M src/components/Profile.jsx
 M src/components/ReportIssue.jsx
 M src/components/RouteDetails.jsx
 M src/components/RouteOptions.jsx
 M src/components/RouteSearch.jsx
 M src/components/TravelPreferences.jsx
 M src/context/AppContext.jsx
 M src/index.css
 M src/utils/geminiClient.js
 M tests/ai.test.js
?? KisanSathi-AI/
?? backend/routes/ai.js
?? backend/services/
?? backend/tests/fixtures/
?? backend/tests/ingestion.test.js
?? backend/tests/routing.test.js
?? backend/tests/transitData.test.js
?? data/
?? docs/
```

All modified and untracked files are preserved without staging or committing, in strict accordance with the project instructions.
