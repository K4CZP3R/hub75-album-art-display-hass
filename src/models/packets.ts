export const START_MAGIC = Buffer.from([0x13, 0x37]);
export const END_MAGIC = Buffer.from([0xde, 0xad]);

export enum PacketType {
  FillScreen = 0x01,
  DrawPixel = 0x02,
  ClearScreen = 0x03,
  DrawChar = 0x04,
  InitRGBBitmap = 0x05,
  FeedRGBBitmap = 0x06,
  DrawRGBBitmap = 0x07,
  SetBrightness = 0x08,
  DrawLine = 0x09,
  DebugHeapBefore = 0x70,
  DebugHeapAfter = 0x71,
  DebugValue = 0x72,
  Ret = 0xff,
}

export type Color = {
  r: number;
  g: number;
  b: number;
};

export type Position = {
  x: number;
  y: number;
};
export type Size = {
  width: number;
  height: number;
};

export function packetFromBuffer(buffer: Buffer) {
  // const length = buffer[0];
  const packetType = buffer[1];
  switch (packetType) {
    case PacketType.Ret:
      return RetPacket.fromBuffer(buffer);
    case PacketType.DebugHeapBefore:
      return HeapBefore.fromBuffer(buffer);
    case PacketType.DebugHeapAfter:
      return HeapAfter.fromBuffer(buffer);
    case PacketType.DebugValue:
      return DebugValPacket.fromBuffer(buffer);
    default:
      return new BasePacket(buffer);
  }
}

export class BasePacket {
  packet: Buffer;
  constructor(data: Buffer) {
    this.packet = Buffer.concat([
      START_MAGIC,
      Buffer.from([data.length]),
      data,
      END_MAGIC,
    ]);
  }

  get str(): string {
    return this.packet.toString("hex");
  }

  get type(): PacketType {
    return this.packet[3];
  }

  get length(): number {
    return this.packet.length;
  }
}

export class FillScreenPacket extends BasePacket {
  constructor(data: { color: Color }) {
    super(
      Buffer.from([
        PacketType.FillScreen,
        data.color.r,
        data.color.g,
        data.color.b,
      ])
    );
  }
}

export class DrawPixelPacket extends BasePacket {
  constructor(data: { color: Color; pos: Position }) {
    super(
      Buffer.from([
        PacketType.DrawPixel,
        data.pos.x,
        data.pos.y,
        data.color.r,
        data.color.g,
        data.color.b,
      ])
    );
  }

  get color(): Color {
    return {
      r: this.packet[4],
      g: this.packet[5],
      b: this.packet[6],
    };
  }

  get pos(): Position {
    return {
      x: this.packet[2],
      y: this.packet[3],
    };
  }

  get str(): string {
    return `DrawPixelPacket(color=${JSON.stringify(
      this.color
    )}, pos=${JSON.stringify(this.pos)})`;
  }
}

export class ClearScreenPacket extends BasePacket {
  constructor() {
    super(Buffer.from([PacketType.ClearScreen]));
  }
}

export class DrawCharPacket extends BasePacket {
  constructor(data: {
    pos: Position;
    char: string;
    bgColor: Color;
    fgColor: Color;
    size: number;
  }) {
    super(
      Buffer.from([
        PacketType.DrawChar,
        data.pos.x,
        data.pos.y,
        data.char.charCodeAt(0),
        data.bgColor.r,
        data.bgColor.g,
        data.bgColor.b,
        data.fgColor.r,
        data.fgColor.g,
        data.fgColor.b,
        data.size,
      ])
    );
  }
}

export class InitRGBBitmapPacket extends BasePacket {
  constructor(data: { size: Size }) {
    super(
      Buffer.from([PacketType.InitRGBBitmap, data.size.width, data.size.height])
    );
  }

  get size(): Size {
    return {
      width: this.packet[4],
      height: this.packet[5],
    };
  }

  get str(): string {
    return `InitRGBBitmapPacket(size=${JSON.stringify(this.size)})`;
  }
}

export class FeedRGBBitmapPacket extends BasePacket {
  constructor(data: { pixels: Color[] }) {
    const pixelsBuffer = Buffer.concat(
      data.pixels.map((x) => Buffer.from([x.r, x.g, x.b]))
    );
    super(Buffer.from([PacketType.FeedRGBBitmap, ...pixelsBuffer]));
  }

  get pixels(): Color[] {
    const pixels = [];
    for (let i = 4; i < this.packet.length; i += 3) {
      pixels.push({
        r: this.packet[i],
        g: this.packet[i + 1],
        b: this.packet[i + 2],
      });
    }
    return pixels;
  }

  get str(): string {
    return `FeedRGBBitmapPacket(pixelCount=${this.pixels.length})`;
  }

  static fromPixelsIntoMultiplePackets(pixels: Color[]): FeedRGBBitmapPacket[] {
    // Max packet size is 255 bytes, so we need to split it into multiple packets
    const packets: FeedRGBBitmapPacket[] = [];

    // 1 pixel is 3 bytes
    const maxPixelsPerPacket = 84;

    for (let i = 0; i < pixels.length; i += maxPixelsPerPacket) {
      const pixelsChunk = pixels.slice(i, i + maxPixelsPerPacket);
      packets.push(new FeedRGBBitmapPacket({ pixels: pixelsChunk }));
    }

    return packets;
  }
}

export class DrawRGBBitmapPacket extends BasePacket {
  constructor(data: { pos: Position }) {
    super(Buffer.from([PacketType.DrawRGBBitmap, data.pos.x, data.pos.y]));
  }

  get pos(): Position {
    return {
      x: this.packet[4],
      y: this.packet[5],
    };
  }

  get str(): string {
    return `DrawRGBBitmapPacket(pos=${JSON.stringify(this.pos)})`;
  }
}

export class DebugValPacket extends BasePacket {
  constructor(data: { val: number }) {
    super(Buffer.from([PacketType.DebugValue, data.val]));
  }

  get val(): number {
    return this.packet[4];
  }

  get str(): string {
    return `DebugValPacket(val=${this.val})`;
  }

  static fromBuffer(buffer: Buffer) {
    return new DebugValPacket({ val: buffer[2] });
  }
}

export class SetBrightnessPacket extends BasePacket {
  constructor(data: { brightness: number }) {
    super(Buffer.from([PacketType.SetBrightness, data.brightness]));
  }

  get brightness(): number {
    return this.packet[4];
  }

  get str(): string {
    return `SetBrightnessPacket(brightness=${this.brightness})`;
  }
}

export class DrawLinePacket extends BasePacket {
  constructor(data: { pos1: Position; pos2: Position; color: Color }) {
    super(
      Buffer.from([
        PacketType.DrawLine,
        data.pos1.x,
        data.pos1.y,
        data.pos2.x,
        data.pos2.y,
        data.color.r,
        data.color.g,
        data.color.b,
      ])
    );
  }
}

export class RetPacket extends BasePacket {
  constructor(data: { exitCode: number }) {
    super(Buffer.from([PacketType.Ret, data.exitCode]));
  }

  get exitCode(): number {
    return this.packet[4];
  }

  get str(): string {
    return `RetPacket(exitCode=${this.exitCode})`;
  }

  static fromBuffer(buffer: Buffer) {
    return new RetPacket({ exitCode: buffer[2] });
  }
}

export class HeapBefore extends BasePacket {
  constructor(data: { heap: number }) {
    // Align heap to be 4 bytes
    if (data.heap % 4 !== 0) {
      data.heap += 4 - (data.heap % 4);
    }
    super(Buffer.from([PacketType.DebugHeapBefore, data.heap]));
  }

  get payload(): Buffer {
    throw new Error("Not implemented");
  }

  get length(): number {
    throw new Error("Not implemented");
  }

  get heap(): number {
    return this.packet.readUInt32BE(1);
  }

  get str(): string {
    return `HeapBefore(heap=${this.heap})`;
  }

  static fromBuffer(buffer: Buffer) {
    return new HeapBefore({ heap: buffer.readUInt32BE(1) });
  }
}

export class HeapAfter extends BasePacket {
  constructor(data: { heap: number }) {
    //Align heap to be 4 bytes
    if (data.heap % 4 !== 0) {
      data.heap += 4 - (data.heap % 4);
    }
    super(Buffer.from([PacketType.DebugHeapAfter, data.heap]));
  }

  get payload(): Buffer {
    throw new Error("Not implemented");
  }

  get length(): number {
    throw new Error("Not implemented");
  }

  get str(): string {
    return `HeapAfter(heap=${this.heap})`;
  }

  get heap(): number {
    return this.packet.readUInt32BE(1);
  }

  static fromBuffer(buffer: Buffer) {
    return new HeapAfter({ heap: buffer.readUint32BE(1) });
  }
}
