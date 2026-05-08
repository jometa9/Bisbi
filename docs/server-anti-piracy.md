# Server-side anti-piracy hooks

Client-side hardening landed in [electron/src/backend/auth.ts](../electron/src/backend/auth.ts), [electron/src/backend/hwid.ts](../electron/src/backend/hwid.ts) and [electron/src/backend/apiClient.ts](../electron/src/backend/apiClient.ts). The client now sends extra headers and enforces a 7-day grace window for offline Pro users. To realise the benefit, the server (`bisbi.io`) must take advantage of this metadata. None of the changes below are required for the client to keep working — they're additive.

## New request headers

Every call from the desktop app to `https://bisbi.io/api/...` now includes:

| Header             | Example                                                        | Use                              |
| ------------------ | -------------------------------------------------------------- | -------------------------------- |
| `X-Bisbi-Device`   | `9af3...64hex...|c47e...32hex...` (sha256 + per-install salt)  | Stable per-machine fingerprint   |
| `X-Bisbi-Version`  | `0.1.1`                                                        | Client app version               |
| `X-Bisbi-Platform` | `darwin-arm64`, `win32-x64`                                    | OS + arch                        |

The HWID is `<hash>|<install-salt>` where the hash is derived from the OS-level platform UUID (macOS `IOPlatformUUID`, Windows registry `MachineGuid`, Linux `/etc/machine-id`) plus a random per-install salt. Same machine + same install ⇒ same HWID. Reinstalling rotates the salt (so reinstalls look like a new device — that's fine).

## Recommended server changes

### 1. Track device set per token

Add a `device_seen` table:

```sql
CREATE TABLE device_seen (
  token_id        UUID NOT NULL,
  hwid            TEXT NOT NULL,
  first_seen_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  app_version     TEXT,
  platform        TEXT,
  PRIMARY KEY (token_id, hwid)
);
```

On every request that includes `X-Bisbi-Device`, upsert this row. Then alert/auto-revoke when:

- A single token is seen from **more than N distinct HWIDs** within a short window (e.g. 3+ devices in a week ⇒ likely shared/leaked token).
- Usage spikes correlate with new HWIDs.

### 2. Enforce limits authoritatively in `/api/usage`

The client sends usage events to `POST /api/usage` and trusts the server's response. Two improvements:

- Return `403` (or a body with `blocked: true`) if the token has been revoked due to anomaly. Client should `logout()` the user when it sees this.
- Compute `wordsLimit` server-side from the actual subscription, not from anything the client tells you. The client already trusts the response.

### 3. Tighten `/api/license`

Currently returns plan + usage + pricing. Add:

- `revoked: boolean` — true if the token was killed (alert response, manual ban, etc.). Client should treat this as logout.
- Optional `recommendedClientVersion` so old/tampered clients can be flagged.

The client revalidates this endpoint:
- On login
- Every 5 minutes while running (background)
- Lazily before any transcription if the cached validation is older than 5 minutes
- Before `POST /api/checkout` or `/api/billing-portal`

### 4. Pro grace window: 7 days

If `/api/license` is unreachable for a Pro user, the client allows transcription for up to 7 days from the last successful validation, then blocks with reason `session-expired`. This means **revoking a Pro token only takes effect server-side once the client revalidates** — if you need an immediate kill switch, return `revoked: true` from `/api/license` and the client will logout.

### 5. Optional: signed nonce per transcription (future hardening)

Currently the client decides locally whether a transcription is allowed based on cached server state. A future iteration could:

1. Add `POST /api/transcribe-nonce` returning a short-lived signed token (~5 min, includes HWID + remaining budget).
2. Client must obtain a fresh nonce before each transcription batch.
3. Client posts the consumed nonce back as part of `/api/usage`.

Server enforces uniqueness/replay protection on nonces. This makes the gate non-bypassable by patching the local "is allowed" check, because the server never minted the nonce. Worth implementing once the headers + device tracking above are in place.

## What NOT to rely on

- The HWID is a fingerprint, **not** a secret. Anyone reading the client code can compute it. Useful for *correlation* (this token is being used from N machines), not for *authentication*.
- `X-Bisbi-Version` and `X-Bisbi-Platform` are trivially spoofable. Use them as advisory data, not as gates.
- Local enforcement in the client (limit checks, plan checks) is the last line of defence. Server should always re-check on usage submission.
