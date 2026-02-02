# Map Changelog

## 2026-02-03

### Added

- **Grid overlay shader** for region highlighting:
  - Smooth fade-in/out using `onBeforeCompile` shader modification (like CodePen texture mixing)
  - Grid texture generated via canvas (`createGridTexture` in `textures.ts`)
  - 45-degree rotation for diagonal grid pattern
  - Uses world-space coordinates (fixed to mesh, not affected by camera/parallax)
  - Animated via TWEEN (`gridMix` uniform 0→1)
  - Emissive glow synced with grid visibility

### Changed

- `loader.ts`: Materials now have `onBeforeCompile` for grid blending
- `textures.ts`: Added `createGridTexture()` function
- `config.ts`: Highlight color tuned to `0xffd24d`
- Mouse hint styling: Added background, border-radius, padding

---

## 2026-02-02

### Refactored

- **Modular structure**: Split `useMap.ts` into separate files:
  - `index.ts` - main entry, scene, animate loop
  - `config.ts` - colors, scales, label configs
  - `labels.ts` - city labels with leader lines
  - `markers.ts` - region markers
  - `camera.ts` - zoom, parallax
  - `loader.ts` - SVG loading
  - `grid.ts` - background grid
  - `textures.ts` - fog texture

### Added

- **City name labels** with animated leader lines (elbow shape)
- **4 label directions**: `top-right`, `bottom-right`, `top-left`, `bottom-left`
- **Per-region label config** in `REGION_LABELS`:
  - `direction` - leader line direction
  - `diagonalLength`, `horizontalLength` - line segment sizes
  - `textOffsetX`, `textOffsetY` - fine text positioning
  - `offsetX`, `offsetY` - group offset from marker
- **SVG region IDs** - paths now have `id` attribute for config lookup
- **Zoom label behavior**:
  - Normal: labels show on mouse proximity
  - Zoomed: only selected region label visible, scaled 1.8x
- **Text shadow** - multi-layer shadow for better visibility
- **State tracking** - `selectedRegionId` for clicked region

### Changed

- Leader line thickness increased (linewidth: 2 → 3)
- Text spacing from line increased (10 → 20px gap)
- Labels always update positions, proximity only when not zoomed

### Removed

- Mobile touch controls (reverted, preserved labels)
