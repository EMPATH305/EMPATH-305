# v23 architecture acceptance

Status: in progress. Source splitting is not full isolation of shared state.

## Verified in repository checks

- Backend handlers are separated by responsibility. The real-SDK startup test loads all 15 callable exports; unit tests cover authorization, submissions and limits.
- CSS, interaction sources and frontend integration fragments rebuild to their committed outputs. Integration fragments intentionally share scope and initialization order.
- Realtime lifecycle tests cover repeated stop/resume, cleanup failures, partial startup, auxiliary replacement, synchronous removal, and late primary handles after stop.
- `frontend/07-realtime-and-feeds.js` disconnects the room observer and stops tracked subscriptions on pagehide/hidden; persisted pageshow resumes subscriptions.

## Remaining acceptance work

1. Automated presence/session cleanup checks completed in v23.27: typing timeouts cancel on stop; late join replies cannot reopen a closed session; hidden/pagehide suspends timers and listeners, and restore uses the original five-minute deadline. Verify the same scenarios on a real mobile browser.
2. Both companionship and collective-silence intervals now belong to the auxiliary lifecycle. Companionship starts its five-minute deadline when opened, including time awaiting join; background time still counts. Confirm collective-silence overlay/audio restoration on device.
3. Document ownership of shared journey, room and animation state across frontend fragments; extract only boundaries that can be independently exercised. Do not count fragments as isolated modules.
4. Browser regression: verify navigation, background/restore, offline/reconnect, language changes, drafts and submission retry. Existing mocked browser tests do not prove live Firebase writes or real iOS/Instagram compatibility.
5. Record final manual read-only checks on the published site and the user's device checks. Do not submit synthetic private content to production for acceptance.

Completion requires each remaining item to have recorded evidence or an explicit scoped deferral. New emotional-weather features remain outside v23.
