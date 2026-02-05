import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useScrollTransition() {
  const scrollProgress = ref(0)
  const targetProgress = ref(0)
  
  // Scroll settings
  const SCROLL_SPEED = 0.002 // Sensitivity per wheel delta
  const LERP_SPEED = 0.1 // Faster interpolation
  
  let animationFrame: number | null = null
  let isAnimating = false
  
  // Computed transition phases
  const isFrozen = computed(() => scrollProgress.value > 0.05)
  
  // Clouds: start at 0.15, fully covering at 0.7
  const cloudProgress = computed(() => {
    if (scrollProgress.value < 0.15) return 0
    if (scrollProgress.value > 0.7) return 1
    return (scrollProgress.value - 0.15) / 0.55
  })
  
  // About: start at 0.5, fully visible at 1.0
  const aboutProgress = computed(() => {
    if (scrollProgress.value < 0.3) return 0
    if (scrollProgress.value > 0.9) return 1
    return (scrollProgress.value - 0.3) / 0.6
  })
  
  function animate() {
    const diff = targetProgress.value - scrollProgress.value
    
    if (Math.abs(diff) > 0.001) {
      scrollProgress.value += diff * LERP_SPEED
      animationFrame = requestAnimationFrame(animate)
    } else {
      scrollProgress.value = targetProgress.value
      isAnimating = false
      animationFrame = null
    }
  }
  
  function startAnimation() {
    if (!isAnimating) {
      isAnimating = true
      animate()
    }
  }
  
  function handleWheel(e: WheelEvent) {
    e.preventDefault()
    
    const delta = e.deltaY * SCROLL_SPEED
    targetProgress.value = Math.max(0, Math.min(1, targetProgress.value + delta))
    
    // Only animate when needed
    startAnimation()
  }
  
  function reset() {
    targetProgress.value = 0
    scrollProgress.value = 0
  }
  
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('wheel', handleWheel, { passive: false })
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
    reset,
  }
}
