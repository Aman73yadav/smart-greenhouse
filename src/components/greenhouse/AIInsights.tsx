import { motion } from 'framer-motion';
import { Brain, Lightbulb, TrendingUp, Droplets, Thermometer, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Insight {
  id: string;
  type: 'optimization' | 'prediction' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

const insights: Insight[] = [
  {
    id: '1',
    type: 'optimization',
    title: 'Reduce Evening Irrigation',
    description: 'AI analysis suggests reducing evening irrigation by 15% based on soil moisture retention patterns. Expected water savings: 120L/week.',
    impact: 'high',
    icon: <Droplets className="w-5 h-5" />,
  },
  {
    id: '2',
    type: 'prediction',
    title: 'Optimal Harvest Window',
    description: 'Tomatoes in Zone B are predicted to reach optimal ripeness in 4-5 days. Current growth rate: 2.3% daily.',
    impact: 'high',
    icon: <Leaf className="w-5 h-5" />,
  },
  {
    id: '3',
    type: 'recommendation',
    title: 'Temperature Adjustment',
    description: 'Lower nighttime temperature by 2°C to improve fruit setting. This matches optimal growing conditions for current crop stage.',
    impact: 'medium',
    icon: <Thermometer className="w-5 h-5" />,
  },
  {
    id: '4',
    type: 'optimization',
    title: 'Light Schedule Optimization',
    description: 'Extend morning grow light hours by 30 minutes and reduce afternoon hours. Energy savings potential: 8%.',
    impact: 'medium',
    icon: <Lightbulb className="w-5 h-5" />,
  },
];

const impactColors = {
  high: 'bg-success/20 text-success border-success/30',
  medium: 'bg-warning/20 text-warning border-warning/30',
  low: 'bg-info/20 text-info border-info/30',
};

const typeLabels = {
  optimization: 'Optimization',
  prediction: 'Prediction',
  recommendation: 'Recommendation',
};

export default function AIInsights() {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
          <Brain className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-display font-semibold text-foreground">AI Insights</h3>
          <p className="text-sm text-muted-foreground">Smart recommendations powered by ML</p>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={insight.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/30 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                {insight.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {typeLabels[insight.type]}
                  </span>
                  <span className={cn(
                    "text-xs font-medium px-2 py-0.5 rounded-full border",
                    impactColors[insight.impact]
                  )}>
                    {insight.impact} impact
                  </span>
                </div>
                
                <h4 className="font-medium text-foreground mb-1">{insight.title}</h4>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium flex items-center justify-center gap-2"
      >
        <TrendingUp className="w-4 h-4" />
        Generate Full Analysis Report
      </motion.button>
    </div>
  );
}
