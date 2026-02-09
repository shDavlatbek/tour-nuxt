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
  const DAMPING = 0.05
  const SENSITIVITY_WHEEL = 0.0005
  const SENSITIVITY_TOUCH = 0.001

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

  // --- Computed Phases (Legacy Support) ---
  const isFrozen = computed(() => scrollProgress.value > 0.05)
  const zoomProgress = computed(() => {
    const p = scrollProgress.value
    if (p > 0.5) return 1
    return p * 2
  })
  const cloudProgress = computed(() => {
    const p = scrollProgress.value
    if (p < 0.15) return 0
    if (p > 0.7) return 1
    return (p - 0.15) / 0.55
  })
  const aboutProgress = computed(() => {
    const p = scrollProgress.value
    if (p < 0.5) return 0
    if (p > 1.0) return 1
    return (p - 0.5) * 2
  })

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
  
  /**
   * Creates a computed value (0 to 1) for a specific phase of the scroll.
   */
  function createPhase(start: number, end: number): ComputedRef<number> {
    return computed(() => {
      const p = scrollProgress.value
      if (p < start) return 0
      if (p > end) return 1
      return (p - start) / (end - start)
    })
  }

  function setMaxScroll(val: number) {
    maxScroll.value = val
  }
  
  function setMapZoomed(zoomed: boolean) {
    isMapZoomed.value = zoomed
  }

  function reset() {
    targetProgress = 0
    scrollProgress.value = 0
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
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
    // Legacy computed phases
    isFrozen,
    zoomProgress,
    cloudProgress,
    aboutProgress,
    // Controls
    isMapZoomed,
    setMapZoomed,
    reset,
  }
}