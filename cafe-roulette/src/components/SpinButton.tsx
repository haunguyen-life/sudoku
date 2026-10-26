import { motion } from 'framer-motion';
import styles from './SpinButton.module.css';

interface Props {
  disabled: boolean;
  onSpin: () => void;
}

export function SpinButton({ disabled, onSpin }: Props) {
  return (
    <motion.button
      type="button"
      className={styles.spin}
      disabled={disabled}
      onClick={onSpin}
      whileHover={disabled ? undefined : { scale: 1.06 }}
      whileTap={disabled ? undefined : { scale: 0.94 }}
      aria-busy={disabled}
    >
      {disabled ? 'ĐANG QUAY...' : 'QUAY NGAY!'}
    </motion.button>
  );
}
