'use client'

import { useTheme } from 'next-themes'
import { useIsMobile } from '@/hooks/use-mobile'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isMobile = useIsMobile()

  if (isMobile) {
    // Mobile: Simple button toggle
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="size-9"
        aria-label="Toggle theme"
      >
        <div className="relative w-4 h-4">
          {/* Minimal circle icon */}
          <div className={cn(
            'absolute inset-0 rounded-full transition-all duration-300',
            theme === 'dark'
              ? 'bg-orange-500 opacity-100'
              : 'bg-gray-400 opacity-100'
          )} />
        </div>
      </Button>
    )
  }

  // Desktop: Horizontal slider
  return (
    <div
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={cn(
        'relative inline-flex items-center w-14 h-7 rounded-full cursor-pointer transition-colors duration-300',
        'bg-gray-300 dark:bg-orange-600',
        'border border-gray-400 dark:border-orange-500'
      )}
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Toggle between light and dark mode"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setTheme(theme === 'dark' ? 'light' : 'dark')
        }
      }}
    >
      {/* Slider background with labels */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 text-xs font-bold">
        <span className={cn(
          'transition-opacity duration-300',
          theme === 'light' ? 'opacity-100' : 'opacity-50'
        )}>
          L
        </span>
        <span className={cn(
          'transition-opacity duration-300',
          theme === 'dark' ? 'opacity-100' : 'opacity-50'
        )}>
          D
        </span>
      </div>

      {/* Slider knob */}
      <div
        className={cn(
          'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 flex items-center justify-center',
          theme === 'dark' && 'translate-x-7'
        )}
      >
        {/* Minimal circle icon in knob */}
        <div className={cn(
          'w-3 h-3 rounded-full transition-colors duration-300',
          theme === 'dark' ? 'bg-orange-500' : 'bg-gray-400'
        )} />
      </div>
    </div>
  )
}
