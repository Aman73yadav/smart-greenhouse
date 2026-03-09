import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Cpu, Copy, Check, Wifi, Zap, Code2, 
  Terminal, RefreshCw, ExternalLink, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

function generateDeviceId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'wokwi-';
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Code copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={copy} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors" title="Copy">
      {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
    </button>
  );
}

function CollapsibleSection({ title, icon, children, defaultOpen = false }: { 
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean 
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass-panel overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-display font-semibold text-foreground">{title}</span>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-border pt-4">{children}</div>}
    </div>
  );
}

export default function WokwiGuide() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deviceId, setDeviceId] = useState(generateDeviceId());
  const { toast } = useToast();

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/iot-sensor-ingest`;
  const userId = user?.id || 'YOUR_USER_ID';

  const arduinoCode = `#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

// WiFi credentials (Wokwi uses "Wokwi-GUEST" with no password)
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// GreenHouse API configuration
const char* API_URL = "${apiUrl}";
const char* USER_ID = "${userId}";
const char* DEVICE_ID = "${deviceId}";

// Sensor pins (adjust for your Wokwi circuit)
const int TEMP_PIN = 34;      // Analog temperature sensor
const int HUMIDITY_PIN = 35;  // Analog humidity sensor
const int MOISTURE_PIN = 32;  // Soil moisture sensor
const int LDR_PIN = 33;       // Light sensor (LDR)

unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL = 10000; // Send every 10 seconds

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
  Serial.println("IP: " + WiFi.localIP().toString());
}

void loop() {
  if (millis() - lastSendTime >= SEND_INTERVAL) {
    sendSensorData();
    lastSendTime = millis();
  }
}

void sendSensorData() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected! Reconnecting...");
    WiFi.reconnect();
    return;
  }

  // Read sensors (map to realistic ranges)
  float temperature = map(analogRead(TEMP_PIN), 0, 4095, 150, 400) / 10.0;
  float humidity = map(analogRead(HUMIDITY_PIN), 0, 4095, 200, 950) / 10.0;
  float moisture = map(analogRead(MOISTURE_PIN), 0, 4095, 0, 1000) / 10.0;
  float lightLevel = map(analogRead(LDR_PIN), 0, 4095, 0, 10000) / 10.0;

  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["user_id"] = USER_ID;
  doc["device_id"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["moisture"] = moisture;
  doc["light_level"] = lightLevel;

  String jsonStr;
  serializeJson(doc, jsonStr);

  // Send HTTP POST
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Content-Type", "application/json");
  
  int httpCode = http.POST(jsonStr);
  
  if (httpCode > 0) {
    Serial.printf("Data sent! HTTP %d\\n", httpCode);
    Serial.println("Response: " + http.getString());
  } else {
    Serial.printf("Error: %s\\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}`;

  const jsonPayload = `{
  "user_id": "${userId}",
  "device_id": "${deviceId}",
  "temperature": 24.5,
  "humidity": 65.0,
  "moisture": 72.0,
  "light_level": 850.0
}`;

  const curlExample = `curl -X POST "${apiUrl}" \\
  -H "Content-Type: application/json" \\
  -d '${jsonPayload.replace(/\n/g, '').replace(/  /g, '')}'`;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 glass-panel-strong px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-info to-primary">
              <Cpu className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">Wokwi Connection Guide</h1>
              <p className="text-xs text-muted-foreground">Connect your IoT simulator to GreenHouse Pro</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Device ID Generator */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-warning" />
            <h2 className="text-xl font-display font-bold text-foreground">Device ID Generator</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a unique device ID for your Wokwi simulator. Use this ID when registering the device in the Devices tab.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border font-mono text-foreground text-sm">
              {deviceId}
            </div>
            <CopyButton text={deviceId} />
            <button
              onClick={() => {
                setDeviceId(generateDeviceId());
                toast({ title: 'New ID generated!' });
              }}
              className="p-3 rounded-xl bg-primary hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-primary-foreground" />
            </button>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-info/10 border border-info/20">
            <p className="text-xs text-info">
              <strong>Your User ID:</strong>{' '}
              <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs">{userId}</code>
            </p>
          </div>
        </motion.div>

        {/* API Endpoint */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <div className="flex items-center gap-3 mb-4">
            <Wifi className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-bold text-foreground">API Endpoint</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-xl bg-muted border border-border font-mono text-xs text-foreground break-all">
              POST {apiUrl}
            </div>
            <CopyButton text={apiUrl} />
          </div>
        </motion.div>

        {/* Steps */}
        <CollapsibleSection title="Step 1: Set Up Wokwi Project" icon={<ExternalLink className="w-5 h-5 text-accent" />} defaultOpen>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
              <span>Go to <a href="https://wokwi.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">wokwi.com</a> and create a new ESP32 project.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
              <span>Add sensors to your circuit: DHT22 (temp/humidity), soil moisture sensor, and an LDR (light).</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">3</span>
              <span>Copy the Arduino code from Step 2 below into your Wokwi sketch.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">4</span>
              <span>Add the <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">ArduinoJson</code> library in Wokwi's Library Manager.</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">5</span>
              <span>Run the simulation — data will stream to your GreenHouse dashboard automatically!</span>
            </li>
          </ol>
        </CollapsibleSection>

        <CollapsibleSection title="Step 2: Arduino Code (ESP32)" icon={<Code2 className="w-5 h-5 text-secondary" />} defaultOpen>
          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={arduinoCode} />
            </div>
            <pre className="p-4 rounded-xl bg-muted border border-border overflow-x-auto text-xs font-mono text-foreground max-h-[500px] overflow-y-auto">
              {arduinoCode}
            </pre>
          </div>
          <div className="mt-4 p-3 rounded-xl bg-warning/10 border border-warning/20">
            <p className="text-xs text-warning">
              <strong>Note:</strong> Wokwi uses <code className="px-1 rounded bg-muted font-mono">"Wokwi-GUEST"</code> as WiFi SSID with no password. The code is pre-configured for this.
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Step 3: JSON Payload Format" icon={<Terminal className="w-5 h-5 text-info" />}>
          <p className="text-sm text-muted-foreground mb-3">Your device will send data in this format:</p>
          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={jsonPayload} />
            </div>
            <pre className="p-4 rounded-xl bg-muted border border-border overflow-x-auto text-xs font-mono text-foreground">
              {jsonPayload}
            </pre>
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Test with cURL" icon={<Terminal className="w-5 h-5 text-accent" />}>
          <p className="text-sm text-muted-foreground mb-3">Test your endpoint before using Wokwi:</p>
          <div className="relative">
            <div className="absolute top-3 right-3 z-10">
              <CopyButton text={curlExample} />
            </div>
            <pre className="p-4 rounded-xl bg-muted border border-border overflow-x-auto text-xs font-mono text-foreground">
              {curlExample}
            </pre>
          </div>
        </CollapsibleSection>

        {/* Register Device CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-panel p-6 border-primary/30 bg-primary/5">
          <h3 className="font-display font-bold text-foreground mb-2">Ready to connect?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Register your device ID <code className="px-1.5 py-0.5 rounded bg-muted font-mono text-xs text-foreground">{deviceId}</code> in the Devices tab to start receiving data.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Go to Devices →
          </button>
        </motion.div>
      </div>
    </div>
  );
}
