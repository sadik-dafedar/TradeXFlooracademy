'use client';

import { useEffect, useState, useRef } from 'react';
import LightLines from '@/components/ui/light-lines';

// Optimized background - CSS only, no 3D, zero lag
export default function Scene3D() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const ticking = useRef(false);

  useEffect(() => {
    let animationFrameId;

    const handleMouseMove = (e) => {
      // Store the latest calculated position
      mousePositionRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      };

      if (!ticking.current) {
        animationFrameId = window.requestAnimationFrame(() => {
          setMousePosition(mousePositionRef.current);
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, #0F172A 0%, #000000 50%, #0F172A 100%)',
        overflow: 'hidden',
      }}
    >
      {/* Light Lines for Dynamic Depth */}
      <div className="absolute inset-0 opacity-30 mix-blend-screen">
         <LightLines
            speedMultiplier={0.5}
            linesOpacity={0.1}
            lightsOpacity={0.5}
            gradientFrom="transparent"
            gradientTo="transparent"
         />
      </div>

      {/* Animated SVG Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <TradingGridSVG />
      </div>
    </div>
  );
}

const GRID_LINES = Array.from({ length: 20 }, (_, i) => i);

function TradingGridSVG({ className = '' }) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="gridGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      <g opacity="0.15">
        {GRID_LINES.map((i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${5 + i * 5}%`}
            x2="100%"
            y2={`${5 + i * 5}%`}
            stroke="url(#gridGradient)"
            strokeWidth="0.5"
          />
        ))}
        {GRID_LINES.map((i) => (
          <line
            key={`v-${i}`}
            x1={`${5 + i * 5}%`}
            y1="0"
            x2={`${5 + i * 5}%`}
            y2="100%"
            stroke="url(#gridGradient)"
            strokeWidth="0.5"
          />
        ))}
      </g>
    </svg>
  );
}
