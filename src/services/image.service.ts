import Jimp from "jimp";
import { Color } from "../models/packets";

export async function imageToRgb(
  path: string,
  config?: {
    width: number;
    height: number;
  }
) {
  let image = (await Jimp.read(path)).resize(
    config?.width || 32,
    config?.height || 32
  );

  let pixels: Color[] = [];
  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    let red = image.bitmap.data[idx];
    let green = image.bitmap.data[idx + 1];
    let blue = image.bitmap.data[idx + 2];

    pixels.push({ r: red, g: green, b: blue });
  });

  return pixels;
}
