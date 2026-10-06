import { createContext, useContext, useId, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type CerArtVariant = 'leaves' | 'flower' | 'sun' | 'waves' | 'path' | 'seed'
const variants: CerArtVariant[] = ['leaves', 'flower', 'sun', 'waves', 'path', 'seed']
const ArtContext = createContext(0)

/** Stable, local decoration. Never reads or transforms a person's answers. */
export function useCerArt(): CerArtVariant {
  const area = useContext(ArtContext)
  const id = useId()
  const offset = Array.from(id).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return variants[(area + offset) % variants.length]
}

export function CerVisualTheme({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const area = pathname.includes('planner')
    ? 2
    : pathname.includes('mandala')
      ? 3
      : pathname.includes('reviews')
        ? 4
        : pathname.includes('biblioteca')
          ? 0
          : pathname.includes('profissional')
            ? 5
            : 1
  return (
    <ArtContext.Provider value={area}>
      <div className="cer-app">{children}</div>
    </ArtContext.Provider>
  )
}

/** Six drawings in the same botanical linework, with a quiet terracotta accent. */
export function CerArtwork({
  variant = 'leaves',
  className,
}: {
  variant?: CerArtVariant
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 180 100"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn('cer-artwork', className)}
      data-cer-art={variant}
    >
      {variant === 'leaves' && (
        <>
          <path d="M29 87C78 88 78 22 143 16M60 79C33 72 31 49 35 45C55 47 67 62 60 79ZM81 61C78 36 101 28 110 31C111 47 98 61 81 61ZM107 33C99 12 117 8 128 11C131 24 119 32 107 33ZM80 62C55 59 52 37 56 31C74 34 85 45 80 62Z" />
          <path className="cer-art-accent" d="M137 62l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" />
        </>
      )}
      {variant === 'flower' && (
        <>
          <path d="M93 90C84 71 94 53 87 39M92 76C111 73 123 61 120 56C103 55 93 64 92 76ZM89 65C68 65 56 53 60 49C78 47 89 54 89 65Z" />
          <path
            className="cer-art-accent"
            d="M88 37C70 42 60 30 66 24C73 18 83 28 85 32C73 16 82 5 89 10C96 14 91 26 90 30C98 13 113 13 113 21C113 29 100 33 94 34C113 30 120 42 112 47C104 51 95 42 92 39C99 57 85 63 81 54C78 47 84 41 88 37Z"
          />
          <circle cx="89" cy="36" r="4" />
          <path d="M137 29l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" />
        </>
      )}
      {variant === 'sun' && (
        <>
          <circle className="cer-art-accent" cx="94" cy="38" r="18" />
          <path
            className="cer-art-accent"
            d="M94 10V4M94 66v6M66 38h-6M122 38h6M74 18l-5-5M114 18l5-5M74 58l-5 5M114 58l5 5"
          />
          <path d="M22 88C40 71 48 71 62 81S92 91 110 78S140 70 159 85M34 89C24 71 28 58 34 54C47 64 48 76 34 89ZM44 83C44 63 58 55 67 59C66 74 55 83 44 83Z" />
        </>
      )}
      {variant === 'waves' && (
        <>
          <path d="M16 61C37 43 53 83 78 62S122 43 164 62M23 75C50 55 63 92 87 76S137 59 157 78M52 48C51 26 66 14 74 14C80 32 68 44 52 48ZM52 48C29 43 27 29 30 24C45 25 54 34 52 48Z" />
          <circle className="cer-art-accent" cx="122" cy="24" r="11" />
          <path className="cer-art-accent" d="M119 24h6M122 21v6" />
        </>
      )}
      {variant === 'path' && (
        <>
          <path d="M18 79C56 94 30 41 71 49S114 88 130 52S152 27 164 36M154 27l10 9-12 7" />
          <circle cx="18" cy="79" r="4" />
          <circle cx="72" cy="49" r="4" />
          <path d="M105 34C95 16 100 8 105 8C115 17 116 28 105 34ZM105 34C122 32 130 21 126 17C113 15 105 22 105 34Z" />
          <path className="cer-art-accent" d="M48 20l3-7 3 7 7 3-7 3-3 7-3-7-7-3Z" />
        </>
      )}
      {variant === 'seed' && (
        <>
          <path d="M91 86V42M91 58C61 64 44 42 46 29C73 29 90 37 91 58ZM91 46C91 22 112 13 132 16C130 36 117 46 91 46ZM91 58L55 36M91 45l31-22M58 90C72 82 110 82 128 90" />
          <circle className="cer-art-accent" cx="146" cy="61" r="4" />
          <path className="cer-art-accent" d="M36 73l2-5 2 5 5 2-5 2-2 5-2-5-5-2Z" />
        </>
      )}
    </svg>
  )
}

export function CerArtStrip({
  variant,
  compact = false,
}: {
  variant?: CerArtVariant
  compact?: boolean
}) {
  const automatic = useCerArt()
  return (
    <div aria-hidden="true" className={cn('cer-art-strip', compact && 'cer-art-strip-compact')}>
      <span className="cer-art-rule" />
      <CerArtwork variant={variant ?? automatic} />
    </div>
  )
}

export function CerIntro({
  title,
  children,
  variant = 'seed',
}: {
  title: string
  children: ReactNode
  variant?: CerArtVariant
}) {
  return (
    <div className="cer-intro">
      <div className="cer-intro-copy">
        <h2>{title}</h2>
        <div>{children}</div>
      </div>
      <CerArtwork variant={variant} />
    </div>
  )
}
