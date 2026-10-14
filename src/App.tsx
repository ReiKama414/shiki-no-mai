import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { SeasonScene } from './SeasonScene'
import { seasons } from './seasons'
import { gsap } from 'gsap'
import TitleMark from './TitleMark'

const particles = Array.from({ length: 28 }, (_, index) => ({
  left: `${(index * 37.71 + 4) % 100}%`,
  top: `${(index * 23.37 + 3) % 100}%`,
  '--duration': `${16 + (index % 6) * 3}s`,
  '--delay': `${-index * 1.9}s`,
  '--size': `${2 + (index % 4) * 1.2}px`,
  '--drift': `${(index % 2 ? 1 : -1) * (18 + index % 5 * 9)}px`,
}))

export default function App() {
  const canvasHost = useRef<HTMLDivElement>(null)
  const scene = useRef<SeasonScene | null>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const wheelAt = useRef(0)
  const [active, setActive] = useState(0)
  const [failed, setFailed] = useState(false)
  const experience = useRef<HTMLElement>(null)
  const detail = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const season = seasons[active]
    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.85
    const tween = gsap.to(experience.current, {
      '--paper': season.paper, '--ink': season.ink, '--accent': season.accent,
      '--light': season.light, '--glow': season.glow, '--secondary': season.secondary,
      duration, ease: 'power2.out', overwrite: true,
    })
    const textTween = gsap.fromTo(detail.current, { opacity: 0, y: 3 },
      { opacity: 1, y: 0, duration: duration * 0.65, ease: 'power2.out' })
    return () => { tween.kill(); textTween.kill() }
  }, [active])

  useEffect(() => {
    if (!canvasHost.current) return
    let renderer: SeasonScene
    try {
      renderer = new SeasonScene(canvasHost.current, setActive)
      scene.current = renderer
    } catch (error) {
      console.error(error)
      setFailed(true)
      return
    }
    return () => { renderer.dispose(); scene.current = null }
  }, [SeasonScene])

  return (
    <main className="experience" ref={experience} data-season={seasons[active].name.toLowerCase()} aria-label="春夏秋冬代行者 — Shiki no Mai"
      onDragStart={event => event.preventDefault()}>
      <div className="atmosphere" aria-hidden="true">
        <div className="ambient-light ambient-light-one" />
        <div className="ambient-light ambient-light-two" />
        <div className="ambient-light ambient-light-three" />
        <div className="particles">{particles.map((style, index) =>
          <i className="particle" key={index} style={style as CSSProperties} />)}</div>
      </div>
      <header className="masthead">
        <p>SHIKI NO MAI<br /><span lang="ja">四季の舞</span></p>
        <p className="masthead-right" lang="ja">春夏秋冬<br /><span>代行者</span></p>
      </header>
      <div className="composition"
        onKeyDown={event => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); scene.current?.step(1) }
          if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); scene.current?.step(-1) }
        }}
        onWheel={event => {
          if (Math.abs(event.deltaY) < 12 || performance.now() - wheelAt.current < 700) return
          wheelAt.current = performance.now()
          scene.current?.step(event.deltaY > 0 ? 1 : -1)
        }}
        onTouchStart={event => {
          const touch = event.touches[0]
          touchStart.current = { x: touch.clientX, y: touch.clientY }
        }}
        onTouchEnd={event => {
          const start = touchStart.current
          if (!start) return
          const touch = event.changedTouches[0]
          const dx = touch.clientX - start.x, dy = touch.clientY - start.y
          const distance = Math.abs(dx) > Math.abs(dy) ? dx : dy
          if (Math.abs(distance) > 35) scene.current?.step(distance < 0 ? 1 : -1)
          touchStart.current = null
        }}>
        <div className="artwork" ref={canvasHost} key="premultiplied-atmosphere">
          <img className="fallback" src={seasons[active].image} alt="" draggable={false} />
        </div>
        <TitleMark />
        <p className="subtitle">Agents of the Four Seasons</p>
        <p className="experiment" lang="ja"><span>{seasons[active].dance}</span></p>
        <div className="season-caption">
          <p className="season-detail" ref={detail} lang="ja">
            <span>{seasons[active].characters[0]}</span><span className="character-divider">×</span><span>{seasons[active].characters[1]}</span>
          </p>
          <nav className="season-navigation" aria-label="選擇季節">
            <span className="navigation-dot" aria-hidden="true">•</span>
            <div className="season-buttons">
              {seasons.map((season, index) => (
                <button key={season.name} type="button" aria-label={`${season.label} ${season.name}`}
                  aria-pressed={active === index} onClick={() => scene.current?.select(index)}>
                  {season.label}
                </button>
              ))}
            </div>
            <span className="navigation-dot" aria-hidden="true">•</span>
          </nav>
        </div>
        <span className="sr-only" aria-live="polite">{seasons[active].name} — {seasons[active].label}</span>
        {failed && <p className="render-notice" role="status">此瀏覽器無法啟動 WebGL，請使用支援 WebGL 的瀏覽器。</p>}
      </div>
      <footer className="footer"><span>SHIKI NO MAI</span><div><span lang="ja">{seasons[active].dance}</span><span>0{active + 1} / 04</span></div></footer>
    </main>
  )
}
