import React from 'react';

interface UPPoliceLogoProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export const UPPoliceLogo: React.FC<UPPoliceLogoProps> = ({
  className = '',
  width = '100%',
  height = 'auto',
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 200 230"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Background/Shadow Group if any */}
      <g>
        {/* Wheat wreath/leaves garland on the left */}
        <g transform="translate(20, 40)">
          <path
            d="M30 140 C25 120, 15 100, 18 80 C10 75, 5 60, 10 45 C5 35, 8 20, 15 10"
            stroke="#C8962E"
            strokeWidth="3.5"
            fill="none"
          />
          <ellipse cx="10" cy="45" rx="8" ry="14" fill="#C8962E" transform="rotate(-20,10,45)" />
          <ellipse cx="13" cy="65" rx="7" ry="12" fill="#C8962E" transform="rotate(-15,13,65)" />
          <ellipse cx="18" cy="85" rx="7" ry="12" fill="#C8962E" transform="rotate(-10,18,85)" />
          <ellipse cx="22" cy="105" rx="6" ry="11" fill="#C8962E" transform="rotate(-5,22,105)" />
          <ellipse cx="26" cy="122" rx="6" ry="10" fill="#C8962E" transform="rotate(0,26,122)" />
        </g>

        {/* Wheat wreath/leaves garland on the right (mirrored) */}
        <g transform="translate(180, 40) scale(-1, 1)">
          <path
            d="M30 140 C25 120, 15 100, 18 80 C10 75, 5 60, 10 45 C5 35, 8 20, 15 10"
            stroke="#C8962E"
            strokeWidth="3.5"
            fill="none"
          />
          <ellipse cx="10" cy="45" rx="8" ry="14" fill="#C8962E" transform="rotate(-20,10,45)" />
          <ellipse cx="13" cy="65" rx="7" ry="12" fill="#C8962E" transform="rotate(-15,13,65)" />
          <ellipse cx="18" cy="85" rx="7" ry="12" fill="#C8962E" transform="rotate(-10,18,85)" />
          <ellipse cx="22" cy="105" rx="6" ry="11" fill="#C8962E" transform="rotate(-5,22,105)" />
          <ellipse cx="26" cy="122" rx="6" ry="10" fill="#C8962E" transform="rotate(0,26,122)" />
        </g>

        {/* Central shield/circle: Solid red */}
        <circle cx="100" cy="115" r="52" fill="#d2232a" stroke="#C8962E" strokeWidth="4" />
        <circle cx="100" cy="115" r="44" fill="none" stroke="#C8962E" strokeWidth="1.5" />

        {/* Two Golden Fishes facing each other inside red shield */}
        {/* Left Fish */}
        <path
          d="M85 115 C85 95, 100 100, 100 112 C95 112, 90 108, 90 115 C90 122, 95 118, 100 118 C100 130, 85 135, 85 115 Z"
          fill="#C8962E"
        />
        <path
          d="M85 115 C75 115, 68 105, 68 115 C68 125, 75 115, 85 115 Z"
          fill="#C8962E"
        />
        {/* Right Fish */}
        <path
          d="M115 115 C115 95, 100 100, 100 112 C105 112, 110 108, 110 115 C110 122, 105 118, 100 118 C100 130, 115 135, 115 115 Z"
          fill="#C8962E"
        />
        <path
          d="M115 115 C125 115, 132 105, 132 115 C132 125, 125 115, 115 115 Z"
          fill="#C8962E"
        />
        
        {/* Connective details for fishes/design in shield */}
        <circle cx="83" cy="112" r="1.5" fill="#d2232a" />
        <circle cx="117" cy="112" r="1.5" fill="#d2232a" />

        {/* Ashoka Pillar Emblem at the top */}
        <g transform="translate(100, 32)">
          {/* Base pedestal */}
          <rect x="-24" y="16" width="48" height="6" rx="1.5" fill="#C8962E" />
          <path d="M-18 16 L-14 8 L14 8 L18 16 Z" fill="#C8962E" />
          
          {/* Center Ashoka Chakra on abacus */}
          <circle cx="0" cy="12" r="3" fill="#7B1818" stroke="#C8962E" strokeWidth="1" />
          
          {/* Lions */}
          {/* Left Lion */}
          <path d="M-14 8 C-14 -2, -6 -2, -6 8 Z" fill="#C8962E" />
          <path d="M-15 4 C-19 4, -18 -2, -14 -2 Z" fill="#C8962E" />
          
          {/* Right Lion */}
          <path d="M6 8 C6 -2, 14 -2, 14 8 Z" fill="#C8962E" />
          <path d="M14 -2 C18 -2, 19 4, 15 4 Z" fill="#C8962E" />
          
          {/* Center Lion */}
          <path d="M-6 8 C-6 -8, 6 -8, 6 8 Z" fill="#C8962E" />
          <path d="M-5 -2 L5 -2 L3 -12 L-3 -12 Z" fill="#C8962E" />
        </g>

        {/* Blue Ribbon/Banner at the bottom */}
        <path
          d="M 30 180 Q 100 200 170 180 L 163 202 Q 100 220 37 202 Z"
          fill="#1A237E"
          stroke="#C8962E"
          strokeWidth="1.5"
        />
        {/* Banner Fold Left */}
        <path d="M 30 180 L 22 192 L 35 195 Z" fill="#0f145c" />
        {/* Banner Fold Right */}
        <path d="M 170 180 L 178 192 L 165 195 Z" fill="#0f145c" />

        {/* Text on ribbon */}
        <path id="text-path" d="M 40 193 Q 100 208 160 193" fill="none" />
        <text fontFamily="'Noto Sans Devanagari', sans-serif" fontSize="10.5" fontWeight="800" fill="#FFFFFF">
          <textPath href="#text-path" startOffset="50%" textAnchor="middle">
            उत्तर प्रदेश पुलिस
          </textPath>
        </text>
      </g>
    </svg>
  );
};
