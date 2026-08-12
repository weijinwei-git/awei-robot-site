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

type Mood = 'walk' | 'idle' | 'jump' | 'roll' | 'excited';

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
    target: THREE.Vector3;
    heading: number;
    speed: number;
    walkPhase: number;
    idleT: number;
    jumpT: number;
    jumpStartY: number;
    rollT: number;
    mouseWorld: THREE.Vector3;
    excitedT: number;
    facing: number;
  }>({
    mood: 'walk',
    moodTimer: 0,
    pos: new THREE.Vector3(0, 0, 0),
    target: new THREE.Vector3(2, 1, 0),
    heading: 0,
    speed: 1.1,
    walkPhase: 0,
    idleT: 0,
    jumpT: -1,
    jumpStartY: 0,
    rollT: -1,
    mouseWorld: new THREE.Vector3(99, 99, 0),
    excitedT: 0,
    facing: 0,
  });

  // 材质：统一银灰金属（模型部件太多无法细分）
  useMemo(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: '#9aa0aa',
          metalness: 0.8,
          roughness: 0.35,
        });
      }
    });
  }, [scene]);

  // 尺寸与边界
  const dims = useMemo(() => {
    const s = (viewport.height * 0.16) / DOG_HEIGHT;
    return {
      scale: s,
      groundRadius: 0.55 * s,
      bounds: {
        x: viewport.width * 0.36,
        yMin: -viewport.height * 0.34,
        yMax: viewport.height * 0.28,
      },
    };
  }, [viewport]);

  // 随机目标
  const pickTarget = () => {
    const b = dims.bounds;
    state.current.target.set(
      (Math.random() * 2 - 1) * b.x,
      b.yMin + Math.random() * (b.yMax - b.yMin),
      0
    );
  };

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

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      state.current.mouseWorld.copy(screenToWorld(e.clientX, e.clientY));
    };
    const onDown = (e: MouseEvent) => {
      const m = screenToWorld(e.clientX, e.clientY);
      const s = state.current;
      if (s.pos.distanceTo(m) < dims.scale * 1.5) {
        // 撒娇：跳到翻跟头
        if (Math.random() < 0.5) {
          s.mood = 'jump';
          s.jumpT = 0;
          s.jumpStartY = s.pos.y;
        } else {
          s.mood = 'roll';
          s.rollT = 0;
        }
        s.excitedT = 3;
      }
    };
    const onScroll = () => {
      state.current.mood = 'walk';
      pickTarget();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('scroll', onScroll);
    };
  }, [dims]);

  useFrame((_, delta) => {
    const g = groupRef.current;
    if (!g) return;
    const s = state.current;
    const dt = Math.min(delta, 0.05);

    // 鼠标距离
    const distToMouse = s.pos.distanceTo(s.mouseWorld);
    if (s.mood !== 'jump' && s.mood !== 'roll') {
      if (distToMouse < dims.scale * 2.6) {
        s.mood = 'excited';
        s.excitedT = 0.15;
      } else if (s.mood === 'excited') {
        s.excitedT -= dt;
        if (s.excitedT <= 0) s.mood = 'walk';
      }
    }

    // 朝向鼠标（excited / idle 时）
    if (s.mood === 'excited' || s.mood === 'idle') {
      const dx = s.mouseWorld.x - s.pos.x;
      const dy = s.mouseWorld.y - s.pos.y;
      const targetFacing = Math.atan2(dx, dy);
      s.facing = lerpAngle(s.facing, targetFacing, 0.1);
    }

    // ---------- 状态机 ----------
    if (s.mood === 'walk') {
      const dx = s.target.x - s.pos.x;
      const dy = s.target.y - s.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.05) {
        s.mood = 'idle';
        s.idleT = 1.5 + Math.random() * 2.5;
      } else {
        s.pos.x += (dx / dist) * s.speed * dt;
        s.pos.y += (dy / dist) * s.speed * dt;
        s.walkPhase += dt * 11;
        s.facing = lerpAngle(s.facing, Math.atan2(dx, dy), 0.12);
      }
    } else if (s.mood === 'idle') {
      s.idleT -= dt;
      if (s.idleT <= 0) {
        s.mood = 'walk';
        pickTarget();
      }
    } else if (s.mood === 'excited') {
      // 小跳兴奋
      const hop = Math.abs(Math.sin(s.walkPhase * 1.4)) * 0.05;
      s.pos.y += hop * 0.6;
      s.walkPhase += dt * 18;
      // 缓慢向鼠标靠近
      const dx = s.mouseWorld.x - s.pos.x;
      const dy = s.mouseWorld.y - s.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > dims.scale * 1.6) {
        s.pos.x += (dx / dist) * s.speed * 0.85 * dt;
        s.pos.y += (dy / dist) * s.speed * 0.85 * dt;
      }
    } else if (s.mood === 'jump') {
      s.jumpT += dt;
      const t = s.jumpT;
      if (t > 1.4) {
        s.mood = 'walk';
        s.jumpT = -1;
      } else {
        // 抛物线 2 跳 + 空中翻转
        const seg = t % 0.7;
        const h = Math.sin((seg / 0.7) * Math.PI) * 0.9;
        const jumpIdx = Math.floor(t / 0.7);
        s.pos.y = s.jumpStartY + h * (1 - jumpIdx * 0.25);
        if (jumpIdx === 1) h > 0.01 && (s.facing += dt * 4); // 空中转体
      }
    } else if (s.mood === 'roll') {
      s.rollT += dt;
      if (s.rollT > 1.1) {
        s.mood = 'walk';
        s.rollT = -1;
      }
    }

    // 边界约束
    const b = dims.bounds;
    s.pos.x = THREE.MathUtils.clamp(s.pos.x, -b.x, b.x);
    s.pos.y = THREE.MathUtils.clamp(s.pos.y, b.yMin, b.yMax);

    // ---------- 应用到模型 ----------
    g.position.copy(s.pos);
    g.rotation.y = s.facing;

    // 身体动画
    if (s.mood === 'walk') {
      const bob = Math.sin(s.walkPhase) * 0.045 * dims.scale * 3;
      g.position.y += bob;
      g.rotation.z = Math.sin(s.walkPhase * 0.5) * 0.06;
      g.rotation.x = Math.sin(s.walkPhase) * 0.045;
    } else if (s.mood === 'idle') {
      const breath = Math.sin(s.idleT * 2.2) * 0.012;
      g.position.y += breath;
      g.rotation.z = Math.sin(s.idleT * 1.3) * 0.03;
    } else if (s.mood === 'excited') {
      const shake = Math.sin(s.walkPhase) * 0.05;
      g.rotation.z = shake;
      g.rotation.x = Math.cos(s.walkPhase * 0.7) * 0.05;
      g.position.y += Math.abs(Math.sin(s.walkPhase)) * 0.03;
    } else if (s.mood === 'jump') {
      g.rotation.x = Math.sin(s.jumpT * 6) * 0.12;
    } else if (s.mood === 'roll') {
      g.rotation.z = (s.rollT / 1.1) * Math.PI * 2;
      g.position.y += Math.abs(Math.sin((s.rollT / 1.1) * Math.PI)) * 0.35;
      s.pos.x += dt * 0.5;
    }

    g.scale.setScalar(dims.scale);
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
          opacity={0.12}
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
