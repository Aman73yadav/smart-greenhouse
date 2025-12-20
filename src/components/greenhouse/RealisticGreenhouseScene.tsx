import React, { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Environment, Float, useTexture, Html } from '@react-three/drei';
import * as THREE from 'three';

import tomatoImg from '@/assets/tomato.jpg';
import lettuceImg from '@/assets/lettuce.jpg';
import strawberryImg from '@/assets/strawberry.jpg';
import carrotImg from '@/assets/carrot.jpg';
import soilImg from '@/assets/soil-layers.jpg';

// Soil bed with realistic texture
function SoilBed({ position, width = 2, depth = 1 }: { position: [number, number, number]; width?: number; depth?: number }) {
  const soilTexture = useTexture(soilImg);
  
  soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
  soilTexture.repeat.set(2, 1);

  return (
    <group position={position}>
      {/* Wooden planter box */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[width + 0.1, 0.25, depth + 0.1]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Soil surface */}
      <mesh position={[0, 0.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial 
          map={soilTexture} 
          roughness={1}
          bumpScale={0.02}
        />
      </mesh>
    </group>
  );
}

// Realistic plant with image texture
function PlantDisplay({ 
  position, 
  imageUrl, 
  label,
  scale = 0.4 
}: { 
  position: [number, number, number]; 
  imageUrl: string;
  label: string;
  scale?: number;
}) {
  const texture = useTexture(imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
      <group position={position}>
        {/* Plant stem */}
        <mesh position={[0, -0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 0.3, 8]} />
          <meshStandardMaterial color="#228B22" roughness={0.8} />
        </mesh>
        
        {/* Leaves around the plant */}
        {[0, 120, 240].map((angle, i) => (
          <mesh 
            key={i} 
            position={[
              Math.cos((angle * Math.PI) / 180) * 0.08,
              -0.05,
              Math.sin((angle * Math.PI) / 180) * 0.08
            ]}
            rotation={[0.3, (angle * Math.PI) / 180, 0.2]}
          >
            <planeGeometry args={[0.15, 0.08]} />
            <meshStandardMaterial color="#32CD32" side={THREE.DoubleSide} />
          </mesh>
        ))}
        
        {/* Plant/fruit image as billboard */}
        <mesh ref={meshRef} position={[0, 0.15, 0]}>
          <planeGeometry args={[scale, scale]} />
          <meshStandardMaterial 
            map={texture} 
            transparent 
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Label */}
        <Html position={[0, 0.4, 0]} center>
          <div className="bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium whitespace-nowrap border border-border">
            {label}
          </div>
        </Html>
      </group>
    </Float>
  );
}

// Sensor device with blinking LED
function SensorDevice({ position, value, label }: { position: [number, number, number]; value: string; label: string }) {
  const ledRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ledRef.current) {
      const material = ledRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.5;
    }
  });

  return (
    <group position={position}>
      {/* Sensor body */}
      <mesh>
        <boxGeometry args={[0.1, 0.15, 0.06]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Display screen */}
      <mesh position={[0, 0.02, 0.031]}>
        <planeGeometry args={[0.06, 0.04]} />
        <meshStandardMaterial color="#001a00" emissive="#00ff00" emissiveIntensity={0.2} />
      </mesh>
      
      {/* LED indicator */}
      <mesh ref={ledRef} position={[0.03, 0.05, 0.031]}>
        <sphereGeometry args={[0.01, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1} />
      </mesh>
      
      {/* Mounting pole */}
      <mesh position={[0, -0.2, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.25, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Value label */}
      <Html position={[0, 0.15, 0]} center>
        <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs border border-primary/30 shadow-lg">
          <div className="text-[10px] text-muted-foreground">{label}</div>
          <div className="font-bold text-primary">{value}</div>
        </div>
      </Html>
    </group>
  );
}

// Water droplets animation
function WaterDroplets() {
  const count = 30;
  const dropletsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3;
      pos[i * 3 + 1] = Math.random() * 1.5 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (dropletsRef.current) {
      const positions = dropletsRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= 0.02;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 1.5 + Math.random() * 0.5;
        }
      }
      dropletsRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={dropletsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color="#60a5fa" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Greenhouse glass structure
function GreenhouseFrame() {
  return (
    <group>
      {/* Floor - grass texture */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial color="#1a4d1a" roughness={0.95} />
      </mesh>
      
      {/* Glass panels - walls */}
      {[
        { pos: [-3.5, 1, 0] as [number, number, number], rot: [0, Math.PI / 2, 0] as [number, number, number], size: [5, 3] as [number, number] },
        { pos: [3.5, 1, 0] as [number, number, number], rot: [0, -Math.PI / 2, 0] as [number, number, number], size: [5, 3] as [number, number] },
        { pos: [0, 1, -2.5] as [number, number, number], rot: [0, 0, 0] as [number, number, number], size: [7, 3] as [number, number] },
      ].map((panel, i) => (
        <mesh key={i} position={panel.pos} rotation={panel.rot}>
          <planeGeometry args={panel.size} />
          <meshPhysicalMaterial
            color="#e8f5e9"
            transparent
            opacity={0.15}
            roughness={0.05}
            metalness={0}
            transmission={0.95}
            thickness={0.1}
          />
        </mesh>
      ))}

      {/* Frame beams */}
      {[
        [-3.5, 1, -2.5], [-3.5, 1, 2.5], [3.5, 1, -2.5], [3.5, 1, 2.5]
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <boxGeometry args={[0.08, 3, 0.08]} />
          <meshStandardMaterial color="#2d5016" metalness={0.3} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// Irrigation pipes
function IrrigationSystem() {
  return (
    <group position={[0, 1.8, 0]}>
      {/* Main pipe */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 6, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Drip lines */}
      {[-2, -0.7, 0.7, 2].map((x, i) => (
        <mesh key={i} position={[x, -0.3, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 6]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      ))}
    </group>
  );
}

// Main scene content
interface SceneContentProps {
  sensorData?: {
    temperature: number;
    humidity: number;
    moisture: number;
    lightLevel: number;
  };
}

function SceneContent({ sensorData }: SceneContentProps) {
  const temp = sensorData?.temperature ?? 24.5;
  const humidity = sensorData?.humidity ?? 68;
  const moisture = sensorData?.moisture ?? 72;
  const light = sensorData?.lightLevel ?? 850;

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.3} color="#ffcc77" />
      <spotLight position={[-2, 4, 2]} intensity={0.5} color="#22c55e" angle={0.4} penumbra={0.5} />

      <GreenhouseFrame />
      <IrrigationSystem />
      <WaterDroplets />

      {/* Soil beds with plants */}
      <SoilBed position={[-1.5, -0.4, 0]} width={2} depth={0.8} />
      <SoilBed position={[1.5, -0.4, 0]} width={2} depth={0.8} />
      <SoilBed position={[-1.5, -0.4, 1.3]} width={2} depth={0.8} />
      <SoilBed position={[1.5, -0.4, 1.3]} width={2} depth={0.8} />

      {/* Plants with real images */}
      <PlantDisplay position={[-2, -0.1, 0]} imageUrl={tomatoImg} label="Tomatoes" scale={0.35} />
      <PlantDisplay position={[-1.3, -0.1, 0]} imageUrl={tomatoImg} label="Tomatoes" scale={0.3} />
      <PlantDisplay position={[1.2, -0.1, 0]} imageUrl={lettuceImg} label="Lettuce" scale={0.35} />
      <PlantDisplay position={[1.9, -0.1, 0]} imageUrl={lettuceImg} label="Lettuce" scale={0.3} />
      <PlantDisplay position={[-1.5, -0.1, 1.3]} imageUrl={carrotImg} label="Carrots" scale={0.35} />
      <PlantDisplay position={[1.5, -0.1, 1.3]} imageUrl={strawberryImg} label="Strawberries" scale={0.35} />

      {/* Sensors with live data */}
      <SensorDevice position={[-2.5, 0.2, -1]} value={`${temp.toFixed(1)}°C`} label="Temperature" />
      <SensorDevice position={[2.5, 0.2, -1]} value={`${humidity}%`} label="Humidity" />
      <SensorDevice position={[0, 0.2, -1.8]} value={`${moisture}%`} label="Moisture" />
      <SensorDevice position={[0, 0.2, 2]} value={`${light} lux`} label="Light" />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={12}
        maxPolarAngle={Math.PI / 2.1}
        autoRotate
        autoRotateSpeed={0.3}
      />
      
      <Environment preset="sunset" />
    </>
  );
}

// Loading component
function LoadingView() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading 3D Greenhouse...</p>
      </div>
    </div>
  );
}

// Main export
interface RealisticGreenhouseSceneProps {
  sensorData?: {
    temperature: number;
    humidity: number;
    moisture: number;
    lightLevel: number;
  };
}

export default function RealisticGreenhouseScene({ sensorData }: RealisticGreenhouseSceneProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative rounded-xl overflow-hidden">
      <Suspense fallback={<LoadingView />}>
        <Canvas
          camera={{ position: [5, 4, 5], fov: 45 }}
          shadows
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'linear-gradient(180deg, hsl(142 40% 15%), hsl(142 30% 8%))' }}
        >
          <SceneContent sensorData={sensorData} />
        </Canvas>
      </Suspense>
      
      {/* Live indicator */}
      <div className="absolute top-4 left-4 glass-panel px-3 py-2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-medium">Live Sensor Feed</span>
      </div>
    </div>
  );
}
