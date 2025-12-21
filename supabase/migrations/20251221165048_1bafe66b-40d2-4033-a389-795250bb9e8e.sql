-- Create IoT devices table
CREATE TABLE public.iot_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  device_type TEXT DEFAULT 'sensor',
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
  last_seen TIMESTAMP WITH TIME ZONE,
  firmware_version TEXT,
  battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
  ip_address TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.iot_devices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own devices" 
ON public.iot_devices FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own devices" 
ON public.iot_devices FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own devices" 
ON public.iot_devices FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own devices" 
ON public.iot_devices FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_iot_devices_updated_at
BEFORE UPDATE ON public.iot_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_iot_devices_device_id ON public.iot_devices(device_id);
CREATE INDEX idx_iot_devices_user_id ON public.iot_devices(user_id);
CREATE INDEX idx_iot_devices_status ON public.iot_devices(status);