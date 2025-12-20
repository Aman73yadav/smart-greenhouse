import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Float, useTexture } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

function GlassPanel({ position, rotation, scale }: { position: [number, number, number], rotation?: [number, number, number], scale?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation || [0, 0, 0]} scale={scale || [1, 1, 1]}>
      <boxGeometry args={[0.05, 3, 4]} />
      <meshPhysicalMaterial
        color="#a8e6cf"
        transparent
        opacity={0.3}
        roughness={0.1}
        metalness={0.1}
        transmission={0.9}
        thickness={0.5}
      />
    </mesh>
  );
}

function GreenhouseStructure() {
  return (
    <group>
      {/* Floor */}
      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#2d4a35" roughness={0.8} />
      </mesh>
      
      {/* Main frame */}
      <group>
        {/* Left wall */}
        <GlassPanel position={[-3.5, 0, 0]} />
        {/* Right wall */}
        <GlassPanel position={[3.5, 0, 0]} />
        {/* Back wall */}
        <GlassPanel position={[0, 0, -2.5]} rotation={[0, Math.PI / 2, 0]} scale={[1, 1, 1.8]} />
        
        {/* Roof panels */}
        <mesh position={[-1.75, 2, 0]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[3.5, 0.05, 4]} />
          <meshPhysicalMaterial
            color="#a8e6cf"
            transparent
            opacity={0.25}
            roughness={0.1}
            transmission={0.95}
          />
        </mesh>
        <mesh position={[1.75, 2, 0]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[3.5, 0.05, 4]} />
          <meshPhysicalMaterial
            color="#a8e6cf"
            transparent
            opacity={0.25}
            roughness={0.1}
            transmission={0.95}
          />
        </mesh>
      </group>
      
      {/* Metal frame lines */}
      {[-3.5, 0, 3.5].map((x, i) => (
        <mesh key={i} position={[x, 0.25, 0]}>
          <boxGeometry args={[0.08, 3.5, 0.08]} />
          <meshStandardMaterial color="#4a7c59" metalness={0.6} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function PlantBed({ position, color }: { position: [number, number, number], color: string }) {
  return (
    <group position={position}>
      {/* Bed container */}
      <mesh position={[0, -1.2, 0]}>
        <boxGeometry args={[1.2, 0.4, 2.5]} />
        <meshStandardMaterial color="#5a3825" roughness={0.9} />
      </mesh>
      
      {/* Soil */}
      <mesh position={[0, -1, 0]}>
        <boxGeometry args={[1.1, 0.1, 2.4]} />
        <meshStandardMaterial color="#3d2817" roughness={1} />
      </mesh>
      
      {/* Plants */}
      {[-0.8, -0.4, 0, 0.4, 0.8].map((z, i) => (
        <Float key={i} speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh position={[0, -0.6 + Math.random() * 0.3, z]}>
            <sphereGeometry args={[0.15 + Math.random() * 0.1, 8, 8]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
          <mesh position={[0, -0.85, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.3, 8]} />
            <meshStandardMaterial color="#4a7c59" />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

function Sensor({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });
  
  return (
    <group position={position}>
      {/* Sensor body */}
      <mesh>
        <boxGeometry args={[0.15, 0.25, 0.1]} />
        <meshStandardMaterial color="#e8e8e8" metalness={0.5} roughness={0.3} />
      </mesh>
      
      {/* LED indicator */}
      <mesh ref={meshRef} position={[0, 0.05, 0.06]}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={2} />
      </mesh>
      
      {/* Mount pole */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#666" metalness={0.7} />
      </mesh>
    </group>
  );
}

function MistParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.getElapsedTime() * 0.05;
    }
  });
  
  const particleCount = 200;
  const positions = new Float32Array(particleCount * 3);
  
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 6;
    positions[i * 3 + 1] = Math.random() * 2 - 0.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
  }
  
  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.02}
        color="#a8e6cf"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[6, 3, 6]} fov={50} />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={5}
        maxDistance={15}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.2}
        autoRotate
        autoRotateSpeed={0.5}
      />
      
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow color="#fff5e6" />
      <pointLight position={[0, 2, 0]} intensity={0.5} color="#a8e6cf" />
      
      {/* Greenhouse */}
      <GreenhouseStructure />
      
      {/* Plant beds */}
      <PlantBed position={[-2, 0, 0]} color="#e74c3c" />
      <PlantBed position={[0, 0, 0]} color="#27ae60" />
      <PlantBed position={[2, 0, 0]} color="#f39c12" />
      
      {/* Sensors */}
      <Sensor position={[-2.8, 0.5, 1.5]} />
      <Sensor position={[2.8, 0.5, -1.5]} />
      <Sensor position={[0, 1.5, -2]} />
      
      {/* Mist effect */}
      <MistParticles />
      
      <Environment preset="sunset" />
    </>
  );
}

export default function GreenhouseScene() {
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <Canvas shadows className="bg-transparent">
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background via-transparent to-transparent" />
    </div>
  );
}
