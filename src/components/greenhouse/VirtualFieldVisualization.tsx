import React, { Suspense, useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, useTexture, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Leaf, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';

import tomatoImg from '@/assets/tomato.jpg';
import lettuceImg from '@/assets/lettuce.jpg';
import strawberryImg from '@/assets/strawberry.jpg';
import carrotImg from '@/assets/carrot.jpg';
import pepperImg from '@/assets/pepper.jpg';
import cucumberImg from '@/assets/cucumber.jpg';
import soilImg from '@/assets/soil-layers.jpg';

// Growth stages configuration
const GROWTH_STAGES = [
  { name: 'Seed', week: 0, scale: 0.05, stemHeight: 0.02, leafCount: 0, color: '#8B4513' },
  { name: 'Germination', week: 2, scale: 0.1, stemHeight: 0.05, leafCount: 2, color: '#90EE90' },
  { name: 'Seedling', week: 4, scale: 0.15, stemHeight: 0.1, leafCount: 4, color: '#32CD32' },
  { name: 'Vegetative', week: 6, scale: 0.25, stemHeight: 0.2, leafCount: 6, color: '#228B22' },
  { name: 'Flowering', week: 8, scale: 0.35, stemHeight: 0.3, leafCount: 8, color: '#228B22' },
  { name: 'Fruiting', week: 10, scale: 0.45, stemHeight: 0.35, leafCount: 8, color: '#228B22' },
  { name: 'Ripening', week: 12, scale: 0.5, stemHeight: 0.4, leafCount: 8, color: '#228B22' },
  { name: 'Harvest', week: 16, scale: 0.55, stemHeight: 0.45, leafCount: 10, color: '#228B22' },
];

interface GrowingPlantProps {
  position: [number, number, number];
  imageUrl: string;
  label: string;
  growthProgress: number; // 0-1 representing 0-16 weeks
  plantType: string;
}

function GrowingPlant({ position, imageUrl, label, growthProgress, plantType }: GrowingPlantProps) {
  const texture = useTexture(imageUrl);
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Calculate current growth stage
  const currentWeek = growthProgress * 16;
  const stageIndex = GROWTH_STAGES.findIndex(stage => stage.week > currentWeek) - 1;
  const stage = GROWTH_STAGES[Math.max(0, Math.min(stageIndex, GROWTH_STAGES.length - 1))];
  
  // Interpolate growth values
  const scale = 0.05 + (growthProgress * 0.5);
  const stemHeight = 0.02 + (growthProgress * 0.43);
  const leafCount = Math.floor(growthProgress * 10);
  const fruitOpacity = growthProgress > 0.6 ? (growthProgress - 0.6) * 2.5 : 0;
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (groupRef.current) {
      // Gentle sway animation
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Soil mound */}
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.08, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3d2914" roughness={1} />
      </mesh>
      
      {/* Stem - grows with progress */}
      {growthProgress > 0.05 && (
        <mesh position={[0, stemHeight / 2, 0]}>
          <cylinderGeometry args={[0.01 + growthProgress * 0.02, 0.015 + growthProgress * 0.02, stemHeight, 8]} />
          <meshStandardMaterial color={stage.color} roughness={0.8} />
        </mesh>
      )}
      
      {/* Leaves - appear progressively */}
      {Array.from({ length: leafCount }).map((_, i) => {
        const angle = (i / leafCount) * Math.PI * 2;
        const leafHeight = stemHeight * (0.3 + (i / leafCount) * 0.5);
        const leafSize = 0.05 + growthProgress * 0.1;
        return (
          <mesh 
            key={i} 
            position={[
              Math.cos(angle) * 0.03,
              leafHeight,
              Math.sin(angle) * 0.03
            ]}
            rotation={[0.3, angle, 0.3]}
          >
            <planeGeometry args={[leafSize, leafSize * 0.6]} />
            <meshStandardMaterial color="#32CD32" side={THREE.DoubleSide} transparent opacity={0.9} />
          </mesh>
        );
      })}
      
      {/* Fruit/vegetable image - appears after flowering */}
      {fruitOpacity > 0 && (
        <mesh ref={meshRef} position={[0, stemHeight + scale / 2, 0]}>
          <planeGeometry args={[scale, scale]} />
          <meshStandardMaterial 
            map={texture} 
            transparent 
            opacity={fruitOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Stage label */}
      {growthProgress > 0 && (
        <Html position={[0, stemHeight + scale + 0.15, 0]} center>
          <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap border border-border shadow-lg">
            <div className="text-primary font-semibold">{label}</div>
            <div className="text-muted-foreground">{stage.name} • Week {Math.floor(currentWeek)}</div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Field soil with grid pattern
function FieldSoil() {
  const soilTexture = useTexture(soilImg);
  
  soilTexture.wrapS = soilTexture.wrapT = THREE.RepeatWrapping;
  soilTexture.repeat.set(4, 4);

  return (
    <group>
      {/* Main field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[8, 6]} />
        <meshStandardMaterial map={soilTexture} roughness={1} />
      </mesh>
      
      {/* Raised bed borders */}
      {[-1.5, 1.5].map((x, i) => (
        <mesh key={i} position={[x, -0.05, 0]}>
          <boxGeometry args={[2.5, 0.15, 4]} />
          <meshStandardMaterial color="#5d4037" roughness={0.9} />
        </mesh>
      ))}
      
      {/* Irrigation channels */}
      {[-0.5, 0.5].map((z, i) => (
        <mesh key={i} position={[0, -0.08, z * 2]}>
          <boxGeometry args={[7, 0.02, 0.1]} />
          <meshStandardMaterial color="#1565c0" roughness={0.5} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Weather effects based on sensor data
function WeatherEffects({ temperature, humidity }: { temperature: number; humidity: number }) {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, []);

  useFrame(() => {
    if (particlesRef.current && humidity > 70) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= 0.015;
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 3;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // Rain when humidity is high
  if (humidity > 70) {
    return (
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#60a5fa" transparent opacity={0.4} sizeAttenuation />
      </points>
    );
  }

  // Heat haze when temperature is high
  if (temperature > 30) {
    return (
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 6]} />
        <meshBasicMaterial color="#ff6b35" transparent opacity={0.05} />
      </mesh>
    );
  }

  return null;
}

// Sun/light indicator
function SunLight({ intensity }: { intensity: number }) {
  const sunRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (sunRef.current) {
      sunRef.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  const sunPosition: [number, number, number] = [4, 4, -3];
  const sunColor = intensity > 800 ? '#ffeb3b' : intensity > 400 ? '#ffc107' : '#ff9800';

  return (
    <mesh ref={sunRef} position={sunPosition}>
      <sphereGeometry args={[0.5, 16, 16]} />
      <meshBasicMaterial color={sunColor} />
    </mesh>
  );
}

interface FieldSceneProps {
  growthProgress: number;
  sensorData: {
    temperature: number;
    humidity: number;
    moisture: number;
    lightLevel: number;
  };
}

function FieldScene({ growthProgress, sensorData }: FieldSceneProps) {
  const plants = [
    { position: [-2, 0, -1] as [number, number, number], image: tomatoImg, label: 'Tomatoes', type: 'tomato' },
    { position: [-1, 0, -1] as [number, number, number], image: pepperImg, label: 'Peppers', type: 'pepper' },
    { position: [0, 0, -1] as [number, number, number], image: cucumberImg, label: 'Cucumbers', type: 'cucumber' },
    { position: [1, 0, -1] as [number, number, number], image: lettuceImg, label: 'Lettuce', type: 'lettuce' },
    { position: [2, 0, -1] as [number, number, number], image: carrotImg, label: 'Carrots', type: 'carrot' },
    { position: [-2, 0, 1] as [number, number, number], image: strawberryImg, label: 'Strawberries', type: 'strawberry' },
    { position: [-1, 0, 1] as [number, number, number], image: tomatoImg, label: 'Tomatoes', type: 'tomato' },
    { position: [0, 0, 1] as [number, number, number], image: lettuceImg, label: 'Lettuce', type: 'lettuce' },
    { position: [1, 0, 1] as [number, number, number], image: pepperImg, label: 'Peppers', type: 'pepper' },
    { position: [2, 0, 1] as [number, number, number], image: cucumberImg, label: 'Cucumbers', type: 'cucumber' },
  ];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.4} color="#ffcc77" />
      
      <FieldSoil />
      <WeatherEffects temperature={sensorData.temperature} humidity={sensorData.humidity} />
      <SunLight intensity={sensorData.lightLevel} />
      
      {plants.map((plant, i) => (
        <GrowingPlant
          key={i}
          position={plant.position}
          imageUrl={plant.image}
          label={plant.label}
          growthProgress={growthProgress}
          plantType={plant.type}
        />
      ))}
      
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2.2}
      />
      
      <Environment preset="sunset" />
    </>
  );
}

interface VirtualFieldVisualizationProps {
  sensorData: {
    temperature: number;
    humidity: number;
    moisture: number;
    lightLevel: number;
  };
}

export default function VirtualFieldVisualization({ sensorData }: VirtualFieldVisualizationProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [growthProgress, setGrowthProgress] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  
  // 3 seconds = 1 week, 16 weeks total = 48 seconds
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setGrowthProgress(prev => {
        const newProgress = prev + (1 / 16 / 10); // Update every 300ms, 10 updates per week
        if (newProgress >= 1) {
          return 0; // Loop back
        }
        return newProgress;
      });
    }, 300);
    
    return () => clearInterval(interval);
  }, [isPlaying]);
  
  useEffect(() => {
    setCurrentWeek(Math.floor(growthProgress * 16));
  }, [growthProgress]);
  
  const currentStage = GROWTH_STAGES.find((stage, index) => {
    const nextStage = GROWTH_STAGES[index + 1];
    return currentWeek >= stage.week && (!nextStage || currentWeek < nextStage.week);
  }) || GROWTH_STAGES[0];
  
  const resetSimulation = () => {
    setGrowthProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="glass-panel overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-1">
              3D Virtual Field Visualization
            </h2>
            <p className="text-muted-foreground text-sm">
              Interactive 3D field showing real-time environmental effects • Drag to rotate, scroll to zoom
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={resetSimulation}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </div>
        
        {/* Growth Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-primary" />
              <span className="font-medium">Growth Simulation</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="w-4 h-4" />
              <span>3 seconds = 1 week</span>
            </div>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-success rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${growthProgress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            {GROWTH_STAGES.map((stage, i) => (
              <span 
                key={i} 
                className={currentWeek >= stage.week ? 'text-primary font-medium' : ''}
              >
                {stage.name}
              </span>
            ))}
          </div>
        </div>
        
        {/* Current Stage Info */}
        <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
            <span className="font-medium">Week {currentWeek}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-sm">
            <span className="text-muted-foreground">Stage: </span>
            <span className="text-primary font-medium">{currentStage.name}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="text-sm">
            <span className="text-muted-foreground">Progress: </span>
            <span className="font-medium">{Math.round(growthProgress * 100)}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-[400px] relative">
        <Suspense fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-card/80">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <Canvas
            camera={{ position: [6, 5, 6], fov: 50 }}
            shadows
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'linear-gradient(180deg, hsl(200 60% 60%), hsl(200 40% 30%))' }}
          >
            <FieldScene growthProgress={growthProgress} sensorData={sensorData} />
          </Canvas>
        </Suspense>
        
        {/* Interaction hint */}
        <div className="absolute bottom-4 left-4 glass-panel px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">🖱️ Drag to rotate • Scroll to zoom</span>
        </div>
      </div>
    </div>
  );
}
