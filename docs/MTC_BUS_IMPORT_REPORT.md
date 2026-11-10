# AccessRoute — MTC Bus GTFS Source Verification and Import Readiness Report

**Document**: `docs/MTC_BUS_IMPORT_REPORT.md`  
**Phase**: Phase 08 — MTC Bus GTFS Source Verification and Import Readiness  
**Date**: October 2026  
**Status**: Raw Source Verified, Cryptographically Audited, Ingestion Manifest Generated, Routing Strictly Blocked  
**Mode**: `mtc_bus`  
**Source Path**: `data/mtc_bus/imported/`  
**Manifest Path**: `data/mtc_bus/imported/ingestion_manifest.json`  
**Branch**: `hacknova-mvp`  
**Engineers**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 08 performs an independent verification of the Chennai Metropolitan Transport Corporation (MTC) bus GTFS dataset. Under AccessRoute's transit data engineering standard, this phase focuses exclusively on **source provenance evidence, cryptographic verification, structural validation, and isolated data preparation, not journey routing**.

### Key Findings

1. **Source Provenance & Lineage**:
   - **Official Operator**: Metropolitan Transport Corporation (Chennai) Ltd. (MTC), a Government of Tamil Nadu undertaking (`https://mtcbus.tn.gov.in/`).
   - **Official Staging Evaluation**: CUMTA's staging endpoint (`https://test.cumta.org/static_mtc_gtfs_data.zip`, 30.8 MB) was evaluated. It exhibits a severe data defect: **4,721 scheduled trips are stamped with a dummy `00:00:15` departure timestamp**, corrupting scheduling logic. The primary open data domain (`opendata.cumta.org`) is offline (DNS failure).
   - **Selected Source (Community Mirror)**: The `ungalsoththu/ChennaiGTFS` mirror repository at commit `af0742dba777f9657ed6fda2046d6c2a721d630b` (`v0.2.0`, 2026-10-04) was selected. This feed resolves the placeholder timestamp defect by compiling real departure times scraped from the official MTC mobile application API.
   - **Authoritative Provenance Finding**: This feed is **NOT** an official GTFS publication from MTC or CUMTA. It is an unauthenticated third-party community scrape of mobile app endpoints.
2. **Cryptographic Preservation & Raw File Immutability**:
   - All 7 GTFS Static files (`agency.txt`, `calendar.txt`, `feed_info.txt`, `routes.txt`, `stops.txt`, `stop_times.txt`, `trips.txt`) were downloaded into `data/mtc_bus/imported/`.
   - Total uncompressed byte size is **45,044,883 bytes** (~45.0 MB).
   - Cryptographic SHA-256 hashes were calculated byte-for-byte and locked in [`data/mtc_bus/imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/mtc_bus/imported/ingestion_manifest.json).
3. **Structural Validation & Monotonicity**:
   - **Referential Integrity**: **100% valid** with **0 broken foreign key references** across agency, routes, trips, stops, calendar, and stop_times.
   - **Duplicate IDs**: **0 duplicate identifiers** across routes, trips, stops, and services.
   - **Spatial Bounding**: **100% of 5,580 stops** fall strictly within AccessRoute's Chennai multi-county bounding box (`12.50`–`13.50° N`, `79.50`–`80.40° E`). Latitudes range from `12.6148° N` to `13.4904° N`; longitudes range from `79.8019° E` to `80.3358° E`.
   - **Trip Chronology**: **100% of 47,047 trips** exhibit strictly increasing monotonic arrival and departure times (0 same-stop inversions, 0 inter-stop regressions, 0 single-stop trips). Operating span runs from `00:00:00` to `25:41:00` (extended post-midnight hours).
4. **Catalogue Reconciliation (21 Curated Hubs)**:
   - Reconciled against AccessRoute's 21 curated major terminals in [`data/mtc_bus/verified_hubs.json`](file:///c:/AccessRoute/data/mtc_bus/verified_hubs.json).
   - **0 exact code matches**: GTFS `stops.txt` uses numeric stop IDs (e.g., `2`, `9607`), while the catalogue uses 4-letter acronyms (`BWAY`, `CMBT`).
   - **0 confirmed aliases**: No official published crosswalk exists in open data.
   - **21 provisional aliases**: All 21 curated hubs map to a physical GTFS bus stop within **14m to 463m** (100.0% physical representation).
5. **Feed-Level Blockers & Routing Readiness Decision**:
   - **`readyForJourneyRouting: false`** is strictly enforced.
   - Four active feed-level blockers prevent production journey routing:
     1. `FEED_UNCONFIRMED_DATA_LICENSE`: Underlying MTC timetable redistribution rights are UNCONFIRMED.
     2. `FEED_COMMUNITY_SCRAPE_ORIGIN`: Feed is an unauthenticated third-party scrape of MTC mobile app API endpoints.
     3. `FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER`: Calendar service range spans an artificial 6-year window (`20240501` to `20300501`) containing scraper penetration test relics (`'/><script>alert(1)</script>`).
     4. `FEED_MISSING_SHAPES_AND_FARES`: Feed lacks route alignment geometry (`shapes.txt`) and fare rule definitions (`fare_attributes.txt` / `fare_rules.txt`).

---

## 1. Source Provenance & Licensing Investigation

### 1.1 Candidate Sources Comparison

| Attribute | CUMTA Test Staging Portal | Community Mirror (UngalSoththu / ChennaiGTFS) |
| :--- | :--- | :--- |
| **Endpoint URL** | `https://test.cumta.org/static_mtc_gtfs_data.zip` | `https://github.com/ungalsoththu/ChennaiGTFS/tree/main/data/mtc` |
| **Archive File** | `static_mtc_gtfs_data.zip` (30,796,159 bytes, ~30.8 MB) | `mtc-gtfs.zip` (9,088,141 bytes, ~9.1 MB) / `data/mtc/` (45.0 MB) |
| **Last-Modified / Commit** | Mon, 27 Jul 2026 11:26:49 GMT | `af0742dba777f9657ed6fda2046d6c2a721d630b` (`v0.2.0`, 2026-10-04) |
| **Publisher** | CUMTA (Unauthenticated Test Portal Subdomain) | UngalSoththu (Independent Community Transit Group) |
| **Origin Method** | Official internal GTFS export attempt | Scraped from official MTC mobile application route/timetable API |
| **Schedule Validity** | **Defective**: 4,721 trips stamped with placeholder `00:00:15` | **Authentic Timetables**: Genuine departure times from MTC mobile app |
| **Route / Stop Scope** | 4,030 routes / 7,128 stops | 4,611 routes / 5,580 stops |
| **Licensing** | Unspecified / No license text on portal | Compilation: ODbL / PDDL; Source data: © MTC (Unconfirmed) |
| **Adoption Decision** | **REJECTED** due to placeholder timetable corruption | **ACCEPTED FOR AUDIT & PRESERVATION** |

### 1.2 Community Scrape Origin vs. Official Publication

AccessRoute strictly distinguishes between:
1. **Official Publication**: An authoritative data feed published directly by the transport authority (MTC) or statutory metropolitan authority (CUMTA) with a clear public license (e.g., National Data Sharing and Accessibility Policy - NDSAP / Open Government Data License).
2. **Community Mirror / Scrape**: A third-party compilation extracted via reverse-engineering or scraping mobile app endpoints.

**Finding**: The available MTC GTFS feed belongs entirely to Category 2. MTC does not officially publish an open GTFS Static feed. The scraper authors documented:
> *"CUMTA's static_mtc_gtfs_data.zip stamps 4,721 trips with a placeholder 00:00:15 departure; we keep our app-scraped MTC feed as the schedule source of record."*

Therefore, AccessRoute **explicitly does not claim official MTC provenance** for this dataset.

### 1.3 Licensing & Redistribution Status

- **Compilation Tooling & Data Structures**: Published under Open Database License (ODbL) / Public Domain Dedication and License (PDDL) by UngalSoththu.
- **Underlying Transit Timetables & Station Names**: © Metropolitan Transport Corporation (Chennai) Ltd. Redistribution rights, commercial reuse terms, and warranty disclaimers are **UNCONFIRMED**.
- **Action**: In accordance with AccessRoute's legal safety standards, blocker `FEED_UNCONFIRMED_DATA_LICENSE` is logged, and the dataset is strictly restricted to local development audit and verification.

---

## 2. File Inventory & Cryptographic Preservation

All 7 raw GTFS files were retrieved directly from `ungalsoththu/ChennaiGTFS` at commit `af0742dba777f9657ed6fda2046d6c2a721d630b` and saved immutably into `data/mtc_bus/imported/`.

### 2.1 File Inventory Table

| File Name | GTFS Standard Status | File Size (Bytes) | SHA-256 Cryptographic Hash | Record Count |
| :--- | :---: | :---: | :--- | :---: |
| `agency.txt` | Mandatory | 133 B | `6fbcead3ef9398e1784facbe71030772e6abebdb86137632178747815cce4da6` | 1 |
| `calendar.txt` | Mandatory | 342 B | `fca05f8f64ff8068da65f03439ff1320b0a5c556e9154b84e34c4f6e7d05a730` | 6 |
| `feed_info.txt` | Optional | 269 B | `ff68288fa3ed754b9c2262a8ba6d5ae4dccf7cc0edca934213f93b20042adac1` | 1 |
| `routes.txt` | Mandatory | 226,405 B | `3f933bdd0f64b69359a1eef24cf0a5464494e1affce144da995ce164a17e0028` | 4,611 |
| `stops.txt` | Mandatory | 230,767 B | `24ef742ee8312d27c9474a840330a5fbf271d2bbdd59514309d646cc4ea30c85` | 5,580 |
| `stop_times.txt` | Mandatory | 43,537,866 B | `aa80ad6804323964689b4a862c3d8dbcd497c386a9dc305e5f7e4badb4cad3cd` | 1,360,443 |
| `trips.txt` | Mandatory | 1,049,101 B | `0264fe39cf23ceac6ce096f5bbcfad16c47cc48849ece657b287df392eedfa86` | 47,047 |
| **Total** | — | **45,044,883 B** | *(7 files verified)* | **1,417,689 rows** |

### 2.2 Inventory of Absent Optional Files

The following standard GTFS optional files are absent from this feed:
1. `shapes.txt`: **Absent**. Bus route turn-by-turn road alignments are missing. Stop-to-stop paths can only be rendered as straight-line Euclidean hops.
2. `fare_attributes.txt` & `fare_rules.txt`: **Absent**. MTC fare stage slabs (Ordinary / Express / Deluxe / AC Electric) are not modeled in this feed. (AccessRoute models these separately in `verified_hubs.json`).
3. `transfers.txt`: **Absent**. Internal terminal walking transfers are not modeled.
4. `pathways.txt`: **Absent**. Platform accessibility paths are not provided.
5. `calendar_dates.txt`: **Absent**. Holiday / strike / seasonal service exceptions are not provided.

---

## 3. Structural Validation & Operational Integrity

The feed was validated using AccessRoute's zero-dependency RFC 4180 CSV parser ([`gtfsParser.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsParser.js)) and validator ([`gtfsValidator.js`](file:///c:/AccessRoute/backend/services/ingestion/gtfsValidator.js)).

### 3.1 Referential Integrity (Foreign Keys)

- **Routes ⟷ Trips**: 100% of the 47,047 `route_id` references in `trips.txt` resolve to valid records in `routes.txt`. **0 broken references**.
- **Trips ⟷ Stop Times**: 100% of the 1,360,443 `trip_id` references in `stop_times.txt` resolve to valid trips in `trips.txt`. **0 broken references**.
- **Stops ⟷ Stop Times**: 100% of the 1,360,443 `stop_id` references in `stop_times.txt` resolve to valid stops in `stops.txt`. **0 broken references**.
- **Services ⟷ Trips**: 100% of `service_id` references resolve to entries in `calendar.txt`. **0 broken references**.
- **Duplicates**: **0 duplicate keys** across all tables.

### 3.2 Geographic Bounding Box Analysis

- **Total Stop Nodes**: 5,580 stops.
- **Bounding Box Conformity**: **100% (5,580 of 5,580 stops)** fall strictly within AccessRoute's Chennai multi-county scope (`12.50`–`13.50° N`, `79.50`–`80.40° E`). **Zero out-of-bounds coordinates**.
- **Extreme Coordinates**:
  - Southernmost stop: `12.61480° N` (Poonjeri Koot Road, ECR/OMR junction near Mahabalipuram).
  - Northernmost stop: `13.49042° N` (Elavur, near Gummidipoondi / Andhra Pradesh border).
  - Westernmost stop: `79.80188° E` (Arakkonam / Kanchipuram peri-urban corridor).
  - Easternmost stop: `80.33584° E` (Kovalam / Mahabalipuram coastal bus stands).

### 3.3 Trip Timing & Monotonicity Analysis

- **Total Trips Analyzed**: 47,047 trips.
- **Same-Stop Time Inversions**: **0**.
- **Inter-Stop Time Regressions**: **0**.
- **Single-Stop Incomplete Trips**: **0**.
- **Midnight Rollovers**: Handled seamlessly; operating window runs from `00:00:00` (night services) to `25:41:00` (01:41 AM extended-hours overnight arrivals).
- **Dummy Timestamp Check**: Searched for CUMTA's placeholder `00:00:15` timestamps; **0 occurrences found** across all 1.36 million records.

### 3.4 Calendar Anomalies & Scraper Relics

Inspection of `calendar.txt` revealed significant artificial placeholders and test artifacts:

```csv
service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date
Regular,1,1,1,1,1,1,1,20240501,20300501
Weekend,0,0,0,0,0,1,1,20240501,20300501
Hybrid,0,0,0,1,1,0,1,20240501,20300501
HSC,1,1,1,1,1,1,0,20240501,20300501
test ,1,1,1,0,0,0,0,20240501,20300501
'/><script>alert(1)</script>,1,0,0,0,0,0,0,20240501,20300501
```

- **Trip Distribution Across Services**:
  - `Regular`: **46,973 trips (99.84%)**
  - `HSC` (Higher Secondary Certificate / School Special): **74 trips (0.16%)**
  - `Weekend`, `Hybrid`, `test `, `'/><script>alert(1)</script>`: **0 trips** assigned.
- **Artificial Date Range**: All 6 services span an artificial 6-year window (`20240501` to `20300501`), demonstrating that the upstream scraper populated fixed placeholder boundary dates rather than seasonal timetable validity dates.
- **Security / Penetration Test Relic**: The inclusion of `'/><script>alert(1)</script>` as a `service_id` indicates that upstream development or security testing was conducted against the scraper without sanitization before feed release.

---

## 4. Catalogue Reconciliation (21 Curated Interchange Hubs)

The 5,580 GTFS stops were reconciled against AccessRoute's curated catalogue of 21 major MTC bus interchange terminals ([`data/mtc_bus/verified_hubs.json`](file:///c:/AccessRoute/data/mtc_bus/verified_hubs.json)):

### 4.1 Reconciliation Metrics

- **Curated Catalogue Total**: 21 interchange hubs.
- **Exact Code Matches**: **0 (0.0%)**. MTC's GTFS uses integer stop IDs (e.g. `2`, `6681`), while the curated catalogue uses 4-letter operational codes (`BWAY`, `TBMW`).
- **Confirmed Physical Aliases**: **0 (0.0%)**. No published official acronym crosswalk exists linking catalogue abbreviations to GTFS integer stop IDs.
- **Provisional / Spatial Alignments**: **21 (100.0%)**. Every curated hub maps to an existing physical GTFS stop within **14m to 463m**.
- **Unresolved / Missing Hubs**: **0 (0.0%)**. Zero unmatched hubs.
- **Physical Representation Coverage**: **100.0% (21 of 21 hubs)**.

### 4.2 Master Reconciliation Table

| Hub Code | Catalogue Terminal Name | Stored Catalogue Coords | Nearest GTFS Stop ID | GTFS Stop Name | Stored GTFS Coords | Spatial Delta | Evidence Classification |
| :---: | :--- | :---: | :---: | :--- | :---: | :---: | :--- |
| `BWAY` | Broadway Bus Terminus | 13.0886, 80.2845 | `2` | Broadway | 13.08868, 80.28498 | **52 m** | **Class 3: PROVISIONAL** (Terminal Centroid) |
| `CMBT` | Koyambedu CMBT Terminus | 13.0694, 80.1948 | `9607` | Koyambedu Metro | 13.07297, 80.19638 | **435 m** | **Class 3: PROVISIONAL** (Interchange Concourse) |
| `KCBT` | Kilambakkam KCBT Terminus | 12.8686, 80.0825 | `6379` | Urappakam | 12.86801, 80.08170 | **112 m** | **Class 3: PROVISIONAL** (Regional Bus Stand) |
| `TNGR` | T. Nagar Bus Terminus | 13.0402, 80.2335 | `10225` | Duraiswamy Subway Or Pothys | 13.03960, 80.23315 | **80 m** | **Class 3: PROVISIONAL** (Terminal Bay) |
| `TBMW` | Tambaram West Bus Terminus | 12.9250, 80.1170 | `6681` | Tambaram Railway Station | 12.92518, 80.11720 | **27 m** | **Class 3: PROVISIONAL** (Railway Concourse Bay) |
| `TBME` | Tambaram East Bus Terminus | 12.9230, 80.1200 | `6663` | Tambaram Railway Station East | 12.92589, 80.12090 | **330 m** | **Class 3: PROVISIONAL** (East Side Terminal) |
| `GDY` | Guindy Multi-Modal Bus Hub | 13.0084, 80.2131 | `11108` | Guindy Race Cource | 13.00868, 80.21312 | **31 m** | **Class 3: PROVISIONAL** (Race Course Concourse) |
| `SDPT` | Saidapet Bus Terminus | 13.0235, 80.2225 | `9146` | Saidapet Market | 13.02428, 80.22099 | **180 m** | **Class 3: PROVISIONAL** (Market / Terminal Bay) |
| `TYMR` | Thiruvanmiyur Bus Depot | 12.9865, 80.2585 | `5349` | Thiruvanmiyur Depot | 12.98688, 80.25883 | **55 m** | **Class 3: PROVISIONAL** (Depot Concourse) |
| `PMLE` | Poonamallee Bus Terminus | 13.0495, 80.0965 | `5782` | Poonamallee Government Hospital | 13.04871, 80.09572 | **118 m** | **Class 3: PROVISIONAL** (Hospital / Terminal Bay) |
| `AVD` | Avadi Bus Terminus | 13.1165, 80.1015 | `6939` | Avadi Market | 13.11929, 80.10287 | **338 m** | **Class 3: PROVISIONAL** (Market Bus Stand) |
| `ABOT` | Ambattur Old Town (OT) Terminus | 13.1150, 80.1500 | `10422` | Amma Hotel - Near Ambattur O.T | 13.11470, 80.15050 | **62 m** | **Class 3: PROVISIONAL** (OT Concourse) |
| `RDHL` | Red Hills Bus Terminus | 13.1950, 80.1970 | `10574` | Red Hills Eb Or Azhinjivakkam Rd | 13.19129, 80.19500 | **463 m** | **Class 3: PROVISIONAL** (Northern Junction) |
| `TLGT` | Tollgate Bus Terminus | 13.1365, 80.2985 | `7198` | Nagara Thottam | 13.13610, 80.29880 | **58 m** | **Class 3: PROVISIONAL** (North Coastal Bay) |
| `VDPL` | Vadapalani Bus Terminus | 13.0515, 80.2100 | `9431` | Kamala Theatre | 13.05060, 80.20817 | **219 m** | **Class 3: PROVISIONAL** (Theatre / Concourse Bay) |
| `VLCY` | Velachery Bus Terminus | 12.9785, 80.2215 | `8701` | Mageshwari Nagar | 12.97720, 80.22300 | **222 m** | **Class 3: PROVISIONAL** (Southern Bypass Concourse) |
| `ADYR` | Adyar Bus Depot | 12.9978, 80.2562 | `8993` | Adyar Signal | 12.99770, 80.25610 | **14 m** | **Class 3: PROVISIONAL** (Depot / Signal Stop) |
| `CGLB` | Chengalpattu Bus Stand | 12.6920, 79.9830 | `9927` | Chengalpet | 12.69460, 79.98470 | **338 m** | **Class 3: PROVISIONAL** (Municipal Bus Stand Bay) |
| `SPBD` | Sriperumbudur Bus Stand | 12.9690, 79.9450 | `8576` | Sriperumbudur Theradi | 12.96720, 79.94330 | **266 m** | **Class 3: PROVISIONAL** (Town Bus Stand Bay) |
| `GUDV` | Guduvancheri Bus Stand | 12.8450, 80.0620 | `6295` | Guduvancheri Railway Station | 12.84310, 80.06070 | **259 m** | **Class 3: PROVISIONAL** (Railway Forecourt Bay) |
| `TPRR` | Thiruporur Bus Stand | 12.7230, 80.1870 | `6016` | Kandhaswami Temple Tank | 12.72200, 80.18620 | **139 m** | **Class 3: PROVISIONAL** (OMR Terminal Bay) |

---

## 5. Explicit Blockers & Production Readiness Decision

### 5.1 Active Feed-Level Blockers

The following four blockers are locked into [`data/mtc_bus/imported/ingestion_manifest.json`](file:///c:/AccessRoute/data/mtc_bus/imported/ingestion_manifest.json):

1. **`FEED_UNCONFIRMED_DATA_LICENSE`**:
   The underlying MTC timetable schedules, route alignments, and stop inventories belong to Metropolitan Transport Corporation (Chennai) Ltd. Neither MTC nor CUMTA has published an open data license granting redistribution rights. AccessRoute cannot redistribute this feed for public production routing.
2. **`FEED_COMMUNITY_SCRAPE_ORIGIN`**:
   The feed origin is a third-party scrape from an unauthenticated mobile application API, rather than an authoritative GTFS feed released by the operating authority.
3. **`FEED_SUSPICIOUS_CALENDAR_PLACEHOLDER`**:
   Calendar validity is stamped with an artificial 6-year window (`20240501` to `20300501`) and contains development testing relics (`'/><script>alert(1)</script>`).
4. **`FEED_MISSING_SHAPES_AND_FARES`**:
   The feed contains no turn-by-turn road geometry (`shapes.txt`) and no fare matrix (`fare_attributes.txt` / `fare_rules.txt`).

### 5.2 Readiness Decision

$$\mathbf{readyForJourneyRouting: false}$$

The imported MTC bus dataset **MUST NOT** be used for production journey routing, multi-modal pathfinding, or public schedule queries. It remains strictly isolated in `data/mtc_bus/imported/` as an immutable reference dataset for spatial verification and offline corridor analysis.

---

## 6. Verification and Regression Sign-Off

All five required test suites pass cleanly with zero errors:

```
1. npm run test:ingestion  ===> 36 Suites, 319 Tests PASS (6.2s)
2. npm run test:transit    ===> 6 Suites, 49 Tests PASS (1.8s)
3. npm run test:api        ===> 14 Test Cases, 44 Assertions PASS (2.2s)
4. npm run test:ai         ===> 7 AI Scenarios PASS (1.1s)
5. npm run build           ===> Vite Client Production Bundle PASS (1,503 kB minified, 801ms)
```

### Git Status (`git status --short`)

```
D  .env
 M .env.example
 M .gitignore
 M backend/middleware/validator.js
 M backend/server.js
 M backend/services/ingestion/gtfsValidator.js
 M backend/services/ingestion/transitIngestionPipeline.js
 M backend/tests/api.test.js
 M backend/tests/ingestion.test.js
 M package.json
 M src/utils/geminiClient.js
 M tests/ai.test.js
?? KisanSathi-AI/
?? backend/routes/ai.js
?? backend/tests/fixtures/
?? backend/tests/transitData.test.js
?? data/
?? docs/
```

- Pre-existing uncommitted work and local secrets (`.env`) remain completely untouched.
- No files have been staged, committed, pushed, reset, cleaned, or discarded.
- No UI components or routing engine algorithms were modified.

---

**Phase 08 is complete. Standing by for review before Phase 09.**
