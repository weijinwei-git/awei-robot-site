import { useMemo, useRef, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const NEON = new THREE.Color('#c7f23d');
const ELECTRIC = new THREE.Color('#3e8cff');
const DIM = new THREE.Color('#3a4152');

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

/* ---------------- 程序化抽象机械核心 ---------------- */

function MechanicalCore() {
  const groupRef = useRef<THREE.Group>(null);
  const armRef = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.22;
      groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x,
        pointer.x * 0.5,
        0.03
      );
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        pointer.y * 0.35,
        0.03
      );
    }
    if (armRef.current) {
      armRef.current.rotation.z = Math.sin(t * 0.6) * 0.55;
      armRef.current.rotation.x = Math.cos(t * 0.45) * 0.35;
    }
  });

  const metalMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#2a2f3c', metalness: 0.92, roughness: 0.28 }),
    []
  );
  const neonMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#c7f23d', metalness: 0.35, roughness: 0.25, emissive: new THREE.Color('#c7f23d'), emissiveIntensity: 0.55 }),
    []
  );
  const darkMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#14161d', metalness: 0.85, roughness: 0.45 }),
    []
  );

  const ringMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#c7f23d',
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    []
  );

  return (
    <group ref={groupRef}>
      {/* 底座 */}
      <mesh position={[0, -1.1, 0]} material={darkMat}>
        <cylinderGeometry args={[0.95, 1.25, 0.45, 6]} />
      </mesh>
      <mesh position={[0, -0.85, 0]} material={metalMat}>
        <cylinderGeometry args={[0.62, 0.62, 0.28, 6]} />
      </mesh>
      {/* 肩关节 */}
      <mesh position={[0, -0.55, 0]} material={neonMat}>
        <sphereGeometry args={[0.34, 24, 24]} />
      </mesh>
      {/* 大臂 */}
      <group ref={armRef} position={[0, -0.2, 0]}>
        <mesh position={[0, 0.75, 0]} material={metalMat}>
          <cylinderGeometry args={[0.17, 0.22, 1.5, 8]} />
        </mesh>
        {/* 肘关节 */}
        <mesh position={[0, 1.55, 0]} material={neonMat}>
          <sphereGeometry args={[0.24, 24, 24]} />
        </mesh>
        {/* 小臂 */}
        <mesh position={[0, 2.15, 0]} rotation={[0, 0, 0.35]} material={metalMat}>
          <cylinderGeometry args={[0.13, 0.17, 1.2, 8]} />
        </mesh>
        {/* 腕部末端 */}
        <mesh position={[0.42, 2.68, 0]} material={neonMat}>
          <boxGeometry args={[0.3, 0.18, 0.18]} />
        </mesh>
        {/* 抓手 */}
        <mesh position={[0.72, 2.68, 0]} material={metalMat}>
          <boxGeometry args={[0.4, 0.08, 0.14]} />
        </mesh>
      </group>
      {/* 光环 */}
      <mesh material={ringMat} rotation={[Math.PI / 2.15, 0, 0]}>
        <torusGeometry args={[1.85, 0.012, 12, 96]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 1.8, 0.4, 0.2]}>
        <torusGeometry args={[2.35, 0.008, 12, 96]} />
      </mesh>
      <mesh material={ringMat} rotation={[Math.PI / 1.6, -0.3, -0.35]}>
        <torusGeometry args={[1.55, 0.01, 12, 96]} />
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
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <Lights />
        <ParticleField />
        <MechanicalCore />
      </Suspense>
    </Canvas>
  );
}
