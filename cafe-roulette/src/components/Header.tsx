import styles from './Header.module.css';

export function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.tag}>HÔM NAY UỐNG GÌ? – CAFE ROULETTE 3D</span>
      <h1 className={styles.title}>HÔM NAY ĐI ĐÂU CÀ PHÊ?</h1>
      <p className={styles.subtitle}>Để vận may chọn giúp bạn!</p>
    </header>
  );
}
