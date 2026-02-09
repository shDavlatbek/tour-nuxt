import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue'

interface UseScrollableSectionOptions {
  scrollProgress: Ref<number>
  startAt: number | Ref<number>
}

/**
 * VIEWPORT-NORMALIZED SECTION HANDLER
 * 
 * Standard: 1.0 virtual unit = 100vh (100% viewport height)
 * 
 * 1. Measures the DOM element's real height
 * 2. Calculates virtualLength as height/viewport (how many "screens" tall)
 * 3. Outputs translateY in vh units for device-independent scrolling
 */
export function useScrollableSection(options: UseScrollableSectionOptions) {
  const { scrollProgress, startAt } = options
  
  const elementRef = ref<HTMLElement | null>(null)
  const virtualLength = ref(0) // How many "screens" (100vh) this section spans

  const startValue = computed(() => (typeof startAt === 'number' ? startAt : startAt.value))

  // Calculate translateY in vh units
  // 1.0 virtual unit = 100vh of movement
  const translateY = computed(() => {
    if (scrollProgress.value < startValue.value) return 0
    
    const progressInSection = scrollProgress.value - startValue.value
    // Convert: 1.0 progress = -100vh
    return -(progressInSection * 100) // in vh units
  })

  // Style object with vh-based transform
  const sectionStyle = computed(() => ({
    transform: `translate3d(0, ${translateY.value}vh, 0)`,
    willChange: 'transform'
  }))

  // Measure content height and calculate virtualLength
  function updateHeight() {
    if (!elementRef.value || typeof window === 'undefined') return
    
    const realHeight = elementRef.value.scrollHeight
    const viewportHeight = window.innerHeight
    
    // How many "screens" does this content span?
    // e.g., 200vh content = 2.0 virtualLength
    virtualLength.value = realHeight / viewportHeight
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
    virtualLength,
    translateY // Expose for debugging
  }
}