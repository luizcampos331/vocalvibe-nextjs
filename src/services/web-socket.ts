import { io, Socket } from "socket.io-client";

class WebSocketService {
  private static instance: WebSocketService | null = null;

  private socket!: Socket;

  constructor() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = this;
      this.socket = io("http://localhost:3334");
    }

    return WebSocketService.instance;
  }

  private connect() {
    if (!this.socket.connected) {
      this.socket.connect();
      this.socket.emit("connect-user", { room: "conversation" });
    }
  }

  public emit(event: string, payload: any) {
    if (this.socket.connected) {
      this.socket.emit(event, payload);
    }
  }

  public listen(event: string, callback: (data: any) => void) {
    this.connect();
    this.socket.on(event, callback);
  }

  public getSocket(): Socket {
    this.connect();

    return this.socket;
  }
}

export default WebSocketService;
