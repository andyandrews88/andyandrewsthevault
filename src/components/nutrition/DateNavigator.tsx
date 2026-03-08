import { useState } from 'react';
import { format, addDays, subDays, isToday, isFuture, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ResponsiveSheet } from '@/components/ui/responsive-sheet';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const [open, setOpen] = useState(false);
  const handlePrevDay = () => onDateChange(subDays(selectedDate, 1));
  const handleNextDay = () => onDateChange(addDays(selectedDate, 1));
  const handleToday = () => onDateChange(new Date());

  const dateLabel = isToday(selectedDate)
    ? 'Today'
    : isFuture(selectedDate)
    ? format(selectedDate, 'EEE, MMM d') + ' (Planning)'
    : format(selectedDate, 'EEE, MMM d');

  return (
    <div className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card">
      <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-10 w-10">
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2 flex-1 justify-center">
        <ResponsiveSheet
          open={open}
          onOpenChange={setOpen}
          title="Select Date"
          trigger={
            <Button
              variant="ghost"
              className={cn(
                'font-medium text-sm gap-2',
                isFuture(selectedDate) && 'text-primary',
                isPast(selectedDate) && !isToday(selectedDate) && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              {dateLabel}
            </Button>
          }
          popoverClassName="w-auto p-0"
        >
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => { if (date) { onDateChange(date); setOpen(false); } }}
            initialFocus
          />
        </ResponsiveSheet>

        {!isToday(selectedDate) && (
          <Button variant="outline" size="sm" onClick={handleToday} className="text-xs h-8 px-3">
            Today
          </Button>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-10 w-10">
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
