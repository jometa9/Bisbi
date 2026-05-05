# B2DM — Auto-update & License API

Spec for backend work required by the desktop client.
Covers two concerns:

1. **Auto-update**: static file server so the installed desktop app can self-update.
2. **License validation**: formal contract for the existing `/api/validate-subscription` endpoint.

Base domain assumed: `https://b2dm.app`.

---

## 1. Auto-update endpoint

The desktop client uses [`electron-updater`](https://www.electron.build/auto-update) configured with a `generic` provider pointing at `https://b2dm.app/updates/`.

This is **not an API** — it is a **static file host**. No dynamic logic, no auth, no database. Just files served over HTTPS.

### 1.1 Files that must be served

Every time a new desktop version is released, we upload a small set of files to `/updates/`. There are three platforms, each with its own manifest and binary:

| File | Purpose | Content-Type |
|------|---------|--------------|
| `latest-mac.yml` | macOS manifest | `text/yaml` or `text/plain` |
| `latest.yml` | Windows manifest | `text/yaml` or `text/plain` |
| `latest-linux.yml` | Linux manifest (future) | `text/yaml` or `text/plain` |
| `B2DM-<version>-arm64-mac.zip` | macOS binary (used by updater) | `application/zip` |
| `B2DM-Setup.exe` | Windows installer | `application/octet-stream` |
| `blockmap` files (optional) | Enable delta updates | `application/octet-stream` |

> **Note**: these exact filenames are produced by our `npm run build` step — the API dev does not generate them, just hosts them.

### 1.2 Example manifest (`latest-mac.yml`)

This is what `electron-builder` outputs. The client fetches this file to decide if an update is needed.

```yaml
version: 0.2.0
files:
  - url: B2DM-0.2.0-arm64-mac.zip
    sha512: gY9s1r...==
    size: 95431221
path: B2DM-0.2.0-arm64-mac.zip
sha512: gY9s1r...==
releaseDate: '2026-04-20T12:00:00.000Z'
```

The client compares `version` to its own version and, if newer, downloads `files[0].url` relative to `/updates/`.

### 1.3 Required request behavior

The static file server must support:

| Requirement | Why |
|-------------|-----|
| **HTTPS only** | `electron-updater` rejects plain HTTP |
| **GET** on all files above | Updater fetches manifest + binary |
| **HEAD** on binaries | Updater probes file size before download |
| **Correct `Content-Length`** | Progress bar depends on it |
| **No auth** (public) | App checks for updates before login |
| **Stable URLs** | Overwriting a file in-place is fine; renaming breaks older clients |

### 1.4 Caching (important)

- `*.yml` manifests: **short cache** (`Cache-Control: max-age=60`) or no cache. These change on every release and stale copies delay updates.
- Binaries (`*.zip`, `*.exe`): **long cache is fine** (`Cache-Control: public, max-age=31536000, immutable`). Filenames include the version, so they never change content.

### 1.5 CORS

Not required. The updater runs in the Electron main process (native `fetch`, no browser origin). Do **not** add `Access-Control-Allow-Origin: *` unless there's another reason.

### 1.6 Range requests

Not required. The client is configured with `useMultipleRangeRequest: false`, so standard full-file downloads are fine. Any basic static host (nginx, Cloudflare, S3+CloudFront, Vercel) works out of the box.

### 1.7 Release workflow (for reference)

1. Founder runs `npm run build` locally → produces files in `release/`.
2. Founder uploads the 2–3 files for each platform to `/updates/`.
3. Installed clients auto-detect the new manifest within 6h (or on next app launch).
4. Update downloads silently in the background; user sees a non-intrusive banner.

The API dev's only ongoing responsibility is **keeping `/updates/` accessible**.

---

## 2. License validation endpoint

This endpoint already exists. This section **formalizes the contract** so the desktop client can rely on it.

### 2.1 Request

```
GET https://b2dm.app/api/validate-subscription?apiKey=<LICENSE_KEY>
```

- No auth headers required — the key **is** the auth.
- `apiKey` is the full license key the user entered in the desktop app.
- No body.

### 2.2 Success response (HTTP 200)

```json
{
  "email": "user@example.com",
  "name": "Jane Doe",
  "plan": "pro",
  "version": "0.2.0"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | string | **yes** | Account email. Client rejects the response if missing or empty. |
| `name` | string | no | Display name. Empty string is OK. |
| `plan` | string | **yes** | See [2.4](#24-plan-values). |
| `version` | string | no | Latest app version known to the server. **Currently unused by the client** — update detection goes through `/updates/`. Safe to send or omit. |

The response must be valid JSON with `Content-Type: application/json`.

### 2.3 Error response

Any non-2xx status is treated as an error. Preferred body shape:

```json
{
  "error": "Human-readable message"
}
```

The client surfaces `error` to the user as-is, so write it for end users (e.g. `"License key is invalid or expired"`, not `"SQL error in validate_sub_v2"`).

Common status codes expected:

| Status | Meaning |
|--------|---------|
| 400 | Malformed request (missing/empty `apiKey`) |
| 401 | Key not found |
| 403 | Key found but subscription cancelled/suspended |
| 5xx | Server-side error |

### 2.4 `plan` values

The client normalizes `plan` as follows:

| Server sends | Client treats as |
|--------------|------------------|
| `"free"`, `"none"`, `"expired"`, `"cancelled"`, `""`, missing | **Inactive** (user is logged in but cannot use paid features) |
| Anything else (`"pro"`, `"starter"`, `"agency"`, etc.) | **Active** (full app access) |

Casing doesn't matter — the client lowercases before comparing.

Keep the set of "paid" plan names stable. Adding new tiers is fine (they'll be treated as active), but renaming or removing existing ones will affect users mid-session.

### 2.5 Caching

The client **does not cache** this response across launches — it re-validates on every app start and whenever the user clicks "Refresh subscription" in Settings.

The server should **not** aggressively cache this response either. A few seconds of edge cache is fine; minutes is not (it delays reflecting plan changes after a user upgrades/cancels).

---

## 3. Security checklist

- [ ] HTTPS enforced on both `/updates/` and `/api/validate-subscription`.
- [ ] `/api/validate-subscription` is rate-limited per IP (e.g. 10 req/min). Legitimate clients validate on launch + manual refresh only — anything higher is abuse.
- [ ] `/updates/` is not behind any auth; it must be reachable before the user logs in.
- [ ] TLS cert valid for `b2dm.app`. Self-signed certs break `electron-updater` silently.
- [ ] No PII in updater URLs or query strings. `/updates/` requests are anonymous by design.

---

## 4. Testing

### 4.1 Validate-subscription smoke test

```bash
curl "https://b2dm.app/api/validate-subscription?apiKey=TEST_KEY"
```

Expected on success:

```json
{"email":"you@b2dm.app","name":"You","plan":"pro"}
```

Expected on invalid key: HTTP 401/403 with `{"error":"..."}`.

### 4.2 Updates smoke test

```bash
curl -I "https://b2dm.app/updates/latest-mac.yml"
curl    "https://b2dm.app/updates/latest-mac.yml"
```

Expected: HTTP 200, valid YAML body matching the example in §1.2.

### 4.3 End-to-end update test

1. Install B2DM v0.1.0 on a machine.
2. Release v0.2.0 and upload files to `/updates/`.
3. Open the installed app. Within ~15 seconds the Home banner should show "Downloading update v0.2.0".
4. When complete, banner shows "Update ready — v0.2.0" with a Restart & install button.

---

## 5. Summary of what to build

- [ ] Static file server at `https://b2dm.app/updates/` serving files from §1.1.
- [ ] Headers per §1.4 (short cache on `.yml`, long cache on binaries).
- [ ] Keep `/api/validate-subscription` matching the contract in §2.
- [ ] Security checks from §3.

Nothing else is needed on the backend for the desktop client's auto-update flow to work.
