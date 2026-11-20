# v24 private emotional weather — proposed first slice

Implementation begins after the v23 device gate. This is a bounded product brief, not a completed feature.

- An opt-in, device-local view of the last 7 or 30 days of room visits. Store only day and room, not submitted text, identifiers or inferred diagnoses.
- Describe visit distribution and changes in activity. Do not infer that someone is calmer or healthier from fewer visits; emotional labels require explicit user input.
- Let the user explicitly choose one sentence to keep locally. Omit it from exported cards by default, and show an export preview before saving.
- Render a star-map card from aggregate data; no sensitive originals, scores, rankings or streak rewards.
- Provide clear local-data deletion and explain that clearing browser data removes this history. No server sync or AI analysis in the first release.
- Reuse existing safe-storage behavior and visual components. Keep ordinary anonymous room use available without opting in.

First implementation milestone: local data model, opt-in/clear controls and an empty-state preview. Next milestone: 7/30-day visualization and privacy-safe card export. No public accounts or social graph.
