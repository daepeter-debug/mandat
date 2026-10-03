/** Screen-plane navigation in model metres. Panning translates eye AND target;
 * there is no bounding-sphere clamp or surface-hit retargeting. */
export type ChamberCamera = { theta: number; phi: number; radius: number; target: { x: number; y: number; z: number } };
export type CameraPoint = { x: number; y: number };
export const CAMERA_NEAR = .015, CAMERA_FAR = 20;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
export function panCamera(c: ChamberCamera, dx: number, dy: number, height: number, fov: number): ChamberCamera {
  const s = 2 * c.radius * Math.tan(fov * Math.PI / 360) / Math.max(1, height);
  const ct = Math.cos(c.theta), st = Math.sin(c.theta), cp = Math.cos(c.phi), sp = Math.sin(c.phi);
  return { ...c, target: {
    x: c.target.x + s * (-dx * ct - dy * cp * st),
    y: c.target.y + s * dy * sp,
    z: c.target.z + s * (dx * st - dy * cp * ct),
  } };
}
export function rotateCamera(c: ChamberCamera, dx: number, dy: number, height: number): ChamberCamera {
  const s = Math.PI / Math.max(1, height);
  // Keep a stable horizon and avoid the pole singularities; full azimuth, no roll.
  return { ...c, theta: c.theta - dx * s, phi: clamp(c.phi - dy * s, .01, Math.PI - .01) };
}
export function zoomCamera(c: ChamberCamera, factor: number): ChamberCamera {
  return { ...c, radius: clamp(c.radius * factor, CAMERA_NEAR, CAMERA_FAR) };
}
export function touchFrame(points: CameraPoint[]) {
  const [a, b = a] = points;
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, span: Math.hypot(a.x - b.x, a.y - b.y) };
}
export function cameraAttributes(c: ChamberCamera) {
  return { orbit: `${c.theta}rad ${c.phi}rad ${c.radius}m`, target: `${c.target.x}m ${c.target.y}m ${c.target.z}m` };
}
