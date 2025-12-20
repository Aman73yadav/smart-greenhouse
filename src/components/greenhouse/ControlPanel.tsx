import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Thermometer, 
  Droplets, 
  Fan, 
  Lightbulb, 
  Power,
  Sprout,
  Waves
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface ControlItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (value: number) => void;
  color: string;
}

function ControlItem({
  icon,
  label,
  value,
  unit,
  min,
  max,
  enabled,
  onToggle,
  onChange,
  color,
}: ControlItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "glass-panel p-4 transition-all duration-300",
        enabled ? "border-primary/30" : "opacity-60"
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg transition-colors",
            enabled ? color : "bg-muted"
          )}>
            {icon}
          </div>
          <div>
            <h4 className="font-medium text-foreground">{label}</h4>
            <p className="text-sm text-muted-foreground">
              {enabled ? `${value}${unit}` : 'Off'}
            </p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
      
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-2"
        >
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}{unit}</span>
            <span className="font-medium text-foreground">{value}{unit}</span>
            <span>{max}{unit}</span>
          </div>
          <Slider
            value={[value]}
            min={min}
            max={max}
            step={1}
            onValueChange={(vals) => onChange(vals[0])}
            className="cursor-pointer"
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default function ControlPanel() {
  const [controls, setControls] = useState({
    temperature: { enabled: true, value: 24 },
    humidity: { enabled: true, value: 65 },
    ventilation: { enabled: true, value: 50 },
    lighting: { enabled: true, value: 80 },
    irrigation: { enabled: false, value: 30 },
    misting: { enabled: true, value: 45 },
  });

  const updateControl = (key: keyof typeof controls, updates: Partial<typeof controls.temperature>) => {
    setControls(prev => ({
      ...prev,
      [key]: { ...prev[key], ...updates }
    }));
  };

  const allEnabled = Object.values(controls).every(c => c.enabled);
  const toggleAll = () => {
    const newEnabled = !allEnabled;
    setControls(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        updated[key as keyof typeof updated].enabled = newEnabled;
      });
      return updated;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Control System</h2>
          <p className="text-sm text-muted-foreground">Manage greenhouse environment</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleAll}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
            allEnabled 
              ? "bg-primary text-primary-foreground shadow-glow" 
              : "bg-muted text-muted-foreground"
          )}
        >
          <Power className="w-4 h-4" />
          {allEnabled ? 'All On' : 'All Off'}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ControlItem
          icon={<Thermometer className="w-5 h-5 text-primary-foreground" />}
          label="Temperature"
          value={controls.temperature.value}
          unit="°C"
          min={15}
          max={35}
          enabled={controls.temperature.enabled}
          onToggle={(enabled) => updateControl('temperature', { enabled })}
          onChange={(value) => updateControl('temperature', { value })}
          color="bg-gradient-to-br from-red-500 to-orange-500"
        />

        <ControlItem
          icon={<Droplets className="w-5 h-5 text-primary-foreground" />}
          label="Humidity"
          value={controls.humidity.value}
          unit="%"
          min={30}
          max={90}
          enabled={controls.humidity.enabled}
          onToggle={(enabled) => updateControl('humidity', { enabled })}
          onChange={(value) => updateControl('humidity', { value })}
          color="bg-gradient-to-br from-blue-500 to-cyan-500"
        />

        <ControlItem
          icon={<Fan className="w-5 h-5 text-primary-foreground" />}
          label="Ventilation"
          value={controls.ventilation.value}
          unit="%"
          min={0}
          max={100}
          enabled={controls.ventilation.enabled}
          onToggle={(enabled) => updateControl('ventilation', { enabled })}
          onChange={(value) => updateControl('ventilation', { value })}
          color="bg-gradient-to-br from-gray-500 to-gray-600"
        />

        <ControlItem
          icon={<Lightbulb className="w-5 h-5 text-primary-foreground" />}
          label="Grow Lights"
          value={controls.lighting.value}
          unit="%"
          min={0}
          max={100}
          enabled={controls.lighting.enabled}
          onToggle={(enabled) => updateControl('lighting', { enabled })}
          onChange={(value) => updateControl('lighting', { value })}
          color="bg-gradient-to-br from-yellow-500 to-amber-500"
        />

        <ControlItem
          icon={<Sprout className="w-5 h-5 text-primary-foreground" />}
          label="Irrigation"
          value={controls.irrigation.value}
          unit="%"
          min={0}
          max={100}
          enabled={controls.irrigation.enabled}
          onToggle={(enabled) => updateControl('irrigation', { enabled })}
          onChange={(value) => updateControl('irrigation', { value })}
          color="bg-gradient-to-br from-green-500 to-emerald-500"
        />

        <ControlItem
          icon={<Waves className="w-5 h-5 text-primary-foreground" />}
          label="Misting System"
          value={controls.misting.value}
          unit="%"
          min={0}
          max={100}
          enabled={controls.misting.enabled}
          onToggle={(enabled) => updateControl('misting', { enabled })}
          onChange={(value) => updateControl('misting', { value })}
          color="bg-gradient-to-br from-teal-500 to-cyan-500"
        />
      </div>
    </div>
  );
}
