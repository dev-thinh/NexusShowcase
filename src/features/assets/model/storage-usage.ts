export function summarizeStorageUsage(assets: Array<{ byteSize: bigint | null; deletionStartedAt: Date | null }>, reservations: Array<{ byteSize: bigint }>, limitBytes: bigint) {
  const bytes = assets.reduce((sum, asset) => sum + (asset.byteSize ?? 26214400n), 0n) + reservations.reduce((sum, reservation) => sum + reservation.byteSize, 0n);
  return { bytes, files: assets.length + reservations.length, pending: reservations.length, quarantined: assets.filter(asset => asset.deletionStartedAt).length, unknownSizes: assets.filter(asset => asset.byteSize === null).length, limitBytes, percent: Number(bytes * 100n / limitBytes > 100n ? 100n : bytes * 100n / limitBytes) };
}
