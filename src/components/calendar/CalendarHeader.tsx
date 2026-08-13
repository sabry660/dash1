import React from 'react';

interface CalendarHeaderProps {
  dates: Date[];
  dayNames: string[];
  monthNames: string[];
  isToday: (date: Date) => boolean;
}

export default function CalendarHeader({
  dates,
  dayNames,
  monthNames,
  isToday
}: CalendarHeaderProps) {
  return (
    <div className="border-b border-gray-200">
      {/* Month Row */}
      <div className="flex">
        {dates.map((date, index) => {
          const showMonth = index === 0 || date.getDate() === 1;
          return (
            <div
              key={`month-${index}`}
              className={`flex-shrink-0 w-40 border-r border-gray-100 p-2 text-center ${
                showMonth ? 'bg-gray-50' : ''
              }`}
            >
              {showMonth && (
                <div className="text-xs font-bold text-gray-500">
                  {monthNames[date.getMonth()]} {date.getFullYear()}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day Names Row */}
      <div className="flex">
        {dates.map((date, index) => (
          <div
            key={`day-${index}`}
            className={`flex-shrink-0 w-40 border-r border-gray-100 p-2 text-center ${
              isToday(date) ? 'bg-amber-50' : ''
            }`}
          >
            <div className="text-xs font-bold text-gray-500">
              {dayNames[date.getDay()]}
            </div>
            <div className={`text-lg font-black mt-1 ${
              isToday(date) ? 'text-[#AA7B30]' : 'text-gray-800'
            }`}>
              {date.getDate()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}