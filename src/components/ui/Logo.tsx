import React from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';

interface LogoProps {
  className?: string;
  size?: LogoSize;
  width?: number;
  height?: number;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
  theme?: 'light' | 'dark' | 'auto';
}

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 100, height: 25 },
  sm: { width: 130, height: 32 },
  md: { width: 160, height: 40 },
  lg: { width: 200, height: 50 },
  xl: { width: 280, height: 70 },
  auto: { width: 160, height: 40 },
};

const Logo: React.FC<LogoProps> = ({
  className = "",
  size = 'md',
  width,
  height,
  showText = true,
  variant = 'full',
  theme = 'auto'
}) => {
  const brand = 'WeWinBid';

  const dimensions = sizeMap[size];
  const finalWidth = width ?? dimensions.width;
  const finalHeight = height ?? dimensions.height;

  // Unique gradient IDs to avoid conflicts
  const gradientId = `wwb-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `wwb-glow-${Math.random().toString(36).substr(2, 9)}`;

  // Text color based on theme
  const getTextClass = () => {
    if (theme === 'light') return 'fill-surface-900';
    if (theme === 'dark') return 'fill-white';
    return 'fill-surface-900 dark:fill-white';
  };

  // Version icone uniquement
  if (variant === 'icon') {
    const iconSize = finalHeight;
    return (
      <svg
        width={iconSize * 1.2}
        height={iconSize}
        viewBox="0 0 60 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label={brand}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* W moderne stylisé avec flèche montante - symbolise la victoire */}
        <g filter={`url(#${glowId})`}>
          {/* Forme W avec ascension */}
          <path
            d="M5 12 L15 38 L30 18 L45 38 L55 12"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Flèche de victoire au sommet */}
          <path
            d="M45 12 L55 12 L55 22"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Point lumineux de victoire */}
          <circle
            cx="55"
            cy="8"
            r="3"
            fill="#10B981"
            className="animate-pulse"
          />
        </g>
      </svg>
    );
  }

  // Version texte uniquement
  if (variant === 'text') {
    return (
      <div className={`flex items-center ${className}`} aria-label={brand}>
        <span className={`font-display font-bold tracking-tight ${getTextClass()}`} style={{ fontSize: finalHeight * 0.5 }}>
          <span className="text-primary-600">We</span>
          <span className="text-accent-500">Win</span>
          <span className={theme === 'auto' ? 'text-surface-700 dark:text-surface-300' : theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}>Bid</span>
        </span>
      </div>
    );
  }

  // Version complète (logo + texte)
  return (
    <div
      className={`flex items-center gap-2 ${className} ${size === 'auto' ? 'w-full max-w-[200px]' : ''}`}
      aria-label={brand}
    >
      {/* Icône du logo */}
      <svg
        width={finalHeight * 1.2}
        height={finalHeight}
        viewBox="0 0 60 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#10B981" />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <g filter={`url(#${glowId})`}>
          {/* Forme W avec ascension */}
          <path
            d="M5 12 L15 38 L30 18 L45 38 L55 12"
            stroke={`url(#${gradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Flèche de victoire */}
          <path
            d="M45 12 L55 12 L55 22"
            stroke={`url(#${gradientId})`}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Point lumineux */}
          <circle
            cx="55"
            cy="8"
            r="3"
            fill="#10B981"
            className="animate-pulse"
          />
        </g>
      </svg>

      {/* Texte du logo */}
      {showText && (
        <span className={`font-display font-bold tracking-tight ${getTextClass()}`} style={{ fontSize: finalHeight * 0.48 }}>
          <span className="text-primary-600">We</span>
          <span className="text-accent-500">Win</span>
          <span className={theme === 'auto' ? 'text-surface-700 dark:text-surface-300' : theme === 'dark' ? 'text-surface-300' : 'text-surface-700'}>Bid</span>
        </span>
      )}
    </div>
  );
};

// Composants pré-configurés pour une utilisation facile
export const LogoNavbar: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="md" className={className} />
);

export const LogoMobile: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="sm" className={className} />
);

export const LogoSidebar: React.FC<{ className?: string; collapsed?: boolean }> = ({ className, collapsed }) => (
  <Logo size={collapsed ? 'xs' : 'sm'} variant={collapsed ? 'icon' : 'full'} className={className} />
);

export const LogoHero: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="xl" className={className} />
);

export const LogoFooter: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="sm" className={className} />
);

export const LogoIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 40 }) => (
  <Logo variant="icon" height={size} className={className} />
);

export const LogoAuth: React.FC<{ className?: string }> = ({ className }) => (
  <Logo size="lg" className={className} />
);

export default Logo;
