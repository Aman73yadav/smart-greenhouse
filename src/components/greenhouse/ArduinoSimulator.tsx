import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Thermometer, Droplets, Wind, Sun, Lightbulb, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import arduinoCircuitImg from '@/assets/arduino-circuit.png';

interface SimulatorState {
  temperature: number;
  humidity: number;
  co2: number;
  lightLevel: number;
  moisture: number;
  ledOn: boolean;
  lcdText: string[];
  potValue: number;
}

type SimStatus = 'stopped' | 'running' | 'paused';

interface ArduinoSimulatorProps {
  onSensorUpdate?: (data: {
    temperature: number;
    humidity: number;
    co2: number;
    lightLevel: number;
    moisture: number;
  }) => void;
}

export default function ArduinoSimulator({ onSensorUpdate }: ArduinoSimulatorProps) {
  const [status, setStatus] = useState<SimStatus>('stopped');
  const [simState, setSimState] = useState<SimulatorState>({
    temperature: 25.0,
    humidity: 60,
    co2: 400,
    lightLevel: 800,
    moisture: 65,
    ledOn: false,
    lcdText: ['Smart Greenhouse', 'Ready...'],
    potValue: 50,
  });
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-50), `[${ts}] ${msg}`]);
  }, []);

  // Simulation tick
  const tick = useCallback(() => {
    tickRef.current += 1;
    const t = tickRef.current;

    setSimState(prev => {
      // Simulate realistic sensor fluctuations
      const tempBase = 22 + Math.sin(t * 0.05) * 5 + (prev.potValue / 100) * 8;
      const temp = Math.round((tempBase + (Math.random() - 0.5) * 1.5) * 10) / 10;
      const hum = Math.round(Math.max(30, Math.min(95, 55 + Math.cos(t * 0.03) * 15 + (Math.random() - 0.5) * 5)));
      const co2Val = Math.round(Math.max(300, Math.min(800, 400 + Math.sin(t * 0.02) * 100 + (Math.random() - 0.5) * 30)));
      const light = Math.round(Math.max(100, Math.min(1500, 700 + Math.sin(t * 0.04) * 300 + prev.potValue * 3)));
      const moist = Math.round(Math.max(30, Math.min(90, 60 + Math.cos(t * 0.025) * 12 + (Math.random() - 0.5) * 4)));

      // LED turns on when temp > 30 or humidity > 80 (alert condition)
      const ledOn = temp > 30 || hum > 80;

      // LCD display updates
      const lcdLine1 = `T:${temp}C H:${hum}%`;
      const lcdLine2 = `CO2:${co2Val} L:${light}`;

      return {
        temperature: temp,
        humidity: hum,
        co2: co2Val,
        lightLevel: light,
        moisture: moist,
        ledOn,
        lcdText: [lcdLine1, lcdLine2],
        potValue: prev.potValue,
      };
    });

    setElapsed(prev => prev + 1);
  }, []);

  // Push sensor data to parent every 3 ticks
  useEffect(() => {
    if (status === 'running' && elapsed > 0 && elapsed % 3 === 0) {
      onSensorUpdate?.({
        temperature: simState.temperature,
        humidity: simState.humidity,
        co2: simState.co2,
        lightLevel: simState.lightLevel,
        moisture: simState.moisture,
      });
      addLog(`Sensor data sent → T:${simState.temperature}°C H:${simState.humidity}% CO₂:${simState.co2}ppm`);
    }
  }, [elapsed, status]);

  const startSimulation = () => {
    if (status === 'running') return;
    setStatus('running');
    addLog('▶ Simulation started');
    intervalRef.current = setInterval(tick, 1000);
  };

  const pauseSimulation = () => {
    if (status !== 'running') return;
    setStatus('paused');
    addLog('⏸ Simulation paused');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopSimulation = () => {
    setStatus('stopped');
    addLog('⏹ Simulation stopped');
    if (intervalRef.current) clearInterval(intervalRef.current);
    tickRef.current = 0;
    setElapsed(0);
    setSimState({
      temperature: 25.0,
      humidity: 60,
      co2: 400,
      lightLevel: 800,
      moisture: 65,
      ledOn: false,
      lcdText: ['Smart Greenhouse', 'Ready...'],
      potValue: 50,
    });
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const statusColor = {
    stopped: 'bg-muted text-muted-foreground',
    running: 'bg-success/15 text-success border-success/30',
    paused: 'bg-warning/15 text-warning border-warning/30',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-display font-bold text-foreground mb-2">Arduino Circuit Simulator</h2>
        <p className="text-muted-foreground">Interactive Smart Greenhouse circuit with DHT22, MQ-135, LCD & sensors</p>
      </div>

      {/* Controls Bar */}
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={startSimulation}
                disabled={status === 'running'}
                size="sm"
                className="gap-2"
              >
                <Play className="w-4 h-4" /> Start
              </Button>
              <Button
                onClick={pauseSimulation}
                disabled={status !== 'running'}
                variant="secondary"
                size="sm"
                className="gap-2"
              >
                <Pause className="w-4 h-4" /> Pause
              </Button>
              <Button
                onClick={stopSimulation}
                disabled={status === 'stopped'}
                variant="destructive"
                size="sm"
                className="gap-2"
              >
                <Square className="w-4 h-4" /> Stop
              </Button>
              <Button
                onClick={() => { stopSimulation(); setTimeout(startSimulation, 100); }}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Restart
              </Button>
            </div>

            <Badge className={cn('text-sm px-3 py-1 border', statusColor[status])}>
              {status === 'running' ? '● Running' : status === 'paused' ? '⏸ Paused' : '⏹ Stopped'}
            </Badge>

            {status !== 'stopped' && (
              <span className="text-sm text-muted-foreground ml-auto">
                Elapsed: {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Circuit Diagram */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Circuit Diagram
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="relative rounded-xl overflow-hidden border border-border">
              <img
                src={arduinoCircuitImg}
                alt="Arduino UNO Smart Greenhouse Circuit - DHT22, MQ-135, LCD, LED, Potentiometer"
                className="w-full h-auto"
              />
              {/* LED overlay */}
              <AnimatePresence>
                {simState.ledOn && status === 'running' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    className="absolute top-[22%] left-[8%] w-4 h-4 rounded-full bg-red-500 shadow-[0_0_12px_4px_rgba(239,68,68,0.7)]"
                    style={{ animation: 'pulse 1s infinite' }}
                  />
                )}
              </AnimatePresence>
              {/* LCD overlay */}
              {status !== 'stopped' && (
                <div className="absolute bottom-[12%] right-[10%] w-[35%] bg-[#9acd32]/90 rounded px-2 py-1 font-mono text-[10px] sm:text-xs text-black leading-tight border border-black/20">
                  <div>{simState.lcdText[0]}</div>
                  <div>{simState.lcdText[1]}</div>
                </div>
              )}
            </div>

            {/* Potentiometer Control */}
            <div className="mt-4 space-y-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                🎛️ Potentiometer (Sensitivity)
              </label>
              <Slider
                value={[simState.potValue]}
                onValueChange={([v]) => setSimState(prev => ({ ...prev, potValue: v }))}
                min={0}
                max={100}
                step={1}
                disabled={status === 'stopped'}
              />
              <span className="text-xs text-muted-foreground">Value: {simState.potValue}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Live Sensor Outputs */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Live Sensor Outputs</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <SensorGauge
                  icon={<Thermometer className="w-5 h-5" />}
                  label="Temperature"
                  value={simState.temperature}
                  unit="°C"
                  min={15}
                  max={40}
                  color="text-red-500"
                  active={status !== 'stopped'}
                />
                <SensorGauge
                  icon={<Droplets className="w-5 h-5" />}
                  label="Humidity"
                  value={simState.humidity}
                  unit="%"
                  min={20}
                  max={100}
                  color="text-blue-500"
                  active={status !== 'stopped'}
                />
                <SensorGauge
                  icon={<Wind className="w-5 h-5" />}
                  label="CO₂"
                  value={simState.co2}
                  unit="ppm"
                  min={300}
                  max={800}
                  color="text-emerald-500"
                  active={status !== 'stopped'}
                />
                <SensorGauge
                  icon={<Sun className="w-5 h-5" />}
                  label="Light"
                  value={simState.lightLevel}
                  unit="lux"
                  min={0}
                  max={1500}
                  color="text-yellow-500"
                  active={status !== 'stopped'}
                />
                <SensorGauge
                  icon={<Droplets className="w-5 h-5" />}
                  label="Moisture"
                  value={simState.moisture}
                  unit="%"
                  min={20}
                  max={100}
                  color="text-cyan-500"
                  active={status !== 'stopped'}
                />
                <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-muted/50 border border-border">
                  <Lightbulb className={cn('w-6 h-6 mb-1', simState.ledOn && status === 'running' ? 'text-red-500' : 'text-muted-foreground')} />
                  <span className="text-xs font-medium text-muted-foreground">Alert LED</span>
                  <span className={cn('text-sm font-bold', simState.ledOn && status === 'running' ? 'text-red-500' : 'text-muted-foreground')}>
                    {simState.ledOn && status === 'running' ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* LCD Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">LCD Display (16×2)</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-[#2a4a00] rounded-xl p-4 border-2 border-[#1a3000]">
                <div className="bg-[#9acd32] rounded-lg px-4 py-3 font-mono text-base sm:text-lg text-black tracking-widest leading-relaxed">
                  <div>{simState.lcdText[0].padEnd(16, ' ')}</div>
                  <div>{simState.lcdText[1].padEnd(16, ' ')}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Serial Monitor */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                Serial Monitor
                <Button variant="ghost" size="sm" onClick={() => setLogs([])}>Clear</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="bg-black/90 rounded-lg p-3 h-40 overflow-y-auto font-mono text-xs text-green-400 space-y-0.5">
                {logs.length === 0 && <span className="text-muted-foreground">Waiting for simulation...</span>}
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SensorGauge({ icon, label, value, unit, min, max, color, active }: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color: string;
  active: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border border-border">
      <div className={cn('mb-1', active ? color : 'text-muted-foreground')}>{icon}</div>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <motion.span
        key={value}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        className={cn('text-lg font-bold', active ? 'text-foreground' : 'text-muted-foreground')}
      >
        {active ? value : '--'}
      </motion.span>
      <span className="text-xs text-muted-foreground">{unit}</span>
      <div className="w-full h-1.5 bg-border rounded-full mt-2 overflow-hidden">
        <motion.div
          className={cn('h-full rounded-full', active ? 'bg-primary' : 'bg-muted-foreground/30')}
          animate={{ width: active ? `${pct}%` : '0%' }}
          transition={{ type: 'spring', stiffness: 100 }}
        />
      </div>
    </div>
  );
}
