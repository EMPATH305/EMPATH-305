# v23 architecture acceptance

Status: in progress. Source splitting is not full isolation of shared state.

## Verified in repository checks

- Backend handlers are separated by responsibility. The real-SDK startup test loads all 15 callable exports; unit tests cover authorization, submissions and limits.
- CSS, interaction sources and frontend integration fragments rebuild to their committed outputs. Integration fragments intentionally share scope and initialization order.
- Realtime lifecycle tests cover repeated stop/resume, cleanup failures, partial startup, auxiliary replacement, synchronous removal, and late primary handles after stop.
- `frontend/07-realtime-and-feeds.js` disconnects the room observer and stops tracked subscriptions on pagehide/hidden; persisted pageshow resumes subscriptions.

## Remaining acceptance work

1. Presence typing timeout: `frontend/13-presence-and-companionship.js` clears its display timeout during unsubscribe but not its pending typing write timeout. Decide and test hidden/pagehide behavior before changing it.
2. Review the silent-companionship interval and final initialization silence interval against hidden/pagehide/BFCache behavior. Preserve the five-minute user experience and avoid duplicate timers on restore.
3. Document ownership of shared journey, room and animation state across frontend fragments; extract only boundaries that can be independently exercised. Do not count fragments as isolated modules.
4. Browser regression: verify navigation, background/restore, offline/reconnect, language changes, drafts and submission retry. Existing mocked browser tests do not prove live Firebase writes or real iOS/Instagram compatibility.
5. Record final manual read-only checks on the published site and the user's device checks. Do not submit synthetic private content to production for acceptance.

Completion requires each remaining item to have recorded evidence or an explicit scoped deferral. New emotional-weather features remain outside v23.
