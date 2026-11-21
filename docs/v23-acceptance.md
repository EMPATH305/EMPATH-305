# v23 release gate

Updated 2026-11-20. Candidate: v23.27, main commit afd9b44d0487f5f0be223b2d7cd8847038f5ba70.
Status: automated checks and Pages deployment passed; final device acceptance pending. No further refactor-only release is required for this gate.

## Evidence and limits

- GitHub checks on the candidate: test, browser-smoke, Pages build/deploy and report-build-status all succeeded.
- 82 frontend and 108 backend tests passed for PR #73, including real-SDK loading of all 15 callable exports and presence/companionship lifecycle regression tests.
- CSS, interactions and frontend manifests are checked against committed bundles.
- Browser projects use Chromium for desktop, mobile dimensions and an Instagram user agent. They block Firestore and mock Functions; they do not establish real iOS/Instagram or production submission success. Service workers are blocked in these tests.
- Presence typing timeouts cancel on stop. Companionship cancels late setup after close and suspends resources on hide/pagehide; returning uses the original deadline. Collective-silence timers share that lifecycle. These are automated results, not device observations.

## Final device gate (pending, not yet claimed passed)

Use the published site on iPhone Safari, then open the same link inside Instagram. Do not clear site data or remove existing saved content.

1. Open E and M, confirm public content loads, switch rooms and language, and return without a blank screen or stuck loading state.
2. In E, type a disposable unsent draft, switch to another app for 10 seconds and return to the same page. Confirm the text remains and controls still respond. Do not submit the draft. Do not reload for this test: it checks background restoration, not a promise of reload persistence.
3. In H, start silent companionship, background for about 30 seconds and return. The countdown must reflect elapsed time, with one overlay. Leave it, then reopen and close it promptly; it must remain closed after the join request finishes.

If these pass, close the v23 release gate and start v24 private-weather development. If a failure appears, fix only that release blocker and repeat affected checks. Record actual device/browser and results here; do not infer a pass from silence or a generic synchronization confirmation.

## Scoped follow-up, not blockers for v24 design

- Further decomposition of shared frontend state. The ownership map below is the maintenance contract; source fragments are not isolated modules.
- Full production retry/offline matrix, real BFCache tests and UTC collective-silence audio restoration. Module tests cover retry/state behavior but do not prove all browser integrations. Track discovered defects separately; a reproducible data-loss or access failure becomes a blocker.
- Public App Check enforcement remains a separate staged rollout, dependent on real compatibility evidence.

## Shared-state ownership map

| State | Definition / coordination | Consumers and constraints |
| --- | --- | --- |
| journeyData and personal counters | frontend/02-consent-and-state.js; load in 04; updates in 09-soul-integration.js | Soul model normalizes/merges; actions/view use getter callbacks. Do not maintain a second unsynchronized copy. |
| public totals / room models | 02 defines globalCounts; 07 reconciles snapshots | P/T models and views read derived totals. Public totals are separate from personal counters. |
| subscription handles | realtime-lifecycle.mjs, configured in 06; coordinated by 07 | Room feeds, presence and clocks must register cleanup. Hide/pagehide stops; visible/persisted restore resumes. |
| animation state / frame handles | 06 defines isAnimating and star/sand handles | 07 visibility/HSP handling and 11/12 drawing code. Preserve cancellation and initialization order when extracting. |
| companionship generation / deadline | 13-presence-and-companionship.js | Late responses cannot recreate closed sessions. Background time counts toward five minutes. |

Further extraction should be justified by a concrete change or defect, not by a target number of files.

### Mobile layout follow-up (v23.28)

The user completed device testing and reported crowded H/M layouts; do not treat
that report as final visual acceptance. This patch gives M a dedicated 420px gap,
12 separated phone stars with bounded glow, and hit testing limited to rendered
stars. H uses a vertical phone journey and readable single-column daily records.
Desktop layouts retain their existing structure. Browser regressions cover
320/390/768px, clustered high-brightness stars, text boundaries and hit selection.
Real iOS Safari/Instagram visual acceptance remains a device check.
