# AccessRoute — Chennai Metro (CMRL) GTFS Source Verification, Isolated Import & Audit Report

**Document**: `docs/CHENNAI_METRO_IMPORT_REPORT.md`  
**Phase**: Phase 07 — Chennai Metro Source Verification and Isolated Import & Phase 07.1 Independent Audit  
**Date**: October 2026  
**Status**: Source Verified, Byte-for-Byte Imported into Isolated Directory, Independently Audited, Validated with Active Blockers  
**Routing Readiness**: `readyForJourneyRouting: false` (Production journey routing strictly disabled)  
**Corpus**: `c:\AccessRoute\data\chennai_metro` (`imported/` isolated raw source; `verified_stations.json` curated catalogue)  
**Branch**: `hacknova-mvp`  
**Engineers**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 07 and Phase 07.1 perform a rigorous multi-source investigation, source verification, byte-for-byte isolated import, and independent audit of available Chennai Metro Rail Limited (CMRL) transit data. The verified static GTFS dataset is preserved in an isolated directory ([`data/chennai_metro/imported/`](file:///c:/AccessRoute/data/chennai_metro/imported/)), validated using AccessRoute's GTFS-aware parser and pipeline, reconciled against the curated 41-station catalogue, and audited for cryptographic integrity, foreign-key relationships, chronology, spatial bounds, and production routing isolation.

### Key Accomplishments & Exact Statistics

1. **Multi-Source Investigation & Provenance Distinction**:
   - **Official CMRL Portal (`chennaimetrorail.org`) & Travel Planner**: Authoritative operator portal providing interactive fare lookups and route network maps, but confirmed to publish **no downloadable static GTFS zip archives, open timetable APIs, or machine-readable schedule feeds**. Operating headways and dynamic timetables are not published as verified open data.
   - **Claimed Upstream Staging Origin (`test.cumta.org`)**: An unauthenticated test staging server used by the CUMTA GIS fellowship where a static GTFS archive (`CMRL gtfs.zip`) was hosted. **Audit Finding**: CUMTA is **not** confirmed as the official publisher of this feed; the sole agency identified in `agency.txt` is Chennai Metro Rail Limited (`CMRL`).
   - **Community Feed Mirror (`ungalsoththu/ChennaiGTFS`)**: Verified commit `af0742dba777f9657ed6fda2046d6c2a721d630b` (Release `v0.2.0`, published `2026-10-04`). Mirrors the 10 GTFS files. Tooling and scripts are distributed under ODbL / PDDL, while underlying CMRL timetable data redistribution rights remain **`UNCONFIRMED`**.
2. **Byte-for-Byte Source Import & Cryptographic Integrity**:
   - All 10 GTFS files (`agency.txt`, `calendar.txt`, `fare_attributes.txt`, `fare_rules.txt`, `routes.txt`, `shapes.txt`, `stops.txt`, `stop_times.txt`, `transfers.txt`, `trips.txt`) were downloaded, SHA-256 verified, and preserved byte-for-byte in [`data/chennai_metro/imported/`](file:///c:/AccessRoute/data/chennai_metro/imported/).
   - Total imported data size: **716,157 bytes (~716.2 KB)** (correcting an earlier document typo of 715,699 B).
3. **Exact Feed Statistics & High Structural Quality**:
   - **1 Agency**: CMRL (`Asia/Kolkata` timezone, official helpline and URL).
   - **28 Routes**: All `route_type: 1` (Subway / Metro), covering Blue Line, Green Line, and direct inter-corridor loop runs.
   - **254 Stop Nodes**: 41 parent stations (`location_type: 1`), and 213 child platform / entrance nodes (`location_type: 0`) with detailed ramp/lift/staircase descriptions. Exactly 81 distinct platform stop IDs are referenced in scheduled trips.
   - **625 Trips**: Complete timetable journeys.
   - **12,503 Stop Times**: Fully scheduled arrival and departure times.
   - **1 Calendar Row**: Single service (`WD`), active Mon–Sat.
   - **7 Fare Tiers & 1,600 Fare Rules**: Zone-based matrix (₹10 to ₹60).
   - **13 Shapes & 4,231 Shape Points**: High-precision rail track geometry.
   - **50 Station Transfers**: Granular platform-to-platform transfer rules.
   - **Zero Broken References**: 100% relational integrity across all foreign keys (routes, trips, stops, calendar, shapes, stop times, transfers, fares).
   - **Zero Duplicate Identifiers**: All agency, route, stop, trip, fare, and shape sequence keys are unique.
   - **Zero Coordinate Violations**: All 254 stops (lat 12.9807° N to 13.1843° N, lon 80.1639° E to 80.3091° E) and 13 shapes (lat 12.9808° N to 13.1843° N, lon 80.1637° E to 80.3091° E) fall strictly within AccessRoute's Chennai multi-county scope (12.50–13.50° N, 79.50–80.40° E).
   - **Zero Time Inversions or Regressions**: All 625 trips are strictly monotonic daytime/evening services (05:27:03 to 21:48:57). Zero midnight rollovers.
4. **Catalogue Reconciliation & Missing Extension Analysis**:
   - Curated catalogue ([`verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json)) contains **41 operational stations**.
   - GTFS `stops.txt` contains **41 parent stations** (`location_type: 1`). Phase 07.4.1 strict evidence audit classified all mappings based on evidentiary strength rather than distance thresholds or internal config files:
     - **20 exact code matches** (`SWN`, `STV`, `SKP`, `STG`, `SNW`, `STC`, `SHC`, `SGE`, `STL`, `SLM`, `SAL`, `SAP`, `SEG`, `SNP`, `SKM`, `SPC`, `SSN`, `SAE`, `SAT`, `SAN`). Note: Measures lexical code alignment; 6 North Chennai stations exhibit coordinate offsets of 893m–1,512m.
     - **0 confirmed physical aliases (Class 1)**: Zero aliases possess independently published authoritative crosswalk records from CMRL or CUMTA in open data.
     - **2 divergent facility / access-point aliases (Class 2)**: `SCMBT → SCM` (996m, catalogue coordinate matches MTC CMBT bus bays centroid, whereas GTFS node `211` is the elevated metro station on 100 Feet Road), `SNG → SOT` (1,091m, catalogue point in residential Nanganallur, whereas GTFS node `115` is the metro station on GST Road).
     - **19 provisional / likely matches (Class 3)**: Plausible matches based on local name/distance inferences lacking authoritative external crosswalks (13 stations: `SMC`, `SGD`, `STMNT`, `SSD`, `SKB`, `SND`, `STM`, `SDMS`, `SVD`, `SMD`, `SLIC`, `STN`, `SEK`), documented coordinate discrepancies (4 stations: `SMB`, `SWP`, `STP`, `SAB`), or unserved commercial extensions (2 stations: `SWND`, `STVT`).
     - **0 unresolved or incorrect matches (Class 4)**.
   - **Exact Code Matches + Confirmed Aliases**: **20 of 41 stations (48.8%)** (20 exact code matches + 0 confirmed aliases). Note: The legacy description "23 confirmed matches" (56.1%) conflated lexical code matches with unverified aliases whose corroboration was only internal repo configuration (`network_scope.json`).
   - **Physical Network Representation**: **41 of 41 stations (100.0%)** have corresponding physical parent stations in `stops.txt`.
   - **Timetable Commercial Coverage**: **39 of 41 stations (95.1%)** have scheduled commercial trips in this 2021 snapshot (625 trips). Physical station presence (41/41) is strictly distinguished from commercial timetable coverage (39/41).
   - **2 stations** (`SWND` Wimco Nagar Depot and `STVT` Tiruvottiyur Theradi) lack active commercial timetable trips in `stop_times.txt`. Independent audit confirmed that **neither the parent station IDs nor ANY of their child platform/entrance IDs** (`141_1`, `144_1`, `144_2`) appear in `stop_times.txt`. Both stations opened for passenger service in March 2022, postdating this 2021 snapshot.
5. **Strict Routing Isolation & Feed Blockers**:
   - `readyForJourneyRouting: false` is strictly enforced on the manifest.
   - Status is recorded as **`EXPIRED_CALENDAR`** due to `calendar.txt` validity ending on **2021-12-31**.
   - Three active feed-level blockers prevent production journey routing:
     1. `FEED_EXPIRED_CALENDAR`: All 1 calendar services expired before current operating date.
     2. `FEED_MISSING_EXTENSION_TIMETABLES`: Stations SWND, STVT lack commercial schedules in this 2021 snapshot.
     3. `FEED_UNCONFIRMED_DATA_LICENSE`: Underlying CMRL timetable redistribution rights are UNCONFIRMED.
   - The Metro dataset is maintained completely separate from Suburban Rail (`data/suburban_rail/`) and MTC bus data (`data/mtc_bus/`). Frontend and backend searches confirm zero leakage into production routing.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Chennai Metro (CMRL) GTFS Ingestion Architecture (Phase 07 & 07.1)                   │
│                                                                                                         │
│   Official & Community Investigation (chennaimetrorail.org, test.cumta.org, ungalsoththu/ChennaiGTFS)   │
│   Found: 10 GTFS Static files with full timetables, shapes, fares, and platform nodes                   │
│              │                                                                                          │
│              ▼                                                                                          │
│   [ data/chennai_metro/imported/ ]  <=== IMMUTABLE RAW SNAPSHOT                                         │
│   10 text files (716.2 KB, 716,157 B) with verified SHA-256 checksums (100% cryptographic match)        │
│              │                                                                                          │
│              ├─► agency.txt (1 CMRL agency record)                                                      │
│              ├─► routes.txt (28 Metro routes, type 1 Subway)                                            │
│              ├─► stops.txt (254 nodes: 41 parent stations, 213 platforms/entrances, lifts, ramps)       │
│              ├─► trips.txt (625 timetable trips)                                                        │
│              ├─► stop_times.txt (12,503 scheduled stop times)                                           │
│              ├─► calendar.txt (WD service: 2021-04-20 to 2021-12-31 ===> EXPIRED)                       │
│              ├─► fare_attributes.txt (7 fare tiers) & fare_rules.txt (1,600 zone rules)                 │
│              ├─► shapes.txt (13 shapes, 4,231 geometry points) & transfers.txt (50 transfers)           │
│              │                                                                                          │
│              ▼                                                                                          │
│   [ transitIngestionPipeline.js ] ===> Strict GTFS & Catalogue Validation                               │
│              │                                                                                          │
│              ├─► Foreign Key Referential Integrity: 100% (0 broken references)                          │
│              ├─► Spatial Integrity: 100% (0 out-of-bounds coordinates)                                   │
│              ├─► Timing Integrity: 100% (625 monotonic trips, 0 inversions/regressions)                 │
│              ├─► Catalogue Reconciliation: 41/41 physical stations matched (100.0%)                     │
│              ├─► Missing Extensions: SWND (Wimco Depot) & STVT (Theradi) postdate snapshot             │
│              └─► Calendar Status: EXPIRED (Service ended 2021-12-31)                                    │
│              │                                                                                          │
│              ▼                                                                                          │
│   [ ingestion_manifest.json ]                                                                           │
│   status: "EXPIRED_CALENDAR"                                                                            │
│   readyForJourneyRouting: FALSE (Production routing strictly disabled)                                  │
│   activeBlockers: [ FEED_EXPIRED_CALENDAR, FEED_MISSING_EXTENSION_TIMETABLES, FEED_UNCONFIRMED_DATA_LICENSE ] │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Candidate Source Investigation & Provenance Audit

### 1.1 Evaluated Data Portals

| Candidate Portal | Publisher / Role | Exact URL | Accessibility & Audit Findings |
| :--- | :--- | :--- | :--- |
| **CMRL Official Website** | Chennai Metro Rail Limited (Official Operator) | `https://chennaimetrorail.org/` | **Verified Accessible**. Authoritative for official station names, fare rules, facility information, and accessibility policies. **Blocker**: Does not host any downloadable GTFS static feeds, GTFS-RT APIs, or machine-readable timetable datasets. |
| **CMRL Travel Planner** | Chennai Metro Rail Limited (Official Web App) | `https://travelplanner.chennaimetrorail.org/` | **Verified Accessible**. Interactive web application for point-to-point journey lookups. Underlying APIs are proprietary and do not expose static GTFS downloads. |
| **CUMTA Transit Portal** | Chennai Unified Metropolitan Transport Authority | `https://transitdata.cumta.in/` | **Inaccessible**. DNS host unresolvable (`lookup transitdata.cumta.in: no such host`). |
| **CUMTA Open Data Portal** | Chennai Unified Metropolitan Transport Authority | `https://opendata.cumta.org/` | **Inaccessible**. DNS host unresolvable (`ENOTFOUND`). |
| **CUMTA Test Server** | CUMTA GIS Fellowship (Staging Host) | `https://test.cumta.org/` | **Staging Mirror Origin (Not Confirmed Publisher)**. Host where CUMTA GIS fellowship staged unauthenticated test static GTFS archives (`CMRL gtfs.zip`, `Southern Railways.zip`, `static_mtc_gtfs_data.zip`). **Audit Finding**: CUMTA is not confirmed as the publisher of this feed; the sole agency entity defined within the feed metadata is CMRL. |
| **UngalSoththu Mirror** | Open-Data Community Initiative | `https://github.com/ungalsoththu/ChennaiGTFS/tree/main/data/cmrl` | **Verified Accessible & Usable**. Clean directory mirror of the 10 GTFS files. Source commit: `af0742dba777f9657ed6fda2046d6c2a721d630b` (Release `v0.2.0`, published `2026-10-04`). Scripts licensed under ODbL/PDDL; timetable redistribution rights remain unconfirmed. |

### 1.2 Four-Dimension Temporal Audit

| Temporal Dimension | Verified Value | Evidence & Meaning |
| :--- | :--- | :--- |
| **Source Retrieval Date** | **`2026-10-27`** | Calendar date AccessRoute retrieved and verified the raw dataset into the local repository. |
| **Upstream Git Commit Date** | **`2026-10-04`** | Timestamp of commit `af0742dba777f9657ed6fda2046d6c2a721d630b` in `ungalsoththu/ChennaiGTFS`. **CRITICAL**: Neither retrieval date nor commit date represents operational timetable currency. |
| **Feed Publication Date** | **`2021-04-20` (Inferred)** | Inferred from `calendar.txt` start date (`20210420`). Note: `feed_info.txt` is absent from this feed. |
| **Scheduled Service Calendar Range** | **`2021-04-20` to `2021-12-31`** | Stated in `calendar.txt` (`service_id: WD`, `start_date: 20210420`, `end_date: 20211231`). |
| **Calendar Expiry Status** | **`EXPIRED`** | Service calendar ended on December 31, 2021. Relative to current operating dates, the static timetable is historical. |
| **Verified Operational Currency** | **`UNVERIFIED_HISTORICAL`** | Current CMRL operations rely on dynamic operational dispatch. Current operating timetables and headway specifications are unimported and unverified. |

### 1.3 Licensing & Legal Terms

- **Compilation Scripts & Mirror Repository**: Distributed under **Open Database License (ODbL) / PDDL** by the community maintainers.
- **Underlying Transit Timetable & Fare Data**: Published by **Chennai Metro Rail Limited (CMRL)**. CMRL has not issued an open data grant permitting commercial redistribution of raw timetables.
- **Legal Classification**: Recorded explicitly as **`UNCONFIRMED`** in [`ingestion_manifest.json`](file:///c:/AccessRoute/data/chennai_metro/imported/ingestion_manifest.json). This generates an active feed-level blocker (`FEED_UNCONFIRMED_DATA_LICENSE`).

---

## 2. Acquired File Inventory & Cryptographic Checksums

All 10 GTFS files were downloaded directly from upstream commit `af0742dba777f9657ed6fda2046d6c2a721d630b` into [`data/chennai_metro/imported/`](file:///c:/AccessRoute/data/chennai_metro/imported/). Source files are preserved 100% byte-for-byte:

| Filename | Bytes | SHA-256 Checksum | GTFS Role | Immutability Status |
| :--- | :---: | :--- | :--- | :---: |
| [`agency.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/agency.txt) | 300 B | `8e96c79f3d2fff5b5a982f1c2c95b30508259a0977997833a50d6cbbc611fe5e` | Transit Agency Info (CMRL) | **VERIFIED IMMUTABLE** |
| [`calendar.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/calendar.txt) | 123 B | `00c8d79e1bffa04abfecce8d05606101b24cc76c41e8e44c80c86c5349e7aebc` | Service Days & Validity | **VERIFIED IMMUTABLE** |
| [`fare_attributes.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/fare_attributes.txt) | 196 B | `52ea5b7b3dc2ddcf25485d141570b77796f060272ea863f49ae59d7ad2b5bdcc` | Fare Categories (₹10–₹60) | **VERIFIED IMMUTABLE** |
| [`fare_rules.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/fare_rules.txt) | 20,842 B | `786917869bf3a56860f3213ccd093d580c252e09ba2aa7ca88f80e1bd9074c3a` | Zone-to-Zone OD Matrix (1,600 rules) | **VERIFIED IMMUTABLE** |
| [`routes.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/routes.txt) | 2,343 B | `46ee8a8673029c0526ee783b6c946070c6987f8790f4c3e8836dc6f6939f10d4` | 28 Metro Line Routes | **VERIFIED IMMUTABLE** |
| [`shapes.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/shapes.txt) | 178,555 B | `901e08e7e8a06661b18d426048a6154f6bac317b85159046773a9a5a29dcb8ab` | 13 Line Track Alignments (4,231 pts) | **VERIFIED IMMUTABLE** |
| [`stops.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/stops.txt) | 26,901 B | `618bf5eb45ee2445bcd29acd61837cfa174d65fd8fbbaee6534e3c2309bd2304` | 254 Stations & Nodes | **VERIFIED IMMUTABLE** |
| [`stop_times.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/stop_times.txt) | 457,077 B | `1e2f355ba0c97e8570267777b05ec7562b5ccdf0b53ed60d91f2096faff518b0` | 12,503 Stop Times | **VERIFIED IMMUTABLE** |
| [`transfers.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/transfers.txt) | 1,338 B | `52937473eb8c9314fab8dfb41f46d0b79e543871c0caf7a06eb8b010c1637dad` | 50 Platform Transfer Rules | **VERIFIED IMMUTABLE** |
| [`trips.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/trips.txt) | 28,482 B | `2ae2e6c419cc6280ba023dad96454f37729223cb8d49d4c72d7c2772dbe86e40` | 625 Timetable Trips | **VERIFIED IMMUTABLE** |
| **Total** | **716,157 B** | — | **10 GTFS Static Tables** | **100% PRESERVED** |

---

## 3. GTFS Validation Findings

### 3.1 Structural & Relational Integrity

The imported feed was validated through [`backend/services/ingestion/gtfsValidator.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsValidator.js) and independently verified:

- **Mandatory Tables**: All 5 mandatory GTFS tables (`agency.txt`, `routes.txt`, `stops.txt`, `trips.txt`, `stop_times.txt`) are present and syntactically valid.
- **Calendar Consistency**: `calendar.txt` is present and defines service `WD`.
- **Foreign Key References**: **Zero broken references** across all foreign key relationships:
  - Every `route.agency_id` refers to an existing agency (`CMRL`).
  - Every `trip.route_id` refers to an existing route in `routes.txt`.
  - Every `trip.service_id` refers to an existing service in `calendar.txt` (`WD`).
  - Every `trip.shape_id` refers to an existing shape in `shapes.txt`.
  - Every `stop_time.trip_id` refers to an existing trip in `trips.txt`.
  - Every `stop_time.stop_id` refers to an existing stop in `stops.txt`.
  - Every `stop.parent_station` refers to an existing parent station.
  - Every `transfer.from_stop_id` and `transfer.to_stop_id` refers to an existing stop.
  - Every `fare_rule.fare_id` refers to an existing entry in `fare_attributes.txt`.
- **Duplicate Identifiers**: **Zero duplicate identifiers** found across all tables.

### 3.2 Geographic & Spatial Bounds

- **Coordinate Bounds**:
  - **Stops (`stops.txt`)**: Latitude span `12.9807° N` to `13.1843° N`, Longitude span `80.1639° E` to `80.3091° E`.
  - **Shapes (`shapes.txt`)**: Latitude span `12.9808° N` to `13.1843° N`, Longitude span `80.1637° E` to `80.3091° E`.
  - *(Audit Note: The earlier preliminary documentation recorded a narrower subset of 12.9947° N–13.1754° N / 80.1951° E–80.3065° E, which was an artifact of measuring only St. Thomas Mount to Wimco Nagar while omitting Airport and Wimco Nagar Depot).*
- **Bounding Box Conformity**: 100% of the 254 stop nodes and 100% of the 4,231 shape points fall strictly within AccessRoute's Chennai multi-county scope (`12.50`–`13.50° N`, `79.50`–`80.40° E`). **Zero out-of-bounds coordinates**.

### 3.3 Trip Timing Analysis

- **Total Trips Analyzed**: 625 trips.
- **Chronological Progression**: 100% of trips (625/625) exhibit strictly increasing departure and arrival times.
- **Same-Stop Inversions**: **0**.
- **Progression Regressions**: **0**.
- **Single-Stop Trips**: **0** (no incomplete shuttle trips).
- **Midnight Rollovers**: **0**.
- **Operating Hours Span**: Earliest trip departs at **`05:27:03`** (Central to Airport); latest trip terminates at **`21:48:57`** (St. Thomas Mount to Central). Standard daytime/evening metro operations.

---

## 4. Curated Catalogue Reconciliation & Extension Analysis

### 4.1 Station Matching & Individual Alias Audit

The feed stops were reconciled against AccessRoute's curated catalogue of 41 operational CMRL stations ([`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json)):

- **Curated Catalogue Total**: 41 stations.
- **GTFS Physical Parent Stations**: 41 stations in `stops.txt` (`location_type: '1'`).
- **Exact Code Matches (20 stations)**: `SWN`, `STV`, `SKP`, `STG`, `SNW`, `STC`, `SHC`, `SGE`, `STL`, `SLM`, `SAL`, `SAP`, `SEG`, `SNP`, `SKM`, `SPC`, `SSN`, `SAE`, `SAT`, `SAN`. Note: Measures lexical code alignment; 6 North Chennai stations exhibit coordinate offsets of 893m–1,512m.
- **Confirmed Physical Aliases (Class 1, 0 stations)**: Zero aliases possess independently published authoritative crosswalk records from CMRL or CUMTA in open data.
- **Interchange / Divergent Facility Aliases (Class 2, 2 stations)**:
  - `SCMBT → SCM` (996m): Catalogue coordinate matches the MTC bus terminal concourse/bays centroid (`mtc_cmbt` in `verified_hubs.json`), whereas GTFS stop `211` represents the elevated metro rail station on 100 Feet Road. Represented as separate modal nodes with an interchange link, not an identical station alias.
  - `SNG → SOT` (1,091m): Catalogue coordinate placed in residential Nanganallur near Palavanthangal; GTFS stop `115` is the elevated station on GST Road adjacent to OTA subway.
- **Provisional / Likely Matches (Class 3, 19 stations)**:
  - *Close-Proximity Local Inferences (delta ≤ 500m, 13 stations)*: `SMC` (278m), `SGD` (86m), `STMNT` (135m), `SSD` (19m), `SKB` (21m), `SND` (61m), `STM` (222m), `SDMS` (228m), `SVD` (242m), `SMD` (262m), `SLIC` (339m), `STN` (408m), `SEK` (499m) — name and corridor positions match, but local inferences without independently published official CMRL acronym crosswalks.
  - *Corridor / Coordinate Discrepancies (delta 635m–944m, 4 stations)*: `SMB → SME` (635m), `SWP → SWA` (811m), `STP → STR` (937m), `SAB → SAR` (944m) — corridor matches with documented catalogue coordinate offsets.
  - *Unserved Commercial Extensions (zero scheduled trips, 2 stations)*: `SWND → SWD` (1,027m, 0 trips), `STVT → STT` (904m, 0 trips) — physical parent stops present in `stops.txt`, but 0 scheduled commercial trips in 2021 feed (commercial passenger opening was March 2022).
- **Unresolved Matches (Class 4, 0 stations)**: Zero fictitious or unresolved stations.
- **Physical Representation Coverage**: **100.0% (41 of 41 stations)**.
- **Exact Code Matches + Confirmed Aliases**: **48.8% (20 of 41 stations)** (20 exact code matches + 0 confirmed aliases; legacy "23 confirmed matches" description corrected).
- **Timetable Commercial Service Coverage**: **95.1% (39 of 41 stations)** actively served by 625 trips.

#### Resolution of Coordinate Discrepancies & Transcription Inconsistencies

An audit of Git history and stored file contents resolved previous report discrepancies:
1. **`SWND` Stored Coordinates**: `data/chennai_metro/verified_stations.json:44` stores `13.1754, 80.3065`. GTFS Stop `141` stores `13.184280, 80.309108`. The Haversine distance is 1,027.0 m (~1,025m). Spurious values (`13.1764, 80.3012` and `13.1843, 80.3060`) quoted in previous discussion text were transcription errors. The catalogue file was never modified.
2. **`STVT` Stored Coordinates**: `data/chennai_metro/verified_stations.json:103` stores `13.1518, 80.3010`. GTFS Stop `144` stores `13.159826, 80.302336`. The Haversine distance is 904.1 m (~903m). Spurious values (`13.1568, 80.2974` and `13.1646, 80.3006`) were transcription errors in conversational text.
3. **Corridor Codes**: GTFS codes for Meenambakkam, Washermanpet, and Tondiarpet are `SME`, `SWA`, and `STR`. Codes `MMB`, `WPT`, and `TLR` do not exist in the feed.

*(For the complete line-by-line evidence audit and confidence ratings, see [`docs/CHENNAI_METRO_ALIAS_AUDIT.md`](file:///c:/AccessRoute/docs/CHENNAI_METRO_ALIAS_AUDIT.md)).*

#### Audit Table of all 21 Code Alias Mappings

| Catalogue Code | GTFS Code (`zone_id`) | GTFS ID | Station Name (Catalogue) | GTFS Official Stop Name (`stops.txt`) | Stored Catalogue Coords | Stored GTFS Station Coords | Spatial Offset | Fare Rules | Timetable Trips | Evidence-Based Classification |
| :---: | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `SMC` | `SCC` | `104` | Central Metro | CENTRAL METRO | 13.0827, 80.2707 | 13.081428, 80.272908 | **278 m** | Yes | 589 trips | **Class 3: PROVISIONAL** (Local Inference — Hub) |
| `SGD` | `SGU` | `113` | Guindy | GUINDY METRO | 13.0084, 80.2131 | 13.009166, 80.213030 | **86 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference — Hub) |
| `STMNT` | `SMM` | `217` | St. Thomas Mount | ST.THOMAS MOUNT | 12.9948, 80.1988 | 12.994749, 80.197554 | **135 m** | Yes | 144 trips | **Class 3: PROVISIONAL** (Local Inference — Hub) |
| `SCMBT` | `SCM` | `211` | CMBT | CMBT METRO | 13.0694, 80.1948 | 13.068483, 80.203946 | **996 m** | Yes | 310 trips | **Class 2: DIVERGENT_FACILITY** (MTC Bus Centroid) |
| `SNG` | `SOT` | `115` | Nanganallur Road | NANGANALLUR ROAD | 12.9905, 80.1915 | 12.999966, 80.194156 | **1,091 m** | Yes | 460 trips | **Class 2: DIVERGENT_FACILITY** (Neighborhood Core) |
| `SSD` | `SSA` | `111` | Saidapet | SAIDAPET METRO | 13.0235, 80.2285 | 13.023599, 80.228360 | **19 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SKB` | `SKO` | `210` | Koyambedu | KOYAMBEDU | 13.0735, 80.1950 | 13.073361, 80.194875 | **21 m** | Yes | 282 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SND` | `SCR` | `110` | Nandanam | NANDANAM | 13.0315, 80.2405 | 13.031651, 80.241043 | **61 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `STM` | `STI` | `209` | Thirumangalam | THIRUMANGALAM | 13.0850, 80.1995 | 13.085206, 80.201539 | **222 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SDMS` | `SGM` | `108` | AG-DMS | AG-DMS | 13.0465, 80.2490 | 13.044683, 80.248033 | **228 m** | Yes | 295 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SVD` | `SVA` | `213` | Vadapalani | VADAPALANI | 13.0515, 80.2100 | 13.050697, 80.212075 | **242 m** | Yes | 310 trips | **Class 3: PROVISIONAL** (Bus Terminus Centroid) |
| `SMD` | `SMA` | `102` | Mannadi | MANNADI | 13.0935, 80.2875 | 13.095420, 80.286094 | **262 m** | Yes | 295 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SLIC` | `SLI` | `106` | LIC | LIC | 13.0620, 80.2678 | 13.064555, 80.266101 | **339 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `STN` | `STE` | `109` | Teynampet | TEYNAMPET | 13.0405, 80.2450 | 13.037118, 80.246461 | **408 m** | Yes | 294 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SEK` | `SSI` | `215` | Ekkattuthangal | EKKATTUTHANGAL | 13.0210, 80.2055 | 13.016521, 80.205282 | **499 m** | Yes | 310 trips | **Class 3: PROVISIONAL** (Local Inference) |
| `SMB` | `SME` | `116` | Meenambakkam | MEENAMBAKKAM METRO | 12.9840, 80.1810 | 12.987751, 80.176587 | **635 m** | Yes | 460 trips | **Class 3: PROVISIONAL** (Coordinate Discrepancy) |
| `SWP` | `SWA` | `101` | Washermanpet | WASHERMENPET METRO | 13.1025, 80.2865 | 13.107218, 80.280787 | **811 m** | Yes | 296 trips | **Class 3: PROVISIONAL** (Coordinate Discrepancy) |
| `STVT` | `STT` | `144` | Tiruvottiyur Theradi | THERADI METRO | 13.1518, 80.3010 | 13.159826, 80.302336 | **904 m** | Yes | **0 trips** | **Class 3: PROVISIONAL** (Unserved Commercial Service) |
| `STP` | `STR` | `148` | Tondiarpet | TONDIARPET METRO | 13.1165, 80.2925 | 13.123811, 80.288199 | **937 m** | Yes | 295 trips | **Class 3: PROVISIONAL** (Coordinate Discrepancy) |
| `SAB` | `SAR` | `212` | Arumbakkam | ARUMBAKKAM | 13.0615, 80.2030 | 13.062006, 80.211703 | **944 m** | Yes | 310 trips | **Class 3: PROVISIONAL** (Coordinate Discrepancy) |
| `SWND` | `SWD` | `141` | Wimco Nagar Depot | WIMCO NAGAR DEPOT | 13.1754, 80.3065 | 13.184280, 80.309108 | **1,027 m** | **No** | **0 trips** | **Class 3: PROVISIONAL** (Unserved Commercial Service) |

### 4.2 Missing Commercial Extension Timetables & Child Node Verification

While all 41 stations exist as physical parent stations in `stops.txt`, analysis of `stop_times.txt` revealed that **2 stations have zero scheduled trips**:
1. **`SWND` / `SWD` (Wimco Nagar Depot Station)**: Parent station ID `141`.
2. **`STVT` / `STT` (Tiruvottiyur Theradi Metro)**: Parent station ID `144`.

#### Independent Child Node Inspection
To verify whether trips were merely assigned to child platform IDs rather than parent stations, every associated child node in `stops.txt` was cross-checked against `stop_times.txt`:
- **Wimco Nagar Depot (`141`)**: Has child entrance/platform node `141_1` ("E1 ENTRANCE STAIRCASE & PHYSICALLY CHALLENGED RAMP").
  - Neither parent ID `141` nor child ID `141_1` appears anywhere in `stop_times.txt`.
- **Tiruvottiyur Theradi (`144`)**: Has child entrance/platform nodes `144_1` ("E1 ENTRANCE PHYSICALLY CHALLENGED RAMP") and `144_2` ("E2 ENTRANCE PHYSICALLY CHALLENGED RAMP").
  - Neither parent ID `144` nor child IDs `144_1` or `144_2` appear anywhere in `stop_times.txt`.

**Conclusion**: Both stations are **genuinely absent** from scheduled commercial trips in this feed, rather than masked by child platform identifiers.

**Historical & Operational Context**:
- Phase 1 North Extension (Washermanpet to Wimco Nagar) opened in February 2021.
- Wimco Nagar Depot passenger extension and Tiruvottiyur Theradi station were under construction when this feed was generated in April 2021, and only commenced commercial passenger service in **March 2022**.
- Consequently, this 2021 snapshot contains physical coordinates and platform definitions for both stations, but lacks commercial schedule records.
- This condition is explicitly flagged as feed-level blocker **`FEED_MISSING_EXTENSION_TIMETABLES`**.

---

## 5. Feed-Level Blockers & Routing Readiness

The ingestion manifest records **`readyForJourneyRouting: false`** and **`status: "EXPIRED_CALENDAR"`**. The following three feed-level blockers are formally documented:

1. **`FEED_EXPIRED_CALENDAR`**:
   - `calendar.txt` specifies service date range `20210420` to `20211231`.
   - All services ended on December 31, 2021.
   - Operating routing engines on expired service calendars produces zero active departures or incorrect holiday schedules.
2. **`FEED_MISSING_EXTENSION_TIMETABLES`**:
   - Extension stations `SWND` (Wimco Nagar Depot) and `STVT` (Tiruvottiyur Theradi) are unserved in `stop_times.txt`.
   - Passengers traveling to/from Wimco Nagar Depot or Theradi cannot be routed using this timetable.
3. **`FEED_UNCONFIRMED_DATA_LICENSE`**:
   - Redistribution rights for CMRL transit timetable schedules remain unconfirmed.

### Operational Data Separation & Phase 08 Prerequisites

For future routing integration (Phase 08):
- **Strict Prohibition on Synthetic Data**: Synthesizing artificial departures or unverified timetables for missing stations (`SWND`, `STVT`) or expired calendars is strictly **prohibited**.
- **Feed Blockers Maintained**: The imported 2021 feed remains strictly blocked (`readyForJourneyRouting: false`) from live passenger journey planning.
- **Separation of Verified Facts vs Assumptions**:
  - *Verified Facts*: 41 physical parent stations exist in GTFS `stops.txt`; 39 stations have 625 scheduled trips in historical `stop_times.txt` (valid Apr–Dec 2021); fare rules define a ₹10–₹60 zonal structure across 40 stations (`SWD` absent).
  - *Proposed Modeling Assumptions (Unverified)*: Any headway values (e.g. 3–7 min peak, 12–15 min off-peak) are unverified heuristics and must NOT be labeled as official CMRL feed data.
  - *Unavailable Data (Prerequisites)*: An active, unexpired CMRL GTFS schedule or verified real-time API containing current operational timetables and commercial service records for the Wimco Nagar Depot extension must be obtained and verified before live journey routing can be activated.

---

## 6. Verification Test Suites & Regression Verification

Five comprehensive test suites were executed to verify Phase 07 implementation and ensure zero regressions across the codebase:

```bash
npm run test:ingestion
npm run test:transit
npm run test:api
npm run test:ai
npm run build
```

### Actual Test Execution Output

| Test Command | Suites / Tests | Result | Execution Time |
| :--- | :---: | :---: | :---: |
| `npm run test:ingestion` | 31 Suites, **253 Tests** | **PASS** | 2.1s |
| `npm run test:transit` | 6 Suites, **49 Tests** | **PASS** | 1.8s |
| `npm run test:api` | 14 Test Cases, **44 Assertions** | **PASS** | 2.2s |
| `npm run test:ai` | 7 AI Scenarios | **PASS** | 1.1s |
| `npm run build` | Vite Client Production Bundle | **PASS** (1,503 kB minified) | 810ms |
| **Total Test Coverage** | **353 automated assertions** | **100% PASS** | **Zero Failures** |

### Focused Ingestion Suites Added for Metro (Suites 27–31)

- **Suite 27: Chennai Metro Source Verification & File Inventory**: Validates existence of directory and manifest; confirms all 10 source files match cryptographic SHA-256 hashes byte-for-byte; verifies manifest metadata.
- **Suite 28: Chennai Metro Record Counts & Referential Integrity**: Validates 1 agency (`CMRL`), 28 routes (`route_type: 1`), 254 stop nodes (41 parent stations), 625 trips, 12,503 stop times, 1 calendar row, 7 fare tiers, 1,600 fare rules, 50 transfers; confirms zero broken foreign keys and zero duplicate IDs.
- **Suite 29: Chennai Metro Monotonic Trip Timing & Operational Bounds**: Verifies all 625 trips have strictly monotonic chronological progression; verifies 0 inversions, 0 regressions, 0 single-stop shuttles, 0 midnight rollovers; verifies operating window (05:27:03 to 21:48:57).
- **Suite 30: Chennai Metro Expired Calendar & Blocker Enforcement**: Confirms strict validation fails on expired calendar; verifies `calendarStatus === 'EXPIRED'`; confirms retention of all 3 feed-level blockers; asserts `readyForJourneyRouting === false`.
- **Suite 31: Chennai Metro Station Reconciliation & Mode Isolation**: Confirms 100.0% physical station reconciliation (20 exact, 21 alias); flags 2 missing extension stations (`SWND`, `STVT`); verifies complete directory and manifest isolation between Chennai Metro, Suburban Rail, and MTC Bus.

---

## 7. Git Working Tree Status

In strict adherence to project boundaries:
- **No changes committed, pushed, reset, or cleaned**.
- All uncommitted changes from prior phases and Phase 07 remain intact.
- Secrets (`.env`) remain untouched and protected.

```
Changes to be committed:
	deleted:    .env

Changes not staged for commit:
	modified:   .env.example
	modified:   .gitignore
	modified:   backend/middleware/validator.js
	modified:   backend/server.js
	modified:   backend/tests/api.test.js
	modified:   package.json
	modified:   src/utils/geminiClient.js
	modified:   tests/ai.test.js

Untracked files:
	KisanSathi-AI/
	backend/routes/ai.js
	backend/services/
	backend/tests/fixtures/
	backend/tests/ingestion.test.js
	backend/tests/transitData.test.js
	data/
	docs/
```

---

## 8. Phase 07.1 Independent Audit Results & Verification Sign-Off

Phase 07.1 performed an independent, zero-assumption audit across the four mandatory audit areas:

### 8.1 Summary of Independent Verification

| Verification Dimension | Phase 07 Preliminary Claim | Phase 07.1 Independent Audit Finding | Audit Status |
| :--- | :--- | :--- | :---: |
| **Source Provenance** | Sourced via UngalSoththu mirror from CUMTA staging | **Verified**. Commit `af0742dba777f9657ed6fda2046d6c2a721d630b` (Release `v0.2.0`) confirmed. Sole agency in `agency.txt` is CMRL (`Asia/Kolkata`). CUMTA was an intermediate test staging server (`test.cumta.org`), not the confirmed publisher. | **VERIFIED** |
| **Licensing** | ODbL / PDDL for mirror scripts; underlying timetable unconfirmed | **Verified**. Compilation tooling is ODbL/PDDL; CMRL timetable redistribution rights remain strictly `UNCONFIRMED`. Blocker `FEED_UNCONFIRMED_DATA_LICENSE` retained. | **VERIFIED** |
| **Temporal Integrity** | 2021 snapshot, expired 2021-12-31 | **Verified**. Feed start date 2021-04-20 is inferred from `calendar.txt` start date (`20210420`), as `feed_info.txt` is absent. Recent retrieval (2026-10-27) and Git commit (2026-10-04) do NOT represent operational timetable currency. `calendarStatus: EXPIRED`. | **VERIFIED** |
| **File Byte Sum** | Preliminary note cited 715,699 B | **Corrected**. Recalculated exact sum of all 10 raw files is **716,157 B** (~716.2 KB). All 10 SHA-256 hashes cryptographically confirmed byte-for-byte. | **CORRECTED & VERIFIED** |
| **Spatial Bounds** | Preliminary note cited 12.9947–13.1754° N / 80.1951–80.3065° E | **Corrected**. Stops actually span `12.9807° N` to `13.1843° N` and `80.1639° E` to `80.3091° E`; shapes span `12.9808° N` to `13.1843° N` and `80.1637° E` to `80.3091° E`. 100% within Chennai scope (`12.50`–`13.50° N`, `79.50`–`80.40° E`). | **CORRECTED & VERIFIED** |
| **Station Reconciliation** | 41/41 stations (20 exact, 21 aliases) | **Audited & Formally Classified**. 20 exact code matches (48.8%); 0 confirmed aliases (0.0%); 2 divergent facilities (`SCMBT` bus hub vs rail station, `SNG` residential centroid vs GST Rd); 19 provisional matches (13 local proximity/name inferences including `SMC`, `SGD`, `STMNT` + 4 corridor coordinate discrepancies + 2 unserved extensions). Exact code matches + confirmed aliases is 48.8% (20/41). Physical representation is 100.0% (41/41). Timetable commercial coverage is 95.1% (39/41). See `docs/CHENNAI_METRO_ALIAS_AUDIT.md`. | **AUDITED & VERIFIED** |
| **Missing Extensions** | SWND and STVT lack scheduled trips | **Independently Verified**. Both parent station IDs (`141`, `144`) and all associated child platform/entrance IDs (`141_1`, `144_1`, `144_2`) are completely absent from `stop_times.txt`. Both opened March 2022. Blocker `FEED_MISSING_EXTENSION_TIMETABLES` retained. | **VERIFIED** |
| **Trip Chronology** | 625 trips, 12,503 stop times | **Independently Verified**. 0 inversions, 0 regressions, 0 single-stop shuttles, 0 midnight rollovers. Operating window 05:27:03 to 21:48:57. | **VERIFIED** |
| **Foreign Key Integrity** | Zero broken references | **Independently Verified**. Zero broken foreign keys across agency, routes, trips, calendar, shapes, stops, stop_times, transfers, and fares. | **VERIFIED** |
| **Production Isolation** | Complete mode isolation | **Independently Verified**. `data/chennai_metro/imported/` has zero occurrences in live journey planning, departure predictions, or vehicle tracking code across frontend and backend. `readyForJourneyRouting: false` strictly enforced. | **VERIFIED** |
| **Cross-Mode Validator Safety** | Suburban Rail validator behavior untouched | **Independently Verified**. Mode branching in `reconcileCuratedCatalogue` isolates metro logic; default mode remains `suburban_rail`. Suburban rail test suite passes 100%. | **VERIFIED** |

### 8.2 Test Suite Execution Sign-Off

All five required regression suites execute cleanly with zero errors:

```
1. npm run test:ingestion  ===> 31 Suites, 253 Tests PASS (2.1s)
2. npm run test:transit    ===> 6 Suites, 49 Tests PASS (1.8s)
3. npm run test:api        ===> 14 Test Cases, 44 Assertions PASS (2.2s)
4. npm run test:ai         ===> 7 AI Scenarios PASS (1.1s)
5. npm run build           ===> Vite Client Production Bundle PASS (1,503 kB minified, 1.92s)
```

### 8.3 Unresolved Blockers & Prerequisites for Phase 08

The following three feed-level blockers remain active and strictly enforced:
1. `FEED_EXPIRED_CALENDAR`: Calendar validity ended on 2021-12-31. Historical timetables cannot be used for live routing. Synthetic schedule generation is prohibited; an active official schedule feed or verified headway model is required.
2. `FEED_MISSING_EXTENSION_TIMETABLES`: Stations SWND (Wimco Nagar Depot) and STVT (Tiruvottiyur Theradi) lack scheduled timetable records in the 2021 feed. Commercial schedule data for these stations is an unresolved prerequisite before they can be routed.
3. `FEED_UNCONFIRMED_DATA_LICENSE`: Underlying CMRL timetable redistribution rights remain unconfirmed. Dataset must remain restricted to development/educational research until formal open data licensing is published.

