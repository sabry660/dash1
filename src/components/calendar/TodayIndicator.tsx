import React from 'react';

interface TodayIndicatorProps {
  dates: Date[];
  isToday: (date: Date) => boolean;
}

export default function TodayIndicator({ dates, isToday }: TodayIndicatorProps) {
  const todayIndex = dates.findIndex(date => isToday(date));
  
  if (todayIndex === -1) return null;

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-[#D4AF37] z-10 pointer-events-none"
      style={{
        left: `${todayIndex * 160 + 80}px` // 160px per day + half day width
      }}
    />
  );
}