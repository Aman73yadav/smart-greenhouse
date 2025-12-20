import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type DateRange = '7d' | '30d' | '90d' | 'custom';
type ExportFormat = 'csv' | 'pdf';

export default function DataExport() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d');
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate sample data
    const data = generateSampleData();
    
    if (selectedFormat === 'csv') {
      downloadCSV(data);
    } else {
      // For PDF, we'd typically use a library like jsPDF
      toast({
        title: "PDF Export",
        description: "PDF generation requires backend integration. CSV downloaded instead.",
      });
      downloadCSV(data);
    }
    
    setIsExporting(false);
    toast({
      title: "Export Complete",
      description: `Sensor data exported as ${selectedFormat.toUpperCase()}`,
    });
  };

  const generateSampleData = () => {
    const days = selectedRange === '7d' ? 7 : selectedRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (let h = 0; h < 24; h += 4) {
        data.push({
          timestamp: date.toISOString().split('T')[0] + ` ${h.toString().padStart(2, '0')}:00`,
          temperature: (22 + Math.random() * 6).toFixed(1),
          humidity: (55 + Math.random() * 20).toFixed(1),
          soilMoisture: (60 + Math.random() * 25).toFixed(1),
          lightLevel: (300 + Math.random() * 500).toFixed(0),
          co2Level: (400 + Math.random() * 200).toFixed(0),
        });
      }
    }
    
    return data;
  };

  const downloadCSV = (data: any[]) => {
    const headers = ['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture (%)', 'Light (lux)', 'CO2 (ppm)'];
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        [row.timestamp, row.temperature, row.humidity, row.soilMoisture, row.lightLevel, row.co2Level].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `greenhouse-data-${selectedRange}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-warning">
          <Download className="w-6 h-6 text-secondary-foreground" />
        </div>
        <div>
          <h3 className="text-xl font-display font-semibold text-foreground">Export Data</h3>
          <p className="text-sm text-muted-foreground">Download sensor history reports</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Date Range Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            Date Range
          </label>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {(['7d', '30d', '90d', 'custom'] as DateRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={cn(
                  "py-2 px-4 rounded-lg text-sm font-medium transition-all",
                  selectedRange === range
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {range === '7d' ? 'Last 7 Days' : 
                 range === '30d' ? 'Last 30 Days' : 
                 range === '90d' ? 'Last 90 Days' : 'Custom'}
              </button>
            ))}
          </div>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {(['csv', 'pdf'] as ExportFormat[]).map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={cn(
                  "py-3 px-4 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                  selectedFormat === format
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {format === 'csv' ? '📊 CSV Spreadsheet' : '📄 PDF Report'}
              </button>
            ))}
          </div>
        </div>

        {/* Data Filters */}
        <div className="p-4 rounded-xl bg-muted/50 border border-border">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Included Data</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Temperature', 'Humidity', 'Soil Moisture', 'Light Levels', 'CO2 Levels', 'Alerts'].map((item) => (
              <label key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" defaultChecked className="rounded border-border" />
                {item}
              </label>
            ))}
          </div>
        </div>

        {/* Export Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            "w-full py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all",
            isExporting
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-accent text-primary-foreground"
          )}
        >
          {isExporting ? (
            <>
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Download {selectedFormat.toUpperCase()} Report
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
