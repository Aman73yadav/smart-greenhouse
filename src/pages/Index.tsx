import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Droplets, Sprout, Sun, Wind } from 'lucide-react';

import Navigation from '@/components/greenhouse/Navigation';
import HeroSection from '@/components/greenhouse/HeroSection';
import SensorCard from '@/components/greenhouse/SensorCard';
import SensorChart from '@/components/greenhouse/SensorChart';
import ControlPanel from '@/components/greenhouse/ControlPanel';
import PlantCard from '@/components/greenhouse/PlantCard';
import AlertsPanel from '@/components/greenhouse/AlertsPanel';
import AIInsights from '@/components/greenhouse/AIInsights';
import SoilVisualization from '@/components/greenhouse/SoilVisualization';
import DataExport from '@/components/greenhouse/DataExport';
import AnalyticsDashboard from '@/components/greenhouse/AnalyticsDashboard';
import GreenhouseScene from '@/components/greenhouse/GreenhouseScene';
import SchedulingSystem from '@/components/greenhouse/SchedulingSystem';
import ScheduleCalendar from '@/components/greenhouse/ScheduleCalendar';

import tomatoImg from '@/assets/tomato.jpg';
import lettuceImg from '@/assets/lettuce.jpg';
import carrotImg from '@/assets/carrot.jpg';
import strawberryImg from '@/assets/strawberry.jpg';
import cucumberImg from '@/assets/cucumber.jpg';
import pepperImg from '@/assets/pepper.jpg';

const sensorData = [
  { title: 'Temperature', value: 24.5, unit: '°C', icon: Thermometer, type: 'temperature' as const, trend: 'stable' as const, optimal: { min: 20, max: 30 } },
  { title: 'Humidity', value: 68, unit: '%', icon: Droplets, type: 'humidity' as const, trend: 'up' as const, optimal: { min: 50, max: 80 } },
  { title: 'Soil Moisture', value: 72, unit: '%', icon: Sprout, type: 'moisture' as const, trend: 'down' as const, optimal: { min: 60, max: 85 } },
  { title: 'Light Intensity', value: 850, unit: 'lux', icon: Sun, type: 'light' as const, trend: 'stable' as const, optimal: { min: 400, max: 1200 } },
  { title: 'CO₂ Level', value: 420, unit: 'ppm', icon: Wind, type: 'co2' as const, trend: 'up' as const, optimal: { min: 300, max: 600 } },
];

const plants = [
  { name: 'Cherry Tomatoes', image: tomatoImg, variety: 'Sweet Million', planted: 'Nov 15', growthStage: 75, waterNeeds: 'medium' as const, lightNeeds: 'high' as const, daysToHarvest: 12, health: 92 },
  { name: 'Butter Lettuce', image: lettuceImg, variety: 'Bibb', planted: 'Dec 1', growthStage: 45, waterNeeds: 'high' as const, lightNeeds: 'medium' as const, daysToHarvest: 28, health: 88 },
  { name: 'Rainbow Carrots', image: carrotImg, variety: 'Kaleidoscope', planted: 'Oct 20', growthStage: 85, waterNeeds: 'medium' as const, lightNeeds: 'medium' as const, daysToHarvest: 5, health: 95 },
  { name: 'Strawberries', image: strawberryImg, variety: 'Alpine', planted: 'Nov 1', growthStage: 60, waterNeeds: 'high' as const, lightNeeds: 'high' as const, daysToHarvest: 18, health: 78 },
  { name: 'Cucumbers', image: cucumberImg, variety: 'Persian', planted: 'Nov 10', growthStage: 55, waterNeeds: 'high' as const, lightNeeds: 'high' as const, daysToHarvest: 22, health: 85 },
  { name: 'Bell Peppers', image: pepperImg, variety: 'California Wonder', planted: 'Oct 25', growthStage: 70, waterNeeds: 'medium' as const, lightNeeds: 'high' as const, daysToHarvest: 14, health: 90 },
];

export default function Index() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'plants':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-display font-bold text-foreground mb-2">Plant Management</h2>
              <p className="text-muted-foreground">Monitor and manage your greenhouse crops</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plants.map((plant, index) => (
                <motion.div
                  key={plant.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <PlantCard {...plant} />
                </motion.div>
              ))}
            </div>
          </div>
        );

      case 'schedules':
        return <SchedulingSystem />;

      case 'calendar':
        return (
          <ScheduleCalendar 
            schedules={[
              { id: '1', name: 'Morning Irrigation', zone_id: 'zone-a', type: 'irrigation', start_time: '06:00', end_time: '06:30', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, intensity: 75 },
              { id: '2', name: 'Grow Lights', zone_id: 'zone-b', type: 'lighting', start_time: '05:00', end_time: '20:00', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], enabled: true, intensity: 80 },
              { id: '3', name: 'Evening Watering', zone_id: 'zone-c', type: 'irrigation', start_time: '18:00', end_time: '18:20', days: ['Mon', 'Wed', 'Fri'], enabled: true, intensity: 50 },
            ]}
            zones={[
              { id: 'zone-a', name: 'Zone A - Tomatoes', color: 'bg-red-500' },
              { id: 'zone-b', name: 'Zone B - Leafy Greens', color: 'bg-green-500' },
              { id: 'zone-c', name: 'Zone C - Root Vegetables', color: 'bg-orange-500' },
            ]}
          />
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            <AnalyticsDashboard />
            <SoilVisualization />
          </div>
        );

      case 'controls':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ControlPanel />
            <AIInsights />
          </div>
        );

      case 'alerts':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <AlertsPanel />
            <AIInsights />
          </div>
        );

      case 'export':
        return (
          <div className="max-w-2xl mx-auto">
            <DataExport />
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            {/* 3D Greenhouse Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel overflow-hidden"
            >
              <div className="p-6 pb-0">
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                  3D Greenhouse View
                </h2>
                <p className="text-muted-foreground">
                  Interactive visualization of your smart greenhouse environment
                </p>
              </div>
              <div className="h-[400px]">
                <GreenhouseScene />
              </div>
            </motion.div>

            {/* Sensor Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {sensorData.map((sensor, index) => (
                <motion.div
                  key={sensor.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <SensorCard {...sensor} />
                </motion.div>
              ))}
            </div>

            {/* Charts and Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <SensorChart className="lg:col-span-2" />
              <AlertsPanel />
            </div>

            {/* Plants Preview */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-display font-bold text-foreground">Active Crops</h2>
                  <p className="text-muted-foreground">Your greenhouse plants at a glance</p>
                </div>
                <button
                  onClick={() => setActiveSection('plants')}
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {plants.slice(0, 3).map((plant, index) => (
                  <motion.div
                    key={plant.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                  >
                    <PlantCard {...plant} />
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Soil and AI Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SoilVisualization />
              <AIInsights />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeroSection onScrollToContent={scrollToContent} />
      
      <div ref={contentRef} className="pt-4">
        <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
        
        <main className="max-w-7xl mx-auto px-4 pt-24 md:pt-28 pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
