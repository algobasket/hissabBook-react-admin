"use client";

interface FloatingBookProps {
  delay?: number;
  duration?: number;
  x?: number;
  y?: number;
  size?: number;
  opacity?: number;
  color?: "white" | "slate";
}

export default function FloatingBook({ 
  delay = 0, 
  duration = 20, 
  x = 0, 
  y = 0, 
  size = 24, 
  opacity = 0.15,
  color = "white"
}: FloatingBookProps) {
  const colorClass = color === "white" ? "text-white" : "text-slate-500";
  
  return (
    <div
      className={`absolute ${colorClass} pointer-events-none`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `float ${duration}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: opacity,
        willChange: 'transform',
      }}
    >
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
      >
        <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H5V4h14v16zM7 6h10v2H7V6zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
      </svg>
    </div>
  );
}
