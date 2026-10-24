export function createLatestRequestGate() {
  let sequence = 0;
  return { next: () => ++sequence, isCurrent: (id: number) => id === sequence, invalidate: () => { sequence += 1; } };
}
