import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

/**
 * Virtual Scroll Transition
 * 
 * Instead of using native page scroll (which causes mobile viewport height changes),
 * we capture wheel/touch events directly and track a "virtual" scroll position.
 * This prevents the mobile browser address bar from hiding/showing.
 */
export function useScrollTransition() {
  // The reactive value used for animations (smoothed)
  const scrollProgress = ref(0)
  
  // Internal state for math (non-reactive for performance)
  let targetProgress = 0
  let rafId: number | null = null
  
  // Touch tracking
  let touchStartY = 0
  let touchCurrentY = 0
  
  // Configuration
  const DAMPING_FACTOR = 0.08
  const WHEEL_SENSITIVITY = 0.001 // How much wheel delta affects progress
  const TOUCH_SENSITIVITY = 0.002 // How much touch delta affects progress
  
  const isMapZoomed = ref(false)

  // --- Computed Phases ---

  const isFrozen = computed(() => scrollProgress.value > 0.05)

  // Zoom: 0.0 -> 0.5 scroll range maps to 0.0 -> 1.0 output
  const zoomProgress = computed(() => {
    const p = scrollProgress.value
    if (p > 0.5) return 1
    return p * 2
  })

  // Clouds: 0.15 -> 0.7 scroll range
  const cloudProgress = computed(() => {
    const p = scrollProgress.value
    if (p < 0.15) return 0
    if (p > 0.7) return 1
    return (p - 0.15) / 0.55
  })

  // About: 0.5 -> 1.0 scroll range
  const aboutProgress = computed(() => {
    const p = scrollProgress.value
    if (p < 0.5) return 0
    return (p - 0.5) * 2
  })

  // --- Animation Loop (Smoothness Engine) ---

  function tick() {
    const diff = targetProgress - scrollProgress.value
    
    if (Math.abs(diff) < 0.0005) {
      scrollProgress.value = targetProgress
      rafId = null
      return
    }

    scrollProgress.value += diff * DAMPING_FACTOR
    rafId = requestAnimationFrame(tick)
  }

  function startTick() {
    if (!rafId) {
      rafId = requestAnimationFrame(tick)
    }
  }

  // --- Virtual Scroll Handlers ---

  function handleWheel(e: WheelEvent) {
    if (isMapZoomed.value) return
    
    // Prevent native scroll
    e.preventDefault()
    
    // Update target based on wheel delta
    const delta = e.deltaY * WHEEL_SENSITIVITY
    targetProgress = Math.min(1, Math.max(0, targetProgress + delta))
    
    startTick()
  }

  function handleTouchStart(e: TouchEvent) {
    if (isMapZoomed.value) return
    
    touchStartY = e.touches[0]!.clientY
    touchCurrentY = touchStartY
  }

  function handleTouchMove(e: TouchEvent) {
    if (isMapZoomed.value) return
    
    // Prevent native scroll
    e.preventDefault()
    
    const newY = e.touches[0]!.clientY
    const deltaY = touchCurrentY - newY // Inverted: swipe up = positive delta
    touchCurrentY = newY
    
    // Update target based on touch delta
    const delta = deltaY * TOUCH_SENSITIVITY
    targetProgress = Math.min(1, Math.max(0, targetProgress + delta))
    
    startTick()
  }

  function handleTouchEnd() {
    touchStartY = 0
    touchCurrentY = 0
  }

  // --- Locking Logic ---

  watch(isMapZoomed, (zoomed) => {
    if (typeof document === 'undefined') return

    if (zoomed) {
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      document.body.style.overflow = 'hidden' // Keep hidden for virtual scroll
      document.body.style.touchAction = 'none'
    }
  })

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

  onMounted(() => {
    if (typeof window === 'undefined') return

    // Lock the body to prevent native scroll
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'
    
    // Use { passive: false } to allow preventDefault
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    
    if (rafId) cancelAnimationFrame(rafId)
    
    // Cleanup
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    document.documentElement.style.overflow = ''
  })

  return {
    scrollProgress,
    isFrozen,
    zoomProgress,
    cloudProgress,
    aboutProgress,
    isMapZoomed,
    setMapZoomed,
    reset,
  }
}