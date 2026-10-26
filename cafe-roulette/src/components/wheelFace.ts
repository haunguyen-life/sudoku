import type { Shop } from '../data/shops';
import { ICON_EMOJI } from '../data/shops';

const DEG = Math.PI / 180;
const FONT_FAMILY = '"Baloo 2", "Segoe UI", system-ui, sans-serif';
const EMOJI_FONT = '"Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

// Góc tính theo chiều kim đồng hồ từ đỉnh, đổi sang góc của canvas.
function toCanvasAngle(deg: number): number {
  return deg * DEG - Math.PI / 2;
}

// Chia tên quán thành tối đa 2 dòng, cắt tại khoảng trắng gần giữa nhất.
function splitName(name: string): string[] {
  if (name.length <= 10) return [name];
  const middle = name.length / 2;
  let best = -1;
  for (let i = 0; i < name.length; i++) {
    if (name[i] !== ' ') continue;
    if (best === -1 || Math.abs(i - middle) < Math.abs(best - middle)) best = i;
  }
  if (best === -1) return [name];
  return [name.slice(0, best), name.slice(best + 1)];
}

// Vẽ toàn bộ mặt vòng quay lên canvas: các ô màu, tên quán và icon.
// Ô đầu tiên bắt đầu từ đỉnh và đi theo chiều kim đồng hồ.
export function drawWheelFace(ctx: CanvasRenderingContext2D, shops: Shop[]): void {
  const size = ctx.canvas.width;
  const c = size / 2;
  const r = size / 2 - 4;
  const seg = 360 / shops.length;

  ctx.clearRect(0, 0, size, size);

  shops.forEach((shop, i) => {
    const a0 = toCanvasAngle(i * seg);
    const a1 = toCanvasAngle((i + 1) * seg);
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.arc(c, c, r, a0, a1);
    ctx.closePath();
    ctx.fillStyle = shop.color;
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
  });

  // Ánh sáng mềm phía trên để tạo cảm giác khối 3D.
  const sheen = ctx.createRadialGradient(c, c, r * 0.1, c, c, r);
  sheen.addColorStop(0, 'rgba(255,255,255,0)');
  sheen.addColorStop(0.7, 'rgba(255,255,255,0.08)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.28)');
  ctx.beginPath();
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.fillStyle = sheen;
  ctx.fill();

  shops.forEach((shop, i) => {
    const mid = (i + 0.5) * seg;
    const rad = mid * DEG;

    // Tên quán: chạy theo phương bán kính, tự thu nhỏ cỡ chữ nếu quá dài.
    const lines = splitName(shop.name);
    const maxWidth = r * 0.4;
    let fontSize = 46;
    ctx.font = `800 ${fontSize}px ${FONT_FAMILY}`;
    while (fontSize > 20) {
      const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
      if (widest <= maxWidth) break;
      fontSize -= 2;
      ctx.font = `800 ${fontSize}px ${FONT_FAMILY}`;
    }

    ctx.save();
    ctx.translate(c + r * 0.5 * Math.sin(rad), c - r * 0.5 * Math.cos(rad));
    ctx.rotate(rad - Math.PI / 2);
    ctx.font = `800 ${fontSize}px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = fontSize * 0.2;
    ctx.strokeStyle = 'rgba(59, 29, 92, 0.45)';
    ctx.fillStyle = '#ffffff';
    lines.forEach((line, j) => {
      const y = (j - (lines.length - 1) / 2) * fontSize * 1.05;
      ctx.strokeText(line, 0, y);
      ctx.fillText(line, 0, y);
    });
    ctx.restore();

    // Icon: vẽ thẳng đứng ở phía ngoài ô.
    ctx.save();
    ctx.translate(c + r * 0.8 * Math.sin(rad), c - r * 0.8 * Math.cos(rad));
    ctx.font = `76px ${EMOJI_FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(59, 29, 92, 0.35)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillText(ICON_EMOJI[shop.icon], 0, 0);
    ctx.restore();
  });
}
