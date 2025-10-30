export function FootVaultLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Dark sexy background circle */}
      <circle cx="100" cy="100" r="95" fill="#0a0a0a" />
      <circle cx="100" cy="100" r="95" stroke="url(#glowStroke)" strokeWidth="4" />

      {/* Vault door opening effect */}
      <g opacity="0.3">
        <path
          d="M 100 100 L 150 70 L 180 100 L 150 130 Z"
          fill="url(#vaultGradient)"
        />
        <path
          d="M 100 100 L 50 70 L 20 100 L 50 130 Z"
          fill="url(#vaultGradient)"
        />
      </g>

      {/* Center "F" formed by a sexy foot silhouette */}
      <g transform="translate(80, 50)">
        {/* Foot forming the letter F */}
        <path
          d="M 20 20 L 60 20 L 60 30 L 30 30 L 30 60 L 55 60 L 55 70 L 30 70 L 30 120 L 20 120 Z"
          fill="url(#letterGradient)"
          stroke="#ff1493"
          strokeWidth="2"
        />

        {/* Toes extending from the F */}
        <g transform="translate(55, 15)">
          <ellipse cx="0" cy="5" rx="4" ry="6" fill="#ff1493" opacity="0.9" />
          <ellipse cx="8" cy="3" rx="4" ry="6" fill="#ff1493" opacity="0.9" />
          <ellipse cx="16" cy="5" rx="4" ry="6" fill="#ff1493" opacity="0.9" />
          <ellipse cx="23" cy="7" rx="3.5" ry="5" fill="#ff1493" opacity="0.9" />
        </g>

        {/* Heel spike from bottom of F */}
        <path
          d="M 25 120 L 30 140 L 20 140 Z"
          fill="#ff1493"
        />
      </g>

      {/* Circular "V" for Vault with seductive curves */}
      <g transform="translate(50, 90)">
        <path
          d="M 30 20 L 50 60 L 70 20"
          stroke="url(#vPinkGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* Anklet/jewelry detail on the V */}
        <circle cx="35" cy="30" r="3" fill="#ffd700" opacity="0.8" />
        <circle cx="65" cy="30" r="3" fill="#ffd700" opacity="0.8" />
      </g>

      {/* Keyhole in center (vault theme) */}
      <g transform="translate(95, 100)">
        <circle cx="5" cy="0" r="6" fill="#ff1493" opacity="0.4" />
        <path d="M 3 0 L 7 0 L 7 12 L 3 12 Z" fill="#ff1493" opacity="0.4" />
      </g>

      {/* Decorative corner elements - 18+ */}
      <g transform="translate(155, 25)">
        <rect x="0" y="0" width="35" height="20" rx="10" fill="#ff1493" />
        <text x="17.5" y="14" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
          18+
        </text>
      </g>

      {/* Sexy accent lines */}
      <path d="M 40 180 Q 100 170 160 180" stroke="#ff1493" strokeWidth="2" opacity="0.6" />
      <path d="M 30 170 Q 100 165 170 170" stroke="#ff69b4" strokeWidth="1" opacity="0.4" />

      {/* Sparkle accents */}
      <circle cx="140" cy="50" r="2" fill="#ff1493" opacity="0.8" />
      <circle cx="60" cy="60" r="2" fill="#ff69b4" opacity="0.8" />
      <circle cx="150" cy="140" r="2" fill="#ff1493" opacity="0.8" />
      <circle cx="45" cy="130" r="2" fill="#ff69b4" opacity="0.8" />

      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="glowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff1493" />
          <stop offset="50%" stopColor="#ff69b4" />
          <stop offset="100%" stopColor="#ff1493" />
        </linearGradient>

        <linearGradient id="vaultGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>

        <linearGradient id="letterGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ff69b4" />
          <stop offset="50%" stopColor="#ff1493" />
          <stop offset="100%" stopColor="#c71585" />
        </linearGradient>

        <linearGradient id="vPinkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ff1493" />
          <stop offset="100%" stopColor="#ff69b4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
