import { map } from "../../helpers/map";
import { MediaPlayerEntity } from "../../models/entities";
import {
  InitRGBBitmapPacket,
  FeedRGBBitmapPacket,
  DrawRGBBitmapPacket,
  SetBrightnessPacket,
  DrawPixelPacket,
  FillScreenPacket,
  DrawLinePacket,
  BasePacket,
} from "../../models/packets";
import { imageToRgb } from "../image.service";
import { SocketService } from "../socket.service";

export class MediaPlayerExt {
  intrestedIn(entityId: string): boolean {
    return entityId.startsWith("media_player.spotify");
  }

  private entityPicture(entity: MediaPlayerEntity): string {
    return `https://hass.k4czp3r.xyz${entity.attributes.entity_picture}`;
  }
  private mappedPosition(entity: MediaPlayerEntity): number {
    return map(
      entity.attributes.media_position,
      entity.attributes.media_duration,
      0,
      128,
      0
    );
  }

  lastPicture: string = "";
  lastPosition: number = 0;

  private async updatePosition(
    ws: SocketService,
    pixels: number,
    clean = false
  ) {
    let messages: BasePacket[] = [];
    const color = {
      r: 255,
      g: 255,
      b: 255,
    };

    if (clean) {
      messages = [
        new DrawLinePacket({
          pos1: { x: 0, y: 0 },
          pos2: { x: 31, y: 0 },
          color: {
            r: 0,
            g: 0,
            b: 0,
          },
        }),
        new DrawLinePacket({
          pos1: { x: 31, y: 0 },
          pos2: { x: 31, y: 31 },
          color: {
            r: 0,
            g: 0,
            b: 0,
          },
        }),
        new DrawLinePacket({
          pos1: { x: 0, y: 31 },
          pos2: { x: 31, y: 31 },
          color: {
            r: 0,
            g: 0,
            b: 0,
          },
        }),
        new DrawLinePacket({
          pos1: { x: 0, y: 0 },
          pos2: { x: 0, y: 31 },
          color: {
            r: 0,
            g: 0,
            b: 0,
          },
        }),
      ];
    }

    // Top line
    if (pixels > 0) {
      // Top line, first 0-32 pixels, so max x is 31
      messages.push(
        new DrawLinePacket({
          pos1: {
            x: 0,
            y: 0,
          },
          pos2: {
            x: Math.min(pixels, 31), // Fixing the bug by ensuring x doesn't exceed 31
            y: 0,
          },
          color,
        })
      );
    }
    if (pixels > 31) {
      // Right line, starts at 31,0 and ends at 31,31
      messages.push(
        new DrawLinePacket({
          pos1: {
            x: 31,
            y: 0,
          },
          pos2: {
            x: 31,
            y: Math.min(pixels - 31, 31),
          },
          color,
        })
      );
    }

    if (pixels > 63) {
      // Bottom line, starts at 31,31 and ends at 0,31
      messages.push(
        new DrawLinePacket({
          pos1: {
            x: 31,
            y: 31,
          },
          pos2: {
            x: Math.max(31 - (pixels - 63), 0), // Fixing the bug by ensuring x doesn't go below 0
            y: 31,
          },
          color,
        })
      );
    }

    if (pixels > 95) {
      // Left line, starts at 0,31 and ends at 0,0
      messages.push(
        new DrawLinePacket({
          pos1: {
            x: 0,
            y: 31,
          },
          pos2: {
            x: 0,
            y: Math.max(31 - (pixels - 95), 0), // Fixing the bug by ensuring y doesn't go below 0
          },
          color,
        })
      );
    }

    console.log("Will send", messages.length, "messages");
    for (const message of messages) {
      await ws.sendMessage(message.packet);
    }
  }

  private async updateCoverArt(ws: SocketService, pictureUrl: string) {
    const rgb = await imageToRgb(pictureUrl);

    const messages = [
      new InitRGBBitmapPacket({
        size: {
          width: 32,
          height: 32,
        },
      }),
      ...FeedRGBBitmapPacket.fromPixelsIntoMultiplePackets(rgb),
      new DrawRGBBitmapPacket({
        pos: {
          x: 0,
          y: 0,
        },
      }),
      new SetBrightnessPacket({ brightness: 192 }),
    ];

    for (const message of messages) {
      await ws.sendMessage(message.packet);
    }
  }

  async handleMediaPlayerChange(
    ws: SocketService,
    entityId: string,
    entity: MediaPlayerEntity
  ) {
    if (entity.state !== "playing") {
      console.log("Not playing, skipping");
      return;
    }

    if (
      entity.attributes.entity_picture !== undefined &&
      this.lastPicture !== this.entityPicture(entity)
    ) {
      console.log("Updating cover art");
      // We should update the picture
      await this.updateCoverArt(ws, this.entityPicture(entity));
      this.lastPicture = this.entityPicture(entity);
    }

    if (this.lastPosition !== this.mappedPosition(entity)) {
      console.log("Position changed", this.mappedPosition(entity));
      await this.updatePosition(
        ws,
        this.mappedPosition(entity),
        this.lastPosition > this.mappedPosition(entity)
      );
      this.lastPosition = this.mappedPosition(entity);
    }
  }
}
