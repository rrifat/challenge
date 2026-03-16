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

Before this change, the items request could still be in progress after the user left the page.

That means the app could continue working for a screen that's no longer mounted, which is wasteful and can make the async behaviour harder to reason about.

By canceling the request in cleanup, the request lifecycle is more closely tied to the component lifecycle:

- unnecessary network work is canceled when the page unmounts
- the code is less likely to process results from a request that is no longer relevant
- the page behaves more predictably when requests are slow or the user navigates quickly

### Trade-offs

This fix adds a small amount of extra code:

- an `AbortController` must be created and cleaned up in the effect
- the fetch helper now accepts a `signal`
- abort errors must be handled separately from normal failures
- code is a bit messy now and has lost some readability, which leaves room for improvement

That trade-off is small and worth it because the request lifecycle is now managed more safely and explicitly.

## Pagination and server-side search

### What changed

The items list flow was updated on both the backend and frontend so search and pagination are handled by the API instead of filtering a full list in the browser.

- `backend/src/routes/items.js` now accepts `page`, `limit`, and `q`
- the items route now returns a paginated response object instead of only an array
- search now filters by normalized text on the server 
- `backend/src/routes/items.test.js` now covers pagination, search, and invalid query params
- `frontend/src/state/DataContext.js` now stores `items`, `page`, `total`, `totalPages`, `loading`, and `error`
- `frontend/src/pages/Items.js` now includes a search form, result summary, empty state, and Previous/Next pagination controls

### Why it matters

This task specifically asked for server-side search, which means the browser should not fetch the whole dataset and filter it locally.

Moving the filtering and slicing logic to the backend gives the client a cleaner contract:

- the frontend only requests the page it needs
- search results stay consistent with pagination
- the UI knows how many results matched and whether another page exists
- the approach scales better as the items dataset grows

This also prepares the list for later virtualization work, because the page already works from a structured result set instead of assuming a single flat response.

### Trade-offs

The main trade-off is that the API and client state became a little more complex:

- the backend now validates and parses more query params
- the frontend must keep pagination and query state in sync
- the response shape is more verbose than returning a plain array

That extra structure is worthwhile here because the UI needs metadata like `total` and `totalPages` to implement a correct paginated experience.

## Frontend virtualization

### What changed

The items page now uses `react-window` to virtualize the rendered list.

- `frontend/src/pages/Items.js` now renders the results with `List` from `react-window`
- the previous `items.map(...)` rendering path was replaced with a virtualized row component
- the list was given a fixed row height and a bounded viewport height
- the list resets back to the first row when the page or search query changes

### Why it matters

Pagination helps reduce how much data the browser fetches at once, but it does not automatically reduce how many DOM nodes the browser has to manage for the current page.

If a page grows to 100 or more rows, rendering every item at once can make scrolling and layout work more expensive than necessary.

Virtualization solves that by keeping the full result set in JavaScript memory while only rendering a small visible window of rows in the DOM.

In this implementation:

- `rowCount` tells `react-window` how many total items exist
- `rowHeight` tells it how tall each row is
- the list viewport height is capped so only a limited number of rows are visible at one time
- as the user scrolls, rows that leave the viewport are unmounted and new rows are mounted

That means the user can scroll through a long list, but the browser only has to manage a small number of row elements at any moment.

### Why `react-window` over `@tanstack/react-virtual`

I chose `react-window` because it fits this page well:

- the UI is a simple single-column list
- each row is predictable enough to use a fixed height
- the library keeps the implementation focused and easy to explain

This keeps the solution aligned with the take-home requirement without adding more flexibility than the current screen needs.

### Trade-offs

Virtualization is a good fit for larger pages, but it comes with real trade-offs:

- the implementation is more complex than a normal mapped list
- the UI now depends on an additional library
- fixed-height virtualization works best when row content stays visually consistent
- accessibility and testing can require a little more care because not every item is mounted at once

If the row content later becomes highly dynamic in height, this implementation would either need measurement logic or a different virtualization approach.

For the current app, that trade-off is reasonable because the goal is to stay smooth when page sizes grow while keeping the implementation understandable.
