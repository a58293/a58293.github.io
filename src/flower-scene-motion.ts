// Columns and floor remain one stable architectural frame. The deity follows just
// enough to feel present, while the distant clouds and foreground flowers preserve depth.
export const sceneDepth = { clouds: 1.1, deity: 3.2, columns: 0, flowers: 15 } as const;

export function scenePointer(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }) {
  const clamp = (n: number) => Math.max(-1, Math.min(1, n));
  return {
    x: clamp(((clientX - rect.left) / Math.max(1, rect.width) - .5) * 2),
    y: clamp(((clientY - rect.top) / Math.max(1, rect.height) - .5) * 2),
  };
}
