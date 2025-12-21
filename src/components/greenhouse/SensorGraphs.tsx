import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Thermometer, Droplets, Sprout, Sun } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface SensorGraphsProps {
  sensorData: {
    temperature: number;
    humidity: number;
    moisture: number;
    lightLevel: number;
  };
}

interface DataPoint {
  time: string;
  value: number;
  timestamp: number;
}

export default function SensorGraphs({ sensorData }: SensorGraphsProps) {
  const [temperatureHistory, setTemperatureHistory] = useState<DataPoint[]>([]);
  const [humidityHistory, setHumidityHistory] = useState<DataPoint[]>([]);
  const [moistureHistory, setMoistureHistory] = useState<DataPoint[]>([]);
  const [lightHistory, setLightHistory] = useState<DataPoint[]>([]);
  
  // Update history when sensor data changes
  useEffect(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timestamp = now.getTime();
    
    const addDataPoint = (
      setter: React.Dispatch<React.SetStateAction<DataPoint[]>>,
      value: number
    ) => {
      setter(prev => {
        const newData = [...prev, { time: timeStr, value, timestamp }];
        // Keep last 30 data points
        return newData.slice(-30);
      });
    };
    
    addDataPoint(setTemperatureHistory, sensorData.temperature);
    addDataPoint(setHumidityHistory, sensorData.humidity);
    addDataPoint(setMoistureHistory, sensorData.moisture);
    addDataPoint(setLightHistory, sensorData.lightLevel);
  }, [sensorData]);
  
  const graphs = [
    {
      id: 'temperature',
      title: 'Temperature',
      icon: Thermometer,
      data: temperatureHistory,
      color: 'hsl(0, 84%, 60%)',
      gradient: ['hsl(0, 84%, 60%)', 'hsl(30, 84%, 60%)'],
      unit: '°C',
      min: 15,
      max: 40,
      optimal: { min: 20, max: 30 },
    },
    {
      id: 'humidity',
      title: 'Humidity',
      icon: Droplets,
      data: humidityHistory,
      color: 'hsl(200, 84%, 60%)',
      gradient: ['hsl(200, 84%, 60%)', 'hsl(220, 84%, 60%)'],
      unit: '%',
      min: 20,
      max: 100,
      optimal: { min: 50, max: 80 },
    },
    {
      id: 'moisture',
      title: 'Soil Moisture',
      icon: Sprout,
      data: moistureHistory,
      color: 'hsl(142, 76%, 45%)',
      gradient: ['hsl(142, 76%, 45%)', 'hsl(160, 76%, 45%)'],
      unit: '%',
      min: 30,
      max: 100,
      optimal: { min: 60, max: 85 },
    },
    {
      id: 'light',
      title: 'Light Intensity',
      icon: Sun,
      data: lightHistory,
      color: 'hsl(45, 93%, 55%)',
      gradient: ['hsl(45, 93%, 55%)', 'hsl(35, 93%, 55%)'],
      unit: 'lux',
      min: 0,
      max: 1500,
      optimal: { min: 400, max: 1200 },
    },
  ];
  
  const [activeGraph, setActiveGraph] = useState('temperature');
  const currentGraph = graphs.find(g => g.id === activeGraph) || graphs[0];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-bold text-foreground">
            {payload[0].value.toFixed(1)} {currentGraph.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">
          Real-Time Sensor Graphs
        </h2>
        <p className="text-muted-foreground text-sm">
          Live monitoring of environmental conditions
        </p>
      </div>
      
      <Tabs value={activeGraph} onValueChange={setActiveGraph}>
        <TabsList className="grid grid-cols-4 mb-6">
          {graphs.map((graph) => (
            <TabsTrigger 
              key={graph.id} 
              value={graph.id}
              className="flex items-center gap-2"
            >
              <graph.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{graph.title}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {graphs.map((graph) => (
          <TabsContent key={graph.id} value={graph.id}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Current Value Display */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div 
                    className="p-3 rounded-xl"
                    style={{ backgroundColor: `${graph.color}20` }}
                  >
                    <graph.icon className="w-6 h-6" style={{ color: graph.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{graph.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Optimal: {graph.optimal.min} - {graph.optimal.max} {graph.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: graph.color }}>
                    {graph.data.length > 0 ? graph.data[graph.data.length - 1].value.toFixed(1) : '--'}
                  </div>
                  <div className="text-sm text-muted-foreground">{graph.unit}</div>
                </div>
              </div>
              
              {/* Optimal Range Indicator */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">Min: {graph.min}{graph.unit}</span>
                  <span className="text-primary font-medium">Optimal Range</span>
                  <span className="text-muted-foreground">Max: {graph.max}{graph.unit}</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  {/* Optimal zone */}
                  <div 
                    className="absolute h-full bg-success/40"
                    style={{
                      left: `${((graph.optimal.min - graph.min) / (graph.max - graph.min)) * 100}%`,
                      width: `${((graph.optimal.max - graph.optimal.min) / (graph.max - graph.min)) * 100}%`,
                    }}
                  />
                  {/* Current value indicator */}
                  {graph.data.length > 0 && (
                    <motion.div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-background shadow-lg"
                      style={{ 
                        backgroundColor: graph.color,
                        left: `${Math.min(100, Math.max(0, ((graph.data[graph.data.length - 1].value - graph.min) / (graph.max - graph.min)) * 100))}%`,
                        transform: 'translate(-50%, -50%)'
                      }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
              
              {/* Chart */}
              <div className="h-[250px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={graph.data}>
                    <defs>
                      <linearGradient id={`gradient-${graph.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={graph.color} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={graph.color} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      domain={[graph.min, graph.max]}
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 10 }}
                      tickLine={false}
                      width={40}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={graph.color}
                      strokeWidth={2}
                      fill={`url(#gradient-${graph.id})`}
                      dot={false}
                      activeDot={{ r: 6, fill: graph.color, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              {/* Stats */}
              {graph.data.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Min</div>
                    <div className="font-semibold">
                      {Math.min(...graph.data.map(d => d.value)).toFixed(1)} {graph.unit}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Avg</div>
                    <div className="font-semibold">
                      {(graph.data.reduce((sum, d) => sum + d.value, 0) / graph.data.length).toFixed(1)} {graph.unit}
                    </div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground mb-1">Max</div>
                    <div className="font-semibold">
                      {Math.max(...graph.data.map(d => d.value)).toFixed(1)} {graph.unit}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
