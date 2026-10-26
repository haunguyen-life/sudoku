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
      <motion.div
        className={styles.card}
        initial={{ scale: 0.4, rotateX: -35, opacity: 0 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <div className={styles.rays} aria-hidden="true" />
        <p id="result-heading" className={styles.heading}>
          🎉 HÔM NAY CHỐT ĐƠN!
        </p>
        <motion.div
          className={styles.icon}
          aria-hidden="true"
          animate={{ rotate: [0, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        >
          {ICON_EMOJI[shop.icon]}
        </motion.div>
        <motion.h2
          className={styles.winner}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          {shop.name}
        </motion.h2>
        <div className={styles.actions}>
          <motion.button
            type="button"
            className={styles.primary}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onConfirm}
          >
            CHỐT QUÁN NÀY!
          </motion.button>
          <motion.button
            type="button"
            className={styles.ghost}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
          >
            QUAY LẠI
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
