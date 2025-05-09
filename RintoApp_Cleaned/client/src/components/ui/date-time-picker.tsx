import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";

interface TimeSlot {
  label: string;
  value: string;
  disabled?: boolean;
}

interface DateTimePickerProps {
  date: Date;
  setDate: (date: Date) => void;
  startTime: string;
  setStartTime: (time: string) => void;
  endTime: string;
  setEndTime: (time: string) => void;
  availableTimes?: { start: string; end: string }[];
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker({
  date,
  setDate,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  availableTimes = [],
  minDate = new Date(),
  maxDate,
}: DateTimePickerProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [endTimeSlots, setEndTimeSlots] = useState<TimeSlot[]>([]);

  // Generate array of time slots from 7 AM to 7 PM in 30-minute increments
  useEffect(() => {
    let newTimeSlots: TimeSlot[] = [];
    let hour = 7;
    let minute = 0;
    let period = "AM";

    while (hour < 20) { // Until 8 PM
      const formattedHour = hour === 12 ? 12 : hour % 12;
      const formattedMinute = minute === 0 ? "00" : minute;
      const label = `${formattedHour}:${formattedMinute} ${period}`;
      const value = `${hour.toString().padStart(2, "0")}:${formattedMinute}`;
      
      // Check if this time is available
      const isAvailable = availableTimes.length === 0 || availableTimes.some(slot => {
        const slotStart = slot.start;
        const slotEnd = slot.end;
        return value >= slotStart && value < slotEnd;
      });
      
      newTimeSlots.push({
        label,
        value,
        disabled: !isAvailable
      });
      
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour += 1;
        if (hour === 12) {
          period = "PM";
        }
      }
    }
    
    setTimeSlots(newTimeSlots);
  }, [availableTimes]);

  // Update end time slots when start time changes
  useEffect(() => {
    if (!startTime) {
      setEndTimeSlots([]);
      return;
    }
    
    const startIndex = timeSlots.findIndex(slot => slot.value === startTime);
    if (startIndex === -1) {
      setEndTimeSlots([]);
      return;
    }
    
    // End time must be at least 1 hour after start time
    const validEndTimeSlots = timeSlots.slice(startIndex + 2);
    setEndTimeSlots(validEndTimeSlots);
    
    // If current end time is not valid, reset it
    if (endTime && !validEndTimeSlots.some(slot => slot.value === endTime)) {
      setEndTime('');
    }
  }, [startTime, timeSlots, endTime, setEndTime]);

  return (
    <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-neutral-700">Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(newDate) => newDate && setDate(newDate)}
              initialFocus
              disabled={(day) => 
                (minDate && day < minDate) || 
                (maxDate && day > maxDate) || 
                day.getDay() === 0 // Disable Sundays
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-neutral-700">Start Time</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !startTime && "text-muted-foreground"
              )}
              disabled={!date}
            >
              <Clock className="mr-2 h-4 w-4" />
              {startTime ? (
                timeSlots.find(slot => slot.value === startTime)?.label || "Select time"
              ) : (
                <span>Select time</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0">
            <div className="max-h-80 overflow-y-auto p-1">
              {timeSlots.map((slot) => (
                <div
                  key={slot.value}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-2 text-sm",
                    startTime === slot.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted",
                    slot.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !slot.disabled && setStartTime(slot.value)}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex-1 space-y-2">
        <label className="text-sm font-medium text-neutral-700">End Time</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !endTime && "text-muted-foreground"
              )}
              disabled={!startTime}
            >
              <Clock className="mr-2 h-4 w-4" />
              {endTime ? (
                timeSlots.find(slot => slot.value === endTime)?.label || "Select time"
              ) : (
                <span>Select time</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0">
            <div className="max-h-80 overflow-y-auto p-1">
              {endTimeSlots.map((slot) => (
                <div
                  key={slot.value}
                  className={cn(
                    "cursor-pointer rounded-md px-3 py-2 text-sm",
                    endTime === slot.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted",
                    slot.disabled && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => !slot.disabled && setEndTime(slot.value)}
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
