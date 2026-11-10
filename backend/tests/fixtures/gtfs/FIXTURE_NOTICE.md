# Synthetic GTFS Test Fixtures

**Notice**: The files in this directory are minimal, synthetic GTFS fixtures constructed solely for automated testing of the AccessRoute transit data ingestion pipeline (`backend/services/ingestion/`).

- They are **NOT** production transit datasets.
- They are used strictly to test success paths, boundary validation, calendar freshness detection, duplicate identification, and referential integrity failure cases.
- Production transit foundation data resides in `data/`.
