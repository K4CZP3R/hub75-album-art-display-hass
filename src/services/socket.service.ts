import { WebSocket } from "ws";

export class SocketService {
  ws?: WebSocket;
  constructor(private wsUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.on("open", () => {
        console.log("connected");
        resolve();
      });

      this.ws.on("error", (err) => {
        reject(err);
      });
    });
  }

  async sendMessage(message: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ws) {
        reject("Not connected");
        return;
      }
      this.ws.send(message, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}
