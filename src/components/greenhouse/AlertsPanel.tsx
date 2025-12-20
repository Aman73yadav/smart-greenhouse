import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, Bell } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'warning' | 'success' | 'info' | 'critical';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const initialAlerts: Alert[] = [
  {
    id: '1',
    type: 'warning',
    title: 'High Temperature Detected',
    message: 'Zone A temperature exceeded 30°C. Ventilation increased automatically.',
    time: '2 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'success',
    title: 'Irrigation Completed',
    message: 'Scheduled irrigation cycle completed successfully for all zones.',
    time: '15 min ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'Growth Milestone',
    message: 'Tomatoes in Zone B have reached 75% growth stage.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: '4',
    type: 'critical',
    title: 'Low Soil Moisture',
    message: 'Zone C moisture levels dropped below 40%. Immediate attention required.',
    time: '30 min ago',
    read: false,
  },
];

const alertStyles = {
  warning: {
    icon: AlertTriangle,
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    iconColor: 'text-warning',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-success/10',
    border: 'border-success/30',
    iconColor: 'text-success',
  },
  info: {
    icon: Info,
    bg: 'bg-info/10',
    border: 'border-info/30',
    iconColor: 'text-info',
  },
  critical: {
    icon: AlertTriangle,
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    iconColor: 'text-destructive',
  },
};

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState(initialAlerts);
  
  const unreadCount = alerts.filter(a => !a.read).length;

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-display font-semibold text-foreground">Alerts</h3>
            <p className="text-sm text-muted-foreground">{unreadCount} unread notifications</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => {
            const style = alertStyles[alert.type];
            const Icon = style.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                layout
                onClick={() => markAsRead(alert.id)}
                className={cn(
                  "p-4 rounded-xl border cursor-pointer transition-all",
                  style.bg,
                  style.border,
                  !alert.read && "ring-1 ring-primary/20"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-lg", style.bg)}>
                    <Icon className={cn("w-4 h-4", style.iconColor)} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className={cn(
                        "text-sm font-medium text-foreground",
                        !alert.read && "font-semibold"
                      )}>
                        {alert.title}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissAlert(alert.id);
                        }}
                        className="p-1 hover:bg-muted rounded-full transition-colors"
                      >
                        <X className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {alert.message}
                    </p>
                    <span className="text-xs text-muted-foreground mt-2 block">
                      {alert.time}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {alerts.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-success mx-auto mb-3" />
            <p className="text-muted-foreground">All caught up! No alerts.</p>
          </div>
        )}
      </div>
    </div>
  );
}
