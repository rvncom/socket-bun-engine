# Changelog

## 1.0.3

### Bug Fixes

- **Packet loss during backpressure**: Removed pre-send backpressure early return in `WS.send()` — packets dequeued by `flush()` are no longer silently dropped when backpressure is detected mid-send. Post-send backpressure check still pauses future flushes.

### New Features

- **Rate limiting**: Per-socket message rate limiting via `rateLimit` option (`{ maxMessages, windowMs }`). Dropped messages emit `rateLimited` event on the socket.
- **Graceful degradation**: `degradationThreshold` option (0–1 fraction of `maxClients`). When exceeded, new polling connections are rejected (WS only) and ping interval is doubled for new connections. Server emits `degradation` event on state change.
- **Broadcast**: `server.broadcast(data)` and `server.broadcastExcept(excludeId, data)` methods for sending messages to all connected sockets.
- **Export `RateLimitOptions` and `DegradationEvent`**: Types available from package entry point.

### Cleanup

- **Parser**: Removed unused `BinaryType` type and `_binaryType`/`binaryType` parameters from `decodePacket` and `decodePayload`

### CI/CD

- **Trusted Publishing**: Publish workflow uses NPM OIDC provenance (no `NODE_AUTH_TOKEN` secret required)

## 1.0.2

### New Features

- **Built-in server metrics**: `server.metrics` returns a snapshot with connections, disconnections, activeConnections, upgrades, bytesReceived, bytesSent, errors, and avgRtt
- **Socket RTT measurement**: `socket.rtt` tracks round-trip time from ping/pong cycles (ms)
- **WebSocket backpressure**: Automatically pauses writes when `getBufferedAmount()` exceeds `backpressureThreshold`, resumes on drain
- **`backpressureThreshold` option**: Configurable send buffer limit (default 1MB, set 0 to disable)
- **Export `MetricsSnapshot`**: Type available from package entry point

### Dependencies

- Updated `@types/bun` to 1.3.10, `prettier` to 3.8.1, `socket.io` to 4.8.3, `typescript` peer to ^5.9.2

## 1.0.1

### Performance

- **WebSocket cork()**: Multiple packets are now batched into a single syscall via `ws.cork()` instead of individual sends
- **URL parsing**: `handleRequest()` accepts an optional pre-parsed `URL` to avoid double parsing when used via `handler()`

### New Features

- **`server.close()` returns Promise**: Resolves when all clients have disconnected — enables graceful shutdown
- **`server.sockets` iterator**: Iterate over all connected Socket instances
- **`server.getSocket(id)`**: Look up a specific socket by session ID
- **Export `Socket` and `CloseReason`**: Now available from the package entry point

### CI/CD

- **GitHub Actions**: Added `ci.yml` — runs lint, test, compile on push/PR to main
- **GitHub Actions**: Added `publish.yml` — automated NPM publish on `v*` tag push

## 1.0.0 — Fork from `@socket.io/bun-engine` v0.1.0

### Bug Fixes

- **CORS**: Fixed unsafe non-null assertion on `Origin` header — no longer crashes when the header is missing
- **Polling memory leak**: Pending poll promise now properly resolves on client abort, preventing leaked connections
- **Polling body pre-check**: `Content-Length` is validated against `maxHttpBufferSize` before buffering the full request body
- **Socket upgrade**: `fastUpgradeTimerId` declared before usage in close callback, preventing potential undefined reference
- **Event emitter**: Replaced `@ts-ignore` with proper type assertion

### New Features

- **`clientsCount` getter**: Public API to get the number of connected clients (no more `(engine as any).clientsCount`)
- **`maxClients` option**: Optional limit on concurrent connections — returns HTTP 503 when capacity is reached

### Removed

- **Hono**: Removed as a dependency and from test setup (was only used as an optional test path via `USE_HONO` env)

### Package

- Renamed to `@rvncom/socket-bun-engine`
- Bumped to v1.0.0
- Added `"type": "module"`, `exports` field, `engines: { bun: ">=1.0.0" }`
