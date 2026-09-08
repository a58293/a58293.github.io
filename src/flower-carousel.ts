import { flowerGods, type FlowerGod } from './flower-gods-catalog';

export type FlowerSeat = { id: string; deity?: FlowerGod; label: string };
// Unpublished seats reserve space; they are never fake characters or routes.
export function createFlowerSeats(deities: readonly FlowerGod[]): FlowerSeat[] {
  const published = deities.map(deity => ({ id: deity.slug, deity, label: deity.name }));
  if (published.length >= 3) return published;
  const waiting = Array.from({ length: 3 - published.length }, (_, i) => ({ id: `awaiting-${i + 1}`, label: '花期未至' }));
  return [waiting[0], ...published, ...waiting.slice(1)];
}
export const flowerSeats = createFlowerSeats(flowerGods);
export const firstPublishedSeat = Math.max(0, flowerSeats.findIndex(seat => seat.deity));
export const wrapSeat = (index: number, count: number) => ((index % count) + count) % count;
export function carouselWindow(cursor: number, seats: readonly FlowerSeat[]) {
  return [-2, -1, 0, 1, 2].map(offset => ({
    key: cursor + offset, offset, index: wrapSeat(cursor + offset, seats.length),
    seat: seats[wrapSeat(cursor + offset, seats.length)],
  }));
}
export function shortestSeatMove(from: number, to: number, count: number) {
  const forward = wrapSeat(to - from, count);
  return forward > count / 2 ? forward - count : forward;
}
export function swipeDirection(dx: number, dy: number) {
  return Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25 ? (dx < 0 ? 1 : -1) : 0;
}

export const CAROUSEL_SETTLE_MS = 620;
export const CAROUSEL_SEAT_SPACING = 34;
// Follow the finger directly, then resist beyond one seat so no empty track is exposed.
export function dragDisplacement(dx: number, seatWidth: number) {
  const limit = Math.max(1, seatWidth) * .85;
  const distance = Math.abs(dx);
  return Math.sign(dx) * (distance <= limit ? distance : limit + limit * .15 * (1 - Math.exp(-(distance - limit) / limit)));
}
