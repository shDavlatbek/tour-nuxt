import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface UseScrollableSectionOptions {
  scrollProgress: Ref<number>
  startAt: number | Ref<number>
  sensitivity?: number // 0.001 means 1000px height = 1.0 virtual unit
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
  const virtualLength = ref(0)

  const startValue = computed(() => (typeof startAt === 'number' ? startAt : startAt.value))

  // Calculate CSS Transform
  const translateY = computed(() => {
    if (scrollProgress.value < startValue.value) return 0
    
    const progressInSection = scrollProgress.value - startValue.value
    return -(progressInSection / sensitivity)
  })

  // Style object to bind to element
  const sectionStyle = computed(() => ({
    transform: `translate3d(0, ${translateY.value}px, 0)`,
    willChange: 'transform'
  }))

  // Measure content height
  function updateHeight() {
    if (!elementRef.value) return
    
    const realHeight = elementRef.value.scrollHeight
    const viewportHeight = window.innerHeight
    
    // Only scroll the overflow
    const scrollablePixels = Math.max(0, realHeight - viewportHeight)
    virtualLength.value = scrollablePixels * sensitivity
  }

  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    updateHeight()
    
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
