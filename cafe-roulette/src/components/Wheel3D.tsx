import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { SHOPS } from '../data/shops';
import { easeOutQuart, getWinnerIndexAt } from '../logic/spin';
import { drawWheelFace } from './wheelFace';
import styles from './Wheel3D.module.css';

export interface WheelController {
  // Xoay tới góc đích (độ). onTick được gọi mỗi khi kim vượt qua một ô.
  spinTo(target: number, duration: number, onTick?: (index: number) => void): Promise<void>;
}

interface Props {
  controller: RefObject<WheelController | null>;
}

const RADIUS = 1;
const SEGMENT_COUNT = SHOPS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

export function Wheel3D({ controller }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.9, 5.8);
    camera.lookAt(0, 0.05, 0);

    const render = () => renderer.render(scene, camera);

    scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
    keyLight.position.set(2, 4, 6);
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xffd6f0, 0.6);
    fillLight.position.set(-4, -2, 3);
    scene.add(fillLight);

    const wheel = new THREE.Group();
    scene.add(wheel);

    // Mặt vòng quay: một đĩa tròn với texture vẽ 8 ô.
    const faceCanvas = document.createElement('canvas');
    faceCanvas.width = 1024;
    faceCanvas.height = 1024;
    const faceCtx = faceCanvas.getContext('2d');
    const faceTexture = new THREE.CanvasTexture(faceCanvas);
    faceTexture.colorSpace = THREE.SRGBColorSpace;
    faceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    let disposed = false;
    const redrawFace = () => {
      if (disposed || !faceCtx) return;
      drawWheelFace(faceCtx, SHOPS);
      faceTexture.needsUpdate = true;
      render();
    };
    redrawFace();
    // Vẽ lại sau khi font Baloo 2 tải xong để chữ đúng kiểu.
    document.fonts?.load('800 48px "Baloo 2"').then(redrawFace).catch(() => undefined);

    const face = new THREE.Mesh(
      new THREE.CircleGeometry(RADIUS, 128),
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.35, metalness: 0.05 }),
    );
    // Đặt mặt trước một chút so với nắp thân để tránh z-fighting.
    face.position.z = 0.14;
    wheel.add(face);

    // Thân vòng quay có độ dày để tạo khối 3D.
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(RADIUS + 0.05, RADIUS + 0.05, 0.26, 128),
      new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.35, roughness: 0.3 }),
    );
    body.rotation.x = Math.PI / 2;
    wheel.add(body);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(RADIUS + 0.02, 0.06, 24, 160),
      new THREE.MeshStandardMaterial({ color: 0xfff1b8, metalness: 0.4, roughness: 0.2 }),
    );
    rim.position.z = 0.14;
    wheel.add(rim);

    // Các chấm tròn trên vành, đặt đúng ở ranh giới giữa 8 ô.
    const pegGeometry = new THREE.SphereGeometry(0.06, 16, 16);
    const pegMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const rad = THREE.MathUtils.degToRad(i * SEGMENT_ANGLE);
      const peg = new THREE.Mesh(pegGeometry, pegMaterial);
      peg.position.set((RADIUS + 0.02) * Math.sin(rad), (RADIUS + 0.02) * Math.cos(rad), 0.17);
      wheel.add(peg);
    }

    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 32, 32),
      new THREE.MeshStandardMaterial({ color: 0xff4d8d, metalness: 0.2, roughness: 0.3 }),
    );
    hub.position.z = 0.2;
    wheel.add(hub);

    // Kim chỉ cố định phía trên vòng quay.
    const pointer = new THREE.Mesh(
      new THREE.ConeGeometry(0.15, 0.42, 40),
      new THREE.MeshStandardMaterial({ color: 0xff3b5c, roughness: 0.3, metalness: 0.1 }),
    );
    pointer.rotation.z = Math.PI;
    pointer.position.set(0, RADIUS + 0.23, 0.2);
    scene.add(pointer);

    const pointerCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffc857, metalness: 0.5, roughness: 0.2 }),
    );
    pointerCap.position.set(0, RADIUS + 0.44, 0.2);
    scene.add(pointerCap);

    // Góc dương = xoay theo chiều kim đồng hồ.
    let angle = 0;
    const applyAngle = (deg: number) => {
      wheel.rotation.z = -THREE.MathUtils.degToRad(deg);
      render();
    };
    applyAngle(0);

    let frameId = 0;
    const spinTo: WheelController['spinTo'] = (target, duration, onTick) => {
      cancelAnimationFrame(frameId);
      const start = angle;
      const distance = target - start;
      let lastIndex = getWinnerIndexAt(start);

      return new Promise<void>((resolve) => {
        const t0 = performance.now();
        const step = (now: number) => {
          const progress = Math.min((now - t0) / duration, 1);
          angle = start + distance * easeOutQuart(progress);
          applyAngle(angle);

          const index = getWinnerIndexAt(angle);
          if (index !== lastIndex) {
            lastIndex = index;
            onTick?.(index);
          }

          if (progress < 1) {
            frameId = requestAnimationFrame(step);
          } else {
            angle = target;
            applyAngle(target);
            resolve();
          }
        };
        frameId = requestAnimationFrame(step);
      });
    };
    controller.current = { spinTo };

    const resize = () => {
      const size = container.clientWidth;
      if (size === 0) return;
      renderer.setSize(size, size, false);
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controller.current = null;
      faceTexture.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
          materials.forEach((material) => material.dispose());
        }
      });
      pegGeometry.dispose();
      pegMaterial.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [controller]);

  return <div ref={containerRef} className={styles.root} role="img" aria-label="Vòng quay 8 quán cà phê và trà sữa" />;
}
