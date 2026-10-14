import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { fragmentShader, vertexShader } from './shaders'
import { referenceTiming, seasons } from './seasons'

gsap.registerPlugin(ScrollTrigger)

export type SceneStatus = {
  ready: boolean
  season: number
  time: number
  fps: number
  drawCalls: number
  pixelRatio: number
}

declare global {
  interface Window {
    __shiki?: {
      seek: (seconds: number) => void
      play: () => void
      status: () => SceneStatus
    }
  }
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const pulse = (x: number, a: number, peak: number, b: number) =>
  x < peak ? smooth(a, peak, x) : 1 - smooth(peak, b, x)

export class SeasonScene {
  private renderer: THREE.WebGLRenderer
  private scene = new THREE.Scene()
  private camera = new THREE.Camera()
  private geometry = new THREE.PlaneGeometry(2, 2)
  private material: THREE.ShaderMaterial
  private textures: THREE.Texture[] = []
  private timeline: gsap.core.Timeline
  private clock = { time: 0 }
  private observer: ResizeObserver
  private visibilityTrigger: ScrollTrigger
  private raf = 0
  private disposed = false
  private debugPaused = false
  private ready = false
  private active = -1
  private manualFrom: THREE.Texture | null = null
  private manualIndex = -1
  private frameCount = 0
  private measureStart = performance.now()
  private fps = 0
  private target = new THREE.Vector2()
  private pointer = new THREE.Vector2()
  private motionQuery = matchMedia('(prefers-reduced-motion: reduce)')
  private coarse = matchMedia('(pointer: coarse)').matches

  constructor(private element: HTMLElement, private onSeason: (index: number) => void) {
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, this.coarse ? 1.5 : 2))
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.domElement.setAttribute('aria-hidden', 'true')
    this.renderer.domElement.draggable = false
    element.append(this.renderer.domElement)
    this.material = new THREE.ShaderMaterial({
      vertexShader, fragmentShader,
      uniforms: {
        uFrom: { value: null }, uTo: { value: null },
        uResolution: { value: new THREE.Vector2(720, 900) },
        uPointer: { value: this.pointer },
        uSeasonColor: { value: new THREE.Color(seasons[0].color) },
        uPaper: { value: new THREE.Color().setHex(parseInt(seasons[0].paper.slice(1), 16), THREE.LinearSRGBColorSpace) },
        ...Object.fromEntries(['Time','Morph','Rotate','Flow','Lens','Dots','Lines','Pixels','Grain','Split','Mix','Scatter'].map(name => [`u${name}`, { value: 0 }])),
        uReveal: { value: 1 },
      },
      transparent: true,
      premultipliedAlpha: true,
      depthTest: false, depthWrite: false,
    })
    this.scene.add(new THREE.Mesh(this.geometry, this.material))
    this.timeline = gsap.timeline({ paused: true, repeat: -1 })
      .to(this.clock, { time: referenceTiming.cycle, duration: referenceTiming.cycle, ease: 'none' })
    this.observer = new ResizeObserver(this.resize)
    this.observer.observe(element)
    this.visibilityTrigger = ScrollTrigger.create({
      trigger: element, start: 'top bottom', end: 'bottom top',
      onToggle: ({ isActive }) => {
        if (isActive) this.resume()
        else this.timeline.pause()
      },
      onRefresh: this.resize,
    })
    element.addEventListener('pointermove', this.onPointer)
    element.addEventListener('pointerleave', this.resetPointer)
    document.addEventListener('visibilitychange', this.onVisibility)
    this.motionQuery.addEventListener('change', this.onMotionChange)
    void this.load()
  }

  private async load() {
    try {
      const loader = new THREE.TextureLoader()
      const loaded = await Promise.all(seasons.map(async season => {
        const texture = await loader.loadAsync(season.image)
        // Source PNGs retain their encoded colors in the custom shader.
        texture.colorSpace = THREE.NoColorSpace
        texture.minFilter = THREE.LinearFilter
        texture.magFilter = THREE.LinearFilter
        texture.generateMipmaps = false
        return texture
      }))
      if (this.disposed) { loaded.forEach(t => t.dispose()); return }
      this.textures = loaded
      this.ready = true
      this.element.dataset.ready = 'true'
      this.resize()
      this.applyTime(0.3)
      this.clock.time = this.motionQuery.matches ? 0.3 : 0
      this.resume()
      this.render()
      window.__shiki = {
        seek: seconds => {
          this.manualFrom = null
          this.debugPaused = true
          this.timeline.pause()
          this.clock.time = ((seconds % 8) + 8) % 8
          this.applyTime(this.clock.time)
          this.renderer.render(this.scene, this.camera)
        },
        play: () => {
          this.debugPaused = false
          this.timeline.time(this.clock.time)
          this.resume()
        },
        status: () => ({ ready: this.ready, season: this.active, time: this.clock.time,
          fps: this.fps, drawCalls: this.renderer.info.render.calls, pixelRatio: this.renderer.getPixelRatio() }),
      }
    } catch (error) {
      if (!this.disposed) {
        this.element.dataset.failed = 'true'
        console.error('Season renderer could not load', error)
      }
    }
  }

  private applyTime(time: number) {
    const index = Math.floor(time / 2) % 4
    const local = time % 2
    const intro = 1 - smooth(0, referenceTiming.incomingEnd, local)
    const outro = smooth(referenceTiming.outgoingStart, 2, local)
    const matrix = pulse(local, referenceTiming.matrixStart, referenceTiming.matrixPeak, 0.94)
    const contour = pulse(local, 0.91, referenceTiming.contourPeak, 1.17)
    const incoming = smooth(0, 0.22, local)
    const u = this.material.uniforms
    u.uFrom.value = this.manualFrom && this.manualIndex === index && local < 0.26
      ? this.manualFrom : this.textures[(index + 3) % 4]
    if (local >= 0.26 || this.manualIndex !== index) this.manualFrom = null
    u.uTo.value = this.textures[index]
    u.uMix.value = incoming
    u.uTime.value = time
    u.uMorph.value = index + outro * 0.98
    u.uRotate.value = (-intro * Math.PI / 4 + outro * Math.PI / 4) +
      Math.sin(local * Math.PI) * (index === 0 ? 0.14 : 0.10) - 0.09
    u.uFlow.value = (index === 0 ? 1 : 0.16) * pulse(local, 0.07, 0.36, 0.73) + outro * 0.35
    u.uLens.value = index === 1 ? pulse(local, 0.08, 0.34, 0.70) : 0
    u.uDots.value = Math.min(1, matrix + intro * 0.68 + outro * 0.5)
    u.uLines.value = contour
    u.uPixels.value = index === 2 ? pulse(local, 0.02, 0.32, 0.69) : index === 3 ? pulse(local, 0.87, 1.2, 1.67) * 0.48 : 0
    u.uGrain.value = index === 2 ? pulse(local, 1.08, 1.29, 1.65) : 0
    u.uSplit.value = matrix * 0.25 + contour * 0.5 + outro * 0.7
    u.uScatter.value = intro * 0.4 + outro * 0.6
    u.uReveal.value = 1
    if (this.active !== index) {
      this.active = index
      const color = new THREE.Color().setHex(parseInt(seasons[index].paper.slice(1), 16), THREE.LinearSRGBColorSpace)
      const shaderColor = new THREE.Color(seasons[index].color)
      gsap.to(u.uSeasonColor.value, { r: shaderColor.r, g: shaderColor.g, b: shaderColor.b,
        duration: this.motionQuery.matches ? 0 : 0.85, ease: 'power2.out', overwrite: true })
      gsap.to(u.uPaper.value, { r: color.r, g: color.g, b: color.b,
        duration: this.motionQuery.matches ? 0 : 0.85, ease: 'power2.out', overwrite: true })
      this.onSeason(index)
    }
  }

  private render = () => {
    if (this.disposed) return
    this.raf = requestAnimationFrame(this.render)
    if (!this.ready || document.hidden) return
    this.pointer.lerp(this.target, 0.055)
    this.applyTime(this.clock.time)
    this.renderer.render(this.scene, this.camera)
    this.frameCount++
    const elapsed = performance.now() - this.measureStart
    if (elapsed > 1500) {
      this.fps = Math.round(this.frameCount * 1000 / elapsed)
      // Bound fill rate on mobile hardware that cannot sustain the target.
      if (this.coarse && this.fps < 40 && this.renderer.getPixelRatio() > 1) {
        this.renderer.setPixelRatio(1)
        this.resize()
      }
      this.frameCount = 0
      this.measureStart = performance.now()
    }
  }

  private resize = () => {
    if (this.disposed) return
    const { width, height } = this.element.getBoundingClientRect()
    this.renderer.setSize(width, height)
    this.renderer.getDrawingBufferSize(this.material.uniforms.uResolution.value)
  }
  private onPointer = (event: PointerEvent) => {
    if (this.motionQuery.matches) return
    const rect = this.element.getBoundingClientRect()
    this.target.set((event.clientX - rect.left) / rect.width - 0.5, 0.5 - (event.clientY - rect.top) / rect.height)
  }
  private resetPointer = () => { this.target.set(0, 0) }
  private resume = () => {
    if (this.ready && !this.debugPaused && !document.hidden && !this.motionQuery.matches) this.timeline.play()
  }
  private onVisibility = () => {
    if (document.hidden) this.timeline.pause()
    else this.resume()
  }
  private onMotionChange = () => {
    if (this.motionQuery.matches) {
      this.timeline.pause()
      this.clock.time = this.active * 2 + 0.4
    } else this.resume()
  }

  select(index: number) {
    if (!this.ready) return
    this.debugPaused = false
    const u = this.material.uniforms
    const fromTexture = this.textures[this.active]
    this.timeline.time(index * 2)
    this.clock.time = index * 2
    if (this.motionQuery.matches) this.clock.time += 0.4
    this.applyTime(this.clock.time)
    // A manual jump starts from the visible image, including non-adjacent jumps.
    this.manualFrom = fromTexture
    this.manualIndex = index
    u.uFrom.value = fromTexture
    this.resume()
  }
  step(direction: number) { this.select((this.active + direction + 4) % 4) }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.raf)
    this.timeline.kill()
    this.visibilityTrigger.kill()
    this.observer.disconnect()
    this.element.removeEventListener('pointermove', this.onPointer)
    this.element.removeEventListener('pointerleave', this.resetPointer)
    document.removeEventListener('visibilitychange', this.onVisibility)
    this.motionQuery.removeEventListener('change', this.onMotionChange)
    this.geometry.dispose()
    this.material.dispose()
    gsap.killTweensOf(this.material.uniforms.uPaper.value)
    gsap.killTweensOf(this.material.uniforms.uSeasonColor.value)
    this.textures.forEach(texture => texture.dispose())
    this.renderer.dispose()
    this.renderer.domElement.remove()
    delete window.__shiki
  }
}
