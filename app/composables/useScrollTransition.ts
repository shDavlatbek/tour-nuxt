import { ref, computed, onMounted, onUnmounted } from 'vue'

interface ScrollTransitionState {
  scrollProgress: number
  isFrozen: boolean
  cloudProgress: number
  aboutProgress: number
}

export function useScrollTransition() {
  const scrollProgress = ref(0)
  const targetProgress = ref(0)
  
  // Scroll settings
  const SCROLL_SPEED = 0.0015 // Sensitivity per wheel delta
  const LERP_SPEED = 0.08 // Smooth interpolation speed
  
  let animationFrame: number | null = null
  
  // Computed transition phases
  const isFrozen = computed(() => scrollProgress.value > 0.05)
  
  // Clouds: start at 0.2, fully covering at 0.8
  const cloudProgress = computed(() => {
    if (scrollProgress.value < 0.2) return 0
    if (scrollProgress.value > 0.8) return 1
    return (scrollProgress.value - 0.2) / 0.6
  })
  
  // About: start at 0.6, fully visible at 1.0
  const aboutProgress = computed(() => {
    if (scrollProgress.value < 0.6) return 0
    return (scrollProgress.value - 0.6) / 0.4
  })
  
  // Map zoom: 1 at 0, zoomed out at 0.3+
  const mapZoom = computed(() => {
    if (scrollProgress.value < 0.3) {
      return 1 + scrollProgress.value * 0.5 // Zoom out slightly
    }
    return 1.15
  })
  
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    
    const delta = e.deltaY * SCROLL_SPEED
    targetProgress.value = Math.max(0, Math.min(1, targetProgress.value + delta))
  }
  
  function animate() {
    // Smooth lerp toward target
    const diff = targetProgress.value - scrollProgress.value
    if (Math.abs(diff) > 0.001) {
      scrollProgress.value += diff * LERP_SPEED
    } else {
      scrollProgress.value = targetProgress.value
    }
    
    animationFrame = requestAnimationFrame(animate)
  }
  
  function reset() {
    targetProgress.value = 0
    scrollProgress.value = 0
  }
  
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('wheel', handleWheel, { passive: false })
      animate()
    }
  })
  
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('wheel', handleWheel)
    }
    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame)
    }
  })
  
  return {
    scrollProgress,
    isFrozen,
    cloudProgress,
    aboutProgress,
    mapZoom,
    reset,
  }
}
