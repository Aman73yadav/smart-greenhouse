import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Droplets, 
  Lightbulb, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X,
  Calendar,
  Repeat,
  MapPin,
  Power,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Schedule {
  id: string;
  name: string;
  zoneId: string;
  type: 'irrigation' | 'lighting';
  startTime: string;
  endTime: string;
  duration: number; // minutes
  days: string[];
  enabled: boolean;
  intensity: number; // percentage
}

interface Zone {
  id: string;
  name: string;
  color: string;
  plants: string[];
}

const initialZones: Zone[] = [
  { id: 'zone-a', name: 'Zone A - Tomatoes', color: 'bg-red-500', plants: ['Cherry Tomatoes', 'Roma Tomatoes'] },
  { id: 'zone-b', name: 'Zone B - Leafy Greens', color: 'bg-green-500', plants: ['Lettuce', 'Spinach', 'Kale'] },
  { id: 'zone-c', name: 'Zone C - Root Vegetables', color: 'bg-orange-500', plants: ['Carrots', 'Radishes'] },
  { id: 'zone-d', name: 'Zone D - Fruits', color: 'bg-pink-500', plants: ['Strawberries', 'Peppers'] },
];

const initialSchedules: Schedule[] = [
  {
    id: '1',
    name: 'Morning Irrigation',
    zoneId: 'zone-a',
    type: 'irrigation',
    startTime: '06:00',
    endTime: '06:30',
    duration: 30,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    enabled: true,
    intensity: 75,
  },
  {
    id: '2',
    name: 'Grow Lights Schedule',
    zoneId: 'zone-b',
    type: 'lighting',
    startTime: '05:00',
    endTime: '20:00',
    duration: 900,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    enabled: true,
    intensity: 80,
  },
  {
    id: '3',
    name: 'Evening Watering',
    zoneId: 'zone-c',
    type: 'irrigation',
    startTime: '18:00',
    endTime: '18:20',
    duration: 20,
    days: ['Mon', 'Wed', 'Fri'],
    enabled: false,
    intensity: 50,
  },
];

const allDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface ScheduleCardProps {
  schedule: Schedule;
  zone: Zone | undefined;
  onToggle: (id: string) => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
}

function ScheduleCard({ schedule, zone, onToggle, onEdit, onDelete }: ScheduleCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={cn(
        "glass-panel overflow-hidden transition-all",
        schedule.enabled ? "border-primary/30" : "opacity-70"
      )}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-xl",
              schedule.type === 'irrigation' 
                ? "bg-gradient-to-br from-blue-500 to-cyan-500" 
                : "bg-gradient-to-br from-yellow-500 to-amber-500"
            )}>
              {schedule.type === 'irrigation' 
                ? <Droplets className="w-5 h-5 text-primary-foreground" />
                : <Lightbulb className="w-5 h-5 text-primary-foreground" />
              }
            </div>
            <div>
              <h4 className="font-medium text-foreground">{schedule.name}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{schedule.startTime} - {schedule.endTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={schedule.enabled}
              onCheckedChange={() => onToggle(schedule.id)}
            />
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Zone & Days Preview */}
        <div className="mt-3 flex items-center gap-4 flex-wrap">
          {zone && (
            <div className="flex items-center gap-1.5 text-sm">
              <div className={cn("w-2 h-2 rounded-full", zone.color)} />
              <span className="text-muted-foreground">{zone.name}</span>
            </div>
          )}
          <div className="flex gap-1">
            {allDays.map(day => (
              <span
                key={day}
                className={cn(
                  "w-6 h-6 flex items-center justify-center text-[10px] font-medium rounded",
                  schedule.days.includes(day)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {day.charAt(0)}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-muted-foreground">Duration</span>
                  <p className="font-medium text-foreground">{schedule.duration} minutes</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Intensity</span>
                  <p className="font-medium text-foreground">{schedule.intensity}%</p>
                </div>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block mb-2">Active Days</span>
                <div className="flex gap-2 flex-wrap">
                  {schedule.days.map(day => (
                    <span
                      key={day}
                      className="px-2 py-1 text-xs font-medium bg-primary/20 text-primary rounded"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onEdit(schedule)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(schedule.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive text-sm font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface ScheduleFormProps {
  schedule?: Schedule | null;
  zones: Zone[];
  onSave: (schedule: Omit<Schedule, 'id'>) => void;
  onCancel: () => void;
}

function ScheduleForm({ schedule, zones, onSave, onCancel }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    name: schedule?.name || '',
    zoneId: schedule?.zoneId || zones[0]?.id || '',
    type: schedule?.type || 'irrigation' as 'irrigation' | 'lighting',
    startTime: schedule?.startTime || '06:00',
    endTime: schedule?.endTime || '06:30',
    duration: schedule?.duration || 30,
    days: schedule?.days || ['Mon', 'Wed', 'Fri'],
    enabled: schedule?.enabled ?? true,
    intensity: schedule?.intensity || 75,
  });

  const toggleDay = (day: string) => {
    setFormData(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onSubmit={handleSubmit}
      className="glass-panel p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-semibold text-foreground">
          {schedule ? 'Edit Schedule' : 'New Schedule'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 hover:bg-muted rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Schedule Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Morning Irrigation"
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        {/* Type Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Schedule Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['irrigation', 'lighting'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type }))}
                className={cn(
                  "flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all",
                  formData.type === type
                    ? type === 'irrigation'
                      ? "bg-gradient-to-br from-blue-500 to-cyan-500 text-primary-foreground"
                      : "bg-gradient-to-br from-yellow-500 to-amber-500 text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {type === 'irrigation' ? <Droplets className="w-4 h-4" /> : <Lightbulb className="w-4 h-4" />}
                {type === 'irrigation' ? 'Irrigation' : 'Lighting'}
              </button>
            ))}
          </div>
        </div>

        {/* Zone Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Zone</label>
          <select
            value={formData.zoneId}
            onChange={e => setFormData(prev => ({ ...prev, zoneId: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {zones.map(zone => (
              <option key={zone.id} value={zone.id}>{zone.name}</option>
            ))}
          </select>
        </div>

        {/* Time Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Start Time</label>
            <input
              type="time"
              value={formData.startTime}
              onChange={e => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">End Time</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={e => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Intensity */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 flex justify-between">
            <span>Intensity</span>
            <span className="text-primary">{formData.intensity}%</span>
          </label>
          <input
            type="range"
            min="10"
            max="100"
            value={formData.intensity}
            onChange={e => setFormData(prev => ({ ...prev, intensity: parseInt(e.target.value) }))}
            className="w-full accent-primary"
          />
        </div>

        {/* Days Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Active Days</label>
          <div className="flex gap-2">
            {allDays.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                  formData.days.includes(day)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4" />
          {schedule ? 'Update' : 'Create'} Schedule
        </button>
      </div>
    </motion.form>
  );
}

export default function SchedulingSystem() {
  const [zones] = useState<Zone[]>(initialZones);
  const [schedules, setSchedules] = useState<Schedule[]>(initialSchedules);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [filterZone, setFilterZone] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'irrigation' | 'lighting'>('all');
  const { toast } = useToast();

  const filteredSchedules = schedules.filter(schedule => {
    if (filterZone !== 'all' && schedule.zoneId !== filterZone) return false;
    if (filterType !== 'all' && schedule.type !== filterType) return false;
    return true;
  });

  const toggleSchedule = (id: string) => {
    setSchedules(prev => prev.map(s => 
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    const schedule = schedules.find(s => s.id === id);
    toast({
      title: schedule?.enabled ? 'Schedule Disabled' : 'Schedule Enabled',
      description: `${schedule?.name} has been ${schedule?.enabled ? 'disabled' : 'enabled'}`,
    });
  };

  const deleteSchedule = (id: string) => {
    const schedule = schedules.find(s => s.id === id);
    setSchedules(prev => prev.filter(s => s.id !== id));
    toast({
      title: 'Schedule Deleted',
      description: `${schedule?.name} has been removed`,
    });
  };

  const saveSchedule = (data: Omit<Schedule, 'id'>) => {
    if (editingSchedule) {
      setSchedules(prev => prev.map(s => 
        s.id === editingSchedule.id ? { ...data, id: s.id } : s
      ));
      toast({
        title: 'Schedule Updated',
        description: `${data.name} has been updated successfully`,
      });
    } else {
      const newSchedule: Schedule = {
        ...data,
        id: Date.now().toString(),
      };
      setSchedules(prev => [...prev, newSchedule]);
      toast({
        title: 'Schedule Created',
        description: `${data.name} has been created successfully`,
      });
    }
    setShowForm(false);
    setEditingSchedule(null);
  };

  const activeCount = schedules.filter(s => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Scheduling System</h2>
          <p className="text-sm text-muted-foreground">
            {activeCount} active schedule{activeCount !== 1 ? 's' : ''} across {zones.length} zones
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => { setShowForm(true); setEditingSchedule(null); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium"
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </motion.button>
      </div>

      {/* Zone Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map(zone => {
          const zoneSchedules = schedules.filter(s => s.zoneId === zone.id);
          const activeZoneSchedules = zoneSchedules.filter(s => s.enabled);
          
          return (
            <motion.div
              key={zone.id}
              whileHover={{ y: -4 }}
              className={cn(
                "glass-panel p-4 cursor-pointer transition-all",
                filterZone === zone.id && "ring-2 ring-primary"
              )}
              onClick={() => setFilterZone(filterZone === zone.id ? 'all' : zone.id)}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-3 h-3 rounded-full", zone.color)} />
                <span className="font-medium text-foreground text-sm">{zone.name.split(' - ')[0]}</span>
              </div>
              <p className="text-2xl font-display font-bold text-foreground">
                {activeZoneSchedules.length}/{zoneSchedules.length}
              </p>
              <p className="text-xs text-muted-foreground">Active schedules</p>
              <div className="mt-2 flex gap-1 flex-wrap">
                {zone.plants.slice(0, 2).map(plant => (
                  <span key={plant} className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    {plant}
                  </span>
                ))}
                {zone.plants.length > 2 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                    +{zone.plants.length - 2}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType('all')}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            filterType === 'all' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          All Types
        </button>
        <button
          onClick={() => setFilterType('irrigation')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            filterType === 'irrigation' ? "bg-blue-500 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Droplets className="w-4 h-4" />
          Irrigation
        </button>
        <button
          onClick={() => setFilterType('lighting')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            filterType === 'lighting' ? "bg-amber-500 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Lightbulb className="w-4 h-4" />
          Lighting
        </button>
        {filterZone !== 'all' && (
          <button
            onClick={() => setFilterZone('all')}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium"
          >
            <X className="w-3 h-3" />
            Clear zone filter
          </button>
        )}
      </div>

      {/* Schedule Form */}
      <AnimatePresence>
        {showForm && (
          <ScheduleForm
            schedule={editingSchedule}
            zones={zones}
            onSave={saveSchedule}
            onCancel={() => { setShowForm(false); setEditingSchedule(null); }}
          />
        )}
      </AnimatePresence>

      {/* Schedules List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredSchedules.map(schedule => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              zone={zones.find(z => z.id === schedule.zoneId)}
              onToggle={toggleSchedule}
              onEdit={(s) => { setEditingSchedule(s); setShowForm(true); }}
              onDelete={deleteSchedule}
            />
          ))}
        </AnimatePresence>

        {filteredSchedules.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No schedules found</h3>
            <p className="text-muted-foreground mb-4">
              {filterZone !== 'all' || filterType !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first schedule to automate your greenhouse'}
            </p>
            <button
              onClick={() => { setShowForm(true); setEditingSchedule(null); }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium"
            >
              <Plus className="w-4 h-4" />
              Create Schedule
            </button>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="glass-panel p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setSchedules(prev => prev.map(s => ({ ...s, enabled: true })));
              toast({ title: 'All Schedules Enabled' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success/10 text-success text-sm font-medium hover:bg-success/20 transition-colors"
          >
            <Power className="w-4 h-4" />
            Enable All
          </button>
          <button
            onClick={() => {
              setSchedules(prev => prev.map(s => ({ ...s, enabled: false })));
              toast({ title: 'All Schedules Disabled' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <Power className="w-4 h-4" />
            Disable All
          </button>
          <button
            onClick={() => {
              setSchedules(prev => prev.map(s => 
                s.type === 'irrigation' ? { ...s, enabled: true } : s
              ));
              toast({ title: 'All Irrigation Schedules Enabled' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors"
          >
            <Droplets className="w-4 h-4" />
            Enable Irrigation
          </button>
          <button
            onClick={() => {
              setSchedules(prev => prev.map(s => 
                s.type === 'lighting' ? { ...s, enabled: true } : s
              ));
              toast({ title: 'All Lighting Schedules Enabled' });
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-medium hover:bg-amber-500/20 transition-colors"
          >
            <Lightbulb className="w-4 h-4" />
            Enable Lighting
          </button>
        </div>
      </div>
    </div>
  );
}
