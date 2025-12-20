import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SensorCardProps {
  title: string;
  value: number;
  unit: string;
  icon: LucideIcon;
  type: 'temperature' | 'humidity' | 'moisture' | 'light' | 'co2';
  trend?: 'up' | 'down' | 'stable';
  optimal?: { min: number; max: number };
  className?: string;
}

const typeStyles = {
  temperature: 'sensor-card',
  humidity: 'sensor-card humidity',
  moisture: 'sensor-card moisture',
  light: 'sensor-card light',
  co2: 'sensor-card co2',
};

const typeColors = {
  temperature: 'from-red-500 to-orange-500',
  humidity: 'from-blue-500 to-cyan-500',
  moisture: 'from-green-500 to-emerald-500',
  light: 'from-yellow-500 to-amber-500',
  co2: 'from-purple-500 to-pink-500',
};

export default function SensorCard({
  title,
  value,
  unit,
  icon: Icon,
  type,
  trend,
  optimal,
  className,
}: SensorCardProps) {
  const isOptimal = optimal ? value >= optimal.min && value <= optimal.max : true;
  const percentage = optimal 
    ? Math.min(100, Math.max(0, ((value - optimal.min) / (optimal.max - optimal.min)) * 100))
    : 50;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className={cn(typeStyles[type], className)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br",
          typeColors[type]
        )}>
          <Icon className="w-6 h-6 text-primary-foreground" />
        </div>
        
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            trend === 'up' && "text-success bg-success/10",
            trend === 'down' && "text-destructive bg-destructive/10",
            trend === 'stable' && "text-muted-foreground bg-muted"
          )}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trend === 'stable' && '→'}
            <span className="text-xs">{trend}</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-4xl font-display font-bold text-foreground">{value}</span>
          <span className="text-lg text-muted-foreground">{unit}</span>
        </div>
      </div>

      {optimal && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{optimal.min}{unit}</span>
            <span className={cn(
              "font-medium",
              isOptimal ? "text-success" : "text-warning"
            )}>
              {isOptimal ? 'Optimal' : 'Adjust'}
            </span>
            <span>{optimal.max}{unit}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={cn(
                "h-full rounded-full bg-gradient-to-r",
                typeColors[type]
              )}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
