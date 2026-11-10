# AccessRoute — Experimental Derived Suburban Rail Timetable Notice

> [!WARNING]
> **EXPERIMENTAL ARTIFACT — NOT OPERATIONALLY VERIFIED — PRODUCTION ROUTING DISABLED**
> 
> This directory contains a deterministic, derived representation of the Southern Railway Suburban and MRTS timetable, produced by the Phase 06 preprocessor.
>
> - **Operational Currency**: `UNVERIFIED_HISTORICAL` (Schedules from October 2026 snapshot with placeholder calendar end dates `21700820`).
> - **Redistribution Rights**: `UNCONFIRMED` (Underlying Indian Railways passenger schedule data redistribution rights unconfirmed).
> - **Production Readiness**: `readyForJourneyRouting: false` (Strictly disabled).
> - **Eligible Trips**: 759 trips (740 unmodified daytime schedules + 19 safely normalized midnight rollover trips).
> - **Excluded Trips**: 4 incomplete shuttle trips (`43551_T1`, `43552_T1`, `43553_T1`, `43554_T1`) lacking terminus stations.
> - **Usage Boundaries**: This artifact is intended EXCLUSIVELY for offline routing-engine algorithm development, test fixtures, and network graph research. It MUST NOT be presented to passengers, journey planners, or map UIs as a live/current timetable.

---
**Preprocessor Version**: 1.0.0  
**Deterministic Content Hash (SHA-256)**: `ce69b631103cfe757ce10a25ba56026d12d2bce4d332e288adcb5a8d92ab629e`  
**Preprocessing Timestamp**: `2026-10-27T12:00:00.000Z`  
