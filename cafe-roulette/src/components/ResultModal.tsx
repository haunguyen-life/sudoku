import { motion } from 'framer-motion';
import { ICON_EMOJI, type Shop } from '../data/shops';
import { Confetti } from './Confetti';
import styles from './ResultModal.module.css';

interface Props {
  shop: Shop;
  onRetry: () => void;
  onConfirm: () => void;
}

export function ResultModal({ shop, onRetry, onConfirm }: Props) {
  return (
    <motion.div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-heading"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Confetti />
      {/* Thẻ cúp nảy vào với lò xo: vượt đích rồi dừng lại. */}
      <motion.div
        className={styles.trophy}
        initial={{ y: 80, scale: 0.5, rotateX: -40, opacity: 0 }}
        animate={{ y: 0, scale: 1, rotateX: 0, opacity: 1 }}
        exit={{ y: 40, scale: 0.7, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 11, mass: 0.9 }}
      >
        {/* Thẻ lơ lửng liên tục sau khi đã nảy xong. */}
        <motion.div
          className={styles.float}
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          <div className={styles.card}>
            <div className={styles.shine} aria-hidden="true" />
            <div className={styles.rays} aria-hidden="true" />
            <p id="result-heading" className={styles.heading}>
              🎉 HÔM NAY CHỐT ĐƠN!
            </p>
            <motion.div
              className={styles.icon}
              aria-hidden="true"
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.08, 1] }}
              transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
            >
              {ICON_EMOJI[shop.icon]}
            </motion.div>
            <h2 className={styles.winner}>{shop.name}</h2>
            <div className={styles.actions}>
              <motion.button
                type="button"
                className={styles.primary}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={onConfirm}
              >
                CHỐT QUÁN NÀY!
              </motion.button>
              <motion.button
                type="button"
                className={styles.ghost}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={onRetry}
              >
                QUAY LẠI
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
