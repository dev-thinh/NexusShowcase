export function avatarCrop(width: number, height: number, zoom: number, position: { x: number; y: number }) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new RangeError('Invalid image dimensions');
  const scale = Math.min(4, Math.max(1, Number.isFinite(zoom) ? zoom : 1));
  const size = Math.min(width, height) / scale;
  const bound = (value: number, limit: number) => limit === 0 ? 0 : Math.max(-limit, Math.min(limit, Number.isFinite(value) ? value : 0));
  const offsetX = bound(position.x, (width / size - 1) / 2);
  const offsetY = bound(position.y, (height / size - 1) / 2);
  return { size, offsetX, offsetY, sourceX: (width - size) / 2 - offsetX * size, sourceY: (height - size) / 2 - offsetY * size };
}
