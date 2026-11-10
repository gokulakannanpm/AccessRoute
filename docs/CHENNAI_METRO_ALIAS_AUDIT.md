# AccessRoute — Chennai Metro (CMRL) Station Alias Evidence Audit

**Document**: `docs/CHENNAI_METRO_ALIAS_AUDIT.md`  
**Phase**: Phase 07.4.1 — Evidence and Count Consistency Check  
**Date**: October 2026  
**Status**: Strict Evidence Standard Enforced; 0 Confirmed Aliases, 19 Provisional, 2 Divergent Facilities  
**Corpus**: `c:\AccessRoute\data\chennai_metro` (`verified_stations.json` curated catalogue; `imported/` raw static GTFS)  
**Branch**: `hacknova-mvp`  
**Engineers**: Antigravity AI Engineering Team  

---

## Executive Summary

Phase 07.4.1 performs a targeted evidence and count consistency check across all 21 Chennai Metro station aliases. Under AccessRoute's strict evidence standard:
- **Spatial proximity ($\le 500\text{ m}$), corridor sequence, station name similarity, or scheduled trips do not independently establish station identity**.
- **Internal repository configuration files (such as `network_scope.json`) do not constitute independent external corroboration** merely because they list transport hubs.
- **`CONFIRMED`** is reserved strictly for station mappings supported by **independently published authoritative crosswalks** (e.g., an official concordance table from CMRL, CUMTA, or Ministry of Housing and Urban Affairs). When such authoritative external evidence is unavailable from open data, mappings must be honestly classified as **`PROVISIONAL`**.
- **`DIVERGENT_FACILITY`** is assigned when records belong to the same interchange or catchment area, but refer to **distinct physical facilities or access centroids** (e.g., bus terminal concourse vs elevated rail station).
- **`PROVISIONAL`** is assigned to plausible mappings supported by **local inferences** (name similarity, proximity, corridor topology), documented **coordinate discrepancies ($>500\text{ m}$)**, or **zero commercial timetable service**.
- **`UNRESOLVED`** is assigned when evidence is contradictory, missing, or points to unrelated stations.

### Master Reconciliation Breakdown (41 Catalogue Stations)

| Reconciliation Category | Station Count | Percentage | Evidentiary Basis & Rule Enforcement |
| :--- | :---: | :---: | :--- |
| **Curated Catalogue Stations** | **41** | 100.0% | Curated in [`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json). |
| **GTFS Physical Parent Stations** | **41** | 100.0% | Present in [`data/chennai_metro/imported/stops.txt`](file:///c:/AccessRoute/data/chennai_metro/imported/stops.txt) (`location_type: '1'`). |
| **Exact Code Matches** | **20** | 48.8% | Identical 3-letter strings matching catalogue `code` to GTFS `zone_id`. *Note*: Measures lexical code match; 6 North Chennai stations exhibit coordinate offsets of 893m–1,512m. |
| **Class 1: Confirmed Physical Aliases** | **0** | **0.0%** | Zero aliases possess independently published authoritative crosswalk records in open data. |
| **Class 2: Divergent Facility / Access-Point Aliases** | **2** | 4.9% | Same interchange/catchment area, but distinct physical facilities or access centroids (`SCMBT`, `SNG`). |
| **Class 3: Provisional / Likely Matches** | **19** | **46.3%** | Plausible matches supported by local inferences (13 stations including `SMC`, `SGD`, `STMNT`), documented coordinate discrepancies (4 stations), or unserved commercial extensions (2 stations). |
| **Class 4: Unresolved / Incorrect Matches** | **0** | 0.0% | Zero unresolved, fictitious, or cross-station mismatches in the feed. |
| **Exact Code Matches + Confirmed Aliases** | **20 / 41** | **48.8%** | 20 exact code matches + 0 confirmed aliases. (Corrects legacy "23 confirmed matches" description). |
| **Physical Stations Represented in Feed** | **41 / 41** | **100.0%** | Every catalogue station maps to an existing physical parent station in `stops.txt`. |
| **Commercial Timetable Service Coverage** | **39 / 41** | **95.1%** | 39 stations served by 625 historical trips; 2 stations (`SWND`, `STVT`) have zero commercial trips. |

---

## 1. Targeted Review of `SMC`, `SGD`, and `STMNT`

In Phase 07.4, three major interchange aliases (`SMC`, `SGD`, `STMNT`) were marked `CONFIRMED` citing entries in `network_scope.json`. In Phase 07.4.1, these three mappings were audited to distinguish:
1. Evidence recorded in local AccessRoute repository files;
2. Evidence from an independently published authoritative source;
3. Inference based on proximity, station names, or interchange context.

### 1.1 `SMC → SCC` (Central Metro / Puratchi Thalaivar Dr. M.G. Ramachandran Central Metro)

- **Evidence Recorded in Local AccessRoute Files**:
  - [`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json): Curated station `cmrl_smc` with `code: "SMC"`, `name: "Puratchi Thalaivar Dr. M.G. Ramachandran Central"`, `[13.0827, 80.2707]`, lines `["blue_line", "green_line"]`.
  - [`data/network_scope.json`](file:///c:/AccessRoute/data/network_scope.json): Defines `interchangeHubs.hub_central` listing `metroStationIds: ["SMC"]`, `suburbanStationCodes: ["MAS", "MASS"]`.
  - [`data/suburban_rail/verified_stations.json`](file:///c:/AccessRoute/data/suburban_rail/verified_stations.json): Curates `MAS` and `MASS`.
- **Evidence from an Independently Published Authoritative Source**:
  - GTFS `stops.txt` parent station `stop_id: "104"` with `stop_name: "PURATCHI THALAIVAR DR.M.G.RAMACHANDRAN CENTRAL METRO"`, `zone_id: "SCC"`, `[13.081428, 80.272908]`.
  - **No external authoritative crosswalk**: Neither CMRL, CUMTA, nor MoHUA publishes an open crosswalk table linking the AccessRoute curated acronym `SMC` to CMRL's internal zone code `SCC` or stop `104`.
- **Inference Based on Proximity, Station Names, or Interchange Context**:
  - Distance: 278 m between curated centroid and GTFS platform centroid.
  - Name semantics: "Chennai Central" corresponds conceptually to "PURATCHI THALAIVAR DR.M.G.RAMACHANDRAN CENTRAL METRO".
  - Network topology: Both represent the sole bi-level underground intersection of the Blue and Green lines at Central railway station.
- **Evaluation**: `network_scope.json` is an internal repository configuration file authored for AccessRoute, not an external authoritative publication. Because no independent official crosswalk exists, `SMC` is an inference (albeit highly plausible) and must be classified as **`PROVISIONAL`**.
- **Classification**: **`PROVISIONAL` (Local Inference — Major Interchange Hub)**.

### 1.2 `SGD → SGU` (Guindy Metro)

- **Evidence Recorded in Local AccessRoute Files**:
  - [`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json): Curated station `cmrl_sgd` with `code: "SGD"`, `name: "Guindy"`, `[13.0084, 80.2131]`, line `["blue_line"]`, `interchangeWith: ["Suburban Rail (Guindy EMU Station)"]`.
  - [`data/network_scope.json`](file:///c:/AccessRoute/data/network_scope.json): Defines `interchangeHubs.hub_guindy` listing `metroStationIds: ["SGD"]`, `suburbanStationCodes: ["GDY"]`.
  - [`data/suburban_rail/verified_stations.json`](file:///c:/AccessRoute/data/suburban_rail/verified_stations.json): Southern Railway station `GDY` at `13.0084, 80.2131`.
- **Evidence from an Independently Published Authoritative Source**:
  - GTFS `stops.txt` parent station `stop_id: "113"` with `stop_name: "GUINDY METRO"`, `zone_id: "SGU"`, `[13.009166, 80.213030]`.
  - **No external authoritative crosswalk**: Neither CMRL nor CUMTA publishes an official table mapping `SGD` to `SGU` or `113`.
- **Inference Based on Proximity, Station Names, or Interchange Context**:
  - Distance: 86 m.
  - Name semantics: Both records explicitly contain "Guindy".
  - Interchange context: Both records describe the transit facility adjacent to Guindy Railway Station and GST Road.
- **Evaluation**: Internal coordination across `verified_stations.json` and `network_scope.json` does not constitute independent external proof. In the absence of an official crosswalk, this is a local inference based on proximity (86m) and shared naming.
- **Classification**: **`PROVISIONAL` (Local Inference — Major Interchange Hub)**.

### 1.3 `STMNT → SMM` (St. Thomas Mount)

- **Evidence Recorded in Local AccessRoute Files**:
  - [`data/chennai_metro/verified_stations.json`](file:///c:/AccessRoute/data/chennai_metro/verified_stations.json): Curated station `cmrl_stmnt` with `code: "STMNT"`, `name: "St. Thomas Mount"`, `[12.9948, 80.1988]`, line `["green_line"]`, `interchangeWith: ["Suburban Rail (St. Thomas Mount EMU Station)", "MRTS Line (St. Thomas Mount Terminal)"]`. (Catalogue used `STMNT` because `STM` was assigned to Southern Railway).
  - [`data/network_scope.json`](file:///c:/AccessRoute/data/network_scope.json): Defines `interchangeHubs.hub_st_thomas_mount` listing `metroStationIds: ["STMNT"]`, `suburbanStationCodes: ["STM"]`.
  - [`data/suburban_rail/verified_stations.json`](file:///c:/AccessRoute/data/suburban_rail/verified_stations.json): Southern Railway / MRTS station `STM` at `12.9948, 80.1988`.
- **Evidence from an Independently Published Authoritative Source**:
  - GTFS `stops.txt` parent station `stop_id: "217"` with `stop_name: "ST.THOMAS MOUNT"`, `zone_id: "SMM"`, `[12.994749, 80.197554]`.
  - **No external authoritative crosswalk**: No official CMRL crosswalk exists mapping `STMNT` to `SMM` or `217`.
- **Inference Based on Proximity, Station Names, or Interchange Context**:
  - Distance: 135 m.
  - Name semantics: Both records identify "St. Thomas Mount".
  - Interchange context: Both refer to the Green Line elevated terminal structure integrated with the suburban/MRTS station.
- **Evaluation**: The mapping is derived from naming, proximity, and multimodal context. Without an independently published crosswalk, it cannot be classified as `CONFIRMED`.
- **Classification**: **`PROVISIONAL` (Local Inference — Major Interchange Hub)**.

---

## 2. Clarification of Reconciliation Metrics

### 2.1 Distinguishing Exact Code Matches from Confirmed Alias Matches

Reconciliation metrics must clearly distinguish between lexical code equality and independently corroborated identity:
1. **Exact Code Matches (20 stations, 48.8%)**:
   - Stations where the curated catalogue `code` identically matches the GTFS `zone_id` string:
     `SWN`, `STV`, `SKP`, `STG`, `SNW`, `STC`, `SHC`, `SGE`, `STL`, `SLM`, `SAL`, `SAP`, `SEG`, `SNP`, `SKM`, `SPC`, `SSN`, `SAE`, `SAT`, `SAN`.
   - *Critical distinction*: Exact code matching is a **lexical match**, not guaranteed spatial identity. For example, 14 of these stations have close spatial alignment (26m–392m), but 6 North Chennai stations exhibit coordinate offsets between 893m and 1,512m between curated catalogue coordinates and GTFS station centroids (`SWN` 1,277m, `STV` 1,512m, `SKP` 955m, `STG` 1,225m, `SNW` 1,259m, `STC` 893m).
2. **Confirmed Alias Matches (0 stations, 0.0%)**:
   - Zero aliases are backed by an independently published authoritative crosswalk table in open transit data.
3. **Provisional Alias Matches (19 stations, 46.3%)**:
   - 13 proximity and name inferences (`SMC`, `SGD`, `STMNT`, `SSD`, `SKB`, `SND`, `STM`, `SDMS`, `SVD`, `SMD`, `SLIC`, `STN`, `SEK`).
   - 4 corridor coordinate discrepancies (`SMB`, `SWP`, `STP`, `SAB`).
   - 2 unserved commercial extension stations (`SWND`, `STVT`).
4. **Divergent Facility Aliases (2 stations, 4.9%)**:
   - `SCMBT` (MTC CMBT bus bays concourse centroid vs elevated rail station).
   - `SNG` (residential centroid vs GST Road elevated station).

### 2.2 Correction of Legacy "23 Confirmed Matches" Description

Previous reports and test assertions cited **"23 confirmed matches (56.1%)"**.
- That metric was computed by adding:
  $$\text{Exact Code Matches (20)} + \text{Confirmed Aliases (3)} = 23$$
- **This description conflated two distinct categories**:
  1. It treated the 20 exact code matches as "authoritative evidence identity matches", overlooking that exact code matching is simply matching 3-letter strings, of which 6 stations exhibit ~1km coordinate offsets.
  2. It treated `SMC`, `SGD`, and `STMNT` as "confirmed aliases" based solely on internal repository configuration (`network_scope.json`) and local proximity/name inferences.
- Under the corrected, honest standard:
  - **Confirmed Aliases**: **0** (0.0%).
  - **Exact Code Matches**: **20** (48.8%).
  - **Code-Matched Stations (`exactMatches + confirmedAliases`)**: **20 / 41 (48.8%)**.
  - **Physical Network Representation in Feed**: **41 / 41 (100.0%)**.
  - **Commercial Timetable Coverage**: **39 / 41 (95.1%)**.

---

## 3. Comprehensive Master Audit Table (All 21 Aliases)

The table below provides the full audit for every code alias mapping, documenting stored file coordinates, exact Haversine spatial deltas, supporting evidence, evidence levels, and revised semantic classifications:

| # | Cat Code | GTFS Code | GTFS ID | Station Name (Catalogue) | GTFS Official Stop Name (`stops.txt`) | Stored Catalogue Coords | Stored GTFS Coords | Spatial Offset | Supporting Evidence | Evidence Level | Semantic Classification |
| :-: | :---: | :---: | :---: | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- |
| 1 | `SMC` | `SCC` | `104` | Central Metro | CENTRAL METRO | 13.0827, 80.2707 | 13.081428, 80.272908 | **278 m** | Name and topological alignment; listed in internal `network_scope.json` (`hub_central`); no external crosswalk. | **Local Inference (Hub Topology)** | **Class 3: PROVISIONAL** |
| 2 | `SGD` | `SGU` | `113` | Guindy | GUINDY METRO | 13.0084, 80.2131 | 13.009166, 80.213030 | **86 m** | Name and proximity match; listed in internal `network_scope.json` (`hub_guindy`); no external crosswalk. | **Local Inference (Proximity)** | **Class 3: PROVISIONAL** |
| 3 | `STMNT` | `SMM` | `217` | St. Thomas Mount | ST.THOMAS MOUNT | 12.9948, 80.1988 | 12.994749, 80.197554 | **135 m** | Name and terminal match; listed in internal `network_scope.json` (`hub_st_thomas_mount`); no external crosswalk. | **Local Inference (Terminal Context)** | **Class 3: PROVISIONAL** |
| 4 | `SCMBT` | `SCM` | `211` | CMBT | CMBT METRO | 13.0694, 80.1948 | 13.068483, 80.203946 | **996 m** | Catalogue point is MTC bus terminal concourse centroid (`mtc_cmbt`); GTFS stop 211 is elevated rail station on 100 Feet Rd. | **Facility Divergence (Same Interchange)** | **Class 2: DIVERGENT_FACILITY** |
| 5 | `SNG` | `SOT` | `115` | Nanganallur Road | NANGANALLUR ROAD | 12.9905, 80.1915 | 12.999966, 80.194156 | **1,091 m** | Catalogue point is residential interior near Palavanthangal; GTFS stop 115 is elevated station on GST Road. | **Access-Point Divergence** | **Class 2: DIVERGENT_FACILITY** |
| 6 | `SSD` | `SSA` | `111` | Saidapet | SAIDAPET METRO | 13.0235, 80.2285 | 13.023599, 80.228360 | **19 m** | Name similarity, Blue Line position, 19m proximity; no official acronym crosswalk. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 7 | `SKB` | `SKO` | `210` | Koyambedu | KOYAMBEDU | 13.0735, 80.1950 | 13.073361, 80.194875 | **21 m** | Name similarity, Green Line position, 21m proximity; no official acronym crosswalk. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 8 | `SND` | `SCR` | `110` | Nandanam | NANDANAM | 13.0315, 80.2405 | 13.031651, 80.241043 | **61 m** | Name similarity, Blue Line position, 61m proximity; zone code `SCR` diverges from acronym. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 9 | `STM` | `STI` | `209` | Thirumangalam | THIRUMANGALAM | 13.0850, 80.1995 | 13.085206, 80.201539 | **222 m** | Name similarity, Green Line position, 222m proximity; catalogue reused `STM` (conflicts with SRR). | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 10 | `SDMS` | `SGM` | `108` | AG-DMS | AG-DMS | 13.0465, 80.2490 | 13.044683, 80.248033 | **228 m** | Name similarity, Blue Line position, 228m proximity; zone code `SGM` diverges from acronym. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 11 | `SVD` | `SVA` | `213` | Vadapalani | VADAPALANI | 13.0515, 80.2100 | 13.050697, 80.212075 | **242 m** | Name similarity; catalogue coordinate pinned to MTC bus terminal; GTFS on 100 Feet Rd. | **Local Inference (Bus Terminus Centroid)** | **Class 3: PROVISIONAL** |
| 12 | `SMD` | `SMA` | `102` | Mannadi | MANNADI | 13.0935, 80.2875 | 13.095420, 80.286094 | **262 m** | Name similarity, Blue Line position, 262m proximity; no official acronym crosswalk. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 13 | `SLIC` | `SLI` | `106` | LIC | LIC | 13.0620, 80.2678 | 13.064555, 80.266101 | **339 m** | Name similarity, Blue Line position, 339m proximity; no official acronym crosswalk. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 14 | `STN` | `STE` | `109` | Teynampet | TEYNAMPET | 13.0405, 80.2450 | 13.037118, 80.246461 | **408 m** | Name similarity, Blue Line position, 408m proximity; no official acronym crosswalk. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 15 | `SEK` | `SSI` | `215` | Ekkattuthangal | EKKATTUTHANGAL | 13.0210, 80.2055 | 13.016521, 80.205282 | **499 m** | Name similarity, Green Line position, 499m proximity; zone code `SSI` diverges from acronym. | **Local Inference (Close Proximity)** | **Class 3: PROVISIONAL** |
| 16 | `SMB` | `SME` | `116` | Meenambakkam | MEENAMBAKKAM METRO | 12.9840, 80.1810 | 12.987751, 80.176587 | **635 m** | Name similarity, Blue Line position; catalogue coordinate exhibits 635m eastward discrepancy. | **Documented Coordinate Discrepancy** | **Class 3: PROVISIONAL** |
| 17 | `SWP` | `SWA` | `101` | Washermanpet | WASHERMENPET METRO | 13.1025, 80.2865 | 13.107218, 80.280787 | **811 m** | Name similarity, Blue Line position; catalogue coordinate exhibits 811m southeast discrepancy. | **Documented Coordinate Discrepancy** | **Class 3: PROVISIONAL** |
| 18 | `STP` | `STR` | `148` | Tondiarpet | TONDIARPET METRO | 13.1165, 80.2925 | 13.123811, 80.288199 | **937 m** | Name similarity, North Extension position; catalogue coordinate exhibits 937m southeast discrepancy. | **Documented Coordinate Discrepancy** | **Class 3: PROVISIONAL** |
| 19 | `SAB` | `SAR` | `212` | Arumbakkam | ARUMBAKKAM | 13.0615, 80.2030 | 13.062006, 80.211703 | **944 m** | Name similarity, Green Line position; catalogue coordinate exhibits 944m westward discrepancy. | **Documented Coordinate Discrepancy** | **Class 3: PROVISIONAL** |
| 20 | `SWND` | `SWD` | `141` | Wimco Nagar Depot | WIMCO NAGAR DEPOT | 13.1754, 80.3065 | 13.184280, 80.309108 | **1,027 m** | Stop 141 in `stops.txt`, but 0 commercial trips in 2021 feed (opened March 2022); 1,027m catalogue offset. | **Unserved Commercial Service** | **Class 3: PROVISIONAL** |
| 21 | `STVT` | `STT` | `144` | Tiruvottiyur Theradi | THERADI METRO | 13.1518, 80.3010 | 13.159826, 80.302336 | **904 m** | Stop 144 in `stops.txt`, but 0 commercial trips in 2021 feed (opened March 2022); 904m catalogue offset. | **Unserved Commercial Service** | **Class 3: PROVISIONAL** |

---

## 4. Honest Reporting of Evidence Limitations

1. **No External Crosswalk in Open Transit Data**: Authoritative cross-reference tables connecting arbitrary catalogue abbreviations (e.g. `SSD`, `SKB`, `SND`, `SDMS`, `SEK`, `SMC`, `SGD`, `STMNT`) to CMRL station zone codes (`SSA`, `SKO`, `SCR`, `SGM`, `SSI`, `SCC`, `SGU`, `SMM`) are not published in open data or available locally. AccessRoute honestly classifies all 19 non-divergent aliases as **`PROVISIONAL`**, rather than artificially inflating the confirmed count.
2. **Reconciliation vs Timetable Separation**:
   - **41 of 41 stations (100.0%)** are physically represented in `stops.txt`.
   - **20 of 41 stations (48.8%)** match on exact 3-letter codes (`zone_id` == `code`).
   - **0 of 41 stations (0.0%)** have independently published external crosswalk evidence.
   - **39 of 41 stations (95.1%)** have commercial scheduled service in the historical feed.
3. **No Synthetic Departures**: Synthesizing artificial timetables for missing stations (`SWND`, `STVT`) or expired calendars remains strictly prohibited.
4. **Production Routing Isolation**: `readyForJourneyRouting: false` remains enforced until unexpired feeds and verified commercial schedules are obtained.
