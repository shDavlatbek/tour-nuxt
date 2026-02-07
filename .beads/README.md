# .beads - AI Agent Context

This directory contains structured context data for AI coding agents to understand the Uzbekistan Tourism project.

## Files

| File                 | Description                                                |
| -------------------- | ---------------------------------------------------------- |
| `project.jsonl`      | Project overview, tech stack, structure, and configuration |
| `architecture.jsonl` | Application architecture, scroll system, 3D map system     |
| `components.jsonl`   | Vue components documentation (Hero, About, Cloud)          |
| `composables.jsonl`  | Composables documentation (useMap, useScrollTransition)    |
| `regions.jsonl`      | Uzbekistan regions configuration for the map               |
| `performance.jsonl`  | Performance optimization techniques                        |
| `disposal.jsonl`     | Cleanup procedures for memory management                   |

## JSONL Schema

Each line in `.jsonl` files is a JSON object with:

```json
{
  "id": "unique-identifier",
  "type": "context|architecture|component|composable|region|performance|disposal",
  "title": "Human-readable title",
  "content": "Detailed description",
  "path": "file/path (optional)",
  "tags": ["array", "of", "tags"],
  "priority": "high|medium|low",
  "created": "ISO timestamp"
}
```

## Quick Reference

### Key Files

- **Main Page**: `app/pages/index.vue`
- **3D Map**: `app/composables/useMap/index.ts`
- **Scroll Logic**: `app/composables/useScrollTransition.ts`

### Tech Stack

- Nuxt 4 (Vue 3.5)
- Three.js 0.182
- TWEEN.js 25
- TypeScript

### Scroll Progress Ranges

| Property      | Range   | Output  |
| ------------- | ------- | ------- |
| isFrozen      | >5%     | boolean |
| zoomProgress  | 0-50%   | 0-1     |
| cloudProgress | 15-70%  | 0-1     |
| aboutProgress | 50-100% | 0-1     |
