// ============================================================
// RangeSlider — Price Range Slider UI Component
// A styled dual-handle range slider for price filtering.
// ============================================================

import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "../../utils/cn";

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
  className?: string;
  step?: number;
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  formatLabel = (v) => String(v),
  className,
  step = 500,
}: RangeSliderProps) {
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  );

  const minPercent = getPercent(value[0]);
  const maxPercent = getPercent(value[1]);

  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragging || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const rawValue = min + ratio * (max - min);
      const snapped = Math.round(rawValue / step) * step;

      if (dragging === "min") {
        onChange([Math.min(snapped, value[1] - step), value[1]]);
      } else {
        onChange([value[0], Math.max(snapped, value[0] + step)]);
      }
    },
    [dragging, min, max, step, value, onChange]
  );

  const stopDragging = useCallback(() => setDragging(null), []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", stopDragging);
      window.addEventListener("touchmove", handleMouseMove);
      window.addEventListener("touchend", stopDragging);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", stopDragging);
      window.removeEventListener("touchmove", handleMouseMove);
      window.removeEventListener("touchend", stopDragging);
    };
  }, [dragging, handleMouseMove, stopDragging]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-navy-900">{formatLabel(value[0])}</span>
        <span className="text-xs text-navy-800/40">to</span>
        <span className="text-sm font-semibold text-navy-900">{formatLabel(value[1])}</span>
      </div>

      <div className="relative h-6 flex items-center" ref={trackRef}>
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-sand-200  rounded-full" />

        {/* Active range */}
        <div
          className="absolute h-1.5 bg-gold-500 rounded-full"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />

        {/* Min thumb */}
        <button
          type="button"
          aria-label="Minimum price"
          className={cn(
            "absolute w-5 h-5 bg-white  border-2 border-gold-500 rounded-full shadow-md cursor-grab transition-transform focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2",
            dragging === "min" && "scale-125 cursor-grabbing"
          )}
          style={{ left: `${minPercent}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setDragging("min")}
          onTouchStart={() => setDragging("min")}
        />

        {/* Max thumb */}
        <button
          type="button"
          aria-label="Maximum price"
          className={cn(
            "absolute w-5 h-5 bg-white  border-2 border-gold-500 rounded-full shadow-md cursor-grab transition-transform focus:outline-none focus:ring-2 focus:ring-gold-400 focus:ring-offset-2",
            dragging === "max" && "scale-125 cursor-grabbing"
          )}
          style={{ left: `${maxPercent}%`, transform: "translateX(-50%)" }}
          onMouseDown={() => setDragging("max")}
          onTouchStart={() => setDragging("max")}
        />
      </div>
    </div>
  );
}
