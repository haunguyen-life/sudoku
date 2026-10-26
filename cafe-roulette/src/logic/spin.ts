import { SHOPS } from '../data/shops';

export const SEGMENT_COUNT = SHOPS.length;
export const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
export const SPIN_TURNS = 5;
export const SPIN_DURATION_MS = 5200;

export type Rng = () => number;

// Số ngẫu nhiên an toàn hơn Math.random, trả về trong [0, 1).
export const secureRandom: Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Kim chỉ nằm ở đỉnh. Vòng quay xoay theo chiều kim đồng hồ khi góc tăng,
// nên ô đang nằm dưới kim là ô có góc gốc bằng -rotation.
export function getWinnerIndexAt(rotationDeg: number): number {
  const under = normalizeDeg(-rotationDeg);
  return Math.floor(under / SEGMENT_ANGLE) % SEGMENT_COUNT;
}

// Chọn kết quả TRƯỚC: mỗi ô có xác suất bằng nhau.
export function pickWinnerIndex(rng: Rng = secureRandom): number {
  return Math.floor(rng() * SEGMENT_COUNT);
}

// Tính góc đích để kim dừng ở giữa ô đã chọn (có lệch ngẫu nhiên trong ô),
// quay thêm đủ số vòng so với góc hiện tại.
export function computeTargetRotation(
  current: number,
  winnerIndex: number,
  rng: Rng = secureRandom,
  turns: number = SPIN_TURNS,
): number {
  const jitter = (rng() * 2 - 1) * (SEGMENT_ANGLE * 0.4);
  const center = winnerIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
  const landing = normalizeDeg(-(center + jitter));
  const delta = normalizeDeg(landing - normalizeDeg(current));
  return current + turns * 360 + delta;
}

export function easeOutQuart(t: number): number {
  return 1 - Math.pow(1 - t, 4);
}
