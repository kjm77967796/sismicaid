---
name: add-official-source
description: Add or update an official data source ingestion flow, including source registry, fetch job, normalization, logging and API exposure.
argument-hint: "[source-name]"
---

# Add Official Source

Add or update the official source requested in $ARGUMENTS.

## Required process

1. Read:
   - `docs/DATA_SOURCES.md`
   - `docs/DATABASE.md`
   - `docs/API.md`
   - `docs/SECURITY_AND_PRIVACY.md`

2. Confirm the source type:
   - seismic
   - tsunami
   - civil protection
   - recommendations
   - manual verified source

3. Add or update `official_sources`.

4. Implement fetch logic:
   - timeout
   - controlled retry
   - error handling
   - fetch run logging
   - raw payload storage

5. Normalize data into internal tables.

6. Never expose raw external payload directly from public endpoints.

7. Ensure public API returns:
   - normalized fields
   - source name
   - source URL if safe
   - last updated timestamp
   - stale indicator

8. Add tests for:
   - successful normalization
   - duplicate external ID
   - source failure
   - malformed payload
   - stale data

9. Run backend checks.

10. Ask `backend-official-data` or `qa-code-reviewer` to review the source integration.