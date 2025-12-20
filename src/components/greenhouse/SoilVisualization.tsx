import { motion } from 'framer-motion';
import soilLayersImage from '@/assets/soil-layers.jpg';
import { Droplets, Thermometer, Zap, Leaf } from 'lucide-react';

interface SoilLayer {
  name: string;
  depth: string;
  color: string;
  moisture: number;
  nutrients: number;
}

const soilLayers: SoilLayer[] = [
  { name: 'Topsoil', depth: '0-15cm', color: 'from-amber-800 to-amber-900', moisture: 72, nutrients: 85 },
  { name: 'Subsoil', depth: '15-45cm', color: 'from-amber-900 to-stone-800', moisture: 58, nutrients: 65 },
  { name: 'Parent Material', depth: '45-90cm', color: 'from-stone-800 to-stone-900', moisture: 45, nutrients: 40 },
];

const soilMetrics = [
  { label: 'pH Level', value: '6.5', optimal: '6.0-7.0', icon: Zap, status: 'optimal' },
  { label: 'Moisture', value: '68%', optimal: '60-80%', icon: Droplets, status: 'optimal' },
  { label: 'Temperature', value: '22°C', optimal: '18-25°C', icon: Thermometer, status: 'optimal' },
  { label: 'Organic Matter', value: '4.2%', optimal: '>3%', icon: Leaf, status: 'optimal' },
];

export default function SoilVisualization() {
  return (
    <div className="glass-panel p-6">
      <h3 className="text-xl font-display font-semibold text-foreground mb-6">Soil Analysis</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3D Soil Visualization */}
        <div className="relative">
          <div className="relative rounded-2xl overflow-hidden aspect-video perspective-1000">
            <img
              src={soilLayersImage}
              alt="Soil cross-section"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
            
            {/* Layer labels */}
            <div className="absolute right-4 top-1/4 space-y-8">
              {soilLayers.map((layer, index) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="flex items-center gap-2 bg-card/80 backdrop-blur-sm px-3 py-1.5 rounded-lg"
                >
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-b ${layer.color}`} />
                  <div>
                    <p className="text-xs font-medium text-foreground">{layer.name}</p>
                    <p className="text-[10px] text-muted-foreground">{layer.depth}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Layer moisture/nutrients bars */}
          <div className="mt-4 space-y-3">
            {soilLayers.map((layer, index) => (
              <motion.div
                key={layer.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{layer.name} Moisture</span>
                    <span className="text-foreground font-medium">{layer.moisture}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${layer.moisture}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Nutrients</span>
                    <span className="text-foreground font-medium">{layer.nutrients}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${layer.nutrients}%` }}
                      transition={{ duration: 1, delay: 0.7 }}
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Soil Metrics */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-muted-foreground">Current Readings</h4>
          
          <div className="grid grid-cols-2 gap-4">
            {soilMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl bg-muted/50 border border-border"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">{metric.label}</span>
                  </div>
                  <p className="text-2xl font-display font-bold text-foreground">{metric.value}</p>
                  <p className="text-xs text-success mt-1">Optimal: {metric.optimal}</p>
                </motion.div>
              );
            })}
          </div>

          {/* NPK Levels */}
          <div className="p-4 rounded-xl bg-muted/50 border border-border mt-4">
            <h4 className="text-sm font-medium text-foreground mb-4">NPK Levels</h4>
            <div className="space-y-3">
              {[
                { label: 'Nitrogen (N)', value: 45, color: 'from-blue-500 to-blue-600' },
                { label: 'Phosphorus (P)', value: 62, color: 'from-orange-500 to-orange-600' },
                { label: 'Potassium (K)', value: 78, color: 'from-purple-500 to-purple-600' },
              ].map((npk) => (
                <div key={npk.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">{npk.label}</span>
                    <span className="text-foreground font-medium">{npk.value} ppm</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${npk.value}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full bg-gradient-to-r ${npk.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
