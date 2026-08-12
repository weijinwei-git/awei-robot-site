import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// 大资源走 jsDelivr GitHub CDN（全球加速 + 长缓存）
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/weijinwei-git/awei-robot-site@main/';
const PET_URL = CDN_BASE + 'public/models/bpx.glb';
const PET_HEIGHT = 764; // 模型原始高度（毫米，STP 单位制）

// 屏幕归一化位置（左上区域，约屏幕 14% 宽 / 17% 高处为狗中心）
const POS_NX = -0.72;
const POS_NY = 0.66;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath(import.meta.env.BASE_URL + 'lib/draco/');

type Mood = 'idle' | 'jump' | 'roll' | 'beg';

/* ---------------- 机械狗实体 ---------------- */

function PetBody({ scene }: { scene: THREE.Scene }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  const state = useRef<{
    mood: Mood;
    moodTimer: number;
    walkPhase: number;
    jumpT: number;
    rollT: number;
    begT: number;
    facing: number;
  }>({
    mood: 'idle',
    moodTimer: 5 + Math.random() * 6,
    walkPhase: 0,
    jumpT: -1,
    rollT: -1,
    begT: -1,
    facing: -0.5,
  });

  useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: '#c6ccd4',
          metalness: 0.65,
          roughness: 0.28,
        });
      }
    });
  }, [scene]);

  const dims = useMemo(() => {
    const s = (viewport.height * 0.18) / PET_HEIGHT;
    return { scale: s, groundRadius: 0.8 * s };
  }, [viewport]);

  const playTrick = () => {
    const s = state.current;
    const r = Math.random();
    if (r < 0.34) {
      s.mood = 'jump';
      s.jumpT = 0;
    } else if (r < 0.67) {
      s.mood = 'roll';
      s.rollT = 0;
    } else {
      s.mood = 'beg';
      s.begT = 0;
    }
  };

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      // 相机 [0,0,9] fov50：点击点投影到 z=0 平面
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const m = new THREE.Vector3(
        (nx * viewport.width) / 2,
        (ny * viewport.height) / 2,
        0
      );
      const h = new THREE.Vector3(
        (POS_NX * viewport.width) / 2,
        (POS_NY * viewport.height) / 2,
        0
      );
      if (h.distanceTo(m) < dims.scale * 1.6) {
        playTrick();
        state.current.moodTimer = 4 + Math.random() * 5;
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [dims, viewport]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    s.moodTimer -= dt;
    if (s.moodTimer <= 0) {
      playTrick();
      s.moodTimer = 7 + Math.random() * 9;
    }

    if (s.mood === 'idle') {
      s.walkPhase += dt * 13;
    } else if (s.mood === 'jump') {
      s.jumpT += dt;
      if (s.jumpT > 1.4) {
        s.mood = 'idle';
        s.jumpT = -1;
      }
    } else if (s.mood === 'roll') {
      s.rollT += dt;
      if (s.rollT > 1.2) {
        s.mood = 'idle';
        s.rollT = -1;
      }
    } else if (s.mood === 'beg') {
      s.begT += dt;
      if (s.begT > 2.2) {
        s.mood = 'idle';
        s.begT = -1;
      }
    }

    const homeX = (POS_NX * viewport.width) / 2;
    const homeY = (POS_NY * viewport.height) / 2;
    g.position.set(homeX, homeY, 0);
    g.rotation.y = s.facing;
    g.rotation.z = 0;
    g.rotation.x = 0;
    g.scale.setScalar(dims.scale);

    if (s.mood === 'idle') {
      const step = Math.sin(s.walkPhase);
      g.position.y += step * 0.035 * dims.scale * 3;
      g.rotation.z = Math.sin(s.walkPhase * 0.5) * 0.07;
      g.rotation.x = Math.sin(s.walkPhase) * 0.09;
      g.scale.y = dims.scale * (1 - Math.abs(step) * 0.05);
      g.position.z = Math.sin(s.walkPhase * 0.5) * 0.06 * dims.scale * 3;
    } else if (s.mood === 'jump') {
      g.rotation.x = Math.sin(s.jumpT * 6) * 0.14;
      g.position.y += Math.abs(Math.sin(s.jumpT * 6)) * 0.05;
      const seg = s.jumpT % 0.7;
      const h = Math.sin((seg / 0.7) * Math.PI) * 1.1;
      const jumpIdx = Math.floor(s.jumpT / 0.7);
      g.position.y += h * (1 - jumpIdx * 0.22) * dims.scale * 0.06;
      if (jumpIdx === 1 && h > 0.01) g.rotation.y += dt * 4.2;
    } else if (s.mood === 'roll') {
      g.rotation.z = (s.rollT / 1.2) * Math.PI * 2;
      g.position.y += Math.abs(Math.sin((s.rollT / 1.2) * Math.PI)) * 0.4;
    } else if (s.mood === 'beg') {
      const t = s.begT;
      const squash = 1 - Math.min(0.28, t * 0.35);
      g.scale.y = dims.scale * squash;
      g.position.y -= dims.scale * (1 - squash) * 0.5;
      g.rotation.x = 0.42 + Math.sin(t * 16) * 0.16;
      g.rotation.z = Math.sin(t * 22) * 0.22;
    }

    g.rotation.order = 'YXZ';
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.52 * dims.scale, 0]}>
        <circleGeometry args={[dims.groundRadius, 32]} />
        <meshBasicMaterial
          color="#c7f23d"
          transparent
          opacity={0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ---------------- 狗加载器 ---------------- */

function PetDog() {
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  useEffect(() => {
    let alive = true;
    let attempt = 0;
    const maxAttempts = 3;

    const load = () => {
      if (!alive) return;
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);
      loader.load(
        PET_URL,
        (gltf) => {
          if (alive) setScene(gltf.scene);
        },
        undefined,
        () => {
          if (!alive) return;
          attempt += 1;
          if (attempt < maxAttempts) {
            setTimeout(load, 600);
          } else {
            console.warn('[pet-dog] load failed after retries');
          }
        }
      );
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  if (!scene) return null;
  return <PetBody scene={scene} />;
}

/* ---------------- 覆盖层容器 ---------------- */

export default function PetDogLayer() {
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState(false);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      setWebgl(
        !!(window.WebGLRenderingContext && (canvas.getContext('webgl2') || canvas.getContext('webgl')))
      );
    } catch {
      setWebgl(false);
    }
  }, []);

  useEffect(() => {
    const hero = document.getElementById('top');
    if (!hero) return;
    const io = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  if (!webgl || !visible) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8500,
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-5, -2, 3]} intensity={16} color="#3e8cff" />
      <pointLight position={[3, 2, -4]} intensity={12} color="#c7f23d" />
      <PetDog />
    </Canvas>
  );
}
