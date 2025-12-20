import React, { Suspense, useMemo, useState, Component, ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Float, Text, Html } from '@react-three/drei';
import { motion } from 'framer-motion';
import greenhouseHero from '@/assets/greenhouse-hero.jpg';
import { Thermometer, Droplets, Sprout, Cpu, AlertTriangle, RefreshCw } from 'lucide-react';
import * as THREE from 'three';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Scene Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Glass Panel Component
function GlassPanel({ position, size }: { position: [number, number, number]; size: [number, number] }) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
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

// Plant Bed Component
function PlantBed({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.5, 0.3, 0.8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      {/* Plants */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <Float key={i} speed={2} rotationIntensity={0.1} floatIntensity={0.3}>
          <mesh position={[x, 0.35, 0]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial color={color} roughness={0.6} />
          </mesh>
        </Float>
      ))}
    </group>
  );
}

// Sensor Component
function Sensor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.15, 8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

// Mist Particles
function MistParticles() {
  const count = 100;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 1] = Math.random() * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;
    }
    return pos;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#88ccff"
        transparent
        opacity={0.4}
        sizeAttenuation
      />
    </points>
  );
}

// Greenhouse Structure
function GreenhouseStructure() {
  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color="#2d5016" roughness={0.9} />
      </mesh>
      
      {/* Glass walls */}
      <GlassPanel position={[-2.5, 1, 0]} size={[0.1, 3]} />
      <GlassPanel position={[2.5, 1, 0]} size={[0.1, 3]} />
      <GlassPanel position={[0, 1, -2]} size={[5, 3]} />
      
      {/* Plant beds */}
      <PlantBed position={[-1, -0.2, 0]} color="#ef4444" />
      <PlantBed position={[1, -0.2, 0]} color="#22c55e" />
      <PlantBed position={[-1, -0.2, 1.2]} color="#f97316" />
      <PlantBed position={[1, -0.2, 1.2]} color="#a855f7" />
      
      {/* Sensors */}
      <Sensor position={[-1.5, 0.5, -1.5]} />
      <Sensor position={[1.5, 0.5, -1.5]} />
      <Sensor position={[0, 0.5, 1.5]} />
      
      {/* Mist effect */}
      <MistParticles />
    </group>
  );
}

// 3D Scene Content
function SceneContent() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <pointLight position={[0, 3, 0]} intensity={0.5} color="#22c55e" />
      
      <GreenhouseStructure />
      
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3}
        maxDistance={10}
        maxPolarAngle={Math.PI / 2}
      />
      <Environment preset="sunset" />
    </>
  );
}

// Loading Component
function LoadingView() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-card/50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Loading 3D Scene...</p>
      </div>
    </div>
  );
}

// Static Fallback View
function StaticGreenhouseView({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <img
        src={greenhouseHero}
        alt="Smart Greenhouse 3D View"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
      
      {/* Animated sensor indicators */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="absolute top-4 left-4 glass-panel p-3 flex items-center gap-2"
      >
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <span className="text-xs font-medium text-foreground">Sensors Active</span>
      </motion.div>

      {/* Sensor overlays */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap"
      >
        {[
          { icon: Thermometer, value: '24°C', label: 'Temp', color: 'from-red-500 to-orange-500' },
          { icon: Droplets, value: '68%', label: 'Humidity', color: 'from-blue-500 to-cyan-500' },
          { icon: Sprout, value: '72%', label: 'Moisture', color: 'from-green-500 to-emerald-500' },
        ].map((sensor, i) => (
          <motion.div
            key={sensor.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="glass-panel p-2 flex items-center gap-2"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${sensor.color}`}>
              <sensor.icon className="w-3 h-3 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{sensor.value}</p>
              <p className="text-[10px] text-muted-foreground">{sensor.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Interactive hint / Retry button */}
      <div className="absolute top-4 right-4 glass-panel p-2 px-3 flex items-center gap-2">
        {onRetry ? (
          <button onClick={onRetry} className="flex items-center gap-2 text-primary hover:text-primary/80">
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs">Retry 3D</span>
          </button>
        ) : (
          <>
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">IoT Connected</span>
          </>
        )}
      </div>
    </div>
  );
}

// Main Component
export default function GreenhouseScene() {
  const [use3D, setUse3D] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleRetry = () => {
    setHasError(false);
    setUse3D(true);
  };

  // Fallback component when 3D fails
  const fallbackComponent = (
    <StaticGreenhouseView onRetry={handleRetry} />
  );

  if (!use3D || hasError) {
    return (
      <div className="w-full h-full min-h-[400px] relative">
        <StaticGreenhouseView onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ThreeErrorBoundary fallback={fallbackComponent}>
        <Suspense fallback={<LoadingView />}>
          <Canvas
            camera={{ position: [4, 3, 4], fov: 50 }}
            onError={() => setHasError(true)}
            gl={{ antialias: true, alpha: true }}
            style={{ background: 'linear-gradient(135deg, hsl(var(--card)), hsl(var(--background)))' }}
          >
            <SceneContent />
          </Canvas>
        </Suspense>
      </ThreeErrorBoundary>
      
      {/* Toggle button */}
      <button
        onClick={() => setUse3D(false)}
        className="absolute top-4 right-4 glass-panel p-2 px-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Cpu className="w-4 h-4" />
        Switch to Static
      </button>
    </div>
  );
}
