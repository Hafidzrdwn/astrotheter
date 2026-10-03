import React from 'react'

export interface AstroLogoProps {
  size?: number
  showText?: boolean
  className?: string
}

/**
 * Bespoke SVG Logo for AstroTether
 * Visualizing the dual-screen co-op bond: Alpha Pod (Cyan) & Beta Pod (Pink)
 * interconnected by an elastic quantum tether orbiting a central stellar nexus.
 */
export const AstroLogo: React.FC<AstroLogoProps> = ({
  size = 40,
  showText = false,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* SVG Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="logoTether" x1="16" y1="18" x2="48" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#FFE600" />
            <stop offset="100%" stopColor="#FF2A85" />
          </linearGradient>
          <linearGradient id="logoCyanPod" x1="12" y1="14" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#70F8FF" />
            <stop offset="100%" stopColor="#00B8D4" />
          </linearGradient>
          <linearGradient id="logoPinkPod" x1="40" y1="40" x2="52" y2="50" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FF65A5" />
            <stop offset="100%" stopColor="#D9005B" />
          </linearGradient>
          <radialGradient id="logoBadgeBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#131C2E" />
            <stop offset="100%" stopColor="#070A12" />
          </radialGradient>
          <filter id="logoGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shield Frame */}
        <rect width="64" height="64" rx="18" fill="url(#logoBadgeBg)" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" />

        {/* Subtle Orbital Halo */}
        <ellipse cx="32" cy="32" rx="22" ry="14" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.2" strokeDasharray="3 3" transform="rotate(-20 32 32)" />

        {/* Dynamic Elastic Tether Curve */}
        <path
          d="M18 20 C28 10, 48 22, 32 32 C16 42, 36 54, 46 44"
          stroke="url(#logoTether)"
          strokeWidth="3.2"
          strokeLinecap="round"
          fill="none"
          filter="url(#logoGlow)"
        />

        {/* Center Starlight Core Spark */}
        <circle cx="32" cy="32" r="3.5" fill="#FFE600" filter="url(#logoGlow)" />
        <path d="M32 25 L33.2 30.8 L39 32 L33.2 33.2 L32 39 L30.8 33.2 L25 32 L30.8 30.8 Z" fill="#FFFFFF" opacity="0.95" />

        {/* Alpha Pod (Cyan Ship, Top-Left) */}
        <g transform="translate(18, 20) rotate(45)">
          <circle cx="-8" cy="0" r="2.2" fill="#00F0FF" opacity="0.8" />
          <circle cx="-13" cy="0" r="1.2" fill="#00F0FF" opacity="0.4" />
          <path d="M7.5 0 L-6 -6 L-3.2 0 L-6 6 Z" fill="url(#logoCyanPod)" stroke="#00F0FF" strokeWidth="1.2" />
          <circle cx="0.5" cy="0" r="1.8" fill="#FFFFFF" />
        </g>

        {/* Beta Pod (Pink Ship, Bottom-Right) */}
        <g transform="translate(46, 44) rotate(-135)">
          <circle cx="-8" cy="0" r="2.2" fill="#FF2A85" opacity="0.8" />
          <circle cx="-13" cy="0" r="1.2" fill="#FF2A85" opacity="0.4" />
          <path d="M7.5 0 L-6 -6 L-3.2 0 L-6 6 Z" fill="url(#logoPinkPod)" stroke="#FF2A85" strokeWidth="1.2" />
          <circle cx="0.5" cy="0" r="1.8" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-['Orbitron'] text-xl md:text-2xl font-black tracking-wider text-white leading-none">
            ASTRO<span className="text-[#FF2A85]">TETHER</span>
          </span>
          <span className="text-[10px] tracking-widest text-[#00F0FF] uppercase font-['Rajdhani'] font-bold">
            Co-Op Space Odyssey
          </span>
        </div>
      )}
    </div>
  )
}
