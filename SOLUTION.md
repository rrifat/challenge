# Solution Notes

## Blocking -> async I/O

### What changed

`backend/src/routes/items.js` was updated from synchronous filesystem access to promise-based I/O with `async`/`await`.

- `readData()` changed from `fs.readFileSync(...)` to `await fs.promises.readFile(...)`
- Route handlers for `GET /api/items`, `GET /api/items/:id`, and `POST /api/items` were converted to `async` handlers
- The write path changed from `fs.writeFileSync(...)` to `fs.promises.writeFile(...)`

### Why it matters

The original synchronous reads and writes blocked Node.js's event loop while the other process waited. That means one request doing file I/O could delay unrelated requests. It improves concurrency under multiple simultaneous requests.

This is especially important in `items.js` because every route reads the JSON file, and the `POST` route writes the full dataset back to disk.

### Trade-offs

The async version scales better, but it does make control flow slightly more careful:

- errors now need to be handled across awaited calls
- route handlers must be marked `async`

That added complexity is usually worth it because the server remains far more responsive under load than with blocking file I/O.

