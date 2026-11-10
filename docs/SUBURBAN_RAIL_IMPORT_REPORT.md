# AccessRoute — Suburban Rail GTFS Verification, Preprocessing & Derived Dataset Report

**Document**: `docs/SUBURBAN_RAIL_IMPORT_REPORT.md`  
**Phase**: Phase 06 — Isolated Suburban Rail Timetable Preprocessor & Deterministic Derived Representation  
**Date**: October 2026  
**Status**: Preprocessed Derived Representation Generated with Full Audit Trail & Strict Routing Isolation  
**Routing Readiness**: `readyForJourneyRouting: false` (Enforced on both raw source and derived manifests)  
**Corpus**: `c:\AccessRoute\data\suburban_rail` (`imported/` immutable raw source; `derived/` preprocessed experimental artifact)  
**Engineers**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 06 establishes an isolated, deterministic preprocessing layer ([`backend/services/ingestion/timetablePreprocessor.js`](file:///c:/AccessRoute/backend/services/ingestion/timetablePreprocessor.js)) for Southern Railway (SR) Suburban and MRTS timetable data, building directly upon the Phase 05.1 independent quality audit.

The preprocessor safely transforms eligible GTFS records into an auditable, normalized representation ([`data/suburban_rail/derived/`](file:///c:/AccessRoute/data/suburban_rail/derived/)) for future routing-engine research and development, while strictly maintaining production journey routing disabled (`readyForJourneyRouting: false`).

### Key Accomplishments & Exact Statistics

1. **Source Immutability Preserved**: All 9 raw imported source files in [`data/suburban_rail/imported/`](file:///c:/AccessRoute/data/suburban_rail/imported/) remain 100% byte-for-byte immutable snapshots verified against their SHA-256 checksums. Zero raw source files were modified or rewritten.
2. **Derived Output Isolation**: All normalized records and manifests are written exclusively to a separate derived directory: [`data/suburban_rail/derived/`](file:///c:/AccessRoute/data/suburban_rail/derived/). The directory is clearly labelled with [`DERIVED_DATA_NOTICE.md`](file:///c:/AccessRoute/data/suburban_rail/derived/DERIVED_DATA_NOTICE.md) as experimental and not operationally verified.
3. **Exact 759 + 4 Partition Complete**:
   - **Total Source Trips**: **763 trips**
   - **Eligible Derived Trips**: **759 trips (99.48%)**
     - **Unmodified Source-Valid Trips**: **740 trips (97.0%)** (clean monotonic daytime schedules)
     - **Normalized Rollover Trips**: **19 trips (2.48%)** (safely transformed to extended-hour `24:xx:xx` format)
   - **Excluded / Quarantined Trips**: **4 trips (0.52%)** (incomplete shuttle trips `43551_T1`, `43552_T1`, `43553_T1`, `43554_T1` lacking terminus stations; non-normalizable, no missing data fabricated)
4. **Exact Stop Times Partition**:
   - **Total Raw Stop Times**: **16,135 scheduled stops**
   - **Derived Stop Times**: **16,131 scheduled stops** (16,135 raw minus 4 excluded single-stop records)
   - **Excluded Stop Times**: **4 scheduled stops** (1 stop each from the 4 incomplete shuttles)
   - **Transformed Stop Records**: **142 individual stop records** across the 19 rollover trips were adjusted by exactly +86,400s (+24h)
5. **Deterministic Bit-for-Bit Output**: Preprocessing is 100% deterministic across repeated runs, producing identical outputs and a verified SHA-256 content hash: `ce69b631103cfe757ce10a25ba56026d12d2bce4d332e288adcb5a8d92ab629e`.
6. **Strict Routing Eligibility Maintained**:
   - `readyForJourneyRouting: false` is maintained on both the source manifest and the derived manifest.
   - The artifact is NOT presented to the user-facing journey planner or map.
   - All 5 feed blockers remain visible: distant calendar placeholder (`21700820`), unconfirmed timetable redistribution rights, unverified operational currency, missing `PRTK`/`ADMB` commercial schedules, and excluded shuttle services.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Suburban Rail GTFS Preprocessing Architecture (Phase 06)                              │
│                                                                                                         │
│   Immutable Raw GTFS Snapshot (data/suburban_rail/imported/)                                            │
│   9 text files (~763 KB) with verified SHA-256 checksums (100% cryptographic match)                     │
│              │                                                                                          │
│              ▼                                                                                          │
│   [ timetablePreprocessor.js ] ===> Strict physical validation & deterministic normalization           │
│              │                                                                                          │
│              ├─► 740 Unmodified Valid Trips   ===> Clean daytime schedules (04:30 - 23:00)             │
│              ├─► 19 Normalized Rollover Trips ===> Unambiguous modulo-24 wrap -> extended hours (24:xx)│
│              └─► 4 Incomplete Shuttle Trips   ===> Strictly excluded with recorded reason (No terminus)│
│              │                                                                                          │
│              ▼                                                                                          │
│   [ data/suburban_rail/derived/ ]                                                                       │
│              │                                                                                          │
│              ├─► DERIVED_DATA_NOTICE.md       ===> Loud experimental notice & routing disclaimer        │
│              ├─► derived_manifest.json        ===> Preprocessing metadata, counts & source checksums   │
│              ├─► transformation_audit.json    ===> Granular diff of all 19 transformed trips (142 stops)│
│              ├─► trips.txt (759 trips)        ===> Deterministically sorted eligible trips             │
│              ├─► stop_times.txt (16,131 stops)===> Deterministically sorted normalized stop times       │
│              ├─► routes.txt, stops.txt        ===> Preserves 100% pathway & catalogue integrity        │
│              └─► readyForJourneyRouting: FALSE===> Production routing strictly disabled                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Provenance, Temporal Dimensions & Licensing Audit

### 1.1 Four Distinct Temporal Dimensions & Exact Date Recalculation

Phase 05.1 established strict mathematical separation across four distinct temporal axes, preserved in Phase 06:

| Temporal Dimension | Verified Value | Meaning & Source Evidence |
| :--- | :--- | :--- |
| **Source Retrieval Date** | **`2026-10-26`** | Exact calendar date AccessRoute retrieved the snapshot from the upstream GitHub mirror. |
| **Feed Publication Date** | **`2026-10-04`** | Git commit timestamp for release `v0.2.0` (`af0742dba777f9657ed6fda2046d6c2a721d630b`) in `ungalsoththu/ChennaiGTFS`. |
| **Feed Info Metadata Validity** | **`2025-07-22` to `2170-08-22`** | Stated feed publication metadata range in `feed_info.txt` (`feed_start_date: 20250722`, `feed_end_date: 21700822`). |
| **Scheduled Service Calendar Range** | **`2025-08-06` to `2170-08-20`** | Actual service dates in `calendar.txt` (`start_date`: `20250806` to `20250908`, `end_date`: `21700820` across all 5 services) and `calendar_dates.txt` (`20251001`, `20251002`). Resolves the 2-day discrepancy between feed metadata and calendar files. |
| **Verified Operational Currency** | **`UNVERIFIED_HISTORICAL`** | Southern Railway revises timetables periodically with ongoing engineering track blocks (Beach–Egmore 4th line work and MRTS commissioning). The snapshot is not verified as current operational service. |

### 1.2 Licensing & Redistribution Status

> [!IMPORTANT]
> **Licensing Finding: Tooling MIT vs. Schedule Data UNCONFIRMED**  
> - **Compilation Pipeline / Scripts**: Distributed under the **MIT License** (`spdx: MIT`) by the upstream community repository maintainers.  
> - **Underlying Timetable Data**: Originates from timetable booklets and schedule notices published by Southern Railway (Ministry of Railways, Government of India). Indian Railways does not currently release its timetable databases under an explicit open data license (such as Creative Commons CC-BY or ODbL).  
> - **Legal Classification in AccessRoute**: The timetable schedule license is explicitly recorded as **`UNCONFIRMED`** in both [`ingestion_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/imported/ingestion_manifest.json) and [`derived_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/derived/derived_manifest.json). This status constitutes an active **feed-level blocker** that prevents commercial redistribution until authorized through the CUMTA Open Data Portal.

---

## 2. Acquired File Inventory & Cryptographic Checksums

All 9 files in [`data/suburban_rail/imported/`](file:///c:/AccessRoute/data/suburban_rail/imported/) were verified for source immutability. Checksums remain identical:

| Filename | Bytes | SHA-256 Checksum | Immutability Status |
| :--- | :---: | :--- | :---: |
| [`agency.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/agency.txt) | 115 B | `2ef8f11ce5c52eb8b62e02f87fbdc6865d0af3a4538754aa862dd5fbec7c4751` | **VERIFIED UNCHANGED** |
| [`calendar.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/calendar.txt) | 328 B | `decf74ac0a5f7a060a93708b84e2f5c33ceff985b47d3437de0c721abc388087` | **VERIFIED UNCHANGED** |
| [`calendar_dates.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/calendar_dates.txt) | 139 B | `fba0b31d3f38b24804169c5aab9e8596eeb4abb3888aadec87ac465dec492fdd` | **VERIFIED UNCHANGED** |
| [`feed_info.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/feed_info.txt) | 178 B | `e1e3415e38e8e9f8516fc4ed05b04fc280fd2dc973d46a6e94ea73d1e9781ca8` | **VERIFIED UNCHANGED** |
| [`pathways.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/pathways.txt) | 65,738 B | `9a12074f0a387cd454d6cf319701982e3c2de8b7c20c8d5da1c21d1de22cdf76` | **VERIFIED UNCHANGED** |
| [`routes.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/routes.txt) | 25,455 B | `357bfa08dcf31a3cf0dfa4e65ab344ffcd730f9cfcaf18e024ba93e3290ffa64` | **VERIFIED UNCHANGED** |
| [`stops.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/stops.txt) | 36,199 B | `29bc27abb8e1ce94e312ad46c2a151f62a4174a279a520aa2ed442fc54588459` | **VERIFIED UNCHANGED** |
| [`stop_times.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/stop_times.txt) | 608,308 B | `3f5a6d5f3bf76494e69d7b7a19199a3f73f208cfd3a7b19406059ac4a3f93e09` | **VERIFIED UNCHANGED** |
| [`trips.txt`](file:///c:/AccessRoute/data/suburban_rail/imported/trips.txt) | 26,798 B | `fc2f72954e8a024f56dda1cdc02669751435048c683bab5a62f6d857fc587bab` | **VERIFIED UNCHANGED** |
| **Total** | **763,258 B** | — | **100% Cryptographic Match** |

---

## 3. Phase 06 Preprocessing & Derived Normalization Details

### 3.1 Normalization Feasibility & Partition Rules

The preprocessor strictly classifies each trip based on physical and chronological plausibility:

```
Total Trips: 763
├── Eligible Derived Trips: 759 (99.48%) ──► Written to data/suburban_rail/derived/trips.txt
│   ├── Unmodified Valid Trips:   740 (97.0%) ──► Monotonic daytime schedules (04:30 - 23:00)
│   └── Normalized Rollover Trips: 19  (2.48%) ──► Modulo-24 wrap normalized to extended hours (24:xx)
└── Quarantined / Excluded Trips:   4  (0.52%) ──► Single-stop shuttle trips (Missing terminus)
```

### 3.2 Detailed Audit of Normalized Rollover Trips (19 Trips / 142 Stop Records)

The 19 late-night trips cross midnight between 23:00 and 01:00. The preprocessor normalizes their post-midnight timestamps to extended GTFS hours (`24:xx:xx`):

- **4 Same-Stop Midnight Inversions**: Platform dwell spans midnight (e.g., arrival `23:59:00`, departure `00:00:00` $\to$ normalized departure `24:00:00`). Dwell duration is verified between 0 and 900 seconds (15 min).
  - `40208_T1` (seq 15 `MBM_P_2`: 8 stops shifted; duration 80m)
  - `40381_T1` (seq 15 `PV_P_2`: 4 stops shifted; duration 55m)
  - `40383_T1` (seq 8 `MBM_P_2`: 11 stops shifted; duration 55m)
  - `40660_T1` (seq 25 `MS_P_10`: 4 stops shifted; duration 120m)
- **15 Inter-Stop Progression Regressions**: Hop spans midnight (e.g., prev departure `23:48:00`, next arrival `00:00:00` $\to$ normalized arrival `24:00:00`). Hop duration is verified between 0 and 3600 seconds (60 min).
  - `40089_T1` (seq 18 `TBM_P_1`: 1 stop shifted; duration 55m)
  - `40091_T1` (seq 12 `PZA_P_2`: 7 stops shifted; duration 55m)
  - `40093_T1` (seq 2 `MSF_P_2`: 17 stops shifted; duration 55m)
  - `40206_T1` (seq 22 `MSB_P_4`: 1 stop shifted; duration 95m)
  - `40385_T1` (seq 2 `MSF_P_2`: 17 stops shifted; duration 55m)
  - `40396_T1` (seq 8 `STM_P_2`: 11 stops shifted; duration 55m)
  - `40571_T1` (seq 26 `SKL_P_1`: 3 stops shifted; duration 120m)
  - `40572_T1` (seq 12 `TBMS_P_2`: 17 stops shifted; duration 114m)
  - `40661_T1` (seq 23 `POTI_P_1`: 6 stops shifted; duration 115m)
  - `40662_T1` (seq 12 `TBMS_P_2`: 17 stops shifted; duration 114m)
  - `42035_T1` (seq 17 `GPD_P_1`: 1 stop shifted; duration 100m)
  - `42037_T1` (seq 10 `AIPP_P_3`: 8 stops shifted; duration 100m)
  - `43253_T1` (seq 15 `PAB_P_1`: 7 stops shifted; duration 80m)
  - `43441_T1` (seq 29 `AJJ_P_1`: 1 stop shifted; duration 125m)
  - `43524_T1` (seq 29 `MAS_P_12`: 1 stop shifted; duration 136m)

Across all 19 trips, exactly **142 individual stop records** were modified. Every transformed stop record applies an exact +86,400s (+24h) offset. The transformation is logged stop-by-stop in [`data/suburban_rail/derived/transformation_audit.json`](file:///c:/AccessRoute/data/suburban_rail/derived/transformation_audit.json).

### 3.3 Strict Exclusion of Incomplete Shuttle Trips (4 Trips Quarantined)

Four shuttle local trips contain only a single stop record in `stop_times.txt`:

| Trip ID | Route ID | Route Long Name | Recorded Stop | Defect Details | Preprocessor Action |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `43551_T1` | `43551` | `AJJ-TRT` | `AJJ_P_1` at `04:00:00` | Terminus `TRT` (Tiruttani) dropped during scraping | **EXCLUDED / QUARANTINED** |
| `43552_T1` | `43552` | `TRT-AJJ` | `AJJ_P_1` at `21:40:00` | Origin `TRT` (Tiruttani) dropped during scraping | **EXCLUDED / QUARANTINED** |
| `43553_T1` | `43553` | `AJJ-TRT` | `AJJ_P_1` at `05:00:00` | Terminus `TRT` (Tiruttani) dropped during scraping | **EXCLUDED / QUARANTINED** |
| `43554_T1` | `43554` | `TRT-AJJ` | `AJJ_P_1` at `23:35:00` | Origin `TRT` (Tiruttani) dropped during scraping | **EXCLUDED / QUARANTINED** |

*Quarantine Action*: Strictly excluded from `derived/trips.txt` and `derived/stop_times.txt`. No synthetic arrival times or guessed stations are fabricated. Each excluded trip is recorded with its explicit reason in `derived_manifest.json`.

### 3.4 Preservation of Ancillary Tables & Graph Integrity

To guarantee that the derived dataset maintains 100% referential integrity:
- **`stops.txt`**: All 708 stops are preserved in `derived/stops.txt`. This guarantees zero broken references across all 2,076 platform-to-concourse pathways in `pathways.txt` and maintains the 97.1% curated catalogue reconciliation rate.
- **`routes.txt`**: All 763 routes are preserved (759 active with trips, 4 matching excluded shuttles). Zero foreign key errors exist.
- **`agency.txt`, `calendar.txt`, `calendar_dates.txt`, `feed_info.txt`, `pathways.txt`**: Copied verbatim from the immutable source.

---

## 4. Curated Catalogue Reconciliation & Spatial Boundary Exceptions

### 4.1 Catalogue Reconciliation (70 Stations)

We cross-referenced every record in [`data/suburban_rail/verified_stations.json`](file:///c:/AccessRoute/data/suburban_rail/verified_stations.json) against GTFS `stops.txt`:

| Category | Count | Percentage | Description & Evidence |
| :--- | :---: | :---: | :--- |
| **Exact Station Code Matches** | **66** | **94.3%** | Direct 1:1 match by Indian Railways code (`MSB`, `TBM`, `MS`, `GDY`, `AVD`, `TRL`, `CGL`, `VLCY`, etc.). |
| **Documented Alias Mappings** | **2** | **2.9%** | `MASS` $\to$ `MAS` (Moore Market Complex Suburban Terminal coded under `MAS` platforms 1–4, 12–16).<br>`VPY` $\to$ `VJM` (Vyasarpadi Jeeva official IR code is `VJM`). |
| **Missing Extension Stations (Unmatched)** | **2** | **2.9%** | `PRTK` (Puzhuthivakkam) and `ADMB` (Adambakkam) — MRTS Phase II extension stations. **Missing from source feed snapshot (0 scheduled services in GTFS)**. |
| **Total Source Feed Matches** | **68** | **97.1%** | Verified station matches present in the source GTFS snapshot (`reconciliationRate: 97.1%`). |
| **Total Curated Stations Audited** | **70** | **100.0%** | All 70 catalogue stations accounted for with zero mystery omissions. |

### 4.2 Documented Corridor Exception: Arambakkam (`AKM`)

- Located at `13.533137° N, 80.074584° E` (6 platform/boarding nodes).
- Legitimate suburban station on the Chennai–Sullurpeta northern line, connecting industrial workforces in northern Tiruvallur and Sri City to Chennai Central.
- Enforced as a documented **corridor exception** rather than discarded as invalid coordinates.

---

## 5. Feed-Level Blockers & Routing Readiness

Both manifests ([`imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/imported/ingestion_manifest.json) and [`derived/derived_manifest.json`](file:///c:/AccessRoute/data/suburban_rail/derived/derived_manifest.json)) maintain **`readyForJourneyRouting: false`**.

The active feed blockers preventing production routing are:
1. `ROUTING_DISABLED`: Derived representation is strictly isolated from production journey routing and map engines.
2. `FEED_SUSPICIOUS_CALENDAR_EXPIRY`: 5 services specify distant placeholder end dates (`21700820`), not verified operational service.
3. `FEED_UNCONFIRMED_DATA_LICENSE`: Underlying Southern Railway timetable schedule data redistribution rights are legally unconfirmed.
4. `FEED_MISSING_EXTENSION_TIMETABLES`: MRTS Phase II extension stations `PRTK` and `ADMB` lack commercial schedules in this snapshot.
5. `UNVERIFIED_OPERATIONAL_CURRENCY`: Southern Railway operational schedule revisions and engineering track blocks unverified.
6. `EXCLUDED_SHUTTLE_SERVICES`: 4 single-stop shuttle trips (`43551_T1`–`43554_T1`) excluded due to missing terminus.

---

## 6. What the Artifact CAN and CANNOT Be Used For

| Component / Usage | Safe & Permitted? | Detailed Conditions & Boundaries |
| :--- | :---: | :--- |
| **Routing-Engine Algorithm Research** | **YES** | The 759 eligible derived trips in `data/suburban_rail/derived/` have clean monotonic timestamps suitable for testing graph builders, RAPTOR, and CSA algorithms offline. |
| **Curated 70-Station Catalogue** | **YES** | Station coordinates, platform counts, and UTS ticketing metadata in `verified_stations.json` can be used for map display and search. |
| **Station Rail Connectivity Graph** | **YES** | Physical stop sequences and track connectivity across South, West, North, and MRTS lines are verified. |
| **Interchange Walkway Pathways (2,076 Links)** | **YES** | Platform-to-concourse pathways in `pathways.txt` have 100% referential integrity for transfer modelling. |
| **Offline Test Fixtures** | **YES** | Clean derived GTFS files provide standard test datasets for timetable parsers and routing tests. |
| **Live Passenger Journey Planning** | **NO** | Production journey routing remains strictly disabled (`readyForJourneyRouting: false`). Must NOT be wired into the live user journey planner. |
| **Live Vehicle Locations / Real-Time Predictions** | **NO** | No live train tracking, GPS telemetry, or arrival predictions exist in this static feed. |
| **Fabricated Missing Services** | **NO** | Missing MRTS extension services (`PRTK`, `ADMB`) and shuttle termini (`TRT`) are NOT fabricated or approximated. |
| **Commercial Timetable Redistribution** | **NO** | Prohibited pending formal open data authorization through CUMTA / Southern Railway. |

---

## 7. Automated Test Verification

Execution of all test suites confirms zero regressions across the codebase:

- **Ingestion Test Suite** (`npm run test:ingestion`): **182 passed, 0 failed** across 26 test suites:
  - Suite 1: CSV Parser Edge Cases (6 tests)
  - Suite 2: GTFS Time & Date Validation (10 tests)
  - Suite 3: Valid GTFS Feed Ingestion (8 tests)
  - Suite 4: Missing Required Files Detection (4 tests)
  - Suite 5: Referential Integrity & Broken References (4 tests)
  - Suite 6: Coordinate Validation & Geographic Bounds (3 tests)
  - Suite 7: Expired Service Calendar Detection (5 tests)
  - Suite 8: Duplicate Identifiers Detection (4 tests)
  - Suite 9: Transport Mode Isolation & Manifest Generation (5 tests)
  - Suite 10: Southern Railway Real GTFS Import & Quality Validation (18 tests)
  - Suite 11: Extended-Hours GTFS Times (`24:xx:xx` Format) (5 tests)
  - Suite 12: Midnight Rollover Modulo-24 & Normalization Analysis (10 tests)
  - Suite 13: Incomplete Shuttle Trips & Missing Terminus Quarantine (4 tests)
  - Suite 14: Suspicious Far-Future Calendar & Blocker Enforcement (3 tests)
  - Suite 15: Broken Calendar Dates Service References (2 tests)
  - Suite 16: Source-File Immutability & Checksum Integrity (11 tests)
  - Suite 17: Transparent Record Classification & Feed Blockers (6 tests)
  - Suite 18: Catalogue Reconciliation & Corridor Exceptions (8 tests)
  - Suite 19: Isolated Suburban Rail Preprocessor & Derived Manifest (16 tests)
  - Suite 20: Preprocessor Determinism Across Repeated Runs (3 tests)
  - Suite 21: Real Affected Trips & Transformation Audit Verification (12 tests)
  - Suite 22: Strict Exclusion & Quarantine of Incomplete Shuttle Trips (5 tests)
  - Suite 23: Rejection of Ambiguous & Unnormalizable Edge Cases (6 tests)
  - Suite 24: Preservation of Valid Extended-Hour Times (5 tests)
  - Suite 25: Absolute Immutability of Raw Imported Source Files (2 tests)
  - Suite 26: Production Routing Readiness & Blocker Enforcement (10 tests)
- **Transit Data Foundation** (`npm run test:transit`): **49 passed, 0 failed**
- **Backend API Suite** (`npm run test:api`): **44 passed, 0 failed**
- **Gemini AI Layer** (`npm run test:ai`): **7 passed, 0 failed**
- **Production Build** (`npm run build`): **Vite build clean**
