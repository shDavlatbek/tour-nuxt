import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useScrollTransition() {
  const scrollProgress = ref(0)
  
  // Computed transition phases
  const isFrozen = computed(() => scrollProgress.value > 0.05)
  
  // Zoom: starts immediately, finishes at 0.5
  const zoomProgress = computed(() => {
    if (scrollProgress.value > 0.5) return 1
    return scrollProgress.value / 0.5
  })
  
  // Clouds: start at 0.15, fully covering at 0.7
  const cloudProgress = computed(() => {
    if (scrollProgress.value < 0.15) return 0
    if (scrollProgress.value > 0.7) return 1
    return (scrollProgress.value - 0.15) / 0.55
  })
  
  // About: start at 0.5, fully visible at 1.0
  const aboutProgress = computed(() => {
    if (scrollProgress.value < 0.5) return 0
    return (scrollProgress.value - 0.5) / 0.5
  })
  
  function handleScroll() {
    // Calculate progress based on scroll position
    // scrollHeight - innerHeight = max scroll distance
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    
    if (maxScroll > 0) {
      scrollProgress.value = Math.min(1, Math.max(0, scrollTop / maxScroll))
    }
  }
  
  function reset() {
    window.scrollTo(0, 0)
    scrollProgress.value = 0
  }
  
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      // Initial check
      handleScroll()
    }
  })
  
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll)
    }
  })
  
  return {
    scrollProgress,
    isFrozen,
    zoomProgress,
    cloudProgress,
    aboutProgress,
    reset,
  }
}
