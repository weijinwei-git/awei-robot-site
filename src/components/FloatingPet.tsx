import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const PET_URL = import.meta.env.BASE_URL + 'models/bpx.glb';
const DOG_HEIGHT = 764; // 模型原始高度（毫米，STP 单位制）
// 驻留点：Hero 首屏右侧（世界坐标，z=0 平面）
const HOME_X = 2.2;
const HOME_Y = -1.35;

type Mood = 'idle' | 'jump' | 'roll' | 'beg';

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
    walkPhase: number;
    jumpT: number;
    jumpStartY: number;
    rollT: number;
    begT: number;
    facing: number;
  }>({
    mood: 'idle',
    moodTimer: 5 + Math.random() * 6,
    pos: new THREE.Vector3(HOME_X, HOME_Y, 0),
    walkPhase: 0,
    jumpT: -1,
    jumpStartY: 0,
    rollT: -1,
    begT: -1,
    facing: 0.6,
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
    };
  }, [viewport]);

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
    const onDown = (e: MouseEvent) => {
      // 计算点击世界坐标（Hero 视角：相机 [0,0,9] fov50，z=0 平面）
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const m = new THREE.Vector3(
        (nx * viewport.width) / 2,
        (ny * viewport.height) / 2,
        0
      );
      const s = state.current;
      if (s.pos.distanceTo(m) < dims.scale * 2.2) {
        playTrick();
        s.moodTimer = 4 + Math.random() * 5;
      }
    };

    window.addEventListener('pointerdown', onDown);
    return () => {
      window.removeEventListener('pointerdown', onDown);
    };
  }, [dims]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    // 随机触发撒娇动作
    s.moodTimer -= dt;
    if (s.moodTimer <= 0) {
      playTrick();
      s.moodTimer = 7 + Math.random() * 9;
    }

    // ---------- 状态机动作 ----------
    if (s.mood === 'idle') {
      // 原地踏步
      s.walkPhase += dt * 13;
    } else if (s.mood === 'jump') {
      s.jumpT += dt;
      if (s.jumpT > 1.4) {
        s.mood = 'idle';
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

    // ---------- 应用到模型 ----------
    g.position.copy(s.pos);
    g.rotation.y = s.facing;
    g.scale.setScalar(dims.scale);

    if (s.mood === 'idle') {
      // 踏步：明显上下起伏 + 点头 + 侧倾（制造"脚在动"的感觉）
      const step = Math.sin(s.walkPhase);
      const bob = step * 0.035 * dims.scale * 3;
      g.position.y += bob;
      g.rotation.z = Math.sin(s.walkPhase * 0.5) * 0.07;
      g.rotation.x = Math.sin(s.walkPhase) * 0.09;
      g.scale.y = dims.scale * (1 - Math.abs(step) * 0.05);
      // 微前后位移模拟踏步落脚
      g.position.z = Math.sin(s.walkPhase * 0.5) * 0.06 * dims.scale * 3;
    } else if (s.mood === 'jump') {
      g.rotation.x = Math.sin(s.jumpT * 6) * 0.14;
      g.position.y += Math.abs(Math.sin(s.jumpT * 6)) * 0.05;
    } else if (s.mood === 'roll') {
      g.rotation.z = (s.rollT / 1.2) * Math.PI * 2;
      g.position.y += Math.abs(Math.sin((s.rollT / 1.2) * Math.PI)) * 0.4;
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
      dpr={[1, 1.4]}
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
