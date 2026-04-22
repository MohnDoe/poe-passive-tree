const TAU = Math.PI * 2;

export function normalizeSignedAngle(angle: number) {
  angle = (angle + Math.PI) % TAU;
  if (angle < 0) angle += TAU;
  return angle - Math.PI;
}
