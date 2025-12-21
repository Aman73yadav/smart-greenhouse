import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, 
  LayoutDashboard, 
  Settings, 
  BarChart3, 
  Bell, 
  Download,
  Menu,
  X,
  Sprout,
  Cpu,
  CalendarClock,
  Calendar,
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'plants', label: 'Plants', icon: <Sprout className="w-5 h-5" /> },
  { id: 'devices', label: 'Devices', icon: <Cpu className="w-5 h-5" /> },
  { id: 'schedules', label: 'Schedules', icon: <CalendarClock className="w-5 h-5" /> },
  { id: 'calendar', label: 'Calendar', icon: <Calendar className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'controls', label: 'Controls', icon: <Settings className="w-5 h-5" /> },
  { id: 'alerts', label: 'Alerts', icon: <Bell className="w-5 h-5" /> },
  { id: 'export', label: 'Export', icon: <Download className="w-5 h-5" /> },
];

interface NavigationProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Navigation({ activeSection, onSectionChange }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { signOut, user } = useAuth();
  return (
    <>
      {/* Desktop Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="hidden md:flex fixed top-0 left-0 right-0 z-50 glass-panel-strong mx-4 mt-4 px-6 py-3"
      >
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-accent">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-foreground">GreenHouse</h1>
              <p className="text-xs text-muted-foreground">Smart Monitoring</p>
            </div>
          </div>

          {/* Nav Items */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionChange(item.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
                  activeSection === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Status Indicator & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-success">Online</span>
            </div>
            {user && (
              <button
                onClick={signOut}
                className="flex items-center gap-2 p-2 rounded-xl bg-muted hover:bg-destructive/20 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </motion.nav>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-panel-strong mx-2 mt-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Leaf className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-base font-display font-bold text-foreground">GreenHouse</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-muted"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pb-2"
          >
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onSectionChange(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl text-xs font-medium transition-all",
                    activeSection === item.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}
