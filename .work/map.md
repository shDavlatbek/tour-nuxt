# Map Composable Reference

## Files

- `app/composables/useMap/index.ts` - main entry, scene setup, animate loop
- `app/composables/useMap/config.ts` - colors, scales, region label configs
- `app/composables/useMap/labels.ts` - city name labels with leader lines
- `app/composables/useMap/markers.ts` - region markers (circles)
- `app/composables/useMap/camera.ts` - zoom in/out, parallax
- `app/composables/useMap/loader.ts` - SVG loading
- `app/composables/useMap/grid.ts` - background grid
- `app/composables/useMap/textures.ts` - fog texture
- `public/map.svg` - combined SVG with region IDs

## Region Labels Config

```ts
// config.ts
export const REGION_LABELS: Record<string, RegionLabelConfig> = {
  karakalpakstan: {
    name: "KARAKALPAKSTAN",
    direction: "top-right", // top-right | bottom-right | top-left | bottom-left
    offsetX: 0, // Group offset from marker
    offsetY: 0,
    diagonalLength: 30, // Diagonal segment length
    horizontalLength: 50, // Horizontal segment length
    textOffsetX: 0, // Extra text X offset
    textOffsetY: 0, // Extra text Y offset
  },
  // ...
};
```

## SVG Path IDs

Region paths need `id` attribute for label config lookup:

```xml
<polygon id="andijan" points="..."/>
<path id="namangan" d="..."/>
<path id="fergana" d="..."/>
```

## Key Label Functions

- `createCityLabel(regionId, marker, index)` - creates label group with text + leader line
- `updateLabelsProximity()` - shows labels near cursor (normal mode)
- `updateLabelsForZoom(labels, selectedId, isZoomed, tweenGroup, scale)` - zoom mode handling
- `hideAllLabels()` - hides all labels

## Zoom Label Behavior

- **Normal**: Labels show on mouse proximity
- **Zoomed**: Only selected region label visible, scaled 1.8x
- **Zoom out**: Reset to proximity-based visibility

## Critical Import Pattern

```ts
import { Tween, Easing, Group } from "@tweenjs/tween.js";
const tweenGroup = new Group();
// ALL tweens: new Tween(target, tweenGroup)
```

NEVER use `import TWEEN from` or `import * as TWEEN`.

## State

- `state.value.isZoomed` - zoom state
- `selectedRegionId` - tracks clicked region for label handling
- `isZoomAnimating.value` - blocks parallax during tween
- `zoomBlend.value` - 0-1 transition for zoom out

## Don'ts

- Don't wrap Three.js objects in `ref()`
- Don't forget `tweenGroup` param in `new Tween()`
- Don't call `init()` before container exists
