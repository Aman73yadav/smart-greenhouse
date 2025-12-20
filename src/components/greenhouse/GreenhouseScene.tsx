import { useState } from 'react';
import { motion } from 'framer-motion';
import greenhouseHero from '@/assets/greenhouse-hero.jpg';
import { Thermometer, Droplets, Sprout, Cpu } from 'lucide-react';

function StaticGreenhouseView() {
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

      {/* Interactive hint */}
      <div className="absolute top-4 right-4 glass-panel p-2 px-3 flex items-center gap-2">
        <Cpu className="w-4 h-4 text-primary" />
        <span className="text-xs text-muted-foreground">IoT Connected</span>
      </div>
    </div>
  );
}

export default function GreenhouseScene() {
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <StaticGreenhouseView />
    </div>
  );
}
