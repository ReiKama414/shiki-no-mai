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

const externalLinks = [
  {
    href: 'https://reikama414.vercel.app/',
    label: '個人網站',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.3 3.6 8.5s-1.2 5.9-3.6 8.5c-2.4-2.6-3.6-5.3-3.6-8.5s1.2-5.9 3.6-8.5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    href: 'https://github.com/ReiKama414/shiki-no-mai',
    label: 'GitHub',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.48v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.5c.85 0 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .26.18.59.69.48A10.03 10.03 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
      </svg>
    ),
  },
  {
    href: 'https://4seasons-anime.com/',
    label: '官方網站',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M12 3.2c1.8 2.4 3.2 4.1 4.2 5.1 1.6 1.6 2.9 2.2 2.9 4.4 0 2.7-2.2 4.9-5 5.3v2.2h-4.2v-2.2c-2.8-.4-5-2.6-5-5.3 0-2.2 1.3-2.8 2.9-4.4 1-1 2.4-2.7 4.2-5.1z" />
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M9.2 11.2c.8-.7 1.8-1.1 2.8-1.1s2 .4 2.8 1.1" />
      </svg>
    ),
  },
] as const

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
      <footer className="footer">
        <nav className="site-links" aria-label="外部連結">
          {externalLinks.map(link => (
            <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.label} title={link.label}>
              {link.icon}
            </a>
          ))}
        </nav>
        <div><span lang="ja">{seasons[active].dance}</span><span>0{active + 1} / 04</span></div>
      </footer>
    </main>
  )
}
