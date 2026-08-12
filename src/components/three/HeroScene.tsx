import { useEffect, useLayoutEffect, useMemo, useRef, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree, useLoader } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

const NEON = new THREE.Color('#c7f23d');
const ELECTRIC = new THREE.Color('#3e8cff');
const DIM = new THREE.Color('#3a4152');

// 共享 DRACO 解码器：避免并发实例重复 fetch wasm 导致加载被中断
const sharedDraco = new DRACOLoader();
sharedDraco.setDecoderPath(import.meta.env.BASE_URL + 'lib/draco/');

/* ---------------- 机械狗（驻留"阿威"标题右侧） ---------------- */

const PET_URL = import.meta.env.BASE_URL + 'models/bpx.glb';
const PET_HEIGHT = 764; // 模型原始高度（毫米，STP 单位制）
const HOME_X = -1.9;
const HOME_Y = 0.45;

type Mood = 'idle' | 'jump' | 'roll' | 'beg';

function PetDogBody({ scene }: { scene: THREE.Scene }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport, camera } = useThree();

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
    facing: -0.4,
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
    const s = (viewport.height * 0.26) / PET_HEIGHT;
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
      // Hero 相机 [0,0.4,9] fov50：把点击点投影到 z=0 平面
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = -(e.clientY / window.innerHeight) * 2 + 1;
      const m = new THREE.Vector3(
        (nx * viewport.width) / 2,
        (ny * viewport.height) / 2 + camera.position.y,
        0
      );
      const h = new THREE.Vector3(HOME_X, HOME_Y, 0);
      if (h.distanceTo(m) < dims.scale * 1.6) {
        playTrick();
        state.current.moodTimer = 4 + Math.random() * 5;
      }
    };
    window.addEventListener('pointerdown', onDown);
    return () => window.removeEventListener('pointerdown', onDown);
  }, [dims, viewport, camera]);

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

    g.position.set(HOME_X, HOME_Y, 0);
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
    <group ref={groupRef} position={[HOME_X, HOME_Y, 0]} scale={dims.scale}>
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

function PetDog() {
  const [scene, setScene] = useState<THREE.Scene | null>(null);

  useEffect(() => {
    let alive = true;
    let attempt = 0;
    const maxAttempts = 3;

    const load = () => {
      if (!alive) return;
      const loader = new GLTFLoader();
      loader.setDRACOLoader(sharedDraco);
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
  return <PetDogBody scene={scene} />;
}

/* ---------------- 粒子星云 ---------------- */

function ParticleField({ count = 22000 }: { count?: number }) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const { pointer, viewport } = useThree();

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const cA = new THREE.Color();
    const cB = new THREE.Color();
    for (let i = 0; i < count; i++) {
      const r = Math.pow(Math.random(), 1.6);
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 6 + r * 14;
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = (radius * 0.62) * Math.cos(phi);
      pos[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta) * 0.8;

      const t = Math.random();
      cA.copy(t < 0.72 ? DIM : t < 0.86 ? NEON : ELECTRIC);
      const brightness = 0.35 + Math.random() * 0.65;
      col[i * 3] = cA.r * brightness;
      col[i * 3 + 1] = cA.g * brightness;
      col[i * 3 + 2] = cA.b * brightness;
    }
    return { positions: pos, colors: col };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uViewport: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state, delta) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += delta * 0.35;
      matRef.current.uniforms.uMouse.value.lerp(
        new THREE.Vector2(pointer.x, pointer.y),
        0.04
      );
    }
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.018;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={`
          uniform float uTime;
          uniform vec2 uMouse;
          uniform vec2 uViewport;
          attribute vec3 color;
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec3 p = position;
            float wave = sin(p.y * 0.8 + uTime) * cos(p.x * 0.6 + uTime * 0.7) * 0.25;
            p.y += wave;

            vec2 mp = uMouse * vec2(uViewport.x * 0.5, uViewport.y * 0.5);
            float dist = length(p.xy - mp * 0.6);
            float force = smoothstep(3.2, 0.0, dist);
            p.xy += normalize(p.xy - mp * 0.6 + 0.0001) * force * 0.5;

            vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mvPosition;

            float size = 260.0 / max(0.1, -mvPosition.z);
            gl_PointSize = size * (0.55 + 0.45 * wave * 2.0 + 0.35 * force);

            vColor = color;
            vAlpha = 0.35 + 0.65 * smoothstep(0.0, 1.0, abs(wave) + force);
          }
        `}
        fragmentShader={`
          varying vec3 vColor;
          varying float vAlpha;

          void main() {
            vec2 uv = gl_PointCoord - 0.5;
            float d = length(uv);
            if (d > 0.5) discard;
            float glow = exp(-d * 7.0);
            gl_FragColor = vec4(vColor, vAlpha * glow);
          }
        `}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ---------------- 真实 CR-12E 模型 ---------------- */

const MODEL_URL = import.meta.env.BASE_URL + 'models/cr-12e.glb';
const TARGET_HEIGHT = 3.2;

function RobotModel() {
  const groupRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  const { scene } = useLoader(GLTFLoader, MODEL_URL, (loader) => {
    loader.setDRACOLoader(sharedDraco);
  });

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = new THREE.MeshStandardMaterial({
          color: '#9aa0aa',
          metalness: 0.85,
          roughness: 0.32,
        });
        o.castShadow = true;
      }
    });

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = TARGET_HEIGHT / size.y;

    scene.position.set(-center.x * s, -center.y * s, -center.z * s);
    scene.scale.setScalar(s);
  }, [scene]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.16;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        THREE.MathUtils.clamp(pointer.x * 0.55, -0.28, 0.6),
        0.03
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        pointer.y * 0.35 + 0.1,
        0.03
      );
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      <primitive object={scene} />
    </group>
  );
}
/* ---------------- 霓虹光环 ---------------- */

function Rings() {
  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#c7f23d',
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.z += delta * 0.18;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh material={ringMat} rotation={[Math.PI / 2.2, 0, 0]}>
        <torusGeometry args={[2.15, 0.014, 12, 96]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 1.85, 0.4, 0.2]}>
        <torusGeometry args={[2.7, 0.01, 12, 96]} />
      </mesh>
    </group>
  );
}

/* ---------------- 全局光照 ---------------- */

function Lights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} color="#ffffff" />
      <pointLight position={[-5, -2, 3]} intensity={14} color="#3e8cff" />
      <pointLight position={[3, 2, -4]} intensity={10} color="#c7f23d" />
    </>
  );
}

/* ---------------- 场景容器 ---------------- */

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.4, 9], fov: 50 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <Lights />
        <ParticleField />
        <RobotModel />
        <PetDog />
        <Rings />
      </Suspense>
    </Canvas>
  );
}
