import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const PET_URL = import.meta.env.BASE_URL + 'models/bpx.glb';
const DOG_HEIGHT = 764; // 模型原始高度（毫米，STP 单位制）

// 角度插值（带环绕处理）
function lerpAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

type Mood = 'chase' | 'idle' | 'jump' | 'roll' | 'beg';

/* ---------------- 机械狗实体 ---------------- */

function Pet() {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();

  const { scene } = useLoader(GLTFLoader, PET_URL, (loader) => {
    const draco = new DRACOLoader();
    draco.setDecoderPath(import.meta.env.BASE_URL + 'lib/draco/');
    loader.setDRACOLoader(draco);
  });

  // 状态
  const state = useRef<{
    mood: Mood;
    moodTimer: number;
    pos: THREE.Vector3;
    heading: number;
    speed: number;
    walkPhase: number;
    idleT: number;
    jumpT: number;
    jumpStartY: number;
    rollT: number;
    begT: number;
    mouseWorld: THREE.Vector3;
    facing: number;
    moveTilt: number;
  }>({
    mood: 'idle',
    moodTimer: 0,
    pos: new THREE.Vector3(0, 0, 0),
    heading: 0,
    speed: 2.4,
    walkPhase: 0,
    idleT: 0,
    jumpT: -1,
    jumpStartY: 0,
    rollT: -1,
    begT: -1,
    mouseWorld: new THREE.Vector3(99, 99, 0),
    facing: 0,
    moveTilt: 0,
  });

  // 材质：统一银灰金属（模型部件太多无法细分）
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

  // 尺寸与边界
  const dims = useMemo(() => {
    const s = (viewport.height * 0.26) / DOG_HEIGHT;
    return {
      scale: s,
      groundRadius: 0.8 * s,
      bounds: {
        x: viewport.width * 0.38,
        yMin: -viewport.height * 0.36,
        yMax: viewport.height * 0.3,
      },
    };
  }, [viewport]);

  // 视口坐标 → 世界坐标（z=0 平面）
  const screenToWorld = (clientX: number, clientY: number) => {
    const nx = (clientX / window.innerWidth) * 2 - 1;
    const ny = -(clientY / window.innerHeight) * 2 + 1;
    return new THREE.Vector3(
      (nx * viewport.width) / 2,
      (ny * viewport.height) / 2,
      0
    );
  };

  // 撒娇动作随机三选一
  const playTrick = () => {
    const s = state.current;
    const r = Math.random();
    if (r < 0.34) {
      s.mood = 'jump';
      s.jumpT = 0;
      s.jumpStartY = s.pos.y;
    } else if (r < 0.67) {
      s.mood = 'roll';
      s.rollT = 0;
    } else {
      s.mood = 'beg';
      s.begT = 0;
    }
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      state.current.mouseWorld.copy(screenToWorld(e.clientX, e.clientY));
    };
    const onDown = (e: MouseEvent) => {
      const m = screenToWorld(e.clientX, e.clientY);
      const s = state.current;
      if (s.pos.distanceTo(m) < dims.scale * 1.8) {
        playTrick();
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointerdown', onDown);
    };
  }, [dims]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);
    const acting = s.mood === 'jump' || s.mood === 'roll' || s.mood === 'beg';

    // ---------- 跟随鼠标（含 z 轴前后感） ----------
    if (!acting) {
      const m = s.mouseWorld;
      // 鼠标靠上 → 狗走近相机（z 负，变大）；靠下 → 走远（z 正，变小）
      const zTarget = THREE.MathUtils.clamp(
        (m.y / (viewport.height / 2)) * 1.5,
        -1.8,
        1.2
      );
      s.pos.z += (zTarget - s.pos.z) * Math.min(1, dt * 2.6);

      const dx = m.x - s.pos.x;
      const dy = m.y - s.pos.y;
      const dist = Math.hypot(dx, dy);
      const stopR = dims.scale * 0.5;
      if (dist > stopR) {
        s.mood = 'chase';
        s.pos.x += (dx / dist) * s.speed * dt;
        s.pos.y += (dy / dist) * s.speed * dt;
        s.walkPhase += dt * 12;
        s.facing = lerpAngle(s.facing, Math.atan2(dx, dy), 0.14);
      } else if (s.mood !== 'idle') {
        s.mood = 'idle';
        s.idleT = 0;
      }
    }

    // ---------- 状态机动作 ----------
    if (s.mood === 'idle') {
      s.idleT += dt;
    } else if (s.mood === 'jump') {
      s.jumpT += dt;
      if (s.jumpT > 1.4) {
        s.mood = 'chase';
        s.jumpT = -1;
      } else {
        const seg = s.jumpT % 0.7;
        const h = Math.sin((seg / 0.7) * Math.PI) * 1.1;
        const jumpIdx = Math.floor(s.jumpT / 0.7);
        s.pos.y = s.jumpStartY + h * (1 - jumpIdx * 0.22);
        if (jumpIdx === 1 && h > 0.01) s.facing += dt * 4.2;
      }
    } else if (s.mood === 'roll') {
      s.rollT += dt;
      if (s.rollT > 1.2) {
        s.mood = 'chase';
        s.rollT = -1;
      }
    } else if (s.mood === 'beg') {
      s.begT += dt;
      if (s.begT > 2.2) {
        s.mood = 'chase';
        s.begT = -1;
      }
    }

    // 边界约束
    const b = dims.bounds;
    s.pos.x = THREE.MathUtils.clamp(s.pos.x, -b.x, b.x);
    s.pos.y = THREE.MathUtils.clamp(s.pos.y, b.yMin, b.yMax);
    s.pos.z = THREE.MathUtils.clamp(s.pos.z, -1.8, 1.2);

    // ---------- 应用到模型 ----------
    g.position.copy(s.pos);
    g.rotation.y = s.facing;
    g.scale.setScalar(dims.scale);

    if (s.mood === 'chase') {
      // 奔跑：起伏 + 侧倾 + 前倾（立体感）
      const bob = Math.sin(s.walkPhase) * 0.05 * dims.scale * 3;
      const lean = Math.sin(s.walkPhase * 0.5) * 0.09;
      const speedLean = Math.min(s.speed * 0.035, 0.14);
      g.position.y += bob;
      g.rotation.z = lean;
      g.rotation.x = speedLean + Math.sin(s.walkPhase) * 0.05;
      g.scale.y = dims.scale * (1 - Math.abs(Math.sin(s.walkPhase * 0.5)) * 0.04);
    } else if (s.mood === 'idle') {
      const breath = Math.sin(s.idleT * 2.4) * 0.015;
      g.position.y += breath;
      g.rotation.z = Math.sin(s.idleT * 1.4) * 0.05;
      // 摇尾
      g.rotation.x = Math.sin(s.idleT * 9) * 0.06;
    } else if (s.mood === 'jump') {
      g.rotation.x = Math.sin(s.jumpT * 6) * 0.14;
      g.position.y += Math.abs(Math.sin(s.jumpT * 6)) * 0.05;
    } else if (s.mood === 'roll') {
      g.rotation.z = (s.rollT / 1.2) * Math.PI * 2;
      g.position.y += Math.abs(Math.sin((s.rollT / 1.2) * Math.PI)) * 0.4;
      s.pos.x += dt * 0.6;
    } else if (s.mood === 'beg') {
      // 坐姿讨食：压扁 + 前倾 + 快速点头 + 疯狂摇尾
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
    <group ref={groupRef} scale={dims.scale}>
      <primitive object={scene} />
      {/* 地面光晕 */}
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

/* ---------------- 全屏容器 ---------------- */

export default function FloatingPet() {
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

  if (!webgl) return null;

  return (
    <Canvas
      camera={{ position: [0, 0, 9], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 8000,
      }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} color="#ffffff" />
      <pointLight position={[-5, -2, 3]} intensity={16} color="#3e8cff" />
      <pointLight position={[3, 2, -4]} intensity={12} color="#c7f23d" />
      <Pet />
    </Canvas>
  );
}
