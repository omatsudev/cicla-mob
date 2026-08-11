import { useEffect, useRef, useState } from 'react'

const THRESHOLD = 70
const MAX_PULL = 100

/**
 * Custom pull-to-refresh gesture, independent of the browser's native one.
 * Some mobile browsers (e.g. Firefox for Android) never implement a native
 * pull-to-refresh, and even where it exists, `overscroll-behavior` on the
 * page can suppress it — so a JS-driven gesture is the only way to guarantee
 * this works everywhere.
 */
export function PullToRefresh({ children }: { children: React.ReactNode }) {
  const [pullPx, setPullPx] = useState(0)
  const startY = useRef<number | null>(null)
  const active = useRef(false)

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 0) {
        startY.current = null
        active.current = false
        return
      }
      startY.current = e.touches[0].clientY
      active.current = true
    }

    function onTouchMove(e: TouchEvent) {
      if (!active.current || startY.current === null) return
      const delta = e.touches[0].clientY - startY.current
      if (delta > 0 && window.scrollY === 0) {
        setPullPx(Math.min(delta, MAX_PULL))
      } else {
        active.current = false
        setPullPx(0)
      }
    }

    function onTouchEnd() {
      if (!active.current) return
      active.current = false
      startY.current = null
      setPullPx((current) => {
        if (current > THRESHOLD) {
          window.location.reload()
          return current
        }
        return 0
      })
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [])

  const ready = pullPx > THRESHOLD

  return (
    <>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: pullPx, transition: pullPx === 0 ? 'height 0.2s ease-out' : undefined }}
      >
        {pullPx > 10 && (
          <div
            className={`w-6 h-6 border-2 border-rose-200 border-t-rose-600 rounded-full ${ready ? 'animate-spin' : ''}`}
            style={!ready ? { transform: `rotate(${pullPx * 3}deg)` } : undefined}
          />
        )}
      </div>
      {children}
    </>
  )
}
