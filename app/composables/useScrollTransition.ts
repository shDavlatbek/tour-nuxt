import { ref, computed, onMounted, onUnmounted, type Ref, type ComputedRef } from 'vue'

export interface ScrollPin {
  position: number
  duration: number
}

interface ScrollOptions {
  initialMaxScroll?: number
  pins?: ScrollPin[]
}

/**
 * CORE SCROLL ENGINE
 * Handles: Wheel/Touch capture, Momentum, Pinning, and Progress Tracking.
 */
export function useScrollTransition(options: ScrollOptions = {}) {
  // --- Config ---
  const maxScroll = ref(options.initialMaxScroll ?? 1)
  const SECTION_PINS = options.pins ?? []
  
  // Physics Constants
  const DAMPING = 0.08
  const SENSITIVITY_WHEEL = 0.0006
  const SENSITIVITY_TOUCH = 0.002

  // --- State ---
  const scrollProgress = ref(0)
  const isMapZoomed = ref(false)
  
  // Internal Physics State
  let targetProgress = 0
  let rafId: number | null = null
  let touchStartY = 0
  let touchCurrentY = 0

  // Pinning State
  let isPinned = false
  let lastCrossedPin: number | null = null

  // --- Animation Loop ---
  function tick() {
    const diff = targetProgress - scrollProgress.value
    
    if (Math.abs(diff) < 0.0001) {
      scrollProgress.value = targetProgress
      rafId = null
      return
    }

    scrollProgress.value += diff * DAMPING
    rafId = requestAnimationFrame(tick)
  }

  function startTick() {
    if (!rafId) rafId = requestAnimationFrame(tick)
  }

  // --- Pinning Logic ---
  function checkPinning(oldTarget: number, newTarget: number): number {
    if (isPinned) return oldTarget
    
    for (const pin of SECTION_PINS) {
      const crossingDown = oldTarget < pin.position && newTarget >= pin.position
      const crossingUp = oldTarget > pin.position && newTarget <= pin.position
      
      if ((crossingDown || crossingUp) && lastCrossedPin !== pin.position) {
        isPinned = true
        lastCrossedPin = pin.position
        
        setTimeout(() => { isPinned = false }, pin.duration)
        
        return pin.position
      }
    }
    
    if (lastCrossedPin !== null && Math.abs(newTarget - lastCrossedPin) > 0.1) {
      lastCrossedPin = null
    }
    
    return newTarget
  }

  // --- Event Handlers ---
  function handleWheel(e: WheelEvent) {
    if (isMapZoomed.value) return
    e.preventDefault()

    const delta = e.deltaY * SENSITIVITY_WHEEL
    const rawTarget = Math.min(maxScroll.value, Math.max(0, targetProgress + delta))
    targetProgress = checkPinning(targetProgress, rawTarget)
    
    startTick()
  }

  function handleTouchStart(e: TouchEvent) {
    if (isMapZoomed.value) return
    touchStartY = e.touches[0]!.clientY
    touchCurrentY = touchStartY
  }

  function handleTouchMove(e: TouchEvent) {
    if (isMapZoomed.value) return
    e.preventDefault()

    const newY = e.touches[0]!.clientY
    const deltaY = touchCurrentY - newY
    touchCurrentY = newY
    
    const delta = deltaY * SENSITIVITY_TOUCH
    const rawTarget = Math.min(maxScroll.value, Math.max(0, targetProgress + delta))
    targetProgress = checkPinning(targetProgress, rawTarget)
    
    startTick()
  }

  // --- Helpers ---

  interface PhaseOptions {
    /** Direction of movement: 'up' slides from bottom to top, 'down' slides from top to bottom */
    direction?: 'up' | 'down' | 'none'
  }

  interface PhaseResult {
    /** Progress value from 0 to 1 */
    progress: ComputedRef<number>
    /** Style object with transform (1.0 = 100vh movement) */
    style: ComputedRef<Record<string, string>>
    /** Whether this phase is currently active (progress > 0 and < 1) */
    isActive: ComputedRef<boolean>
    /** Whether this phase is complete (progress >= 1) */
    isComplete: ComputedRef<boolean>
  }

  /**
   * Creates computed values for a specific phase of the scroll.
   * Returns both progress (0-1) and style (with translateY transform).
   * 
   * Usage: 
   * const hero = createPhase(0, 0.5, { direction: 'none' })
   * const about = createPhase(0.5, 1.0, { direction: 'up' })
   * 
   * In template: :style="about.style.value"
   */
  function createPhase(start: number, end: number, options: PhaseOptions = {}): PhaseResult {
    const { direction = 'up' } = options

    const progress = computed(() => {
      const p = scrollProgress.value
      if (p < start) return 0
      if (p > end) return 1
      return (p - start) / (end - start)
    })

    const style = computed(() => {
      const p = progress.value
      
      if (direction === 'none') {
        return {
          opacity: String(p),
          transform: 'none',
          visibility: 'visible' as const,
          willChange: 'opacity'
        }
      }
      
      // 'up' = starts at 100vh below, moves to 0
      // 'down' = starts at -100vh above, moves to 0
      const startY = direction === 'up' ? 100 : -100
      const translateY = startY - (p * Math.abs(startY))
      
      return {
        opacity: '1',
        transform: `translate3d(0, ${translateY}vh, 0)`,
        visibility: (p > 0.001 ? 'visible' : 'hidden') as 'visible' | 'hidden',
        willChange: 'transform'
      }
    })

    const isActive = computed(() => progress.value > 0 && progress.value < 1)
    const isComplete = computed(() => progress.value >= 1)

    return { progress, style, isActive, isComplete }
  }

  function setMaxScroll(val: number) {
    maxScroll.value = val
  }
  
  function setMapZoomed(zoomed: boolean) {
    isMapZoomed.value = zoomed
  }

  function setProgress(val: number) {
    targetProgress = Math.max(0, val)
    scrollProgress.value = targetProgress
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  function reset() {
    setProgress(0)
  }

  // --- Lifecycle ---
  let listenersAttached = false

  function attachListeners() {
    if (listenersAttached || typeof window === 'undefined') return
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    listenersAttached = true
  }

  function detachListeners() {
    if (!listenersAttached || typeof window === 'undefined') return
    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
    listenersAttached = false
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    
    // Lock native scroll
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'
    
    attachListeners()
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return
    
    detachListeners()
    if (rafId) cancelAnimationFrame(rafId)
    
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    document.documentElement.style.overflow = ''
  })

  return {
    scrollProgress,
    maxScroll,
    setMaxScroll,
    createPhase,
    isMapZoomed,
    setMapZoomed,
    setProgress,
    reset,
  }
}
