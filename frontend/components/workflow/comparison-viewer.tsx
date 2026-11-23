'use client';

import React, { useState } from 'react';
import Image from 'next/image';

interface ComparisonViewerProps {
  beforeUrl: string;
  afterUrl: string;
}

export function ComparisonViewer({ beforeUrl, afterUrl }: ComparisonViewerProps) {
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <div className="relative w-full aspect-video overflow-hidden rounded-lg border bg-muted" role="img" aria-label="Image comparison viewer. Use the slider to compare before and after.">
      {/* After Image */}
      <div className="absolute inset-0">
        <Image src={afterUrl} alt="Enhanced image" fill className="object-contain" />
      </div>

      {/* Before Image (Clipped) */}
      <div 
        className="absolute inset-0 z-10 overflow-hidden" 
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <Image src={beforeUrl} alt="Original image" fill className="object-contain" />
      </div>

      {/* Slider Handle */}
      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        aria-label="Comparison slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={sliderPos}
        className="absolute inset-0 z-20 w-full h-full opacity-0 cursor-col-resize"
      />
      <div 
        className="absolute top-0 bottom-0 z-15 w-1 bg-white shadow-xl pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
          <span className="text-xs font-bold text-black">↔</span>
        </div>
      </div>
    </div>
  );
}