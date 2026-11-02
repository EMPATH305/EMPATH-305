# EMPATH callable observability runbook

This runbook covers the privacy-safe telemetry emitted by EMPATH public callable functions and the staged App Check rollout.

## Privacy contract

Every telemetry event uses `telemetryEvent: "empath.callable"`. It may contain only:

- callable name and success or rejection;
- App Check verified/enforced booleans;
- authenticated boolean;
- a coarse client family;
- a coarse duration bucket;
- an allowlisted callable error code;
- allowlisted boolean result flags.

Never add submitted text, image data, raw User-Agent, IP address, document ID, request ID, deletion token, Soul Key, error message, stack trace, or arbitrary request/result objects to these events.

## Cloud Logging filters

All EMPATH callable telemetry:

```text
resource.type="cloud_run_revision"
jsonPayload.telemetryEvent="empath.callable"
```

Rejected calls:

```text
resource.type="cloud_run_revision"
jsonPayload.telemetryEvent="empath.callable"
jsonPayload.outcome="rejected"
```

Calls without a verified App Check token:

```text
resource.type="cloud_run_revision"
jsonPayload.telemetryEvent="empath.callable"
jsonPayload.appCheckVerified=false
```

Embedded-browser compatibility checks:

```text
resource.type="cloud_run_revision"
jsonPayload.telemetryEvent="empath.callable"
(jsonPayload.clientFamily="ios-embedded" OR jsonPayload.clientFamily="android-embedded" OR jsonPayload.clientFamily="other-embedded")
```

Duplicate room submissions:

```text
resource.type="cloud_run_revision"
jsonPayload.telemetryEvent="empath.callable"
jsonPayload.functionName="submitRoomContent"
jsonPayload.deduplicated=true
```

## Enforcement gate

Do not enable enforcement from a single successful manual test. Before changing an endpoint from `false` to `true` in `PUBLIC_APP_CHECK_ENFORCEMENT`:

1. Observe at least seven consecutive days after deployment.
2. Test iOS Safari, Android Chrome, and at least one LINE or Instagram embedded browser.
3. Confirm verified traffic exists for every client family that has meaningful traffic.
4. Investigate any family with repeated successful requests but missing App Check verification.
5. Confirm the rejected-call rate and `resource-exhausted` rate are not rising because of a client retry loop.

Recommended rollout order:

1. `recordSiteVisit` as the non-critical canary.
2. `joinSilentCompanionship` and `reactToRoomContent`.
3. `submitRoomContent`, followed by `deleteRoomContent`.
4. `sendDriftLetter` and `receiveDriftLetter`.
5. `submitContentReport` and maintenance endpoints.

Deploy and observe each stage before continuing. Do not combine an enforcement change with an unrelated feature release.

## Rollback

If legitimate users are rejected after enforcement:

1. Set only the affected function back to `false` in `PUBLIC_APP_CHECK_ENFORCEMENT`.
2. Run `npm test`.
3. Deploy Functions again.
4. Keep telemetry enabled and investigate the affected coarse client family before retrying.
