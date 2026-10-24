import React, { useId } from 'react';

type Segment = { label: string; value: number; color?: string };

export function SegmentedGauge({
  segments,
  value,
  caption,
  label,
  className = ''
}: {
  segments: Segment[];
  value: number | string;
  caption: string;
  label: string;
  className?: string;
}) {
  const id = useId().replaceAll(':', '');
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const fills = [`url(#${id}-solid)`, `url(#${id}-mid)`, `url(#${id}-light)`];
  return (
    <svg
      className={`order-health-gauge ${className}`}
      viewBox="0 0 320 190"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={`${id}-solid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#717171" />
          <stop offset="0.45" stopColor="#414141" />
          <stop offset="1" stopColor="#252525" />
        </linearGradient>
        <linearGradient id={`${id}-mid`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d0d1d2" />
          <stop offset="1" stopColor="#9da0a3" />
        </linearGradient>
        <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0f0f0" />
          <stop offset="1" stopColor="#d3d4d5" />
        </linearGradient>
      </defs>
      {Array.from({ length: 30 }, (_, index) => {
        const angle = Math.PI + (Math.PI * index) / 29;
        const position = ((index + 0.5) / 30) * total;
        let accumulated = 0;
        const segmentIndex = segments.findIndex((segment) => {
          accumulated += segment.value;
          return position < accumulated;
        });
        const color =
          segmentIndex < 0
            ? fills[2]
            : segments[segmentIndex].color ||
              fills[segmentIndex % fills.length];
        return (
          <line
            key={index}
            x1={160 + Math.cos(angle) * 105}
            y1={159 + Math.sin(angle) * 105}
            x2={160 + Math.cos(angle) * 135}
            y2={159 + Math.sin(angle) * 135}
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
        );
      })}
      <text x="160" y="133" textAnchor="middle" className="gauge-value">
        {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
      </text>
      <text x="160" y="157" textAnchor="middle" className="gauge-caption">
        {caption}
      </text>
    </svg>
  );
}
