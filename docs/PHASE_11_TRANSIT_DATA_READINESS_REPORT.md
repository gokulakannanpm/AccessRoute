# AccessRoute — Phase 11: Transit Data Readiness and Source Verification Report

**Document**: `docs/PHASE_11_TRANSIT_DATA_READINESS_REPORT.md`  
**Phase**: Phase 11 — Transit Data Readiness and Source Verification  
**Branch**: `hacknova-mvp`  
**Date**: October 2026  
**Status**: Completed & Verified  
**Auditor**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 11 conducts a thorough, evidence-based investigation into whether reliable, current Chennai public transport timetables can be obtained and legally used by AccessRoute. The investigation covers four transit modes across Greater Chennai and connected corridors in Chengalpattu, Kanchipuram, and Tiruvallur:
1. **Chennai Metro (CMRL)**
2. **Southern Railway Suburban Services (SR Chennai Division / MRTS)**
3. **MTC Buses (Metropolitan Transport Corporation)**
4. **Express Rail (Indian Railways commercial passenger stops)**

### Core Conclusions
1. **No Authoritative Open GTFS Feed with Current Calendars Exists**: None of the three operating transit agencies (CMRL, Southern Railway, MTC) publishes an official, active, unexpired GTFS Static feed with open redistribution rights.
2. **Feed Blockers are Legitimate and Unresolved**: Bypassing calendar expiry, extending placeholder dates, inventing missing trips, or ignoring unconfirmed licensing would violate transport safety and data integrity standards. Therefore, all feed-level blockers remain active.
3. **`readyForJourneyRouting` Strictly Remains `false` Across All Feeds**: The production routing engine continues to enforce honest reporting (`ROUTING_DATA_UNAVAILABLE`, HTTP 503) when live timetable queries are attempted, while preserving explicitly labeled illustrative previews (`isIllustrativePreview: true`).
4. **Discrepancies Reconciled**: Stale documentation claims in `data/suburban_rail/provenance.json` (which claimed raw GTFS was not downloaded) have been corrected to match the actual repository paths (`data/suburban_rail/imported/` and `data/suburban_rail/derived/`).

---

## 1. Audit of Current Feeds & Repository Inventory

An empirical inspection was conducted on all source files, provenance metadata, cryptographic hashes, manifests, calendars, exceptions, stop times, transfer records, and blocker logic across all four modes.

### 1.1 Summary Matrix of Repository Feeds

| Mode | Ingestion Path | GTFS Files | Total Records / Trips | Calendar Range | Calendar Status | Active Blockers | `readyForJourneyRouting` |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Chennai Metro** | `data/chennai_metro/imported/` | 10 | 625 trips / 12,503 stop times | `20210420` – `20211231` | `EXPIRED` | 3 blockers | **`false`** |
| **Suburban Rail (Raw)** | `data/suburban_rail/imported/` | 9 | 763 trips / 16,135 stop times | `20250806` – `21700820` | `ACTIVE` (Placeholder) | 5 blockers | **`false`** |
| **Suburban Rail (Derived)** | `data/suburban_rail/derived/` | 9 | 759 trips / 16,131 stop times | `20250806` – `21700820` | `ACTIVE` (Placeholder) | 4 blockers | **`false`** |
| **MTC Bus** | `data/mtc_bus/imported/` | 7 | 47,047 trips / 1,360,443 stop times | `20240501` – `20300501` | `ACTIVE` (Placeholder) | 4 blockers | **`false`** |
| **Express Rail** | `data/express_rail/` (Catalogue only) | 0 | 0 scheduled trips (7 hubs) | None | `NOT_APPLICABLE` | No timetable data | **`false`** |

---

### 1.2 Mode-by-Mode Detailed Feed Audit

#### A. Chennai Metro Rail Limited (`chennai_metro`)
* **Repository Paths**:
  - Raw feed: [`data/chennai_metro/imported/`](file:///c:/AccessRoute/data/chennai_metro/imported/)
  - Provenance: [`data/chennai_metro/provenance.json`](file:///c:/AccessRoute/data/chennai_metro/provenance.json)
  - Manifest: [`data/chennai_metro/imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/chennai_metro/imported/ingestion_manifest.json)
  - Station Catalogue: [`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json)
* **File Inventory & Cryptographic Checksums (10 files, 716,157 bytes)**:
  - `agency.txt` (300 B, SHA-256: `8e96c79f3d2fff5b5a982f1c2c95b30508259a0977997833a50d6cbbc611fe5e`)
  - `calendar.txt` (123 B, SHA-256: `00c8d79e1bffa04abfecce8d05606101b24cc76c41e8e44c80c86c5349e7aebc`)
  - `fare_attributes.txt` (196 B, SHA-256: `52ea5b7b3dc2ddcf25485d141570b77796f060272ea863f49ae59d7ad2b5bdcc`)
  - `fare_rules.txt` (20,842 B, SHA-256: `786917869bf3a56860f3213ccd093d580c252e09ba2aa7ca88f80e1bd9074c3a`)
  - `routes.txt` (2,343 B, SHA-256: `46ee8a8673029c0526ee783b6c946070c6987f8790f4c3e8836dc6f6939f10d4`)
  - `shapes.txt` (178,555 B, SHA-256: `901e08e7e8a06661b18d426048a6154f6bac317b85159046773a9a5a29dcb8ab`)
  - `stops.txt` (26,901 B, SHA-256: `618bf5eb45ee2445bcd29acd61837cfa174d65fd8fbbaee6534e3c2309bd2304`)
  - `stop_times.txt` (457,077 B, SHA-256: `1e2f355ba0c97e8570267777b05ec7562b5ccdf0b53ed60d91f2096faff518b0`)
  - `transfers.txt` (1,338 B, SHA-256: `52937473eb8c9314fab8dfb41f46d0b79e543871c0caf7a06eb8b010c1637dad`)
  - `trips.txt` (28,482 B, SHA-256: `2ae2e6c419cc6280ba023dad96454f37729223cb8d49d4c72d7c2772dbe86e40`)
* **Calendars & Service Dates**:
  - Single service `WD` (Monday–Saturday).
  - `start_date`: `20210420`, `end_date`: `20211231`.
  - All calendar dates expired > 4 years ago.
  - Zero calendar exceptions (`calendar_dates.txt` is absent).
* **Stop Times & Chronology**:
  - 12,503 scheduled stop times across 625 trips.
  - Earliest departure: 05:27:03; latest arrival: 21:48:57.
  - Monotonicity: 100% strictly increasing; 0 inversions, 0 regressions, 0 overnight rollovers.
* **Transfers**:
  - 50 internal station platform transfer rules with explicit walking durations.
* **Reconciliation**:
  - 41 curated stations in `verified_stations.json`.
  - 20 exact code matches (48.8%), 0 confirmed external aliases, 2 divergent facility mappings (`SCMBT`, `SNG`), 19 provisional mappings.
  - 2 stations (`SWND` Wimco Nagar Depot and `STVT` Tiruvottiyur Theradi) exist in `stops.txt` but have 0 scheduled commercial trips in this 2021 snapshot.
* **Active Blockers**:
  1. `FEED_EXPIRED_CALENDAR`: All calendar services expired on 2021-12-31.
  2. `FEED_MISSING_EXTENSION_TIMETABLES`: Wimco Nagar Depot and Tiruvottiyur Theradi lack schedules.
  3. `FEED_UNCONFIRMED_DATA_LICENSE`: CMRL timetable data redistribution rights are unconfirmed.

---

#### B. Southern Railway Suburban Rail (`suburban_rail`)
* **Repository Paths**:
  - Raw imported feed: [`data/suburban_rail/imported/`](file:///c:/AccessRoute/data/suburban_rail/imported/)
  - Derived preprocessed feed: [`data/suburban_rail/derived/`](file:///c:/AccessRoute/data/suburban_rail/derived/)
  - Provenance: [`data/suburban_rail/provenance.json`](file:///c:/AccessRoute/data/suburban_rail/provenance.json)
  - Raw manifest: [`data/suburban_rail/imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/imported/ingestion_manifest.json)
  - Derived manifest: [`data/suburban_rail/derived/derived_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/derived/derived_manifest.json)
  - Station Catalogue: [`data/suburban_rail/verified_stations.json`](file:///c:/AccessRoute/data/suburban_rail/verified_stations.json)
* **File Inventory & Cryptographic Checksums (9 raw files, 769,271 bytes)**:
  - `agency.txt` (115 B, SHA-256: `2ef8f11ce5c52eb8b62e02f87fbdc6865d0af3a4538754aa862dd5fbec7c4751`)
  - `calendar.txt` (328 B, SHA-256: `decf74ac0a5f7a060a93708b84e2f5c33ceff985b47d3437de0c721abc388087`)
  - `calendar_dates.txt` (139 B, SHA-256: `fba0b31d3f38b24804169c5aab9e8596eeb4abb3888aadec87ac465dec492fdd`)
  - `feed_info.txt` (178 B, SHA-256: `e1e3415e38e8e9f8516fc4ed05b04fc280fd2dc973d46a6e94ea73d1e9781ca8`)
  - `pathways.txt` (65,738 B, SHA-256: `9a12074f0a387cd454d6cf319701982e3c2de8b7c20c8d5da1c21d1de22cdf76`)
  - `routes.txt` (25,455 B, SHA-256: `357bfa08dcf31a3cf0dfa4e65ab344ffcd730f9cfcaf18e024ba93e3290ffa64`)
  - `stops.txt` (36,199 B, SHA-256: `29bc27abb8e1ce94e312ad46c2a151f62a4174a279a520aa2ed442fc54588459`)
  - `stop_times.txt` (608,308 B, SHA-256: `3f5a6d5f3bf76494e69d7b7a19199a3f73f208cfd3a7b19406059ac4a3f93e09`)
  - `trips.txt` (26,798 B, SHA-256: `fc2f72954e8a024f56dda1cdc02669751435048c683bab5a62f6d857fc587bab`)
* **Calendars & Exceptions**:
  - `calendar.txt` has 5 services with start dates `20250806`–`20250908` and end date `21700820` (144-year distant future placeholder).
  - `calendar_dates.txt` has 2 holiday exclusion dates (`20251001`, `20251002`).
* **Stop Times & Preprocessing Transformations**:
  - Total trips: 763; total stop times: 16,135.
  - Raw feed defects:
    - 19 trips have modulo-24 midnight wrap regressions (e.g. `23:58:00` followed by `00:05:00`).
    - 4 trips (`43551_T1`, `43552_T1`, `43553_T1`, `43554_T1`) are single-stop shuttles with no destination terminus.
  - Phase 06 derived preprocessor normalized the 19 trips to GTFS extended-hour format (`24:xx:xx`, +86400s across 142 stop records) and quarantined the 4 incomplete shuttles without fabricating artificial data, yielding 759 clean trips and 16,131 stop times (deterministic hash: `ce69b631103cfe757ce10a25ba56026d12d2bce4d332e288adcb5a8d92ab629e`).
* **Station Reconciliation**:
  - 70 stations in `verified_stations.json`.
  - 66 exact matches, 2 confirmed aliases (`MASS → MAS`, `VPY → VJM`), and 2 newly opened MRTS stations (`PRTK` Puzhuthivakkam, `ADMB` Adambakkam) lacking scheduled commercial trips in this snapshot.
* **Active Blockers**:
  1. `FEED_SUSPICIOUS_CALENDAR_EXPIRY`: Distant placeholder end date `21700820`.
  2. `FEED_INCOMPLETE_SHUTTLE_TRIPS`: 4 single-stop trips lacking destination.
  3. `FEED_UNNORMALIZED_MIDNIGHT_ROLLOVER`: 19 modulo-24 midnight rollover trips in raw feed.
  4. `FEED_MISSING_EXTENSION_TIMETABLES`: PRTK, ADMB lack commercial schedules.
  5. `FEED_UNCONFIRMED_DATA_LICENSE`: Southern Railway timetable redistribution rights unconfirmed.

---

#### C. Metropolitan Transport Corporation Buses (`mtc_bus`)
* **Repository Paths**:
  - Raw imported feed: [`data/mtc_bus/imported/`](file:///c:/AccessRoute/data/mtc_bus/imported/)
  - Provenance: [`data/mtc_bus/provenance.json`](file:///c:/AccessRoute/data/mtc_bus/provenance.json)
  - Manifest: [`data/mtc_bus/imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/mtc_bus/imported/ingestion_manifest.json)
  - Hubs Catalogue: [`data/mtc_bus/verified_hubs.json`](file:///c:/AccessRoute/data/mtc_bus/verified_hubs.json)
* **File Inventory & Cryptographic Checksums (7 files, 45,044,883 bytes)**:
  - `agency.txt` (133 B, SHA-256: `6fbcead3ef9398e1784facbe71030772e6abebdb86137632178747815cce4da6`)
  - `calendar.txt` (342 B, SHA-256: `fca05f8f64ff8068da65f03439ff1320b0a5c556e9154b84e34c4f6e7d05a730`)
  - `feed_info.txt` (269 B, SHA-256: `ff68288fa3ed754b9c2262a8ba6d5ae4dccf7cc0edca934213f93b20042adac1`)
  - `routes.txt` (226,405 B, SHA-256: `3f933bdd0f64b69359a1eef24cf0a5464494e1affce144da995ce164a17e0028`)
  - `stops.txt` (230,767 B, SHA-256: `24ef742ee8312d27c9474a840330a5fbf271d2bbdd59514309d646cc4ea30c85`)
  - `stop_times.txt` (43,537,866 B, SHA-256: `aa80ad6804323964689b4a862c3d8dbcd497c386a9dc305e5f7e4badb4cad3cd`)
  - `trips.txt` (1,049,101 B, SHA-256: `0264fe39cf23ceac6ce096f5bbcfad16c47cc48849ece657b287df392eedfa86`)
* **Feed Scope**:
  - 4,611 routes, 5,580 stops, 47,047 trips, 1,360,443 stop times.
  - 100% of stops within Chennai coordinate bounds.
  - 100% monotonic timing (0 inversions, 0 regressions, 0 single-stop trips).
* **Missing Tables**:
  - No `shapes.txt` (bus route geometry is straight-line only).
  - No `fare_attributes.txt` or `fare_rules.txt`.
  - No `transfers.txt` or `pathways.txt`.
* **Calendars & Origins**:
  - 6 services in `calendar.txt` with artificial date window: `20240501` to `20300501`.
  - Service `'/><script>alert(1)</script>'` demonstrates scraping and penetration testing artifacts.
  - Feed originates as an unauthenticated community reverse-engineering scrape of MTC mobile app endpoints, not an official publication by MTC or CUMTA.
* **Active Blockers**:
  1. `FEED_UNCONFIRMED_DATA_LICENSE`: Underlying MTC timetable redistribution rights unconfirmed.
  2. `FEED_COMMUNITY_SCRAPE_ORIGIN`: Feed is an unauthenticated third-party app scrape.
  3. `FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER`: Artificial 6-year window with scraper test artifacts.
  4. `FEED_MISSING_SHAPES_AND_FARES`: Missing route shapes and fare rules.

---

#### D. Express Rail (`express_rail`)
* **Repository Paths**:
  - Catalogue: [`data/express_rail/verified_express_stops.json`](file:///c:/AccessRoute/data/express_rail/verified_express_stops.json)
  - Provenance: [`data/express_rail/provenance.json`](file:///c:/AccessRoute/data/express_rail/provenance.json)
* **Status**:
  - No imported GTFS directory (`data/express_rail/imported/` does not exist).
  - Contains curated catalogue of 7 commercial stops in the Chennai commuter belt: `MAS`, `MS`, `TBM`, `CGL`, `PER`, `TRL`, `AJJ`.
  - Governed by strict isolation rule: Express trains must never be conflated with suburban EMU services due to unreserved ticketing distinctions, PRS reservations, and skip-stop operating patterns.
  - No timetable or trip data is available in the repository.

---

### 1.3 Discrepancy Reconciliation

During this audit, a specific discrepancy between documented provenance claims and the actual repository filesystem was detected and reconciled:
* **Discrepancy**: [`data/suburban_rail/provenance.json`](file:///c:/AccessRoute/data/suburban_rail/provenance.json) retained stale text from Phase 02 stating `"rawSourceDownloadedToRepo": false` and `"Raw GTFS archives (srr-gtfs.zip) and Southern Railway per-train timetable databases have NOT been imported into this repository; only a curated station catalogue is currently stored."`
* **Physical Reality**: Phase 05 imported 9 raw GTFS files into `data/suburban_rail/imported/`, and Phase 06 created the derived dataset in `data/suburban_rail/derived/`.
* **Resolution**: Updated `data/suburban_rail/provenance.json` to state `"rawSourceDownloadedToRepo": true`, added `"importedSourceDir": "data/suburban_rail/imported/"` and `"derivedSourceDir": "data/suburban_rail/derived/"`, and updated `limitationsAndCaveats` to accurately document both raw and derived locations. Also reconciled suburban file listings in `docs/TRANSIT_DATA_SOURCES.md`.

---

## 2. Investigation of Authoritative Sources

We conducted web searches, domain availability checks, and license audits across all candidate public-transport sources in Chennai.

### 2.1 Investigation Findings by Authority & Mode

#### 1. Chennai Metro Rail Limited (CMRL)
* **Official Operator Portal**: `https://chennaimetrorail.org/` (HTTP 200)
* **Official Travel Planner**: `https://travelplanner.chennaimetrorail.org/` (HTTP 200)
* **Data Nature**: Provides interactive web-based point-to-point journey planning, timetables, first/last train timings, and fare calculations.
* **Open Data / GTFS Availability**: **None published**. CMRL does not provide a downloadable GTFS zip archive, open REST API, or developer data portal.
* **CUMTA Transit Data Portal (`transitdata.cumta.org` / `test.cumta.org`)**:
  - Historical static GTFS archive (`CMRL gtfs.zip`) from April 2021 was mirrored during early CUMTA fellowship pilots.
  - The feed metadata lists agency as `CMRL` with `calendar.txt` validity ending on `20211231`.
  - CUMTA has not published any updated CMRL static GTFS feed with an active 2026 calendar.
* **Community Mirror (`ungalsoththu/ChennaiGTFS`)**:
  - Exact URL: `https://github.com/ungalsoththu/ChennaiGTFS/tree/main/data/cmrl`
  - Release: `v0.2.0` (commit `af0742dba777f9657ed6fda2046d6c2a721d630b`, published 2026-10-04).
  - License: Tooling scripts under ODbL / PDDL; underlying CMRL schedule data redistribution rights **`UNCONFIRMED`**.
* **Verdict**: Community mirror preserves the 2021 snapshot; no current, official, legally authorized open GTFS feed exists for CMRL.

#### 2. Southern Railway (SR Chennai Division / Indian Railways)
* **Official Portal**: `https://sr.indianrailways.gov.in/` (HTTP 200)
* **Suburban Timetable Publication**: Published exclusively as static PDF timetable booklets (e.g. `1689675841398-CHENNAISUBURBANTRAINTIMETABLE.pdf`) and divisional press releases for line-specific revisions.
* **CRIS / NTES APIs**: Centre for Railway Information Systems (CRIS) operates backend services for UTS on Mobile and NTES (`https://enquiry.indianrailway.gov.in/`), but these are private, closed APIs restricted to official mobile apps. Indian Railways publishes **no open developer GTFS feed or public REST API**.
* **CUMTA Staging Archive (`test.cumta.org`)**:
  - Staged `Southern Railways.zip` covering Beach–Tambaram, Avadi–Arakkonam, and MRTS lines.
  - Calendar end date was set to placeholder `21700820` (144 years in future).
  - Contains 19 modulo-24 rollover trips and 4 incomplete shuttle trips.
* **Community Mirror (`ungalsoththu/ChennaiGTFS`)**:
  - Exact URL: `https://github.com/ungalsoththu/ChennaiGTFS/tree/main/data/srr`
  - Commit: `af0742d` (Release `v0.2.0`).
  - License: Compilation tooling under MIT / ODbL; underlying Indian Railways timetable schedule redistribution rights **`UNCONFIRMED`**.
* **Verdict**: No official open machine-readable timetable API exists. The available feed is a historical snapshot with artificial placeholder calendar end dates.

#### 3. Metropolitan Transport Corporation (MTC Chennai)
* **Official Operator Portal**: `https://mtcbus.tn.gov.in/` (HTTP 200)
* **Real-Time GPS Tracking (Chalo / MTC Live)**:
  - MTC officially partnered with Chalo for fleet tracking.
  - Real-time GPS tracking data is proprietary and consumed exclusively by the Chalo passenger app and MTC website.
  - **No public GTFS-RT feed or open developer API** is provided.
* **Official Staging Feed (`https://test.cumta.org/static_mtc_gtfs_data.zip`)**:
  - Evaluated in Phase 08. Severely defective: **4,721 scheduled trips stamped with dummy `00:00:15` departures**.
* **Community App-Scraped Feed (`ungalsoththu/ChennaiGTFS`)**:
  - Exact URL: `https://github.com/ungalsoththu/ChennaiGTFS/tree/main/data/mtc`
  - Origin: Scraped from official MTC mobile application route/timetable endpoints.
  - Calendar: Spans artificial 6-year window (`20240501` to `20300501`) and contains penetration test script artifacts.
  - License: Tooling under ODbL / PDDL; underlying MTC timetable redistribution rights **`UNCONFIRMED`**.
* **Verdict**: The only usable timetable feed is an unauthenticated third-party community scrape of mobile app endpoints.

#### 4. Express Rail (CRIS / NTES / Indian Railways)
* **Official Portals**: `https://enquiry.indianrailway.gov.in/` (NTES), `https://www.irctc.co.in/`
* **Data Nature**: Commercial intercity passenger reservation and live enquiry systems.
* **Open Data Status**: CRIS does not publish an open GTFS feed or free public REST API for express trains. Unofficial community scrapers (e.g. `ntes-client`) exist on GitHub but carry no service guarantees or redistribution licenses.
* **Verdict**: No open, authorized timetable feed exists. Express rail remains strictly a catalogue of major commuter transfer nodes.

---

## 3. Substantiated Blocker Analysis

Under Phase 11 rules:
> "Resolve data blockers only where evidence supports resolution. Do not weaken the existing feed-eligibility rules. Replace expired or invalid calendars only when a valid current source provides the necessary service dates and schedules. Do not extend calendar dates artificially. Do not normalize or invent trips without explicit evidence and a documented transformation."

### Evaluation of Each Blocker

| Feed | Blocker Code | Can It Be Resolved? | Rationale & Evidence Needed for Resolution |
| :--- | :--- | :---: | :--- |
| **CMRL** | `FEED_EXPIRED_CALENDAR` | **NO** | Calendar expired on 2021-12-31. No official source provides updated service dates. Artificially extending dates to 2026/2027 is strictly prohibited. Requires CMRL or CUMTA to publish an official GTFS feed with active service dates. |
| **CMRL** | `FEED_MISSING_EXTENSION_TIMETABLES` | **NO** | Stations `SWND` and `STVT` opened in March 2022 and have 0 commercial trips in the 2021 feed. Inventing headways without official trip definitions is prohibited. Requires updated CMRL schedule definition. |
| **CMRL** | `FEED_UNCONFIRMED_DATA_LICENSE` | **NO** | CMRL has not published an open data license (e.g. GODL/CC-BY). Commercial or public redistribution terms remain unconfirmed. Requires formal open-data licensing statement from CMRL or CUMTA. |
| **Suburban** | `FEED_SUSPICIOUS_CALENDAR_EXPIRY` | **NO** | Calendar end date is `21700820` (144 years in future), indicating an artificial placeholder rather than a verified service validity window. Requires Southern Railway to publish authentic operational timetable validity dates. |
| **Suburban** | `FEED_INCOMPLETE_SHUTTLE_TRIPS` | **NO** | 4 trips (`43551_T1`–`43554_T1`) contain only 1 stop. Inventing destination stops would falsify train paths. Requires authentic Southern Railway EMU master working timetable. |
| **Suburban** | `FEED_UNNORMALIZED_MIDNIGHT_ROLLOVER` | **Resolved in Derived only; Unresolved in Raw** | Raw source breaks chronological sorting. Safely normalized in `data/suburban_rail/derived/` via Phase 06 deterministic preprocessor (+24h), but raw source retains this blocker. |
| **Suburban** | `FEED_MISSING_EXTENSION_TIMETABLES` | **NO** | MRTS extension stations `PRTK` and `ADMB` opened in March 2026 and lack scheduled trips in the CUMTA snapshot. Requires synchronized Southern Railway MRTS timetable. |
| **Suburban** | `FEED_UNCONFIRMED_DATA_LICENSE` | **NO** | Ministry of Railways / Southern Railway has not released timetable databases under an open public license. Requires CUMTA / Indian Railways open data agreement. |
| **MTC Bus** | `FEED_COMMUNITY_SCRAPE_ORIGIN` | **NO** | Feed is an unauthenticated reverse-engineering scrape of MTC mobile app endpoints. Claiming official provenance would be false. Requires official GTFS release by MTC or CUMTA. |
| **MTC Bus** | `FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER` | **NO** | Spans artificial 6-year window with scraper test artifacts (`'/><script>alert(1)</script>'`). Requires verified operational schedule calendar from MTC. |
| **MTC Bus** | `FEED_MISSING_SHAPES_AND_FARES` | **NO** | Feed lacks `shapes.txt` and fare tables. Generating synthetic routes would misrepresent bus routes. Requires official alignment shapefiles from MTC. |
| **MTC Bus** | `FEED_UNCONFIRMED_DATA_LICENSE` | **NO** | MTC timetable data redistribution rights are unconfirmed. Requires official Government Open Data release. |

### Final Eligibility Determination
Because none of the blocking conditions can be substantiated with an authentic, officially licensed, current source:
* **All active blockers are legitimately preserved.**
* **`readyForJourneyRouting` legitimately remains `false` on all manifests.**
* **Feed-eligibility rules remain 100% intact and unweakened.**

---

## 4. Pipeline Validation of Feeds

The existing zero-dependency CSV-safe GTFS ingestion pipeline ([`backend/services/ingestion/transitIngestionPipeline.js`](file:///c:/AccessRoute/backend/services/ingestion/transitIngestionPipeline.js)) and feed eligibility auditor ([`backend/services/routing/feedEligibility.js`](file:///c:/AccessRoute/backend/services/routing/feedEligibility.js)) were executed across all production and derived feeds.

### Validation Summary

```text
===================================================================================
Mode             Status                   Errors  Warnings  FK Integrity  Bounds
===================================================================================
chennai_metro    EXPIRED_CALENDAR         0       0         100% (0 brk)  100% (254 stops)
suburban_rail    VALIDATED_WITH_WARNINGS  0       8         100% (0 brk)  100% (708 stops)
mtc_bus          VALIDATED                0       0         100% (0 brk)  100% (5580 stops)
suburban(derived)VALIDATED_WITH_WARNINGS  0       5         100% (0 brk)  100% (708 stops)
===================================================================================
```

* **Referential Integrity**: 100% valid with 0 broken foreign key references across all feeds.
* **Spatial Bounding**: 100% of all stop coordinates fall strictly within AccessRoute's Greater Chennai bounding box (12.50°–13.50° N, 79.50°–80.40° E).
* **Trip Monotonicity**: All 625 Metro trips, all 47,047 MTC bus trips, and all 759 derived Suburban trips have strictly monotonic arrival/departure times.
* **Catalogue Reconciliation**: 41/41 Metro stations physically represented; 70/70 Suburban stations physically represented; 21/21 MTC hubs spatially matched.

---

## 5. Verification & Test Suite Execution

All test suites and production build commands were executed and passed with 100% success:

### 1. `npm run test:ingestion`
* **Result**: **PASS** (319 / 319 assertions passed)
* **Verified**: File inventories, cryptographic SHA-256 hashes, referential integrity, coordinate bounds, trip monotonicity, calendar expiration logic, blocker enforcement, and mode isolation across all modes.

### 2. `npm run test:transit`
* **Result**: **PASS** (49 / 49 assertions passed)
* **Verified**: Network scope boundaries, 4-county coverage, CMRL 41 stations, Southern Railway 70 stations, MTC 21 hubs, Express rail commercial stops, Divyangjan accessibility reality tags, and full transit dataset validator.

### 3. `npm run test:routing`
* **Result**: **PASS** (65 / 65 assertions passed)
* **Verified**: Direct journeys, multi-modal transfers, route ranking, time-dependent departures, overnight GTFS extended hours (`> 24:00:00`), wheelchair-accessible constraints, origin/destination validation, disabled mode rejection, synthetic fixture handling, and honest production feed blocker reporting (`ROUTING_DATA_UNAVAILABLE` 503 error with 0 eligible production feeds).

### 4. `npm run test:api`
* **Result**: **PASS** (58 / 58 assertions passed)
* **Verified**: Health check, `/api/locations`, `/api/routes/search`, `/api/routes/timetable/status` (reports `productionRoutingReady: false`, `eligibleFeedsCount: 0`), `/api/routes/timetable-search` (strictly returns 503 `ROUTING_DATA_UNAVAILABLE`), `/api/stations/:id`, `/api/issues`, `/api/profile`, and AI gateway status.

### 5. `npm run test:ai`
* **Result**: **PASS** (7 / 7 assertions passed)
* **Verified**: Gemini preference extraction (wheelchair, avoid stairs, voice navigation), route explanation, and null/empty handling.

### 6. `npm run test:e2e`
* **Result**: **PASS** (9 / 9 Playwright end-to-end tests passed)
* **Verified**: Complete commuter flow, mobile responsive views, desktop map/route layouts, preference updates, voice extraction, timetable search production blocker reporting, illustrative preview labelling, CSA search evaluation on synthetic fixtures, and duplicate origin/destination validation.

### 7. `npm run build`
* **Result**: **PASS** (Vite v8.2.1 production bundle generated in 1.70s with zero errors).

---

## 6. Real Current Journey Calculation & User Safety

### Can Any Real Current Journeys Now Be Calculated?
**No.** Real timetable journeys cannot be calculated on production feeds at this time because:
1. CMRL timetable has been expired since December 31, 2021.
2. Southern Railway timetable relies on a 2170 placeholder calendar, unverified operational currency, and unconfirmed redistribution rights.
3. MTC bus timetable originates from an unauthenticated app scrape with an artificial 2030 placeholder calendar and unconfirmed redistribution rights.
4. Express rail possesses no scheduled timetable dataset in the repository.

### Safeguard Enforcement
* Under AccessRoute's routing engine architecture:
  - If a user triggers a timetable search (`routingMode: 'timetable'` or `POST /api/routes/timetable-search`), the engine returns HTTP 503 `ROUTING_DATA_UNAVAILABLE` with an honest breakdown of active feed blockers.
  - The engine **never silently falls back** to synthetic or mock timetables when a real timetable search is requested.
  - Illustrative preview routes in the UI are strictly flagged with `isIllustrativePreview: true` and labeled "ILLUSTRATIVE PREVIEW ONLY — NOT AN ACTIVE SCHEDULE".

---

## Boundaries & Integrity Statement

* All existing work, UI redesign, CSA routing engine, API integrations, and local secrets have been preserved.
* No `.env` secrets have been exposed.
* No uncommitted files were staged, committed, pushed, reset, cleaned, or discarded.
* No timetable dates were artificially extended.
* No trips or transfer connections were fabricated.
* Phase 11 is complete. No Phase 12 actions have been initiated.
