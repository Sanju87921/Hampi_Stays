// ============================================================
// Calendar — Reusable Date Picker UI Component
// Wraps react-day-picker with HampiStays luxury styling.
// ============================================================

import { DayPicker, type DateRange as DayPickerDateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";

// Re-export DateRange so consumers don't import from react-day-picker directly
export type DateRange = {
  from?: Date;
  to?: Date;
};

interface CalendarProps {
  selected?: DateRange;
  onSelect?: (range: DateRange | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const defaultDisabled = (date: Date) => {
    if (disabled) return disabled(date);
    return date < today;
  };

  // Adapt our DateRange to react-day-picker's DateRange (requires from to be Date)
  const dpSelected: DayPickerDateRange | undefined = selected?.from
    ? { from: selected.from, to: selected.to }
    : undefined;

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-3xl shadow-luxury border border-sand-100 dark:border-zinc-800/50 p-4 ${className ?? ""}`}
    >
      <style>{`
        .rdp-root {
          --rdp-accent-color: #d44c30;
          --rdp-accent-background-color: #fef6f4;
          --rdp-day-height: 40px;
          --rdp-day-width: 40px;
          --rdp-font-family: var(--font-sans, Inter, sans-serif);
          font-family: var(--rdp-font-family);
        }
        .rdp-day_button {
          border-radius: 50%;
          font-size: 0.875rem;
          font-weight: 500;
        }
        .rdp-selected .rdp-day_button {
          background-color: #d44c30;
          color: white;
        }
        .rdp-range_middle .rdp-day_button {
          background-color: #fdeae5;
          color: #7a2e20;
          border-radius: 0;
        }
        .rdp-range_start .rdp-day_button,
        .rdp-range_end .rdp-day_button {
          background-color: #d44c30;
          color: white;
        }
        .rdp-today .rdp-day_button:not(.rdp-selected .rdp-day_button) {
          color: #d44c30;
          font-weight: 700;
        }
        .rdp-chevron { fill: #072b1d; }
        .rdp-nav button:hover { opacity: 0.7; }
        .rdp-month_caption { color: #072b1d; font-weight: 700; font-size: 0.95rem; }
        .rdp-weekday { color: #a8a29e; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
      `}</style>
      <DayPicker
        mode="range"
        selected={dpSelected}
        onSelect={(range) => {
          if (!range) { onSelect?.(undefined); return; }
          onSelect?.({ from: range.from, to: range.to });
        }}
        disabled={defaultDisabled}
        numberOfMonths={2}
        showOutsideDays={false}
        formatters={{
          formatCaption: (month) => format(month, "MMMM yyyy"),
        }}
      />
    </div>
  );
}
