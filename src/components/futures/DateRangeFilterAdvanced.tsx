import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

interface DateRangeFilterAdvancedProps {
  dateRange: {
    from: Date;
    to: Date;
  };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function DateRangeFilterAdvanced({ dateRange, onDateRangeChange }: DateRangeFilterAdvancedProps) {

  const handlePresetChange = (value: string) => {
    const now = new Date();
    
    switch (value) {
      case "all":
        onDateRangeChange({ 
          from: subDays(now, 365 * 5), // 5 anos atrás
          to: now 
        });
        break;
      case "7days":
        onDateRangeChange({ 
          from: subDays(now, 7), 
          to: now 
        });
        break;
      case "30days":
        onDateRangeChange({ 
          from: subDays(now, 30), 
          to: now 
        });
        break;
      case "90days":
        onDateRangeChange({ 
          from: subDays(now, 90), 
          to: now 
        });
        break;
    }
  };

  const getPresetFromRange = () => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);
    const ninetyDaysAgo = subDays(now, 90);
    const fiveYearsAgo = subDays(now, 365 * 5);
    
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (Math.abs(dateRange.from.getTime() - sevenDaysAgo.getTime()) < 86400000 && daysDiff <= 8) {
      return "7days";
    } else if (Math.abs(dateRange.from.getTime() - thirtyDaysAgo.getTime()) < 86400000 && daysDiff <= 32) {
      return "30days";
    } else if (Math.abs(dateRange.from.getTime() - ninetyDaysAgo.getTime()) < 86400000 && daysDiff <= 92) {
      return "90days";
    } else if (Math.abs(dateRange.from.getTime() - fiveYearsAgo.getTime()) < 86400000 * 30) {
      return "all";
    }
    return "all"; // Default to "all" instead of "custom"
  };

  const currentPreset = getPresetFromRange();

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">7 dias</SelectItem>
          <SelectItem value="30days">30 dias</SelectItem>
          <SelectItem value="90days">90 dias</SelectItem>
          <SelectItem value="all">Tempo Todo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
