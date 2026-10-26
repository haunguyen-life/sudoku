import { useRef, useState } from 'react';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import { Decorations } from './components/Decorations';
import { Header } from './components/Header';
import { ResultModal } from './components/ResultModal';
import { SpinButton } from './components/SpinButton';
import { Wheel3D, type WheelController } from './components/Wheel3D';
import { SHOPS, type Shop } from './data/shops';
import { sound } from './audio/sound';
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion';
import {
  SPIN_DURATION_MS,
  SPIN_TURNS,
  computeTargetRotation,
  getWinnerIndexAt,
  pickWinnerIndex,
  secureRandom,
} from './logic/spin';
import styles from './App.module.css';

type Status = 'idle' | 'spinning' | 'result';

const REDUCED_DURATION_MS = 1000;

export default function App() {
  const controller = useRef<WheelController | null>(null);
  const rotationRef = useRef(0);
  const reduced = usePrefersReducedMotion();

  const [status, setStatus] = useState<Status>('idle');
  const [winner, setWinner] = useState<Shop | null>(null);
  const [chosen, setChosen] = useState<Shop | null>(null);
  const [soundOn, setSoundOn] = useState(sound.isEnabled);

  const handleSpin = async () => {
    const wheel = controller.current;
    if (status !== 'idle' || !wheel) return;

    sound.click();

    // Chọn kết quả trước, rồi mới tính góc đích và animate tới đó.
    const index = pickWinnerIndex(secureRandom);
    const target = computeTargetRotation(
      rotationRef.current,
      index,
      secureRandom,
      reduced ? 1 : SPIN_TURNS,
    );

    setStatus('spinning');
    setWinner(null);
    setChosen(null);

    await wheel.spinTo(
      target,
      reduced ? REDUCED_DURATION_MS : SPIN_DURATION_MS,
      reduced ? undefined : () => sound.tick(),
    );

    rotationRef.current = target;
    // Kết quả đọc từ đúng vị trí kim chỉ sau khi dừng, khớp với animation.
    const landed = SHOPS[getWinnerIndexAt(target)];
    sound.win();
    setWinner(landed);
    setStatus('result');
  };

  const toggleSound = () => {
    const next = !soundOn;
    sound.setEnabled(next);
    setSoundOn(next);
    if (next) sound.click();
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.app}>
        <Decorations />

        <div className={styles.content}>
          <div className={styles.topBar}>
            <button type="button" className={styles.soundBtn} onClick={toggleSound} aria-pressed={soundOn}>
              {soundOn ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT'}
            </button>
          </div>

          <Header />

          <div className={styles.wheelWrap}>
            <div className={styles.shadow} aria-hidden="true" />
            <Wheel3D controller={controller} />
          </div>

          <SpinButton disabled={status !== 'idle'} onSpin={handleSpin} />

          {chosen && (
            <p className={styles.chosen} role="status">
              Hôm nay chốt: <strong>{chosen.name}</strong> 🎉
            </p>
          )}

          <footer className={styles.footer}>
            8 lựa chọn: {SHOPS.map((shop) => shop.name).join(' · ')}
          </footer>
        </div>

        <AnimatePresence>
          {status === 'result' && winner && (
            <ResultModal
              key="result"
              shop={winner}
              onRetry={() => setStatus('idle')}
              onConfirm={() => {
                setChosen(winner);
                setStatus('idle');
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
