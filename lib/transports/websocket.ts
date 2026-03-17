import { Transport } from "../transport";
import { type Packet, Parser, type RawData } from "../parser";
import { debuglog } from "node:util";

const debug = debuglog("engine.io:websocket");

export type WebSocketData = {
  transport: WS;
};

export type BunWebSocket = Bun.ServerWebSocket<WebSocketData>;

export class WS extends Transport {
  private socket?: BunWebSocket;

  public get name() {
    return "websocket";
  }

  public get upgradesTo(): string[] {
    return [];
  }

  public send(packets: Packet[]) {
    if (
      !this.writable ||
      !this.socket ||
      this.socket.readyState !== WebSocket.OPEN
    ) {
      return;
    }

    const threshold = this.opts.backpressureThreshold;

    if (packets.length === 1) {
      this.socket.send(Parser.encodePacket(packets[0]!, true));
    } else {
      // Batch multiple packets into a single syscall via cork()
      this.socket.cork(() => {
        for (const packet of packets) {
          this.socket!.send(Parser.encodePacket(packet, true));
        }
      });
    }

    // Check backpressure after send
    if (threshold > 0 && this.socket.getBufferedAmount() > threshold) {
      debug("backpressure: buffer full after send, pausing writes");
      this.writable = false;
    }
  }

  protected doClose() {
    this.socket?.close();
  }

  public onOpen(socket: BunWebSocket) {
    debug("on open");
    this.socket = socket;
    this.writable = true;
  }

  public onMessage(message: RawData) {
    debug("on message");

    // Resume writes if backpressure cleared (client consuming data)
    if (!this.writable && this.socket) {
      const threshold = this.opts.backpressureThreshold;
      if (threshold > 0 && this.socket.getBufferedAmount() <= threshold) {
        debug("backpressure: buffer drained, resuming writes");
        this.writable = true;
        this.emitReserved("drain");
      }
    }

    this.onPacket(Parser.decodePacket(message));
  }

  public onCloseEvent(_code: number, _message: string) {
    debug("on close");
    this.onClose();
  }
}
