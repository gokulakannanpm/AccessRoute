# AccessRoute — Chennai Transit Data Discovery & Foundation

**Project**: AccessRoute (Intelligent Public Transport Connectivity Platform for Chennai)  
**Phase**: 02 — Transit Data Discovery & Foundation  
**Date**: October 2026  
**Status**: Source-Verified Inventory & Data Foundation  

---

## Executive Summary

The objective of Phase 02 is to establish a rigorous, source-verified Chennai public transport data foundation for AccessRoute. The platform's network covers **Chennai** and genuinely Chennai-connected transport corridors in parts of **Chengalpattu**, **Kanchipuram**, and **Tiruvallur**.

This document inventories the actual data landscape for the four transport modes:
1. **MTC Buses** (Metropolitan Transport Corporation)
2. **Chennai Metro** (CMRL — Chennai Metro Rail Limited)
3. **Suburban / Local Railway & MRTS** (Southern Railway — SR Chennai Division)
4. **Relevant Express Trains** (Indian Railways long-distance / intercity services with suburban Chennai utility)

Each mode has distinct operational characteristics, ticketing structures, scheduling formats, and licensing rules. They are maintained under separate source identities and ingestion paths.

---

## 1. Multi-County Network Scope & Boundary Concepts

To build an accurate transport graph, AccessRoute separates four distinct boundary concepts:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AccessRoute Network Scope                       │
│                                                                        │
│   ┌────────────────────────┐         ┌──────────────────────────────┐  │
│   │ Administrative Borders │   VS    │ Transport Service Corridors  │  │
│   │ - Greater Chennai Corp │         │ - MTC operates to Tambaram,  │  │
│   │ - Chengalpattu District│         │   Guduvancheri, Thiruporur   │  │
│   │ - Kanchipuram District │         │ - EMU trains run to CGL &    │  │
│   │ - Tiruvallur District  │         │   Kanchipuram/Arakkonam      │  │
│   └────────────────────────┘         └──────────────────────────────┘  │
│                                                                        │
│   ┌────────────────────────┐         ┌──────────────────────────────┐  │
│   │  Interchange Networks  │   VS    │   Civic Report Jurisdiction  │  │
│   │ - Metro ⟷ EMU (Guindy) │         │ - Municipalities / GCC       │  │
│   │ - Bus ⟷ Metro (CMBT)   │         │ - State Highways / NHAI      │  │
│   │ - Multi-modal Central  │         │ - Southern Railway / CMRL    │  │
│   └────────────────────────┘         └──────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Administrative Boundaries**: Formal revenue district lines (Chennai, Chengalpattu, Kanchipuram, Tiruvallur). District boundaries alone do **not** dictate transit inclusion.
2. **Transport Operator / Service Coverage**: The actual geographic reach of Chennai transport operators:
   - **MTC bus network** extends well into Chengalpattu (Tambaram, Guduvancheri, Maraimalai Nagar, Kelambakkam, Mahabalipuram), Kanchipuram (Sriperumbudur, Sunguvarchatram), and Tiruvallur (Poonamallee, Avadi, Red Hills).
   - **Southern Railway EMU network** runs daily suburban services south to Chengalpattu Junction (`CGL`) and west/south-west to Kanchipuram (`CJ`) and Arakkonam (`AJJ`).
   - **CMRL Metro network** operates Phase 1 to Airport (`SAP`) and Wimco Nagar Depot (`SWN`), with Phase 2 extending to Poonamallee, Madhavaram, and SIPCOT Siruseri.
3. **Interchange & Journey Connectivity**: Strategic transfer nodes where passengers switch modes (e.g., Chennai Central, Egmore, Guindy, CMBT/Koyambedu, St. Thomas Mount, Tambaram, Saidapet, Alandur).
4. **Civic-Report Jurisdiction (CityPulse)**: Infrastructure maintenance responsibilities (GCC, State Highways, CMRL, Southern Railway, NHAI) handled separately during civic barrier reporting.

---

## 2. Research & Source-Verified Inventory by Category

### Category 1: MTC Buses (Metropolitan Transport Corporation)

| Attribute | Verified Finding |
| :--- | :--- |
| **Primary Operator** | Metropolitan Transport Corporation (Chennai) Ltd. — Government of Tamil Nadu undertaking. |
| **Official Portal** | `https://mtcbus.tn.gov.in/` |
| **Official Open Data Portal** | CUMTA Test / Transit Data Portal (`https://test.cumta.org/` — `static_mtc_gtfs_data.zip`). *Note: DNS for `opendata.cumta.org` does not currently resolve.* |
| **Community Feed Mirror** | [ungalsoththu/ChennaiGTFS](https://github.com/ungalsoththu/ChennaiGTFS) (`data/mtc/` and `mtc-gtfs.zip`). |
| **Dataset Format** | GTFS Static text files (`agency.txt`, `calendar.txt`, `feed_info.txt`, `routes.txt`, `stops.txt`, `stop_times.txt`, `trips.txt`) imported into `data/mtc_bus/imported/`. (`shapes.txt`, `fare_attributes.txt`, `pathways.txt` absent). |
| **Verified Contents** | 4,611 routes / route variants (all `route_type: 3`), 5,580 stops (100% within Chennai bounds), 47,047 trips, 1,360,443 stop times, 6 calendar services. |
| **Source Provenance** | Sourced via official MTC mobile app route & timetable scrape (collected April 2026, weekly updates until 2026-04-27; commit `af0742d`). Unauthenticated community scrape, not an official publication by MTC/CUMTA. |
| **Coverage** | Chennai Metropolitan Area, Tambaram Corporation, Chengalpattu, Kanchipuram, and Tiruvallur corridors. |
| **Caveats & Limitations** | 1. CUMTA's official static feed stamped 4,721 trips with dummy `00:00:15` departures; community-scraped feed has real timetable departures but lacks `shapes.txt` (straight-line hops only). 2. Calendar spans artificial 6-year placeholder (`20240501` to `20300501`) with scraper test relics (`'/><script>alert(1)</script>`). 3. Real-time GPS feeds (Chalo/MTC live tracking) are proprietary and not yet available via public open GTFS-RT. 4. Strictly isolated with `readyForJourneyRouting: false`. |
| **License / Reuse** | Compilation published under ODbL / PDDL by UngalSoththu. Underlying MTC schedule data redistribution rights UNCONFIRMED. |

### Category 2: Chennai Metro (CMRL — Chennai Metro Rail Limited)

| Attribute | Verified Finding |
| :--- | :--- |
| **Primary Operator** | Chennai Metro Rail Limited (CMRL) — Joint Venture of Govt. of India and Govt. of Tamil Nadu. |
| **Official Portal** | `https://chennaimetrorail.org/` and `https://travelplanner.chennaimetrorail.org/` |
| **Staging Origin** | CUMTA Test Staging (`test.cumta.org` — unauthenticated staging mirror, collected Oct 4, 2026; CUMTA not confirmed as publisher). |
| **Community Feed Mirror** | [ungalsoththu/ChennaiGTFS](https://github.com/ungalsoththu/ChennaiGTFS) (`data/cmrl/` and `cmrl-gtfs.zip`). |
| **Dataset Format** | GTFS Static text files (`agency.txt`, `calendar.txt`, `fare_attributes.txt`, `fare_rules.txt`, `routes.txt`, `shapes.txt`, `stops.txt`, `stop_times.txt`, `transfers.txt`, `trips.txt`) imported into `data/chennai_metro/imported/`. |
| **Verified Contents** | **41 operational stations** across 2 lines: Blue Line (26 stations: Wimco Nagar Depot ⟷ Airport), Green Line (16 stations: Central ⟷ St. Thomas Mount), with Alandur as bi-level interchange. 254 platform/entrance nodes (41 parent stations) with physical ramp, elevator, and staircase descriptions. 28 routes (all `route_type: 1`), 625 trips, 12,503 stop times, 4,231 shape points, zone-based fare matrix (₹10–₹60), 50 station transfers. |
| **Coverage** | Phase 1 + Phase 1 North Extension (~45 km). (Phase 2 under construction, not yet operational). |
| **Caveats & Limitations** | 1. **Stale Calendar**: `calendar.txt` expired on 2021-12-31. Structural geometry, station coordinates, platform nodes, and transfer links are valid, but live routing requires an active official schedule feed or verified operational headway data (synthetic departures are prohibited). 2. **Missing Extension Timetables**: Wimco Nagar Depot (`SWND`) and Tiruvottiyur Theradi (`STVT`) are present in `stops.txt` but lack commercial schedule trips in this 2021 snapshot (both opened for passenger service in March 2022). 3. **Routing Status**: Strictly isolated with `readyForJourneyRouting: false`. |
| **License / Reuse** | Source dataset © CMRL / CUMTA (redistribution rights UNCONFIRMED); mirror tooling under ODbL/PDDL. |

### Category 3: Suburban / Local Railway & MRTS (Southern Railway)

| Attribute | Verified Finding |
| :--- | :--- |
| **Primary Operator** | Southern Railway (SR), Chennai Division — Indian Railways. |
| **Official Portal** | `https://sr.indianrailways.gov.in/` |
| **Official Open Data Portal** | CUMTA Portal (`test.cumta.org` — `Southern Railways.zip`, collected Oct 4, 2026). |
| **Community Feed Mirror** | [ungalsoththu/ChennaiGTFS](https://github.com/ungalsoththu/ChennaiGTFS) (`data/srr/` and `srr-gtfs.zip`). |
| **Dataset Format & Paths** | 9 GTFS Static files (`agency.txt`, `calendar.txt`, `calendar_dates.txt`, `feed_info.txt`, `pathways.txt`, `routes.txt`, `stops.txt`, `stop_times.txt`, `trips.txt`) imported into `data/suburban_rail/imported/`, with a deterministic preprocessed representation in `data/suburban_rail/derived/`. |
| **Verified Contents** | 763 suburban services, 708 stations and platform nodes, 2,076 station pathways. Covers all 4 suburban corridors: 1. South Line (Beach–Tambaram–Chengalpattu–Tirumalpur). 2. West Line (Central MMC–Avadi–Tiruvallur–Arakkonam). 3. North Line (Central MMC–Ennore–Gummidipoondi–Sullurpeta). 4. MRTS (Beach–Velachery). |
| **Station Coordinates** | Exact coordinates for all major commuter hubs: Chennai Beach (`MSB`), Egmore (`MS`), Park (`MPK`), Guindy (`GDY`), Tambaram (`TBM`), Chengalpattu (`CGL`), Perambur (`PER`), Avadi (`AVD`), Tiruvallur (`TRL`), Arakkonam (`AJJ`), Velachery (`VLCY`). |
| **Caveats & Limitations** | Calendar has distant placeholder end date (`21700820`). Raw source has 19 modulo-24 rollover trips and 4 single-stop shuttle trips lacking terminus stations. Preprocessor normalizes rollover trips to extended hours in `data/suburban_rail/derived/`, but `readyForJourneyRouting: false` remains strictly enforced due to unconfirmed licensing and missing commercial schedules for new MRTS stations (`PRTK`, `ADMB`). |
| **License / Reuse** | Source schedule data © Southern Railway / Indian Railways (redistribution rights UNCONFIRMED); mirror tooling under ODbL/PDDL / MIT. |

### Category 4: Relevant Express Trains (Chennai Intercity & Peri-Urban Connections)

| Attribute | Verified Finding |
| :--- | :--- |
| **Primary Operator** | Southern Railway & other Indian Railways zones operating into Chennai terminals. |
| **Official Portals** | `https://www.irctc.co.in/`, `https://enquiry.indianrailway.gov.in/` (NTES), CRIS databases. |
| **Dataset Format** | Indian Railways train schedule tables (JSON / CSV schema). |
| **Verified Scope** | Express / Superfast / Vande Bharat trains that have authorized commercial stops inside the Chennai commuter belt: **Chennai Central (`MAS`)**, **Chennai Egmore (`MS`)**, **Tambaram (`TBM`)**, **Chengalpattu (`CGL`)**, **Perambur (`PER`)**, **Tiruvallur (`TRL`)**, and **Arakkonam (`AJJ`)**. |
| **Key Distinctions from Suburban Rail** | 1. **Ticketing**: Requires Indian Railways PRS reservation or UTS Unreserved Express tickets; suburban season tickets not uniformly honored on all express trains. 2. **Skip-Stop Nature**: Express trains skip all intermediate suburban stations (Chetpet, Palavanthangal, Tirusulam, Urapakkam, Potheri, etc.). 3. **Punctuality & Boarding**: Subject to intercity platform allocation, luggage checks, and coach composition. |
| **Data Strategy** | Must be maintained in a **dedicated schema** (`express_rail`), never merged into suburban EMU tables without explicit `train_type: 'express'` tags. |
| **License / Reuse** | Public government passenger timetable information © Indian Railways. |

---

## 3. Comparative Source Evaluation & Usability Matrix

| Source | Category | Usability for AccessRoute | Verification Status | Next Action |
| :--- | :--- | :--- | :--- | :--- |
| **CUMTA Open Data Portal** (`opendata.cumta.org`) | All Modes | Inaccessible (DNS host unresolvable). | **Unverified / Host Down** | Monitor DNS availability; request official developer access from CUMTA GIS fellowship. |
| **CUMTA Test Portal** (`test.cumta.org`) | CMRL, SRR, MTC | Technically downloadable via mirror; has placeholder MTC times and 2021 CMRL calendar. | **Partially Verified** | Use structural geometry, station nodes, and pathways; discard dummy timestamps. |
| **ungalsoththu/ChennaiGTFS** | Unified, MTC, CMRL, SRR | High. Standardized GTFS files with agency-prefixed IDs (`MTC-`, `CMRL-`, `SRR-`). | **Verified & Usable** | Adopt as reference schema and source for station catalogs and corridor alignments. |
| **CMRL Official Portal** (`chennaimetrorail.org`) | CMRL | High. Authoritative for operational stations (41), line colors, fare zones, and operating hours. | **Verified & Authoritative** | Use for station name normalization, line mappings, and headway rules. |
| **Southern Railway Divisional Timetables** | Suburban & Express | High. Authoritative for EMU suburban train numbers, terminal platforms, and express stops. | **Verified & Authoritative** | Ingest station codes, corridor linkages, and express stop classifications. |
| **OpenCity Chennai Datasets** (`data.opencity.in`) | MTC, MRTS | Medium. Good historical audits of bus shelters and MRTS alignments. | **Verified (Historical)** | Reference for bus stop geo-audits. |

---

## 4. Mode-Separated Data Architecture

To prevent data corruption, AccessRoute establishes four isolated data domains under `data/`:

```
data/
├── coverage/
│   └── network_scope.json          <-- Boundary definitions & multi-county corridor scope
├── chennai_metro/
│   ├── schema.json                 <-- CMRL GTFS-compatible schema
│   ├── verified_stations.json      <-- 41 operational stations + coordinates + accessibility
│   └── provenance.json             <-- Source, licensing, retrieval date & caveats
├── suburban_rail/
│   ├── schema.json                 <-- Suburban rail corridor & EMU schema
│   ├── verified_stations.json      <-- 50+ major suburban stations across 4 corridors
│   └── provenance.json             <-- Provenance metadata
├── mtc_bus/
│   ├── schema.json                 <-- MTC route & stop schema
│   ├── verified_hubs.json          <-- Verified bus terminals & interchange hubs
│   └── provenance.json             <-- Provenance metadata
└── express_rail/
    ├── schema.json                 <-- Express train schema with reservation flags
    ├── verified_express_stops.json <-- Major intercity stations in Chennai belt
    └── provenance.json             <-- Provenance metadata
```

---

## 5. Precise Acquisition Checklist for Phase 03 Ingestion

When the project advances to routing engine integration (Phase 03):

- [ ] **MTC Bus Routes & Stops**: Ingest canonical stop catalog and verified route variants from `ungalsoththu/ChennaiGTFS` (`data/mtc/`), validating stop coordinates against Greater Chennai spatial bounds.
- [ ] **CMRL Metro Schedules**: Obtain verified active CMRL timetable or official real-time feed; synthetic departures or unverified headway generation are prohibited.
- [ ] **Suburban Rail Schedules**: Ingest the 763 Southern Railway suburban services, linking EMU train series (`40xxx` South, `43xxx` West) to terminal platforms.
- [ ] **Express Train Corridors**: Ingest express stop timetables for MAS, MS, TBM, CGL, PER, and AJJ with strict `train_type: 'express'` tags and UTS ticket eligibility flags.
- [ ] **Pathways & Accessibility Ingestion**: Ingest the 2,076 CMRL/SRR station pathways and physical accessibility markers (lifts, ramps, step-free entrances) into the routing engine penalty graph.
