'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sphere, MeshDistortMaterial, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function AnimatedSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 200]} scale={2.8}>
        <MeshDistortMaterial
          color="#72cfb3"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
      <pointLight position={[10, 10, 10]} intensity={1.5} color="#72cfb3" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a78bfa" />
    </Float>
  );
}

function ParticleField() {
  const count = 3000;
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const radius = 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);
      
      const colorMix = Math.random();
      colors[i * 3] = colorMix < 0.5 ? 0.45 : 0.65;
      colors[i * 3 + 1] = 0.81;
      colors[i * 3 + 2] = colorMix < 0.5 ? 0.7 : 0.47;
    }
    
    return [positions, colors];
  }, []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.012} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function AnimatedRings() {
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = state.clock.elapsedTime * 0.3;
      ring1Ref.current.rotation.z = state.clock.elapsedTime * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = state.clock.elapsedTime * 0.4;
      ring2Ref.current.rotation.z = -state.clock.elapsedTime * 0.3;
    }
  });

  return (
    <>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[3, 0.05, 16, 100]} />
        <meshStandardMaterial color="#72cfb3" emissive="#72cfb3" emissiveIntensity={0.5} transparent opacity={0.4} />
      </mesh>
      <mesh ref={ring2Ref}>
        <torusGeometry args={[3.5, 0.05, 16, 100]} />
        <meshStandardMaterial color="#a78bfa" emissive="#a78bfa" emissiveIntensity={0.5} transparent opacity={0.3} />
      </mesh>
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#72cfb3" />
        <AnimatedSphere />
        <AnimatedRings />
        <ParticleField />
      </Canvas>
    </div>
  );
}
