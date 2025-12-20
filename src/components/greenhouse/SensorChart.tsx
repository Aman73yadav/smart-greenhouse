import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

const generateData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: 22 + Math.random() * 6 + Math.sin(i / 4) * 3,
      humidity: 55 + Math.random() * 15 + Math.cos(i / 6) * 10,
      moisture: 60 + Math.random() * 20 + Math.sin(i / 8) * 5,
    });
  }
  
  return data;
};

const timeRanges = ['24h', '7d', '30d', '90d'] as const;

interface SensorChartProps {
  className?: string;
}

export default function SensorChart({ className }: SensorChartProps) {
  const [data] = useState(generateData);
  const [activeRange, setActiveRange] = useState<typeof timeRanges[number]>('24h');
  const [activeMetrics, setActiveMetrics] = useState({
    temperature: true,
    humidity: true,
    moisture: false,
  });

  const toggleMetric = (metric: keyof typeof activeMetrics) => {
    setActiveMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel-strong p-3 min-w-[150px]">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground capitalize">{entry.name}</span>
              </span>
              <span className="font-medium text-foreground">
                {entry.value.toFixed(1)}
                {entry.name === 'temperature' ? '°C' : '%'}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-panel p-6", className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-display font-semibold text-foreground">Sensor Trends</h3>
          <p className="text-sm text-muted-foreground">Real-time environmental data</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-muted rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeRange === range
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Metric toggles */}
      <div className="flex flex-wrap gap-2 mb-4">
        {[
          { key: 'temperature', label: 'Temperature', color: '#ef4444' },
          { key: 'humidity', label: 'Humidity', color: '#3b82f6' },
          { key: 'moisture', label: 'Moisture', color: '#22c55e' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => toggleMetric(key as keyof typeof activeMetrics)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              activeMetrics[key as keyof typeof activeMetrics]
                ? "bg-card border border-border"
                : "bg-muted text-muted-foreground"
            )}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activeMetrics[key as keyof typeof activeMetrics] ? color : '#666' }}
            />
            {label}
          </button>
        ))}
      </div>

      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="humidGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="moistGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12 }}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {activeMetrics.temperature && (
              <Area
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#tempGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#ef4444' }}
              />
            )}
            {activeMetrics.humidity && (
              <Area
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#humidGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#3b82f6' }}
              />
            )}
            {activeMetrics.moisture && (
              <Area
                type="monotone"
                dataKey="moisture"
                stroke="#22c55e"
                strokeWidth={2}
                fill="url(#moistGradient)"
                dot={false}
                activeDot={{ r: 4, fill: '#22c55e' }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
