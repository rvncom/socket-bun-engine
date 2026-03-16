# @rvncom/socket-bun-engine

[![npm version](https://img.shields.io/npm/v/@rvncom/socket-bun-engine.svg)](https://www.npmjs.com/package/@rvncom/socket-bun-engine)
[![npm downloads](https://img.shields.io/npm/dm/@rvncom/socket-bun-engine.svg)](https://www.npmjs.com/package/@rvncom/socket-bun-engine)

Engine.IO server implementation for the Bun runtime. Provides native WebSocket and HTTP long-polling transports for [Socket.IO](https://socket.io/).

Fork of `@socket.io/bun-engine` with bug fixes, improved API, and active maintenance.

## Installation

```bash
bun add @rvncom/socket-bun-engine
```

## Usage

```ts
import { Server as Engine } from "@rvncom/socket-bun-engine";
import { Server } from "socket.io";

const engine = new Engine({
  path: "/socket.io/",
});

const io = new Server();
io.bind(engine);

io.on("connection", (socket) => {
  // ...
});

export default {
  port: 3000,
  ...engine.handler(),
};
```

You can also use `engine.handleRequest()` directly for custom routing:

```ts
Bun.serve({
  port: 3000,

  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok", connections: engine.clientsCount }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return engine.handleRequest(req, server);
  },

  websocket: engine.handler().websocket,
});
```

## Options

### `path`

Default: `/engine.io/`

The path to handle on the server side. Must match the client configuration.

### `pingTimeout`

Default: `20000`

Milliseconds without a pong packet before considering the connection closed.

### `pingInterval`

Default: `25000`

Milliseconds between ping packets sent by the server.

### `upgradeTimeout`

Default: `10000`

Milliseconds before an uncompleted transport upgrade is cancelled.

### `maxHttpBufferSize`

Default: `1e6` (1 MB)

Maximum message size in bytes before closing the session.

### `maxClients`

Default: `0` (unlimited)

Maximum number of concurrent clients. New connections are rejected with HTTP 503 when the limit is reached.

### `backpressureThreshold`

Default: `1048576` (1 MB)

WebSocket send buffer threshold in bytes. When `getBufferedAmount()` exceeds this value, writes are paused automatically and resumed when the buffer drains. Set to `0` to disable.

### `allowRequest`

A function that receives the handshake/upgrade request and can reject it:

```ts
const engine = new Engine({
  allowRequest: (req, server) => {
    return Promise.reject("not allowed");
  },
});
```

### `cors`

Cross-Origin Resource Sharing options:

```ts
const engine = new Engine({
  cors: {
    origin: ["https://example.com"],
    allowedHeaders: ["my-header"],
    credentials: true,
  },
});
```

### `editHandshakeHeaders`

Edit response headers for the handshake request:

```ts
const engine = new Engine({
  editHandshakeHeaders: (responseHeaders, req, server) => {
    responseHeaders.set("set-cookie", "sid=1234");
  },
});
```

### `editResponseHeaders`

Edit response headers for all requests:

```ts
const engine = new Engine({
  editResponseHeaders: (responseHeaders, req, server) => {
    responseHeaders.set("my-header", "abcd");
  },
});
```

## Metrics

Built-in server metrics with zero dependencies:

```ts
const snapshot = engine.metrics;
// {
//   connections: 150,        // total opened (cumulative)
//   disconnections: 12,      // total closed
//   activeConnections: 138,  // currently connected
//   upgrades: 130,           // polling → websocket
//   bytesReceived: 524288,
//   bytesSent: 1048576,
//   errors: 2,
//   avgRtt: 14               // average round-trip time (ms)
// }
```

Per-socket RTT is also available:

```ts
engine.on("connection", (socket) => {
  socket.on("heartbeat", () => {
    console.log(`RTT: ${socket.rtt}ms`);
  });
});
```

## API

### `server.clientsCount`

Number of currently connected clients.

### `server.metrics`

Returns a `MetricsSnapshot` object with server-wide counters.

### `server.sockets`

Iterator over all connected `Socket` instances.

### `server.getSocket(id)`

Look up a specific socket by session ID.

### `server.close()`

Returns a `Promise<void>` that resolves when all clients have disconnected.

## License

[MIT](/LICENSE)
