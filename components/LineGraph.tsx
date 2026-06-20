import React, { useEffect, useRef } from 'react';
import { Goal } from '../types';

interface LineGraphProps {
  data: { 
    day: number; 
    points: number; 
    fullDate?: string;
    achievedGoals?: Goal[];
  }[];
  monthName: string;
  showGoalNames?: boolean;
  variant?: 'dashboard' | 'stats';
  onPointClick?: (fullDate: string) => void;
}

const LineGraph: React.FC<LineGraphProps> = ({ 
  data, 
  monthName, 
  showGoalNames = true, 
  variant = 'stats',
  onPointClick 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasScrolledRef = useRef<string>('');

   useEffect(() => {
    if (containerRef.current && data.length > 0 && hasScrolledRef.current !== monthName) {
      const today = new Date();
      const isCurrentMonth = today.toLocaleString('default', { month: 'long' }) === monthName;
      
      if (isCurrentMonth) {
        const todayDay = today.getDate();
        const todayIndex = data.findIndex(d => d.day === todayDay);
        
        if (todayIndex !== -1) {
          const svgWidth = 800;
          const padding = 40;
          const x = padding + (todayIndex * (svgWidth - padding * 2)) / (data.length - 1);
          
          // Calculate scroll position to center today's point
          const container = containerRef.current;
          const scrollWidth = container.scrollWidth;
          const clientWidth = container.clientWidth;
          
          // The SVG width in pixels is scrollWidth
          const scrollX = (x / svgWidth) * scrollWidth;
          container.scrollTo({
            left: scrollX - clientWidth / 2,
            behavior: 'smooth'
          });
          hasScrolledRef.current = monthName;
        }
      }
    }
  }, [data, monthName]);

  if (data.length === 0) return <div className="p-10 text-center text-gray-400">No range data available.</div>;

  const maxPoints = Math.max(...data.map(d => d.points), 100);
  const width = 800;
  const height = 240;
  const padding = 40;

  const points = data.map((d, i) => {
    const x = padding + (i * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (d.points * (height - padding * 2)) / maxPoints;
    return `${x},${y}`;
  }).join(' ');

  // Determine today's index (if viewing current month) for ripple animation
  const today = new Date();
  const isCurrentMonth = today.toLocaleString('default', { month: 'long' }) === monthName;
  const todayIndex = isCurrentMonth ? data.findIndex(d => d.day === today.getDate()) : -1;

  return (
        <div 
      ref={containerRef} 
      onTouchStart={() => {
        document.body.dataset.disableSwipeNav = 'true';
      }}
      onTouchEnd={() => {
        delete document.body.dataset.disableSwipeNav;
      }}
      onTouchCancel={() => {
        delete document.body.dataset.disableSwipeNav;
      }}
      className="linegraph-container relative w-full overflow-x-auto overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] no-scrollbar"
    >
      
      {/* Legend - Only visible if NOT in dashboard */}
      {variant !== 'dashboard' && (
        <div className="absolute top-2 right-4 text-[8px] font-bold dark:text-slate-100 text-slate-600 uppercase tracking-widest bg-white/80 dark:bg-slate-800/60 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-700">
          1 Day = 100 Points
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[600px]">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
        </defs>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#e2e8f0" strokeWidth="1" />
        
        <path
          d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
          fill="url(#gradient)"
          opacity="0.1"
        />
        
        <polyline fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
        
        {data.map((d, i) => {
          const x = padding + (i * (width - padding * 2)) / (data.length - 1);
          const y = height - padding - (d.points * (height - padding * 2)) / maxPoints;
          const hasGoals = d.achievedGoals && d.achievedGoals.length > 0;

          return (
            <g key={i} className="group cursor-pointer" data-fulldate={d.fullDate || ''}
              onClick={() => { if (d.fullDate && onPointClick) onPointClick(d.fullDate); }}>
              <circle cx={x} cy={y} r="4" fill={hasGoals ? "#10b981" : "#3b82f6"} />

              {/* Today's radio-wave ripple animation */}
              {i === todayIndex && (
                <g>
                  <circle cx={x} cy={y} r={6} stroke="#3b82f6" className="svg-ripple delay-2" />
                  <circle cx={x} cy={y} r={6} stroke="#3b82f6" className="svg-ripple delay-1" />
                  <circle cx={x} cy={y} r={6} stroke="#3b82f6" className="svg-ripple" />
                  <circle cx={x} cy={y} r={4} fill="#3b82f6" className="svg-dot-pulse" />
                </g>
              )}

              {/* Point Value */}
              {(d.points > 0 || i % Math.ceil(data.length / 10) === 0) && (
                <text x={x} y={y - 10} textAnchor="middle" fontSize="9" className="fill-blue-600 dark:fill-blue-400 font-bold">
                  {d.points}
                </text>
              )}

              
              {hasGoals && (
                <g>
                  <circle cx={x} cy={y} r="8" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="2 1" />
                  
                  <text x={x} y={y - 20} textAnchor="middle" className="fill-emerald-500 text-[14px] font-black">★</text>
                  
                  {showGoalNames && (
                    <text 
                      x={x} 
                      y={y - 33} 
                      textAnchor="middle" 
                      style={{ 
                        paintOrder: 'stroke', 
                        strokeLinejoin: 'round',
                        stroke: variant === 'dashboard' ? 'none' : 'white',
                        strokeWidth: variant === 'dashboard' ? '0px' : '3px'
                      }}
                      className="goal-label fill-emerald-600 dark:fill-emerald-500 text-[8px] font-bold tracking-tight"
                    >
                      {d.achievedGoals?.map(g => g.name).reverse().join(', ')}
                    </text>
                  )}
                  <title>Goals: {d.achievedGoals?.map(g => g.name).join(', ')}</title>
                </g>
              )}

              {(i % Math.ceil(data.length / 10) === 0 || i === data.length - 1) && (
                <text x={x} y={height - 15} textAnchor="middle" fontSize="10" className="fill-gray-500 font-mono font-bold">
                  {d.day}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default LineGraph;