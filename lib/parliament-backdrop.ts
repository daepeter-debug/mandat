/** Distant city plate: deterministic camera parallax, including translation of the camera target.
 * The city is farther away than the chamber, so it scales more slowly rather than sticking to the seats.
 * This is a layered illustration, not a reconstructed 360° city or a restriction on camera navigation.
 */
export function backdropCamera(
  camera: { theta: number; phi: number; radius: number; target: { x: number; y: number; z: number }; fov: number },
  base: { radius: number; phi: number; target: { x: number; y: number; z: number } },
) {
  const values = [camera.theta, camera.phi, camera.radius, camera.fov, ...Object.values(camera.target), base.radius, base.phi, ...Object.values(base.target)];
  if (!values.every(Number.isFinite) || camera.radius <= 0 || base.radius <= 0 || camera.fov <= 0 || camera.fov >= 180) return { pan: 0, tilt: 0, zoom: 1 };
  const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
  const dx = camera.target.x - base.target.x, dy = camera.target.y - base.target.y, dz = camera.target.z - base.target.z;
  const horizontal = dx * Math.cos(camera.theta) - dz * Math.sin(camera.theta);
  const vertical = dy * Math.sin(camera.phi) - Math.cos(camera.phi) * (dx * Math.sin(camera.theta) + dz * Math.cos(camera.theta));
  const distance = base.radius * 2.4;
  return {
    pan: clamp(Math.sin(camera.theta) * .8 + horizontal / base.radius, -1.5, 1.5),
    tilt: clamp((camera.phi - base.phi) * 1.1 + vertical / base.radius, -1.5, 1.5),
    zoom: clamp((base.radius + distance) / (camera.radius + distance) * Math.tan(Math.PI / 12) / Math.tan(camera.fov * Math.PI / 360), .86, 1.42),
  };
}

/** Both scene layers read the same controlled camera attributes, in degrees or radians. */
export function backdropAttributes(orbit: string, target: string, fov: number, base: Parameters<typeof backdropCamera>[1]) {
  const angle = (s: string) => s.endsWith('deg') ? parseFloat(s) * Math.PI / 180 : parseFloat(s);
  const [theta, phi, radius] = orbit.trim().split(/\s+/), [x, y, z] = target.trim().split(/\s+/).map(parseFloat);
  return backdropCamera({ theta: angle(theta ?? ''), phi: angle(phi ?? ''), radius: parseFloat(radius), target: { x, y, z }, fov }, base);
}
