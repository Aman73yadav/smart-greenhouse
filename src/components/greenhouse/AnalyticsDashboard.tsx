import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Droplets, 
  Zap, 
  Leaf,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

const weeklyData = [
  { day: 'Mon', water: 45, energy: 32, growth: 2.3 },
  { day: 'Tue', water: 52, energy: 35, growth: 2.1 },
  { day: 'Wed', water: 38, energy: 28, growth: 2.5 },
  { day: 'Thu', water: 65, energy: 42, growth: 1.8 },
  { day: 'Fri', water: 48, energy: 31, growth: 2.4 },
  { day: 'Sat', water: 42, energy: 29, growth: 2.6 },
  { day: 'Sun', water: 35, energy: 25, growth: 2.8 },
];

const resourceDistribution = [
  { name: 'Irrigation', value: 35, color: '#3b82f6' },
  { name: 'Lighting', value: 28, color: '#f59e0b' },
  { name: 'Climate Control', value: 22, color: '#10b981' },
  { name: 'Ventilation', value: 15, color: '#8b5cf6' },
];

const stats = [
  {
    label: 'Water Usage',
    value: '325L',
    change: -12,
    icon: Droplets,
    color: 'text-info',
  },
  {
    label: 'Energy Consumed',
    value: '48 kWh',
    change: -8,
    icon: Zap,
    color: 'text-warning',
  },
  {
    label: 'Avg Growth Rate',
    value: '2.4%',
    change: 15,
    icon: Leaf,
    color: 'text-success',
  },
  {
    label: 'Yield Forecast',
    value: '156 kg',
    change: 22,
    icon: BarChart3,
    color: 'text-primary',
  },
];

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Weekly Analytics</h2>
          <p className="text-sm text-muted-foreground">Performance overview for the past 7 days</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
            Weekly
          </button>
          <button className="px-4 py-2 rounded-lg bg-muted text-muted-foreground text-sm font-medium hover:bg-muted/80">
            Monthly
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const isPositive = stat.change > 0;
          const TrendIcon = stat.label.includes('Usage') || stat.label.includes('Energy')
            ? (isPositive ? TrendingUp : TrendingDown)
            : (isPositive ? TrendingUp : TrendingDown);
          const trendColor = stat.label.includes('Usage') || stat.label.includes('Energy')
            ? (isPositive ? 'text-destructive' : 'text-success')
            : (isPositive ? 'text-success' : 'text-destructive');

          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className={cn("w-5 h-5", stat.color)} />
                <div className={cn("flex items-center gap-1 text-sm", trendColor)}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{Math.abs(stat.change)}%</span>
                </div>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Usage Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Daily Resource Usage
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem',
                  }}
                />
                <Bar dataKey="water" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Water (L)" />
                <Bar dataKey="energy" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Energy (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Resource Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel p-6"
        >
          <h3 className="text-lg font-display font-semibold text-foreground mb-4">
            Resource Distribution
          </h3>
          <div className="flex items-center gap-6">
            <div className="h-[200px] w-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={resourceDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {resourceDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.75rem',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-3">
              {resourceDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
