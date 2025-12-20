import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SensorData {
  temperature: number;
  humidity: number;
  moisture: number;
  lightLevel: number;
  co2: number;
  recordedAt: string;
  zoneId: string | null;
}

interface SensorReading {
  id: string;
  user_id: string;
  zone_id: string | null;
  temperature: number | null;
  humidity: number | null;
  moisture: number | null;
  light_level: number | null;
  recorded_at: string;
}

const defaultSensorData: SensorData = {
  temperature: 24.5,
  humidity: 68,
  moisture: 72,
  lightLevel: 850,
  co2: 420,
  recordedAt: new Date().toISOString(),
  zoneId: null,
};

export function useRealtimeSensors() {
  const { user } = useAuth();
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [trend, setTrend] = useState<{
    temperature: 'up' | 'down' | 'stable';
    humidity: 'up' | 'down' | 'stable';
    moisture: 'up' | 'down' | 'stable';
    lightLevel: 'up' | 'down' | 'stable';
    co2: 'up' | 'down' | 'stable';
  }>({
    temperature: 'stable',
    humidity: 'stable',
    moisture: 'stable',
    lightLevel: 'stable',
    co2: 'stable',
  });

  // Fetch latest sensor reading
  const fetchLatestReading = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('sensor_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching sensor data:', error);
        return;
      }

      if (data) {
        updateSensorData(data);
      }
    } catch (err) {
      console.error('Failed to fetch sensor readings:', err);
    }
  };

  // Calculate trend based on value change
  const calculateTrend = (oldValue: number, newValue: number): 'up' | 'down' | 'stable' => {
    const threshold = 0.5;
    const diff = newValue - oldValue;
    if (Math.abs(diff) < threshold) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  // Update sensor data with trends
  const updateSensorData = (reading: SensorReading) => {
    setSensorData((prev) => {
      const newData: SensorData = {
        temperature: reading.temperature ?? prev.temperature,
        humidity: reading.humidity ?? prev.humidity,
        moisture: reading.moisture ?? prev.moisture,
        lightLevel: reading.light_level ?? prev.lightLevel,
        co2: prev.co2, // CO2 not in DB, keep simulated
        recordedAt: reading.recorded_at,
        zoneId: reading.zone_id,
      };

      // Update trends
      setTrend({
        temperature: calculateTrend(prev.temperature, newData.temperature),
        humidity: calculateTrend(prev.humidity, newData.humidity),
        moisture: calculateTrend(prev.moisture, newData.moisture),
        lightLevel: calculateTrend(prev.lightLevel, newData.lightLevel),
        co2: 'stable',
      });

      return newData;
    });

    setLastUpdate(new Date());
  };

  // Set up real-time subscription
  useEffect(() => {
    if (!user) {
      setIsConnected(false);
      return;
    }

    // Fetch initial data
    fetchLatestReading();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sensor-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sensor_readings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Real-time sensor update received:', payload);
          updateSensorData(payload.new as SensorReading);
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Simulate sensor updates for demo (when no real IoT data)
  useEffect(() => {
    if (!user) return;

    const simulateUpdates = setInterval(() => {
      setSensorData((prev) => {
        const fluctuate = (value: number, range: number) => {
          const change = (Math.random() - 0.5) * range;
          return Math.round((value + change) * 10) / 10;
        };

        const newTemp = Math.max(18, Math.min(35, fluctuate(prev.temperature, 0.5)));
        const newHumidity = Math.max(30, Math.min(95, fluctuate(prev.humidity, 2)));
        const newMoisture = Math.max(40, Math.min(90, fluctuate(prev.moisture, 1.5)));
        const newLight = Math.max(200, Math.min(1500, fluctuate(prev.lightLevel, 50)));
        const newCo2 = Math.max(300, Math.min(700, fluctuate(prev.co2, 10)));

        setTrend({
          temperature: calculateTrend(prev.temperature, newTemp),
          humidity: calculateTrend(prev.humidity, newHumidity),
          moisture: calculateTrend(prev.moisture, newMoisture),
          lightLevel: calculateTrend(prev.lightLevel, newLight),
          co2: calculateTrend(prev.co2, newCo2),
        });

        return {
          ...prev,
          temperature: newTemp,
          humidity: newHumidity,
          moisture: newMoisture,
          lightLevel: newLight,
          co2: newCo2,
          recordedAt: new Date().toISOString(),
        };
      });

      setLastUpdate(new Date());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(simulateUpdates);
  }, [user]);

  return {
    sensorData,
    trend,
    isConnected,
    lastUpdate,
    refetch: fetchLatestReading,
  };
}
