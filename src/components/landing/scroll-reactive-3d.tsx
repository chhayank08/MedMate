'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useScroll } from 'motion/react';
import * as THREE from 'three';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';

function ScrollReactiveCamera() {
  const { scrollYProgress } = useScroll();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  useFrame(({ camera }) => {
    const progress = scrollYProgress.get();
    camera.position.z = 6 - progress * 2;
    camera.position.y = progress * -1;
    camera.rotation.x = progress * 0.1;
  });

  return null;
}

function ScrollReactiveSphere() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { scrollYProgress } = useScroll();

  useFrame((state) => {
    if (meshRef.current) {
      const progress = scrollYProgress.get();
      meshRef.current.rotation.x = state.clock.elapsedTime * 0.2 + progress * Math.PI;
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.3 + progress * Math.PI;
      meshRef.current.scale.setScalar(2.8 - progress * 0.5);
    }
  });

  return (
    <Float speed={1.4} rotationIntensity={1} floatIntensity={2}>
      <Sphere ref={meshRef} args={[1, 100, 200]}>
        <MeshDistortMaterial
          color="#72cfb3"
          attach="material"
          distort={0.4}
          speed={2}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

function ScrollReactiveParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const { scrollYProgress } = useScroll();
  const count = 3000;

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

  useFrame((state) => {
    if (pointsRef.current) {
      const progress = scrollYProgress.get();
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.03 + progress * 0.5;
      pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.1 + progress * 0.2;
      pointsRef.current.position.z = progress * 3;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.012} vertexColors transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

function ScrollReactiveLighting() {
  const { scrollYProgress } = useScroll();
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (lightRef.current) {
      const progress = scrollYProgress.get();
      lightRef.current.intensity = 1.5 + progress * 0.5;
      lightRef.current.position.x = 10 - progress * 5;
    }
  });

  return (
    <>
      <pointLight ref={lightRef} position={[10, 10, 10]} color="#72cfb3" />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a78bfa" />
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} color="#72cfb3" />
    </>
  );
}

export function ScrollReactive3D() {
  return (
    <div className="absolute inset-0 -z-10 opacity-70">
      <Canvas camera={{ position: [0, 0, 6], fov: 75 }}>
        <ScrollReactiveCamera />
        <ScrollReactiveLighting />
        <ScrollReactiveSphere />
        <ScrollReactiveParticles />
      </Canvas>
    </div>
  );
}
