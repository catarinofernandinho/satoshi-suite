import { createContext, useContext, useEffect, useState } from 'react';
import { useUserSettings } from '@/hooks/useUserSettings';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimezoneContextValue {
  timezone: string;
  formatDate: (date: Date | string, formatStr?: string) => string;
  formatDateTime: (date: Date | string, formatStr?: string) => string;
  convertToUserTime: (date: Date | string) => Date;
  convertToUTC: (date: Date) => Date;
  getCurrentTime: () => Date;
}

const TimezoneContext = createContext<TimezoneContextValue | null>(null);

export function TimezoneProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useUserSettings();
  const [timezone, setTimezone] = useState(
    settings?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    if (settings?.timezone) {
      setTimezone(settings.timezone);
    }
  }, [settings?.timezone]);

  const formatDate = (date: Date | string, formatStr = 'dd/MM/yyyy') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
  };

  const formatDateTime = (date: Date | string, formatStr = 'dd/MM/yyyy HH:mm') => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatInTimeZone(dateObj, timezone, formatStr, { locale: ptBR });
  };

  const convertToUserTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return toZonedTime(dateObj, timezone);
  };

  const convertToUTC = (date: Date) => {
    return fromZonedTime(date, timezone);
  };

  const getCurrentTime = () => {
    return toZonedTime(new Date(), timezone);
  };

  const value: TimezoneContextValue = {
    timezone,
    formatDate,
    formatDateTime,
    convertToUserTime,
    convertToUTC,
    getCurrentTime
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

export function useTimezone() {
  const context = useContext(TimezoneContext);
  if (!context) {
    throw new Error('useTimezone must be used within a TimezoneProvider');
  }
  return context;
}