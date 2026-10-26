import styles from './Decorations.module.css';

interface Deco {
  emoji: string;
  left: string;
  top: string;
  size: number;
  delay: number;
}

// Các món trang trí nền: hạt cafe, ly nước, ngôi sao, lấp lánh.
const ITEMS: Deco[] = [
  { emoji: '☕', left: '6%', top: '12%', size: 38, delay: 0 },
  { emoji: '⭐', left: '88%', top: '8%', size: 26, delay: 1.2 },
  { emoji: '🫘', left: '12%', top: '46%', size: 28, delay: 0.6 },
  { emoji: '🧋', left: '84%', top: '38%', size: 42, delay: 2.1 },
  { emoji: '✨', left: '22%', top: '82%', size: 24, delay: 1.7 },
  { emoji: '⭐', left: '75%', top: '78%', size: 22, delay: 2.9 },
  { emoji: '🫘', left: '92%', top: '62%', size: 22, delay: 0.3 },
  { emoji: '☕', left: '3%', top: '70%', size: 30, delay: 3.4 },
  { emoji: '✨', left: '50%', top: '4%', size: 20, delay: 1.9 },
  { emoji: '🧋', left: '40%', top: '90%', size: 30, delay: 0.9 },
];

export function Decorations() {
  return (
    <div className={styles.layer} aria-hidden="true">
      {ITEMS.map((item, i) => (
        <span
          key={i}
          className={styles.item}
          style={{
            left: item.left,
            top: item.top,
            fontSize: item.size,
            animationDelay: `${item.delay}s`,
          }}
        >
          {item.emoji}
        </span>
      ))}
      <span className={`${styles.blob} ${styles.blobA}`} />
      <span className={`${styles.blob} ${styles.blobB}`} />
    </div>
  );
}
