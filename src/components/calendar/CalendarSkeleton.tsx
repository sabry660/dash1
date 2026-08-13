import React from 'react';
import { Loader2 } from 'lucide-react';

export default function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      {/* Toolbar Skeleton */}
      <div className="flex items-center gap-4">
        <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-48 bg-gray-200 rounded-xl animate-pulse" />
        <div className="h-10 w-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Calendar Container */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
        {/* Header Skeleton */}
        <div className="flex border-b border-gray-200">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-40 border-r border-gray-100 p-4">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Calendar Body */}
        <div className="flex">
          {/* Category Column Skeleton */}
          <div className="w-80 flex-shrink-0 border-l border-gray-200 bg-gray-50">
            <div className="p-4 border-b border-gray-200">
              <div className="h-6 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>

          {/* Timeline Skeleton */}
          <div className="flex-1 overflow-x-auto">
            <div className="min-w-max">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex border-b border-gray-100 h-20">
                  {Array.from({ length: 14 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex-shrink-0 w-40 border-r border-gray-100 p-2"
                    >
                      <div className="h-12 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="text-[#D4AF37] animate-spin" />
      </div>
    </div>
  );
}