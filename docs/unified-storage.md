# Unified Storage

Unified Storage lets a user store one file across several connected Google Drive and Dropbox accounts. The file is split into chunks, and each chunk goes to one drive. DriveUnify keeps the metadata in Firestore and puts the file back together on download.

**It is not a backup.** Each chunk is stored once. If a drive loses a chunk, the file can only be repaired from the original file.

## Architecture

```
Browser (dashboard)
 ├─ pages/UnifiedStorage         UI: overview, upload, file list, dialogs
 ├─ hooks/useUnifiedStorage      glue: accounts/tokens (via useDrive.getFreshAccount), toasts, progress
 └─ services/unified/
     ├─ core.js                  pure logic: chunk layout, SHA-256, errors+retry, state machines,
     │                           capacity planner, lease/counter rules, in-memory repo
     ├─ providers.js             adapters: googleDriveAdapter, dropboxAdapter (one interface)
     ├─ engine.js                coordinator: plan, upload, resume, integrity, repair, delete, cleanup, download
     ├─ firestoreRepo.js         Firestore persistence (transactions for leases + counters)
     └─ sinks.js                 download destinations (stream to disk / capped Blob fallback)
```

- File bytes go straight between the browser and each provider. Nothing passes through a DriveUnify server, and Firestore never holds file bytes.
- The engine uses no Firebase or network APIs directly. Its repository, adapters and accounts are passed in, so the whole flow runs under `node --test` with in-memory fakes.
- It reuses the existing OAuth flows and token refresh (`useDrive.getFreshAccount`). Unified Storage adds no new auth code and no new Cloud Function.

### Chunking
- Chunks are 64 MiB (`DEFAULT_CHUNK_SIZE`), and their boundaries are saved once (`chunkSize`, `layoutVersion`). On resume, offsets and lengths come only from `(size, chunkSize)`, so they never shift.
- Each chunk becomes one provider object with a fixed name: `{fileId}.{index:6}.part`, or `….r{gen}.part` after a repair. A 64 MiB object fits one Dropbox `/files/upload` call (limit 150 MiB) and one Drive resumable PUT. Each provider's own request limits stay inside its adapter.
- At most 2 chunks upload and 2 download at a time. Only the chunks in progress are held in memory.

### Integrity
- Every chunk gets a SHA-256 hash, plus a Dropbox `content_hash` (SHA-256 over the hashes of its 4 MiB blocks). Both are computed in the browser with `crypto.subtle.digest` on that chunk's buffer only.
- **Whole-file checksum (`manifestSha256`)** is a SHA-256 over the chunk hashes in order. It is *not* the same value `sha256sum` gives for the file: Web Crypto has no streaming hash. Together with the per-chunk checks, it catches any changed, missing or reordered chunk.
- **Checking each upload:**
  - Drive: the file's `sha256Checksum` must match. If Drive hasn't filled that field in yet, DriveUnify downloads the chunk and hashes it.
  - Dropbox: the upload sends `content_hash`, so Dropbox rejects bytes that don't match, and the returned `content_hash` is compared as well.
- **Checking each download:** the chunk's length and SHA-256 must match before its bytes are written. A mismatch gets one more read before the chunk is marked corrupted. At the end, the total size and `manifestSha256` are checked.
- A chunk is `verified` only after these checks pass. A file is `ready` only when every chunk is verified.
- Checksums catch accidental corruption. They are not encryption or authentication.

### Placement
- **Free space per account** = the provider's quota (Drive `about.storageQuota`, Dropbox `get_space_usage`) − DriveUnify's reservations for other unfinished uploads − a margin (the larger of 256 MiB and 2%).
  - Drive reports no `limit` for unlimited accounts.
  - If a quota call fails, that account counts as having 0 free space.
- Each chunk goes to the account with the most free space left. If the known space is too small, or too fragmented for whole chunks, the upload is refused before anything is saved.
- **Manual placement:** the user ticks which drives to use.
- **A drive fills up mid-upload:** that account is excluded for the rest of the run, and its unfinished chunks move to other drives. If no space is left, the upload pauses with a "connect another drive or free space" error.

## Firestore data model

Ownership comes from the document path and is enforced in `dashboard/firestore.rules`. Nothing relies on an owner field sent by the client. This follows the existing `users/{uid}/connected_accounts` pattern.

| Path | Holds |
|---|---|
| `users/{uid}/unified_files/{fileId}` | the file record plus its upload session |
| `users/{uid}/unified_files/{fileId}/chunks/{c000000…}` | one document per chunk |
| `users/{uid}/unified_cleanup_jobs/{jobId}` | deletions still to do |

**How this differs from the suggested layout:**
- There is no separate `uploadSessions` collection. Each file has at most one session, so its fields live on the file document (`sessionId`, `sessionState`, `leaseOwner`, `leaseExpiresAt`, `lastActivityAt`, `lastError`). That lets one transaction update both.
- The collections are named `unified_files` and `unified_cleanup_jobs` (snake_case, as in this repo).

**File document:**
- `id`, `schemaVersion`, `name`, `size`, `mimeType`, `lastModified`
- `chunkSize`, `chunkCount`, `layoutVersion`
- `state`, `verifiedCount`, `bytesVerified`, `manifestSha256`
- `placement`, `allowedAccounts`, `reservations[{email, bytes}]`, `distribution[{email, provider, chunks}]`
- the session fields above, `createdAt`, `updatedAt`

**Chunk document:**
- `id`, `fileId`, `index`, `offset`, `length`
- `provider`, `accountEmail`, `objectName`, `objectId`, `generation`
- `state`, `sha256`, `contentHash`, `retryCount`, `lastError`, `updatedAt`, `verifiedAt`

**Cleanup job:**
- `id` (always the same for the same target), `fileId`, `chunkIndex`, `provider`, `accountEmail`
- `objectId` *or* `objectName`
- `status` (`pending`/`done`), `retryCount`, `nextRetryAt`, `lastError`, `createdAt`, `completedAt`

No tokens are stored in any of these records, and the rules reject `accessToken` and `refreshToken` fields on file documents.

**Indexes:** only single-field ones (chunks by `orderBy('index')`, files by `orderBy('createdAt')`, jobs by `where('fileId')`). No composite index is needed.

**Volume for a 15 GiB file** (240 chunks):
- 240 chunk documents, about 3 writes each (uploading, uploaded, verified), each inside a transaction that also updates the file document
- plus a lease heartbeat every ~40 s
- roughly 1,000–1,500 writes in total

UI progress updates at most every 250 ms, and only in memory.

## States

**File:**
- `uploading` → `ready`
- `ready` ⇄ `degraded` (after a failed check or download / after a repair)
- `degraded` → `ready` once repaired
- any of these → `deleting` → records removed

`planning`, `verifying` and `failed` are accepted by the transition table, but the engine doesn't currently use them.

**Chunk:**
- `pending` → `uploading` → `uploaded` → `verified`
- `uploaded` → `corrupted` → `uploading` (retry)
- `verified` → `corrupted` / `missing` (detected later) → `verified` (repaired)

**Session:**
- `active` → `paused` (user paused or cancelled), `interrupted` (an error, or the tab died so the lease expired), `completed`, or `cleanup_pending`

Every write is checked against these tables (`assertFileTransition`, `assertChunkTransition`, `assertSessionTransition` in `core.js`).

## Recovery

**Concurrency.** Before uploading, a tab takes a lease on the file (a 2-minute transaction, renewed on every chunk write and every 40 s).
- Each chunk write checks that this tab still holds the lease.
- A second tab gets "running in another tab".
- Once the lease expires, any tab can take over, and the old tab's late writes are rejected.
- Leases use the client's clock. Clock skew between different machines can shorten or lengthen a lease.

**Saved to Firestore, then sent to the provider.** A chunk's hashes and target are saved (`uploading`) before its bytes are sent.

**Retries never duplicate.** Before uploading a chunk, the engine looks up its fixed object name (Drive: a tagged `appProperties.duName`; Dropbox: the exact path).
- If a matching, verified object already exists, it's adopted.
- Any other object found under that name is queued for cleanup.
- Dropbox also uses `mode: overwrite`.

**Resume.**
1. The user selects the original file again.
2. The size must match exactly. A different name or modified time only produces a warning.
3. Every chunk whose hash is already recorded is re-read from the selected file and re-hashed. Any difference stops the resume.
4. The chunks that aren't verified yet are uploaded.

An interrupted chunk restarts from its beginning, so at most 64 MiB is uploaded again. Provider session URIs are not saved, which also avoids depending on how long those sessions stay valid.

**Repair.**
1. "Check integrity" compares provider metadata only, without downloading. It separates *missing* and *mismatch* from *unreachable* (network or access problems), and an unreachable chunk is never marked corrupted.
2. Repair reads the original file again. Each damaged chunk must match its stored SHA-256.
3. A replacement object (generation + 1) is uploaded to the same drive, or to another one if that fails, and verified.
4. Only then is the chunk record pointed at the replacement, and the old object queued for cleanup.

**Cancel or delete.**
- Cancel stops the transfer and asks "Keep it to resume later" or "Delete the incomplete upload".
- Logging out or closing the tab never deletes anything.
- Delete works like this:
  1. Mark the file `deleting` and the session `cleanup_pending`. No new uploads can start.
  2. Save a cleanup job for every known object ID, and a name lookup for chunks that were mid-upload when the ID wasn't recorded yet.
  3. Delete by exact ID. An object that's already gone counts as done.
  4. Failures back off exponentially (30 s up to 1 h, with jitter).
  5. Records are removed only when every job is done.
- Until then the file shows "Cleanup pending" with the last error, and the jobs are retried whenever the page loads with that account connected.

## Provider notes

**Google Drive**
- Uses the existing `drive` scope and the existing token refresh Cloud Function.
- Chunks go in a visible folder named "DriveUnify Unified Storage", tagged `appProperties.driveunify=unified-root`.
- Uploads use a resumable session with one PUT per chunk. Deletes are permanent (`files.delete`) and target exact IDs.
- `sha256Checksum` is sometimes missing right after an upload. The engine then downloads the chunk and hashes it.
- Rate limits (`userRateLimitExceeded`/`rateLimitExceeded`) are retried with backoff. A full drive (`storageQuotaExceeded`) triggers reassignment.

**Dropbox**
- Uses the existing PKCE / Cloud Function tokens.
- Chunks go to `/DriveUnify Unified Storage/` (inside the app folder if the Dropbox app has app-folder access).
- Uploads use single `/files/upload` calls with `content_hash`.
- Errors:
  - `insufficient_space` triggers reassignment.
  - `too_many_write_operations` and 429 are retried, honouring `Retry-After`.
  - `not_found` is treated as absent.

## Configuration

Nothing new is needed beyond the existing setup:
- `VITE_GOOGLE_CLIENT_ID`, `VITE_DROPBOX_CLIENT_ID`, the Firebase env vars
- the deployed token Cloud Functions

**Deploy the new rules:**

```bash
npx firebase-tools deploy --only firestore:rules
```

`firebase.json` points `firestore.indexes` at `client/firestore.indexes.json`, which doesn't exist (this was already the case). Deploying only the rules, as above, avoids that.

## Testing

```bash
npm --prefix dashboard test
```

This runs 55 tests: 14 existing transfer tests, 21 core, 8 adapter (mocked `fetch`) and 12 engine.

**Engine scenarios:**
- a round trip across both providers returns identical bytes
- a Firestore failure after a provider commit is reconciled with no duplicate
- a stale or second tab is locked out
- a drive filling up mid-upload moves chunks elsewhere
- not enough capacity is refused
- a file never becomes ready while verification keeps failing
- a corrupted chunk degrades the file, a wrong source is rejected, and repair works
- a missing chunk is detected
- cancel, then resume with the wrong file and then the right one
- failed cleanup is retried, and repeating it is harmless
- cleanup of objects whose IDs were never recorded
- revoked authorization

**Memory, measured in Chrome** with the real engine and in-memory providers:
- peak JS heap ≈ 364 MiB at 512 MiB and ≈ 382 MiB at 1.5 GiB, for both upload and download
- it stays flat as files grow (this includes garbage not yet collected)

**Not tested yet:**
- real Google Drive or Dropbox uploads (no live accounts were used)
- the page with real signed-in data
- the Firestore repository against the emulator
- files over 1.5 GiB, or anything near 15 GB
- older hardware

## Known limitations
- **Large downloads:** Chromium's File System Access API streams to disk at any size. Other browsers (Firefox, Safari) fall back to an in-memory Blob capped at 512 MiB, and larger downloads are refused with an explanation.
- **Progress granularity:** progress moves one chunk (64 MiB) at a time, because `fetch` reports no upload progress. Speed and time remaining show only after 5 s.
- **Memory:** peak use is ~2× chunk size plus hashing copies, which is ≈ 400 MiB of heap. Lower `DEFAULT_CHUNK_SIZE` and the concurrency values in `core.js` for very constrained machines. A chunk size change only affects new uploads.
- **Browser must stay open:** uploads and cleanup only run while DriveUnify is open (frontend only).
- **Saved file list:** the list loads at most 200 files (`listFiles`).
- **Pre-existing security issue:** Dropbox refresh tokens from the client PKCE fallback are stored in `users/{uid}/connected_accounts`, which the owner can read, and in `localStorage`. `addConnectedAccount` and `setLocalConnectedAccounts` strip only `accessToken`. Unified Storage doesn't change this, but it should be fixed: keep Dropbox refresh tokens server-side like the Google ones (`dropbox_tokens`).

## Next steps
1. Test against real accounts, using progressively larger files up to 15 GB, on older hardware.
2. Fix the Dropbox refresh-token storage.
3. Show progress within a chunk (XHR upload progress, or resume via the Drive session URI).
4. Add optional client-side encryption (needs a key-management decision).
5. Add redundancy (2 copies, or erasure coding) for real fault tolerance.
6. Add more providers: implement the six adapter methods in `providers.js` and register them in `ADAPTERS`.
