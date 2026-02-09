import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface UseScrollableSectionOptions {
  scrollProgress: Ref<number>
  startAt: number | Ref<number>
  sensitivity?: number // 0.001 means 1000px = 1.0 virtual unit
}

/**
 * AUTOMATIC SECTION HANDLER
 * 1. Measures the DOM element's real height.
 * 2. Calculates how much "virtual" scroll space it needs.
 * 3. Applies the CSS transform to move it based on scroll.
 * 
 * Virtual scroll space = content height (to bring it fully into view and scroll through it)
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
    // Convert virtual units → pixels
    return -(progressInSection / sensitivity)
  })

  // Style object to bind to element
  const sectionStyle = computed(() => ({
    transform: `translate3d(0, ${translateY.value}px, 0)`,
    willChange: 'transform'
  }))

  // Measure content height and calculate virtual scroll length
  function updateHeight() {
    if (!elementRef.value) return
    
    const realHeight = elementRef.value.scrollHeight
    
    // Virtual length = full content height (we need to scroll it all the way through)
    // This allows the section to be fully revealed and scrolled past
    virtualLength.value = realHeight * sensitivity
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