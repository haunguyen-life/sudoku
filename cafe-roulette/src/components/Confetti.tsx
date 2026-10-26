import { useEffect, useRef } from 'react';
import { PALETTE } from '../data/shops';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import styles from './Confetti.module.css';

const COLORS = [PALETTE.coral, PALETTE.mint, PALETTE.lavender, PALETTE.yellow, PALETTE.sky, PALETTE.cream];
const MAX_DURATION_MS = 6000;

interface Piece {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  w: number;
  h: number;
  color: string;
  round: boolean;
}

// Số mảnh confetti giảm trên màn hình nhỏ để giữ mượt.
function pieceCount(): number {
  return window.innerWidth < 600 ? 90 : 150;
}

// Confetti 2D trên canvas: nhẹ, không làm giật khi quay.
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (reduced || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.35;
    const pieces: Piece[] = Array.from({ length: pieceCount() }, () => ({
      x: originX + (Math.random() - 0.5) * 120,
      y: originY,
      vx: (Math.random() - 0.5) * 14,
      vy: -Math.random() * 14 - 4,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 10,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      round: Math.random() < 0.25,
    }));

    const startTime = performance.now();
    let frameId = 0;

    const frame = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      let visible = 0;

      for (const p of pieces) {
        p.vy += 0.35;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        if (p.y < window.innerHeight + 40) visible++;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.w / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        }
        ctx.restore();
      }

      if (visible > 0 && now - startTime < MAX_DURATION_MS) {
        frameId = requestAnimationFrame(frame);
      }
    };
    frameId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [reduced]);

  if (reduced) return null;
  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}
