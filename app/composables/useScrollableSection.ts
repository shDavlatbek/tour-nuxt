import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface UseScrollableSectionOptions {
  scrollProgress: Ref<number> // The global driver
  startAt: number | Ref<number> // When does this section appear? (e.g., 2.0)
  sensitivity?: number        // 0.001 means 1000px height = 1.0 virtual unit
}

/**
 * AUTOMATIC SECTION HANDLER
 * 1. Measures the DOM element's real height.
 * 2. Calculates how much "virtual" scroll space it needs.
 * 3. Applies the CSS transform to move it based on scroll.
 */
export function useScrollableSection(options: UseScrollableSectionOptions) {
  const { scrollProgress, startAt, sensitivity = 0.001 } = options
  
  const elementRef = ref<HTMLElement | null>(null)
  const virtualLength = ref(0) // Output: How much space this section needs

  // Unwrapping ref in case startAt is reactive
  const startValue = computed(() => (typeof startAt === 'number' ? startAt : startAt.value))

  // 1. Calculate CSS Transform
  const translateY = computed(() => {
    // If we haven't reached this section yet, stay at 0 offset
    if (scrollProgress.value < startValue.value) return 0
    
    // Calculate progress *inside* this section
    const progressInSection = scrollProgress.value - startValue.value
    
    // Convert Virtual Units -> Pixels
    // Example: 0.5 units / 0.001 = 500px
    return -(progressInSection / sensitivity)
  })

  // 2. Style Object (Bind this to your <div>)
  const sectionStyle = computed(() => ({
    transform: `translate3d(0, ${translateY.value}px, 0)`,
    willChange: 'transform' // Performance optimization
  }))

  // 3. Measure Content Height
  function updateHeight() {
    if (!elementRef.value) return
    
    const realHeight = elementRef.value.scrollHeight
    const viewportHeight = window.innerHeight
    
    // We only need to scroll the "overflow" (what doesn't fit on screen)
    // If it fits on screen, length is 0.
    const scrollablePixels = Math.max(0, realHeight - viewportHeight)
    
    // Convert Pixels -> Virtual Units
    virtualLength.value = scrollablePixels * sensitivity
  }

  // 4. Observer for dynamic content (images loading, etc)
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    // Immediate check
    updateHeight()
    
    // Continuous check
    if (elementRef.value) {
      resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(elementRef.value)
    }
    window.addEventListener('resize', updateHeight)
  })

  onUnmounted(() => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', updateHeight)
  })

  return {
    elementRef,
    sectionStyle,
    virtualLength
  }
}