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
  const DAMPING_FACTOR = 0.05
  const WHEEL_SENSITIVITY = 0.0005 // How much wheel delta affects progress
  const TOUCH_SENSITIVITY = 0.001 // How much touch delta affects progress
  const MAX_SCROLL = 1 // Only Hero → About transition uses virtual scroll
  
  
  const isMapZoomed = ref(false)
  
  // --- Section Pinning ---
  // Brief pause when reaching section boundaries
  // CONFIGURABLE: How long to hold at About section before allowing scroll to CityHead (in ms)
  const ABOUT_SECTION_PIN_DURATION = 2000 // <-- Adjust this value to change hold duration
  
  const SECTION_PINS = [
    { position: 1, duration: ABOUT_SECTION_PIN_DURATION }, // About section complete
  ]
  let isPinned = false
  let lastCrossedPin: number | null = null

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
    if (p > 1.0) return 1
    return (p - 0.5) * 2
  })

  // Native scroll is enabled when About section is complete
  const isNativeScrollEnabled = computed(() => scrollProgress.value >= 0.99)

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

  // Check if crossing a pin point and apply pinning
  function checkPinning(oldTarget: number, newTarget: number): number {
    if (isPinned) return oldTarget // Stay at current position while pinned
    
    for (const pin of SECTION_PINS) {
      // Crossing pin point (either direction)
      const crossingDown = oldTarget < pin.position && newTarget >= pin.position
      const crossingUp = oldTarget > pin.position && newTarget <= pin.position
      
      if (crossingDown || crossingUp) {
        // Only trigger if we haven't just crossed this pin
        if (lastCrossedPin !== pin.position) {
          isPinned = true
          lastCrossedPin = pin.position
          
          // Release after pin's specific duration
          setTimeout(() => {
            isPinned = false
          }, pin.duration)
          
          return pin.position // Snap to pin point
        }
      }
    }
    
    // Clear last crossed pin if we've moved away
    if (lastCrossedPin !== null) {
      const awayFromPin = Math.abs(newTarget - lastCrossedPin) > 0.1
      if (awayFromPin) {
        lastCrossedPin = null
      }
    }
    
    return newTarget
  }

  function handleWheel(e: WheelEvent) {
    if (isMapZoomed.value) return
    
    // If we've reached the end (About complete), allow native scroll
    if (scrollProgress.value >= 0.99 && e.deltaY > 0) {
      // Scrolling down past About - let native scroll handle it
      return
    }
    
    // If we're in native scroll territory and scrolling up, check if at top
    if (scrollProgress.value >= 0.99 && e.deltaY < 0) {
      // Only capture if we need to scroll back into virtual scroll
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      if (scrollTop > 0) {
        // Still scrolled down in native content, let native handle it
        return
      }
      // At top of native scroll, capture to go back to virtual scroll
    }
    
    // Prevent native scroll for virtual scroll section
    e.preventDefault()
    
    // Update target based on wheel delta
    const delta = e.deltaY * WHEEL_SENSITIVITY
    const rawTarget = Math.min(MAX_SCROLL, Math.max(0, targetProgress + delta))
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
    
    const newY = e.touches[0]!.clientY
    const deltaY = touchCurrentY - newY // Inverted: swipe up = positive delta
    
    // If we've reached the end (About complete), allow native scroll
    if (scrollProgress.value >= 0.99 && deltaY > 0) {
      // Swiping up past About - let native scroll handle it
      touchCurrentY = newY
      return
    }
    
    // If we're in native scroll territory and swiping down, check if at top
    if (scrollProgress.value >= 0.99 && deltaY < 0) {
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      if (scrollTop > 0) {
        touchCurrentY = newY
        return
      }
    }
    
    // Prevent native scroll for virtual scroll section
    e.preventDefault()
    
    touchCurrentY = newY
    
    // Update target based on touch delta
    const delta = deltaY * TOUCH_SENSITIVITY
    const rawTarget = Math.min(MAX_SCROLL, Math.max(0, targetProgress + delta))
    targetProgress = checkPinning(targetProgress, rawTarget)
    
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

  // Return to About section (preserves position near end of virtual scroll)
  function returnToAbout() {
    // Set to just below the native scroll threshold (0.99)
    // This shows the About section at full progress
    targetProgress = 0.98
    scrollProgress.value = 0.98
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
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
    window.addEventListener('touchend', handleTouchEnd, { passive: true })
    listenersAttached = true
  }

  function detachListeners() {
    if (!listenersAttached || typeof window === 'undefined') return
    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
    window.removeEventListener('touchend', handleTouchEnd)
    listenersAttached = false
  }

  // Watch for native scroll enable/disable
  watch(isNativeScrollEnabled, (enabled) => {
    if (typeof document === 'undefined') return

    if (enabled) {
      // Remove event listeners and enable native scroll
      detachListeners()
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      document.documentElement.style.overflow = ''
    } else {
      // Re-attach event listeners and disable native scroll
      attachListeners()
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
      document.documentElement.style.overflow = 'hidden'
    }
  })

  onMounted(() => {
    if (typeof window === 'undefined') return

    // Lock the body to prevent native scroll initially
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    document.documentElement.style.overflow = 'hidden'
    
    // Attach listeners only if not already in native scroll mode
    if (!isNativeScrollEnabled.value) {
      attachListeners()
    }
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    detachListeners()
    
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
    isNativeScrollEnabled,
    isMapZoomed,
    setMapZoomed,
    returnToAbout,
    reset,
  }
}