import React from 'react';

interface BrandLogoProps {
  theme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string;
  storeName?: string;
  className?: string;
}

/**
 * Renders the exact BDTechZen brand mark (7-hexagon honeycomb cluster with golden
 * center starburst + BDTechZen wordmark with italic violet "Tech"), or a custom
 * uploaded logo URL if configured in Admin Settings.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  theme = 'light',
  size = 'md',
  logoUrl,
  storeName = 'BDTechZen',
  className = ''
}) => {
  const heightMap = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-11'
  };

  if (logoUrl && logoUrl.trim() !== '') {
    return (
      <img
        src={logoUrl}
        alt={storeName}
        className={`${heightMap[size]} w-auto object-contain shrink-0 ${className}`}
      />
    );
  }

  const isDarkSurface = theme === 'dark';
  const strokeColor = isDarkSurface ? '#a1a1aa' : '#18181b';
  const hexFill = isDarkSurface ? 'rgba(24,24,27,0.7)' : '#ffffff';
  const primaryText = isDarkSurface ? '#ffffff' : '#09090b';
  const accentViolet = isDarkSurface ? '#a78bfa' : '#7c3aed';

  const iconDims = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11'
  }[size];

  const textSize = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  }[size];

  // Hexagons built with true regular hexagon math around center (50, 50), R = 15.5
  const hexPoints = (cx: number, cy: number, r = 14.5) => {
    const pts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const d = 26.5; // center-to-center distance
  const centers = [
    [50, 50 - d], // top
    [50, 50 + d], // bottom
    [50 - d * 0.866, 50 - d * 0.5], // top-left
    [50 - d * 0.866, 50 + d * 0.5], // bottom-left
    [50 + d * 0.866, 50 - d * 0.5], // top-right
    [50 + d * 0.866, 50 + d * 0.5], // bottom-right
    [50, 50] // center
  ];

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap shrink-0 select-none ${className}`}>
      <svg viewBox="0 0 100 100" className={`${iconDims} shrink-0`} aria-hidden="true">
        <g stroke={strokeColor} strokeWidth="2.4" fill={hexFill} strokeLinejoin="round">
          {centers.map(([cx, cy], idx) => (
            <polygon key={idx} points={hexPoints(cx, cy)} />
          ))}
        </g>
        {/* Golden starburst inside center hexagon */}
        <g stroke="#f59e0b" strokeLinecap="round">
          <line x1="50" y1="40" x2="50" y2="60" strokeWidth="1.8" />
          <line x1="40" y1="50" x2="60" y2="50" strokeWidth="1.8" />
          <line x1="43.5" y1="43.5" x2="56.5" y2="56.5" strokeWidth="1.2" opacity="0.8" />
          <line x1="56.5" y1="43.5" x2="43.5" y2="56.5" strokeWidth="1.2" opacity="0.8" />
          <circle cx="50" cy="50" r="2.2" fill="#fbbf24" stroke="none" />
        </g>
      </svg>

      {storeName.toLowerCase().replace(/\s+/g, '').startsWith('bdtechzen') ? (
        <span
          className={`font-display font-bold tracking-tight leading-none ${textSize}`}
          style={{ color: primaryText }}
        >
          <span>BD</span>
          <span className="italic" style={{ color: accentViolet }}>
            Tech
          </span>
          <span>Zen</span>
        </span>
      ) : (
        <span
          className={`font-display font-bold tracking-tight leading-none ${textSize}`}
          style={{ color: primaryText }}
        >
          {storeName}
        </span>
      )}
    </span>
  );
};
