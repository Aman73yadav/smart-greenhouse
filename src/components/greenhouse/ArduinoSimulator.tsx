import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, RotateCcw, Zap, ZapOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

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
    lcdText: ['Smart Greenhouse', 'Ready...        '],
    potValue: 50,
  });
  const [elapsed, setElapsed] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [speed, setSpeed] = useState(1000);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-80), `[${ts}] ${msg}`]);
  }, []);

  const tick = useCallback(() => {
    tickRef.current += 1;
    const t = tickRef.current;

    setSimState(prev => {
      const tempBase = 22 + Math.sin(t * 0.05) * 5 + (prev.potValue / 100) * 8;
      const temp = Math.round((tempBase + (Math.random() - 0.5) * 1.5) * 10) / 10;
      const hum = Math.round(Math.max(30, Math.min(95, 55 + Math.cos(t * 0.03) * 15 + (Math.random() - 0.5) * 5)));
      const co2Val = Math.round(Math.max(300, Math.min(800, 400 + Math.sin(t * 0.02) * 100 + (Math.random() - 0.5) * 30)));
      const light = Math.round(Math.max(100, Math.min(1500, 700 + Math.sin(t * 0.04) * 300 + prev.potValue * 3)));
      const moist = Math.round(Math.max(30, Math.min(90, 60 + Math.cos(t * 0.025) * 12 + (Math.random() - 0.5) * 4)));
      const ledOn = temp > 30 || hum > 80;
      const lcdLine1 = `T:${temp}C H:${hum}%  `;
      const lcdLine2 = `CO2:${co2Val} L:${light} `;

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

  useEffect(() => {
    if (status === 'running' && elapsed > 0 && elapsed % 3 === 0) {
      onSensorUpdate?.({
        temperature: simState.temperature,
        humidity: simState.humidity,
        co2: simState.co2,
        lightLevel: simState.lightLevel,
        moisture: simState.moisture,
      });
      addLog(`📡 Data → T:${simState.temperature}°C H:${simState.humidity}% CO₂:${simState.co2}ppm L:${simState.lightLevel}lux M:${simState.moisture}%`);
    }
    if (status === 'running' && elapsed > 0 && elapsed % 1 === 0) {
      addLog(`🔄 Tick ${elapsed} — DHT22: ${simState.temperature}°C/${simState.humidity}% | MQ135: ${simState.co2}ppm | LDR: ${simState.lightLevel}lux`);
    }
  }, [elapsed, status]);

  const startSimulation = () => {
    if (status === 'running') return;
    setStatus('running');
    addLog('▶ Simulation STARTED — Arduino UNO powered on');
    addLog('  ├─ DHT22 sensor initialized (Pin D2)');
    addLog('  ├─ MQ-135 gas sensor initialized (Pin A0)');
    addLog('  ├─ LDR light sensor initialized (Pin A1)');
    addLog('  ├─ Soil moisture sensor initialized (Pin A2)');
    addLog('  ├─ LCD 16x2 initialized (I2C 0x27)');
    addLog('  └─ Alert LED initialized (Pin D13)');
    intervalRef.current = setInterval(tick, speed);
  };

  const pauseSimulation = () => {
    if (status !== 'running') return;
    setStatus('paused');
    addLog('⏸ Simulation PAUSED');
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const stopSimulation = () => {
    setStatus('stopped');
    addLog('⏹ Simulation STOPPED — Arduino powered off');
    if (intervalRef.current) clearInterval(intervalRef.current);
    tickRef.current = 0;
    setElapsed(0);
    setSimState({
      temperature: 25.0, humidity: 60, co2: 400, lightLevel: 800, moisture: 65,
      ledOn: false, lcdText: ['Smart Greenhouse', 'Ready...        '], potValue: 50,
    });
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Update interval speed when changed
  useEffect(() => {
    if (status === 'running' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(tick, speed);
    }
  }, [speed, tick, status]);

  const isActive = status !== 'stopped';
  const isRunning = status === 'running';

  return (
    <div className="space-y-4">
      {/* Compact header + controls */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground">Circuit Simulator</h2>
        <Badge className={cn('text-xs px-2 py-0.5 border', {
          'bg-muted text-muted-foreground': status === 'stopped',
          'bg-green-500/15 text-green-600 border-green-500/30': status === 'running',
          'bg-yellow-500/15 text-yellow-600 border-yellow-500/30': status === 'paused',
        })}>
          {status === 'running' ? '● Running' : status === 'paused' ? '⏸ Paused' : '⏹ Off'}
        </Badge>
        {isActive && (
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={startSimulation} disabled={isRunning} size="sm" className="gap-1.5">
          <Play className="w-3.5 h-3.5" /> Start
        </Button>
        <Button onClick={pauseSimulation} disabled={!isRunning} variant="secondary" size="sm" className="gap-1.5">
          <Pause className="w-3.5 h-3.5" /> Pause
        </Button>
        <Button onClick={stopSimulation} disabled={!isActive} variant="destructive" size="sm" className="gap-1.5">
          <Square className="w-3.5 h-3.5" /> Stop
        </Button>
        <Button onClick={() => { stopSimulation(); setTimeout(startSimulation, 100); }} variant="outline" size="sm" className="gap-1.5">
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </Button>
        <div className="flex items-center gap-2 ml-4">
          <span className="text-xs text-muted-foreground">Speed:</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-xs bg-muted border border-border rounded px-2 py-1"
          >
            <option value={2000}>0.5x</option>
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={250}>4x</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Interactive SVG Circuit — spans 2 cols */}
        <Card className="xl:col-span-2 overflow-hidden">
          <CardContent className="p-4">
            <svg viewBox="0 0 800 500" className="w-full h-auto" style={{ minHeight: 300 }}>
              <defs>
                <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a6b4a" />
                  <stop offset="100%" stopColor="#0d4a30" />
                </linearGradient>
                <linearGradient id="wireFlow" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#ff0" stopOpacity="0" />
                  <stop offset="50%" stopColor="#ff0" stopOpacity={isRunning ? "0.8" : "0"} />
                  <stop offset="100%" stopColor="#ff0" stopOpacity="0">
                    {isRunning && <animate attributeName="offset" values="0;1;0" dur="2s" repeatCount="indefinite" />}
                  </stop>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Background */}
              <rect width="800" height="500" rx="12" fill="#1a1a2e" />

              {/* ─── ARDUINO UNO BOARD ─── */}
              <rect x="280" y="160" width="240" height="180" rx="8" fill="url(#boardGrad)" stroke="#2a8b6a" strokeWidth="2" />
              <rect x="290" y="170" width="220" height="16" rx="3" fill="#0a3a25" />
              <text x="400" y="182" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace" fontWeight="bold">ARDUINO UNO R3</text>
              {/* USB port */}
              <rect x="475" y="210" width="35" height="22" rx="3" fill="#888" stroke="#666" strokeWidth="1.5" />
              <text x="492" y="224" textAnchor="middle" fill="#333" fontSize="7" fontFamily="monospace">USB</text>
              {/* Power port */}
              <rect x="475" y="300" width="30" height="16" rx="5" fill="#333" stroke="#555" strokeWidth="1" />
              {/* Digital pins */}
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map((i) => (
                <g key={`dpin-${i}`}>
                  <rect x={295 + i * 15} y={190} width="10" height="14" rx="1" fill={i === 2 ? '#f59e0b' : i === 13 ? (simState.ledOn && isRunning ? '#ef4444' : '#666') : '#444'} stroke="#222" strokeWidth="0.5" />
                  <text x={300 + i * 15} y={215} textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="monospace">{i}</text>
                </g>
              ))}
              {/* Analog pins */}
              {['A0','A1','A2','A3','A4','A5'].map((pin, i) => (
                <g key={pin}>
                  <rect x={305 + i * 20} y={318} width="12" height="14" rx="1" fill={i < 3 ? '#3b82f6' : '#444'} stroke="#222" strokeWidth="0.5" />
                  <text x={311 + i * 20} y={342} textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="monospace">{pin}</text>
                </g>
              ))}
              {/* Power pins labels */}
              <text x="295" y="215" fill="#ef4444" fontSize="6" fontFamily="monospace">5V</text>
              <text x="295" y="342" fill="#22c55e" fontSize="6" fontFamily="monospace">GND</text>
              {/* Microcontroller chip */}
              <rect x="340" y="240" width="80" height="50" rx="4" fill="#111" stroke="#333" strokeWidth="1" />
              <text x="380" y="260" textAnchor="middle" fill="#666" fontSize="7" fontFamily="monospace">ATmega328P</text>
              <text x="380" y="275" textAnchor="middle" fill="#555" fontSize="6" fontFamily="monospace">16MHz</text>
              {/* Power LED */}
              <circle cx="300" cy="300" r="4" fill={isActive ? '#22c55e' : '#333'} filter={isActive ? 'url(#glow)' : ''} />
              <text x="300" y="312" textAnchor="middle" fill="#9ca3af" fontSize="5" fontFamily="monospace">PWR</text>

              {/* ─── DHT22 SENSOR (Temperature & Humidity) ─── */}
              <rect x="60" y="140" width="80" height="60" rx="6" fill="#e8e8e8" stroke="#ccc" strokeWidth="1.5" />
              <rect x="70" y="148" width="60" height="30" rx="3" fill="#f0f0f0" stroke="#ddd" />
              <text x="100" y="165" textAnchor="middle" fill="#333" fontSize="9" fontWeight="bold" fontFamily="monospace">DHT22</text>
              {/* Pins */}
              {[0,1,2].map(i => <rect key={`dht-pin-${i}`} x={75 + i * 18} y={200} width="4" height="15" fill="#999" />)}
              <text x="100" y="225" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="monospace">Temp + Humidity</text>
              {/* Wire from DHT22 to Pin D2 */}
              <path d="M 93 215 L 93 240 Q 93 250 103 250 L 270 250 Q 280 250 280 220 L 310 204" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1s" repeatCount="indefinite" />}
              </path>
              {/* Sensor value display */}
              {isActive && (
                <g>
                  <rect x="55" y="100" width="90" height="32" rx="4" fill="#000" fillOpacity="0.85" stroke="#f59e0b" strokeWidth="1" />
                  <text x="100" y="115" textAnchor="middle" fill="#f59e0b" fontSize="9" fontFamily="monospace">{simState.temperature}°C</text>
                  <text x="100" y="127" textAnchor="middle" fill="#60a5fa" fontSize="9" fontFamily="monospace">{simState.humidity}% RH</text>
                </g>
              )}

              {/* ─── MQ-135 GAS SENSOR (CO2) ─── */}
              <rect x="60" y="290" width="80" height="65" rx="6" fill="#2d2d2d" stroke="#555" strokeWidth="1.5" />
              <circle cx="100" cy="315" r="20" fill="#444" stroke="#666" strokeWidth="2" />
              <circle cx="100" cy="315" r="12" fill={isRunning ? '#c97030' : '#555'} />
              {isRunning && <circle cx="100" cy="315" r="12" fill="#c97030" opacity="0.6">
                <animate attributeName="r" values="12;15;12" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
              </circle>}
              <text x="100" y="365" textAnchor="middle" fill="#9ca3af" fontSize="8" fontWeight="bold" fontFamily="monospace">MQ-135</text>
              <text x="100" y="376" textAnchor="middle" fill="#777" fontSize="7" fontFamily="monospace">CO₂ / Gas</text>
              {/* Wire to A0 */}
              <path d="M 140 320 L 200 320 Q 210 320 210 310 L 260 310 L 260 325 L 311 325" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.2s" repeatCount="indefinite" />}
              </path>
              {isActive && (
                <g>
                  <rect x="55" y="385" width="90" height="22" rx="4" fill="#000" fillOpacity="0.85" stroke="#3b82f6" strokeWidth="1" />
                  <text x="100" y="400" textAnchor="middle" fill="#3b82f6" fontSize="10" fontFamily="monospace">{simState.co2} ppm</text>
                </g>
              )}

              {/* ─── LDR (Light Sensor) ─── */}
              <g transform="translate(60, 420)">
                <ellipse cx="30" cy="20" rx="22" ry="18" fill="#8B6914" stroke="#a07828" strokeWidth="1.5" />
                <path d="M 20 12 Q 30 5 40 12" fill="none" stroke="#d4a020" strokeWidth="2" />
                <path d="M 22 18 Q 30 25 38 18" fill="none" stroke="#d4a020" strokeWidth="2" />
                <text x="30" y="50" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="monospace">LDR</text>
                <text x="30" y="60" textAnchor="middle" fill="#777" fontSize="7" fontFamily="monospace">Light</text>
              </g>
              {/* Wire to A1 */}
              <path d="M 112 440 L 200 440 Q 215 440 215 420 L 215 350 L 260 350 L 260 325 L 331 325" fill="none" stroke="#eab308" strokeWidth="2" strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.4s" repeatCount="indefinite" />}
              </path>
              {isActive && (
                <g>
                  <rect x="55" y="470" width="90" height="22" rx="4" fill="#000" fillOpacity="0.85" stroke="#eab308" strokeWidth="1" />
                  <text x="100" y="485" textAnchor="middle" fill="#eab308" fontSize="10" fontFamily="monospace">{simState.lightLevel} lux</text>
                </g>
              )}

              {/* ─── SOIL MOISTURE SENSOR ─── */}
              <g transform="translate(200, 400)">
                <rect x="0" y="0" width="14" height="60" rx="3" fill="#8B4513" stroke="#6b3410" strokeWidth="1" />
                <rect x="22" y="0" width="14" height="60" rx="3" fill="#8B4513" stroke="#6b3410" strokeWidth="1" />
                <rect x="-2" y="-10" width="40" height="14" rx="3" fill="#2a6b3a" stroke="#1a5a2a" strokeWidth="1" />
                <text x="18" y="75" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="monospace">Soil Moisture</text>
              </g>
              {/* Wire to A2 */}
              <path d="M 240 400 L 270 400 Q 280 400 280 370 L 280 325 L 351 325" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.1s" repeatCount="indefinite" />}
              </path>
              {isActive && (
                <g>
                  <rect x="190" y="480" width="90" height="22" rx="4" fill="#000" fillOpacity="0.85" stroke="#06b6d4" strokeWidth="1" />
                  <text x="235" y="495" textAnchor="middle" fill="#06b6d4" fontSize="10" fontFamily="monospace">{simState.moisture}%</text>
                </g>
              )}

              {/* ─── LCD 16x2 DISPLAY ─── */}
              <rect x="570" y="140" width="200" height="100" rx="6" fill="#1a5e1a" stroke="#2a7e2a" strokeWidth="2" />
              <rect x="580" y="155" width="180" height="55" rx="4" fill={isActive ? '#9acd32' : '#556b2f'} />
              {isActive ? (
                <g>
                  <text x="670" y="177" textAnchor="middle" fill="#1a3300" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    {simState.lcdText[0]}
                  </text>
                  <text x="670" y="198" textAnchor="middle" fill="#1a3300" fontSize="14" fontFamily="monospace" fontWeight="bold">
                    {simState.lcdText[1]}
                  </text>
                </g>
              ) : (
                <text x="670" y="188" textAnchor="middle" fill="#3a5a20" fontSize="12" fontFamily="monospace">LCD 16×2</text>
              )}
              <text x="670" y="252" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="monospace">I2C LCD Display</text>
              {/* I2C wires to A4/A5 */}
              <path d="M 570 190 L 540 190 Q 530 190 530 200 L 530 325 L 390 325" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="0.8s" repeatCount="indefinite" />}
              </path>

              {/* ─── ALERT LED ─── */}
              <g transform="translate(620, 290)">
                <polygon points="15,0 30,35 0,35" fill={simState.ledOn && isRunning ? '#ef4444' : '#661111'} stroke={simState.ledOn && isRunning ? '#ff6666' : '#441111'} strokeWidth="1.5" />
                {simState.ledOn && isRunning && (
                  <>
                    <circle cx="15" cy="18" r="20" fill="#ef4444" opacity="0.15" filter="url(#glow)">
                      <animate attributeName="r" values="20;30;20" dur="0.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.15;0.05;0.15" dur="0.8s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="15" cy="18" r="8" fill="#ff0000" opacity="0.4" filter="url(#glow)" />
                  </>
                )}
                <rect x="12" y="35" width="3" height="12" fill="#999" />
                <rect x="18" y="35" width="3" height="12" fill="#999" />
                <text x="15" y="58" textAnchor="middle" fill={simState.ledOn && isRunning ? '#ef4444' : '#777'} fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {simState.ledOn && isRunning ? 'ALERT!' : 'LED'}
                </text>
              </g>
              {/* Wire from Pin D13 to LED */}
              <path d="M 505 204 Q 530 204 530 250 L 530 310 L 580 310 L 620 310" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray={simState.ledOn && isRunning ? "4 2" : "none"}>
                {simState.ledOn && isRunning && <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.5s" repeatCount="indefinite" />}
              </path>

              {/* ─── POTENTIOMETER ─── */}
              <g transform="translate(600, 380)">
                <circle cx="40" cy="40" r="35" fill="#2d2d3d" stroke="#555" strokeWidth="2" />
                <circle cx="40" cy="40" r="25" fill="#3d3d4d" stroke="#666" strokeWidth="1" />
                <line x1="40" y1="40" x2={40 + Math.cos((simState.potValue / 100) * Math.PI * 1.5 - Math.PI * 0.75) * 20} y2={40 + Math.sin((simState.potValue / 100) * Math.PI * 1.5 - Math.PI * 0.75) * 20} stroke="#ddd" strokeWidth="3" strokeLinecap="round" />
                <circle cx="40" cy="40" r="5" fill="#888" />
                <text x="40" y="90" textAnchor="middle" fill="#9ca3af" fontSize="8" fontFamily="monospace">POT ({simState.potValue}%)</text>
              </g>
              {/* Wire from pot to Arduino */}
              <path d="M 600 420 L 540 420 Q 530 420 530 400 L 530 340 L 495 340 L 495 325 L 415 325" fill="none" stroke="#a3a3a3" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* ─── GROUND & POWER RAILS ─── */}
              <line x1="280" y1="350" x2="280" y2="450" stroke="#333" strokeWidth="3" />
              <line x1="520" y1="350" x2="520" y2="450" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="280" y="465" textAnchor="middle" fill="#555" fontSize="7" fontFamily="monospace">GND</text>
              <text x="520" y="465" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">5V</text>

              {/* ─── WIRE LEGEND ─── */}
              <g transform="translate(580, 60)">
                <text x="0" y="0" fill="#777" fontSize="8" fontFamily="monospace" fontWeight="bold">Wire Legend:</text>
                {[
                  { color: '#f59e0b', label: 'DHT22 (D2)' },
                  { color: '#3b82f6', label: 'MQ-135 (A0)' },
                  { color: '#eab308', label: 'LDR (A1)' },
                  { color: '#06b6d4', label: 'Moisture (A2)' },
                  { color: '#a855f7', label: 'LCD I2C (A4/A5)' },
                  { color: '#ef4444', label: 'LED (D13)' },
                ].map((w, i) => (
                  <g key={w.label}>
                    <line x1="0" y1={14 + i * 14} x2="20" y2={14 + i * 14} stroke={w.color} strokeWidth="2" />
                    <text x="26" y={18 + i * 14} fill="#999" fontSize="7" fontFamily="monospace">{w.label}</text>
                  </g>
                ))}
              </g>

              {/* ─── POWER INDICATOR ─── */}
              <g transform="translate(15, 15)">
                <rect width="120" height="28" rx="14" fill={isActive ? '#052e16' : '#1c1c1c'} stroke={isActive ? '#22c55e' : '#444'} strokeWidth="1.5" />
                {isActive ? <Zap x={8} y={4} width={16} height={16} /> : null}
                <circle cx="20" cy="14" r="5" fill={isActive ? '#22c55e' : '#555'} filter={isActive ? 'url(#glow)' : ''} />
                <text x="32" y="18" fill={isActive ? '#4ade80' : '#666'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                  {isActive ? 'POWER ON' : 'POWER OFF'}
                </text>
              </g>
            </svg>

            {/* Potentiometer slider control */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">🎛️ Potentiometer:</span>
              <Slider
                value={[simState.potValue]}
                onValueChange={([v]) => setSimState(prev => ({ ...prev, potValue: v }))}
                min={0} max={100} step={1}
                disabled={!isActive}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">{simState.potValue}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Right column: LCD + Serial Monitor */}
        <div className="space-y-4">
          {/* LCD Display */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">LCD Display (16×2)</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="bg-[#1a3800] rounded-lg p-3 border border-[#2a5000]">
                <div className={cn("rounded px-3 py-2 font-mono text-sm tracking-wider leading-relaxed", isActive ? "bg-[#9acd32] text-[#1a3300]" : "bg-[#3a5a20] text-[#2a4a10]")}>
                  <div>{simState.lcdText[0]}</div>
                  <div>{simState.lcdText[1]}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live readings summary */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Live Readings</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Temperature', value: `${simState.temperature}°C`, color: 'text-orange-400' },
                  { label: 'Humidity', value: `${simState.humidity}%`, color: 'text-blue-400' },
                  { label: 'CO₂', value: `${simState.co2} ppm`, color: 'text-green-400' },
                  { label: 'Light', value: `${simState.lightLevel} lux`, color: 'text-yellow-400' },
                  { label: 'Moisture', value: `${simState.moisture}%`, color: 'text-cyan-400' },
                  { label: 'LED Alert', value: simState.ledOn && isRunning ? 'ON ⚠️' : 'OFF', color: simState.ledOn && isRunning ? 'text-red-400' : 'text-muted-foreground' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={cn('font-mono font-bold', isActive ? r.color : 'text-muted-foreground')}>
                      {isActive ? r.value : '--'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Serial Monitor */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                Serial Monitor (9600 baud)
                <Button variant="ghost" size="sm" onClick={() => setLogs([])} className="h-6 text-xs">Clear</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="bg-black rounded-lg p-2 h-48 overflow-y-auto font-mono text-[11px] text-green-400 space-y-px">
                {logs.length === 0 && <span className="text-muted-foreground">Waiting for simulation...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="leading-tight">{log}</div>
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
