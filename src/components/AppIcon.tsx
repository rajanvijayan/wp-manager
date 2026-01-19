interface AppIconProps {
  size?: number
  className?: string
}

export default function AppIcon({ size = 24, className = '' }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="32" cy="32" r="30" fill="url(#gradient)" />

      {/* W shape for WordPress */}
      <path
        d="M18 20L24 44L32 28L40 44L46 20"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Grid dots representing multiple sites */}
      <circle cx="18" cy="50" r="3" fill="white" opacity="0.8" />
      <circle cx="28" cy="50" r="3" fill="white" opacity="0.8" />
      <circle cx="38" cy="50" r="3" fill="white" opacity="0.8" />
      <circle cx="48" cy="50" r="3" fill="white" opacity="0.8" />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0073aa" />
          <stop offset="100%" stopColor="#005c8a" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// Simple icon version for smaller sizes
export function AppIconSimple({ size = 24, className = '' }: AppIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="32" cy="32" r="30" fill="url(#gradientSimple)" />
      <path
        d="M18 22L26 46L32 32L38 46L46 22"
        stroke="white"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <defs>
        <linearGradient
          id="gradientSimple"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0073aa" />
          <stop offset="100%" stopColor="#004d73" />
        </linearGradient>
      </defs>
    </svg>
  )
}
