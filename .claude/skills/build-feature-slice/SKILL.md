---
name: build-feature-slice
description: Build a complete vertical feature slice for Sismicaid, including shared types, backend endpoint, frontend UI, states, validation and tests.
argument-hint: "[feature-name]"
---

# Build Feature Slice

Implement the feature requested in $ARGUMENTS as a vertical slice.

## Required process

1. Read the relevant docs:
   - `docs/SPEC.md`
   - `docs/design.md`
   - `docs/API.md`
   - `docs/DATABASE.md`
   - `docs/SECURITY_AND_PRIVACY.md`

2. Identify affected areas:
   - `packages/shared`
   - `apps/api`
   - `apps/web`

3. Define or update shared types first.

4. Implement backend changes if needed:
   - database schema
   - module
   - validation
   - endpoint
   - DTO
   - tests

5. Implement frontend changes:
   - API service
   - components
   - page integration
   - loading state
   - empty state
   - error state
   - mobile responsive behavior

6. Check emergency rules:
   - source visible
   - last update visible
   - verification status visible
   - no private data exposed
   - no map-only critical flow

7. Run:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`

8. Ask `qa-code-reviewer` to review the result.