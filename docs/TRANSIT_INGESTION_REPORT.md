# AccessRoute — Phase 03: Transit Data Acquisition & Ingestion Report

**Document**: `docs/TRANSIT_INGESTION_REPORT.md`  
**Phase**: 03 — Transit Data Acquisition & Ingestion  
**Date**: October 2026  
**Status**: Ingestion Pipeline Foundation Complete  
**Engineers**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 03 establishes a robust, repeatable, and mode-isolated transit data ingestion pipeline for AccessRoute. Following the empirical findings of Phase 02, this phase does **not** implement the journey-routing engine yet. Instead, it solves the technical prerequisites for ingesting and validating authentic transit datasets:

1. **Empirical Source Reachability**: Rechecked live network connectivity for all official operator and open data sources.
2. **Zero-Dependency GTFS Ingestion Pipeline**: Implemented [`gtfsParser.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsParser.js), [`gtfsValidator.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsValidator.js), and [`transitIngestionPipeline.js`](file:///c:/AccessRoute/backend/services/ingestion/transitIngestionPipeline.js).
3. **Comprehensive Automated Test Suite**: Built [`backend/tests/ingestion.test.js`](file:///c:/AccessRoute/backend/tests/ingestion.test.js) with 51 passing assertions testing valid feeds, missing files, broken foreign keys, out-of-bounds coordinates, expired calendars, duplicate IDs, and mode isolation.
4. **Intelligent Ingestion Prioritization**: Analyzed archive sizes, calendar freshness, and timetable granularity across Chennai Metro, Southern Railway Suburban, MTC Buses, and Express Rail.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        AccessRoute Ingestion Architecture                             │
│                                                                                        │
│   Source Archives / Folders                                                            │
│   (Local GTFS zip / dir)                                                               │
│              │                                                                         │
│              ▼                                                                         │
│   [ gtfsParser.js ]           ===> Reads & parses CSVs, handles RFC 4180 quotes & CRLF │
│              │                                                                         │
│              ▼                                                                         │
│   [ gtfsValidator.js ]        ===> Checks columns, bounds, times, foreign keys, dates  │
│              │                                                                         │
│              ▼                                                                         │
│   [ transitIngestionPipeline ]===> Enforces mode isolation & generates manifest        │
│              │                                                                         │
│              ▼                                                                         │
│   ingestion_manifest.json     ===> Immutable record of provenance, rejections & stats  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Source Availability & Live Reachability Audit

We conducted live network connectivity and HTTP response tests against all candidate sources:

| Source URL | Claimed Role | HTTP Status | Verified Reachability & Contents | Ingestion Action |
| :--- | :--- | :--- | :--- | :--- |
| `https://opendata.cumta.org/` | Official CUMTA Open Data Portal | **DNS FAILED** | Host unreachable (`getaddrinfo ENOTFOUND`). DNS record missing or offline. | **Blocked**: Documented as unreachable; do not attempt downloads. |
| `https://test.cumta.org/` | Official CUMTA Staging / Test Portal | **HTTP 200** | Active portal with UX4G styling. Hosts historical transit archives. | **Usable**: Validated as the active CUMTA endpoint. |
| `https://github.com/ungalsoththu/ChennaiGTFS` | Community GTFS Mirror (ODbL / PDDL) | **HTTP 200** | Active GitHub repository hosting mode-separated GTFS tables (`cmrl`, `srr`, `mtc`). | **Usable**: Inspected and verified as primary open feed mirror. |
| `https://chennaimetrorail.org/` | Official Chennai Metro Portal | **HTTP 200** | Active official CMRL portal with station lists, maps, and fare charts. | **Authoritative**: Primary source for operational CMRL stations and lines. |
| `https://sr.indianrailways.gov.in/` | Official Southern Railway Portal | **HTTP 302 ➔ 200** | Active official Indian Railways portal. | **Authoritative**: Source for EMU suburban timetable sheets and station codes. |
| `https://data.opencity.in/` | OpenCity Urban Data Portal | **HTTP 200** | Community civic repository with historical bus shelter geo-data. | **Reference**: Supplementary reference for physical bus stop audits. |

---

## 2. Ingestion Pipeline Design & Implementation

The ingestion pipeline is implemented under [`backend/services/ingestion/`](file:///c:/AccessRoute/backend/services/ingestion/) with zero external npm dependencies, using standard Node.js libraries (`fs`, `path`):

### 2.1 CSV Parser ([`gtfsParser.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsParser.js))
* **RFC 4180 Compliance**: Handles commas inside quoted strings, escaped double quotes (`""`), and backslash escapes (`\"`).
* **Line Ending Normalization**: Seamlessly parses mixed Windows (`\r\n`) and Unix (`\n`) files without memory corruption.
* **BOM Stripping**: Automatically removes Byte Order Mark (`0xFEFF`) from UTF-8 exported files.
* **Directory Scanner**: Automatically discovers and parses standard GTFS text tables (`agency.txt`, `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt`, `calendar.txt`, `calendar_dates.txt`, `fare_attributes.txt`, `fare_rules.txt`, `shapes.txt`, `pathways.txt`, `feed_info.txt`, `transfers.txt`).

### 2.2 Feed Validator ([`gtfsValidator.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsValidator.js))
* **Mandatory File Checks**: Requires `agency.txt`, `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt`, and either `calendar.txt` or `calendar_dates.txt`.
* **Required Column Verification**: Enforces standard GTFS column requirements for each table.
* **Spatial Coordinate Bounds**: Validates that all stop coordinates are numeric floats within the Greater Chennai network bounding box (**12.50°–13.50° N, 79.50°–80.40° E**). Automatically rejects NaNs, swapped lat/longs, and external points (e.g. London).
* **Time Format Validation**: Supports standard `HH:MM:SS` (00:00:00 to 23:59:59) and GTFS post-midnight overnight operational trips (up to `48:00:00`). Rejects invalid minutes (`>59`) or non-numeric strings.
* **Referential Integrity (Foreign Keys)**:
  - Every `route_id` in `trips.txt` must exist in `routes.txt`.
  - Every `service_id` in `trips.txt` must exist in `calendar.txt` or `calendar_dates.txt`.
  - Every `trip_id` in `stop_times.txt` must exist in `trips.txt`.
  - Every `stop_id` in `stop_times.txt` must exist in `stops.txt`.
* **Duplicate Detection**: Flags duplicate `stop_id`, `trip_id`, or `route_id` definitions.
* **Calendar Freshness & Expiry**: Validates `YYYYMMDD` formats and checks whether `end_date < referenceDate`. Flags expired feeds as `EXPIRED_CALENDAR` and marks them `readyForJourneyRouting: false`.

### 2.3 Orchestrator & Isolation ([`transitIngestionPipeline.js`](file:///c:/AccessRoute/backend/services/ingestion/transitIngestionPipeline.js))
* **Mode Whitelist Enforcement**: Requires `mode` parameter to be strictly one of: `['chennai_metro', 'suburban_rail', 'mtc_bus', 'express_rail']`. Prevents accidental cross-mode data pollution.
* **Immutable Ingestion Manifest**: Generates `ingestion_manifest.json` on disk recording source URL, publisher, license, retrieval date, ingested timestamp, validation status, record counts, and rejected record samples.

---

## 3. Prioritized Mode Analysis & Ingestion Strategy

Following the evidence-based prioritization strategy:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Ingestion Priority Order                        │
│                                                                        │
│   Priority 1: Chennai Metro (CMRL)                                     │
│   - Fast geometry ingestion, expired static calendar flagged           │
│   Priority 2: Southern Railway Suburban & MRTS                         │
│   - Highest value: authentic per-train timetables, active 2025 calendar │
│   Priority 3: MTC Buses                                                │
│   - Large archive (45MB); requires selective corridor filtering        │
│   Priority 4: Relevant Express Rail                                    │
│   - Strictly isolated commercial stop schedules                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Priority 1: Chennai Metro Rail (CMRL)
* **Archive Size**: ~680 KB uncompressed (`cmrl-gtfs.zip`: 147 KB).
* **Contents**: 41 stations, 2 lines, 254 platform/pathway nodes, zone-based fares.
* **Validation Finding**: `calendar.txt` expired on `2021-12-31` (`WD,1,1,1,1,1,1,0,20210420,20211231`).
* **Ingestion Action**: The pipeline accepts the station geometry, pathways, and stop coordinates, but flags the calendar as `EXPIRED_CALENDAR`. It is marked `readyForJourneyRouting: false` for static schedules, with clear documentation that runtime headway expansion (4–6 min peak, 8–10 min off-peak) is required.

### Priority 2: Southern Railway Suburban & MRTS
* **Archive Size**: ~700 KB uncompressed (`srr-gtfs.zip`: 154 KB).
* **Contents**:
  - `routes.txt`: 763 suburban EMU services (40xxx South EMU series, 43xxx West EMU series).
  - `stops.txt`: 710 stop and platform nodes with platform numbers (`MSB_P_4`, `MS_P_10`, `GDY_P_2`).
  - `stop_times.txt`: 608 KB of genuine scheduled arrival and departure times.
  - `calendar.txt`: Active service calendar running from **2025-08-06 to 2170-08-20** (`service_1111111`).
* **Freshness & Usability**: **High**. This dataset provides authentic, per-train operational timetable trips with active calendar validity.
* **Ingestion Action**: Prioritized as the **primary real timetable dataset** for AccessRoute.

### Priority 3: MTC Buses (Investigated Full-Feed vs. Selective Ingestion)
* **Archive Size**:
  - `stop_times.txt`: **43,537,866 bytes** (~43.5 MB uncompressed, 1,360,443 rows).
  - `trips.txt`: **1,049,101 bytes** (~1 MB, 47,047 trips).
  - `routes.txt`: **226,405 bytes** (4,611 routes).
  - `stops.txt`: **230,767 bytes** (5,580 stops).
* **Investigation Finding**: Committing a 45 MB uncompressed GTFS table with 1.36 million stop times directly into Git would bloat repository size and slow down CI/CD test runners.
* **Recommended Selection Strategy**:
  Rather than arbitrarily picking routes, implement a corridor-based filter in Phase 04 focusing on:
  1. **GST Road Arterial Corridor**: Routes connecting Broadway / Central ⟷ Guindy ⟷ Tambaram ⟷ Kilambakkam (KCBT) ⟷ Chengalpattu (e.g. 500, 500A, 70V, 18A).
  2. **OMR IT Expressway Corridor**: Routes connecting Thiruvanmiyur ⟷ Sholinganallur ⟷ Siruseri ⟷ Kelambakkam (e.g. 519, 102, 570, 19).
  3. **Poonamallee / Western Corridor**: Routes connecting Broadway / CMBT ⟷ Porur ⟷ Poonamallee ⟷ Sriperumbudur (e.g. 54, 554, 153).
  4. **Inner Ring Road & Central Radial Links**: Routes connecting CMBT ⟷ Guindy ⟷ Velachery ⟷ Adyar (e.g. 70, 21G, 11G, 29C).

### Priority 4: Relevant Express Rail
* **Status**: Maintained as an isolated commercial stop catalogue (8 stops: MAS, MS, TBM, CGL, PER, TRL, AJJ, MBM) with strict isolation rules from suburban EMU timetables.
* **Next Action**: Ingest per-train commercial arrival/departure times from NTES/CRIS publications for trains serving the commuter belt.

---

## 4. Test Fixtures & Automated Verification

### 4.1 Synthetic Test Fixtures ([`backend/tests/fixtures/gtfs/`](file:///c:/AccessRoute/backend/tests/fixtures/gtfs/))
Created 6 self-contained, clearly-labeled synthetic fixtures solely for testing (protected by [`FIXTURE_NOTICE.md`](file:///c:/AccessRoute/backend/tests/fixtures/gtfs/FIXTURE_NOTICE.md)):
1. `valid_feed/`: Complete valid feed with active calendar (2026–2030), 3 stops, 1 route, 2 trips, 6 stop_times.
2. `missing_files_feed/`: Omits `trips.txt`, `stop_times.txt`, and `calendar.txt`.
3. `broken_references_feed/`: Non-existent `route_id`, `service_id`, `trip_id`, and `stop_id`.
4. `invalid_coordinates_feed/`: Stop with London coordinates (51.5074°N, -0.1278°E) and NaN coordinates.
5. `expired_calendar_feed/`: Calendar with `end_date: 20211231` (emulating CMRL 2021 static feed).
6. `duplicate_ids_feed/`: Duplicate `stop_id`, `trip_id`, and `route_id`.

### 4.2 Test Execution Results

All automated test suites executed with 100% pass rates:

| Test Suite | Command | Test Cases / Assertions | Status |
| :--- | :--- | :--- | :--- |
| **GTFS Ingestion Pipeline** | `npm run test:ingestion` | **51 Passed, 0 Failed** | ✅ PASS |
| **Transit Data Foundation** | `npm run test:transit` | **49 Passed, 0 Failed** | ✅ PASS |
| **Backend API Endpoints** | `npm run test:api` | **44 Passed, 0 Failed** | ✅ PASS |
| **Gemini AI Extraction** | `npm run test:ai` | **7 Passed, 0 Failed** | ✅ PASS |
| **Code Quality / Linter** | `npm run lint` | **0 Errors** (48 pre-existing frontend warnings) | ✅ PASS |
| **Production Build** | `npm run build` | **Vite build clean in 909ms** | ✅ PASS |

---

## 5. Summary of Files Changed

* [`backend/services/ingestion/gtfsParser.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsParser.js): Zero-dependency GTFS Static CSV parser.
* [`backend/services/ingestion/gtfsValidator.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsValidator.js): Comprehensive GTFS feed validator.
* [`backend/services/ingestion/transitIngestionPipeline.js`](file:///c:/AccessRoute/backend/services/ingestion/transitIngestionPipeline.js): Ingestion pipeline runner and manifest generator.
* [`backend/tests/fixtures/gtfs/`](file:///c:/AccessRoute/backend/tests/fixtures/gtfs/): 6 synthetic test fixtures and `FIXTURE_NOTICE.md`.
* [`backend/tests/ingestion.test.js`](file:///c:/AccessRoute/backend/tests/ingestion.test.js): 51 automated ingestion test cases.
* [`package.json`](file:///c:/AccessRoute/package.json): Added `"test:ingestion": "node backend/tests/ingestion.test.js"`.
* [`docs/TRANSIT_INGESTION_REPORT.md`](file:///c:/AccessRoute/docs/TRANSIT_INGESTION_REPORT.md): This report.

---

## 6. Recommended Next Action (Phase 04)

1. **Suburban Rail Ingestion**: Execute `runIngestion` on Southern Railway suburban feed (`srr-gtfs.zip`), generating the operational timetable index for the 763 daily EMU services.
2. **CMRL Headway Expansion Generator**: Build a deterministic runtime headway expander (peak 4–6 min, off-peak 8–10 min) to bridge the gap left by CMRL's expired 2021 static calendar.
3. **Corridor-Filtered MTC Ingestion**: Ingest the top 50 arterial MTC bus routes connecting the 21 verified hubs, keeping repository size lean while providing full corridor coverage.
4. **Multimodal Graph Assembly**: Link suburban stations, metro stations, and bus hubs via walking interchange transfer edges.

*Work has stopped after ingestion and validation. Ready for your review.*
