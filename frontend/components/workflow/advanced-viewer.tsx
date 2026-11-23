'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ZoomIn, ZoomOut, Maximize, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdvancedViewer({ before, after }: { before: string, after: string }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset(prev => ({
      x: prev.x + e.movementX,
      y: prev.y + e.movementY
    }));
  };

  const reset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between bg-muted/50 p-2 rounded-lg">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 0.5, 5))} aria-label="Zoom in">
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 0.5, 1))} aria-label="Zoom out">
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={reset} aria-label="Reset zoom">
            <Maximize className="w-4 h-4" />
          </Button>
        </div>
        <span className="text-xs font-mono">Zoom: {zoom.toFixed(1)}x</span>
      </div>

      <div 
        ref={containerRef}
        className="relative aspect-video bg-black overflow-hidden rounded-xl border cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseUp}
      >
        <div 
          className="absolute inset-0 transition-transform duration-75"
          style={{ 
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: 'center'
          }}
        >
           <div className="grid grid-cols-2 w-full h-full">
              <div className="relative border-r border-white/20">
                <Image src={before} alt="Before" fill className="object-contain" />
                <div className="absolute top-2 left-2 bg-black/50 px-2 py-1 rounded text-[10px] text-white">BEFORE</div>
              </div>
              <div className="relative">
                <Image src={after} alt="After" fill className="object-contain" />
                <div className="absolute top-2 right-2 bg-primary/80 px-2 py-1 rounded text-[10px] text-white">ENHANCED</div>
              </div>
           </div>
        </div>
        {zoom === 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full text-white text-sm flex items-center gap-2">
                <Move className="w-4 h-4" /> Drag to pan when zoomed
            </div>
        )}
      </div>
    </div>
  );
}