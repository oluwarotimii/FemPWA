import { useState, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown, Clock } from 'lucide-react';

interface TimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

const PRESET_TIMES = [
  { label: '6am', value: '06:00' },
  { label: '7am', value: '07:00' },
  { label: '8am', value: '08:00' },
  { label: '9am', value: '09:00' },
  { label: '10am', value: '10:00' },
  { label: '12pm', value: '12:00' },
  { label: '1pm', value: '13:00' },
  { label: '2pm', value: '14:00' },
  { label: '3pm', value: '15:00' },
  { label: '4pm', value: '16:00' },
  { label: '5pm', value: '17:00' },
];

function parseTime(timeStr: string): { hours: number; minutes: number } {
  if (!timeStr) return { hours: 8, minutes: 0 };
  const parts = timeStr.split(':');
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
  };
}

function formatTimeValue(hours: number, minutes: number): string {
  const h = Math.min(23, Math.max(0, hours));
  const m = Math.min(59, Math.max(0, minutes));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function to12Hour(hours: number): { hour12: number; period: 'AM' | 'PM' } {
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return { hour12, period };
}

function to24Hour(hour12: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}

export function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [hours, setHours] = useState(() => parseTime(value).hours);
  const [minutes, setMinutes] = useState(() => parseTime(value).minutes);

  useEffect(() => {
    setHours(parseTime(value).hours);
    setMinutes(parseTime(value).minutes);
  }, [value]);

  useEffect(() => {
    onChange(formatTimeValue(hours, minutes));
  }, [hours, minutes]);

  const { hour12, period } = to12Hour(hours);

  const incrementHours = () => setHours(h => (h + 1) % 24);
  const decrementHours = () => setHours(h => (h - 1 + 24) % 24);
  const incrementMinutes = () => setMinutes(m => (m + 1) % 60);
  const decrementMinutes = () => setMinutes(m => (m - 1 + 60) % 60);
  const togglePeriod = () => {
    setHours(h => (period === 'AM' ? h + 12 : h - 12));
  };

  const selectPreset = (presetValue: string) => {
    const { hours: h, minutes: m } = parseTime(presetValue);
    setHours(h);
    setMinutes(m);
  };

  const displayTime = `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {label}
        </label>
      )}
      <div className="bg-white border border-gray-300 rounded-lg p-3">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="flex flex-col items-center">
            <button type="button" onClick={incrementHours}
              className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ChevronUp className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-3xl font-bold text-gray-900 tabular-nums w-12 text-center select-none">
              {String(hour12).padStart(2, '0')}
            </div>
            <button type="button" onClick={decrementHours}
              className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="text-3xl font-bold text-gray-300 select-none">:</div>

          <div className="flex flex-col items-center">
            <button type="button" onClick={incrementMinutes}
              className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ChevronUp className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-3xl font-bold text-gray-900 tabular-nums w-12 text-center select-none">
              {String(minutes).padStart(2, '0')}
            </div>
            <button type="button" onClick={decrementMinutes}
              className="p-1 hover:bg-gray-100 rounded transition-colors">
              <ChevronDown className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <button type="button" onClick={togglePeriod}
            className={`px-3 py-1 rounded-lg text-sm font-bold border-2 transition-colors self-center ${
              period === 'AM'
                ? 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {period}
          </button>
        </div>

        {value && (
          <div className="text-center text-xs text-gray-500 mb-2">
            Value: <span className="font-mono font-semibold text-gray-700">{displayTime}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1.5 justify-center border-t border-gray-100 pt-2">
          {PRESET_TIMES.map(preset => (
            <button
              key={preset.value}
              type="button"
              onClick={() => selectPreset(preset.value)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                value === preset.value
                  ? 'bg-[#1A2B3C] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
