import type { ReactNode } from 'react'

type IconProps = { size?: number; className?: string }

function Svg({
  size = 16,
  className,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {children}
    </svg>
  )
}

export function IconFolder({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </Svg>
  )
}

export function IconExternal({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M14 3h7v7" />
      <path d="M10 14 21 3" />
      <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" />
    </Svg>
  )
}

export function IconGear({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </Svg>
  )
}

export function IconStop({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconRocket({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M5 19c2-1 4.5-1.5 7-4.5 1.2-1.4 2-3.2 2.5-5 .2-.8.3-1.6.3-2.4 0-.5-.1-1-.2-1.5C11.5 6.2 8.8 7.5 6.5 10 3.5 12.5 3 15 2 17l3 2z" />
      <path d="M14 4.5c.8-.2 1.7-.3 2.5-.3.8 0 1.6.1 2.4.3L16 8" />
      <path d="M9 15l-2 4 4-2" />
    </Svg>
  )
}

/** Simple cursor-arrow mark for “open in Cursor” */
export function IconCursor({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M4 3l7 17 2.5-6.5L20 11z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconSearch({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </Svg>
  )
}

export function IconRefresh({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M21 12a9 9 0 1 1-2.6-6.4" />
      <path d="M21 3v6h-6" />
    </Svg>
  )
}

export function IconPlus({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M12 5v14M5 12h14" />
    </Svg>
  )
}

export function IconPlay({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M8 5v14l11-7z" fill="currentColor" stroke="none" />
    </Svg>
  )
}

export function IconSettings({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </Svg>
  )
}

export function IconTerminal({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <path d="M4 17 10 11 4 5" />
      <path d="M12 19h8" />
    </Svg>
  )
}

export function IconGitPull({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <path d="M6 8v8" />
      <path d="M18 11V6a2 2 0 0 0-2-2h-3" />
      <path d="m11 6 2-2 2 2" />
      <path d="M18 11a4 4 0 0 1-4 4H6" />
    </Svg>
  )
}

export function IconGitPush({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="6" r="2" />
      <path d="M6 16V8a4 4 0 0 1 4-4h3" />
      <path d="m11 6 2-2 2 2" />
      <path d="M18 8v8" />
    </Svg>
  )
}

export function IconGitCommit({ size, className }: IconProps) {
  return (
    <Svg size={size} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6" />
    </Svg>
  )
}

/** Simplified Figma mark */
export function IconFigma({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        fill="#F24E1E"
        d="M8 24a4 4 0 0 0 4-4v-4H8a4 4 0 1 0 0 8z"
      />
      <path fill="#A259FF" d="M4 12a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" />
      <path fill="#1ABCFE" d="M12 4h4a4 4 0 1 1 0 8h-4V4z" />
      <path fill="#0ACF83" d="M12 0H8a4 4 0 0 0 0 8h4V0z" />
      <path fill="#FF7262" d="M12 0h4a4 4 0 1 1 0 8h-4V0z" />
    </svg>
  )
}

/** Google Sheets-like grid mark */
export function IconSheets({ size = 16, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      <path
        fill="#0F9D58"
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
      />
      <path fill="#87CEAC" d="M14 2v6h6l-6-6z" />
      <path
        fill="#fff"
        d="M7.5 11h9v8h-9v-8zm1 1.5v2h2.5v-2H8.5zm3.5 0v2H14v-2h-2zm3.5 0v2h2v-2h-2zm-7 3.5v2H11v-2H8.5zm3.5 0v2H14v-2h-2zm3.5 0v2h2v-2h-2z"
      />
    </svg>
  )
}
