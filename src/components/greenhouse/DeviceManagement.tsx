import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cpu, Plus, Trash2, Edit2, Wifi, WifiOff, Battery, 
  Clock, MapPin, RefreshCw, AlertTriangle, CheckCircle2,
  X, Copy, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIoTDevices, IoTDevice } from '@/hooks/useIoTDevices';
import { useToast } from '@/hooks/use-toast';

const deviceTypes = [
  { value: 'sensor', label: 'Environmental Sensor' },
  { value: 'camera', label: 'Camera' },
  { value: 'controller', label: 'Controller' },
  { value: 'actuator', label: 'Actuator' },
  { value: 'gateway', label: 'Gateway' },
];

function formatLastSeen(lastSeen: string | null): string {
  if (!lastSeen) return 'Never';
  
  const date = new Date(lastSeen);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

function DeviceCard({ device, onEdit, onDelete }: { 
  device: IoTDevice; 
  onEdit: (device: IoTDevice) => void;
  onDelete: (id: string) => void;
}) {
  const { toast } = useToast();
  
  const statusConfig = {
    online: { color: 'bg-success', icon: Wifi, text: 'Online' },
    offline: { color: 'bg-muted-foreground', icon: WifiOff, text: 'Offline' },
    error: { color: 'bg-destructive', icon: AlertTriangle, text: 'Error' },
  };
  
  const status = statusConfig[device.status] || statusConfig.offline;
  const StatusIcon = status.icon;
  
  const copyDeviceId = () => {
    navigator.clipboard.writeText(device.device_id);
    toast({
      title: 'Copied',
      description: 'Device ID copied to clipboard',
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel p-4 hover:border-primary/30 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${device.status === 'online' ? 'bg-success/10' : 'bg-muted'}`}>
            <Cpu className={`w-5 h-5 ${device.status === 'online' ? 'text-success' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{device.name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{device.device_id.slice(0, 12)}...</span>
              <button onClick={copyDeviceId} className="hover:text-primary">
                <Copy className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(device)}>
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(device.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Badge variant="outline" className="gap-1.5">
          <StatusIcon className="w-3 h-3" />
          {status.text}
        </Badge>
        <Badge variant="secondary">{device.device_type}</Badge>
        {device.firmware_version && (
          <Badge variant="outline" className="text-xs">v{device.firmware_version}</Badge>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{formatLastSeen(device.last_seen)}</span>
        </div>
        {device.battery_level !== null && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Battery className={`w-4 h-4 ${device.battery_level < 20 ? 'text-destructive' : device.battery_level < 50 ? 'text-warning' : 'text-success'}`} />
            <span>{device.battery_level}%</span>
          </div>
        )}
        {device.ip_address && (
          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
            <MapPin className="w-4 h-4" />
            <span className="font-mono text-xs">{device.ip_address}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface AddDeviceFormData {
  device_id: string;
  name: string;
  device_type: string;
}

export default function DeviceManagement() {
  const { devices, isLoading, addDevice, updateDevice, deleteDevice, refetch } = useIoTDevices();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<IoTDevice | null>(null);
  const [formData, setFormData] = useState<AddDeviceFormData>({
    device_id: '',
    name: '',
    device_type: 'sensor',
  });

  const onlineCount = devices.filter(d => d.status === 'online').length;
  const offlineCount = devices.filter(d => d.status === 'offline').length;
  const errorCount = devices.filter(d => d.status === 'error').length;

  const handleAddDevice = async () => {
    if (!formData.device_id || !formData.name) return;
    
    const result = await addDevice({
      device_id: formData.device_id,
      name: formData.name,
      device_type: formData.device_type,
    });
    
    if (result) {
      setIsAddDialogOpen(false);
      setFormData({ device_id: '', name: '', device_type: 'sensor' });
    }
  };

  const handleUpdateDevice = async () => {
    if (!editingDevice) return;
    
    await updateDevice(editingDevice.id, {
      name: formData.name,
      device_type: formData.device_type,
    });
    
    setEditingDevice(null);
    setFormData({ device_id: '', name: '', device_type: 'sensor' });
  };

  const handleEditClick = (device: IoTDevice) => {
    setEditingDevice(device);
    setFormData({
      device_id: device.device_id,
      name: device.name,
      device_type: device.device_type,
    });
  };

  const handleDeleteClick = async (id: string) => {
    if (confirm('Are you sure you want to remove this device?')) {
      await deleteDevice(id);
    }
  };

  const generateDeviceId = () => {
    const id = `DEV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setFormData(prev => ({ ...prev, device_id: id }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">IoT Device Management</h2>
          <p className="text-muted-foreground">Manage your connected sensors and devices</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register New Device</DialogTitle>
                <DialogDescription>
                  Add a new IoT device to your greenhouse monitoring system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="device_id">Device ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="device_id"
                      placeholder="e.g., DEV-ABC123"
                      value={formData.device_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, device_id: e.target.value }))}
                    />
                    <Button type="button" variant="outline" onClick={generateDeviceId}>
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unique identifier for your physical device
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Device Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Main Greenhouse Sensor"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device_type">Device Type</Label>
                  <Select
                    value={formData.device_type}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, device_type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {deviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddDevice} disabled={!formData.device_id || !formData.name}>
                  Add Device
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-success/10">
            <CheckCircle2 className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{onlineCount}</p>
            <p className="text-sm text-muted-foreground">Online</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <WifiOff className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{offlineCount}</p>
            <p className="text-sm text-muted-foreground">Offline</p>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-destructive/10">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{errorCount}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
        </div>
      </div>

      {/* API Integration Info */}
      <div className="glass-panel p-4 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <ExternalLink className="w-5 h-5 text-primary mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">IoT API Endpoint</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Send sensor data from your physical devices to this endpoint:
            </p>
            <code className="block bg-card p-3 rounded-lg text-xs font-mono break-all">
              POST https://tivanypjallbszrbyiuu.supabase.co/functions/v1/iot-sensor-ingest
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Include <code className="bg-muted px-1 rounded">device_id</code>, <code className="bg-muted px-1 rounded">user_id</code>, and sensor readings in the request body.
            </p>
          </div>
        </div>
      </div>

      {/* Devices Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : devices.length === 0 ? (
        <div className="glass-panel p-12 text-center">
          <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No devices registered</h3>
          <p className="text-muted-foreground mb-4">
            Add your first IoT sensor to start monitoring your greenhouse
          </p>
          <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add First Device
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingDevice} onOpenChange={(open) => !open && setEditingDevice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Device ID</Label>
              <Input value={formData.device_id} disabled className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_name">Device Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Device Type</Label>
              <Select
                value={formData.device_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, device_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {deviceTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingDevice(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateDevice}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
