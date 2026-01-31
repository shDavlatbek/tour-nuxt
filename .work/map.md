# Map Composable Reference

## Files

- `app/composables/useMap.ts` - core Three.js logic
- `app/components/HeroSection.vue` - Vue wrapper, uses `<ClientOnly>`
- `public/map.svg` - combined SVG with `<g id="uz">`, `<g id="kz">`, etc.
- `app/assets/css/main.css` - styles for `.hero__*` classes

## Critical Import Pattern

```ts
import { Tween, Easing, Group } from "@tweenjs/tween.js";
const tweenGroup = new Group();
// ALL tweens: new Tween(target, tweenGroup)
// Animate loop: tweenGroup.update()
```

NEVER use `import TWEEN from` or `import * as TWEEN` - causes animation freeze.

## State

- `state.value.isZoomed` - zoom state flag
- `state.value.isLoading` - loading overlay
- `isZoomAnimating.value` - blocks parallax during camera tween
- `zoomBlend.value` - 0-1 transition factor for zoom out
- `zoomedCamPos.value` - camera position when zoomed

## Key Functions

- `init(container)` - creates scene, camera, renderer, loads SVG
- `dispose()` - cleanup all listeners, Three.js objects
- `zoomIn(targetPoint)` - called on marker click
- `zoomOut()` - called from back button
- `animate()` - RAF loop, parallax, fog, grid, tweens

## Don'ts

- Don't wrap Three.js objects in `ref()` - creates Proxy overhead
- Don't use template literals in string-heavy code (encoding issues)
- Don't call `init()` before container exists - use `nextTick()`
- Don't forget `tweenGroup` param in `new Tween()`

## SVG Structure

```xml
<g id="uz">...</g>     <!-- Uzbekistan, extruded 5, gold -->
<g id="kz">...</g>     <!-- Kazakhstan, extruded 3, gray -->
<g id="sea">...</g>    <!-- Aral Sea, extruded 1, blue -->
```

Each `<g id>` becomes a THREE.Group with meshes.

## Markers

Created per path inside `uz` group. userData:

- `isMarker: true`
- `baseZ: 10`
- `zoomDistance: calculated`

## Camera

- Initial: `{ x: 0, y: 0, z: 1200 }`
- Parallax: ±400 offset based on mouse
- Zoomed: smaller parallax around `zoomedCamPos`

## Animation Flow

1. Click marker → `zoomIn()` → `isZoomAnimating=true` → camera tween
2. Tween complete → `isZoomAnimating=false`, parallax active in zoomed mode
3. Click back → `zoomOut()` → `zoomBlend` 1→0 → parallax restored
