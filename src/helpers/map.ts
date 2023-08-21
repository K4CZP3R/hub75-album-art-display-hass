export function map(
  val: number,
  in_max: number,
  in_min: number,
  out_max: number,
  out_min: number
): number {
  return Math.floor(
    ((val - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
  );
}
