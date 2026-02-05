import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useScrollTransition() {
  const scrollProgress = ref(0)
  const isMapZoomed = ref(false) // External flag to lock scroll when city is zoomed
  
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
  
  function handleScroll(e: Event) {
    // Block scroll when map is zoomed into a city
    if (isMapZoomed.value) {
      e.preventDefault()
      return
    }
    
    // Calculate progress based on scroll position
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    
    if (maxScroll > 0) {
      scrollProgress.value = Math.min(1, Math.max(0, scrollTop / maxScroll))
    }
  }
  
  // Lock body scroll when map is zoomed
  watch(isMapZoomed, (zoomed) => {
    if (typeof document !== 'undefined') {
      if (zoomed) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    }
  })
  
  function setMapZoomed(zoomed: boolean) {
    isMapZoomed.value = zoomed
  }
  
  function reset() {
    window.scrollTo(0, 0)
    scrollProgress.value = 0
  }
  
  onMounted(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', handleScroll, { passive: true })
      // Initial check
      handleScroll(new Event('scroll'))
    }
  })
  
  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', handleScroll)
      // Cleanup body style
      document.body.style.overflow = ''
    }
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
