# Solution Notes

## Blocking -> async I/O

### What changed

`backend/src/routes/items.js` was changed from blocking file access to async file access with `async`/`await`.

- `readData()` changed from `fs.readFileSync(...)` to `await fs.promises.readFile(...)`
- Route handlers for `GET /api/items`, `GET /api/items/:id`, and `POST /api/items` were converted to `async` handlers
- The write path changed from `fs.writeFileSync(...)` to `fs.promises.writeFile(...)`

### Why it matters

With synchronous file access, Node.js has to wait until the read or write finishes. During that time, other requests can be delayed.

Using async I/O makes the server more responsive, especially when several requests arrive at the same time.

This is important because all items routes read the JSON file, and the POST route saves the whole file again.

### Trade-offs

The async version is better for performance, but it adds a little more code handling:

- errors now need to be handled across awaited calls
- route handlers must be marked `async`

That trade-off is worth it because the server handles traffic more smoothly than with blocking file I/O.

## Stats caching

The stats work was separated into a cache-backed path in `backend/src/utils/statsCache.js`, which is used by `backend/src/routes/stats.js`.

### What changed

- stats are read asynchronously from `data/items.json`
- computed stats are stored in memory after the first successful load
- cached values are reused while they are still fresh
- file watching triggers a debounced refresh when the data file changes
- concurrent refreshes are deduplicated with a shared in-flight promise

### Why it matters

Without caching, every `/api/stats` request would read the file again and recalculate the same values.

Caching makes the stats endpoint faster and lighter:

- lower latency for repeated `/api/stats` calls
- fewer repeated reads of the same JSON file
- less CPU spent recomputing totals and averages
- better behavior when many clients ask for stats at once

Using both TTL and a file watcher gives a better balance:

- the file watcher helps refresh stats soon after the data changes
- the TTL acts as a fallback in case a watcher event is missed
- together they keep stats fast to serve while still staying reasonably fresh

### Trade-offs

Caching also brings a few trade-offs:

- responses can be briefly stale until the cache refreshes
- cache invalidation is now part of the design
- watcher and retry logic add extra code compared with recalculating stats every time
- a single file save can trigger multiple the watcher events
- if the file becomes invalid, the cache may keep serving the last good value until the file is fixed

Even with those trade-offs, caching is a good fit here because stats are likely to be read more often than the data changes.

## Frontend memory leak fix

### What changed

The items page and data context were updated so an in-flight request can be canceled when the page unmounts.

- `frontend/src/pages/Items.js` now creates an `AbortController` inside `useEffect`
- the cleanup function now calls `controller.abort()`
- `frontend/src/state/DataContext.js` now accepts a `signal` and passes it to `fetch(...)`
- abort errors are ignored, while real errors are still thrown

### Why it matters

Before this change, the items request could still in progress after the user left the page.

That means the app could keep doing unnecessary work after the component was gone. It also makes the code harder to reason about when requests are slow.

By canceling the request in cleanup, the page behaves more safely:

- the request stops when the component unmounts
- the app avoids updating shared state from a request that is no longer needed
- the code is better prepared for future search and pagination work

### Trade-offs

This fix adds a small amount of extra code:

- an `AbortController` must be created in the effect
- the fetch helper now accepts a `signal`
- abort errors must be handled separately from normal failures
- code is a bit messy now and has lost some readability, which leaves room for improvement

That trade-off is small and worth it because the request lifecycle is now handled more cleanly.
