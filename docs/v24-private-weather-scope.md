# v24 private emotional weather

v24.0 implements the first milestone after user acceptance of v23.28. The complete product scope below still includes planned work.

- An opt-in, device-local view of the last 7 or 30 days of room visits. Store only day and room, not submitted text, identifiers or inferred diagnoses.
- Describe visit distribution and changes in activity. Do not infer that someone is calmer or healthier from fewer visits; emotional labels require explicit user input.
- Let the user explicitly choose one sentence to keep locally. Omit it from exported cards by default, and show an export preview before saving.
- Render a star-map card from aggregate data; no sensitive originals, scores, rankings or streak rewards.
- Provide clear local-data deletion and explain that clearing browser data removes this history. No server sync or AI analysis in the first release.
- Reuse existing safe-storage behavior and visual components. Keep ordinary anonymous room use available without opting in.

## Delivered in v24.0

- Independent local modules load on every room without waiting for Firebase.
- Off by default; one day/room pair per local calendar day after opt-in. Same-day reloads do not increase counts. No older history is imported.
- H reuses the existing private-sky section for 7/30-day room-day summaries, pause/resume, and confirmed clear-and-disable controls. Self-selected mood entries remain separate.
- Retains the current 30-day calendar window, pruning on next access. Date/room pairs only, plus schema version and enabled flag; no text, IDs, exact timestamps or cloud synchronization.
- Failed writes are disclosed as page-only changes. Failed deletion is explicitly reported with browser-data cleanup instructions; it is never reported as successful.
- Clear removes only the weather key. Self-selected moods, Soul Key, future letters and other local data remain intact.

## Next milestone

User-selected retained sentence, refined star-map visualization and privacy-safe card export with preview. These are not implemented in v24.0. No public accounts or social graph.
