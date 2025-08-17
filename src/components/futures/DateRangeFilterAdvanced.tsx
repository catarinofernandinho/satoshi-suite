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
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<string>("custom");

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const now = new Date();
    
    switch (value) {
      case "all":
        onDateRangeChange({ 
          from: new Date(2020, 0, 1), // January 1, 2020
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
      case "custom":
        // Auto-open date picker when custom is selected
        setIsOpen(true);
        break;
    }
  };

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setPreset("custom");
      setIsOpen(false);
    }
  };

  const getPresetFromRange = () => {
    const now = new Date();
    const sevenDaysAgo = subDays(now, 7);
    const thirtyDaysAgo = subDays(now, 30);
    const allTimeStart = new Date(2020, 0, 1);
    
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    if (Math.abs(dateRange.from.getTime() - sevenDaysAgo.getTime()) < 86400000 && daysDiff <= 8) {
      return "7days";
    } else if (Math.abs(dateRange.from.getTime() - thirtyDaysAgo.getTime()) < 86400000 && daysDiff <= 32) {
      return "30days";
    } else if (dateRange.from.getTime() <= allTimeStart.getTime() + 86400000) {
      return "all";
    }
    return "custom";
  };

  const currentPreset = getPresetFromRange();

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todo o tempo</SelectItem>
          <SelectItem value="7days">7 dias</SelectItem>
          <SelectItem value="30days">30 dias</SelectItem>
          <SelectItem value="custom">Personalizado</SelectItem>
        </SelectContent>
      </Select>

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-[280px] justify-start text-left font-normal",
              !dateRange && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "dd/MM/yyyy")} →{" "}
                  {format(dateRange.to, "dd/MM/yyyy")}
                </>
              ) : (
                format(dateRange.from, "dd/MM/yyyy")
              )
            ) : (
              <span>Selecionar período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange?.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
