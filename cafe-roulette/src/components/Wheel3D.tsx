import { useEffect, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { PALETTE, SHOPS } from '../data/shops';
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
const BEVEL_SIZE = 0.06;
const BODY_DEPTH = 0.1;
const BODY_BEVEL = 0.1;
// Mặt vẽ nằm gọn trong phần phẳng của thân, phần viền bo bên ngoài là gờ vàng.
const FACE_RADIUS = 0.86;
const FRONT_Z = BODY_DEPTH + BODY_BEVEL;
const SEGMENT_COUNT = SHOPS.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;
const MAX_PIXEL_RATIO = 1.75;

export function Wheel3D({ controller }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0.9, 5.8);
    camera.lookAt(0, 0.05, 0);

    const render = () => renderer.render(scene, camera);

    // Ánh sáng studio: môi trường phản chiếu cho độ bóng, cộng đèn chính, đèn viền và đèn nền.
    const pmrem = new THREE.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = environment;
    scene.environmentIntensity = 0.7;

    scene.add(new THREE.HemisphereLight(0xffffff, 0xffd6e8, 0.6));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(3, 5, 6);
    scene.add(keyLight);
    const rimLight = new THREE.DirectionalLight(0xc9b6ff, 0.8);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);

    const wheel = new THREE.Group();
    scene.add(wheel);

    // Mặt vòng quay: texture vẽ 8 ô, tên quán và icon.
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

    // Thân vòng quay: đĩa dày với viền bo tròn, mạ vàng bóng.
    const bodyShape = new THREE.Shape();
    bodyShape.absarc(0, 0, RADIUS, 0, Math.PI * 2, false);
    const bodyGeometry = new THREE.ExtrudeGeometry(bodyShape, {
      depth: BODY_DEPTH,
      bevelEnabled: true,
      bevelThickness: BODY_BEVEL,
      bevelSize: BEVEL_SIZE,
      bevelOffset: 0,
      bevelSegments: 10,
      curveSegments: 128,
    });
    const goldMaterial = new THREE.MeshPhysicalMaterial({
      color: PALETTE.yellow,
      metalness: 0.85,
      roughness: 0.24,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const body = new THREE.Mesh(bodyGeometry, goldMaterial);
    body.position.z = -BODY_BEVEL;
    wheel.add(body);

    // Mặt vẽ đặt sát phía trước thân, bóng hơn bằng lớp clearcoat.
    const faceMaterial = new THREE.MeshPhysicalMaterial({
      map: faceTexture,
      roughness: 0.3,
      metalness: 0,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
    });
    const face = new THREE.Mesh(new THREE.CircleGeometry(FACE_RADIUS, 128), faceMaterial);
    face.position.z = FRONT_Z + 0.004;
    wheel.add(face);

    // Chấm bi trên vành, đặt đúng ở ranh giới giữa 8 ô.
    const studGeometry = new THREE.SphereGeometry(0.045, 16, 16);
    const studMaterial = new THREE.MeshPhysicalMaterial({
      color: PALETTE.cream,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    for (let i = 0; i < SEGMENT_COUNT; i++) {
      const rad = THREE.MathUtils.degToRad(i * SEGMENT_ANGLE);
      const stud = new THREE.Mesh(studGeometry, studMaterial);
      const ringRadius = (FACE_RADIUS + RADIUS) / 2;
      stud.position.set(ringRadius * Math.sin(rad), ringRadius * Math.cos(rad), FRONT_Z);
      wheel.add(stud);
    }

    // Tâm vòng quay: nút bóng màu san hô.
    const hub = new THREE.Mesh(
      new THREE.SphereGeometry(0.17, 32, 32),
      new THREE.MeshPhysicalMaterial({
        color: PALETTE.coral,
        roughness: 0.18,
        metalness: 0.1,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
    );
    hub.position.z = FRONT_Z + 0.03;
    wheel.add(hub);

    // Kim chỉ cố định phía trên vòng quay, không thuộc nhóm xoay.
    const pointerMaterial = new THREE.MeshPhysicalMaterial({
      color: PALETTE.coral,
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const pointer = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.42, 40), pointerMaterial);
    pointer.rotation.z = Math.PI;
    pointer.position.set(0, RADIUS + BEVEL_SIZE + 0.21, 0.2);
    scene.add(pointer);

    const pointerCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 20, 20),
      goldMaterial,
    );
    pointerCap.position.set(0, RADIUS + BEVEL_SIZE + 0.46, 0.2);
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
      bodyGeometry.dispose();
      goldMaterial.dispose();
      faceMaterial.dispose();
      studGeometry.dispose();
      studMaterial.dispose();
      pointerMaterial.dispose();
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [controller]);

  return <div ref={containerRef} className={styles.root} role="img" aria-label="Vòng quay 8 quán cà phê và trà sữa" />;
}
