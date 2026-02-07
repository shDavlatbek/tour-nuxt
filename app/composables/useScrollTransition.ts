import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useScrollTransition() {
  // The reactive value used for animations (this will lag slightly behind for smoothness)
  const scrollProgress = ref(0)
  
  // Internal state for math (non-reactive for performance)
  let targetProgress = 0
  let maxScroll = 0
  let rafId: number | null = null
  
  // Configuration
  const DAMPING_FACTOR = 0.08 // 0.05 = very slow/smooth, 0.15 = snappy
  
  const isMapZoomed = ref(false)

  // --- Computed Phases ---

  const isFrozen = computed(() => scrollProgress.value > 0.05)

  // Zoom: 0.0 -> 0.5 scroll range maps to 0.0 -> 1.0 output
  const zoomProgress = computed(() => {
    const p = scrollProgress.value
    if (p > 0.5) return 1
    return p * 2 // Optimized: (p / 0.5) is same as (p * 2)
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
    return (p - 0.5) * 2 // Optimized: (p - 0.5) / 0.5 is same as (p - 0.5) * 2
  })

  // --- Animation Loop (The Smoothness Engine) ---

  function tick() {
    // Calculate the difference between where we are and where we want to be
    const diff = targetProgress - scrollProgress.value
    
    // If difference is tiny, stop the loop to save battery/CPU
    if (Math.abs(diff) < 0.0005) {
      scrollProgress.value = targetProgress
      rafId = null
      return
    }

    // Move 8% (DAMPING_FACTOR) of the way towards the target
    scrollProgress.value += diff * DAMPING_FACTOR
    
    // Request next frame
    rafId = requestAnimationFrame(tick)
  }

  // --- Event Handlers ---

  function handleScroll() {
    // If map is zoomed, we rely on CSS overflow:hidden, so this usually won't fire.
    // But as a safeguard, we return early.
    if (isMapZoomed.value) return

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    
    // Calculate target immediately (0 to 1)
    // We use the cached 'maxScroll' to avoid expensive DOM reads
    if (maxScroll > 0) {
      targetProgress = Math.min(1, Math.max(0, scrollTop / maxScroll))
    }

    // Start the animation loop if it's not running
    if (!rafId) {
      rafId = requestAnimationFrame(tick)
    }
  }

  // Heavy calculations go here, only runs on window resize
  function handleResize() {
    maxScroll = document.documentElement.scrollHeight - window.innerHeight
    // Recalculate current position in case window size changed drastically
    handleScroll()
  }

  // --- Locking Logic ---

  watch(isMapZoomed, (zoomed) => {
    if (typeof document === 'undefined') return

    if (zoomed) {
      // Modern way to lock scroll without breaking event listeners
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none' // Disable touch on mobile
    } else {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
      // Re-measure in case layout changed while zoomed
      handleResize() 
    }
  })

  function setMapZoomed(zoomed: boolean) {
    isMapZoomed.value = zoomed
  }

  function reset() {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0)
    }
    targetProgress = 0
    scrollProgress.value = 0
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
  }

  // --- Lifecycle ---

  onMounted(() => {
    if (typeof window === 'undefined') return

    // Calculate dimensions first
    handleResize()

    // Add listeners
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
  })

  onUnmounted(() => {
    if (typeof window === 'undefined') return

    window.removeEventListener('scroll', handleScroll)
    window.removeEventListener('resize', handleResize)
    
    if (rafId) cancelAnimationFrame(rafId)
    
    // Safety cleanup
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
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