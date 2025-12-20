import { motion } from 'framer-motion';
import { Calendar, Droplets, Sun, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlantCardProps {
  name: string;
  image: string;
  variety: string;
  planted: string;
  growthStage: number;
  waterNeeds: 'low' | 'medium' | 'high';
  lightNeeds: 'low' | 'medium' | 'high';
  daysToHarvest: number;
  health: number;
}

const needsColors = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-red-400',
};

export default function PlantCard({
  name,
  image,
  variety,
  planted,
  growthStage,
  waterNeeds,
  lightNeeds,
  daysToHarvest,
  health,
}: PlantCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="plant-card group"
    >
      <div className="relative h-48 overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
        
        {/* Health indicator */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-card/80 backdrop-blur-sm">
          <div className={cn(
            "w-2 h-2 rounded-full",
            health >= 80 ? "bg-green-500" : health >= 50 ? "bg-yellow-500" : "bg-red-500"
          )} />
          <span className="text-xs font-medium text-foreground">{health}%</span>
        </div>
        
        {/* Growth stage */}
        <div className="absolute bottom-3 left-3 right-3">
          <div className="flex justify-between text-xs text-foreground/80 mb-1">
            <span>Growth</span>
            <span>{growthStage}%</span>
          </div>
          <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${growthStage}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3">
          <h3 className="text-lg font-display font-semibold text-foreground">{name}</h3>
          <p className="text-sm text-muted-foreground">{variety}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{planted}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-foreground">{daysToHarvest}d to harvest</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <Droplets className={cn("w-4 h-4", needsColors[waterNeeds])} />
            <span className="text-xs text-muted-foreground capitalize">{waterNeeds}</span>
          </div>
          <div className="flex items-center gap-1">
            <Sun className={cn("w-4 h-4", needsColors[lightNeeds])} />
            <span className="text-xs text-muted-foreground capitalize">{lightNeeds}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
