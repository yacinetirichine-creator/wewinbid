import React from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'auto';

interface LogoProps {
  className?: string;
  size?: LogoSize;
  width?: number;
  height?: number;
  showText?: boolean;
  variant?: 'full' | 'icon' | 'text';
}

const sizeMap: Record<LogoSize, { width: number; height: number }> = {
  xs: { width: 100, height: 25 },   // Mobile navbar, très petit
  sm: { width: 130, height: 32 },   // Sidebar collapsed, footer
  md: { width: 160, height: 40 },   // Navbar desktop, default
  lg: { width: 200, height: 50 },   // Page d'accueil, login
  xl: { width: 280, height: 70 },   // Hero section, grands écrans
  auto: { width: 160, height: 40 }, // Responsive avec CSS
};

const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  size = 'md',
  width,
  height,
  showText = true,
  variant = 'full'
}) => {
  const brand = 'WeWinBid';
  const brandWe = 'We';
  const brandWin = 'Win';
  const brandBid = 'Bid';

  const dimensions = sizeMap[size];
  const finalWidth = width ?? dimensions.width;
  const finalHeight = height ?? dimensions.height;

  // Version icône uniquement (sans texte)
  if (variant === 'icon') {
    const iconSize = finalHeight;
    return (
      <svg
        width={iconSize * 2.2}
        height={iconSize}
        viewBox="0 0 110 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label={brand}
      >
        <defs>
          <linearGradient id="tech-gradient-icon" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>

        {/* Le symbole W fléché avec réseau */}
        <path
          d="M10 15 L30 40 L50 15 L70 40 L95 10"
          stroke="url(#tech-gradient-icon)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Pointe de la flèche */}
        <path
          d="M80 10 L100 10 L100 30"
          stroke="url(#tech-gradient-icon)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Points du réseau neuronal */}
        <circle cx="75" cy="25" r="2" fill="#00D4FF" className="animate-pulse" />
        <circle cx="85" cy="20" r="2" fill="#00D4FF" className="animate-pulse" style={{ animationDelay: '75ms' }} />
        <circle cx="90" cy="30" r="2" fill="#00D4FF" className="animate-pulse" style={{ animationDelay: '150ms' }} />
        <line x1="75" y1="25" x2="85" y2="20" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
        <line x1="85" y1="20" x2="90" y2="30" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
      </svg>
    );
  }

  // Version texte uniquement
  if (variant === 'text') {
    return (
      <svg
        width={finalWidth * 0.6}
        height={finalHeight}
        viewBox="0 0 120 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="WeWinBid"
      >
        <defs>
          <linearGradient id="tech-gradient-text" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#00D4FF" />
          </linearGradient>
        </defs>
        <text x="0" y="35" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="bold" fontSize="24" fill="url(#tech-gradient-text)">
          {brandWe}<tspan fontWeight="600">{brandWin}</tspan><tspan fontWeight="400">{brandBid}</tspan>
        </text>
      </svg>
    );
  }

  // Version complète (logo + texte)
  return (
    <svg
      width={finalWidth}
      height={finalHeight}
      viewBox="0 0 200 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} ${size === 'auto' ? 'w-full h-auto max-w-[200px]' : ''}`}
      aria-label={brand}
    >
      {/* Définition du dégradé */}
      <defs>
        <linearGradient id="tech-gradient-logo" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#00D4FF" />
        </linearGradient>
      </defs>

      {/* Le symbole W fléché avec réseau */}
      <path
        d="M10 15 L30 40 L50 15 L70 40 L95 10"
        stroke="url(#tech-gradient-logo)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Pointe de la flèche */}
      <path
        d="M80 10 L100 10 L100 30"
        stroke="url(#tech-gradient-logo)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Points du réseau neuronal (subtils) */}
      <circle cx="75" cy="25" r="2" fill="#00D4FF" className="animate-pulse" />
      <circle cx="85" cy="20" r="2" fill="#00D4FF" className="animate-pulse" style={{ animationDelay: '75ms' }} />
      <circle cx="90" cy="30" r="2" fill="#00D4FF" className="animate-pulse" style={{ animationDelay: '150ms' }} />
      <line x1="75" y1="25" x2="85" y2="20" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />
      <line x1="85" y1="20" x2="90" y2="30" stroke="#00D4FF" strokeWidth="1" opacity="0.5" />

      {/* Le texte */}
      {showText && (
        <text x="115" y="35" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="bold" fontSize="24" fill="white">
          {brandWe}<tspan fontWeight="600">{brandWin}</tspan><tspan fontWeight="400">{brandBid}</tspan>
        </text>
      )}
    </svg>
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
