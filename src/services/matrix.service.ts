import { MediaPlayerExt } from "./matrix-ext/media-player";
import { SocketService } from "./socket.service";

export class MatrixService {
  extensions: MediaPlayerExt[] = [new MediaPlayerExt()];

  ws: SocketService;
  constructor(ws: SocketService) {
    this.ws = ws;
  }

  async handleEntityChange(entityId: string, entity: any) {
    for (const ext of this.extensions) {
      if (ext.intrestedIn(entityId)) {
        await ext.handleMediaPlayerChange(this.ws, entityId, entity);
      }
    }
  }
}
