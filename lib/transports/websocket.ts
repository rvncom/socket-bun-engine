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
    if (!this.writable || !this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    if (packets.length === 1) {
      this.socket.send(Parser.encodePacket(packets[0]!, true));
      return;
    }

    // Batch multiple packets into a single syscall via cork()
    this.socket.cork(() => {
      for (const packet of packets) {
        this.socket!.send(Parser.encodePacket(packet, true));
      }
    });
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
    this.onPacket(Parser.decodePacket(message));
  }

  public onCloseEvent(_code: number, _message: string) {
    debug("on close");
    this.onClose();
  }
}
