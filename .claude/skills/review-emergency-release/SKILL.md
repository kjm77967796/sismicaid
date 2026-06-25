---
name: review-emergency-release
description: Review whether the current application state is safe to publish during an emergency, checking build, privacy, copy, source labeling, misinformation risk and critical UX.
---

# Review Emergency Release

Review the current repository as if it were going to be published for real users in an emergency.

## Checklist

1. Run available checks:
   - `pnpm typecheck`
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`

2. Review frontend:
   - mobile usability
   - loading states
   - error states
   - empty states
   - map/list fallback
   - touch targets
   - dark mode contrast
   - offline messaging

3. Review backend:
   - validation
   - DTO privacy
   - source logging
   - fetch error handling
   - no private fields in public responses

4. Review emergency communication:
   - no earthquake prediction
   - no unsupported tsunami claims
   - no confusion between magnitude and intensity
   - citizen reports clearly marked as pending
   - source and timestamp visible

5. Review privacy:
   - no private contacts exposed
   - no precise private addresses exposed
   - no victim names exposed
   - no minor data exposed
   - no image metadata exposed

6. Return:
   - Safe to publish: yes/no
   - Blocking issues
   - Non-blocking issues
   - Recommended next release tasks