import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Droplets, 
  Lightbulb,
  Calendar as CalendarIcon,
  Grid3X3,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';

interface Schedule {
  id: string;
  name: string;
  zone_id: string | null;
  type: 'irrigation' | 'lighting';
  start_time: string;
  end_time: string;
  days: string[];
  enabled: boolean;
  intensity: number;
}

interface Zone {
  id: string;
  name: string;
  color: string;
}

interface ScheduleCalendarProps {
  schedules: Schedule[];
  zones: Zone[];
}

const dayMap: { [key: string]: number } = {
  'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
};

export default function ScheduleCalendar({ schedules, zones }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const getSchedulesForDay = (date: Date) => {
    const dayName = format(date, 'EEE');
    return schedules.filter(schedule => 
      schedule.enabled && schedule.days.includes(dayName)
    );
  };

  const calendarDays = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(monthStart);
      const startDate = startOfWeek(monthStart);
      const endDate = endOfWeek(monthEnd);
      
      const days: Date[] = [];
      let day = startDate;
      
      while (day <= endDate) {
        days.push(day);
        day = addDays(day, 1);
      }
      
      return days;
    } else {
      const weekStart = startOfWeek(currentDate);
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(addDays(weekStart, i));
      }
      return days;
    }
  }, [currentDate, viewMode]);

  const navigatePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, -7));
    }
  };

  const navigateNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addDays(currentDate, 7));
    }
  };

  const getZone = (zoneId: string | null) => zones.find(z => z.id === zoneId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Schedule Calendar</h2>
          <p className="text-sm text-muted-foreground">View all irrigation and lighting events</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setViewMode('month')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'month' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'week' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <button
            onClick={navigatePrev}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-display font-semibold text-foreground">
            {viewMode === 'month' 
              ? format(currentDate, 'MMMM yyyy')
              : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
            }
          </h3>
          <button
            onClick={navigateNext}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className={cn(
          "grid grid-cols-7",
          viewMode === 'week' ? "" : ""
        )}>
          {calendarDays.map((day, index) => {
            const daySchedules = getSchedulesForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <motion.div
                key={day.toISOString()}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.01 }}
                className={cn(
                  "min-h-[120px] p-2 border-b border-r border-border",
                  !isCurrentMonth && viewMode === 'month' && "bg-muted/30",
                  isToday && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-2",
                  isToday && "text-primary",
                  !isCurrentMonth && viewMode === 'month' && "text-muted-foreground"
                )}>
                  {format(day, 'd')}
                </div>
                
                <div className="space-y-1">
                  {daySchedules.slice(0, 3).map(schedule => {
                    const zone = getZone(schedule.zone_id);
                    return (
                      <motion.div
                        key={schedule.id}
                        whileHover={{ scale: 1.02 }}
                        className={cn(
                          "text-[10px] p-1 px-1.5 rounded flex items-center gap-1 truncate cursor-pointer",
                          schedule.type === 'irrigation' 
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-yellow-500/20 text-yellow-400"
                        )}
                      >
                        {schedule.type === 'irrigation' 
                          ? <Droplets className="w-2.5 h-2.5 flex-shrink-0" />
                          : <Lightbulb className="w-2.5 h-2.5 flex-shrink-0" />
                        }
                        <span className="truncate">{schedule.start_time}</span>
                      </motion.div>
                    );
                  })}
                  {daySchedules.length > 3 && (
                    <div className="text-[10px] text-muted-foreground pl-1">
                      +{daySchedules.length - 3} more
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-500/30" />
          <span className="text-sm text-muted-foreground">Irrigation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-yellow-500/30" />
          <span className="text-sm text-muted-foreground">Lighting</span>
        </div>
      </div>

      {/* Upcoming today */}
      <div className="glass-panel p-4">
        <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-primary" />
          Today's Schedule
        </h4>
        <div className="space-y-2">
          {getSchedulesForDay(new Date()).length === 0 ? (
            <p className="text-sm text-muted-foreground">No schedules for today</p>
          ) : (
            getSchedulesForDay(new Date()).map(schedule => {
              const zone = getZone(schedule.zone_id);
              return (
                <div 
                  key={schedule.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      schedule.type === 'irrigation' 
                        ? "bg-blue-500/20"
                        : "bg-yellow-500/20"
                    )}>
                      {schedule.type === 'irrigation' 
                        ? <Droplets className="w-4 h-4 text-blue-400" />
                        : <Lightbulb className="w-4 h-4 text-yellow-400" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{schedule.name}</p>
                      {zone && (
                        <p className="text-xs text-muted-foreground">{zone.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">
                      {schedule.start_time} - {schedule.end_time}
                    </p>
                    <p className="text-xs text-muted-foreground">{schedule.intensity}% intensity</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
