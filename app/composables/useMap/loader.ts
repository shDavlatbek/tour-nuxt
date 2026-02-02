import * as THREE from 'three'
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js'
import { Tween, Easing, Group } from '@tweenjs/tween.js'
import type { Ref } from 'vue'
import { MAP_SCALE, COUNTRY_NAMES, COLORS, EXTRUDE_DEPTHS } from './config'
import { createTextSprite, createGridTexture } from './textures'
import { createMarker } from './markers'
import type { MapState } from './types'

// Create a shared grid texture for all Uzbekistan regions
let gridTexture: THREE.CanvasTexture | null = null
function getGridTexture(): THREE.CanvasTexture {
  if (!gridTexture) {
    // 512 / 64 = 8 perfect cells, ensures uniform squares
    gridTexture = createGridTexture(256, 32, 2, '#ff5e00ff', 1)
  }
  return gridTexture
}

/**
 * Loads the SVG map and creates 3D meshes
 */
export async function loadMap(
  combinedMapGroup: THREE.Group,
  interactablePoints: THREE.Group[],
  state: Ref<MapState>,
  fogParticles: THREE.Sprite[],
  tweenGroup: Group,
  isEntranceAnimating: Ref<boolean>
): Promise<void> {
  const loader = new SVGLoader()

  try {
    const response = await fetch('/map.svg')

    if (!response.ok) {
      throw new Error('Failed to fetch map.svg: ' + response.status + ' ' + response.statusText)
    }

    const svgText = await response.text()
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgText, 'image/svg+xml')
    const svgElement = svgDoc.documentElement
    const groups = svgElement.querySelectorAll('g[id]')

    groups.forEach((group) => {
      const countryId = group.getAttribute('id')!
      const isUzbekistan = countryId === 'uz'
      const isSea = countryId === 'sea'

      const groupSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      groupSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      groupSvg.innerHTML = group.innerHTML

      const serializer = new XMLSerializer()
      const groupSvgString = serializer.serializeToString(groupSvg)
      const groupData = loader.parse(groupSvgString)
      const paths = groupData.paths

      if (paths.length === 0) return

      const countryGroup = new THREE.Group()
      countryGroup.name = countryId

      paths.forEach((path: any, pathIndex: number) => {
        const shapes = SVGLoader.createShapes(path)
        const pathMeshes: THREE.Mesh[] = []
        
        // Get region ID from path userData (set by SVGLoader from id attribute)
        const pathId = path.userData?.node?.id || ''

        shapes.forEach((shape: THREE.Shape) => {
          if (isUzbekistan) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: EXTRUDE_DEPTHS.uzbekistan,
              bevelEnabled: false,
            })
            
            // Create material with grid overlay shader modification
            const material = new THREE.MeshStandardMaterial({
              color: COLORS.uzbekistan,
              roughness: 0.5,
              metalness: 0.1,
            })

            // Store uniforms for grid blend animation (like CodePen example)
            const gridTex = getGridTexture()
            material.userData = {
              gridMap: { value: gridTex },
              gridMix: { value: 0.0 }, // 0 = no grid, 1 = full grid
              highlightColor: { value: new THREE.Color(COLORS.uzbekistanHighlight) },
            }

            // Modify shader to blend grid overlay (similar to CodePen texture mix)
            material.onBeforeCompile = (shader) => {
              shader.uniforms.gridMap = material.userData.gridMap
              shader.uniforms.gridMix = material.userData.gridMix
              shader.uniforms.highlightColor = material.userData.highlightColor

              // Add varying for world position (object-fixed coordinates)
              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `
                #include <common>
                varying vec3 vWorldPos;
                `
              ).replace(
                '#include <worldpos_vertex>',
                `
                #include <worldpos_vertex>
                vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                `
              )

              shader.fragmentShader = `
                uniform sampler2D gridMap;
                uniform float gridMix;
                uniform vec3 highlightColor;
                varying vec3 vWorldPos;
                
                // 2D rotation function
                vec2 rotateUV(vec2 uv, float angle) {
                  float s = sin(angle);
                  float c = cos(angle);
                  return vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c);
                }
                
                ${shader.fragmentShader}
              `.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Apply grid overlay when gridMix > 0
                if (gridMix > 0.0) {
                  // Use uniform scale for both X and Y to get perfect squares
                  float gridScale = 0.02; // Adjust this for grid density
                  vec2 gridUV = vWorldPos.xy * gridScale;
                  
                  // Rotate 45 degrees (PI/4 radians)
                  gridUV = rotateUV(gridUV, 0.7854);
                  
                  // Sample grid texture
                  vec4 gridColor = texture2D(gridMap, gridUV);
                  
                  // Mix highlight color based on gridMix
                  vec3 highlightedBase = mix(diffuseColor.rgb, highlightColor, gridMix * 0.3);
                  
                  // Add grid lines on top - use TEXTURE COLOR, not white!
                  float gridAlpha = gridColor.a * gridMix;
                  diffuseColor.rgb = mix(highlightedBase, gridColor.rgb, gridAlpha);
                }
                `
              )
            }

            const mesh = new THREE.Mesh(geometry, material)
            mesh.castShadow = true
            mesh.receiveShadow = true

            const edges = new THREE.EdgesGeometry(geometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.uzbekistanBorder })
            const border = new THREE.LineSegments(edges, lineMaterial)
            mesh.add(border)

            countryGroup.add(mesh)
            pathMeshes.push(mesh)
          } else if (isSea) {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: EXTRUDE_DEPTHS.sea,
              bevelEnabled: false,
            })
            const material = new THREE.MeshBasicMaterial({
              color: COLORS.sea,
              // roughness: 0.6,
              // metalness: 0.1,
              transparent: true,
              opacity: 0.5,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.receiveShadow = true
            countryGroup.add(mesh)
          } else {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: EXTRUDE_DEPTHS.neighbor,
              bevelEnabled: false,
            })
            const material = new THREE.MeshBasicMaterial({
              color: COLORS.neighbor,
              transparent: true,
              opacity: 0.6,
            })

            const mesh = new THREE.Mesh(geometry, material)
            mesh.receiveShadow = true

            const edges = new THREE.EdgesGeometry(geometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: COLORS.neighborBorder })
            const border = new THREE.LineSegments(edges, lineMaterial)
            mesh.add(border)

            countryGroup.add(mesh)
          }
        })

        // Add markers for Uzbekistan regions
        if (isUzbekistan && pathMeshes.length > 0) {
          const pathBox = new THREE.Box3()
          pathMeshes.forEach((mesh) => pathBox.expandByObject(mesh))

          const pathCenter = new THREE.Vector3()
          pathBox.getCenter(pathCenter)

          const pathSize = new THREE.Vector3()
          pathBox.getSize(pathSize)

          const maxDimension = Math.max(pathSize.x, pathSize.y)
          const regionIndex = interactablePoints.length
          const regionId = pathId || `region-${regionIndex}`
          const marker = createMarker(pathCenter, maxDimension, regionIndex, regionId)
          
          // Store mesh references for region highlighting
          marker.userData.regionMeshes = pathMeshes
          
          countryGroup.add(marker)
          interactablePoints.push(marker)
        }
      })

      // Position elements
      if (isSea || !isUzbekistan) {
        countryGroup.position.z = -5
      }

      combinedMapGroup.add(countryGroup)

      // Add country labels
      const countryName = COUNTRY_NAMES[countryId]
      if (countryName && !isUzbekistan && !isSea) {
        const box = new THREE.Box3().setFromObject(countryGroup)
        const center = new THREE.Vector3()
        box.getCenter(center)

        const label = createTextSprite(countryName, 24, COLORS.label)
        if (countryId === 'kz') {
          label.position.set(center.x, center.y + 70, 15)
        } else if (countryId === 'af') {
          label.position.set(center.x, center.y - 60, 15)
        } else {
          label.position.set(center.x, center.y, 15)
        }
        combinedMapGroup.add(label)
      }
    })

    // Center on Uzbekistan
    const uzbekistanGroup = combinedMapGroup.getObjectByName('uz')
    let offsetX = 0
    let offsetY = 0

    if (uzbekistanGroup) {
      const uzBox = new THREE.Box3().setFromObject(uzbekistanGroup)
      const uzCenter = uzBox.getCenter(new THREE.Vector3())
      offsetX = uzCenter.x
      offsetY = uzCenter.y
    }

    combinedMapGroup.children.forEach((child: THREE.Object3D) => {
      child.position.x -= offsetX
      child.position.y -= offsetY
    })

    // Play entrance animation
    playEntranceAnimation(combinedMapGroup, state, fogParticles, tweenGroup, isEntranceAnimating)

  } catch (error) {
    console.error('[useMap] Failed to load map:', error)
    state.value.isLoading = false
  }
}

/**
 * Plays the initial entrance animation
 */
export function playEntranceAnimation(
  combinedMapGroup: THREE.Group,
  state: Ref<MapState>,
  fogParticles: THREE.Sprite[],
  tweenGroup: Group,
  isEntranceAnimating: Ref<boolean>
): void {
  // Set initial state
  combinedMapGroup.scale.set(0.01, -0.01, 0.01)
  combinedMapGroup.position.z = 500

  isEntranceAnimating.value = true
  state.value.isLoading = false

  // Animate scale
  const scaleObj = { value: 0.01 }
  new Tween(scaleObj, tweenGroup)
    .to({ value: MAP_SCALE }, 2000)
    .easing(Easing.Cubic.Out)
    .onUpdate(() => {
      combinedMapGroup.scale.set(scaleObj.value, -scaleObj.value, scaleObj.value)
    })
    .start()

  // Animate position
  new Tween(combinedMapGroup.position, tweenGroup)
    .to({ z: 0 }, 2000)
    .easing(Easing.Cubic.Out)
    .onComplete(() => {
      isEntranceAnimating.value = false
    })
    .start()

  // Fade in fog particles
  fogParticles.forEach((sprite, index) => {
    sprite.material.opacity = 0
    new Tween(sprite.material, tweenGroup)
      .to({ opacity: 0.4 }, 1200)
      .delay(800 + index * 30)
      .easing(Easing.Cubic.Out)
      .start()
  })
}
