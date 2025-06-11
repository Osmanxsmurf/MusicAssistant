import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AudioVisualizerProps {
  playing: boolean;
  className?: string;
  bars?: number;
  height?: number;
}

export function AudioVisualizer({
  playing,
  className,
  bars = 30,
  height = 30
}: AudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // Create bar elements if they don't exist
    if (container.children.length === 0) {
      for (let i = 0; i < bars; i++) {
        const bar = document.createElement('div');
        bar.className = 'bg-primary rounded-full w-[2px] transform transition-transform duration-75';
        container.appendChild(bar);
      }
    }
    
    // Animation function
    const animate = () => {
      if (!playing || !containerRef.current) {
        if (animationRef.current !== null) {
          window.cancelAnimationFrame(animationRef.current);
          animationRef.current = null;
        }
        return;
      }
      
      // Update each bar's height
      Array.from(container.children).forEach((bar: Element) => {
        const div = bar as HTMLDivElement;
        
        // Random height between 15% and 95% when playing
        const newHeight = playing 
          ? Math.floor(Math.random() * 80 + 15) 
          : 10; // Minimal height when paused
        
        div.style.height = `${newHeight}%`;
      });
      
      // Continue animation
      animationRef.current = window.requestAnimationFrame(animate);
    };
    
    // Start animation if playing
    if (playing) {
      animate();
    } else {
      // Set all bars to minimal height when paused
      Array.from(container.children).forEach((bar: Element) => {
        const div = bar as HTMLDivElement;
        div.style.height = '10%';
      });
      
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
    };
  }, [playing, bars]);
  
  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex items-end justify-center gap-[2px]",
        className
      )}
      style={{ height: `${height}px` }}
    />
  );
}
