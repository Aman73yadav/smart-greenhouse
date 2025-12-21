import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface IoTDevice {
  id: string;
  user_id: string;
  device_id: string;
  name: string;
  device_type: string;
  zone_id: string | null;
  status: 'online' | 'offline' | 'error';
  last_seen: string | null;
  firmware_version: string | null;
  battery_level: number | null;
  ip_address: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export function useIoTDevices() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [devices, setDevices] = useState<IoTDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDevices = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update status based on last_seen (offline if > 5 minutes)
      const updatedDevices: IoTDevice[] = (data || []).map(device => {
        const baseDevice: IoTDevice = {
          ...device,
          status: device.status as 'online' | 'offline' | 'error',
          metadata: (device.metadata as Record<string, unknown>) || null,
        };
        
        if (device.last_seen) {
          const lastSeenTime = new Date(device.last_seen).getTime();
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (lastSeenTime < fiveMinutesAgo && device.status === 'online') {
            return { ...baseDevice, status: 'offline' as const };
          }
        }
        return baseDevice;
      });
      
      setDevices(updatedDevices);
    } catch (err: any) {
      console.error('Error fetching devices:', err);
      toast({
        title: 'Error',
        description: 'Failed to load IoT devices',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addDevice = async (device: {
    device_id: string;
    name: string;
    device_type?: string;
    zone_id?: string;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .insert({
          user_id: user.id,
          device_id: device.device_id,
          name: device.name,
          device_type: device.device_type || 'sensor',
          zone_id: device.zone_id || null,
          status: 'offline',
        })
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => [data as IoTDevice, ...prev]);
      toast({
        title: 'Device Added',
        description: `${device.name} has been registered successfully`,
      });
      return data;
    } catch (err: any) {
      console.error('Error adding device:', err);
      toast({
        title: 'Error',
        description: err.message?.includes('duplicate') 
          ? 'A device with this ID already exists' 
          : 'Failed to add device',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateDevice = async (id: string, updates: Partial<Omit<IoTDevice, 'metadata'>> & { metadata?: Record<string, unknown> | null }) => {
    try {
      const { data, error } = await supabase
        .from('iot_devices')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => prev.map(d => d.id === id ? data as IoTDevice : d));
      toast({
        title: 'Device Updated',
        description: 'Device settings have been saved',
      });
      return data;
    } catch (err: any) {
      console.error('Error updating device:', err);
      toast({
        title: 'Error',
        description: 'Failed to update device',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteDevice = async (id: string) => {
    try {
      const { error } = await supabase
        .from('iot_devices')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDevices(prev => prev.filter(d => d.id !== id));
      toast({
        title: 'Device Removed',
        description: 'Device has been unregistered',
      });
      return true;
    } catch (err: any) {
      console.error('Error deleting device:', err);
      toast({
        title: 'Error',
        description: 'Failed to remove device',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('iot-devices-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'iot_devices',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Device update:', payload);
          if (payload.eventType === 'UPDATE') {
            setDevices(prev => prev.map(d => 
              d.id === payload.new.id ? payload.new as IoTDevice : d
            ));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    devices,
    isLoading,
    addDevice,
    updateDevice,
    deleteDevice,
    refetch: fetchDevices,
  };
}
