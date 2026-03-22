import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Square, RotateCcw, ExternalLink } from 'lucide-react';
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
  lightPercent: number;
  soilPercent: number;
  ledOn: boolean;
  lcdLine1: string;
  lcdLine2: string;
  ldrRaw: number;
  soilRaw: number;
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

const WOKWI_URL = 'https://wokwi.com/projects/444855832358838273';

export default function ArduinoSimulator({ onSensorUpdate }: ArduinoSimulatorProps) {
  const [status, setStatus] = useState<SimStatus>('stopped');
  const [simState, setSimState] = useState<SimulatorState>({
    temperature: 25.0, humidity: 60, co2: 400,
    lightLevel: 800, moisture: 65,
    lightPercent: 50, soilPercent: 65,
    ledOn: false,
    lcdLine1: 'Smart Greenhouse',
    lcdLine2: 'Ready...        ',
    ldrRaw: 512, soilRaw: 358,
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

  // Exactly mirrors Wokwi sketch logic
  const tick = useCallback(() => {
    tickRef.current += 1;
    const t = tickRef.current;

    setSimState(prev => {
      // DHT22 readings (Pin D2) — realistic greenhouse fluctuation
      const temp = Math.round((22 + Math.sin(t * 0.04) * 6 + (Math.random() - 0.5) * 1.2) * 10) / 10;
      const hum = Math.round(Math.max(20, Math.min(99, 55 + Math.cos(t * 0.03) * 18 + (Math.random() - 0.5) * 4)));

      // LDR on A0 — analogRead returns 0-1023
      const ldrRaw = Math.round(Math.max(0, Math.min(1023, 512 + Math.sin(t * 0.035) * 300 + (Math.random() - 0.5) * 80)));
      // Soil Moisture on A1 — analogRead returns 0-1023
      const soilRaw = Math.round(Math.max(0, Math.min(1023, 400 + Math.cos(t * 0.025) * 200 + (Math.random() - 0.5) * 50)));

      // map(val, 1023, 0, 0, 100) — exactly as Wokwi sketch
      const lightPercent = Math.round(((1023 - ldrRaw) / 1023) * 100);
      const soilPercent = Math.round(((1023 - soilRaw) / 1023) * 100);

      // Convert to real units for dashboard
      const lightLevel = Math.round((lightPercent / 100) * 1500);
      const moisture = soilPercent;

      // CO2 simulated (not in Wokwi circuit but needed for dashboard)
      const co2 = Math.round(Math.max(300, Math.min(800, 420 + Math.sin(t * 0.02) * 80 + (Math.random() - 0.5) * 20)));

      // LED logic — alert when temp > 35 or humidity > 85
      const ledOn = temp > 35 || hum > 85;

      // LCD output — exactly matches Wokwi sketch format
      const lcdLine1 = `T:${temp.toFixed(1)}C H:${hum}%`;
      const lcdLine2 = `S:${soilPercent}% L:${lightPercent}%`;

      return {
        temperature: temp, humidity: hum, co2,
        lightLevel, moisture, lightPercent, soilPercent,
        ledOn, lcdLine1, lcdLine2, ldrRaw, soilRaw,
      };
    });

    setElapsed(prev => prev + 1);
  }, []);

  // Push data to dashboard every tick
  useEffect(() => {
    if (status === 'running' && elapsed > 0) {
      onSensorUpdate?.({
        temperature: simState.temperature,
        humidity: simState.humidity,
        co2: simState.co2,
        lightLevel: simState.lightLevel,
        moisture: simState.moisture,
      });

      // Serial output — matches Wokwi Serial.print format
      if (elapsed % 2 === 0) {
        addLog(`Temperature: ${simState.temperature} °C | Humidity: ${simState.humidity}% | Soil: ${simState.soilPercent}% | Light: ${simState.lightPercent}%`);
      }
    }
  }, [elapsed, status]);

  const startSimulation = () => {
    if (status === 'running') return;
    setStatus('running');
    addLog('▶ Simulation STARTED — Arduino UNO powered on');
    addLog('  ├─ DHT22 initialized (Pin D2)');
    addLog('  ├─ LDR initialized (Pin A0)');
    addLog('  ├─ Soil Moisture initialized (Pin A1)');
    addLog('  ├─ LCD 16x2 I2C initialized (0x27)');
    addLog('  └─ Alert LED initialized (Pin 13)');
    addLog('  LCD: "Smart Greenhouse"');
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
    addLog('⏹ Simulation STOPPED');
    if (intervalRef.current) clearInterval(intervalRef.current);
    tickRef.current = 0;
    setElapsed(0);
    setSimState({
      temperature: 25.0, humidity: 60, co2: 400,
      lightLevel: 800, moisture: 65,
      lightPercent: 50, soilPercent: 65,
      ledOn: false,
      lcdLine1: 'Smart Greenhouse',
      lcdLine2: 'Ready...        ',
      ldrRaw: 512, soilRaw: 358,
    });
  };

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

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
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-display font-bold text-foreground">Arduino Circuit Simulator</h2>
        <Badge className={cn('text-xs px-2 py-0.5 border', {
          'bg-muted text-muted-foreground': status === 'stopped',
          'bg-green-500/15 text-green-600 border-green-500/30': status === 'running',
          'bg-yellow-500/15 text-yellow-600 border-yellow-500/30': status === 'paused',
        })}>
          {status === 'running' ? '● Running' : status === 'paused' ? '⏸ Paused' : '⏹ Off'}
        </Badge>
        <a href={WOKWI_URL} target="_blank" rel="noopener noreferrer"
          className="ml-auto flex items-center gap-1.5 text-xs text-primary hover:underline">
          <ExternalLink className="w-3.5 h-3.5" /> Open in Wokwi
        </a>
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
          <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))}
            className="text-xs bg-muted border border-border rounded px-2 py-1">
            <option value={2000}>0.5x</option>
            <option value={1000}>1x</option>
            <option value={500}>2x</option>
            <option value={250}>4x</option>
          </select>
        </div>
        {isActive && (
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">
            {Math.floor(elapsed / 60)}:{(elapsed % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Interactive SVG Circuit */}
        <Card className="xl:col-span-2 overflow-hidden">
          <CardContent className="p-4">
            <svg viewBox="0 0 820 520" className="w-full h-auto" style={{ minHeight: 300 }}>
              <defs>
                <linearGradient id="boardGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1565C0" />
                  <stop offset="100%" stopColor="#0D47A1" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>

              {/* Background */}
              <rect width="820" height="520" rx="12" fill="#111827" />

              {/* === ARDUINO UNO BOARD === */}
              <rect x="280" y="170" width="260" height="200" rx="8" fill="url(#boardGrad)" stroke="#1976D2" strokeWidth="2" />
              {/* Board label */}
              <text x="410" y="195" textAnchor="middle" fill="#90CAF9" fontSize="8" fontFamily="monospace">DIGITAL (PWM ~)</text>
              {/* Digital pin headers */}
              {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
                <g key={`dp-${i}`}>
                  <rect x={290 + i * 16} y={200} width="11" height="14" rx="1.5"
                    fill={i === 2 ? '#f59e0b' : i === 13 ? (simState.ledOn && isRunning ? '#ef4444' : '#555') : '#37474F'}
                    stroke="#263238" strokeWidth="0.5" />
                  <text x={295.5 + i * 16} y={226} textAnchor="middle" fill="#B0BEC5" fontSize="5.5" fontFamily="monospace">{i}</text>
                </g>
              ))}
              {/* USB port */}
              <rect x="495" y="230" width="38" height="24" rx="3" fill="#78909C" stroke="#546E7A" strokeWidth="1.5" />
              <text x="514" y="246" textAnchor="middle" fill="#263238" fontSize="7" fontFamily="monospace">USB</text>
              {/* DC barrel */}
              <rect x="495" y="320" width="32" height="18" rx="8" fill="#263238" stroke="#455A64" strokeWidth="1" />
              {/* Microcontroller */}
              <rect x="345" y="255" width="90" height="55" rx="4" fill="#111" stroke="#333" strokeWidth="1" />
              <text x="390" y="278" textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">ATmega328P</text>
              <text x="390" y="295" textAnchor="middle" fill="#555" fontSize="6" fontFamily="monospace">16MHz</text>
              {/* ARDUINO UNO text */}
              <text x="390" y="340" textAnchor="middle" fill="#BBDEFB" fontSize="16" fontFamily="sans-serif" fontWeight="bold">ARDUINO</text>
              <text x="390" y="358" textAnchor="middle" fill="#E3F2FD" fontSize="14" fontFamily="sans-serif" fontWeight="bold">UNO</text>
              {/* Analog pin headers */}
              <text x="340" y="370" fill="#90CAF9" fontSize="7" fontFamily="monospace">ANALOG IN</text>
              {['A0','A1','A2','A3','A4','A5'].map((pin, i) => (
                <g key={pin}>
                  <rect x={300 + i * 22} y={375} width="14" height="14" rx="1.5"
                    fill={i === 0 ? '#eab308' : i === 1 ? '#06b6d4' : i === 4 || i === 5 ? '#a855f7' : '#37474F'}
                    stroke="#263238" strokeWidth="0.5" />
                  <text x={307 + i * 22} y={400} textAnchor="middle" fill="#B0BEC5" fontSize="5.5" fontFamily="monospace">{pin}</text>
                </g>
              ))}
              {/* Power pins */}
              <text x="295" y="370" fill="#ef4444" fontSize="6" fontFamily="monospace">5V</text>
              <text x="295" y="400" fill="#22c55e" fontSize="6" fontFamily="monospace">GND</text>
              {/* Power LED */}
              <circle cx="300" cy="320" r="4" fill={isActive ? '#22c55e' : '#333'} filter={isActive ? 'url(#glow)' : ''} />
              <text x="300" y="332" textAnchor="middle" fill="#B0BEC5" fontSize="5" fontFamily="monospace">ON</text>
              {/* TX/RX LEDs */}
              <circle cx="320" cy="320" r="3" fill={isRunning ? '#f59e0b' : '#333'} />
              <circle cx="335" cy="320" r="3" fill={isRunning ? '#22c55e' : '#333'} />
              <text x="320" y="332" textAnchor="middle" fill="#B0BEC5" fontSize="4" fontFamily="monospace">TX</text>
              <text x="335" y="332" textAnchor="middle" fill="#B0BEC5" fontSize="4" fontFamily="monospace">RX</text>

              {/* === DHT22 SENSOR (Pin D2) === */}
              <rect x="50" y="150" width="90" height="65" rx="6" fill="#f5f5f5" stroke="#ddd" strokeWidth="1.5" />
              <rect x="60" y="158" width="70" height="32" rx="3" fill="#e0e0e0" stroke="#ccc" />
              <text x="95" y="178" textAnchor="middle" fill="#333" fontSize="10" fontWeight="bold" fontFamily="monospace">DHT22</text>
              {/* DHT22 pins */}
              {[0,1,2].map(i => <rect key={`dht-p-${i}`} x={72 + i * 18} y={215} width="4" height="14" fill="#888" />)}
              <text x="95" y="242" textAnchor="middle" fill="#9ca3af" fontSize="7" fontFamily="monospace">Temp + Humidity</text>
              {/* Wire DHT22 → Pin D2 */}
              <path d="M 90 229 L 90 250 Q 90 260 100 260 L 270 260 Q 280 260 280 230 L 322 214"
                fill="none" stroke="#f59e0b" strokeWidth="2"
                strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1s" repeatCount="indefinite" />}
              </path>
              {/* Live value overlay */}
              {isActive && (
                <g>
                  <rect x="45" y="105" width="100" height="36" rx="5" fill="#000" fillOpacity="0.9" stroke="#f59e0b" strokeWidth="1" />
                  <text x="95" y="122" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">{simState.temperature.toFixed(1)}°C</text>
                  <text x="95" y="136" textAnchor="middle" fill="#60a5fa" fontSize="10" fontFamily="monospace" fontWeight="bold">{simState.humidity}% RH</text>
                </g>
              )}

              {/* === LDR MODULE (Pin A0) === */}
              <rect x="50" y="300" width="90" height="70" rx="6" fill="#1a237e" stroke="#3949AB" strokeWidth="1.5" />
              {/* LDR photoresistor on module */}
              <circle cx="95" cy="330" r="16" fill="#4a148c" stroke="#7B1FA2" strokeWidth="2" />
              <circle cx="95" cy="330" r="8" fill={isRunning ? '#e1bee7' : '#4a148c'} />
              {isRunning && <circle cx="95" cy="330" r="8" fill="#e1bee7" opacity="0.5">
                <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0.15;0.5" dur="2s" repeatCount="indefinite" />
              </circle>}
              <text x="95" y="360" textAnchor="middle" fill="#CE93D8" fontSize="6" fontFamily="monospace">PWR LED VCC GND DO AO</text>
              <text x="95" y="380" textAnchor="middle" fill="#B0BEC5" fontSize="8" fontWeight="bold" fontFamily="monospace">LDR Module</text>
              {/* Wire LDR → A0 */}
              <path d="M 140 335 L 220 335 Q 235 335 235 360 L 235 380 L 307 380"
                fill="none" stroke="#eab308" strokeWidth="2"
                strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.2s" repeatCount="indefinite" />}
              </path>
              {isActive && (
                <g>
                  <rect x="45" y="390" width="100" height="24" rx="4" fill="#000" fillOpacity="0.9" stroke="#eab308" strokeWidth="1" />
                  <text x="95" y="406" textAnchor="middle" fill="#eab308" fontSize="10" fontFamily="monospace" fontWeight="bold">Light: {simState.lightPercent}%</text>
                </g>
              )}

              {/* === SOIL MOISTURE SENSOR (Pin A1) === */}
              <g transform="translate(190, 420)">
                <rect x="0" y="0" width="16" height="55" rx="3" fill="#795548" stroke="#5D4037" strokeWidth="1" />
                <rect x="24" y="0" width="16" height="55" rx="3" fill="#795548" stroke="#5D4037" strokeWidth="1" />
                {/* PCB header */}
                <rect x="-4" y="-12" width="48" height="16" rx="3" fill="#1B5E20" stroke="#2E7D32" strokeWidth="1" />
                <text x="20" y="1" textAnchor="middle" fill="#A5D6A7" fontSize="5" fontFamily="monospace">GND SIG VCC</text>
                <text x="20" y="70" textAnchor="middle" fill="#B0BEC5" fontSize="7" fontFamily="monospace">Soil Moisture</text>
              </g>
              {/* Wire Soil → A1 */}
              <path d="M 250 420 L 270 420 Q 280 420 280 400 L 280 382 L 329 382"
                fill="none" stroke="#06b6d4" strokeWidth="2"
                strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="1.1s" repeatCount="indefinite" />}
              </path>
              {isActive && (
                <g>
                  <rect x="185" y="500" width="100" height="24" rx="4" fill="#000" fillOpacity="0.9" stroke="#06b6d4" strokeWidth="1" />
                  <text x="235" y="516" textAnchor="middle" fill="#06b6d4" fontSize="10" fontFamily="monospace" fontWeight="bold">Soil: {simState.soilPercent}%</text>
                </g>
              )}

              {/* === LCD 16x2 I2C DISPLAY === */}
              <rect x="580" y="155" width="210" height="110" rx="6" fill="#1B5E20" stroke="#2E7D32" strokeWidth="2" />
              <rect x="592" y="170" width="186" height="58" rx="4"
                fill={isActive ? '#C6FF00' : '#33691E'}
                stroke={isActive ? '#AEEA00' : '#2E7D32'} strokeWidth="1" />
              {isActive ? (
                <g>
                  <text x="685" y="193" textAnchor="middle" fill="#1B5E20" fontSize="15" fontFamily="monospace" fontWeight="bold">
                    {simState.lcdLine1}
                  </text>
                  <text x="685" y="216" textAnchor="middle" fill="#1B5E20" fontSize="15" fontFamily="monospace" fontWeight="bold">
                    {simState.lcdLine2}
                  </text>
                </g>
              ) : (
                <text x="685" y="205" textAnchor="middle" fill="#558B2F" fontSize="12" fontFamily="monospace">LCD 16×2</text>
              )}
              {/* I2C label */}
              <text x="685" y="250" textAnchor="middle" fill="#A5D6A7" fontSize="7" fontFamily="monospace">I2C Address: 0x27</text>
              <text x="685" y="275" textAnchor="middle" fill="#B0BEC5" fontSize="8" fontFamily="monospace">LCD Display (SDA/SCL)</text>
              {/* I2C wires → A4/A5 */}
              <path d="M 580 200 L 555 200 Q 545 200 545 220 L 545 380 L 388 380"
                fill="none" stroke="#a855f7" strokeWidth="2"
                strokeDasharray={isRunning ? "6 3" : "none"}>
                {isRunning && <animate attributeName="stroke-dashoffset" values="0;-18" dur="0.8s" repeatCount="indefinite" />}
              </path>
              <path d="M 580 215 L 560 215 Q 550 215 550 235 L 550 385 L 410 385"
                fill="none" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="4 2" />

              {/* === LED + RESISTOR (Pin D13) === */}
              <g transform="translate(620, 310)">
                {/* Resistor */}
                <rect x="0" y="20" width="40" height="10" rx="2" fill="#8D6E63" stroke="#6D4C41" strokeWidth="1" />
                {[0,1,2,3].map(i => (
                  <rect key={`res-${i}`} x={5 + i * 9} y="20" width="4" height="10" rx="0.5"
                    fill={['#ef4444','#9C27B0','#FF9800','#FFD700'][i]} />
                ))}
                <text x="20" y="42" textAnchor="middle" fill="#B0BEC5" fontSize="5" fontFamily="monospace">220Ω</text>
                {/* LED */}
                <polygon points="60,10 80,25 60,40" fill={simState.ledOn && isRunning ? '#ef4444' : '#4a1111'}
                  stroke={simState.ledOn && isRunning ? '#ff6666' : '#331111'} strokeWidth="1.5" />
                <line x1="80" y1="10" x2="80" y2="40" stroke={simState.ledOn && isRunning ? '#ff6666' : '#441111'} strokeWidth="2" />
                {simState.ledOn && isRunning && (
                  <circle cx="68" cy="25" r="18" fill="#ef4444" opacity="0.2" filter="url(#glow)">
                    <animate attributeName="r" values="18;28;18" dur="0.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.2;0.05;0.2" dur="0.8s" repeatCount="indefinite" />
                  </circle>
                )}
                <text x="60" y="58" textAnchor="middle" fill={simState.ledOn && isRunning ? '#ef4444' : '#777'}
                  fontSize="8" fontFamily="monospace" fontWeight="bold">
                  {simState.ledOn && isRunning ? 'ALERT!' : 'LED'}
                </text>
              </g>
              {/* Wire Pin D13 → LED */}
              <path d="M 498 214 Q 520 214 520 260 L 520 330 L 620 330"
                fill="none" stroke="#ef4444" strokeWidth="2"
                strokeDasharray={simState.ledOn && isRunning ? "4 2" : "none"}>
                {simState.ledOn && isRunning && <animate attributeName="stroke-dashoffset" values="0;-12" dur="0.5s" repeatCount="indefinite" />}
              </path>

              {/* === GROUND & 5V RAILS === */}
              <line x1="280" y1="400" x2="280" y2="470" stroke="#455A64" strokeWidth="3" />
              <text x="280" y="485" textAnchor="middle" fill="#78909C" fontSize="7" fontFamily="monospace">GND</text>
              <line x1="540" y1="400" x2="540" y2="470" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />
              <text x="540" y="485" textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace">5V</text>

              {/* === WIRE LEGEND === */}
              <g transform="translate(600, 420)">
                <text x="0" y="0" fill="#B0BEC5" fontSize="8" fontFamily="monospace" fontWeight="bold">Wiring:</text>
                {[
                  { color: '#f59e0b', label: 'DHT22 → D2' },
                  { color: '#eab308', label: 'LDR → A0' },
                  { color: '#06b6d4', label: 'Soil → A1' },
                  { color: '#a855f7', label: 'LCD → A4/A5' },
                  { color: '#ef4444', label: 'LED → D13' },
                ].map((w, i) => (
                  <g key={w.label}>
                    <line x1="0" y1={14 + i * 13} x2="18" y2={14 + i * 13} stroke={w.color} strokeWidth="2" />
                    <text x="24" y={18 + i * 13} fill="#9E9E9E" fontSize="7" fontFamily="monospace">{w.label}</text>
                  </g>
                ))}
              </g>

              {/* === POWER INDICATOR === */}
              <g transform="translate(15, 15)">
                <rect width="130" height="28" rx="14" fill={isActive ? '#052e16' : '#1c1c1c'} stroke={isActive ? '#22c55e' : '#444'} strokeWidth="1.5" />
                <circle cx="20" cy="14" r="5" fill={isActive ? '#22c55e' : '#555'} filter={isActive ? 'url(#glow)' : ''} />
                <text x="34" y="18" fill={isActive ? '#4ade80' : '#666'} fontSize="9" fontFamily="monospace" fontWeight="bold">
                  {isActive ? 'POWER ON' : 'POWER OFF'}
                </text>
              </g>
            </svg>
          </CardContent>
        </Card>

        {/* Right column: LCD + Readings + Serial */}
        <div className="space-y-4">
          {/* LCD Display */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">LCD Display (16×2 I2C)</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="bg-[#1a3800] rounded-lg p-3 border border-[#2a5000]">
                <div className={cn("rounded px-3 py-2 font-mono text-base tracking-wider leading-relaxed",
                  isActive ? "bg-[#C6FF00] text-[#1B5E20]" : "bg-[#33691E] text-[#2a4a10]")}>
                  <div>{simState.lcdLine1.padEnd(16)}</div>
                  <div>{simState.lcdLine2.padEnd(16)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live readings */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Live Sensor Readings</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: 'Temperature', value: `${simState.temperature.toFixed(1)}°C`, color: 'text-orange-400' },
                  { label: 'Humidity', value: `${simState.humidity}%`, color: 'text-blue-400' },
                  { label: 'Soil Moisture', value: `${simState.soilPercent}%`, color: 'text-cyan-400' },
                  { label: 'Light', value: `${simState.lightPercent}%`, color: 'text-yellow-400' },
                  { label: 'CO₂ (est.)', value: `${simState.co2} ppm`, color: 'text-green-400' },
                  { label: 'LED Alert', value: simState.ledOn && isRunning ? 'ON ⚠️' : 'OFF',
                    color: simState.ledOn && isRunning ? 'text-red-400' : 'text-muted-foreground' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center p-2 rounded bg-muted/50">
                    <span className="text-muted-foreground">{r.label}</span>
                    <span className={cn('font-mono font-bold', isActive ? r.color : 'text-muted-foreground')}>
                      {isActive ? r.value : '--'}
                    </span>
                  </div>
                ))}
              </div>
              {/* Raw analog values */}
              {isActive && (
                <div className="mt-2 p-2 rounded bg-muted/30 text-[10px] font-mono text-muted-foreground">
                  Raw: LDR(A0)={simState.ldrRaw} | Soil(A1)={simState.soilRaw}
                </div>
              )}
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
                {logs.map((log, i) => <div key={i} className="leading-tight">{log}</div>)}
                <div ref={logsEndRef} />
              </div>
            </CardContent>
          </Card>

          {/* Wokwi Embedded Simulation */}
          <Card className="border-primary/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex items-center justify-between">
                Wokwi Live Simulation
                <a href={WOKWI_URL} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-normal text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Full Screen
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="rounded-lg overflow-hidden border border-border bg-black">
                <iframe
                  src="https://wokwi.com/projects/444855832358838273"
                  title="Wokwi Smart Greenhouse Simulation"
                  className="w-full border-0"
                  style={{ height: '320px' }}
                  allow="fullscreen"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
                Press ▶ in Wokwi to start — outputs match this simulator
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
