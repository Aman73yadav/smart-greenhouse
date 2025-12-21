import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-api-key",
};

interface SensorPayload {
  device_id: string;
  user_id: string;
  zone_id?: string;
  temperature?: number;
  humidity?: number;
  moisture?: number;
  light_level?: number;
  timestamp?: string;
  battery_level?: number;
  firmware_version?: string;
}

interface BatchPayload {
  readings: SensorPayload[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body = await req.json();
    console.log("Received IoT sensor data:", JSON.stringify(body));

    // Support both single reading and batch readings
    const readings: SensorPayload[] = body.readings ? body.readings : [body];

    if (readings.length === 0) {
      return new Response(
        JSON.stringify({ error: "No sensor readings provided" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Track devices that sent data
    const deviceUpdates: Map<string, { user_id: string; battery_level?: number; firmware_version?: string }> = new Map();

    // Validate and prepare readings for insertion
    const validReadings = readings.map((reading: SensorPayload) => {
      if (!reading.user_id) {
        throw new Error("user_id is required for each reading");
      }

      // Track device for last_seen update
      if (reading.device_id) {
        deviceUpdates.set(reading.device_id, {
          user_id: reading.user_id,
          battery_level: reading.battery_level,
          firmware_version: reading.firmware_version,
        });
      }

      return {
        user_id: reading.user_id,
        zone_id: reading.zone_id || null,
        temperature: reading.temperature ?? null,
        humidity: reading.humidity ?? null,
        moisture: reading.moisture ?? null,
        light_level: reading.light_level ?? null,
        recorded_at: reading.timestamp || new Date().toISOString(),
      };
    });

    console.log(`Processing ${validReadings.length} sensor readings from ${deviceUpdates.size} devices`);

    // Insert sensor readings
    const { data, error } = await supabase
      .from("sensor_readings")
      .insert(validReadings)
      .select();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Successfully inserted ${data.length} readings`);

    // Update device last_seen timestamps
    for (const [deviceId, deviceData] of deviceUpdates) {
      await updateDeviceStatus(supabase, deviceId, deviceData);
    }

    // Check for threshold alerts
    for (const reading of validReadings) {
      await checkThresholdAlerts(supabase, reading);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${data.length} sensor readings`,
        readings: data,
        devices_updated: deviceUpdates.size,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error processing IoT sensor data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Update device status and last_seen timestamp
async function updateDeviceStatus(
  supabase: any, 
  deviceId: string, 
  deviceData: { user_id: string; battery_level?: number; firmware_version?: string }
) {
  try {
    const updateData: any = {
      last_seen: new Date().toISOString(),
      status: 'online',
    };

    if (deviceData.battery_level !== undefined) {
      updateData.battery_level = deviceData.battery_level;
    }
    if (deviceData.firmware_version) {
      updateData.firmware_version = deviceData.firmware_version;
    }

    const { error } = await supabase
      .from("iot_devices")
      .update(updateData)
      .eq("device_id", deviceId);

    if (error) {
      // Device might not be registered yet - that's okay
      console.log(`Device ${deviceId} not found or update failed:`, error.message);
    } else {
      console.log(`Updated device ${deviceId} last_seen`);
    }
  } catch (err) {
    console.error(`Error updating device ${deviceId}:`, err);
  }
}

// Check if any thresholds are exceeded and trigger notifications
async function checkThresholdAlerts(supabase: any, reading: any) {
  try {
    // Get alert settings for this user
    const { data: alertSettings, error } = await supabase
      .from("alert_settings")
      .select("*")
      .eq("user_id", reading.user_id);

    if (error || !alertSettings) return;

    for (const setting of alertSettings) {
      let currentValue: number | null = null;
      
      switch (setting.metric) {
        case "temperature":
          currentValue = reading.temperature;
          break;
        case "humidity":
          currentValue = reading.humidity;
          break;
        case "moisture":
          currentValue = reading.moisture;
          break;
        case "light_level":
          currentValue = reading.light_level;
          break;
      }

      if (currentValue === null) continue;

      // Check min threshold
      if (setting.min_threshold !== null && currentValue < setting.min_threshold) {
        console.log(`Alert: ${setting.metric} below minimum threshold (${currentValue} < ${setting.min_threshold})`);
      }

      // Check max threshold
      if (setting.max_threshold !== null && currentValue > setting.max_threshold) {
        console.log(`Alert: ${setting.metric} above maximum threshold (${currentValue} > ${setting.max_threshold})`);
      }
    }
  } catch (err) {
    console.error("Error checking thresholds:", err);
  }
}

serve(handler);
